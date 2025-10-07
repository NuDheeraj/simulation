"""
Agent model for AI Agents Simulation
"""
from typing import Dict, Any, List, Optional
import time
import random
import math
from services.llm_service import LLMService

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
        
        # Agent simulation properties
        self.current_action = "idle"  # "move", "say", "idle"
        self.goal_target = None  # {"x": num, "y": num} or {"agent": "Agent-B"}
        
        # Memory system
        self.memory: List[Dict[str, Any]] = []
        self.max_memory_items = 10
        
        
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
    
    
    def add_memory(self, content: str, memory_type: str = "observation") -> None:
        """Add a memory item"""
        memory_item = {
            "content": content,
            "type": memory_type,
            "timestamp": time.time()
        }
        self.memory.append(memory_item)
        
        # Keep only the most recent memories
        if len(self.memory) > self.max_memory_items:
            self.memory = self.memory[-self.max_memory_items:]
    
    def get_recent_memories(self, count: int = 3) -> List[str]:
        """Get the most recent memory items"""
        recent = self.memory[-count:] if len(self.memory) >= count else self.memory
        return [mem["content"] for mem in recent]
    
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
                        # Keep within world bounds
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
        
        # Ensure mem_update is a string or None
        if decision.get("mem_update") and not isinstance(decision["mem_update"], str):
            decision["mem_update"] = str(decision["mem_update"])
        
        return decision
    
    
    
    async def make_decision_from_sensory_data(self, sensory_data: Dict[str, Any]) -> Dict[str, Any]:
        """Make a decision based on sensory input from the world using LLM"""
        
        # Extract sensory information
        position = sensory_data.get('position', self.position)
        nearby_agents = sensory_data.get('nearbyAgents', [])
        world_objects = sensory_data.get('worldObjects', [])
        current_action = sensory_data.get('currentAction', 'idle')
        
        # Check if agent can make a decision
        if not self.can_make_decision():
            return {"action": current_action, "target": None, "utterance": None, "mem_update": None}
        
        # Set decision in progress flag
        self._decision_in_progress = True
        
        # Generate observations from sensory data
        observations = self._generate_observations_from_sensory_data(nearby_agents, world_objects)
        
        # Get recent memories
        recent_memories = self.get_recent_memories(2)
        
        # Use LLM service for decision making (already async)
        decision = await self.llm_service.make_agent_decision(
            agent_id=self.id,
            agent_name=self.name,
            position=position,
            observations=observations,
            memories=recent_memories,
            world_objects=world_objects,
            system_prompt=self.system_prompt,
            sensory_data=sensory_data  # Pass sensory data for simulation time
        )
        
        # Validate and clean up the decision
        decision = self._validate_decision(decision)
        
        # Update memory if there's a memory update
        if decision.get("mem_update"):
            self.add_memory(decision["mem_update"], "decision")
        
        # Update decision timing
        self.last_decision_time = time.time()
        
        return decision
    
    def _generate_observations_from_sensory_data(self, nearby_agents: List[Dict], world_objects: List[Dict]) -> List[str]:
        """Generate observations from sensory data"""
        observations = []
        
        # Observe nearby agents
        for agent in nearby_agents:
            observations.append(f"Agent-{agent['name']} at ({agent['position']['x']:.1f}, {agent['position']['y']:.1f}) distance {agent['distance']:.1f}")
            if agent.get('currentUtterance'):
                observations.append(f"Last heard: Agent-{agent['name']}: '{agent['currentUtterance']}'")
        
        # Observe world objects
        for obj in world_objects:
            observations.append(f"The {obj['name']} is at ({obj['position']['x']:.1f}, {obj['position']['y']:.1f}) distance {obj['distance']:.1f}")
        
        return observations
    
    def process_action_completion(self, action_type: str, result: Dict[str, Any]) -> None:
        """Process action completion from the world"""
        if action_type == "move":
            # Update position if provided
            if 'final_position' in result:
                self.position = result['final_position'].copy()
            self.add_memory(f"Completed movement", "action")
        elif action_type == "say":
            self.add_memory(f"Spoke: {result.get('message', '')}", "action")
        elif action_type == "observe":
            # Process observation results
            sensory_data = result.get('sensory_data', {})
            observations = self._generate_observations_from_sensory_data(
                sensory_data.get('nearbyAgents', []),
                sensory_data.get('worldObjects', [])
            )
            for obs in observations:
                self.add_memory(obs, "observation")
    
