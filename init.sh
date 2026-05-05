#!/bin/bash
set -e
cd "$(dirname "$0")"

echo "=== Tiger English — Dev Environment Setup ==="

echo "=== Installing frontend dependencies ==="
npm install

echo "=== Setting up backend ==="
cd backend
if [ ! -d "venv" ]; then
  echo "Creating Python virtual environment..."
  python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt -q
echo "Backend dependencies installed."

echo "=== Starting backend server (port 8000) ==="
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

cd ..

echo "=== Starting frontend dev server (port 5173) ==="
npm run dev &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

echo ""
echo "========================================"
echo "Frontend: http://localhost:5173"
echo "Backend:  http://localhost:8000"
echo "API Docs: http://localhost:8000/docs"
echo "========================================"

wait
