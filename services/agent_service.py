"""
Agent service for managing AI agents
"""
from typing import Dict, Any, List, Optional
from models.agent import Agent

class AgentService:
    """Service for managing AI agents"""
    
    def __init__(self, agents_config: Dict[str, Dict[str, Any]]):
        self.agents: Dict[str, Agent] = {}
        self._initialize_agents(agents_config)
    
    def _initialize_agents(self, agents_config: Dict[str, Dict[str, Any]]) -> None:
        """Initialize agents from configuration"""
        for agent_id, config in agents_config.items():
            self.agents[agent_id] = Agent(agent_id, config)
    
    def get_all_agents(self) -> Dict[str, Dict[str, Any]]:
        """Get all agents as dictionary"""
        return {agent_id: agent.to_dict() for agent_id, agent in self.agents.items()}
    
    def get_agent(self, agent_id: str) -> Optional[Agent]:
        """Get a specific agent by ID"""
        return self.agents.get(agent_id)
    
    def agent_exists(self, agent_id: str) -> bool:
        """Check if an agent exists"""
        return agent_id in self.agents
    
    def get_agent_names(self) -> List[str]:
        """Get list of all agent IDs"""
        return list(self.agents.keys())
    
    def add_agent(self, agent_id: str, config: Dict[str, Any]) -> bool:
        """Add a new agent"""
        if agent_id in self.agents:
            return False  # Agent already exists
        
        self.agents[agent_id] = Agent(agent_id, config)
        return True
    
    def remove_agent(self, agent_id: str) -> bool:
        """Remove an agent"""
        if agent_id not in self.agents:
            return False
        
        del self.agents[agent_id]
        return True
