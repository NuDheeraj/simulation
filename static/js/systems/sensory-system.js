/**
 * Sensory System - Handles sensory data collection and processing
 */
class SensorySystem {
    constructor(agentManager) {
        this.agentManager = agentManager;
        this.worldObjects = new Map(); // Objects in the world
        this.previousObservations = new Map(); // Track previous observations for each agent
    }

    /**
     * Round a number to 1 decimal place
     */
    round1(num) {
        return Math.round(num * 10) / 10;
    }

    /**
     * Round position object to 1 decimal place
     */
    roundPosition(pos) {
        return {
            x: this.round1(pos.x),
            y: this.round1(pos.y),
            z: this.round1(pos.z)
        };
    }

    /**
     * Get sensory data for an agent (what they can perceive)
     */
    getSensoryData(agentId, worldSimulator = null) {
        const agent = this.agentManager.getAgent(agentId);
        if (!agent) return null;

        // Get received texts from agent's LOCAL state
        const receivedTexts = this.agentManager.getAndClearReceivedTexts(agentId);

        const sensoryData = {
            agentId: agentId,
            position: this.roundPosition(agent.position),
            nearbyAgents: this.getNearbyAgents(agentId),
            worldObjects: this.getVisibleObjects(agentId),
            currentAction: agent.currentAction,
            currentUtterance: agent.currentUtterance,
            coinsCollected: agent.coinsCollected || 0,
            receivedTexts: receivedTexts, // Read from local state
            simulationTime: worldSimulator ? worldSimulator.getSimulationTime() : 0
        };

        return sensoryData;
    }

    /**
     * Check for interesting observation changes and trigger decisions
     */
    checkForInterestingChanges(agentId) {
        const agent = this.agentManager.getAgent(agentId);
        if (!agent) return;

        const currentObservations = {
            nearbyAgents: this.getNearbyAgents(agentId),
            worldObjects: this.getVisibleObjects(agentId)
        };

        const previousObs = this.previousObservations.get(agentId) || { nearbyAgents: [], worldObjects: [] };

        // Check for new agents in range
        const newAgents = currentObservations.nearbyAgents.filter(currentAgent => 
            !previousObs.nearbyAgents.some(prevAgent => prevAgent.id === currentAgent.id)
        );

        // Check for new world objects in range
        const newObjects = currentObservations.worldObjects.filter(currentObj => 
            !previousObs.worldObjects.some(prevObj => prevObj.id === currentObj.id)
        );

        // Check for agents that left range
        const agentsLeft = previousObs.nearbyAgents.filter(prevAgent => 
            !currentObservations.nearbyAgents.some(currentAgent => currentAgent.id === prevAgent.id)
        );

        // Check for objects that left range
        const objectsLeft = previousObs.worldObjects.filter(prevObj => 
            !currentObservations.worldObjects.some(currentObj => currentObj.id === prevObj.id)
        );

        // Trigger decisions for interesting changes
        if (newAgents.length > 0) {
            console.log(`Agent ${agentId} sees new agents:`, newAgents.map(a => a.id));
            this.triggerDecision(agentId, 'observation', {
                observationType: 'new_agents',
                agents: newAgents
            });
        }

        if (newObjects.length > 0) {
            console.log(`Agent ${agentId} sees new objects:`, newObjects.map(o => o.id));
            this.triggerDecision(agentId, 'observation', {
                observationType: 'new_objects',
                objects: newObjects
            });
        }

        if (agentsLeft.length > 0) {
            console.log(`Agent ${agentId} lost sight of agents:`, agentsLeft.map(a => a.id));
            this.triggerDecision(agentId, 'observation', {
                observationType: 'agents_left',
                agents: agentsLeft
            });
        }

        if (objectsLeft.length > 0) {
            console.log(`Agent ${agentId} lost sight of objects:`, objectsLeft.map(o => o.id));
            this.triggerDecision(agentId, 'observation', {
                observationType: 'objects_left',
                objects: objectsLeft
            });
        }

        // Update previous observations
        this.previousObservations.set(agentId, currentObservations);
    }

    /**
     * Check for interesting changes for all agents
     */
    checkForInterestingChangesAll() {
        for (const [agentId, agent] of this.agentManager.getAllAgents()) {
            this.checkForInterestingChanges(agentId);
        }
    }
    
    /**
     * Helper method to trigger decisions
     */
    triggerDecision(agentId, type, details = {}) {
        if (window.app && window.app.worldSimulator) {
            window.app.worldSimulator.triggerDecision(agentId, type, details);
        }
    }

    /**
     * Initialize observations for an agent (call when agent is created)
     */
    initializeObservations(agentId) {
        const currentObservations = {
            nearbyAgents: this.getNearbyAgents(agentId),
            worldObjects: this.getVisibleObjects(agentId)
        };
        this.previousObservations.set(agentId, currentObservations);
        console.log(`Initialized observations for agent ${agentId}:`, currentObservations);
    }

    /**
     * Get nearby agents within observation radius (visibility sphere)
     */
    getNearbyAgents(agentId) {
        const agent = this.agentManager.getAgent(agentId);
        if (!agent) return [];

        const nearbyAgents = [];
        const observationRadius = 1.0; // Matches visibility sphere radius

        for (const [otherId, otherAgent] of this.agentManager.getAllAgents()) {
            if (otherId === agentId) continue;

            const distance = Math.sqrt(
                Math.pow(otherAgent.position.x - agent.position.x, 2) +
                Math.pow(otherAgent.position.z - agent.position.z, 2)
            );

            // Only detect agents within the visibility sphere
            if (distance <= observationRadius) {
                nearbyAgents.push({
                    id: otherId,
                    name: otherAgent.name,
                    position: this.roundPosition(otherAgent.position),
                    distance: this.round1(distance),
                    currentAction: otherAgent.currentAction,
                    currentUtterance: otherAgent.currentUtterance
                });
            }
        }

        return nearbyAgents;
    }

    /**
     * Get visible world objects within visibility sphere
     */
    getVisibleObjects(agentId) {
        const agent = this.agentManager.getAgent(agentId);
        if (!agent) return [];

        const visibleObjects = [];
        const observationRadius = 1.0; // Matches visibility sphere radius

        for (const [objectId, worldObject] of this.worldObjects) {
            // Skip collected coins
            if (worldObject.type === 'collectible' && worldObject.collected) {
                continue;
            }
            
            const distance = Math.sqrt(
                Math.pow(worldObject.position.x - agent.position.x, 2) +
                Math.pow(worldObject.position.z - agent.position.z, 2)
            );

            // Only detect objects within the visibility sphere
            if (distance <= observationRadius) {
                visibleObjects.push({
                    id: objectId,
                    name: worldObject.name,
                    position: this.roundPosition(worldObject.position),
                    distance: this.round1(distance),
                    type: worldObject.type
                });
            }
        }

        return visibleObjects;
    }
    
    /**
     * Check for coin collection by an agent (within visibility sphere)
     */
    checkCoinCollection(agentId) {
        const agent = this.agentManager.getAgent(agentId);
        if (!agent) return null;

        const collectionRadius = 0.5; // Agents can collect coins within 0.5 units
        const visibilityRadius = 1.0; // Must be within visibility sphere
        let collectedCoin = null;

        for (const [objectId, worldObject] of this.worldObjects) {
            if (worldObject.type === 'collectible' && !worldObject.collected) {
                const distance = Math.sqrt(
                    Math.pow(worldObject.position.x - agent.position.x, 2) +
                    Math.pow(worldObject.position.z - agent.position.z, 2)
                );

                // Only collect coins that are both within collection range AND visibility sphere
                if (distance <= collectionRadius && distance <= visibilityRadius) {
                    // Mark coin as collected
                    worldObject.collected = true;
                    collectedCoin = {
                        id: objectId,
                        name: worldObject.name,
                        position: { ...worldObject.position }
                    };
                    console.log(`Agent ${agentId} collected coin ${objectId} within visibility sphere`);
                    break; // Only collect one coin at a time
                }
            }
        }

        return collectedCoin;
    }
    
    /**
     * Get all uncollected coins
     */
    getUncollectedCoins() {
        const uncollectedCoins = [];
        for (const [objectId, worldObject] of this.worldObjects) {
            if (worldObject.type === 'collectible' && !worldObject.collected) {
                uncollectedCoins.push({
                    id: objectId,
                    name: worldObject.name,
                    position: this.roundPosition(worldObject.position),
                    type: worldObject.type
                });
            }
        }
        return uncollectedCoins;
    }

    /**
     * Initialize world objects
     */
    initializeWorldObjects() {
        // Generate 10 random coins
        this.generateCoins();
    }
    
    /**
     * Generate 10 random coins in the world
     */
    generateCoins() {
        for (let i = 0; i < 10; i++) {
            const coinId = `coin_${i}`;
            const coin = {
                id: coinId,
                name: 'coin',
                position: {
                    x: (Math.random() - 0.5) * 8, // Random between -4 and 4
                    y: 0.3, // Slightly above ground
                    z: (Math.random() - 0.5) * 8  // Random between -4 and 4
                },
                type: 'collectible',
                collected: false
            };
            this.worldObjects.set(coinId, coin);
        }
        console.log('Generated 10 coins in the world');
    }

    /**
     * Update world objects in the scene
     */
    updateWorldObjects(worldObjects) {
        // For now, just store the world objects
        // In a full implementation, you'd create/update 3D objects for these
        this.worldObjects = worldObjects;
        console.log('World objects updated:', worldObjects);
    }
}

// Export for use in other modules
window.SensorySystem = SensorySystem;
