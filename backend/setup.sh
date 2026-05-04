#!/bin/bash

# Gain English Backend Setup Script

echo "🚀 Setting up Gain English Backend..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📚 Installing dependencies..."
pip install -r requirements.txt

# Copy environment file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file from template..."
    cp .env.example .env
    echo "📝 Please edit .env file with your actual Supabase credentials:"
    echo "   - SUPABASE_URL"
    echo "   - SUPABASE_SECRET_KEY"
    echo "   - SECRET_KEY (generate a strong random key)"
fi

echo "✅ Backend setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your credentials"
echo "2. Run: python run.py"
echo "3. Visit: http://localhost:8000/docs"
