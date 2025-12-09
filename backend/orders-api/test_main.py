import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch, AsyncMock
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
import httpx
from main import app, CartItem, ShippingDetails, OrderPayload
from database import orders_table, order_items_table, metadata

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
def mock_httpx_client():
    """Mock the httpx client for external API calls"""
    mock_client = AsyncMock()
    mock_response = Mock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"status": "Inventory updated"}
    mock_client.post.return_value = mock_response
    return mock_client

@pytest.fixture
def client(test_engine, mock_httpx_client):
    """Create a test client with mocked database and HTTP client"""
    with patch('main.engine', test_engine):
        with patch('database.engine', test_engine):
            with patch('main.client', mock_httpx_client):
                yield TestClient(app)

@pytest.fixture
def sample_order_payload():
    """Sample order payload for testing"""
    return {
        "cart": [
            {
                "id": "product-1",
                "name": "Test Product 1",
                "price": 29.99,
                "quantity": 2,
                "imageUrl": "https://example.com/image1.jpg"
            },
            {
                "id": "product-2",
                "name": "Test Product 2",
                "price": 19.99,
                "quantity": 1,
                "imageUrl": "https://example.com/image2.jpg"
            }
        ],
        "shippingDetails": {
            "name": "John Doe",
            "address": "123 Main St",
            "city": "Test City",
            "zip": "12345"
        },
        "total": 79.97
    }


class TestOrdersAPI:
    """Test suite for Orders API"""
    
    def test_read_root(self, client):
        """Test the root endpoint"""
        response = client.get("/")
        assert response.status_code == 200
        assert "running" in response.json()["status"].lower()
    
    def test_create_order_success(self, client, sample_order_payload, mock_httpx_client):
        """Test creating a valid order"""
        response = client.post("/api/orders", json=sample_order_payload)
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "orderId" in data
        assert data["orderId"].startswith("ORD-")
        assert data["status"] == "received"
        assert data["total"] == 79.97
        
        # Verify inventory service was called
        mock_httpx_client.post.assert_called_once()
    
    def test_create_order_saves_to_database(self, client, sample_order_payload, test_engine):
        """Test that order is saved to database"""
        response = client.post("/api/orders", json=sample_order_payload)
        assert response.status_code == 200
        order_id = response.json()["orderId"]
        
        # Verify order was saved to orders table
        with test_engine.connect() as conn:
            query = orders_table.select().where(orders_table.c.id == order_id)
            result = conn.execute(query).first()
            assert result is not None
            assert result.status == "received"
            assert result.total == 79.97
            assert result.shipping_name == "John Doe"
            assert result.shipping_address == "123 Main St"
            
            # Verify order items were saved
            items_query = order_items_table.select().where(order_items_table.c.order_id == order_id)
            items = conn.execute(items_query).fetchall()
            assert len(items) == 2
    
    def test_create_order_inventory_service_down(self, client, sample_order_payload, mock_httpx_client):
        """Test order creation when inventory service is down"""
        # Mock a connection error
        mock_httpx_client.post.side_effect = httpx.RequestError("Connection failed")
        
        response = client.post("/api/orders", json=sample_order_payload)
        # Order should still be created (eventual consistency pattern)
        assert response.status_code == 200
        assert "orderId" in response.json()
    
    def test_create_order_inventory_service_error(self, client, sample_order_payload, mock_httpx_client):
        """Test order creation when inventory service returns an error"""
        # Mock an HTTP error response
        mock_response = Mock()
        mock_response.status_code = 500
        mock_response.text = "Internal Server Error"
        mock_httpx_client.post.return_value = mock_response
        mock_response.raise_for_status.side_effect = httpx.HTTPStatusError(
            "Server error", request=Mock(), response=mock_response
        )
        
        response = client.post("/api/orders", json=sample_order_payload)
        # Order should still be created (eventual consistency pattern)
        assert response.status_code == 200
        assert "orderId" in response.json()
    
    def test_create_order_empty_cart(self, client):
        """Test creating an order with an empty cart"""
        payload = {
            "cart": [],
            "shippingDetails": {
                "name": "John Doe",
                "address": "123 Main St",
                "city": "Test City",
                "zip": "12345"
            },
            "total": 0.0
        }
        response = client.post("/api/orders", json=payload)
        assert response.status_code == 200
    
    def test_create_order_missing_fields(self, client):
        """Test creating an order with missing required fields"""
        payload = {
            "cart": [{"id": "product-1", "name": "Test", "price": 10.0, "quantity": 1, "imageUrl": "test.jpg"}],
            # Missing shippingDetails and total
        }
        response = client.post("/api/orders", json=payload)
        assert response.status_code == 422  # Validation error
    
    def test_create_order_invalid_data_types(self, client):
        """Test creating an order with invalid data types"""
        payload = {
            "cart": [{"id": "product-1", "name": "Test", "price": "invalid", "quantity": 1, "imageUrl": "test.jpg"}],
            "shippingDetails": {
                "name": "John Doe",
                "address": "123 Main St",
                "city": "Test City",
                "zip": "12345"
            },
            "total": 10.0
        }
        response = client.post("/api/orders", json=payload)
        assert response.status_code == 422  # Validation error
    
    def test_get_all_orders_empty(self, client):
        """Test retrieving orders when none exist"""
        response = client.get("/api/orders")
        assert response.status_code == 200
        orders = response.json()
        assert isinstance(orders, list)
        # May or may not be empty depending on test execution order


class TestPydanticModels:
    """Test suite for Pydantic models"""
    
    def test_valid_cart_item(self):
        """Test creating a valid CartItem"""
        item = CartItem(
            id="product-1",
            name="Test Product",
            price=29.99,
            quantity=2,
            imageUrl="https://example.com/image.jpg"
        )
        assert item.id == "product-1"
        assert item.name == "Test Product"
        assert item.price == 29.99
        assert item.quantity == 2
    
    def test_valid_shipping_details(self):
        """Test creating valid ShippingDetails"""
        shipping = ShippingDetails(
            name="John Doe",
            address="123 Main St",
            city="Test City",
            zip="12345"
        )
        assert shipping.name == "John Doe"
        assert shipping.address == "123 Main St"
    
    def test_valid_order_payload(self):
        """Test creating a valid OrderPayload"""
        payload = OrderPayload(
            cart=[
                CartItem(id="p1", name="Product", price=10.0, quantity=1, imageUrl="img.jpg")
            ],
            shippingDetails=ShippingDetails(
                name="John", address="123 St", city="City", zip="12345"
            ),
            total=10.0
        )
        assert len(payload.cart) == 1
        assert payload.total == 10.0
    
    def test_cart_item_missing_fields(self):
        """Test CartItem validation with missing fields"""
        with pytest.raises(Exception):  # Pydantic validation error
            CartItem(id="product-1", name="Test")
    
    def test_shipping_details_missing_fields(self):
        """Test ShippingDetails validation with missing fields"""
        with pytest.raises(Exception):  # Pydantic validation error
            ShippingDetails(name="John", address="123 St")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

