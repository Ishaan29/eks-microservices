from sqlalchemy import create_engine, Column, Integer, String, MetaData, Table, update
from sqlalchemy.engine import URL

# Define the database file
DATABASE_URL = "sqlite:///./inventory.db"

# SQLAlchemy setup
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
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