"""
LLM Service for AI Agent decision making
Uses OpenAI Chat Completions API format for all providers
"""
import os
import json
import time
import asyncio
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
    
    def update_configuration(self):
        """Reinitialize the LLM service with updated configuration from Config class"""
        logger.info("🔄 Updating LLM service configuration...")
        # Reload config from Config class (which should be updated)
        self.config = Config()
        self.llm_provider = self.config.LLM_PROVIDER.lower()
        self.model_name = self._get_model_name()
        # Reinitialize the client with new config
        self._initialize_client()
        logger.info(f"✅ LLM service configuration updated - Model: {self.model_name}, URL: {self.config.LLM_BASE_URL}")
    
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
            # Also configure connection limits for parallel requests
            import httpx
            if base_url and base_url.startswith('https://'):
                # Create a custom HTTP client that ignores SSL verification
                http_client = httpx.Client(
                    verify=False,
                    limits=httpx.Limits(max_connections=10, max_keepalive_connections=5)
                )
                client_kwargs['http_client'] = http_client
            else:
                # For HTTP, still set connection limits for parallel requests
                http_client = httpx.Client(
                    limits=httpx.Limits(max_connections=10, max_keepalive_connections=5)
                )
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
                           conversation_history: List[Dict[str, Any]] = None,
                           num_new_messages: int = 0,
                           system_prompt: str = None, sensory_data: Dict[str, Any] = None, 
                           agent_logger = None) -> Dict[str, Any]:
        """Make a decision for an agent using LLM"""
        
        # Use agent logger if provided, otherwise use main logger
        log = agent_logger if agent_logger else logger
        log.info(f"🤖 {agent_name} deciding at ({position['x']:.1f}, {position['z']:.1f}) - obs:{len(current_observations)} action_mem:{len(action_memories)} obs_mem:{len(observation_memories)}")
        
        # Store sensory data for time access
        self._current_sensory_data = sensory_data
        
        # Create the prompt
        prompt = self._create_decision_prompt(
            agent_id, agent_name, position, 
            current_observations, action_memories, observation_memories,
            conversation_history, num_new_messages
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
    
    def _format_action_readable(self, action: Dict[str, Any]) -> str:
        """Convert action decision to human-readable text (first-person)"""
        action_type = action.get('action', 'unknown')
        target = action.get('target')
        utterance = action.get('utterance')
        
        if action_type == 'move':
            if target and 'x' in target and 'z' in target:
                return f"I moved to position ({target['x']:.1f}, {target['z']:.1f})"
            return "I moved to a location"
        elif action_type == 'text':
            if target and 'agent' in target and utterance:
                return f"I texted {target['agent']}: \"{utterance}\""
            return "I sent a text message"
        elif action_type == 'idle':
            return "I rested and observed my surroundings"
        else:
            return f"I performed action: {action_type}"
    
    def _format_observation_readable(self, obs: Dict[str, Any], is_current: bool = False) -> str:
        """Convert observation data to human-readable text (first-person)"""
        parts = []
        
        # Check if all coins are collected
        all_coins_collected = obs.get('allCoinsCollected', False)
        
        # Position and coins collected
        pos = obs.get('position', {})
        coins = obs.get('coinsCollected', 0)
        if pos:
            if is_current:
                parts.append(f"I am at position ({pos.get('x', 0):.1f}, {pos.get('z', 0):.1f}), have collected {coins} coin{'s' if coins != 1 else ''}")
            else:
                parts.append(f"I was at position ({pos.get('x', 0):.1f}, {pos.get('z', 0):.1f}), had collected {coins} coin{'s' if coins != 1 else ''}")
        
        # Add all coins collected message
        if all_coins_collected and is_current:
            parts.append("🎉 ALL COINS HAVE BEEN COLLECTED! The coin collection goal is complete. You can now just chat and socialize with other agents.")
        
        # World objects (coins, landmarks)
        world_objects = obs.get('worldObjects', [])
        if world_objects:
            coins_seen = [obj for obj in world_objects if obj.get('name') == 'coin']
            if coins_seen:
                verb = "see" if is_current else "saw"
                if len(coins_seen) == 1:
                    c = coins_seen[0]
                    parts.append(f"I {verb} 1 coin at ({c['position']['x']:.1f}, {c['position']['z']:.1f}) distance {c['distance']:.1f}")
                else:
                    coin_locs = ", ".join([f"({c['position']['x']:.1f}, {c['position']['z']:.1f})" for c in coins_seen[:3]])
                    parts.append(f"I {verb} {len(coins_seen)} coins at: {coin_locs}")
        else:
            if not all_coins_collected or not is_current:
                verb = "see" if is_current else "saw"
                parts.append(f"I {verb} no coins nearby")
        
        # Nearby agents
        nearby = obs.get('nearbyAgents', [])
        if nearby:
            verb = "see" if is_current else "saw"
            agent_names = ", ".join([a.get('name', 'unknown') for a in nearby])
            parts.append(f"I {verb} agents: {agent_names}")
        else:
            verb = "see" if is_current else "saw"
            parts.append(f"I {verb} no other agents")
        
        return "; ".join(parts) if parts else "No specific observations"
    
    def _create_decision_prompt(self, agent_id: str, agent_name: str,
                               position: Dict[str, float], current_observations: List[str], 
                               action_memories: List[str], observation_memories: List[str],
                               conversation_history: List[Dict[str, Any]] = None,
                               num_new_messages: int = 0) -> str:
        """Create the decision prompt for the LLM with human-readable format"""
        
        # Extract sensory data
        sensory_data = self._current_sensory_data if hasattr(self, '_current_sensory_data') else {}
        simulation_time = int(sensory_data.get('simulationTime', 0))
        
        # Split conversation_history into current (new) and past messages
        conversation_history = conversation_history or []
        
        # Format CURRENT conversations (just received this moment) - last N messages in history
        current_conversation = ""
        if num_new_messages > 0 and len(conversation_history) >= num_new_messages:
            new_messages = conversation_history[-num_new_messages:]
            current_conversation = "\n".join([
                f"- {msg.get('speaker', 'Unknown')}: \"{msg.get('message', '')}\""
                for msg in new_messages
            ])
        else:
            current_conversation = "- No new messages"
        
        # Format current observations in human-readable format (present tense)
        obs_text = self._format_observation_readable(sensory_data, is_current=True)
        
        # Format action memories in human-readable format
        action_texts = []
        for mem in action_memories:
            time_s = mem.get('simulation_time', 0)
            decision = mem.get('decision', {})
            readable_action = self._format_action_readable(decision)
            action_texts.append(f"- At time {time_s}s {readable_action}")
        action_mem_text = "\n".join(action_texts) if action_texts else "- No recent actions"
        
        # Format past conversations (exclude the new messages we just showed above)
        if num_new_messages > 0 and len(conversation_history) > num_new_messages:
            # Exclude the last N messages (they're the new ones shown in current_conversation)
            past_messages = [
                f"- At time {msg['time']}s {msg['speaker']} said: \"{msg['message']}\""
                for msg in conversation_history[:-num_new_messages]
            ]
            past_conversation_text = "\n".join(past_messages) if past_messages else "- No past messages"
        elif num_new_messages == 0 and conversation_history:
            # No new messages, show all history as past
            past_messages = [
                f"- At time {msg['time']}s {msg['speaker']} said: \"{msg['message']}\""
                for msg in conversation_history
            ]
            past_conversation_text = "\n".join(past_messages)
        else:
            # Either no history or all history is new messages
            past_conversation_text = "- No past messages"
        
        # Format observation memories in human-readable format (simplified - no conversation extraction!)
        obs_texts = []
        for mem in observation_memories:
            time_s = mem.get('simulationTime', 0)
            readable_obs = self._format_observation_readable(mem)
            obs_texts.append(f"- At time {time_s}s {readable_obs}")
        
        obs_mem_text = "\n".join(obs_texts) if obs_texts else "- No recent observations"
        
        prompt = f"""Current State:
Position: ({position['x']:.1f}, {position['z']:.1f}). Simulation Time: {simulation_time}s

Current Observations (what YOU personally see right now):
{obs_text}

Current Conversation (messages OTHER agents sent YOU):
{current_conversation}

Past Actions (what YOU decided to do):
{action_mem_text}

Past Observations (what YOU personally saw before):
{obs_mem_text}

Past Conversations (messages from OTHER agents):
{past_conversation_text}
"""
        
        return prompt
    
    async def _call_llm_api(self, prompt: str, system_prompt: str = None) -> Dict[str, Any]:
        """Call LLM API using OpenAI Chat Completions format with function calling"""
        try:
            
            # Use provided system prompt or fallback to default
            system_content = system_prompt or f"You are an AI agent. {self.config.ENVIRONMENT_CONTEXT}"
            
            # Check if all coins are collected from sensory data
            sensory_data = self._current_sensory_data if hasattr(self, '_current_sensory_data') else {}
            all_coins_collected = sensory_data.get('allCoinsCollected', False)
            
            # Adjust tool descriptions based on coin collection status
            if all_coins_collected:
                move_description = "Move to a specific position in the world to explore."
                idle_description = "Rest, think, and observe for 5 seconds. Since all coins are collected, you can idle and chat."
            else:
                move_description = "Move to a specific position in the world. Use this to explore and collect coins."
                idle_description = "Rest, think, and observe for 5 seconds"
            
            # Define separate function schemas for each action type
            tools = [
                {
                    "type": "function",
                    "function": {
                        "name": "move",
                        "description": move_description,
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
                        "name": "text",
                        "description": "Send a text message to another agent. Works at any distance. Use frequently to communicate based on your personality.",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "agent": {
                                    "type": "string",
                                    "description": "Name of the agent to text"
                                },
                                "message": {
                                    "type": "string",
                                    "description": "Your message content only (don't include your own name or 'Bob:' or 'Alice:' prefix - the recipient knows who you are)"
                                }
                            },
                            "required": ["agent", "message"]
                        }
                    }
                },
                {
                    "type": "function",
                    "function": {
                        "name": "idle",
                        "description": idle_description,
                        "parameters": {
                            "type": "object",
                            "properties": {},
                            "required": []
                        }
                    }
                }
            ]
            
            # Run the synchronous API call in a thread pool to make it async
            start_time = time.time()
            
            response = await asyncio.to_thread(
                self.client.chat.completions.create,
                model=self.model_name,
                messages=[
                    {"role": "system", "content": system_content},
                    {"role": "user", "content": prompt}
                ],
                tools=tools,
                tool_choice="auto",  # Let the model decide when to use tools (compatible with more models)
                max_tokens=500,
                temperature=0.7,
                timeout=30.0  # 30 second timeout for parallel requests
            )
            
            elapsed = time.time() - start_time
            logger.info(f"⏱️  LLM API call took {elapsed:.2f}s")
            
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
        if function_name == "move":
            return {
                "action": "move",
                "target": {"x": args["x"], "z": args["z"]},
                "utterance": None
            }
        elif function_name == "text":
            return {
                "action": "text",
                "target": {"agent": args["agent"]},
                "utterance": args["message"]
            }
        elif function_name == "idle":
            return {
                "action": "idle",
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
                other_agent = "Bob" if agent_name == "Alice" else "Alice"
                return {
                    "action": "text",
                    "target": {"agent": other_agent},
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
