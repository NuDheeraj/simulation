"""
Agent routes for AI Agents Simulation
"""
from flask import Blueprint, request, jsonify
from services.agent_service import AgentService
from services.conversation_service import ConversationService
from utils.logger import setup_logger
from utils.validators import validate_message, validate_agent_id
import time

logger = setup_logger()

agent_bp = Blueprint('agents', __name__, url_prefix='/api/agents')

# Initialize services (these would typically be injected or managed by a factory)
agent_service = None
conversation_service = None

def init_services(agents_config):
    """Initialize services with agent configuration"""
    global agent_service, conversation_service
    agent_service = AgentService(agents_config)
    conversation_service = ConversationService()

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

@agent_bp.route('/<agent_id>/chat', methods=['POST'])
def chat_with_agent(agent_id):
    """Chat with a specific agent"""
    try:
        if not agent_service or not conversation_service:
            logger.error("Services not initialized")
            return jsonify({"error": "Service not initialized"}), 500
        
        # Validate agent ID
        agent_id_errors = validate_agent_id(agent_id)
        if agent_id_errors:
            logger.warning(f"Invalid agent ID: {agent_id}, errors: {agent_id_errors}")
            return jsonify({"error": "Invalid agent ID"}), 400
        
        if not agent_service.agent_exists(agent_id):
            logger.warning(f"Agent not found: {agent_id}")
            return jsonify({"error": "Agent not found"}), 404
        
        data = request.get_json()
        if not data:
            logger.warning("No JSON data provided")
            return jsonify({"error": "No JSON data provided"}), 400
        
        user_message = data.get('message', '')
        
        # Validate message
        message_errors = validate_message(user_message)
        if message_errors:
            logger.warning(f"Invalid message: {message_errors}")
            return jsonify({"error": "Invalid message", "details": message_errors}), 400
        
        # Get agent and generate response
        agent = agent_service.get_agent(agent_id)
        response = agent.generate_response(user_message)
        
        # Store conversation
        conversation_service.add_message(agent_id, user_message, response)
        
        logger.info(f"Chat message processed for agent {agent_id}")
        
        return jsonify({
            "agent_id": agent_id,
            "agent_name": agent.name,
            "response": response,
            "timestamp": time.time()
        })
        
    except Exception as e:
        logger.error(f"Error in chat_with_agent: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@agent_bp.route('/<agent_id>/conversation')
def get_conversation(agent_id):
    """Get conversation history for an agent"""
    if not conversation_service:
        return jsonify({"error": "Service not initialized"}), 500
    
    if not agent_service or not agent_service.agent_exists(agent_id):
        return jsonify({"error": "Agent not found"}), 404
    
    conversation_history = conversation_service.get_conversation_history(agent_id)
    
    return jsonify({
        "agent_id": agent_id,
        "conversation": conversation_history
    })

@agent_bp.route('/<agent_id>/reset', methods=['POST'])
def reset_conversation(agent_id):
    """Reset conversation history for an agent"""
    if not conversation_service:
        return jsonify({"error": "Service not initialized"}), 500
    
    if not agent_service or not agent_service.agent_exists(agent_id):
        return jsonify({"error": "Agent not found"}), 404
    
    success = conversation_service.reset_conversation(agent_id)
    
    if success:
        return jsonify({"message": "Conversation reset successfully"})
    else:
        return jsonify({"error": "Failed to reset conversation"}), 500
