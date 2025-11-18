from sqlalchemy import create_engine, Column, Integer, String, Float, MetaData, Table
from sqlalchemy.engine import URL

# Define the database file
DATABASE_URL = "sqlite:///./retail.db"

# SQLAlchemy setup
# The connect_args is necessary for SQLite to allow it to be used in a multi-threaded app like FastAPI
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
metadata = MetaData()

# Define the 'products' table structure
products_table = Table(
    "products",
    metadata,
    Column("id", String, primary_key=True, index=True),
    Column("name", String, index=True),
    Column("price", Float),
    Column("description", String),
    Column("imageUrl", String),
)

# Function to create the table
def create_db_and_tables():
    # This command tells SQLAlchemy to create the table if it doesn't exist
    metadata.create_all(engine)