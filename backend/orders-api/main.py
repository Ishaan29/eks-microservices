from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
import time
import httpx # NEW: Import httpx to make API calls

# NEW: Import database components
from database import engine, orders_table, order_items_table, create_db_and_tables

# --- Pydantic Models (Data Contracts) ---
class CartItem(BaseModel):
    id: str
    name: str
    price: float
    quantity: int
    imageUrl: str

class ShippingDetails(BaseModel):
    name: str
    address: str
    city: str
    zip: str

class OrderPayload(BaseModel):
    cart: List[CartItem]
    shippingDetails: ShippingDetails
    total: float

# --- FastAPI App ---
app = FastAPI()

# Read from environment variable, fallback to localhost for local development
import os
INVENTORY_API_URL = os.getenv("INVENTORY_API_URL", "http://localhost:8002/api/inventory/reduce")

# --- CORS Configuration ---
origins = [
    "http://localhost:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Database Connection ---
@app.on_event("startup")
def on_startup():
    # This creates the 'orders.db' file and tables
    create_db_and_tables()

# --- Asynchronous HTTP Client ---
# We use a single httpx client for the app's lifespan
client = httpx.AsyncClient()

@app.on_event("shutdown")
async def on_shutdown():
    # Cleanly close the client when the app stops
    await client.aclose()


# --- API Endpoints ---
@app.get("/")
def read_root():
    return {"status": "Orders API is running and connected to database"}

@app.post("/api/orders")
async def create_order(payload: OrderPayload):
    
    order_id = f"ORD-{int(time.time())}"
    
    print("\n--- [Orders Service] ---")
    print("Received new order:")
    print(f"  User: {payload.shippingDetails.name}")
    print(f"  Items: {len(payload.cart)}")
    print(f"  Total: ${payload.total:.2f}")

    # --- 1. Save to Database (NEW) ---
    with engine.connect() as conn:
        trans = conn.begin() # Start a transaction
        try:
            # Insert into the main 'orders' table
            order_insert = orders_table.insert().values(
                id=order_id,
                status="received",
                total=payload.total,
                shipping_name=payload.shippingDetails.name,
                shipping_address=payload.shippingDetails.address,
                shipping_city=payload.shippingDetails.city,
                shipping_zip=payload.shippingDetails.zip
            )
            conn.execute(order_insert)
            
            # Prepare items for 'order_items' table
            items_to_insert = []
            for item in payload.cart:
                items_to_insert.append({
                    "order_id": order_id,
                    "product_id": item.id,
                    "product_name": item.name,
                    "quantity": item.quantity,
                    "price": item.price
                })
            
            # Insert all items into the 'order_items' table
            if items_to_insert:
                conn.execute(order_items_table.insert(), items_to_insert)
            
            trans.commit() # Commit all changes
            print(f"  Order {order_id} saved to database.")

        except Exception as e:
            trans.rollback() # Undo changes if anything failed
            print(f"  ERROR: Database transaction failed, rolling back. {e}")
            raise HTTPException(status_code=500, detail="Order processing failed (database error)")
            
    # --- 2. Call Inventory Service (NEW) ---
    # (This happens *after* the order is successfully saved)
    try:
        # Prepare the payload for the inventory service (it only needs id and quantity)
        inventory_payload = [{"id": item.id, "quantity": item.quantity} for item in payload.cart]
        
        print(f"  Calling Inventory Service at {INVENTORY_API_URL}...")
        
        # Make the async POST request
        response = await client.post(INVENTORY_API_URL, json=inventory_payload)
        
        # Check if the inventory service call was successful
        response.raise_for_status() # Raises an exception for 4xx or 5xx status codes
        
        print(f"  Inventory service responded: {response.json()}")

    except httpx.RequestError as e:
        # This catches connection errors (e.g., inventory-api is down)
        print(f"  ERROR: Could not connect to Inventory Service. {e}")
        # In a real system, we'd add this to a retry queue (e.g., SQS Dead Letter Queue)
        # For now, we'll just log the error but still confirm the order to the user
        
    except httpx.HTTPStatusError as e:
        # This catches 4xx/5xx errors from the inventory service
        print(f"  ERROR: Inventory Service returned an error: {e.response.status_code} - {e.response.text}")

    print("--- [End Order] ---")
    
    # Return a success response to the frontend
    return {"orderId": order_id, "status": "received", "total": payload.total}


@app.get("/api/orders")
async def get_all_orders():
    """
    A simple endpoint to check all orders that have been
    placed (for debugging).
    """
    with engine.connect() as conn:
        # Query the 'orders' table
        query = orders_table.select()
        result = conn.execute(query).fetchall()
        orders = [dict(row._asdict()) for row in result]
        return orders