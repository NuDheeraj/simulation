/**
 * Agent Manager - Manages individual agents and their properties
 */
class AgentManager {
    constructor() {
        this.agents = new Map(); // Agent bodies in the world
        this.agentSpheres = new Map(); // 3D visual representations
        this.agentLabels = new Map(); // Name labels above agents
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
            brainId: agentId, // Reference to brain service
            coinsCollected: 0, // Track coins collected by this agent
            receivedTexts: [] // Store received text messages locally
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
            
            // Create visibility sphere around agent
            this.createVisibilitySphere(agentId, agent, scene);
            
            // Create floating chat bubble
            chatBubbleManager.createFloatingChat(agentId, agent);
            
            // Create name label above agent
            this.createNameLabel(agentId, agent, capsule, scene);
            
            // Store reference
            this.agentSpheres.set(agentId, capsule);
            console.log(`Stored sphere reference for ${agentId}`);
        });
    }
    
    /**
     * Create visibility sphere around an agent
     */
    createVisibilitySphere(agentId, agent, scene) {
        // Create visibility sphere - much smaller to match world scale
        const visibilitySphere = BABYLON.MeshBuilder.CreateSphere(`${agentId}_visibility`, {
            diameter: 2, // 1 unit radius (much smaller, appropriate for world scale)
            segments: 8
        }, scene);
        
        // Position at agent location
        visibilitySphere.position = new BABYLON.Vector3(agent.position.x, agent.position.y, agent.position.z);
        
        // Create transparent material with agent's color - more visible
        const visibilityMaterial = new BABYLON.StandardMaterial(`${agentId}_visibility_material`, scene);
        if (agent.color === 'red') {
            visibilityMaterial.diffuseColor = new BABYLON.Color3(1, 0.3, 0.3);
        } else {
            visibilityMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.3, 1);
        }
        visibilityMaterial.alpha = 0.3; // More visible
        visibilityMaterial.wireframe = true; // Show as wireframe
        visibilityMaterial.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.1); // More visible glow
        visibilitySphere.material = visibilityMaterial;
        
        // Make visibility sphere not pickable so it doesn't block clicks
        visibilitySphere.isPickable = false;
        
        // Store reference for updates
        if (!this.visibilitySpheres) {
            this.visibilitySpheres = new Map();
        }
        this.visibilitySpheres.set(agentId, visibilitySphere);
        
        console.log(`Created visibility sphere for ${agentId} with radius 1`);
    }
    
    /**
     * Create name label above agent
     */
    createNameLabel(agentId, agent, capsule, scene) {
        // Create a plane for the text
        const plane = BABYLON.MeshBuilder.CreatePlane(`${agentId}_label`, {
            width: 1.5,
            height: 0.4
        }, scene);
        
        // Position above the agent capsule
        plane.position = new BABYLON.Vector3(0, 1.0, 0); // 1.0 units above capsule center
        plane.parent = capsule; // Attach to capsule so it follows the agent
        plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL; // Always face camera
        plane.isPickable = false; // Don't interfere with clicks
        
        // Create dynamic texture for text
        const texture = new BABYLON.DynamicTexture(`${agentId}_label_texture`, {
            width: 512,
            height: 128
        }, scene);
        
        const material = new BABYLON.StandardMaterial(`${agentId}_label_material`, scene);
        material.diffuseTexture = texture;
        material.emissiveTexture = texture; // Make it glow
        material.opacityTexture = texture;
        material.backFaceCulling = false;
        plane.material = material;
        
        // Draw text on texture
        const ctx = texture.getContext();
        const font = "bold 48px Arial";
        texture.drawText(agent.name, null, null, font, "#FFFFFF", "#00000088", true);
        
        // Store reference
        this.agentLabels.set(agentId, { plane, texture, agent });
        
        console.log(`Created name label for ${agentId}: ${agent.name}`);
    }
    
    /**
     * Update agent name label (e.g., with coin count)
     */
    updateAgentLabel(agentId) {
        const labelData = this.agentLabels.get(agentId);
        const agent = this.agents.get(agentId);
        
        if (!labelData || !agent) {
            return;
        }
        
        const { texture } = labelData;
        
        // Build label text
        let labelText = agent.name;
        if (agent.coinsCollected > 0) {
            labelText += ` 🪙${agent.coinsCollected}`;
        }
        
        // Clear and redraw text
        texture.clear();
        const font = "bold 48px Arial";
        texture.drawText(labelText, null, null, font, "#FFFFFF", "#00000088", true);
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
     * Get agent ID by name
     */
    getAgentIdByName(name) {
        for (const [agentId, agent] of this.agents) {
            if (agent.name === name) {
                return agentId;
            }
        }
        return null;
    }

    /**
     * Update agent state
     */
    updateAgentState(agentId, updates) {
        const agent = this.agents.get(agentId);
        if (agent) {
            Object.assign(agent, updates);
            
            // Update label if coins collected changed
            if (updates.hasOwnProperty('coinsCollected')) {
                this.updateAgentLabel(agentId);
            }
        }
    }

    /**
     * Add a received text message to agent's local state
     */
    addReceivedText(agentId, senderName, message) {
        const agent = this.agents.get(agentId);
        if (agent) {
            agent.receivedTexts.push({
                sender: senderName,
                message: message,
                timestamp: Date.now(),
                read: false
            });
            console.log(`📨 Text added to ${agent.name}'s local state from ${senderName}`);
        }
    }

    /**
     * Get and clear received texts for an agent
     */
    getAndClearReceivedTexts(agentId) {
        const agent = this.agents.get(agentId);
        if (agent) {
            const texts = agent.receivedTexts.filter(t => !t.read);
            // Mark all as read
            agent.receivedTexts.forEach(t => t.read = true);
            return texts;
        }
        return [];
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
            agent.coinsCollected = 0; // Reset coin count
            agent.receivedTexts = []; // Clear received texts
            
            // Update label to remove coin count
            this.updateAgentLabel(agentId);
        }
    }

    /**
     * Increment coin count for an agent
     */
    incrementCoinCount(agentId) {
        const agent = this.agents.get(agentId);
        if (agent) {
            agent.coinsCollected++;
            console.log(`Agent ${agentId} now has ${agent.coinsCollected} coins`);
        }
    }

    /**
     * Get coin count for an agent
     */
    getCoinCount(agentId) {
        const agent = this.agents.get(agentId);
        return agent ? agent.coinsCollected : 0;
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
        
        // Remove all visibility spheres
        if (this.visibilitySpheres) {
            this.visibilitySpheres.forEach((sphere, agentId) => {
                if (sphere) {
                    sphere.dispose();
                }
            });
            this.visibilitySpheres.clear();
        }
        
        // Remove all agent labels
        if (this.agentLabels) {
            this.agentLabels.forEach((labelData, agentId) => {
                if (labelData.plane) {
                    labelData.plane.dispose();
                }
                if (labelData.texture) {
                    labelData.texture.dispose();
                }
            });
            this.agentLabels.clear();
        }
        
        // Clear the agent spheres reference
        this.agentSpheres.clear();
        
        console.log('Cleared all agent spheres, visibility spheres, and labels');
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
            
            // Update visibility sphere position
            const visibilitySphere = this.visibilitySpheres?.get(agentId);
            if (visibilitySphere) {
                visibilitySphere.position.x = agent.position.x;
                visibilitySphere.position.y = agent.position.y;
                visibilitySphere.position.z = agent.position.z;
            }
        });
    }
}

// Export for use in other modules
window.AgentManager = AgentManager;
