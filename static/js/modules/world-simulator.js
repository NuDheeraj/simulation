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
        this.simulationStartTime = null; // Track when simulation started
    }

    /**
     * Get current simulation time in seconds (starts from 0)
     */
    getSimulationTime() {
        if (!this.simulationStartTime) {
            return 0;
        }
        return Math.floor((Date.now() - this.simulationStartTime) / 1000);
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
                // Initialize coin display with 0 coins
                this.chatBubbleManager.updateCoinDisplay(agentId, 0);
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
            this.simulationStartTime = Date.now(); // Set simulation start time
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
            
            // Stop all ongoing movement animations
            if (this.movementSystem) {
                this.movementSystem.stopAllAnimations();
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
        
        // Start a periodic check for interesting observations
        this.observationInterval = setInterval(() => {
            if (this.simulationRunning) {
                this.checkForInterestingObservations();
                this.checkCoinCollection();
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
        console.log(`🔔 triggerDecision called for ${agentId} with type: ${type}`, details);
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
        console.log(`Found ${agents.length} agents to process`);
        
        // First ensure all agents are in idle state
        for (const [agentId, agent] of agents) {
            if (agent.currentAction !== 'idle') {
                console.log(`⚠️ Agent ${agentId} not in idle state (${agent.currentAction}), forcing to idle`);
                this.agentManager.updateAgentState(agentId, {
                    currentAction: 'idle',
                    goalTarget: null,
                    currentUtterance: null
                });
            }
        }
        
        // Now trigger decisions for all agents
        for (let i = 0; i < agents.length; i++) {
            const [agentId, agent] = agents[i];
            console.log(`✅ Triggering initial decision for agent ${agentId}`);
            await this.requestDecisionFromBrain(agentId);
            
            // Small delay between agents to avoid overwhelming the system
            if (i < agents.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
        console.log('Finished triggering initial decisions for all agents');
    }
    
    
    /**
     * Trigger a decision for an agent
     */
    async triggerAgentDecision(agentId, reason, details = {}) {
        console.log(`🎯 triggerAgentDecision called for ${agentId} with reason: ${reason}`, details);
        
        if (!this.simulationRunning) {
            console.log(`❌ Simulation not running, skipping decision for ${agentId}`);
            return;
        }
        
        const agent = this.agentManager.getAgent(agentId);
        if (!agent) {
            console.log(`❌ Agent ${agentId} not found`);
            return;
        }
        
        console.log(`🔍 Agent ${agentId} state:`, {
            currentAction: agent.currentAction,
            isMakingDecision: agent.isMakingDecision,
            position: agent.position
        });
        
        // Don't trigger if agent is already making a decision
        if (agent.isMakingDecision) {
            console.log(`⏭️ Agent ${agentId} is already making a decision, skipping trigger due to ${reason}`);
            return;
        }
        
        // For observation triggers during active actions, only interrupt for objects (coins), not agents
        if (reason.includes('observation') && agent.currentAction !== 'idle') {
            // Only interrupt for new objects (coins) or objects leaving - not for agents
            const isObjectObservation = details.observationType === 'new_objects' || 
                                       details.observationType === 'objects_left';
            
            if (isObjectObservation) {
                console.log(`🚨 Interesting object detected! Interrupting ${agent.currentAction} for ${agentId} to react to: ${reason}`);
                
                // Stop current action if it's a movement
                if (agent.currentAction === 'move') {
                    this.movementSystem.stopMovement(agentId);
                }
                
                // Reset agent to idle so they can make a new decision
                this.agentManager.updateAgentState(agentId, {
                    currentAction: 'idle',
                    goalTarget: null
                });
            } else {
                // For agent observations, only trigger if idle
                console.log(`⏭️ Skipping agent observation trigger for ${agentId} - currently busy with ${agent.currentAction}`);
                return;
            }
        }
        
        console.log(`✅ Agent ${agentId} triggered decision due to ${reason}:`, details);
        await this.requestDecisionFromBrain(agentId);
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
                
                // Increment agent's coin count
                this.agentManager.incrementCoinCount(agentId);
                
                // Update agent memory about collecting coin
                this.agentManager.updateAgentState(agentId, {
                    currentAction: 'idle' // Reset action after collecting
                });
                
                // Update coin display
                const coinCount = this.agentManager.getCoinCount(agentId);
                this.chatBubbleManager.updateCoinDisplay(agentId, coinCount);
                
                console.log(`Agent ${agentId} collected coin ${collectedCoin.id} (total: ${coinCount})`);
                
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

        // Check if agent is already making a decision
        if (agent.isMakingDecision) {
            console.log(`Agent ${agentId} is already making a decision, skipping...`);
            return;
        }

        // Mark agent as making decision
        agent.isMakingDecision = true;
        agent.lastDecisionTime = Date.now();

        try {
            // Send sensory data to brain
            const sensoryData = this.sensorySystem.getSensoryData(agentId, this);
            console.log(`Requesting decision from brain ${agentId} with sensory data:`, sensoryData);
            const decision = await this.brainService.requestDecision(agentId, sensoryData);
            
            if (decision) {
                console.log(`Brain of ${agentId} decided:`, decision);
                await this.executeDecision(agentId, decision);
            }
        } catch (error) {
            console.error(`Error requesting decision from brain ${agentId}:`, error);
            // Clear the decision flag on error
            agent.isMakingDecision = false;
        }
    }

    /**
     * Execute a decision from an agent's brain
     */
    async executeDecision(agentId, decision) {
        console.log(`Executing decision for ${agentId}:`, decision);
        
        const agent = this.agentManager.getAgent(agentId);
        if (!agent) return;

        // Clear the decision flag since we're now executing the decision
        agent.isMakingDecision = false;

        // Update agent state
        this.agentManager.updateAgentState(agentId, {
            currentAction: decision.action,
            goalTarget: decision.target
        });

        // Log action execution start
        const targetInfo = decision.target ? 
            (decision.target.x !== undefined ? `(${decision.target.x}, ${decision.target.z})` : decision.target.agent) : 
            'N/A';
        console.log(`🚀 ${agentId} executing ${decision.action} -> ${targetInfo}`);

        if (decision.action === 'move' && decision.target) {
            await this.movementSystem.executeMovement(agentId, decision.target, this.brainService);
        } else if (decision.action === 'say' && decision.utterance) {
            await this.executeSpeech(agentId, decision.utterance);
        } else if (decision.action === 'observe') {
            await this.executeObservation(agentId);
        } else if (decision.action === 'idle') {
            // Agent chooses to rest/think/observe for 5 seconds
            await this.executeIdle(agentId);
        }
    }

    /**
     * Execute idle action (rest/think/observe for 5 seconds)
     */
    async executeIdle(agentId) {
        const agent = this.agentManager.getAgent(agentId);
        if (!agent) return;

        console.log(`Agent ${agentId} is resting/thinking/observing for 5 seconds...`);
        
        // Update agent state
        this.agentManager.updateAgentState(agentId, {
            currentAction: 'idle',
            goalTarget: null
        });

        // Wait for 5 seconds
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Report completion to brain
        this.brainService.reportActionCompletion(agentId, 'idle', {
            duration: 5000,
            action: 'rest_think_observe'
        });

        // Trigger new decision after idle completes
        this.triggerDecision(agentId, 'action_completion', {
            actionType: 'idle',
            duration: 5000
        });
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
        const sensoryData = this.sensorySystem.getSensoryData(agentId, this);
        
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
            const sensoryData = this.sensorySystem.getSensoryData(agentId, this);
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
            console.log('🔄 Starting simulation reset...');
            
            // Stop simulation first
            await this.stopSimulation();
            console.log('✅ Simulation stopped');
            
            // Reset backend state (clears memories, observations, and agent state)
            try {
                console.log('📡 Calling backend reset...');
                const response = await fetch('/api/agents/simulation/reset', {
                    method: 'POST'
                });
                if (!response.ok) {
                    console.error('❌ Failed to reset backend state');
                } else {
                    console.log('✅ Backend reset successful');
                }
            } catch (error) {
                console.error('❌ Error calling backend reset:', error);
            }
            
            // Small delay to ensure backend is fully reset
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Reset simulation time
            this.simulationStartTime = null;
            
            // Reset agent positions to initial positions
            console.log('🎯 Resetting agent positions...');
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
                    console.log(`✅ Reset ${agentId} to position (${initialPosition.x}, ${initialPosition.z})`);
                }
            });
            
            // Reset coins
            this.resetCoins();
            console.log('✅ Coins reset');
            
            // Update visual positions
            this.agentManager.updateVisualPositions();
            
            // Reset coin displays
            this.agentManager.getAllAgents().forEach((agent, agentId) => {
                this.chatBubbleManager.updateCoinDisplay(agentId, 0);
            });
            
            console.log('✅ Simulation reset complete - agents returned to initial positions and coins regenerated');
        } catch (error) {
            console.error('❌ Error resetting simulation:', error);
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
