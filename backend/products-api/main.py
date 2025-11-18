# from fastapi import FastAPI, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# from typing import List, Dict, Any

# # Create the FastAPI app instance
# app = FastAPI()

# # --- CORS Configuration ---
# # This is CRITICAL for allowing our Next.js frontend (on localhost:3000)
# # to request data from this API (on localhost:8000).
# origins = [
#     "http://localhost:3000", # The Next.js app
# ]

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=origins,
#     allow_credentials=True,
#     allow_methods=["*"], # Allow all methods (GET, POST, etc.)
#     allow_headers=["*"], # Allow all headers
# )

# # --- MOCK DATA ---
# # This data now lives in the API, not the frontend.
# mockProducts: List[Dict[str, Any]] = [
#   {
#     "id": "1001",
#     "name": "Quantum Headset",
#     "price": 349.99,
#     "description": "Experience sound in a new dimension with 3D audio.",
#     "imageUrl": "https://placehold.co/400x400/1e293b/ffffff?text=HEADSET"
#   },
#   {
#     "id": "1002",
#     "name": "Astro Drone",
#     "price": 1299.00,
#     "description": "Capture stunning 8K video from the skies.",
#     "imageUrl": "https://placehold.co/400x400/4f46e5/ffffff?text=DRONE"
#   },
#   {
#     "id": "1003",
#     "name": "Cybernetic Keyboard",
#     "price": 189.50,
#     "description": "Mechanical keys with RGB backlighting for pros.",
#     "imageUrl": "https://placehold.co/400x400/059669/ffffff?text=KEYBOARD"
#   },
#   {
#     "id": "1004",
#     "name": "Smart Watch Elite",
#     "price": 249.00,
#     "description": "Monitor health and notifications with style.",
#     "imageUrl": "https://placehold.co/400x400/ea580c/ffffff?text=WATCH"
#   },
#   {
#     "id": "1005",
#     "name": "Nebula Projector",
#     "price": 499.99,
#     "description": "Bring the cinema experience to your living room.",
#     "imageUrl": "https://placehold.co/400x400/be185d/ffffff?text=PROJECTOR"
#   },
#   {
#     "id": "1006",
#     "name": "Velocity Mouse",
#     "price": 75.99,
#     "description": "Ultra-low latency for competitive gaming.",
#     "imageUrl": "https://placehold.co/400x400/10b981/ffffff?text=MOUSE"
#   },
# ]
# # --- END MOCK DATA ---


# # --- API Endpoints ---

# @app.get("/")
# def read_root():
#     return {"status": "Products API is running"}

# # Endpoint to get all products
# @app.get("/api/products")
# async def get_all_products():
#     return mockProducts

# # Endpoint to get a single product by its ID
# @app.get("/api/products/{product_id}")
# async def get_product(product_id: str):
#     product = next((p for p in mockProducts if p["id"] == product_id), None)
#     if product:
#         return product
#     else:
#         # If no product is found, raise a 404 error
#         raise HTTPException(status_code=404, detail=f"Product with ID {product_id} not found")




from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from database import engine, products_table, create_db_and_tables # Import from our new file

# --- FastAPI App ---
app = FastAPI()

# --- CORS Configuration ---
origins = [
    "http://localhost:3000", # The Next.js app
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Allow all methods (GET, POST, etc.)
    allow_headers=["*"], # Allow all headers
)

# --- Database Connection ---
# This event runs when the FastAPI app starts up
@app.on_event("startup")
def on_startup():
    # This creates the 'retail.db' file and the 'products' table
    # if they don't already exist.
    create_db_and_tables()

# --- API Endpoints (Now using the database) ---

@app.get("/")
def read_root():
    return {"status": "Products API is running and connected to database"}

# Endpoint to get all products
@app.get("/api/products")
async def get_all_products():
    # Connect to the database
    with engine.connect() as conn:
        # Build a query to select all rows from the products table
        query = products_table.select()
        # Execute the query and fetch all results
        result = conn.execute(query).fetchall()
        
        # Convert the list of (row) objects to a list of (dict) objects
        # The frontend (Next.js) expects a JSON array of objects
        products = [dict(row._asdict()) for row in result]
        return products

# Endpoint to get a single product by its ID
@app.get("/api/products/{product_id}")
async def get_product(product_id: str):
    with engine.connect() as conn:
        # Build a query to select the product where id matches product_id
        query = products_table.select().where(products_table.c.id == product_id)
        # Execute the query and fetch the first (and only) result
        result = conn.execute(query).first()
        
        if result:
            # Convert the single row to a dictionary
            return dict(result._asdict())
        else:
            # If no product is found, raise a 404 error
            raise HTTPException(status_code=404, detail=f"Product with ID {product_id} not found")