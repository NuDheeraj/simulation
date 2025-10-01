/**
 * Sensory System - Handles sensory data collection and processing
 */
class SensorySystem {
    constructor(agentManager) {
        this.agentManager = agentManager;
        this.worldObjects = new Map(); // Objects in the world
    }

    /**
     * Get sensory data for an agent (what they can perceive)
     */
    getSensoryData(agentId) {
        const agent = this.agentManager.getAgent(agentId);
        if (!agent) return null;

        const sensoryData = {
            agentId: agentId,
            position: { ...agent.position },
            nearbyAgents: this.getNearbyAgents(agentId),
            worldObjects: this.getVisibleObjects(agentId),
            currentAction: agent.currentAction,
            currentUtterance: agent.currentUtterance
        };

        return sensoryData;
    }

    /**
     * Get nearby agents within observation radius
     */
    getNearbyAgents(agentId) {
        const agent = this.agentManager.getAgent(agentId);
        if (!agent) return [];

        const nearbyAgents = [];
        const observationRadius = 5.0;

        for (const [otherId, otherAgent] of this.agentManager.getAllAgents()) {
            if (otherId === agentId) continue;

            const distance = Math.sqrt(
                Math.pow(otherAgent.position.x - agent.position.x, 2) +
                Math.pow(otherAgent.position.z - agent.position.z, 2)
            );

            if (distance <= observationRadius) {
                nearbyAgents.push({
                    id: otherId,
                    name: otherAgent.name,
                    position: { ...otherAgent.position },
                    distance: distance,
                    currentAction: otherAgent.currentAction,
                    currentUtterance: otherAgent.currentUtterance
                });
            }
        }

        return nearbyAgents;
    }

    /**
     * Get visible world objects
     */
    getVisibleObjects(agentId) {
        const agent = this.agentManager.getAgent(agentId);
        if (!agent) return [];

        const visibleObjects = [];
        const observationRadius = 5.0;

        for (const [objectId, worldObject] of this.worldObjects) {
            // Skip collected coins
            if (worldObject.type === 'collectible' && worldObject.collected) {
                continue;
            }
            
            const distance = Math.sqrt(
                Math.pow(worldObject.position.x - agent.position.x, 2) +
                Math.pow(worldObject.position.z - agent.position.z, 2)
            );

            if (distance <= observationRadius) {
                visibleObjects.push({
                    id: objectId,
                    name: worldObject.name,
                    position: { ...worldObject.position },
                    distance: distance,
                    type: worldObject.type
                });
            }
        }

        return visibleObjects;
    }
    
    /**
     * Check for coin collection by an agent
     */
    checkCoinCollection(agentId) {
        const agent = this.agentManager.getAgent(agentId);
        if (!agent) return null;

        const collectionRadius = 0.5; // Agents can collect coins within 0.5 units
        let collectedCoin = null;

        for (const [objectId, worldObject] of this.worldObjects) {
            if (worldObject.type === 'collectible' && !worldObject.collected) {
                const distance = Math.sqrt(
                    Math.pow(worldObject.position.x - agent.position.x, 2) +
                    Math.pow(worldObject.position.z - agent.position.z, 2)
                );

                if (distance <= collectionRadius) {
                    // Mark coin as collected
                    worldObject.collected = true;
                    collectedCoin = {
                        id: objectId,
                        name: worldObject.name,
                        position: { ...worldObject.position }
                    };
                    console.log(`Agent ${agentId} collected coin ${objectId}`);
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
                    position: { ...worldObject.position },
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
        // Create the sphere object in the world
        this.worldObjects.set('sphere', {
            id: 'sphere',
            name: 'sphere',
            position: { x: 5, y: 0.5, z: 3 },
            type: 'landmark'
        });
        
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
