"""
Validation utilities for AI Agents Simulation
"""
from typing import Dict, Any, List, Optional

def validate_agent_config(config: Dict[str, Any]) -> List[str]:
    """Validate agent configuration and return list of errors"""
    errors = []
    
    required_fields = ['name', 'personality', 'system_prompt', 'color', 'position']
    for field in required_fields:
        if field not in config:
            errors.append(f"Missing required field: {field}")
    
    # Validate position
    if 'position' in config:
        position = config['position']
        if not isinstance(position, dict):
            errors.append("Position must be a dictionary")
        else:
            required_coords = ['x', 'y', 'z']
            for coord in required_coords:
                if coord not in position:
                    errors.append(f"Missing position coordinate: {coord}")
                elif not isinstance(position[coord], (int, float)):
                    errors.append(f"Position coordinate {coord} must be a number")
    
    # Validate color
    if 'color' in config:
        valid_colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'gray']
        if config['color'] not in valid_colors:
            errors.append(f"Invalid color. Must be one of: {', '.join(valid_colors)}")
    
    # Validate string fields
    string_fields = ['name', 'personality', 'system_prompt']
    for field in string_fields:
        if field in config and not isinstance(config[field], str):
            errors.append(f"{field} must be a string")
        elif field in config and len(config[field].strip()) == 0:
            errors.append(f"{field} cannot be empty")
    
    return errors

def validate_message(message: str) -> List[str]:
    """Validate user message and return list of errors"""
    errors = []
    
    if not isinstance(message, str):
        errors.append("Message must be a string")
    elif len(message.strip()) == 0:
        errors.append("Message cannot be empty")
    elif len(message) > 1000:
        errors.append("Message too long (max 1000 characters)")
    
    return errors

def validate_agent_id(agent_id: str) -> List[str]:
    """Validate agent ID and return list of errors"""
    errors = []
    
    if not isinstance(agent_id, str):
        errors.append("Agent ID must be a string")
    elif len(agent_id.strip()) == 0:
        errors.append("Agent ID cannot be empty")
    elif not agent_id.replace('_', '').replace('-', '').isalnum():
        errors.append("Agent ID must contain only alphanumeric characters, underscores, and hyphens")
    
    return errors
