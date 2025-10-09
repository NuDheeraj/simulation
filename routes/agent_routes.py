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
        
        agent_service.reset_simulation()
        logger.info("Simulation reset via API")
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
        
        logger.debug(f"🧠 Brain decision request for {agent_name}")
        
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
        logger.debug(f"📊 Sensory data for {agent_name}: {sensory_data}")
        
        # Make decision based on sensory input (now with proper async waiting)
        import asyncio
        logger.debug(f"🤔 Making decision for {agent_name}...")
        decision = asyncio.run(agent.make_decision_from_sensory_data(sensory_data))
        
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
        
        logger.debug(f"🏁 Action completion report for {agent_name}")
        
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
        
        logger.info(f"Brain {agent_name} processed {action_type} completion")
        logger.debug(f"✅ Action completion processed for {agent_name}")
        return jsonify({"message": "Action completion processed", "agent_id": agent_id})
        
    except Exception as e:
        logger.error(f"Error processing action completion: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500
