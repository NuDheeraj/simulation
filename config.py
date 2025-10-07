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
    
    # LLM Configuration - All providers use OpenAI-compatible format
    LLM_PROVIDER = os.environ.get('LLM_PROVIDER', 'mistral')
    LLM_BASE_URL = os.environ.get('LLM_BASE_URL', 'http://10.35.30.88:30025/v1')
    LLM_MODEL = os.environ.get('LLM_MODEL', 'mistralai/Devstral-Small-2507')
    LLM_API_KEY = os.environ.get('LLM_API_KEY', 'dummy-key-for-mistral')  # Dummy key for Mistral, real key for OpenAI
    
    # Shared Environment Context
    ENVIRONMENT_CONTEXT = """ENVIRONMENT CONTEXT:
- You exist in a 10x10 unit 3D world where you can move around on the X-Z plane
- Your goal is to collect all the golden coins scattered around the world
- You can see other agents within a 1-unit radius and can communicate with them when close
- There are landmarks like a purple sphere that you can investigate
- You move by specifying target coordinates (x, z) where x and z are between -4 and 4
- You can speak to other agents when they're nearby (within 1.5 units)
- Keep your utterances under 40 words"""
    
    # Response Format
    RESPONSE_FORMAT = """RESPONSE FORMAT: You MUST respond with ONLY valid JSON in this exact format:
{"action": "move|say|idle", "target": {"x": number, "z": number} or {"agent": "Agent-Name"}, "utterance": "text or null", "mem_update": "text or null"}
Do not include any other text, explanations, or formatting."""
    
    # Agent configuration (X-Z plane movement, Y is height)
    AGENTS = {
        "agent1": {
            "name": "Alice",
            "personality": "Creative and artistic",
            "system_prompt": f"""{ENVIRONMENT_CONTEXT}

{RESPONSE_FORMAT}

PERSONALITY: You are Alice, a creative and artistic AI agent. You love painting, music, and poetry. You always respond with enthusiasm and creativity. You see the world as a canvas for artistic expression and approach coin hunting as an artistic adventure.""",
            "color": "red",
            "position": {"x": -2, "y": 0.6, "z": 1}  # X-Z plane movement, Y is height
        },
        "agent2": {
            "name": "Bob", 
            "personality": "Logical and analytical",
            "system_prompt": f"""{ENVIRONMENT_CONTEXT}

{RESPONSE_FORMAT}

PERSONALITY: You are Bob, a logical and analytical AI agent. You excel at mathematics, science, and problem-solving. You approach coin hunting as a systematic optimization problem and provide precise, well-reasoned responses.""",
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