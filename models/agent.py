"""
Agent model for AI Agents Simulation
"""
from typing import Dict, Any, List, Optional
import time
import random
import math

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
        
        # Agent simulation properties
        self.current_action = "idle"  # "move", "say", "idle"
        self.goal_target = None  # {"x": num, "y": num} or {"agent": "Agent-B"}
        self.speed = 2.0  # units per second (much faster!)
        self.observation_radius = 1.0
        self.hearing_radius = 3.0
        self.talk_radius = 1.5
        
        # Memory system
        self.memory: List[Dict[str, Any]] = []
        self.max_memory_items = 10
        
        # Current observations
        self.observations: List[str] = []
        
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
    
    def observe(self, other_agents: Dict[str, 'Agent'], world_objects: List[Dict[str, Any]]) -> List[str]:
        """Generate observations about the world around the agent"""
        observations = []
        current_time = time.time()
        
        # Observe other agents
        for agent_id, agent in other_agents.items():
            if agent_id == self.id:
                continue
                
            distance = self._calculate_distance(agent.position)
            if distance <= self.observation_radius:
                observations.append(f"Agent-{agent.name} at ({agent.position['x']:.1f}, {agent.position['y']:.1f}) distance {distance:.1f}")
        
        # Observe world objects
        for obj in world_objects:
            distance = self._calculate_distance(obj['position'])
            if distance <= self.observation_radius:
                observations.append(f"The {obj['name']} is at ({obj['position']['x']:.1f}, {obj['position']['y']:.1f}) distance {distance:.1f}")
        
        # Check for recent communications
        recent_communications = self._get_recent_communications(other_agents)
        for comm in recent_communications:
            observations.append(f"Last heard: {comm}")
        
        self.observations = observations
        return observations
    
    def _calculate_distance(self, target_position: Dict[str, float]) -> float:
        """Calculate distance to a target position (X-Z plane movement)"""
        dx = target_position['x'] - self.position['x']
        dz = target_position['z'] - self.position['z']
        # Use X and Z for horizontal plane movement (Y is height, fixed)
        return math.sqrt(dx*dx + dz*dz)
    
    def _get_recent_communications(self, other_agents: Dict[str, 'Agent']) -> List[str]:
        """Get recent communications from other agents"""
        recent_comms = []
        current_time = time.time()
        
        for agent_id, agent in other_agents.items():
            if agent_id == self.id:
                continue
                
            distance = self._calculate_distance(agent.position)
            if distance <= self.hearing_radius and agent.current_utterance:
                recent_comms.append(f"Agent-{agent.name}: '{agent.current_utterance}'")
        
        return recent_comms
    
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
    
    def make_decision(self, other_agents: Dict[str, 'Agent'], world_objects: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Make a decision about what action to take"""
        if not self.can_make_decision():
            return {"action": self.current_action, "target": self.goal_target, "utterance": None, "mem_update": None}
        
        # Generate observations
        observations = self.observe(other_agents, world_objects)
        
        # Get recent memories
        recent_memories = self.get_recent_memories(2)
        
        # Mock LLM decision (replace with actual LLM call later)
        decision = self._mock_llm_decision(observations, recent_memories, position)
        
        # Update memory if there's a memory update
        if decision.get("mem_update"):
            self.add_memory(decision["mem_update"], "decision")
        
        # Update agent state
        self.current_action = decision["action"]
        self.goal_target = decision.get("target")
        self.last_decision_time = time.time()
        
        if decision["action"] == "say" and decision.get("utterance"):
            self.current_utterance = decision["utterance"]
            self.utterance_end_time = time.time() + 3.0  # Show for 3 seconds
        
        return decision
    
    def _mock_llm_decision(self, observations: List[str], memories: List[str], position: Dict[str, float]) -> Dict[str, Any]:
        """Mock LLM decision making (replace with actual LLM later)"""
        # Simple rule-based decision making based on personality
        current_time = time.time()
        
        # If currently speaking, continue or finish
        if self.current_utterance and current_time < self.utterance_end_time:
            return {"action": "say", "target": None, "utterance": self.current_utterance, "mem_update": None}
        
        # Check if we should respond to other agents (discuss exploration paths)
        for obs in observations:
            if "Agent-" in obs and "distance" in obs:
                # Extract distance
                try:
                    distance_str = obs.split("distance ")[1].split()[0]
                    distance = float(distance_str)
                    
                    if distance <= self.talk_radius and "Last heard" not in obs:
                        # Only talk 50% of the time when near other agents to discuss exploration
                        if random.random() < 0.5:
                            if self.personality == "Creative and artistic":
                                responses = [
                                    "Hello! I've been exploring the northern areas - found some interesting spots!",
                                    "Hi there! I've checked the eastern side, lots of open space to search.",
                                    "Hey! I've been wandering around the center - have you found any coins there?",
                                    "Hello! I've explored the western areas - what paths have you taken?",
                                    "Hi! I've been searching systematically - found some good areas to check!"
                                ]
                            else:
                                responses = [
                                    "Hello! I've systematically explored the northern quadrant - no coins there.",
                                    "Greetings! I've mapped the eastern region - it's mostly clear.",
                                    "Hi! I've analyzed the central area - what's your exploration status?",
                                    "Hello! I've covered the western section - any findings to share?",
                                    "Greetings! I've been methodically searching - what areas have you covered?"
                                ]
                            
                            return {
                                "action": "say",
                                "target": None,
                                "utterance": random.choice(responses),
                                "mem_update": f"Met another agent and discussed exploration paths"
                            }
                        else:
                            # 50% chance to continue exploring when near other agents
                            if random.random() < 0.5:
                                # Move away to continue exploring
                                target_x = position['x'] + random.uniform(-3, 3)
                                target_z = position['z'] + random.uniform(-3, 3)
                                return {
                                    "action": "move",
                                    "target": {"x": target_x, "z": target_z},
                                    "utterance": None,
                                    "mem_update": "Continuing exploration after meeting another agent"
                                }
                            else:
                                # Just observe/idle
                                return {
                                    "action": "observe",
                                    "target": None,
                                    "utterance": None,
                                    "mem_update": "Observing the area near another agent"
                                }
                except:
                    pass
        
        # Check for coins to collect (highest priority)
        for obs in observations:
            if "coin" in obs.lower():
                # Extract coin position from observation
                try:
                    # Parse observation like "The coin is at (x, y) distance d"
                    parts = obs.split("at (")[1].split(")")[0].split(", ")
                    coin_x = float(parts[0])
                    coin_y = float(parts[1])
                    
                    # Check if we're already close to the coin
                    coin_distance = math.sqrt((coin_x - position['x'])**2 + (coin_y - position['z'])**2)
                    if coin_distance < 0.8:  # Close to coin - just collect it silently
                        return {
                            "action": "move",
                            "target": {"x": coin_x, "z": coin_y},
                            "utterance": None,
                            "mem_update": "Moving to collect the coin"
                        }
                    else:  # Move towards coin
                        return {
                            "action": "move",
                            "target": {"x": coin_x, "z": coin_y},
                            "utterance": None,
                            "mem_update": "Spotted a coin and moving to collect it"
                        }
                except:
                    # If parsing fails, just move towards any coin
                    return {
                        "action": "move",
                        "target": {"x": random.uniform(-4, 4), "z": random.uniform(-4, 4)},
                        "utterance": None,
                        "mem_update": "Looking for coins to collect"
                    }
        
        # Check for world objects to investigate (sphere)
        for obs in observations:
            if "sphere" in obs.lower() or "object" in obs.lower():
                # Check if we're already close to the sphere
                sphere_distance = math.sqrt((5 - position['x'])**2 + (3 - position['z'])**2)
                if sphere_distance < 1.0:  # Already close to sphere
                    # Add some variety to sphere interactions
                    if random.random() < 0.7:  # 70% chance to speak about sphere
                        if self.personality == "Creative and artistic":
                            sphere_responses = [
                                "What a beautiful sphere! It's so inspiring!",
                                "This sphere fills me with creative energy!",
                                "I could paint this sphere in so many ways!",
                                "The sphere's colors dance in my imagination!"
                            ]
                        else:
                            sphere_responses = [
                                "Fascinating! This sphere has interesting properties to analyze.",
                                "The sphere's geometry is mathematically perfect!",
                                "I should study this sphere's physical properties.",
                                "This sphere presents an interesting scientific puzzle."
                            ]
                        
                        return {
                            "action": "say",
                            "target": None,
                            "utterance": random.choice(sphere_responses),
                            "mem_update": "Admired the mysterious sphere up close"
                        }
                    else:  # 30% chance to move away and explore
                        return {
                            "action": "move",
                            "target": {"x": random.uniform(-3, 3), "z": random.uniform(-3, 3)},
                            "utterance": None,
                            "mem_update": "Decided to explore other areas after seeing the sphere"
                        }
                else:  # Move towards sphere
                    if self.personality == "Creative and artistic":
                        return {
                            "action": "move",
                            "target": {"x": 5, "z": 3},  # Move towards sphere (X-Z coordinates)
                            "utterance": None,
                            "mem_update": "Decided to investigate the mysterious sphere"
                        }
                    else:
                        return {
                            "action": "move", 
                            "target": {"x": 5, "z": 3},  # Move towards sphere (X-Z coordinates)
                            "utterance": None,
                            "mem_update": "Moving to analyze the sphere's properties"
                        }
        
        # More varied decision making - focused on exploration and coin hunting within visibility
        decision_roll = random.random()
        
        if decision_roll < 0.7:  # 70% chance to move (increased to find coins within visibility)
            # Move in a more systematic pattern to explore the area
            # Try to move to unexplored areas within reasonable distance
            target_x = position['x'] + random.uniform(-3, 3)  # Move within 3 units
            target_z = position['z'] + random.uniform(-3, 3)  # Move within 3 units
            
            # Keep within world bounds
            target_x = max(-4, min(4, target_x))
            target_z = max(-4, min(4, target_z))
            
            return {
                "action": "move",
                "target": {"x": target_x, "z": target_z},  # X-Z coordinates
                "utterance": None,
                "mem_update": f"Exploring nearby area around ({target_x:.1f}, {target_z:.1f}) within visibility range"
            }
        elif decision_roll < 0.8:  # 10% chance to observe
            return {
                "action": "observe",
                "target": None,
                "utterance": None,
                "mem_update": "Taking time to observe the surroundings"
            }
        elif decision_roll < 0.9:  # 10% chance to speak randomly
            if self.personality == "Creative and artistic":
                random_utterances = [
                    "I'm on a treasure hunt! This is so exciting!",
                    "I love exploring new areas - you never know what you'll find!",
                    "I'm feeling inspired to search every corner of this world!",
                    "This exploration is like painting a map with my footsteps!"
                ]
            else:
                random_utterances = [
                    "I need to systematically search this area for coins.",
                    "There must be more coins hidden somewhere around here.",
                    "I should analyze the most efficient search patterns.",
                    "The exploration strategy needs to be more methodical."
                ]
            
            return {
                "action": "say",
                "target": None,
                "utterance": random.choice(random_utterances),
                "mem_update": "Expressed thoughts about the current situation"
            }
        else:  # 10% chance to idle
            return {
                "action": "idle",
                "target": None,
                "utterance": None,
                "mem_update": "Taking a moment to rest and think"
            }
    
    def update_position(self, delta_time: float) -> None:
        """Update agent position - movement is handled by frontend"""
        # Backend only handles decision-making, frontend handles movement
        # This method is kept for compatibility but doesn't do movement
        pass
    
    def report_movement_completion(self, new_position: Dict[str, float]) -> None:
        """Report movement completion from frontend"""
        self.position = new_position
        if self.current_action == "move":
            self.current_action = "idle"
            self.goal_target = None
            self.add_memory("Completed movement to target", "action")
    
    def make_decision_from_sensory_data(self, sensory_data: Dict[str, Any]) -> Dict[str, Any]:
        """Make a decision based on sensory input from the world"""
        # Extract sensory information
        position = sensory_data.get('position', self.position)
        nearby_agents = sensory_data.get('nearbyAgents', [])
        world_objects = sensory_data.get('worldObjects', [])
        current_action = sensory_data.get('currentAction', 'idle')
        
        # Check if agent can make a decision
        if not self.can_make_decision():
            return {"action": current_action, "target": None, "utterance": None, "mem_update": None}
        
        # Generate observations from sensory data
        observations = self._generate_observations_from_sensory_data(nearby_agents, world_objects)
        
        # Get recent memories
        recent_memories = self.get_recent_memories(2)
        
        # Make decision based on personality and observations
        decision = self._mock_llm_decision(observations, recent_memories, position)
        
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
    
    def generate_response(self, user_message: str) -> str:
        """Generate a response based on agent personality (for chat interface)"""
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
