"""
Agent model for AI Agents Simulation
"""
from typing import Dict, Any, List
import time
import random

class Agent:
    """Represents an AI agent with personality and conversation capabilities"""
    
    def __init__(self, agent_id: str, config: Dict[str, Any]):
        self.id = agent_id
        self.name = config.get('name', 'Unknown')
        self.personality = config.get('personality', 'Neutral')
        self.system_prompt = config.get('system_prompt', '')
        self.color = config.get('color', 'gray')
        self.position = config.get('position', {'x': 0, 'y': 0, 'z': 0})
        self.conversation_history: List[Dict[str, Any]] = []
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert agent to dictionary for API responses"""
        return {
            'id': self.id,
            'name': self.name,
            'personality': self.personality,
            'system_prompt': self.system_prompt,
            'color': self.color,
            'position': self.position
        }
    
    def add_message(self, user_message: str, agent_response: str) -> None:
        """Add a message exchange to conversation history"""
        self.conversation_history.append({
            "user": user_message,
            "agent": agent_response,
            "timestamp": time.time()
        })
    
    def get_conversation_history(self) -> List[Dict[str, Any]]:
        """Get conversation history"""
        return self.conversation_history
    
    def reset_conversation(self) -> None:
        """Reset conversation history"""
        self.conversation_history = []
    
    def generate_response(self, user_message: str) -> str:
        """Generate a response based on agent personality"""
        # Simple rule-based responses (in a real app, you'd use an actual AI model)
        if "hello" in user_message.lower() or "hi" in user_message.lower():
            if self.personality == "Creative and artistic":
                return f"Hello! I'm {self.name}, and I'm so excited to meet you! What creative project are you working on today? 🎨"
            else:
                return f"Hello! I'm {self.name}. I'm here to help you with any analytical or logical problems you might have."
        
        elif "help" in user_message.lower():
            if self.personality == "Creative and artistic":
                return f"I'd love to help you with anything creative! I can assist with art, music, writing, or any imaginative project you have in mind."
            else:
                return f"I can help you with mathematical problems, data analysis, logical reasoning, or any technical challenges you're facing."
        
        elif "weather" in user_message.lower():
            if self.personality == "Creative and artistic":
                return f"The weather is like a beautiful painting today! I love how the light dances through the clouds. What's your favorite weather for creating art?"
            else:
                return f"Based on current meteorological data, I can help you analyze weather patterns and predict conditions. What specific weather information do you need?"
        
        elif "math" in user_message.lower() or "calculate" in user_message.lower():
            if self.personality == "Creative and artistic":
                return f"Math can be so beautiful! I love how numbers create patterns and symmetry. What mathematical concept would you like to explore artistically?"
            else:
                return f"I excel at mathematical calculations and analysis. Please provide the specific problem or equation you'd like me to solve."
        
        else:
            if self.personality == "Creative and artistic":
                responses = [
                    f"That's fascinating! I love how you think about things. Let me share a creative perspective on that...",
                    f"What an interesting idea! I'm inspired by your thoughts. Here's how I see it from an artistic viewpoint...",
                    f"I'm so excited about this topic! Let me paint you a picture with words about what I think..."
                ]
            else:
                responses = [
                    f"Let me analyze that logically for you. Based on the data and reasoning...",
                    f"That's an interesting problem. Let me break it down systematically...",
                    f"I'll approach this from a scientific perspective. Here's my analysis..."
                ]
            
            return random.choice(responses)
