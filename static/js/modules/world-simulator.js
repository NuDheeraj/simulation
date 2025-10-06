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
        this.observationInterval = null;
        this.agentLastDecisionTime = new Map(); // Track when agents last made decisions
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
            
            // Initialize observations for all agents
            for (const agentId of Object.keys(agentConfigs)) {
                this.sensorySystem.initializeObservations(agentId);
            }
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
        
        // Create coins
        this.createCoins();
    }
    
    /**
     * Create 3D coin objects with rotation animation
     */
    createCoins() {
        const scene = this.sceneManager.getScene();
        if (!scene) {
            console.error('Scene not initialized');
            return;
        }
        
        // Get uncollected coins from sensory system
        const uncollectedCoins = this.sensorySystem.getUncollectedCoins();
        
        uncollectedCoins.forEach(coin => {
            this.createCoinMesh(coin);
        });
        
        console.log(`Created ${uncollectedCoins.length} coins in the scene`);
    }
    
    /**
     * Create a single coin mesh with rotation animation
     */
    createCoinMesh(coin) {
        const scene = this.sceneManager.getScene();
        if (!scene) return;
        
        // Create coin as a cylinder (flat disk) - oriented horizontally
        const coinMesh = BABYLON.MeshBuilder.CreateCylinder(coin.id, {
            height: 0.05,  // Very thin like a real coin
            diameter: 0.4, // Slightly smaller diameter
            tessellation: 16
        }, scene);
        
        // Rotate the cylinder 90 degrees to make it flat (like a coin lying on the ground)
        coinMesh.rotation.x = Math.PI / 2; // Rotate around X-axis to make it horizontal
        
        // Position the coin
        coinMesh.position = new BABYLON.Vector3(
            coin.position.x, 
            coin.position.y, 
            coin.position.z
        );
        
        // Create golden material for coin
        const coinMaterial = new BABYLON.StandardMaterial(`${coin.id}_material`, scene);
        coinMaterial.diffuseColor = new BABYLON.Color3(1, 0.8, 0.2); // Gold color
        coinMaterial.emissiveColor = new BABYLON.Color3(0.1, 0.05, 0.0); // Slight glow
        coinMaterial.specularColor = new BABYLON.Color3(0.8, 0.6, 0.1);
        coinMesh.material = coinMaterial;
        
        // Add rotation animation around Y-axis (vertical spinning)
        scene.registerBeforeRender(() => {
            coinMesh.rotation.y += 0.02; // Rotate around Y-axis (vertical spinning)
        });
        
        // Store reference for later removal
        if (!this.coinMeshes) {
            this.coinMeshes = new Map();
        }
        this.coinMeshes.set(coin.id, coinMesh);
        
        console.log(`Created coin ${coin.id} at (${coin.position.x}, ${coin.position.y}, ${coin.position.z})`);
    }
    
    /**
     * Remove a coin from the scene when collected
     */
    removeCoin(coinId) {
        if (this.coinMeshes && this.coinMeshes.has(coinId)) {
            const coinMesh = this.coinMeshes.get(coinId);
            coinMesh.dispose();
            this.coinMeshes.delete(coinId);
            console.log(`Removed coin ${coinId} from scene`);
        }
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
            
            // Trigger initial decisions for all agents when simulation starts
            await this.triggerInitialDecisions();
            
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
            if (this.observationInterval) {
                clearInterval(this.observationInterval);
                this.observationInterval = null;
            }
            console.log('World simulation stopped');
        } catch (error) {
            console.error('Error stopping simulation:', error);
        }
    }

    /**
     * Start the brain decision loop - now event-driven instead of timer-based
     */
    startBrainDecisionLoop() {
        // No longer using intervals - decisions are triggered by events
        console.log('Event-driven decision system activated');
        
        // Start a periodic check for interesting observations (much less frequent than before)
        this.observationInterval = setInterval(() => {
            if (this.simulationRunning) {
                this.checkForInterestingObservations();
                this.checkCoinCollection();
                
                // Check all idle agents and trigger decisions if needed
                this.checkIdleAgents();
            }
        }, 500); // Check every 500ms for observation changes
    }
    
    /**
     * Check for interesting observations that should trigger decisions
     */
    checkForInterestingObservations() {
        this.sensorySystem.checkForInterestingChangesAll();
    }
    
    /**
     * Helper method to trigger decisions from other systems
     */
    triggerDecision(agentId, type, details = {}) {
        if (type === 'observation') {
            this.triggerAgentDecision(agentId, `observation: ${details.observationType}`, details);
        } else if (type === 'action_completion') {
            this.triggerAgentDecision(agentId, `action_completion: ${details.actionType}`, details);
        }
    }
    
    
    /**
     * Trigger initial decisions for all agents when simulation starts
     */
    async triggerInitialDecisions() {
        console.log('Triggering initial decisions for all agents...');
        
        const agents = Array.from(this.agentManager.getAllAgents().entries());
        
        for (let i = 0; i < agents.length; i++) {
            const [agentId, agent] = agents[i];
            if (agent.currentAction === 'idle') {
                console.log(`Triggering initial decision for agent ${agentId}`);
                await this.requestDecisionFromBrain(agentId);
                
                // Track decision time
                this.agentLastDecisionTime.set(agentId, Date.now());
                
                // Small delay between agents to avoid overwhelming the system
                if (i < agents.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
        }
    }
    
    /**
     * Check all idle agents and trigger decisions if needed
     */
    async checkIdleAgents() {
        const currentTime = Date.now();
        const stuckThreshold = 5000; // 5 seconds
        
        for (const [agentId, agent] of this.agentManager.getAllAgents()) {
            if (agent.currentAction !== 'idle') continue;
            
            const lastDecisionTime = this.agentLastDecisionTime.get(agentId) || 0;
            const timeSinceLastDecision = currentTime - lastDecisionTime;
            
            // Only check for stuck agents (sensory system handles interesting things)
            if (timeSinceLastDecision > stuckThreshold) {
                console.log(`Agent ${agentId} has been idle for ${timeSinceLastDecision}ms, forcing decision`);
                
                // Small delay to avoid immediate re-triggering
                setTimeout(async () => {
                    if (agent.currentAction === 'idle') {
                        await this.requestDecisionFromBrain(agentId);
                        this.agentLastDecisionTime.set(agentId, Date.now());
                    }
                }, 200); // 200ms delay
            }
        }
    }
    
    /**
     * Trigger a decision for an agent
     */
    async triggerAgentDecision(agentId, reason, details = {}) {
        if (!this.simulationRunning) return;
        
        const agent = this.agentManager.getAgent(agentId);
        if (!agent) return;
        
        // For observation triggers, only trigger if agent is idle
        if (reason.includes('observation') && agent.currentAction !== 'idle') return;
        
        console.log(`Agent ${agentId} triggered decision due to ${reason}:`, details);
        await this.requestDecisionFromBrain(agentId);
        this.agentLastDecisionTime.set(agentId, Date.now());
    }
    
    /**
     * Check for coin collection by all agents
     */
    checkCoinCollection() {
        for (const [agentId, agent] of this.agentManager.getAllAgents()) {
            const collectedCoin = this.sensorySystem.checkCoinCollection(agentId);
            if (collectedCoin) {
                // Remove coin from 3D scene
                this.removeCoin(collectedCoin.id);
                
                // Update agent memory about collecting coin
                this.agentManager.updateAgentState(agentId, {
                    currentAction: 'idle' // Reset action after collecting
                });
                
                console.log(`Agent ${agentId} collected coin ${collectedCoin.id}`);
                
                // Trigger new decision after coin collection
                this.triggerAgentDecision(agentId, 'action_completion: collect_coin', {
                    coin_id: collectedCoin.id,
                    coin_position: collectedCoin.position
                });
            }
        }
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
            
            // Trigger new decision after speech completion
            this.triggerAgentDecision(agentId, 'action_completion: say', {
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
        
        // Trigger new decision after observation completion
        this.triggerAgentDecision(agentId, 'action_completion: observe', {
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
            
            // Reset coins
            this.resetCoins();
            
            // Update visual positions
            this.agentManager.updateVisualPositions();
            
            console.log('Simulation reset - agents returned to initial positions and coins regenerated');
        } catch (error) {
            console.error('Error resetting simulation:', error);
        }
    }
    
    /**
     * Reset all coins to uncollected state and regenerate positions
     */
    resetCoins() {
        // Clear existing coin meshes
        if (this.coinMeshes) {
            this.coinMeshes.forEach((mesh, coinId) => {
                mesh.dispose();
            });
            this.coinMeshes.clear();
        }
        
        // Regenerate coins in sensory system
        this.sensorySystem.generateCoins();
        
        // Create new coin meshes
        this.createCoins();
        
        console.log('Coins reset and regenerated');
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
    
    /**
     * Get current coin statistics
     */
    getCoinStats() {
        const uncollectedCoins = this.sensorySystem.getUncollectedCoins();
        const totalCoins = 10; // We always generate 10 coins
        const collectedCoins = totalCoins - uncollectedCoins.length;
        
        return {
            total: totalCoins,
            collected: collectedCoins,
            remaining: uncollectedCoins.length
        };
    }
}

// Export for use in other modules
window.WorldSimulator = WorldSimulator;
