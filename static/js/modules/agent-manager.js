/**
 * Agent Manager - Manages individual agents and their properties
 */
class AgentManager {
    constructor() {
        this.agents = new Map(); // Agent bodies in the world
        this.agentSpheres = new Map(); // 3D visual representations
    }

    /**
     * Create an agent body in the world
     */
    createAgentBody(agentId, config) {
        this.agents.set(agentId, {
            id: agentId,
            name: config.name,
            personality: config.personality,
            color: config.color,
            position: { ...config.position }, // World owns the position
            currentAction: 'idle',
            goalTarget: null,
            currentUtterance: null,
            utteranceEndTime: 0,
            brainId: agentId // Reference to brain service
        });
    }

    /**
     * Create 3D capsules for each agent
     */
    createAgentSpheres(scene, chatBubbleManager) {
        if (!scene) {
            console.error('Scene not initialized');
            return;
        }
        
        // Clear existing spheres first to avoid duplicates
        this.clearAgentSpheres(scene);
        
        this.agents.forEach((agent, agentId) => {
            console.log(`Creating capsule for ${agentId}:`, agent);
            
            // Create capsule for agent using proper capsule mesh
            const capsule = BABYLON.MeshBuilder.CreateCapsule(agentId, {
                radius: 0.4,
                height: 1.2,
                subdivisions: 4,
                tessellation: 8
            }, scene);
            
            if (!capsule) {
                console.error(`Failed to create capsule for ${agentId}`);
                return;
            }
            
            // Direct mapping: simulation X,Y,Z -> 3D X,Y,Z (Y is height, X-Z is movement plane)
            capsule.position = new BABYLON.Vector3(agent.position.x, agent.position.y, agent.position.z);
            console.log(`Set ${agentId} position to (${agent.position.x}, ${agent.position.y}, ${agent.position.z})`);
            
            // Create material
            const material = new BABYLON.StandardMaterial(`${agentId}_material`, scene);
            if (agent.color === 'red') {
                material.diffuseColor = new BABYLON.Color3(1, 0.2, 0.2);
            } else {
                material.diffuseColor = new BABYLON.Color3(0.2, 0.2, 1);
            }
            capsule.material = material;
            
            // Add click event
            capsule.actionManager = new BABYLON.ActionManager(scene);
            capsule.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, () => {
                this.onAgentClick(agentId);
            }));
            
            // Create floating chat bubble
            chatBubbleManager.createFloatingChat(agentId, agent);
            
            // Store reference
            this.agentSpheres.set(agentId, capsule);
            console.log(`Stored sphere reference for ${agentId}`);
        });
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
        return this.agents.get(agentId);
    }

    /**
     * Get all agents
     */
    getAllAgents() {
        return this.agents;
    }

    /**
     * Update agent state
     */
    updateAgentState(agentId, updates) {
        const agent = this.agents.get(agentId);
        if (agent) {
            Object.assign(agent, updates);
        }
    }

    /**
     * Reset agent to initial state
     */
    resetAgent(agentId, initialPosition) {
        const agent = this.agents.get(agentId);
        if (agent) {
            agent.position = { ...initialPosition };
            agent.currentAction = 'idle';
            agent.goalTarget = null;
            agent.currentUtterance = null;
            agent.utteranceEndTime = 0;
        }
    }

    /**
     * Clear all agent spheres from the scene
     */
    clearAgentSpheres(scene) {
        if (!scene) return;
        
        // Remove all existing agent spheres
        this.agentSpheres.forEach((sphere, agentId) => {
            if (sphere) {
                sphere.dispose();
            }
        });
        
        // Clear the agent spheres reference
        this.agentSpheres.clear();
        
        console.log('Cleared all agent spheres');
    }

    /**
     * Update visual positions of all agents
     */
    updateVisualPositions() {
        console.log('Updating visual positions...');
        this.agents.forEach((agent, agentId) => {
            const sphere = this.agentSpheres.get(agentId);
            if (sphere) {
                sphere.position.x = agent.position.x;
                sphere.position.y = agent.position.y;
                sphere.position.z = agent.position.z;
                console.log(`Updated ${agentId} visual position to (${agent.position.x}, ${agent.position.y}, ${agent.position.z})`);
            } else {
                console.error(`No sphere found for agent ${agentId}`);
            }
        });
    }
}

// Export for use in other modules
window.AgentManager = AgentManager;
