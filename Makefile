.PHONY: up down seed test verify clean

DATABASE_URL ?= postgresql://heraueba:heraueba_secret_2026@localhost:5433/heraueba

up:
	docker compose up -d --build

down:
	docker compose down

seed:
	docker exec -i heraueba-postgres psql -U heraueba -d heraueba < database/schema.sql
	docker exec -i heraueba-postgres psql -U heraueba -d heraueba < database/seed.sql

test:
	docker exec heraueba-backend pytest backend/tests -v

verify:
	HERA_URL=$${HERA_URL:-http://localhost:8080/} node Stitch-prototype/verificar.js

clean:
	docker compose down -v
