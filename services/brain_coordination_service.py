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
                "recent_memories": agent.get_recent_memories(3),
                "memory_count": len(agent.memory)
            }
        
        return {
            "brains": brain_states,
            "brains_active": self.brains_active,
            "timestamp": time.time()
        }
    
    
    def report_action_completion(self, agent_id: str, action_type: str, final_position: Dict[str, float] = None) -> None:
        """Report that an agent has completed an action (called by frontend)"""
        agent = self.get_agent_brain(agent_id)
        if not agent:
            return
        
        # Update agent position if provided
        if final_position:
            agent.position = final_position.copy()
        
        # Clear current action and allow new decisions
        agent.current_action = "idle"
        agent.goal_target = None
        
        # Clear utterance if it was a speech action
        if action_type == "say":
            agent.current_utterance = None
            agent.utterance_end_time = 0
        
        # Clear pending decision
        agent.pending_decision = None
        
        agent_name = agent.name if agent else agent_id
        logger.info(f"✅ {agent_name} completed {action_type} action")
    
    def clear_pending_decision(self, agent_id: str) -> None:
        """Clear a pending decision for an agent (called by frontend)"""
        agent = self.get_agent_brain(agent_id)
        if agent:
            agent.pending_decision = None
            logger.info(f"Cleared pending decision for {agent.name}")
    
    def force_agent_decision(self, agent_id: str) -> Optional[Dict[str, Any]]:
        """Force an agent to make a decision immediately"""
        agent = self.get_agent_brain(agent_id)
        if not agent:
            return None
        
        # Temporarily reduce decision interval
        original_interval = agent.decision_interval
        agent.decision_interval = 0.1
        
        decision = agent.make_decision(self.agents, self.world_objects)
        
        # Restore original interval
        agent.decision_interval = original_interval
        
        return decision
    
    
    def reset_simulation(self) -> None:
        """Reset the simulation to initial state"""
        self.stop_simulation()
        
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
            agent.memory.clear()
            agent.observations.clear()
            agent.last_decision_time = 0
        
        
        logger.info("Simulation reset - agents returned to initial positions")
