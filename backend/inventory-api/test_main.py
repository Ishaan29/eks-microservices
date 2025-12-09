import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch, MagicMock
from sqlalchemy import create_engine, MetaData
from sqlalchemy.pool import StaticPool
from main import app, ItemPurchased
from database import inventory_table, metadata

# Create an in-memory SQLite database for testing
TEST_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture
def test_engine():
    """Create a test database engine"""
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    metadata.create_all(engine)
    return engine

@pytest.fixture
def client(test_engine):
    """Create a test client with mocked database"""
    with patch('main.engine', test_engine):
        with patch('database.engine', test_engine):
            # Seed some test data
            with test_engine.connect() as conn:
                trans = conn.begin()
                conn.execute(inventory_table.insert(), [
                    {"product_id": "test-product-1", "stock_level": 100},
                    {"product_id": "test-product-2", "stock_level": 50},
                    {"product_id": "test-product-3", "stock_level": 0},
                ])
                trans.commit()
            
            # Mock the seed_database function to prevent it from running
            with patch('main.seed_database'):
                yield TestClient(app)

class TestInventoryAPI:
    """Test suite for Inventory API"""
    
    def test_read_root(self, client):
        """Test the root endpoint"""
        response = client.get("/")
        assert response.status_code == 200
        assert response.json() == {"status": "Inventory API is running"}
    
    def test_get_inventory_level_success(self, client):
        """Test getting inventory level for an existing product"""
        response = client.get("/api/inventory/test-product-1")
        assert response.status_code == 200
        data = response.json()
        assert data["product_id"] == "test-product-1"
        assert data["stock_level"] == 100
    
    def test_get_inventory_level_not_found(self, client):
        """Test getting inventory level for a non-existent product"""
        response = client.get("/api/inventory/non-existent-product")
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    
    def test_reduce_inventory_success(self, client):
        """Test reducing inventory for products with sufficient stock"""
        items = [
            {"id": "test-product-1", "quantity": 10},
            {"id": "test-product-2", "quantity": 5},
        ]
        response = client.post("/api/inventory/reduce", json=items)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "Inventory updated"
        assert len(data["updated_items"]) == 2
        
        # Verify stock levels were updated
        updated_items = {item["product_id"]: item["new_stock_level"] for item in data["updated_items"]}
        assert updated_items["test-product-1"] == 90  # 100 - 10
        assert updated_items["test-product-2"] == 45  # 50 - 5
    
    def test_reduce_inventory_insufficient_stock(self, client):
        """Test reducing inventory when stock is insufficient"""
        items = [
            {"id": "test-product-2", "quantity": 100},  # Only 50 available
        ]
        response = client.post("/api/inventory/reduce", json=items)
        assert response.status_code == 200
        data = response.json()
        
        # Should set stock to 0 when insufficient
        updated_items = {item["product_id"]: item["new_stock_level"] for item in data["updated_items"]}
        assert updated_items["test-product-2"] == 0
    
    def test_reduce_inventory_zero_stock(self, client):
        """Test reducing inventory for a product with zero stock"""
        items = [
            {"id": "test-product-3", "quantity": 5},
        ]
        response = client.post("/api/inventory/reduce", json=items)
        assert response.status_code == 200
        data = response.json()
        
        # Should remain at 0
        updated_items = {item["product_id"]: item["new_stock_level"] for item in data["updated_items"]}
        assert updated_items["test-product-3"] == 0
    
    def test_reduce_inventory_non_existent_product(self, client):
        """Test reducing inventory for a product that doesn't exist"""
        items = [
            {"id": "test-product-1", "quantity": 5},
            {"id": "non-existent-product", "quantity": 10},
        ]
        response = client.post("/api/inventory/reduce", json=items)
        assert response.status_code == 200
        data = response.json()
        
        # Should only update existing product
        assert len(data["updated_items"]) == 1
        assert data["updated_items"][0]["product_id"] == "test-product-1"
    
    def test_reduce_inventory_multiple_items(self, client):
        """Test reducing inventory for multiple items in a single transaction"""
        items = [
            {"id": "test-product-1", "quantity": 20},
            {"id": "test-product-2", "quantity": 10},
        ]
        response = client.post("/api/inventory/reduce", json=items)
        assert response.status_code == 200
        data = response.json()
        assert len(data["updated_items"]) == 2
        
        # Verify both items were updated
        updated_items = {item["product_id"]: item["new_stock_level"] for item in data["updated_items"]}
        assert updated_items["test-product-1"] == 80  # 100 - 20
        assert updated_items["test-product-2"] == 40  # 50 - 10
    
    def test_reduce_inventory_empty_list(self, client):
        """Test reducing inventory with an empty list"""
        response = client.post("/api/inventory/reduce", json=[])
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "Inventory updated"
        assert len(data["updated_items"]) == 0
    
    def test_reduce_inventory_invalid_data(self, client):
        """Test reducing inventory with invalid data"""
        # Missing required fields
        items = [
            {"id": "test-product-1"},  # Missing quantity
        ]
        response = client.post("/api/inventory/reduce", json=items)
        assert response.status_code == 422  # Validation error


class TestItemPurchasedModel:
    """Test suite for ItemPurchased Pydantic model"""
    
    def test_valid_item_purchased(self):
        """Test creating a valid ItemPurchased object"""
        item = ItemPurchased(id="product-1", quantity=5)
        assert item.id == "product-1"
        assert item.quantity == 5
    
    def test_item_purchased_missing_fields(self):
        """Test ItemPurchased validation with missing fields"""
        with pytest.raises(Exception):  # Pydantic validation error
            ItemPurchased(id="product-1")
    
    def test_item_purchased_invalid_types(self):
        """Test ItemPurchased validation with invalid types"""
        with pytest.raises(Exception):  # Pydantic validation error
            ItemPurchased(id="product-1", quantity="invalid")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

