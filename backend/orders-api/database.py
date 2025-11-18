from sqlalchemy import create_engine, Column, Integer, String, Float, MetaData, Table, ForeignKey
from sqlalchemy.engine import URL

# Define the database file
DATABASE_URL = "sqlite:///./orders.db"

# SQLAlchemy setup
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
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