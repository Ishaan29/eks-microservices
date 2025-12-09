#!/bin/bash

# Configuration file for microservices
# Add your microservices to this array
# Format: "service-name" (without "api" suffix if applicable)

MICROSERVICES=(
  "products-api"
  # Add more microservices here as needed:
  # "orders-api"
  # "users-api"
  # "payments-api"
)

# Export for use in GitHub Actions
export MICROSERVICES

