#!/bin/bash

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track overall status
OVERALL_STATUS=0
BACKEND_STATUS=0
FRONTEND_STATUS=0

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}        Running All Tests for EKS Microservices${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Function to print section headers
print_header() {
    echo ""
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}================================================${NC}"
}

# Function to print success message
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error message
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Function to print warning message
print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Backend Tests
print_header "Backend API Tests"

# Array of backend services
BACKEND_SERVICES=("inventory-api" "orders-api" "products-api")

for SERVICE in "${BACKEND_SERVICES[@]}"; do
    echo ""
    echo -e "${YELLOW}Testing ${SERVICE}...${NC}"
    
    SERVICE_DIR="backend/${SERVICE}"
    
    if [ ! -d "$SERVICE_DIR" ]; then
        print_warning "${SERVICE} directory not found at ${SERVICE_DIR}"
        continue
    fi
    
    # Check if requirements.txt exists
    if [ ! -f "${SERVICE_DIR}/requirements.txt" ]; then
        print_warning "requirements.txt not found for ${SERVICE}"
        continue
    fi
    
    # Check if test file exists
    if [ ! -f "${SERVICE_DIR}/test_main.py" ]; then
        print_warning "test_main.py not found for ${SERVICE}"
        continue
    fi
    
    # Install dependencies if needed
    echo "Installing dependencies for ${SERVICE}..."
    cd "$SERVICE_DIR" || exit 1
    
    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Install dependencies
    pip install -q --upgrade pip
    pip install -q -r requirements.txt
    pip install -q pytest pytest-asyncio pytest-cov httpx
    
    # Run tests
    echo "Running tests for ${SERVICE}..."
    if pytest test_main.py -v --tb=short --cov=main --cov-report=term-missing; then
        print_success "${SERVICE} tests passed"
    else
        print_error "${SERVICE} tests failed"
        BACKEND_STATUS=1
        OVERALL_STATUS=1
    fi
    
    # Deactivate virtual environment
    deactivate
    
    # Return to root directory
    cd - > /dev/null || exit 1
done

# Frontend Tests
print_header "Frontend Tests"

FRONTEND_DIR="frontend"

if [ -d "$FRONTEND_DIR" ]; then
    cd "$FRONTEND_DIR" || exit 1
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        print_warning "package.json not found in frontend directory"
    else
        # Check if node_modules exists, if not install dependencies
        if [ ! -d "node_modules" ]; then
            echo "Installing frontend dependencies..."
            npm install
        fi
        
        # Check if jest.config.js exists
        if [ ! -f "jest.config.js" ]; then
            print_warning "jest.config.js not found, skipping frontend tests"
        else
            # Run tests
            echo "Running frontend tests..."
            if npm test -- --coverage --watchAll=false; then
                print_success "Frontend tests passed"
            else
                print_error "Frontend tests failed"
                FRONTEND_STATUS=1
                OVERALL_STATUS=1
            fi
        fi
    fi
    
    # Return to root directory
    cd - > /dev/null || exit 1
else
    print_warning "Frontend directory not found"
fi

# Print Summary
print_header "Test Summary"
echo ""

if [ $BACKEND_STATUS -eq 0 ]; then
    print_success "All backend tests passed"
else
    print_error "Some backend tests failed"
fi

if [ $FRONTEND_STATUS -eq 0 ]; then
    print_success "All frontend tests passed"
else
    print_error "Some frontend tests failed"
fi

echo ""
echo -e "${BLUE}================================================${NC}"

if [ $OVERALL_STATUS -eq 0 ]; then
    print_success "All tests completed successfully!"
    echo -e "${BLUE}================================================${NC}"
    exit 0
else
    print_error "Some tests failed. Please review the output above."
    echo -e "${BLUE}================================================${NC}"
    exit 1
fi

