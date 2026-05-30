.PHONY: install api web dev

install:
	cd backend && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
	cd frontend && npm install

api:
	cd backend && .venv/bin/uvicorn app.main:app --reload --port 8000

web:
	cd frontend && npm run dev

dev:
	@echo "Run 'make api' and 'make web' in separate terminals"

test:
	cd backend && PYTHONPATH=. .venv/bin/python -m pytest tests/ -q
	cd frontend && npm run test:run

test-backend:
	cd backend && PYTHONPATH=. .venv/bin/python -m pytest tests/ -q

test-frontend:
	cd frontend && npm run test:run
