# JavaScript Module Organization

This directory contains the modularized JavaScript code for the AI Agents Simulation project.

## Folder Structure

```
static/js/
├── modules/           # Core application modules
│   ├── agent-manager.js      # Manages individual agents and their properties
│   └── world-simulator.js    # Main coordinator and world state management
├── systems/           # Game/simulation systems
│   ├── movement-system.js    # Handles movement animations and physics
│   └── sensory-system.js     # Handles sensory data collection and processing
├── services/          # External service integrations
│   └── brain-service.js      # Communication with AI brains on the backend
├── app.js            # Main application entry point
├── chat.js           # Chat functionality
├── chatbubbles.js    # 3D chat bubble rendering
└── scene.js          # Babylon.js scene management
```

## Module Responsibilities

### Core Modules (`modules/`)
- **agent-manager.js**: Agent creation, state management, 3D sphere management
- **world-simulator.js**: Main coordinator, simulation lifecycle, decision execution

### Systems (`systems/`)
- **movement-system.js**: Movement animations, physics, interpolation
- **sensory-system.js**: Sensory data collection, nearby agent detection, world object visibility

### Services (`services/`)
- **brain-service.js**: Backend API communication, decision requests, action reporting

### Core Files
- **app.js**: Application initialization and main control flow
- **chat.js**: Chat UI and interaction handling
- **chatbubbles.js**: 3D floating chat bubble rendering
- **scene.js**: Babylon.js 3D scene setup and management

## Loading Order

The modules are loaded in dependency order:
1. **Core**: `scene.js`, `chatbubbles.js`
2. **Modules**: `agent-manager.js`, `world-simulator.js`
3. **Systems**: `movement-system.js`, `sensory-system.js`
4. **Services**: `brain-service.js`
5. **Application**: `chat.js`, `app.js`

## Benefits

- **Maintainability**: Each module has a single, clear responsibility
- **Scalability**: Easy to add new modules without affecting existing ones
- **Reusability**: Modules can be used independently in other projects
- **Team Development**: Multiple developers can work on different modules
- **Testing**: Each module can be unit tested independently
