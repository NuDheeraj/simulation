"""
Agent routes for AI Agents Simulation
"""
from flask import Blueprint, request, jsonify
from services.agent_service import AgentService
from services.conversation_service import ConversationService
from utils.logger import setup_logger, setup_agent_logger
from utils.validators import validate_message, validate_agent_id
from config import Config
import time
import os

logger = setup_logger()

agent_bp = Blueprint('agents', __name__, url_prefix='/api/agents')

# Initialize services (these would typically be injected or managed by a factory)
agent_service = None
conversation_service = None

def init_services(agents_config, app=None):
    """Initialize services with agent configuration"""
    global agent_service, conversation_service
    agent_service = AgentService(agents_config)
    conversation_service = ConversationService()
    
    # Store service reference in app config for cleanup
    if app:
        app.config['AGENT_SERVICE'] = agent_service

@agent_bp.route('/')
def get_agents():
    """Get all available agents"""
    try:
        if not agent_service:
            logger.error("Agent service not initialized")
            return jsonify({"error": "Service not initialized"}), 500
        
        agents = agent_service.get_all_agents()
        logger.info(f"Retrieved {len(agents)} agents")
        return jsonify(agents)
        
    except Exception as e:
        logger.error(f"Error in get_agents: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@agent_bp.route('/<agent_id>/conversation')
def get_conversation(agent_id):
    """Get conversation history for an agent (agent-to-agent communication)"""
    if not conversation_service:
        return jsonify({"error": "Service not initialized"}), 500
    
    if not agent_service or not agent_service.agent_exists(agent_id):
        return jsonify({"error": "Agent not found"}), 404
    
    conversation_history = conversation_service.get_conversation_history(agent_id)
    
    return jsonify({
        "agent_id": agent_id,
        "conversation": conversation_history
    })

@agent_bp.route('/simulation/start', methods=['POST'])
def start_simulation():
    """Start the agent simulation"""
    try:
        if not agent_service:
            return jsonify({"error": "Service not initialized"}), 500
        
        agent_service.start_simulation()
        logger.info("Simulation started via API")
        return jsonify({"message": "Simulation started successfully"})
        
    except Exception as e:
        logger.error(f"Error starting simulation: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@agent_bp.route('/simulation/stop', methods=['POST'])
def stop_simulation():
    """Stop the agent simulation"""
    try:
        if not agent_service:
            return jsonify({"error": "Service not initialized"}), 500
        
        agent_service.stop_simulation()
        logger.info("Simulation stopped via API")
        return jsonify({"message": "Simulation stopped successfully"})
        
    except Exception as e:
        logger.error(f"Error stopping simulation: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@agent_bp.route('/simulation/state')
def get_simulation_state():
    """Get current simulation state"""
    try:
        if not agent_service:
            return jsonify({"error": "Service not initialized"}), 500
        
        state = agent_service.get_simulation_state()
        return jsonify(state)
        
    except Exception as e:
        logger.error(f"Error getting simulation state: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@agent_bp.route('/simulation/reset', methods=['POST'])
def reset_simulation():
    """Reset the simulation"""
    try:
        if not agent_service:
            return jsonify({"error": "Service not initialized"}), 500
        
        # Reset agent brains (clears memories, observations, state)
        agent_service.reset_simulation()
        
        # Reset all conversations
        if conversation_service:
            for agent_id in agent_service.get_all_agents().keys():
                conversation_service.reset_conversation(agent_id)
            logger.info("All conversations cleared")
        
        logger.info("Simulation reset via API - all state cleared")
        return jsonify({"message": "Simulation reset successfully"})
        
    except Exception as e:
        logger.error(f"Error resetting simulation: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@agent_bp.route('/<agent_id>/force-decision', methods=['POST'])
def force_agent_decision(agent_id):
    """Force an agent to make a decision immediately"""
    try:
        if not agent_service:
            return jsonify({"error": "Service not initialized"}), 500
        
        if not agent_service.agent_exists(agent_id):
            return jsonify({"error": "Agent not found"}), 404
        
        decision = agent_service.force_agent_decision(agent_id)
        if decision:
            logger.info(f"Forced decision for agent {agent_id}: {decision}")
            return jsonify({"agent_id": agent_id, "decision": decision})
        else:
            return jsonify({"error": "Failed to force decision"}), 500
        
    except Exception as e:
        logger.error(f"Error forcing agent decision: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500



@agent_bp.route('/<agent_id>/brain/decide', methods=['POST'])
def brain_decide(agent_id):
    """Brain decision endpoint - receives sensory data and returns decision"""
    try:
        # Get agent name for consistent logging
        agent = agent_service.get_agent(agent_id)
        agent_name = agent.name if agent else agent_id
        
        # Setup agent-specific logger
        agent_logger = setup_agent_logger(agent_name)
        
        agent_logger.info(f"🧠 Brain decision request for {agent_name}")
        
        if not agent_service:
            logger.error("Service not initialized")
            return jsonify({"error": "Service not initialized"}), 500
        
        if not agent_service.agent_exists(agent_id):
            logger.error(f"Agent {agent_name} not found")
            return jsonify({"error": "Agent not found"}), 404
        
        data = request.get_json()
        if not data or 'sensory_data' not in data:
            logger.error("Sensory data required")
            return jsonify({"error": "Sensory data required"}), 400
        
        sensory_data = data['sensory_data']
        agent_logger.debug(f"📊 Sensory data for {agent_name}: {sensory_data}")
        
        # Make decision based on sensory input (now with proper async waiting)
        import asyncio
        agent_logger.info(f"🤔 Making decision for {agent_name}...")
        decision = asyncio.run(agent.make_decision_from_sensory_data(sensory_data))
        
        agent_logger.info(f"✅ Decision made: {decision['action']} -> {decision.get('target', 'N/A')}")
        return jsonify({"agent_id": agent_id, "decision": decision})
        
    except Exception as e:
        logger.error(f"Error in brain decision: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@agent_bp.route('/<agent_id>/brain/action-complete', methods=['POST'])
def brain_action_complete(agent_id):
    """Report action completion to brain"""
    try:
        # Get agent name for consistent logging
        agent = agent_service.get_agent(agent_id)
        agent_name = agent.name if agent else agent_id
        
        # Setup agent-specific logger
        agent_logger = setup_agent_logger(agent_name)
        
        agent_logger.info(f"🏁 Action completion report for {agent_name}")
        
        if not agent_service:
            logger.error("Service not initialized")
            return jsonify({"error": "Service not initialized"}), 500
        
        if not agent_service.agent_exists(agent_id):
            logger.error(f"Agent {agent_name} not found")
            return jsonify({"error": "Agent not found"}), 404
        
        data = request.get_json()
        if not data or 'action_type' not in data:
            logger.error("Action type required")
            return jsonify({"error": "Action type required"}), 400
        
        action_type = data['action_type']
        result = data.get('result', {})
        logger.debug(f"📋 Action completion data: {data}")
        
        # Get the brain coordination service and report action completion
        brain_service = agent_service.get_brain_coordination_service()
        brain_service.report_action_completion(agent_id, action_type, result.get('final_position'))
        
        agent_logger.info(f"Brain {agent_name} processed {action_type} completion")
        return jsonify({"message": "Action completion processed", "agent_id": agent_id})
        
    except Exception as e:
        logger.error(f"Error processing action completion: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@agent_bp.route('/llm/test', methods=['POST'])
def test_llm_connection():
    """Test LLM connection"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        url = data.get('url', '').strip()
        model = data.get('model', '').strip()
        api_key = data.get('apiKey', '').strip()
        
        if not url:
            return jsonify({"error": "LLM URL is required"}), 400
        
        if not model:
            return jsonify({"error": "Model name is required"}), 400
        
        # Test the connection
        try:
            from openai import OpenAI
            
            # Create test client
            client = OpenAI(
                base_url=url,
                api_key=api_key if api_key else "test-key"
            )
            
            # Make a simple test call
            response = client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": "test"}],
                max_tokens=5,
                timeout=10
            )
            
            # If we got here, the connection works
            logger.info(f"LLM connection test successful - URL: {url}, Model: {model}")
            
            return jsonify({
                "success": True,
                "message": "Connection successful",
                "model": model
            })
            
        except Exception as e:
            logger.error(f"LLM connection test failed: {str(e)}")
            return jsonify({
                "success": False,
                "error": str(e)
            }), 400
        
    except Exception as e:
        logger.error(f"Error testing LLM connection: {str(e)}")
        return jsonify({"success": False, "error": "Internal server error"}), 500

@agent_bp.route('/llm/config', methods=['POST'])
def update_llm_config():
    """Update LLM configuration - tests connection first, then saves"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No data provided"}), 400
        
        url = data.get('url', '').strip()
        model = data.get('model', '').strip()
        api_key = data.get('apiKey', '').strip()
        
        if not url:
            return jsonify({"success": False, "error": "LLM URL is required"}), 400
        
        if not model:
            return jsonify({"success": False, "error": "Model name is required"}), 400
        
        # Test the connection first
        try:
            from openai import OpenAI
            
            # Create test client with actual API key (or empty string for local models)
            client = OpenAI(
                base_url=url,
                api_key=api_key if api_key else "not-needed-for-local"
            )
            
            logger.info(f"Testing LLM connection - URL: {url}, Model: {model}")
            
            # Make a simple test call
            response = client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": "Say 'test' if you can read this."}],
                max_tokens=10,
                timeout=10
            )
            
            # Verify we got a valid response structure
            if not response or not response.choices or len(response.choices) == 0:
                logger.error(f"LLM test returned invalid response structure")
                return jsonify({
                    "success": False,
                    "error": "LLM returned invalid response. Check model name and configuration."
                }), 400
            
            # Check if we got a message (content can be empty for some models, but the structure should exist)
            if not hasattr(response.choices[0], 'message'):
                logger.error(f"LLM test returned no message object")
                return jsonify({
                    "success": False,
                    "error": "LLM returned invalid message format. Check model compatibility."
                }), 400
            
            # Get content (can be empty string, special tokens, or actual text - all are valid)
            content = response.choices[0].message.content or ""
            
            # If we got here, the connection works - now save it
            logger.info(f"LLM connection test successful - URL: {url}, Model: {model}, Response: '{content[:50] if content else '(empty response)'}'")
            logger.info(f"LLM is responding correctly - ready to use")
            
        except Exception as e:
            error_msg = str(e)
            logger.error(f"LLM connection test failed: {error_msg}")
            
            # Provide more specific error messages
            if "401" in error_msg or "authentication" in error_msg.lower() or "unauthorized" in error_msg.lower():
                return jsonify({
                    "success": False,
                    "error": "Authentication failed. Please check your API key."
                }), 400
            elif "404" in error_msg or "not found" in error_msg.lower():
                return jsonify({
                    "success": False,
                    "error": "Model not found. Please check the model name."
                }), 400
            elif "timeout" in error_msg.lower() or "timed out" in error_msg.lower():
                return jsonify({
                    "success": False,
                    "error": "Connection timeout. LLM server not responding."
                }), 400
            elif "connection" in error_msg.lower():
                return jsonify({
                    "success": False,
                    "error": f"Cannot connect to LLM server. Check URL: {error_msg}"
                }), 400
            else:
                return jsonify({
                    "success": False,
                    "error": f"Test failed: {error_msg}"
                }), 400
        
        # Update environment variables (for current session)
        os.environ['LLM_BASE_URL'] = url
        os.environ['LLM_MODEL'] = model
        if api_key:
            os.environ['LLM_API_KEY'] = api_key
        
        # Update Config class attributes
        Config.LLM_BASE_URL = url
        Config.LLM_MODEL = model
        if api_key:
            Config.LLM_API_KEY = api_key
        
        logger.info(f"LLM configuration updated successfully - URL: {url}, Model: {model}")
        
        return jsonify({
            "success": True,
            "message": "Configuration saved successfully!",
            "config": {
                "url": url,
                "model": model,
                "hasApiKey": bool(api_key)
            }
        })
        
    except Exception as e:
        logger.error(f"Error updating LLM config: {str(e)}")
        return jsonify({"success": False, "error": "Internal server error"}), 500

@agent_bp.route('/<agent_id>/personality', methods=['PUT'])
def update_agent_personality(agent_id):
    """Update agent personality configuration"""
    try:
        if not agent_service:
            logger.error("Agent service not initialized")
            return jsonify({"error": "Service not initialized"}), 500
        
        # Get agent
        agent = agent_service.get_agent(agent_id)
        if not agent:
            logger.error(f"Agent not found: {agent_id}")
            return jsonify({"error": "Agent not found"}), 404
        
        # Get request data
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # Update personality and generate system prompt
        if 'personality' in data:
            personality_text = data['personality'].strip()
            if not personality_text:
                return jsonify({"error": "Personality description cannot be empty"}), 400
            
            # Update personality
            agent.personality = personality_text
            
            # Generate system prompt based on personality
            agent.system_prompt = f"""PERSONALITY: You are {agent.name}, {personality_text}. Act consistently with this personality in all your actions and communications.

{Config.ENVIRONMENT_CONTEXT}

{Config.RESPONSE_FORMAT}"""
            
            logger.info(f"Updated {agent.name} personality to: {personality_text}")
            logger.info(f"Generated new system prompt for {agent.name}")
            
            return jsonify({
                "success": True,
                "message": f"Updated personality for {agent.name}",
                "agent": agent.to_dict()
            })
        else:
            return jsonify({"error": "No personality data provided"}), 400
        
    except Exception as e:
        logger.error(f"Error updating agent personality: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500
