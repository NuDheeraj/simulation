"""
Brain coordination service for managing AI agent brains and their interactions
"""
import time
from typing import Dict, Any, Optional
from models.agent import Agent
from utils.logger import setup_logger

logger = setup_logger()

class BrainCoordinationService:
    """Manages AI agent brains and coordinates their interactions"""
    
    def __init__(self):
        self.agents: Dict[str, Agent] = {}
        self.brains_active = False
    
    def add_agent_brain(self, agent: Agent) -> None:
        """Add an agent brain to the coordination service"""
        self.agents[agent.id] = agent
        logger.info(f"Added brain for {agent.name}")
    
    def remove_agent_brain(self, agent_id: str) -> None:
        """Remove an agent brain from the coordination service"""
        if agent_id in self.agents:
            agent_name = self.agents[agent_id].name
            del self.agents[agent_id]
            logger.info(f"Removed brain for {agent_name}")
    
    def get_agent_brain(self, agent_id: str) -> Optional[Agent]:
        """Get an agent brain by ID"""
        return self.agents.get(agent_id)
    
    def get_all_agent_brains(self) -> Dict[str, Agent]:
        """Get all agent brains"""
        return self.agents.copy()
    
    
    def activate_brains(self) -> None:
        """Activate all agent brains for coordination"""
        if self.brains_active:
            logger.warning("Brains already active")
            return
        
        self.brains_active = True
        
        # Log system prompt for each agent when simulation starts
        for agent in self.agents.values():
            agent.logger.info(f"🎬 SIMULATION STARTED - System Prompt for {agent.name}:")
            agent.logger.info(f"--- SYSTEM PROMPT START ---")
            agent.logger.info(agent.system_prompt)
            agent.logger.info(f"--- SYSTEM PROMPT END ---")
        
        logger.info("Agent brains activated - ready to process requests from world")
    
    def deactivate_brains(self) -> None:
        """Deactivate all agent brains"""
        self.brains_active = False
        logger.info("Agent brains deactivated")
    
    def get_brain_state(self) -> Dict[str, Any]:
        """Get current brain coordination state"""
        brain_states = {}
        for agent_id, agent in self.agents.items():
            brain_states[agent_id] = {
                "id": agent.id,
                "name": agent.name,
                "personality": agent.personality,
                "action_memory_count": len(agent.action_memory),
                "observation_memory_count": len(agent.observation_memory)
            }
        
        return {
            "brains": brain_states,
            "brains_active": self.brains_active,
            "timestamp": time.time()
        }
    
    
    def reset_simulation(self) -> None:
        """Reset the simulation to initial state"""
        # Stop the simulation first
        self.deactivate_brains()
        
        # Reset all agents to their initial positions and clear state
        for agent in self.agents.values():
            # Reset to initial position from config (X-Z plane movement, Y is height)
            if agent.id == "agent1":
                agent.position = {"x": -2, "y": 0.6, "z": 1}
            elif agent.id == "agent2":
                agent.position = {"x": 2, "y": 0.6, "z": 1}
            
            # Y is height (fixed), X-Z is movement plane
            
            # Clear all state
            agent.current_action = "idle"
            agent.goal_target = None
            agent.current_utterance = None
            agent.utterance_end_time = 0
            agent.action_memory.clear()
            agent.observation_memory.clear()
            agent.conversation_history.clear()
            agent.last_decision_time = 0
            
            # Log reset for this agent
            agent.logger.info(f"🔄 Agent {agent.name} reset to initial state")
        
        
        logger.info("Simulation reset - agents returned to initial positions")
