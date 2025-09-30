/**
 * World Simulator - Main coordinator and world state management
 */
class WorldSimulator {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.agentManager = new AgentManager();
        this.movementSystem = new MovementSystem(this.agentManager);
        this.sensorySystem = new SensorySystem(this.agentManager);
        this.brainService = new BrainService();
        this.chatBubbleManager = new ChatBubbleManager(sceneManager);
        this.simulationRunning = false;
        this.decisionInterval = null;
    }

    /**
     * Load agent configurations from the backend and create world entities
     */
    async loadAgents() {
        try {
            const response = await fetch('/api/agents');
            const agentConfigs = await response.json();
            console.log('Loaded agent configs:', agentConfigs);
            
            // Create agent bodies in the world
            Object.keys(agentConfigs).forEach(agentId => {
                const config = agentConfigs[agentId];
                this.agentManager.createAgentBody(agentId, config);
            });
            
            this.agentManager.createAgentSpheres(this.sceneManager.getScene(), this.chatBubbleManager);
            this.sensorySystem.initializeWorldObjects();
            this.createWorldObjects();
        } catch (error) {
            console.error('Error loading agents:', error);
            throw error;
        }
    }

    /**
     * Create world objects in the scene
     */
    createWorldObjects() {
        const scene = this.sceneManager.getScene();
        if (!scene) {
            console.error('Scene not initialized');
            return;
        }
        
        // Create the sphere object
        const sphere = BABYLON.MeshBuilder.CreateSphere("world_sphere", {
            diameter: 1.0,
            segments: 16
        }, scene);
        // Direct mapping: simulation X,Y,Z -> 3D X,Y,Z (Y is height, X-Z is movement plane)
        sphere.position = new BABYLON.Vector3(5, 0.5, 3);
        
        // Create material for sphere
        const sphereMaterial = new BABYLON.StandardMaterial("sphere_material", scene);
        sphereMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.4, 0.8); // Purple
        sphereMaterial.emissiveColor = new BABYLON.Color3(0.2, 0.1, 0.2); // Slight glow
        sphere.material = sphereMaterial;
        
        // Add a subtle rotation animation
        scene.registerBeforeRender(() => {
            sphere.rotation.y += 0.01;
        });
        
        console.log('Created world sphere at (5, 0.5, 3)');
    }

    /**
     * Update floating chat message
     */
    updateFloatingChatMessage(agentId, message) {
        this.chatBubbleManager.updateFloatingChatMessage(agentId, message);
    }

    /**
     * Handle agent click
     */
    onAgentClick(agentId) {
        // This will be handled by the main application
        if (window.app && window.app.onAgentClick) {
            window.app.onAgentClick(agentId);
        }
    }

    /**
     * Get agent by ID
     */
    getAgent(agentId) {
        return this.agentManager.getAgent(agentId);
    }

    /**
     * Get all agents
     */
    getAllAgents() {
        return this.agentManager.getAllAgents();
    }
    
    /**
     * Start the world simulation - agents will start making decisions
     */
    async startSimulation() {
        try {
            this.simulationRunning = true;
            this.startBrainDecisionLoop();
            console.log('World simulation started - agents will begin making decisions');
        } catch (error) {
            console.error('Error starting simulation:', error);
        }
    }
    
    /**
     * Stop the world simulation
     */
    async stopSimulation() {
        try {
            this.simulationRunning = false;
            if (this.decisionInterval) {
                clearInterval(this.decisionInterval);
                this.decisionInterval = null;
            }
            console.log('World simulation stopped');
        } catch (error) {
            console.error('Error stopping simulation:', error);
        }
    }

    /**
     * Start the brain decision loop - ask brains for decisions every 2 seconds
     */
    startBrainDecisionLoop() {
        if (this.decisionInterval) {
            clearInterval(this.decisionInterval);
        }
        
        this.decisionInterval = setInterval(async () => {
            if (this.simulationRunning) {
                await this.requestDecisionsFromBrains();
            }
        }, 2000); // Ask brains for decisions every 2 seconds
    }

    /**
     * Request decisions from all agent brains
     */
    async requestDecisionsFromBrains() {
        for (const [agentId, agent] of this.agentManager.getAllAgents()) {
            if (agent.currentAction === 'idle') {
                await this.requestDecisionFromBrain(agentId);
            }
        }
    }

    /**
     * Request a decision from a specific agent's brain
     */
    async requestDecisionFromBrain(agentId) {
        const agent = this.agentManager.getAgent(agentId);
        if (!agent) return;

        try {
            // Send sensory data to brain
            const sensoryData = this.sensorySystem.getSensoryData(agentId);
            const decision = await this.brainService.requestDecision(agentId, sensoryData);
            
            if (decision) {
                console.log(`Brain of ${agentId} decided:`, decision);
                await this.executeDecision(agentId, decision);
            }
        } catch (error) {
            console.error(`Error requesting decision from brain ${agentId}:`, error);
        }
    }

    /**
     * Execute a decision from an agent's brain
     */
    async executeDecision(agentId, decision) {
        console.log(`Executing decision for ${agentId}:`, decision);
        
        const agent = this.agentManager.getAgent(agentId);
        if (!agent) return;

        // Update agent state
        this.agentManager.updateAgentState(agentId, {
            currentAction: decision.action,
            goalTarget: decision.target
        });

        if (decision.action === 'move' && decision.target) {
            await this.movementSystem.executeMovement(agentId, decision.target, this.brainService);
        } else if (decision.action === 'say' && decision.utterance) {
            await this.executeSpeech(agentId, decision.utterance);
        } else if (decision.action === 'observe') {
            await this.executeObservation(agentId);
        } else if (decision.action === 'idle') {
            // Agent chooses to do nothing
            this.agentManager.updateAgentState(agentId, {
                currentAction: 'idle',
                goalTarget: null
            });
        }
    }

    /**
     * Execute speech action
     */
    async executeSpeech(agentId, message) {
        const agent = this.agentManager.getAgent(agentId);
        if (!agent) return;

        // Update agent state
        this.agentManager.updateAgentState(agentId, {
            currentUtterance: message,
            utteranceEndTime: Date.now() + 3000 // 3 seconds
        });

        // Show chat bubble
        this.updateFloatingChatMessage(agentId, message);
        
        // Speech duration (3 seconds)
        setTimeout(() => {
            this.agentManager.updateAgentState(agentId, {
                currentAction: 'idle',
                currentUtterance: null,
                utteranceEndTime: 0
            });
            
            // Report completion to brain
            this.brainService.reportActionCompletion(agentId, 'say', {
                message: message,
                duration: 3000
            });
        }, 3000);
    }

    /**
     * Execute observation action
     */
    async executeObservation(agentId) {
        const agent = this.agentManager.getAgent(agentId);
        if (!agent) return;

        // Observation is instant - just gather sensory data
        const sensoryData = this.sensorySystem.getSensoryData(agentId);
        
        // Update agent state
        this.agentManager.updateAgentState(agentId, {
            currentAction: 'idle'
        });
        
        // Report completion to brain with observation results
        this.brainService.reportActionCompletion(agentId, 'observe', {
            sensory_data: sensoryData
        });
    }

    /**
     * Force an agent to make a decision
     */
    async forceAgentDecision(agentId) {
        try {
            const agent = this.agentManager.getAgent(agentId);
            if (!agent) {
                console.error(`Agent ${agentId} not found`);
                return null;
            }

            if (agent.currentAction !== 'idle') {
                console.log(`Agent ${agentId} is busy with ${agent.currentAction}`);
                return null;
            }

            // Get sensory data and request decision from brain
            const sensoryData = this.sensorySystem.getSensoryData(agentId);
            const decision = await this.brainService.requestDecision(agentId, sensoryData);
            
            if (decision) {
                console.log(`Forced decision for ${agentId}:`, decision);
                await this.executeDecision(agentId, decision);
                return decision;
            } else {
                console.error(`Failed to get decision for agent ${agentId}`);
                return null;
            }
        } catch (error) {
            console.error('Error forcing agent decision:', error);
            return null;
        }
    }
    
    /**
     * Reset the simulation
     */
    async resetSimulation() {
        try {
            // Stop simulation first
            await this.stopSimulation();
            
            // Reset agent positions to initial positions
            this.agentManager.getAllAgents().forEach((agent, agentId) => {
                // Reset to initial positions from config
                let initialPosition;
                if (agentId === 'agent1') {
                    initialPosition = { x: -2, y: 0.6, z: 1 };
                } else if (agentId === 'agent2') {
                    initialPosition = { x: 2, y: 0.6, z: 1 };
                }
                
                if (initialPosition) {
                    this.agentManager.resetAgent(agentId, initialPosition);
                }
            });
            
            // Update visual positions
            this.agentManager.updateVisualPositions();
            
            console.log('Simulation reset - agents returned to initial positions');
        } catch (error) {
            console.error('Error resetting simulation:', error);
        }
    }

    /**
     * Update agent chat bubbles based on current utterances
     */
    updateAgentChatBubbles(agentStates) {
        for (const [agentId, agentState] of Object.entries(agentStates)) {
            if (agentState.current_utterance) {
                this.chatBubbleManager.updateFloatingChatMessage(agentId, agentState.current_utterance);
            }
        }
    }
    
    /**
     * Update world objects in the scene
     */
    updateWorldObjects(worldObjects) {
        this.sensorySystem.updateWorldObjects(worldObjects);
    }
    
    /**
     * Check if simulation is running
     */
    isSimulationRunning() {
        return this.simulationRunning;
    }
}

// Export for use in other modules
window.WorldSimulator = WorldSimulator;
