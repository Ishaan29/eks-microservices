from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from database import engine, inventory_table, create_db_and_tables
from sqlalchemy import select, update

# --- Pydantic Models (Data Contracts) ---
# This is what the Orders Service will send us
# We only need the product ID and the quantity purchased
class ItemPurchased(BaseModel):
    id: str
    quantity: int

# --- FastAPI App ---
app = FastAPI()

# --- CORS Configuration ---
# Allow requests from the Orders Service (port 8001)
# and the Frontend (port 3000)
origins = [
    "http://localhost:3000",
    "http://localhost:8001",
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
    # This creates the 'inventory.db' file and table
    create_db_and_tables()

# --- API Endpoints ---

@app.get("/")
def read_root():
    return {"status": "Inventory API is running"}

# Endpoint for the frontend to check stock
@app.get("/api/inventory/{product_id}")
async def get_inventory_level(product_id: str):
    with engine.connect() as conn:
        query = select(inventory_table.c.stock_level).where(inventory_table.c.product_id == product_id)
        result = conn.execute(query).first()
        
        if result:
            return {"product_id": product_id, "stock_level": result[0]}
        else:
            raise HTTPException(status_code=404, detail=f"Inventory for product {product_id} not found")

# Endpoint for the Orders Service to reduce stock
@app.post("/api/inventory/reduce")
async def reduce_inventory(items: List[ItemPurchased]):
    print("\n--- [Inventory Service] ---")
    print(f"Received request to reduce stock for {len(items)} item types.")
    
    updated_items = []
    
    with engine.connect() as conn:
        trans = conn.begin() # Start a database transaction
        try:
            for item in items:
                # Get current stock
                stock_query = select(inventory_table.c.stock_level).where(inventory_table.c.product_id == item.id)
                current_stock = conn.execute(stock_query).scalar()

                if current_stock is None:
                    print(f"  ERROR: Product {item.id} not found in inventory.")
                    continue # Skip this item
                
                if current_stock < item.quantity:
                    # This is a problem! We sold something we don't have.
                    # In a real system, this would trigger a compensation (e.g., refund)
                    print(f"  ERROR: Stock for {item.id} is {current_stock}, but {item.quantity} were sold! Setting stock to 0.")
                    new_stock = 0
                else:
                    new_stock = current_stock - item.quantity
                
                # Update the database
                update_query = (
                    update(inventory_table)
                    .where(inventory_table.c.product_id == item.id)
                    .values(stock_level=new_stock)
                )
                conn.execute(update_query)
                
                print(f"  - Product {item.id}: Stock reduced from {current_stock} to {new_stock}")
                updated_items.append({"product_id": item.id, "new_stock_level": new_stock})
            
            trans.commit() # Commit all changes at once
            print("--- [End Inventory Update] ---")
            
        except Exception as e:
            trans.rollback() # Undo changes if anything failed
            print(f"  ERROR: Transaction failed, rolling back. {e}")
            raise HTTPException(status_code=500, detail="Inventory update failed")
            
    return {"status": "Inventory updated", "updated_items": updated_items}