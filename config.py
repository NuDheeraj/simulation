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
    PORT = int(os.environ.get('FLASK_PORT', 8080))
    
    # LLM Configuration - All providers use OpenAI-compatible format
    LLM_PROVIDER = os.environ.get('LLM_PROVIDER', 'OpenAI')
    LLM_BASE_URL = os.environ.get('LLM_BASE_URL', 'http://127.0.0.1:1234/v1')
    LLM_MODEL = os.environ.get('LLM_MODEL', 'ibm/granite-4-h-tiny')
    LLM_API_KEY = os.environ.get('LLM_API_KEY', '18b3a699-cbb6-4b66-b9ae-5f15871539fa')
    
    # Shared Environment Context
    ENVIRONMENT_CONTEXT = """ENVIRONMENT CONTEXT:

WORLD SPACE:
- Continuous 3D world with 8x8 unit playable area
- You move on the X-Z plane (horizontal), Y is fixed at 0.6 units height
- World boundaries: X and Z coordinates range from -4 to +4
- Ground is gray, agents appear as colored capsules

SENSORY SYSTEM:
- You can see other agents within 1.0 unit radius
- You can see world objects (coins, landmarks) within 1.0 unit radius
- You cannot see beyond this radius - you must explore to find things

COMMUNICATION:
- You can text message other agents at any distance
- Messages are private between you and the recipient
- Communication can help with coordination

GOAL:
- Collect all 10 golden coins scattered around the world
- Explore systematically to find all coins

AVAILABLE ACTIONS:
1. move(x, z) - Move to target coordinates
   - Speed: 2 units per second
   - World bounds: x and z from -4 to +4

2. text(agent, message) - Send a text message to another agent
   - Works at any distance
   - Messages deliver instantly
   - Keep under 40 words

3. idle() - Rest and observe for 5 seconds

CONSTRAINTS:
- Text messages under 40 words
- Stay within world boundaries (-4 to +4 for x and z)
- Vision limited to 1.0 unit radius"""
    
    # Response Format
    RESPONSE_FORMAT = """RESPONSE FORMAT: You MUST respond with ONLY valid JSON in this exact format:
{"action": "move|text|idle", "target": {"x": number, "z": number} or {"agent": "Alice"} or {"agent": "Bob"}, "utterance": "text message or null"}
- For 'move' action: target must be {"x": number, "z": number}
- For 'text' action: target must be {"agent": "AgentName"} and utterance is required
- For 'idle' action: target and utterance should be null
Do not include any other text, explanations, or formatting."""
    
    # Agent configuration (X-Z plane movement, Y is height)
    # NOTE: system_prompt is now generated dynamically by PromptBuilder
    # Keep only raw data here (name, personality, color, position)
    AGENTS = {
        "agent1": {
            "name": "Alice",
            "personality": "creative and artistic AI agent who loves painting, music, and poetry and enjoys collaborating and texting with others",
            "color": "red",
            "position": {"x": -2, "y": 0.6, "z": 1}  # X-Z plane movement, Y is height
        },
        "agent2": {
            "name": "Bob",
            "personality": "logical and analytical AI agent who excels at mathematics, science, and problem-solving and values efficient coordination",
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