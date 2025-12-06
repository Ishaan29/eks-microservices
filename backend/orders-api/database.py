import os
from sqlalchemy import ForeignKey, create_engine, Column, Integer, String, Float, MetaData, Table

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

# Define the 'orders' table
orders_table = Table(
    "orders",
    metadata,
    Column("id", String, primary_key=True, index=True),
    Column("status", String, default="received"),
    Column("total", Float),
    # Shipping details
    Column("shipping_name", String),
    Column("shipping_address", String),
    Column("shipping_city", String),
    Column("shipping_zip", String),
)

# Define the 'order_items' table
# This links products to an order
order_items_table = Table(
    "order_items",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("order_id", String, ForeignKey("orders.id")),
    Column("product_id", String),
    Column("product_name", String),
    Column("quantity", Integer),
    Column("price", Float), # Price at the time of purchase
)


# Function to create the tables
def create_db_and_tables():
    metadata.create_all(engine)