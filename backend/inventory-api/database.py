import os
from sqlalchemy import create_engine, Column, Integer, String, Float, MetaData, Table

# 1. Get DB credentials from Environment Variables (injected by K8s)
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "password")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "ecommerce_app")

# 2. Construct the PostgreSQL Connection URL
# Format: postgresql://user:password@host:port/dbname
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
# SQLAlchemy setup
engine = create_engine(DATABASE_URL)
metadata = MetaData()

# Define the 'inventory' table structure
inventory_table = Table(
    "inventory",
    metadata,
    Column("product_id", String, primary_key=True, index=True),
    Column("stock_level", Integer, default=0),
)

# Function to create the table
def create_db_and_tables():
    metadata.create_all(engine)