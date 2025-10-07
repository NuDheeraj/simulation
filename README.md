# AI Agents Simulation

A 3D interactive simulation featuring AI agents that can move, observe, communicate, and make autonomous decisions in a virtual world. The simulation combines a Flask backend with a Babylon.js frontend to create an immersive multi-agent environment.

## 🎯 Overview

This project simulates intelligent agents (Alice and Bob) in a 3D world where they can:
- **Move autonomously** around the environment
- **Observe** other agents and world objects
- **Communicate** with each other and users
- **Make decisions** based on their personality and observations
- **Remember** past interactions and experiences
- **Collect coins** and interact with world objects

## 🏗️ Architecture

### Backend (Flask)
- **Framework**: Flask with CORS support
- **Port**: 5001
- **Architecture**: Service-oriented with clear separation of concerns
- **LLM Integration**: Mistral Devstral-Small-2507 model for agent decisions

### Frontend (Babylon.js)
- **3D Engine**: Babylon.js for 3D rendering
- **Architecture**: Modular JavaScript classes with event-driven system
- **UI**: Interactive 3D scene with chat interface

## 🔧 Backend Components

### Core Services

#### 1. **Agent Service** (`services/agent_service.py`)
- **Purpose**: Manages AI agents and their lifecycle
- **Key Methods**:
  - `get_all_agents()`: Returns all configured agents
  - `get_brain_coordination_service()`: Access to brain coordination
  - `reset_simulation()`: Resets all agents to initial state

#### 2. **Brain Coordination Service** (`services/brain_coordination_service.py`)
- **Purpose**: Manages AI agent brains and coordinates their interactions
- **Key Features**:
  - **Brain Management**: Manages agent brains and their states
  - **Memory Coordination**: Tracks agent memories and learning
  - **World Reference**: Provides world objects that brains can reference

#### 3. **LLM Service** (`services/llm_service.py`)
- **Purpose**: Handles AI decision-making using LLM models
- **Key Features**:
  - **Mistral Integration**: Uses Devstral-Small-2507 model
  - **Structured Prompts**: Provides context about world, time, and actions
  - **Fallback System**: Mock responses when LLM unavailable
  - **Simulation Time**: Uses frontend time for consistent decision-making

#### 4. **Agent Model** (`models/agent.py`)
- **Purpose**: Represents individual AI agents with personality and behavior
- **Key Properties**:
  - `position`: 3D coordinates (X-Z plane movement, Y is height)
  - `personality`: Creative/artistic vs Logical/analytical
  - `memory`: Recent experiences and observations
  - `current_action`: Current behavior (idle, move, say)
- **Key Methods**:
  - `make_decision_from_sensory_data()`: Main decision-making method
  - `_generate_observations_from_sensory_data()`: Process frontend observations

### API Endpoints

#### Agent Management
- `GET /api/agents` - Get all agents
- `POST /api/agents/{id}/chat` - Chat with specific agent
- `GET /api/agents/{id}/conversation` - Get conversation history
- `POST /api/agents/{id}/reset` - Reset agent conversation

#### Brain Coordination
- `POST /api/agents/{id}/brain/decide` - Request decision from agent brain
- `POST /api/agents/{id}/brain/action-complete` - Report action completion to brain
- `GET /api/agents/brain/state` - Get brain coordination state

## 🎮 Frontend Components

### Modular Architecture

The frontend is organized into focused, maintainable modules:

```
static/js/
├── modules/           # Core application modules
│   ├── agent-manager.js      # Agent management and 3D visualization
│   └── world-simulator.js    # Main coordinator and simulation logic
├── systems/           # Game/simulation systems
│   ├── movement-system.js    # Movement animations and physics
│   └── sensory-system.js     # Sensory data collection and processing
├── services/          # External service integrations
│   └── brain-service.js      # Backend AI brain communication
├── app.js            # Main application entry point
├── chat.js           # Chat functionality
├── chatbubbles.js    # 3D chat bubble rendering
└── scene.js          # Babylon.js scene management
```

### Core Modules

#### 1. **Scene Manager** (`static/js/scene.js`)
- **Purpose**: Manages 3D scene, camera, lighting, and rendering
- **Features**:
  - ArcRotateCamera with mouse controls
  - Hemispheric and directional lighting
  - Ground plane and world objects
  - Responsive rendering loop

#### 2. **Agent Manager** (`static/js/modules/agent-manager.js`)
- **Purpose**: Manages individual agents and their 3D representation
- **Key Features**:
  - **Agent Creation**: Initialize agent bodies and properties
  - **3D Capsules**: Visual representation of agents
  - **State Management**: Track agent actions and properties
  - **Click Interaction**: Agent selection for chatting
  - **Visual Updates**: Position and appearance synchronization

#### 3. **World Simulator** (`static/js/modules/world-simulator.js`)
- **Purpose**: Main coordinator and world state management
- **Key Features**:
  - **Event-Driven Simulation**: Triggers decisions based on events, not timers
  - **Decision Coordination**: Request decisions from agent brains
  - **Action Execution**: Coordinate movement, speech, observation, and idle actions
  - **Idle Action**: 5-second rest/think/observe periods
  - **System Integration**: Orchestrates all other modules

#### 4. **Movement System** (`static/js/systems/movement-system.js`)
- **Purpose**: Handles movement animations and physics
- **Key Features**:
  - **Smooth Animation**: Interpolation between positions
  - **Distance Calculation**: Movement duration and completion
  - **Physics**: Realistic movement behavior
  - **Completion Reporting**: Notify brains when movement finishes

#### 5. **Sensory System** (`static/js/systems/sensory-system.js`)
- **Purpose**: Handles sensory data collection and processing
- **Key Features**:
  - **Change Detection**: Tracks changes in nearby agents and objects
  - **Event Triggers**: Automatically triggers decisions when interesting things appear/disappear
  - **Nearby Detection**: Find agents within observation radius (1 unit)
  - **Object Visibility**: Detect world objects (coins, landmarks) in range
  - **Sensory Data**: Compile comprehensive environmental data
  - **Simulation Time**: Provides frontend time to backend for consistent decisions

#### 6. **Brain Service** (`static/js/services/brain-service.js`)
- **Purpose**: Communication with AI brains on the backend
- **Key Features**:
  - **Decision Requests**: Ask brains for agent decisions
  - **Action Reporting**: Notify brains of completed actions
  - **API Communication**: Handle all backend interactions
  - **Error Handling**: Robust communication with fallbacks

## 🤖 Agent Behavior System

### Event-Driven Decision Making

The simulation uses an **event-driven decision system** for natural, responsive agent behavior:

#### **Decision Triggers**
1. **Action Completion Events**:
   - When agents finish moving to a target
   - When agents complete speaking (after 2 seconds)
   - When agents finish observing their environment
   - When agents complete idle periods (after 5 seconds)
   - When agents collect coins

2. **Interesting Observation Events**:
   - When agents see new agents enter their observation radius
   - When agents see new world objects (coins, landmarks) enter their range
   - When agents lose sight of previously visible agents or objects

3. **Initialization Events**:
   - When simulation starts, all agents immediately make their first decision

#### **Action Types and Durations**
- **Move**: 1-3 seconds (depends on distance)
- **Say**: 2 seconds
- **Idle**: 5 seconds (rest/think/observe)
- **Observe**: Instant (triggers new decision)

#### **Decision Making Process**

1. **Observation Phase**:
   - Agents scan for other agents within `observation_radius` (1 unit)
   - Detect world objects (coins, landmarks) within visibility range
   - Track changes in their environment in real-time

2. **Memory Integration**:
   - Recent memories influence decisions
   - Past interactions shape behavior
   - Maximum 10 memory items per agent

3. **LLM Decision Generation**:
   - **Structured Prompts**: Include position, observations, memories, world objects, and time
   - **Action Context**: Agents know how long each action takes
   - **JSON Output**: Structured decisions with action, target, utterance, and memory updates

### Personality-Based Behavior

#### Alice (Creative & Artistic)
- **Colors**: Red capsule
- **Behavior**: Enthusiastic, creative responses
- **Movement**: Drawn to interesting objects
- **Communication**: Inspirational and artistic language

#### Bob (Logical & Analytical)
- **Colors**: Blue capsule
- **Behavior**: Methodical, analytical responses
- **Movement**: Systematic exploration
- **Communication**: Precise and logical language

## 🌍 World Environment

### 3D Coordinate System
- **X-Z Plane**: Horizontal movement (agents move on this plane)
- **Y Axis**: Height (fixed for agents at 0.6 units)
- **Origin**: Center of the world

### World Objects
- **Purple Sphere**: Landmark at (5, 0.5, 3) that agents can investigate
- **Collectible Coins**: 10 golden coins scattered around the world for agents to collect
- **Ground Plane**: 10x10 unit gray surface
- **Lighting**: Hemispheric + directional lighting for visibility

## 🎮 User Controls

### 3D Navigation
- **Mouse**: Look around the scene
- **WASD**: Move camera forward/back/left/right
- **Q/E**: Move camera up/down
- **Mouse Wheel**: Zoom in/out
- **Click Agents**: Open chat interface

### Simulation Controls
- **Start Simulation**: Begin AI decision-making
- **Stop Simulation**: Pause agent autonomy
- **Reset**: Return agents to starting positions
- **Force Decisions**: Make agents decide immediately

## 📁 Project Structure

```
simulation/
├── app.py                    # Flask application entry point
├── config.py                 # Configuration settings
├── requirements.txt          # Python dependencies
├── models/                   # Data models
│   ├── agent.py             # Agent class with AI decision logic
│   └── conversation.py      # Conversation management
├── services/                 # Backend services
│   ├── agent_service.py     # Agent management service
│   ├── brain_coordination_service.py  # AI brain coordination
│   ├── llm_service.py       # LLM integration service
│   └── conversation_service.py        # Chat management
├── routes/                   # API endpoints
│   ├── agent_routes.py      # Agent-related endpoints
│   └── main_routes.py       # Main application routes
├── static/js/               # Frontend JavaScript modules
│   ├── modules/             # Core application modules
│   │   ├── agent-manager.js
│   │   └── world-simulator.js
│   ├── systems/             # Game/simulation systems
│   │   ├── movement-system.js
│   │   └── sensory-system.js
│   ├── services/            # External service integrations
│   │   └── brain-service.js
│   ├── app.js              # Main application
│   ├── chat.js             # Chat functionality
│   ├── chatbubbles.js      # 3D chat bubbles
│   └── scene.js            # 3D scene management
├── templates/               # HTML templates
│   └── index.html          # Main application page
├── static/css/             # Stylesheets
│   └── main.css           # Application styling
└── logs/                   # Application logs
    └── ai_agents_*.log    # Log files
```

## 🚀 Getting Started

### Prerequisites
- Python 3.7+
- Modern web browser with WebGL support

### Installation
```bash
# Install Python dependencies
pip install -r requirements.txt

# Run the Flask server
python app.py
```

### Access
- Open browser to `http://localhost:5001`
- Wait for 3D scene to load
- Click on agent capsules to start chatting
- Use simulation controls to start autonomous behavior

## 🔄 Data Flow

### Event-Driven Simulation Flow
```
Event Triggers:
├── Action Completion → world-simulator.js → brain-service.js → backend
├── Observation Changes → sensory-system.js → world-simulator.js → brain-service.js → backend
├── Movement Execution → movement-system.js → agent-manager.js → scene.js
└── User Interaction → agent-manager.js → chat.js → brain-service.js → backend
```

### Backend → Frontend
1. **Decision Results**: AI brain decisions sent to world-simulator
2. **Agent States**: Position, action, and utterance updates
3. **Chat Responses**: Agent replies to user messages

### Frontend → Backend
1. **Sensory Data**: Environmental information sent to brains
2. **Action Completion**: Movement, speech, and observation results
3. **User Input**: Chat messages and simulation controls

## 🎯 Key Features

### Real-time Interaction
- **Event-Driven Decisions**: Agents respond immediately to interesting events
- **Action-Based Timing**: Realistic durations for each action type
- **Continuous Flow**: Agents never get stuck, always making decisions
- **Memory System**: Agents remember past interactions and experiences

### Visual Feedback
- **Floating Chat Bubbles**: Real-time speech visualization
- **Smooth Animations**: Fluid movement between positions
- **Interactive UI**: Click-to-chat with any agent
- **3D World**: Immersive environment with collectible objects

## 🛠️ Technical Details

### Backend Technologies
- **Flask**: Web framework
- **Flask-CORS**: Cross-origin resource sharing
- **Mistral LLM**: AI decision-making
- **JSON**: API communication

### Frontend Technologies
- **Babylon.js**: 3D graphics engine
- **Modular JavaScript**: Organized, maintainable code structure
- **CSS3**: Styling and animations
- **WebGL**: Hardware-accelerated rendering

### Performance Considerations
- **Efficient Rendering**: 60 FPS target with requestAnimationFrame
- **Memory Management**: Automatic cleanup of disposed objects
- **Network Optimization**: Minimal API calls, efficient state updates
- **Event-Driven Architecture**: Reduces unnecessary processing and improves responsiveness

## 🧹 Recent Improvements

### Codebase Cleanup
- **Removed Legacy Code**: Eliminated ~200+ lines of unused code
- **Event-Driven System**: Replaced timer-based decisions with event triggers
- **Clean Architecture**: Clear separation between frontend observations and backend decisions
- **Idle Action**: Proper 5-second rest/think/observe periods instead of just waiting

### LLM Integration
- **Mistral Integration**: Uses Devstral-Small-2507 model by default
- **Structured Prompts**: Agents receive comprehensive context about world, time, and actions
- **Simulation Time**: Frontend provides consistent time to backend
- **Fallback System**: Mock responses when LLM unavailable

### Decision Flow
- **Continuous Decisions**: Agents never get stuck, always making new decisions
- **Action Completion**: Automatic triggers after each action finishes
- **Observation Events**: Immediate response to environmental changes
- **Memory Integration**: Past experiences influence future decisions

## 🤖 LLM Integration

The simulation uses Mistral's Devstral-Small-2507 model by default for agent decision-making! Uses the standard OpenAI Chat Completions API format for consistent behavior.

### Default Configuration
- **Model**: `mistralai/Devstral-Small-2507`
- **Server**: `http://10.35.30.88:30025`
- **API Key**: None required

### Run the Simulation
Simply run the simulation - no setup required:
```bash
python app.py
```

### Alternative Configuration
You can override the default configuration with environment variables:

```bash
# For OpenAI
export LLM_PROVIDER='openai'
export LLM_API_KEY='your-openai-key'
export LLM_MODEL='gpt-3.5-turbo'

# For custom OpenAI-compatible server
export LLM_PROVIDER='custom'
export LLM_BASE_URL='http://your-server:port'
export LLM_MODEL='your-model-name'
export LLM_API_KEY='your-api-key'  # Optional
```

## 🔮 Future Enhancements

- **More Agent Types**: Additional personalities and behaviors
- **Complex World**: More interactive objects and environments
- **Multi-user Support**: Multiple users observing the same simulation
- **Advanced Memory**: Long-term memory and learning systems
- **Custom Scenarios**: User-defined agent goals and challenges
- **Multi-Model Support**: Support for additional LLM providers

---

*This simulation demonstrates the potential for AI agents to exist in shared virtual spaces, making autonomous decisions while remaining interactive and engaging for human users.*