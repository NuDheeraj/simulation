from flask import Flask
from flask_cors import CORS
from config import config
from routes.main_routes import main_bp
from routes.agent_routes import agent_bp, init_services
import os

def create_app(config_name='default'):
    """Application factory pattern"""
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(config[config_name])
    
    # Enable CORS
    CORS(app)
    
    # Initialize services
    init_services(app.config['AGENTS'])
    
    # Register blueprints
    app.register_blueprint(main_bp)
    app.register_blueprint(agent_bp)
    
    return app

# Create app instance
app = create_app(os.environ.get('FLASK_ENV', 'default'))

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
