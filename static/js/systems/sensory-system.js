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
