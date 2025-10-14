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
                           position: Dict[str, float], current_observations: List[str], 
                           action_memories: List[str], observation_memories: List[str], 
                           system_prompt: str = None, sensory_data: Dict[str, Any] = None, agent_logger = None) -> Dict[str, Any]:
        """Make a decision for an agent using LLM"""
        
        # Use agent logger if provided, otherwise use main logger
        log = agent_logger if agent_logger else logger
        log.info(f"🤖 {agent_name} deciding at ({position['x']:.1f}, {position['z']:.1f}) - obs:{len(current_observations)} action_mem:{len(action_memories)} obs_mem:{len(observation_memories)}")
        
        # Store sensory data for time access
        self._current_sensory_data = sensory_data
        
        # Create the prompt
        prompt = self._create_decision_prompt(
            agent_id, agent_name, position, 
            current_observations, action_memories, observation_memories
        )
        
        # Log prompt summary for debugging (full prompt only in debug mode)
        log.debug(f"📝 Full prompt for {agent_name}:")
        log.debug(f"--- PROMPT START ---")
        log.debug(prompt)
        log.debug(f"--- PROMPT END ---")
        log.info(f"📝 Prompt length: {len(prompt)} chars for {agent_name}")
        
        try:
            if self.client:
                log.info(f"🔄 Calling LLM API for {agent_name}...")
                decision = await self._call_llm_api(prompt, system_prompt)
                log.debug(f"📥 Raw LLM response for {agent_name}: {decision}")
                log.info(f"🎯 {agent_name} decided: {decision['action']} -> {decision.get('target', 'N/A')}")
                return decision
            else:
                log.warning(f"⚠️  No LLM client, using MOCK for {agent_name}")
                decision = self._mock_decision(agent_name, current_observations, position)
                log.info(f"🎭 MOCK {agent_name}: {decision['action']} -> {decision.get('target', 'N/A')}")
                return decision
        except Exception as e:
            log.error(f"❌ LLM error for {agent_name}: {e}")
            decision = self._mock_decision(agent_name, current_observations, position)
            log.info(f"🎭 FALLBACK {agent_name}: {decision['action']} -> {decision.get('target', 'N/A')}")
            return decision
    
    def _create_decision_prompt(self, agent_id: str, agent_name: str,
                               position: Dict[str, float], current_observations: List[str], 
                               action_memories: List[str], observation_memories: List[str]) -> str:
        """Create the decision prompt for the LLM with simplified memory structure"""
        
        # Format current observations (what agent sees right now)
        obs_text = "\n".join([f"- {obs}" for obs in current_observations]) if current_observations else "- No specific observations"
        
        # Format action memories (raw LLM decisions) - show all stored memories
        action_mem_text = "\n".join([f"- Time {mem['simulation_time']}s: {mem['decision']}" for mem in action_memories]) if action_memories else "- No recent actions"
        
        # Format observation memories (raw sensory data) - show all stored memories
        obs_mem_text = "\n".join([f"- Time {mem.get('simulationTime', 0)}s: {mem}" for mem in observation_memories]) if observation_memories else "- No recent observations"
        
        # Get simulation time from sensory data
        simulation_time = 0
        if hasattr(self, '_current_sensory_data') and self._current_sensory_data:
            simulation_time = int(self._current_sensory_data.get('simulationTime', 0))
        
        prompt = f"""Current State:
Position: ({position['x']:.1f}, {position['z']:.1f}). Simulation Time: {simulation_time}s

Current Observations:
{obs_text}

Past Actions (what I decided to do):
{action_mem_text}

Past Observations (what I saw before):
{obs_mem_text}"""
        
        return prompt
    
    async def _call_llm_api(self, prompt: str, system_prompt: str = None) -> Dict[str, Any]:
        """Call LLM API using OpenAI Chat Completions format with function calling"""
        try:
            import asyncio
            
            # Use provided system prompt or fallback to default
            system_content = system_prompt or f"You are an AI agent. {self.config.ENVIRONMENT_CONTEXT}"
            
            # Define separate function schemas for each action type
            tools = [
                {
                    "type": "function",
                    "function": {
                        "name": "move_to",
                        "description": "Move to a specific position in the world",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "x": {
                                    "type": "number",
                                    "description": "X coordinate (between -4 and 4)"
                                },
                                "z": {
                                    "type": "number",
                                    "description": "Z coordinate (between -4 and 4)"
                                }
                            },
                            "required": ["x", "z"]
                        }
                    }
                },
                {
                    "type": "function",
                    "function": {
                        "name": "say_to",
                        "description": "Say something to a nearby agent",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "agent": {
                                    "type": "string",
                                    "description": "Name of the agent to speak to (e.g., 'Alice', 'Bob')"
                                },
                                "utterance": {
                                    "type": "string",
                                    "description": "What to say (keep under 40 words)"
                                }
                            },
                            "required": ["agent", "utterance"]
                        }
                    }
                },
                {
                    "type": "function",
                    "function": {
                        "name": "idle",
                        "description": "Rest, think, and observe for 5 seconds",
                        "parameters": {
                            "type": "object",
                            "properties": {},
                            "required": []
                        }
                    }
                },
                {
                    "type": "function",
                    "function": {
                        "name": "observe",
                        "description": "Observe the environment and nearby agents",
                        "parameters": {
                            "type": "object",
                            "properties": {},
                            "required": []
                        }
                    }
                }
            ]
            
            # Run the synchronous API call in a thread pool to make it async
            response = await asyncio.to_thread(
                self.client.chat.completions.create,
                model=self.model_name,
                messages=[
                    {"role": "system", "content": system_content},
                    {"role": "user", "content": prompt}
                ],
                tools=tools,
                tool_choice="required",  # Force the model to use tool calls
                max_tokens=500,
                temperature=0.7
            )
            
            message = response.choices[0].message
            
            # Check if the model used tool calls
            if message.tool_calls and len(message.tool_calls) > 0:
                tool_call = message.tool_calls[0]
                function_name = tool_call.function.name
                logger.debug(f"📨 Tool call: {function_name}({tool_call.function.arguments})")
                
                # Parse the function arguments
                args = json.loads(tool_call.function.arguments)
                
                # Convert function call to standard decision format
                decision = self._convert_function_to_decision(function_name, args)
                
                logger.info(f"✅ Successfully parsed tool call: {function_name}")
                return decision
            
            # Fallback: Try parsing content as JSON (for backward compatibility)
            elif message.content:
                content = message.content.strip()
                logger.debug(f"📨 Content response (no tool call): {content}")
                
                if not content:
                    logger.error("❌ Empty response from LLM")
                    return self._fallback_decision()
                
                # Clean up common LLM response formats
                if content.startswith('```json'):
                    content = content.replace('```json', '').replace('```', '').strip()
                elif content.startswith('```'):
                    content = content.replace('```', '').strip()
                
                # Clean up special tokens (e.g., <|channel|>final <|constrain|>JSON<|message|>)
                import re
                # Remove any <|...| > style tokens
                content = re.sub(r'<\|[^|]+\|>[^{]*', '', content).strip()
                
                # Parse JSON
                decision = json.loads(content)
                logger.info(f"✅ Parsed decision from content (fallback mode)")
                return decision
            
            else:
                logger.error("❌ No tool call or content in response")
                return self._fallback_decision()
            
        except json.JSONDecodeError as e:
            logger.error(f"❌ JSON parse error: {e}")
            if 'content' in locals():
                logger.error(f"📄 Raw response was: '{content}'")
            if 'tool_call' in locals():
                logger.error(f"📄 Tool call arguments: '{tool_call.function.arguments}'")
            return self._fallback_decision()
        except Exception as e:
            logger.error(f"❌ API error: {e}")
            logger.error(f"📄 Error type: {type(e).__name__}")
            import traceback
            logger.debug(f"📄 Traceback: {traceback.format_exc()}")
            return self._fallback_decision()
    
    def _convert_function_to_decision(self, function_name: str, args: Dict[str, Any]) -> Dict[str, Any]:
        """Convert function call to standard decision format"""
        if function_name == "move_to":
            return {
                "action": "move",
                "target": {"x": args["x"], "z": args["z"]},
                "utterance": None
            }
        elif function_name == "say_to":
            return {
                "action": "say",
                "target": {"agent": args["agent"]},
                "utterance": args["utterance"]
            }
        elif function_name == "idle":
            return {
                "action": "idle",
                "target": None,
                "utterance": None
            }
        elif function_name == "observe":
            return {
                "action": "observe",
                "target": None,
                "utterance": None
            }
        else:
            logger.warning(f"⚠️  Unknown function: {function_name}, defaulting to idle")
            return self._fallback_decision()
    
    def _mock_decision(self, agent_name: str, current_observations: List[str], position: Dict[str, float]) -> Dict[str, Any]:
        """Fallback mock decision when LLM is not available"""
        import random
        
        # Simple rule-based decision making
        if any("coin" in obs.lower() for obs in current_observations):
            return {
                "action": "move",
                "target": {"x": position['x'] + random.uniform(-2, 2), "z": position['z'] + random.uniform(-2, 2)},
                "utterance": None
            }
        elif any("Agent-" in obs for obs in current_observations):
            if random.random() < 0.5:
                return {
                    "action": "say",
                    "target": None,
                    "utterance": "Hello there! How's your coin hunting going?"
                }
            else:
                return {
                    "action": "move",
                    "target": {"x": position['x'] + random.uniform(-3, 3), "z": position['z'] + random.uniform(-3, 3)},
                    "utterance": None
                }
        else:
            return {
                "action": "move",
                "target": {"x": position['x'] + random.uniform(-2, 2), "z": position['z'] + random.uniform(-2, 2)},
                "utterance": None
            }
    
    def _fallback_decision(self) -> Dict[str, Any]:
        """Ultimate fallback decision"""
        return {
            "action": "idle",
            "target": None,
            "utterance": None
        }
