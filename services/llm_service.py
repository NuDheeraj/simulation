"""
LLM Service for AI Agent decision making
Uses OpenAI Chat Completions API format for all providers
"""
import os
import json
import time
from typing import Dict, Any, List, Optional
from utils.logger import setup_logger
from config import Config

logger = setup_logger()

class LLMService:
    """Service for making LLM calls for agent decisions using OpenAI API format"""
    
    def __init__(self):
        self.client = None
        self.config = Config()
        self.llm_provider = self.config.LLM_PROVIDER.lower()
        self.model_name = self._get_model_name()
        self._initialize_client()
    
    def _get_model_name(self) -> str:
        """Get the model name - all providers use OpenAI-compatible format"""
        return self.config.LLM_MODEL
    
    def _initialize_client(self):
        """Initialize LLM client - all providers use OpenAI-compatible format"""
        try:
            from openai import OpenAI
            
            # All providers use OpenAI-compatible API format
            api_key = self.config.LLM_API_KEY
            base_url = self.config.LLM_BASE_URL
            
            logger.info(f"🔧 Initializing {self.llm_provider.upper()} client...")
            logger.info(f"🌐 Base URL: {base_url}")
            logger.info(f"🤖 Model: {self.model_name}")
            logger.info(f"🔑 API Key: {'Set' if api_key else 'None (not required)'}")
            
            # Initialize client with proper parameters - simple approach
            client_kwargs = {
                'api_key': api_key,
                'base_url': base_url
            }
            
            # Add SSL verification settings for HTTPS endpoints with self-signed certificates
            if base_url and base_url.startswith('https://'):
                import httpx
                # Create a custom HTTP client that ignores SSL verification
                http_client = httpx.Client(verify=False)
                client_kwargs['http_client'] = http_client
            
            # Remove None values to avoid issues
            client_kwargs = {k: v for k, v in client_kwargs.items() if v is not None}
            
            self.client = OpenAI(**client_kwargs)
            
            provider_name = self.llm_provider.title()
            endpoint = base_url or "OpenAI default"
            logger.info(f"✅ {provider_name} client initialized successfully!")
            logger.info(f"🔗 Endpoint: {endpoint}")
            logger.info(f"🤖 Model: {self.model_name}")
                
        except ImportError as e:
            logger.warning(f"OpenAI library not installed: {e}, falling back to mock responses")
        except Exception as e:
            logger.error(f"Error initializing LLM client: {e}, falling back to mock responses")
    
    async def make_agent_decision(self, agent_id: str, agent_name: str, 
                           position: Dict[str, float], observations: List[str], 
                           memories: List[str], world_objects: List[Dict[str, Any]], 
                           system_prompt: str = None, sensory_data: Dict[str, Any] = None) -> Dict[str, Any]:
        """Make a decision for an agent using LLM"""
        
        logger.info(f"🤖 {agent_name} deciding at ({position['x']:.1f}, {position['z']:.1f}) - obs:{len(observations)} mem:{len(memories)} obj:{len(world_objects)}")
        
        # Store sensory data for time access
        self._current_sensory_data = sensory_data
        
        # Create the prompt
        prompt = self._create_decision_prompt(
            agent_id, agent_name, position, 
            observations, memories, world_objects
        )
        
        # Log prompt summary for debugging (full prompt only in debug mode)
        logger.debug(f"📝 Full prompt for {agent_name}:")
        logger.debug(f"--- PROMPT START ---")
        logger.debug(prompt)
        logger.debug(f"--- PROMPT END ---")
        logger.info(f"📝 Prompt length: {len(prompt)} chars for {agent_name}")
        
        try:
            if self.client:
                logger.info(f"🔄 Calling LLM API for {agent_name}...")
                decision = await self._call_llm_api(prompt, system_prompt)
                logger.debug(f"📥 Raw LLM response for {agent_name}: {decision}")
                logger.info(f"🎯 {agent_name} decided: {decision['action']} -> {decision.get('target', 'N/A')}")
                return decision
            else:
                logger.warning(f"⚠️  No LLM client, using MOCK for {agent_name}")
                decision = self._mock_decision(agent_name, observations, position)
                logger.info(f"🎭 MOCK {agent_name}: {decision['action']} -> {decision.get('target', 'N/A')}")
                return decision
        except Exception as e:
            logger.error(f"❌ LLM error for {agent_name}: {e}")
            decision = self._mock_decision(agent_name, observations, position)
            logger.info(f"🎭 FALLBACK {agent_name}: {decision['action']} -> {decision.get('target', 'N/A')}")
            return decision
    
    def _create_decision_prompt(self, agent_id: str, agent_name: str,
                               position: Dict[str, float], observations: List[str], 
                               memories: List[str], world_objects: List[Dict[str, Any]]) -> str:
        """Create the decision prompt for the LLM - focuses on current state only"""
        
        # Format observations
        obs_text = "\n".join([f"- {obs}" for obs in observations]) if observations else "- No specific observations"
        
        # Format memories
        mem_text = "\n".join([f"- {mem}" for mem in memories]) if memories else "- No recent memories"
        
        # Format world objects
        world_objects_text = ""
        for obj in world_objects:
            world_objects_text += f"- {obj['name']} at ({obj['position']['x']:.1f}, {obj['position']['y']:.1f})\n"
        
        if not world_objects_text:
            world_objects_text = "- No world objects visible"
        
        # Get simulation time from sensory data if available
        simulation_time = int(time.time())  # Default to backend time
        if hasattr(self, '_current_sensory_data') and self._current_sensory_data:
            simulation_time = int(self._current_sensory_data.get('simulationTime', time.time()) / 1000)  # Convert from milliseconds
        
        prompt = f"""Current State:
Position: ({position['x']:.1f}, {position['z']:.1f}). Time: {simulation_time}

Observations:
{obs_text}

Memory (last items):
{mem_text}

World Objects:
{world_objects_text}"""
        
        return prompt
    
    async def _call_llm_api(self, prompt: str, system_prompt: str = None) -> Dict[str, Any]:
        """Call LLM API using OpenAI Chat Completions format"""
        try:
            import asyncio
            
            # Use provided system prompt or fallback to default
            system_content = system_prompt or f"You are an AI agent. {self.config.ENVIRONMENT_CONTEXT}"
            
            # Run the synchronous API call in a thread pool to make it async
            response = await asyncio.to_thread(
                self.client.chat.completions.create,
                model=self.model_name,
                messages=[
                    {"role": "system", "content": system_content},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=200,
                temperature=0.7
            )
            
            content = response.choices[0].message.content.strip()
            logger.debug(f"📨 Raw LLM response: {content}")
            
            if not content:
                logger.error("❌ Empty response from LLM")
                return self._fallback_decision()
            
            # Clean up common LLM response formats
            if content.startswith('```json'):
                content = content.replace('```json', '').replace('```', '').strip()
            elif content.startswith('```'):
                content = content.replace('```', '').strip()
            
            # Parse JSON - fail fast if invalid
            decision = json.loads(content)
            return decision
            
        except json.JSONDecodeError as e:
            logger.error(f"❌ JSON parse error: {e}")
            logger.error(f"📄 Raw response was: '{content}'")
            return self._fallback_decision()
        except Exception as e:
            logger.error(f"❌ API error: {e}")
            return self._fallback_decision()
    
    def _mock_decision(self, agent_name: str, observations: List[str], position: Dict[str, float]) -> Dict[str, Any]:
        """Fallback mock decision when LLM is not available"""
        import random
        
        # Simple rule-based decision making
        if any("coin" in obs.lower() for obs in observations):
            return {
                "action": "move",
                "target": {"x": position['x'] + random.uniform(-2, 2), "z": position['z'] + random.uniform(-2, 2)},
                "utterance": None,
                "mem_update": "Looking for coins to collect"
            }
        elif any("Agent-" in obs for obs in observations):
            if random.random() < 0.5:
                return {
                    "action": "say",
                    "target": None,
                    "utterance": "Hello there! How's your coin hunting going?",
                    "mem_update": "Greeted another agent"
                }
            else:
                return {
                    "action": "move",
                    "target": {"x": position['x'] + random.uniform(-3, 3), "z": position['z'] + random.uniform(-3, 3)},
                    "utterance": None,
                    "mem_update": "Continuing exploration after seeing another agent"
                }
        else:
            return {
                "action": "move",
                "target": {"x": position['x'] + random.uniform(-2, 2), "z": position['z'] + random.uniform(-2, 2)},
                "utterance": None,
                "mem_update": "Exploring the area systematically"
            }
    
    def _fallback_decision(self) -> Dict[str, Any]:
        """Ultimate fallback decision"""
        return {
            "action": "idle",
            "target": None,
            "utterance": None,
            "mem_update": "Taking a moment to think"
        }
