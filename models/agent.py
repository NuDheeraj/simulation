"""
Agent model for AI Agents Simulation
"""
from typing import Dict, Any, List, Optional
import time
import random
import math
from services.llm_service import LLMService
from utils.logger import setup_agent_logger

class Agent:
    """Represents an AI agent with personality, observation, memory, and decision-making capabilities"""
    
    def __init__(self, agent_id: str, config: Dict[str, Any]):
        self.id = agent_id
        self.name = config.get('name', 'Unknown')
        self.personality = config.get('personality', 'Neutral')
        self.system_prompt = config.get('system_prompt', '')
        self.color = config.get('color', 'gray')
        # Initialize with 3D position (Y is height, X-Z is movement plane)
        self.position = config.get('position', {'x': 0, 'y': 0, 'z': 0})
        # Y is height (fixed), X-Z is the movement plane
        self.conversation_history: List[Dict[str, Any]] = []
        
        # Initialize LLM service
        self.llm_service = LLMService()
        
        # Initialize agent-specific logger
        self.logger = setup_agent_logger(self.name)
        
        # Agent simulation properties
        self.current_action = "idle"  # "move", "say", "idle"
        self.goal_target = None  # {"x": num, "y": num} or {"agent": "Agent-B"}
        
        # Simplified memory system
        self.action_memory: List[str] = []  # LLM decisions/actions taken
        self.observation_memory: List[str] = []  # Past sensory observations
        self.max_memory_items = 50  # Keep last 50 of each type
        
        
        # Action cooldowns
        self.last_decision_time = 0
        self.decision_interval = 1.0  # seconds between decisions (faster decisions)
        self.current_utterance = None
        self.utterance_end_time = 0
        
        # Pending decision from AI (for frontend to execute)
        self.pending_decision = None
    
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
    
    def add_message(self, speaker: str, message: str) -> None:
        """Add an agent-to-agent message to conversation history"""
        self.conversation_history.append({
            "speaker": speaker,
            "message": message,
            "timestamp": time.time()
        })
    
    def get_conversation_history(self) -> List[Dict[str, Any]]:
        """Get conversation history"""
        return self.conversation_history
    
    def reset_conversation(self) -> None:
        """Reset conversation history"""
        self.conversation_history = []
    
    
    def _calculate_distance(self, target_position: Dict[str, float]) -> float:
        """Calculate distance to a target position (X-Z plane movement)"""
        dx = target_position['x'] - self.position['x']
        dz = target_position['z'] - self.position['z']
        # Use X and Z for horizontal plane movement (Y is height, fixed)
        return math.sqrt(dx*dx + dz*dz)
    
    
    def add_action_memory(self, content: str) -> None:
        """Add an action memory (LLM decision/action)"""
        self.action_memory.append(content)
        if len(self.action_memory) > self.max_memory_items:
            self.action_memory = self.action_memory[-self.max_memory_items:]
    
    def add_observation_memory(self, content: str) -> None:
        """Add an observation memory (past sensory data)"""
        self.observation_memory.append(content)
        if len(self.observation_memory) > self.max_memory_items:
            self.observation_memory = self.observation_memory[-self.max_memory_items:]
    
    def get_action_memories(self) -> List[str]:
        """Get action memories (LLM decisions)"""
        return self.action_memory
    
    def get_observation_memories(self) -> List[str]:
        """Get observation memories (past sensory data)"""
        return self.observation_memory
    
    def can_make_decision(self) -> bool:
        """Check if agent can make a new decision"""
        current_time = time.time()
        return (current_time - self.last_decision_time) >= self.decision_interval
    
    
    def _validate_decision(self, decision: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and clean up LLM decision"""
        # Ensure required fields exist
        if "action" not in decision:
            decision["action"] = "idle"
        
        # Validate action type
        if decision["action"] not in ["move", "say", "idle", "observe"]:
            decision["action"] = "idle"
        
        # Validate target for move action
        if decision["action"] == "move":
            if "target" not in decision or not decision["target"]:
                # Generate random target if missing
                decision["target"] = {
                    "x": self.position["x"] + random.uniform(-2, 2),
                    "z": self.position["z"] + random.uniform(-2, 2)
                }
            else:
                # Ensure target has x and z coordinates
                target = decision["target"]
                if isinstance(target, dict):
                    if "x" not in target or "z" not in target:
                        decision["target"] = {
                            "x": self.position["x"] + random.uniform(-2, 2),
                            "z": self.position["z"] + random.uniform(-2, 2)
                        }
                    else:
                        # Keep within world bounds (-4 to +4 as per frontend coin generation)
                        decision["target"]["x"] = max(-4, min(4, decision["target"]["x"]))
                        decision["target"]["z"] = max(-4, min(4, decision["target"]["z"]))
        
        # Validate utterance for say action
        if decision["action"] == "say":
            if not decision.get("utterance"):
                decision["utterance"] = "Hello there!"
            # Truncate utterance if too long
            if len(decision["utterance"]) > 200:
                decision["utterance"] = decision["utterance"][:197] + "..."
        else:
            decision["utterance"] = None
        
        # Remove mem_update field if present (no longer used)
        if "mem_update" in decision:
            del decision["mem_update"]
        
        return decision
    
    def _add_action_memory(self, decision: Dict[str, Any], simulation_time: int = 0) -> None:
        """Add action memory (raw LLM decision)"""
        # Store raw LLM decision directly as memory
        action_memory = {
            'decision': decision,
            'simulation_time': simulation_time,
            'timestamp': time.time()
        }
        self.action_memory.append(action_memory)
        if len(self.action_memory) > self.max_memory_items:
            self.action_memory = self.action_memory[-self.max_memory_items:]
        self.logger.debug(f"Action memory added: {action_memory}")
    
    def _add_observation_memory(self, sensory_data: Dict[str, Any]) -> None:
        """Add observation memory (raw sensory data)"""
        # Store raw sensory data directly as memory
        self.observation_memory.append(sensory_data)
        if len(self.observation_memory) > self.max_memory_items:
            self.observation_memory = self.observation_memory[-self.max_memory_items:]
        self.logger.debug(f"Observation memory added: {sensory_data}")
    
    async def make_decision_from_sensory_data(self, sensory_data: Dict[str, Any]) -> Dict[str, Any]:
        """Make a decision based on sensory input from the world using LLM"""
        
        # Extract sensory information
        position = sensory_data.get('position', self.position)
        nearby_agents = sensory_data.get('nearbyAgents', [])
        world_objects = sensory_data.get('worldObjects', [])
        current_action = sensory_data.get('currentAction', 'idle')
        
        # Check if agent can make a decision
        if not self.can_make_decision():
            return {"action": current_action, "target": None, "utterance": None}
        
        # Set decision in progress flag
        self._decision_in_progress = True
        
        # Get simulation time from sensory data
        simulation_time = sensory_data.get('simulationTime', 0)
        
        # Use raw sensory data directly as current observations
        current_observations = [f"Raw sensory data: {sensory_data}"]
        
        # Get action and observation memories for the prompt (BEFORE adding current observation)
        action_memories = self.get_action_memories()
        observation_memories = self.get_observation_memories()
        
        # Use LLM service for decision making
        decision = await self.llm_service.make_agent_decision(
            agent_id=self.id,
            agent_name=self.name,
            position=position,
            current_observations=current_observations,
            action_memories=action_memories,
            observation_memories=observation_memories,
            system_prompt=self.system_prompt,
            sensory_data=sensory_data,
            agent_logger=self.logger
        )
        
        # Validate and clean up the decision
        decision = self._validate_decision(decision)
        
        # Add action memory (what agent decided to do)
        self._add_action_memory(decision, simulation_time)
        
        # Add current observation to memory AFTER decision (so it becomes past observation for next decision)
        self._add_observation_memory(sensory_data)
        
        # Log agent decision
        self.logger.info(f"Decision: {decision['action']} -> {decision.get('target', 'N/A')}")
        
        # Update decision timing
        self.last_decision_time = time.time()
        
        return decision
    
    def _generate_current_observations(self, nearby_agents: List[Dict], world_objects: List[Dict]) -> List[str]:
        """Generate current observations from sensory data (what agent sees right now)"""
        observations = []
        
        # Observe nearby agents
        for agent in nearby_agents:
            observations.append(f"Agent-{agent['name']} at ({agent['position']['x']:.1f}, {agent['position']['z']:.1f}) distance {agent['distance']:.1f}")
            if agent.get('currentUtterance'):
                observations.append(f"Agent-{agent['name']} is saying: '{agent['currentUtterance']}'")
        
        # Observe world objects
        for obj in world_objects:
            observations.append(f"{obj['name']} at ({obj['position']['x']:.1f}, {obj['position']['z']:.1f}) distance {obj['distance']:.1f}")
        
        return observations
    
    def process_action_completion(self, action_type: str, result: Dict[str, Any]) -> None:
        """Process action completion from the world"""
        if action_type == "move":
            # Update position if provided
            if 'final_position' in result:
                self.position = result['final_position'].copy()
            self.add_memory(f"Completed movement", "action")
            self.logger.info(f"Action completed: move to ({self.position['x']:.1f}, {self.position['z']:.1f})")
        elif action_type == "say":
            self.add_memory(f"Spoke: {result.get('message', '')}", "action")
            self.logger.info(f"Action completed: say '{result.get('message', '')}'")
        elif action_type == "observe":
            # Process observation results
            sensory_data = result.get('sensory_data', {})
            observations = self._generate_observations_from_sensory_data(
                sensory_data.get('nearbyAgents', []),
                sensory_data.get('worldObjects', [])
            )
            for obs in observations:
                self.add_memory(obs, "observation")
            self.logger.info(f"Action completed: observe - {len(observations)} observations")
    
