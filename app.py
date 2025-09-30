from flask import Flask
from flask_cors import CORS
from config import config
from routes.main_routes import main_bp
from routes.agent_routes import agent_bp, init_services
import os
import signal
import sys
import atexit
from utils.logger import setup_logger

logger = setup_logger()

def create_app(config_name='default'):
    """Application factory pattern"""
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(config[config_name])
    
    # Enable CORS
    CORS(app)
    
    # Initialize services
    init_services(app.config['AGENTS'], app)
    
    # Register blueprints
    app.register_blueprint(main_bp)
    app.register_blueprint(agent_bp)
    
    return app

# Global variable to store services for cleanup
_services = None

def cleanup_services():
    """Clean up services and threads on shutdown"""
    global _services
    if _services:
        try:
            logger.info("Shutting down services...")
            # Deactivate brain coordination service
            if hasattr(_services, 'brain_coordination_service'):
                _services.brain_coordination_service.deactivate_brains()
                logger.info("Brain coordination service deactivated")
        except Exception as e:
            logger.error(f"Error during cleanup: {str(e)}")

def signal_handler(signum, frame):
    """Handle shutdown signals gracefully"""
    logger.info(f"Received signal {signum}, shutting down gracefully...")
    cleanup_services()
    sys.exit(0)

# Register signal handlers
signal.signal(signal.SIGINT, signal_handler)   # Ctrl+C
signal.signal(signal.SIGTERM, signal_handler)  # Termination signal

# Register cleanup function to run on exit
atexit.register(cleanup_services)

# Create app instance
app = create_app(os.environ.get('FLASK_ENV', 'default'))

# Store services reference for cleanup
_services = app.config.get('AGENT_SERVICE')

if __name__ == '__main__':
    try:
        logger.info("Starting Flask application...")
        app.run(debug=True, host='0.0.0.0', port=5001)
    except KeyboardInterrupt:
        logger.info("Received KeyboardInterrupt, shutting down...")
        cleanup_services()
    except Exception as e:
        logger.error(f"Application error: {str(e)}")
        cleanup_services()
        raise
