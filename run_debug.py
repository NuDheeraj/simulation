#!/usr/bin/env python3
"""
Debug runner for AI Agents Simulation
Enables full debug logging and runs the Flask server
"""
import os
import sys
import logging

# Set debug environment
os.environ['FLASK_DEBUG'] = 'True'
os.environ['LOG_LEVEL'] = 'DEBUG'

# Set up debug logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s'
)

# Import and run the app
from app import app

if __name__ == '__main__':
    print("🚀 Starting AI Agents Simulation with DEBUG logging...")
    print("📊 All logs will be shown in console and saved to logs/")
    print("🌐 Open browser to: http://localhost:5001")
    print("=" * 60)
    
    try:
        app.run(debug=True, host='0.0.0.0', port=5001)
    except KeyboardInterrupt:
        print("\n👋 Shutting down simulation...")
    except Exception as e:
        print(f"❌ Error starting simulation: {e}")
        sys.exit(1)
