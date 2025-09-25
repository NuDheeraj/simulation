/**
 * Agent management module for AI Agents Simulation
 */
class AgentManager {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.agents = {};
        this.agentSpheres = {};
        this.chatBubbleManager = new ChatBubbleManager(sceneManager);
    }

    /**
     * Load agents from the backend
     */
    async loadAgents() {
        try {
            const response = await fetch('/api/agents');
            this.agents = await response.json();
            console.log('Loaded agents:', this.agents);
            this.createAgentSpheres();
        } catch (error) {
            console.error('Error loading agents:', error);
            throw error;
        }
    }

    /**
     * Create 3D capsules for each agent
     */
    createAgentSpheres() {
        const scene = this.sceneManager.getScene();
        if (!scene) {
            console.error('Scene not initialized');
            return;
        }
        
        Object.keys(this.agents).forEach(agentId => {
            const agent = this.agents[agentId];
            console.log(`Creating capsule for ${agentId}:`, agent);
            
            // Create capsule for agent using proper capsule mesh
            const capsule = BABYLON.MeshBuilder.CreateCapsule(agentId, {
                radius: 0.4,
                height: 1.2,
                subdivisions: 4,
                tessellation: 8
            }, scene);
            capsule.position = new BABYLON.Vector3(agent.position.x, agent.position.y, agent.position.z);
            
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
            
            // No rotation animation - keep static
            
                // Create floating chat bubble
                this.chatBubbleManager.createFloatingChat(agentId, agent);
            
            // Store reference
            this.agentSpheres[agentId] = capsule;
        });
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
        return this.agents[agentId];
    }

    /**
     * Get all agents
     */
    getAllAgents() {
        return this.agents;
    }
}

// Export for use in other modules
window.AgentManager = AgentManager;
