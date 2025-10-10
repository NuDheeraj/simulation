"""
Logging utilities for AI Agents Simulation
"""
import logging
import os
from datetime import datetime

def setup_logger(name='ai_agents', level=logging.DEBUG):
    """Setup logger with file and console handlers"""
    
    # Create logger
    logger = logging.getLogger(name)
    logger.setLevel(level)
    
    # Avoid duplicate handlers
    if logger.handlers:
        return logger
    
    # Create logs directory if it doesn't exist
    log_dir = 'logs'
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)
    
    # Create formatters
    file_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s'
    )
    console_formatter = logging.Formatter(
        '%(levelname)s - %(message)s'
    )
    
    # File handler
    log_file = os.path.join(log_dir, f'ai_agents_{datetime.now().strftime("%Y%m%d")}.log')
    file_handler = logging.FileHandler(log_file)
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(file_formatter)
    
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.DEBUG)
    console_handler.setFormatter(console_formatter)
    
    # Add handlers to logger
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    
    return logger

def setup_agent_logger(agent_name, level=logging.DEBUG):
    """Setup logger for individual agent that logs to both agent file and main log"""
    
    # Create logger with agent name
    logger = logging.getLogger(f'agent_{agent_name}')
    logger.setLevel(level)
    
    # Avoid duplicate handlers
    if logger.handlers:
        return logger
    
    # Create logs directory if it doesn't exist
    log_dir = 'logs'
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)
    
    # Create formatters
    agent_file_formatter = logging.Formatter(
        '%(asctime)s - %(levelname)s - %(message)s'
    )
    main_file_formatter = logging.Formatter(
        '%(asctime)s - ai_agents - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s'
    )
    console_formatter = logging.Formatter(
        f'[{agent_name}] %(levelname)s - %(message)s'
    )
    
    # Agent-specific file handler
    agent_log_file = os.path.join(log_dir, f'agent_{agent_name}_{datetime.now().strftime("%Y%m%d")}.log')
    agent_file_handler = logging.FileHandler(agent_log_file)
    agent_file_handler.setLevel(logging.DEBUG)
    agent_file_handler.setFormatter(agent_file_formatter)
    
    # Main log file handler (same as main logger)
    main_log_file = os.path.join(log_dir, f'ai_agents_{datetime.now().strftime("%Y%m%d")}.log')
    main_file_handler = logging.FileHandler(main_log_file)
    main_file_handler.setLevel(logging.DEBUG)
    main_file_handler.setFormatter(main_file_formatter)
    
    # Console handler with agent name prefix
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.DEBUG)
    console_handler.setFormatter(console_formatter)
    
    # Add handlers to logger
    logger.addHandler(agent_file_handler)
    logger.addHandler(main_file_handler)
    logger.addHandler(console_handler)
    
    return logger
