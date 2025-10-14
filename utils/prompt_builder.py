"""
Centralized System Prompt Builder
Generates system prompts dynamically from configuration data
"""
from typing import Dict, Any, List
from config import Config


class PromptBuilder:
    """Builds system prompts dynamically from configuration"""
    
    @staticmethod
    def build_system_prompt(agent_name: str, personality: str, other_agents: List[Dict[str, str]] = None) -> str:
        """
        Build a complete system prompt for an agent
        
        Args:
            agent_name: Name of the agent (e.g., "Alice", "Bob")
            personality: Personality description of the agent
            other_agents: List of other agents with their info
                         [{"name": "Bob", "personality": "..."}, ...]
        
        Returns:
            Complete system prompt string
        """
        # Build personality section
        personality_section = f"PERSONALITY: You are {agent_name}, {personality}. Act consistently with this personality in all your actions and communications."
        
        # Build other agents section
        other_agents_section = PromptBuilder.build_other_agents_section(other_agents or [])
        
        # Combine all sections
        system_prompt = f"""{personality_section}

{other_agents_section}
{Config.ENVIRONMENT_CONTEXT}

{Config.RESPONSE_FORMAT}"""
        
        return system_prompt
    
    @staticmethod
    def build_other_agents_section(other_agents: List[Dict[str, str]]) -> str:
        """
        Build the 'OTHER AGENTS IN THE WORLD' section
        
        Args:
            other_agents: List of dictionaries with 'name' and 'personality' keys
        
        Returns:
            Formatted string for the other agents section
        """
        if not other_agents:
            return ""
        
        lines = ["OTHER AGENTS IN THE WORLD:"]
        for agent_info in other_agents:
            name = agent_info.get('name', 'Unknown')
            personality = agent_info.get('personality', 'an AI agent')
            lines.append(
                f"- {name}: {personality}. You can text {name} anytime using the 'text' action with target {{\"agent\": \"{name}\"}}."
            )
        
        return "\n".join(lines)

