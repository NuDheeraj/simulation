"""
Conversation model for AI Agents Simulation
"""
from typing import Dict, Any, List
import time

class Conversation:
    """Represents a conversation between user and agent"""
    
    def __init__(self, agent_id: str):
        self.agent_id = agent_id
        self.messages: List[Dict[str, Any]] = []
    
    def add_message(self, user_message: str, agent_response: str) -> None:
        """Add a message exchange to the conversation"""
        self.messages.append({
            "user": user_message,
            "agent": agent_response,
            "timestamp": time.time()
        })
    
    def get_messages(self) -> List[Dict[str, Any]]:
        """Get all messages in the conversation"""
        return self.messages
    
    def get_last_message(self) -> Dict[str, Any]:
        """Get the last message in the conversation"""
        return self.messages[-1] if self.messages else None
    
    def clear(self) -> None:
        """Clear all messages from the conversation"""
        self.messages = []
    
    def get_message_count(self) -> int:
        """Get the number of messages in the conversation"""
        return len(self.messages)
