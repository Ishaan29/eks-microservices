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