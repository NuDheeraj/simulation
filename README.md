# AI Agents Simulation

A 3D interactive simulation featuring AI agents that can move, observe, communicate, and make autonomous decisions in a virtual world. The simulation combines a Flask backend with a Babylon.js frontend to create an immersive multi-agent environment.

## 🎯 Overview

This project simulates intelligent agents (Alice and Bob) in a 3D world where they can:
- **Move autonomously** around the environment
- **Observe** other agents and world objects
- **Communicate** with each other and users
- **Make decisions** based on their personality and observations
- **Remember** past interactions and experiences

## 🏗️ Architecture

### Backend (Flask)
- **Framework**: Flask with CORS support
- **Port**: 5001
- **Architecture**: Service-oriented with clear separation of concerns

### Frontend (Babylon.js)
- **3D Engine**: Babylon.js for 3D rendering
- **Architecture**: Modular JavaScript classes
- **UI**: Interactive 3D scene with chat interface

## 🔧 Backend Components

### Core Services

#### 1. **Agent Service** (`services/agent_service.py`)
- **Purpose**: Manages AI agents and their lifecycle
- **Key Methods**:
  - `get_all_agents()`: Returns all configured agents
  - `start_simulation()`: Starts the AI decision loop
  - `force_agent_decision()`: Forces immediate agent decision
  - `reset_simulation()`: Resets all agents to initial state

#### 2. **Brain Coordination Service** (`services/brain_coordination_service.py`)
- **Purpose**: Manages AI agent brains and coordinates their interactions
- **Key Features**:
  - **Brain Management**: Manages agent brains and their states
  - **Memory Coordination**: Tracks agent memories and learning
  - **World Reference**: Provides world objects that brains can reference

#### 3. **Agent Model** (`models/agent.py`)
- **Purpose**: Represents individual AI agents with personality and behavior
- **Key Properties**:
  - `position`: 3D coordinates (X-Z plane movement, Y is height)
  - `personality`: Creative/artistic vs Logical/analytical
  - `memory`: Recent experiences and observations
  - `current_action`: Current behavior (idle, move, say)
  - `observations`: Real-time environmental awareness

### Backend States

#### Agent States
1. **Idle**: Agent is waiting for next decision
2. **Moving**: Agent is traveling to a target position
3. **Speaking**: Agent is communicating (3-second duration)
4. **Observing**: Agent is analyzing the environment

#### Brain States
1. **Inactive**: Brains not coordinating
2. **Active**: Brains coordinating and managing agent interactions
3. **Learning**: Brains processing memories and experiences

### API Endpoints

#### Agent Management
- `GET /api/agents` - Get all agents
- `POST /api/agents/{id}/chat` - Chat with specific agent
- `GET /api/agents/{id}/conversation` - Get conversation history
- `POST /api/agents/{id}/reset` - Reset agent conversation

#### Brain Coordination
- `POST /api/agents/brain/decide` - Request decision from agent brain
- `POST /api/agents/brain/action-complete` - Report action completion to brain
- `GET /api/agents/brain/state` - Get brain coordination state

#### Agent Actions
- `POST /api/agents/{id}/force-decision` - Force immediate decision
- `POST /api/agents/{id}/report-movement` - Report movement completion
- `POST /api/agents/{id}/clear-pending-decision` - Clear pending decision

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
  - **Simulation Lifecycle**: Start, stop, reset simulation
  - **Decision Coordination**: Request decisions from agent brains
  - **Action Execution**: Coordinate movement, speech, and observation
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
  - **Nearby Detection**: Find agents within observation radius
  - **Object Visibility**: Detect world objects in range
  - **Sensory Data**: Compile comprehensive environmental data
  - **World Objects**: Manage interactive world elements

#### 6. **Brain Service** (`static/js/services/brain-service.js`)
- **Purpose**: Communication with AI brains on the backend
- **Key Features**:
  - **Decision Requests**: Ask brains for agent decisions
  - **Action Reporting**: Notify brains of completed actions
  - **API Communication**: Handle all backend interactions
  - **Error Handling**: Robust communication with fallbacks

#### 7. **Chat Manager** (`static/js/chat.js`)
- **Purpose**: Manages user-agent communication
- **Features**:
  - Interactive chat panel
  - Conversation history
  - Real-time message exchange
  - Agent personality display

#### 8. **Main App** (`static/js/app.js`)
- **Purpose**: Orchestrates all components
- **Features**:
  - Application initialization
  - Simulation controls
  - Error handling
  - Event coordination

### Frontend States

#### Application States
1. **Initializing**: Loading 3D scene and agents
2. **Ready**: All components loaded, ready for interaction
3. **Error**: Initialization failed, showing error overlay

#### Simulation States
1. **Stopped**: No simulation running, agents idle
2. **Running**: Simulation active, agents making decisions
3. **Updating**: Processing agent state changes (50ms intervals)

#### Agent Visual States
1. **Idle**: Agent capsule stationary
2. **Moving**: Agent capsule animating to target
3. **Speaking**: Chat bubble visible with message
4. **Selected**: Agent highlighted for chat interaction

## 🤖 Agent Behavior System

### Decision Making Process

1. **Observation Phase**:
   - Agents scan for other agents within `observation_radius` (5 units)
   - Detect world objects (like the purple sphere)
   - Listen for communications within `hearing_radius` (3 units)

2. **Memory Integration**:
   - Recent memories influence decisions
   - Past interactions shape behavior
   - Maximum 10 memory items per agent

3. **Decision Generation**:
   - **Move**: Travel to interesting locations or other agents
   - **Speak**: Communicate when near other agents
   - **Observe**: Analyze environment when idle
   - **Idle**: Wait and think

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

### Modular Data Flow

#### 1. **Initialization Flow**
```
app.js → world-simulator.js → agent-manager.js → scene.js
```

#### 2. **Simulation Flow**
```
world-simulator.js → sensory-system.js → brain-service.js → backend
world-simulator.js → movement-system.js → agent-manager.js → scene.js
```

#### 3. **User Interaction Flow**
```
user click → agent-manager.js → chat.js → brain-service.js → backend
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
- **50ms Update Loop**: Smooth agent movement and state updates
- **2s AI Decisions**: Thoughtful agent reasoning without overwhelming
- **3s Speech Duration**: Realistic communication timing

### Memory System
- **Short-term Memory**: Recent observations and decisions
- **Personality Persistence**: Consistent behavior patterns
- **Learning**: Agents remember past interactions

### Visual Feedback
- **Floating Chat Bubbles**: Real-time speech visualization
- **Smooth Animations**: Fluid movement between positions
- **Interactive UI**: Click-to-chat with any agent

## 🛠️ Technical Details

### Backend Technologies
- **Flask**: Web framework
- **Flask-CORS**: Cross-origin resource sharing
- **Threading**: Background AI decision processing
- **JSON**: API communication

### Frontend Technologies
- **Babylon.js**: 3D graphics engine
- **Modular JavaScript**: Organized, maintainable code structure
- **CSS3**: Styling and animations
- **WebGL**: Hardware-accelerated rendering

### Modular Architecture Benefits
- **Maintainability**: Single responsibility principle, easy to debug
- **Scalability**: Easy to add new features without affecting existing code
- **Reusability**: Modules can be used independently in other projects
- **Team Development**: Multiple developers can work on different modules
- **Testing**: Each module can be unit tested independently

### Performance Considerations
- **Efficient Rendering**: 60 FPS target with requestAnimationFrame
- **Memory Management**: Automatic cleanup of disposed objects
- **Network Optimization**: Minimal API calls, efficient state updates
- **Modular Loading**: Only load necessary modules for better performance

## 🔮 Future Enhancements

- **Real AI Integration**: Replace mock decisions with actual LLM calls
- **More Agent Types**: Additional personalities and behaviors
- **Complex World**: More interactive objects and environments
- **Multi-user Support**: Multiple users observing the same simulation
- **Advanced Memory**: Long-term memory and learning systems
- **Custom Scenarios**: User-defined agent goals and challenges

---

*This simulation demonstrates the potential for AI agents to exist in shared virtual spaces, making autonomous decisions while remaining interactive and engaging for human users.*