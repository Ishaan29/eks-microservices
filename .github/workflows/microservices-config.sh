#!/bin/bash

# Configuration file for microservices
# Add your microservices to this array
# Format: "service-name" (without "api" suffix if applicable)

MICROSERVICES=(
  "products-api"
  "orders-api"
  "inventory-api"
  # Add more microservices here as needed:
  # "users-api"
  # "payments-api"
)

# Export for use in GitHub Actions
export MICROSERVICES

