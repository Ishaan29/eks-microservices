#!/bin/bash
set -e

# Create the three separate databases
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
	CREATE DATABASE retail_db;
	CREATE DATABASE orders_db;
	CREATE DATABASE inventory_db;
	GRANT ALL PRIVILEGES ON DATABASE retail_db TO admin;
	GRANT ALL PRIVILEGES ON DATABASE orders_db TO admin;
	GRANT ALL PRIVILEGES ON DATABASE inventory_db TO admin;
EOSQL