from database import engine, inventory_table, create_db_and_tables
from sqlalchemy import select, func

# List of all our product IDs and their starting stock
initial_stock = [
    {"product_id": "1001", "stock_level": 100},
    {"product_id": "1002", "stock_level": 100},
    {"product_id": "1003", "stock_level": 100},
    {"product_id": "1004", "stock_level": 100},
    {"product_id": "1005", "stock_level": 100},
    {"product_id": "1006", "stock_level": 100},
    {"product_id": "1007", "stock_level": 100},
    {"product_id": "1008", "stock_level": 100},
    {"product_id": "1009", "stock_level": 100},
    {"product_id": "1010", "stock_level": 100},
    {"product_id": "1011", "stock_level": 100},
    {"product_id": "1012", "stock_level": 100},
    {"product_id": "1013", "stock_level": 100},
]

def seed_database():
    print("Seeding inventory database...")
    
    # Create the table if it doesn't exist
    create_db_and_tables()

    with engine.connect() as conn:
        # Check if data already exists
        count_query = select(func.count()).select_from(inventory_table)
        count = conn.execute(count_query).scalar()
        
        if count == 0:
            # If the table is empty, insert the initial stock levels
            conn.execute(inventory_table.insert(), initial_stock)
            conn.commit() # Commit the transaction
            print("Inventory database seeding complete.")
        else:
            print("Inventory database already seeded. Skipping.")

if __name__ == "__main__":
    seed_database()