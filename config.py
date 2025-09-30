"""
Configuration management for the AI Agents Simulation
"""
import os
from typing import Dict, Any

class Config:
    """Base configuration class"""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    DEBUG = os.environ.get('FLASK_DEBUG', 'True').lower() == 'true'
    HOST = os.environ.get('FLASK_HOST', '0.0.0.0')
    PORT = int(os.environ.get('FLASK_PORT', 5001))
    
    # Agent configuration (X-Z plane movement, Y is height)
    AGENTS = {
        "agent1": {
            "name": "Alice",
            "personality": "Creative and artistic",
            "system_prompt": "You are Alice, a creative and artistic AI agent. You love painting, music, and poetry. You always respond with enthusiasm and creativity.",
            "color": "red",
            "position": {"x": -2, "y": 0.6, "z": 1}  # X-Z plane movement, Y is height
        },
        "agent2": {
            "name": "Bob", 
            "personality": "Logical and analytical",
            "system_prompt": "You are Bob, a logical and analytical AI agent. You excel at mathematics, science, and problem-solving. You provide precise, well-reasoned responses.",
            "color": "blue",
            "position": {"x": 2, "y": 0.6, "z": 1}  # X-Z plane movement, Y is height
        }
    }

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False

# Configuration mapping
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
