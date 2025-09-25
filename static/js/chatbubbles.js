/**
 * ChatBubbleManager - Handles 3D chat bubbles for agents
 */
class ChatBubbleManager {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.chatBubbles = {};
    }

    /**
     * Create a floating chat bubble for an agent
     */
    createFloatingChat(agentId, agent) {
        const scene = this.sceneManager.getScene();
        
        // Create dynamic texture for the chat bubble
        const dynamicTexture = new BABYLON.DynamicTexture(`${agentId}_chat_texture`, {width: 400, height: 100}, scene);
        const context = dynamicTexture.getContext();
        
        // Clear the texture with transparent background
        context.clearRect(0, 0, 400, 100);
        
        // Ensure the texture supports alpha
        dynamicTexture.hasAlpha = true;
        dynamicTexture.update();
        
        // Create a 3D plane to display the texture - smaller size
        const plane = BABYLON.MeshBuilder.CreatePlane(`${agentId}_chat_plane`, {width: 2, height: 0.6}, scene);
        plane.position = new BABYLON.Vector3(0, 0.8, 0); // Position at the top of the capsule
        plane.parent = scene.getMeshByName(agentId);
        
        // Create material for the plane with proper transparency
        const material = new BABYLON.StandardMaterial(`${agentId}_chat_material`, scene);
        material.diffuseTexture = dynamicTexture;
        material.emissiveTexture = dynamicTexture;
        material.disableLighting = true;
        material.backFaceCulling = false;
        material.alpha = 0.0; // Start invisible
        material.useAlphaFromDiffuseTexture = true; // Use alpha from texture
        material.diffuseColor = new BABYLON.Color3(1, 1, 1); // White base color
        material.specularColor = new BABYLON.Color3(0, 0, 0); // No specular
        material.ambientColor = new BABYLON.Color3(1, 1, 1); // White ambient
        plane.material = material;
        
        // Store the chat bubble components
        this.chatBubbles[agentId] = {
            texture: dynamicTexture,
            plane: plane,
            sphere: scene.getMeshByName(agentId),
            lastMessage: null
        };
        
        console.log(`Created SMS-style chat bubble for ${agentId}:`, this.chatBubbles[agentId]);
    }

    /**
     * Update the chat bubble message for an agent
     */
    updateFloatingChatMessage(agentId, message) {
        const chatBubble = this.chatBubbles[agentId];
        if (!chatBubble) return;

        chatBubble.lastMessage = message;
        const context = chatBubble.texture.getContext();
        
        // Set up text properties
        context.font = '12px Arial';
        const words = message.split(' ');
        const maxWidth = 350;
        const lineHeight = 16;
        const padding = 15;
        
        // Calculate text wrapping
        let lines = [];
        let currentLine = '';
        let maxLineWidth = 0;
        
        words.forEach(word => {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const metrics = context.measureText(testLine);
            const testWidth = metrics.width;
            
            if (testWidth > maxWidth && currentLine) {
                lines.push(currentLine);
                maxLineWidth = Math.max(maxLineWidth, context.measureText(currentLine).width);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        });
        
        if (currentLine) {
            lines.push(currentLine);
            maxLineWidth = Math.max(maxLineWidth, context.measureText(currentLine).width);
        }
        
        // Calculate bubble dimensions
        const bubbleWidth = Math.min(maxLineWidth + (padding * 2), maxWidth);
        const bubbleHeight = (lines.length * lineHeight) + (padding * 2);
        
        // Clear the canvas with transparent background
        context.clearRect(0, 0, 400, 100);
        
        // Draw the bubble background
        context.fillStyle = '#007AFF'; // iOS blue color
        context.beginPath();
        context.roundRect(10, 10, bubbleWidth, bubbleHeight, 18);
        context.fill();
        
        // Add shadow effect
        context.shadowColor = 'rgba(0, 0, 0, 0.2)';
        context.shadowBlur = 4;
        context.shadowOffsetX = 0;
        context.shadowOffsetY = 2;
        
        // Draw the text
        context.fillStyle = 'white';
        context.font = '12px Arial';
        context.textAlign = 'left'; // Left-aligned text
        context.shadowColor = 'rgba(0, 0, 0, 0.3)';
        context.shadowBlur = 1;
        context.shadowOffsetX = 0;
        context.shadowOffsetY = 1;
        
        lines.forEach((line, index) => {
            context.fillText(line, padding + 10, padding + 15 + (index * lineHeight));
        });
        
        // Reset shadow
        context.shadowColor = 'transparent';
        context.shadowBlur = 0;
        context.shadowOffsetX = 0;
        context.shadowOffsetY = 0;
        
        // Update the texture
        chatBubble.texture.update();
        chatBubble.plane.material.alpha = 0.95; // Make visible
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (chatBubble.texture) {
                const context = chatBubble.texture.getContext();
                context.clearRect(0, 0, 400, 100);
                chatBubble.texture.update();
                chatBubble.plane.material.alpha = 0.0; // Make invisible again
            }
        }, 5000);
    }

    /**
     * Update the position of a chat bubble to follow the agent
     */
    updateFloatingChatPosition(agentId) {
        const chatBubble = this.chatBubbles[agentId];
        if (!chatBubble) return;

        const agentMesh = chatBubble.sphere;
        if (agentMesh) {
            // The plane is already parented to the agent, so it moves automatically
            // But we can add any additional positioning logic here if needed
        }
    }

    /**
     * Hide a chat bubble
     */
    hideChatBubble(agentId) {
        const chatBubble = this.chatBubbles[agentId];
        if (chatBubble && chatBubble.plane) {
            chatBubble.plane.material.alpha = 0.0;
        }
    }

    /**
     * Show a chat bubble
     */
    showChatBubble(agentId) {
        const chatBubble = this.chatBubbles[agentId];
        if (chatBubble && chatBubble.plane) {
            chatBubble.plane.material.alpha = 0.95;
        }
    }

    /**
     * Get a chat bubble by agent ID
     */
    getChatBubble(agentId) {
        return this.chatBubbles[agentId];
    }

    /**
     * Get all chat bubbles
     */
    getAllChatBubbles() {
        return this.chatBubbles;
    }

    /**
     * Remove a chat bubble
     */
    removeChatBubble(agentId) {
        const chatBubble = this.chatBubbles[agentId];
        if (chatBubble) {
            if (chatBubble.plane) {
                chatBubble.plane.dispose();
            }
            if (chatBubble.texture) {
                chatBubble.texture.dispose();
            }
            delete this.chatBubbles[agentId];
        }
    }

    /**
     * Clean up all chat bubbles
     */
    dispose() {
        Object.keys(this.chatBubbles).forEach(agentId => {
            this.removeChatBubble(agentId);
        });
        this.chatBubbles = {};
    }
}

// Export the class
window.ChatBubbleManager = ChatBubbleManager;
