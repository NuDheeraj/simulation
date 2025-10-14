"""
Agent service for managing AI agents
"""
from typing import Dict, Any, List, Optional
from models.agent import Agent
from services.brain_coordination_service import BrainCoordinationService
from utils.logger import setup_logger
from utils.prompt_builder import PromptBuilder

logger = setup_logger()

class AgentService:
    """Service for managing AI agents"""
    
    def __init__(self, agents_config: Dict[str, Dict[str, Any]]):
        self.agents: Dict[str, Agent] = {}
        self.brain_coordination_service = BrainCoordinationService()
        self._initialize_agents(agents_config)
        self._add_agents_to_brain_coordination()
    
    def _initialize_agents(self, agents_config: Dict[str, Dict[str, Any]]) -> None:
        """Initialize agents from configuration with dynamically generated system prompts"""
        # First pass: Create agents with enriched config (including system prompts)
        for agent_id, config in agents_config.items():
            # Create enriched config with dynamically generated system prompt
            enriched_config = config.copy()
            
            # Gather info about other agents
            other_agents_info = []
            for other_id, other_config in agents_config.items():
                if other_id != agent_id:
                    other_agents_info.append({
                        'name': other_config.get('name', 'Unknown'),
                        'personality': other_config.get('personality', 'an AI agent')
                    })
            
            # Generate system prompt using PromptBuilder
            enriched_config['system_prompt'] = PromptBuilder.build_system_prompt(
                agent_name=config.get('name', 'Unknown'),
                personality=config.get('personality', 'an AI agent'),
                other_agents=other_agents_info
            )
            
            # Create agent with enriched config
            self.agents[agent_id] = Agent(agent_id, enriched_config)
            logger.info(f"Initialized {config.get('name', agent_id)} with dynamically generated system prompt")
    
    def _add_agents_to_brain_coordination(self) -> None:
        """Add all agent brains to the coordination service"""
        for agent in self.agents.values():
            self.brain_coordination_service.add_agent_brain(agent)
    
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
        """Add a new agent with dynamically generated system prompt"""
        if agent_id in self.agents:
            return False  # Agent already exists
        
        # Create enriched config with dynamically generated system prompt
        enriched_config = config.copy()
        
        # Gather info about other agents
        other_agents_info = []
        for other_id, other_agent in self.agents.items():
            other_agents_info.append({
                'name': other_agent.name,
                'personality': other_agent.personality
            })
        
        # Generate system prompt using PromptBuilder
        enriched_config['system_prompt'] = PromptBuilder.build_system_prompt(
            agent_name=config.get('name', 'Unknown'),
            personality=config.get('personality', 'an AI agent'),
            other_agents=other_agents_info
        )
        
        self.agents[agent_id] = Agent(agent_id, enriched_config)
        logger.info(f"Added new agent {config.get('name', agent_id)} with dynamically generated system prompt")
        return True
    
    def remove_agent(self, agent_id: str) -> bool:
        """Remove an agent"""
        if agent_id not in self.agents:
            return False
        
        del self.agents[agent_id]
        self.brain_coordination_service.remove_agent_brain(agent_id)
        return True
    
    def start_simulation(self) -> None:
        """Start the simulation"""
        self.brain_coordination_service.activate_brains()
        logger.info("Simulation started")
    
    def stop_simulation(self) -> None:
        """Stop the simulation"""
        self.brain_coordination_service.deactivate_brains()
        logger.info("Simulation stopped")
    
    def activate_brains(self) -> None:
        """Activate all agent brains"""
        self.brain_coordination_service.activate_brains()
        logger.info("Agent brains activated")
    
    def deactivate_brains(self) -> None:
        """Deactivate all agent brains"""
        self.brain_coordination_service.deactivate_brains()
        logger.info("Agent brains deactivated")
    
    def get_brain_state(self) -> Dict[str, Any]:
        """Get current brain coordination state"""
        return self.brain_coordination_service.get_brain_state()
    
    def get_brain_coordination_service(self) -> BrainCoordinationService:
        """Get the brain coordination service instance"""
        return self.brain_coordination_service
    
    def reset_simulation(self) -> None:
        """Reset the simulation to initial state"""
        self.brain_coordination_service.reset_simulation()
        logger.info("Simulation reset")
    
    def get_simulation_state(self) -> Dict[str, Any]:
        """Get current simulation state"""
        return {
            "simulation_running": self.brain_coordination_service.brains_active,
            "agents": {aid: {
                "id": agent.id,
                "name": agent.name,
                "position": agent.position,
                "current_action": agent.current_action,
                "current_utterance": agent.current_utterance
            } for aid, agent in self.agents.items()},
        }