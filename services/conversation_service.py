"""
Conversation service for managing conversations
"""
from typing import Dict, Any, List, Optional
from models.conversation import Conversation
from models.agent import Agent

class ConversationService:
    """Service for managing agent-to-agent conversations"""
    
    def __init__(self):
        self.conversations: Dict[str, Conversation] = {}
    
    def get_or_create_conversation(self, agent_id: str) -> Conversation:
        """Get existing conversation or create new one for agent"""
        if agent_id not in self.conversations:
            self.conversations[agent_id] = Conversation(agent_id)
        return self.conversations[agent_id]
    
    def add_agent_message(self, agent_id: str, speaker: str, message: str) -> None:
        """Add an agent-to-agent message to the conversation"""
        conversation = self.get_or_create_conversation(agent_id)
        conversation.add_message(speaker, message)
    
    def get_conversation_history(self, agent_id: str) -> List[Dict[str, Any]]:
        """Get conversation history for an agent"""
        conversation = self.get_or_create_conversation(agent_id)
        return conversation.get_messages()
    
    def reset_conversation(self, agent_id: str) -> bool:
        """Reset conversation for an agent"""
        if agent_id in self.conversations:
            self.conversations[agent_id].clear()
            return True
        return False
    
    def get_conversation_count(self, agent_id: str) -> int:
        """Get number of messages in conversation"""
        conversation = self.get_or_create_conversation(agent_id)
        return conversation.get_message_count()
    
    def get_all_conversations(self) -> Dict[str, List[Dict[str, Any]]]:
        """Get all conversations"""
        return {
            agent_id: conversation.get_messages() 
            for agent_id, conversation in self.conversations.items()
        }
