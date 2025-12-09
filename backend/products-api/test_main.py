import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from main import app
from database import products_table, metadata

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
                conn.execute(products_table.insert(), [
                    {
                        "id": "product-1",
                        "name": "Test Product 1",
                        "price": 29.99,
                        "description": "This is a test product 1",
                        "imageUrl": "https://example.com/image1.jpg"
                    },
                    {
                        "id": "product-2",
                        "name": "Test Product 2",
                        "price": 49.99,
                        "description": "This is a test product 2",
                        "imageUrl": "https://example.com/image2.jpg"
                    },
                    {
                        "id": "product-3",
                        "name": "Test Product 3",
                        "price": 19.99,
                        "description": "This is a test product 3",
                        "imageUrl": "https://example.com/image3.jpg"
                    }
                ])
                trans.commit()
            
            # Mock the seed_database function to prevent it from running
            with patch('main.seed_database'):
                yield TestClient(app)


class TestProductsAPI:
    """Test suite for Products API"""
    
    def test_read_root(self, client):
        """Test the root endpoint"""
        response = client.get("/")
        assert response.status_code == 200
        assert "running" in response.json()["status"].lower()
        assert "database" in response.json()["status"].lower()
    
    def test_get_all_products(self, client):
        """Test retrieving all products"""
        response = client.get("/api/products")
        assert response.status_code == 200
        products = response.json()
        
        # Verify response structure
        assert isinstance(products, list)
        assert len(products) == 3
        
        # Verify product structure
        for product in products:
            assert "id" in product
            assert "name" in product
            assert "price" in product
            assert "description" in product
            assert "imageUrl" in product
    
    def test_get_all_products_content(self, client):
        """Test that all products have correct data"""
        response = client.get("/api/products")
        products = response.json()
        
        # Find specific product
        product_1 = next((p for p in products if p["id"] == "product-1"), None)
        assert product_1 is not None
        assert product_1["name"] == "Test Product 1"
        assert product_1["price"] == 29.99
        assert product_1["description"] == "This is a test product 1"
    
    def test_get_product_by_id_success(self, client):
        """Test retrieving a specific product by ID"""
        response = client.get("/api/products/product-1")
        assert response.status_code == 200
        product = response.json()
        
        # Verify product details
        assert product["id"] == "product-1"
        assert product["name"] == "Test Product 1"
        assert product["price"] == 29.99
        assert product["description"] == "This is a test product 1"
        assert product["imageUrl"] == "https://example.com/image1.jpg"
    
    def test_get_product_by_id_not_found(self, client):
        """Test retrieving a non-existent product"""
        response = client.get("/api/products/non-existent-product")
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    
    def test_get_multiple_products_by_id(self, client):
        """Test retrieving multiple different products"""
        # Test product-2
        response2 = client.get("/api/products/product-2")
        assert response2.status_code == 200
        product2 = response2.json()
        assert product2["id"] == "product-2"
        assert product2["price"] == 49.99
        
        # Test product-3
        response3 = client.get("/api/products/product-3")
        assert response3.status_code == 200
        product3 = response3.json()
        assert product3["id"] == "product-3"
        assert product3["price"] == 19.99
    
    def test_products_are_unique(self, client):
        """Test that all products have unique IDs"""
        response = client.get("/api/products")
        products = response.json()
        
        product_ids = [p["id"] for p in products]
        assert len(product_ids) == len(set(product_ids))  # All IDs are unique
    
    def test_product_prices_are_valid(self, client):
        """Test that all product prices are valid numbers"""
        response = client.get("/api/products")
        products = response.json()
        
        for product in products:
            assert isinstance(product["price"], (int, float))
            assert product["price"] >= 0
    
    def test_product_names_are_not_empty(self, client):
        """Test that all products have non-empty names"""
        response = client.get("/api/products")
        products = response.json()
        
        for product in products:
            assert isinstance(product["name"], str)
            assert len(product["name"]) > 0
    
    def test_product_images_are_valid_urls(self, client):
        """Test that all product image URLs are valid"""
        response = client.get("/api/products")
        products = response.json()
        
        for product in products:
            assert isinstance(product["imageUrl"], str)
            # Check if it's a valid URL format (basic check)
            assert product["imageUrl"].startswith("http://") or product["imageUrl"].startswith("https://")


class TestProductsAPIEdgeCases:
    """Test suite for edge cases and error handling"""
    
    def test_get_product_with_empty_id(self, client):
        """Test getting a product with an empty ID"""
        response = client.get("/api/products/")
        # This should hit the /api/products endpoint (list all)
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_get_product_with_special_characters(self, client):
        """Test getting a product with special characters in ID"""
        response = client.get("/api/products/product-@#$%")
        assert response.status_code == 404
    
    def test_api_consistency(self, client):
        """Test that multiple calls return consistent data"""
        response1 = client.get("/api/products/product-1")
        response2 = client.get("/api/products/product-1")
        
        assert response1.json() == response2.json()


class TestProductsDatabase:
    """Test suite for database interactions"""
    
    def test_empty_database(self, test_engine):
        """Test API behavior with an empty database"""
        with patch('main.engine', test_engine):
            with patch('database.engine', test_engine):
                with patch('main.seed_database'):
                    client = TestClient(app)
                    response = client.get("/api/products")
                    assert response.status_code == 200
                    assert response.json() == []
    
    def test_database_connection(self, test_engine):
        """Test that database connection works correctly"""
        with test_engine.connect() as conn:
            result = conn.execute(products_table.select()).fetchall()
            assert isinstance(result, list)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

