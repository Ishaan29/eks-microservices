from database import engine, products_table, create_db_and_tables
from sqlalchemy import select, func

# The product data that was previously in main.py
mockProducts = [
  {
    "id": "1001",
    "name": "Apple Airpods Pro",
    "price": 249.99,
    "description": "Earbuds with active noise cancellation",
    "imageUrl": "https://lh3.googleusercontent.com/d/19YZR4K0ZPvVW4-xoz5HUjre-BChgCmv8"
  },
  {
    "id": "1002",
    "name": "Asus ROG Laptop ",
    "price": 1299.00,
    "description": "Unlock a next-level gaming experience with the ROG Strix G16.",
    "imageUrl": "https://lh3.googleusercontent.com/d/1mKSz1BKglbEx2rPwwpmfxVLlcLmdwGO_"
  },
  {
    "id": "1003",
    "name": "Bose QuietComfort Headphones",
    "price": 199.99,
    "description": "Take charge of your music and stride along to the beat. ",
    "imageUrl": "https://lh3.googleusercontent.com/d/1QJt8qblhGPk_PAm084TwC_kWrFcZq6Vo" 
  },
  {
    "id": "1004",
    "name": "Canon EOS camera",
    "price": 579.99,
    "description": "Up your photography game with the EOS Rebel T7.",
    "imageUrl": "https://lh3.googleusercontent.com/d/1Vzo335bkCLsfpib-qhgRpbTZqi5N7dl_"
  },
  {
    "id": "1005",
    "name": "ATH-350TV Headphones Wired",
    "price": 30.63,
    "description": "Audio-Technica ATH-350TV Headphones Wired for TV with Volume Controller Black",
    "imageUrl": "https://lh3.googleusercontent.com/d/1Rt4z7-JV63AS7y82u12ID_GN5dPUeYvE"
  },
  {
    "id": "1006",
    "name": "JBL Soundbox",
    "price": 165.95,
    "description": "Keep the mood alive for 24 hours on a single charge",
    "imageUrl": "https://lh3.googleusercontent.com/d/1L4LL8Hlqg7tZETIvcJl8_J493w4MpsFf"
  },
  {
    "id": "1007",
    "name": "MACbook Air",
    "price": 999.00,
    "description": "MacBook Air is the world's most popular laptop for a reason.",
    "imageUrl": "https://lh3.googleusercontent.com/d/1dqWebaJQbnQ0XHRHbXYNunVhWFbMIYQ6"
  },
  {
    "id": "1008",
    "name": "SONY Playstation 5 Pro",
    "price": 749.00,
    "description": "PS5® Pro is an all-digital console with no disc drive. ",
    "imageUrl": "https://lh3.googleusercontent.com/d/1r7a9hp_pPOL-SpvSXDPFQ1M50nCGdYho"
  },
    {
    "id": "1009",
    "name": "ELEPHAS Mini Projector",
    "price": 66.49,
    "description": "Supports 1080P/4K resolution to provide clear visual effects.",
    "imageUrl": "https://lh3.googleusercontent.com/d/1s02udwOq22sxrN5D0_LNvIZa1VXWrlv7"
  },
    {
    "id": "1010",
    "name": "Samsung S23",
    "price": 499.99,
    "description": "Meet Galaxy S23, the phone takes you out of the everyday and into the epic.",
    "imageUrl": "https://lh3.googleusercontent.com/d/1nXCkZm-70QqAm1Z2Q-mJ01lpV5xW2dXv"
  },
  {
    "id": "1011",
    "name": "SM Controller",
    "price": 59.99,
    "description": "Gaming Controller with TMR sticks, Trigger Lock and Charging Dock",
    "imageUrl": "https://lh3.googleusercontent.com/d/1oaW2q89znZIylLDcFuwkMzzSEh7WgMpv"
  },
  {
    "id": "1012",
    "name": "Sony Earbuds",
    "price": 79.99,
    "description": "WF-C710N Truly Wireless Noise-Canceling Earbuds",
    "imageUrl": "https://lh3.googleusercontent.com/d/1IrdEnW4GKDE6X2YzFw3KDg27ONgMcXun"
  },
  {
    "id": "1013",
    "name": "Venu Smartwatch",
    "price": 349.99,
    "description": "Get in tune with your mind and body with Garmin Venu 3S smartwatch.",
    "imageUrl": "https://lh3.googleusercontent.com/d/18Cm4JBhITC86JLuDaWgbWth75L8l6nWN"
  },
]

def seed_database():
    print("Seeding database...")

    # FIX: Call create_db_and_tables() FIRST
    # This ensures the 'products' table exists before we try to count or insert.
    create_db_and_tables()

    with engine.connect() as conn:
        # Check if data already exists to avoid inserting duplicates
        count_query = select(func.count()).select_from(products_table)
        count = conn.execute(count_query).scalar()
        
        if count == 0:
            # If the table is empty, insert the mock products
            conn.execute(products_table.insert(), mockProducts)
            conn.commit() # Commit the transaction
            print("Database seeding complete.")
        else:
            print("Database already seeded. Skipping.")

if __name__ == "__main__":
    # This allows us to run `python seed_db.py` from the terminal
    seed_database()