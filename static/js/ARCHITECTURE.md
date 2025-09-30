# Module Architecture

## Dependency Flow

```
app.js
├── world-simulator.js
│   ├── agent-manager.js
│   ├── movement-system.js
│   ├── sensory-system.js
│   └── brain-service.js
├── chat.js
│   └── world-simulator.js
└── scene.js
    └── chatbubbles.js
```

## Module Relationships

### Core Dependencies
- **app.js** → **world-simulator.js** → **agent-manager.js**
- **app.js** → **world-simulator.js** → **movement-system.js**
- **app.js** → **world-simulator.js** → **sensory-system.js**
- **app.js** → **world-simulator.js** → **brain-service.js**

### System Dependencies
- **movement-system.js** → **agent-manager.js**
- **sensory-system.js** → **agent-manager.js**
- **world-simulator.js** → **chatbubbles.js**

### Service Dependencies
- **brain-service.js** → Backend API (no JS dependencies)

## Data Flow

1. **Initialization**: `app.js` → `world-simulator.js` → `agent-manager.js`
2. **Simulation**: `world-simulator.js` → `sensory-system.js` → `brain-service.js`
3. **Actions**: `world-simulator.js` → `movement-system.js` → `agent-manager.js`
4. **Rendering**: `agent-manager.js` → `chatbubbles.js` → `scene.js`
