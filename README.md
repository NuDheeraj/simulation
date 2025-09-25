# AI Agents Simulation

An interactive 3D simulation featuring AI agents that you can chat with! Each sphere represents a different AI agent with unique personalities and capabilities.

## Features

- **Two AI Agents**: Alice (Creative) and Bob (Analytical) represented as 3D spheres
- **Interactive Chat**: Click on any sphere to start a conversation with that agent
- **Unique Personalities**: Each agent has different system prompts and response styles
- **3D Visualization**: Beautiful Babylon.js 3D scene with rotating spheres
- **Real-time Communication**: Flask backend handles agent conversations
- **Conversation History**: Each agent remembers your chat history

## AI Agents

### Alice (Red Sphere) - Creative Agent
- **Personality**: Creative and artistic
- **Specialties**: Art, music, poetry, creative projects
- **Response Style**: Enthusiastic and imaginative

### Bob (Blue Sphere) - Analytical Agent  
- **Personality**: Logical and analytical
- **Specialties**: Mathematics, science, problem-solving
- **Response Style**: Precise and well-reasoned

## How to Run

### Prerequisites
- Python 3.7+
- pip (Python package installer)

### Installation & Setup

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Start the Flask server**:
   ```bash
   python app.py
   ```

3. **Open your browser** and go to: `http://localhost:5001`

## How to Use

1. **View the 3D Scene**: You'll see two rotating spheres (Alice in red, Bob in blue)
2. **Click on a Sphere**: Click any sphere to open a chat panel with that agent
3. **Start Chatting**: Type messages and get responses based on the agent's personality
4. **Switch Agents**: Close the chat and click the other sphere to talk to the other agent
5. **Camera Controls**: 
   - Mouse to look around
   - Scroll to zoom in/out

## API Endpoints

- `GET /api/agents` - Get all available agents
- `POST /api/agents/<agent_id>/chat` - Send a message to an agent
- `GET /api/agents/<agent_id>/conversation` - Get conversation history
- `POST /api/agents/<agent_id>/reset` - Reset conversation history

## Project Structure

```
simulation/
├── app.py                    # Main Flask application (application factory)
├── config.py                 # Configuration management
├── requirements.txt           # Python dependencies
├── README.md                 # This file
├── models/                    # Data models
│   ├── __init__.py
│   ├── agent.py              # Agent model
│   └── conversation.py       # Conversation model
├── services/                  # Business logic services
│   ├── __init__.py
│   ├── agent_service.py      # Agent management service
│   └── conversation_service.py # Conversation management service
├── routes/                    # API routes
│   ├── __init__.py
│   ├── main_routes.py        # Main page routes
│   └── agent_routes.py       # Agent API routes
├── utils/                     # Utility functions
│   ├── __init__.py
│   ├── logger.py             # Logging utilities
│   └── validators.py         # Input validation
├── static/                    # Static assets
│   ├── css/
│   │   └── main.css          # Main stylesheet
│   └── js/                    # Modular JavaScript
│       ├── app.js            # Main application module
│       ├── scene.js          # 3D scene management
│       ├── agents.js         # Agent management
│       └── chat.js           # Chat functionality
├── templates/                 # HTML templates
│   └── index.html            # Main page template
└── logs/                      # Application logs (created at runtime)
```

## Modular Architecture

This project follows a modular architecture pattern for better maintainability and scalability:

### Backend Architecture
- **Models**: Data structures and business logic (`models/`)
- **Services**: Business logic and data processing (`services/`)
- **Routes**: API endpoints and request handling (`routes/`)
- **Utils**: Shared utilities and helpers (`utils/`)
- **Config**: Configuration management (`config.py`)

### Frontend Architecture
- **Scene Manager**: 3D scene initialization and management
- **Agent Manager**: Agent creation and interaction handling
- **Chat Manager**: Chat UI and message handling
- **App Controller**: Main application coordination

### Benefits of Modular Design
- **Separation of Concerns**: Each module has a single responsibility
- **Maintainability**: Easy to locate and modify specific functionality
- **Testability**: Individual modules can be tested in isolation
- **Scalability**: New features can be added without affecting existing code
- **Reusability**: Modules can be reused across different parts of the application

## Customization

### Adding New Agents
Edit `config.py` and add new agents to the `AGENTS` dictionary:

```python
"agent3": {
    "name": "Charlie",
    "personality": "Technical and helpful",
    "system_prompt": "You are Charlie, a technical support specialist...",
    "color": "green",
    "position": {"x": 0, "y": 1, "z": 2}
}
```

### Modifying Agent Responses
Update the `generate_agent_response()` function in `app.py` to change how agents respond to different types of messages.

### Styling the 3D Scene
Edit the Babylon.js code in `templates/index.html` to change:
- Sphere colors and materials
- Lighting and camera angles
- Animation patterns
- Scene layout

## Browser Compatibility

Works in all modern browsers that support WebGL:
- Chrome
- Firefox  
- Safari
- Edge

## Dependencies

- **Backend**: Flask, Flask-CORS
- **Frontend**: Babylon.js (loaded via CDN)
- **Python**: 3.7+
