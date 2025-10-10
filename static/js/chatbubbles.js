/**
 * ChatBubbleManager - Handles 3D chat bubbles for agents
 */
class ChatBubbleManager {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.chatBubbles = {};
        this.coinDisplays = {};
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
        plane.position = new BABYLON.Vector3(0, 1.8, 0); // Position centered above coin display
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
        
        // Set render order to be in front of coin displays
        plane.renderingGroupId = 1;
        
        // Store the chat bubble components
        this.chatBubbles[agentId] = {
            texture: dynamicTexture,
            plane: plane,
            sphere: scene.getMeshByName(agentId),
            lastMessage: null
        };
        
        console.log(`Created SMS-style chat bubble for ${agentId}:`, this.chatBubbles[agentId]);
        
        // Create coin display for this agent
        this.createCoinDisplay(agentId, agent);
    }

    /**
     * Create a floating coin count display for an agent
     */
    createCoinDisplay(agentId, agent) {
        const scene = this.sceneManager.getScene();
        
        // Create dynamic texture for the coin display
        const dynamicTexture = new BABYLON.DynamicTexture(`${agentId}_coin_texture`, {width: 200, height: 60}, scene);
        const context = dynamicTexture.getContext();
        
        // Clear the texture with transparent background
        context.clearRect(0, 0, 200, 60);
        
        // Ensure the texture supports alpha
        dynamicTexture.hasAlpha = true;
        dynamicTexture.update();
        
        // Create a 3D plane to display the texture - smaller size for coin count
        const plane = BABYLON.MeshBuilder.CreatePlane(`${agentId}_coin_plane`, {width: 1.2, height: 0.4}, scene);
        plane.position = new BABYLON.Vector3(0, 1.6, 0); // Position centered below chat bubble
        plane.parent = scene.getMeshByName(agentId);
        
        // Create material for the plane with proper transparency
        const material = new BABYLON.StandardMaterial(`${agentId}_coin_material`, scene);
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
        
        // Set render order to be behind chat bubbles
        plane.renderingGroupId = 0;
        
        // Store the coin display components
        this.coinDisplays[agentId] = {
            texture: dynamicTexture,
            plane: plane,
            sphere: scene.getMeshByName(agentId),
            lastCount: 0
        };
        
        console.log(`Created coin display for ${agentId}:`, this.coinDisplays[agentId]);
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
     * Update the coin count display for an agent
     */
    updateCoinDisplay(agentId, coinCount) {
        const coinDisplay = this.coinDisplays[agentId];
        if (!coinDisplay) return;

        coinDisplay.lastCount = coinCount;
        const context = coinDisplay.texture.getContext();
        
        // Clear the canvas with transparent background
        context.clearRect(0, 0, 200, 60);
        
        // Draw the coin display background
        context.fillStyle = '#FFD700'; // Gold color
        context.beginPath();
        context.roundRect(5, 5, 190, 50, 12);
        context.fill();
        
        // Add shadow effect
        context.shadowColor = 'rgba(0, 0, 0, 0.3)';
        context.shadowBlur = 3;
        context.shadowOffsetX = 0;
        context.shadowOffsetY = 2;
        
        // Draw the coin icon (💰)
        context.fillStyle = '#FFA500'; // Orange for coin
        context.font = 'bold 20px Arial';
        context.textAlign = 'center';
        context.fillText('💰', 30, 35);
        
        // Draw the count
        context.fillStyle = '#000000'; // Black text
        context.font = 'bold 16px Arial';
        context.textAlign = 'center';
        context.fillText(`${coinCount}`, 140, 35);
        
        // Reset shadow
        context.shadowColor = 'transparent';
        context.shadowBlur = 0;
        context.shadowOffsetX = 0;
        context.shadowOffsetY = 0;
        
        // Update the texture
        coinDisplay.texture.update();
        // Always make visible, even when zero coins
        coinDisplay.plane.material.alpha = 0.9;
        
        console.log(`Updated coin display for ${agentId}: ${coinCount} coins`);
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
        
        // Also remove coin display
        this.removeCoinDisplay(agentId);
    }

    /**
     * Remove a coin display
     */
    removeCoinDisplay(agentId) {
        const coinDisplay = this.coinDisplays[agentId];
        if (coinDisplay) {
            if (coinDisplay.plane) {
                coinDisplay.plane.dispose();
            }
            if (coinDisplay.texture) {
                coinDisplay.texture.dispose();
            }
            delete this.coinDisplays[agentId];
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
        this.coinDisplays = {};
    }
}

// Export the class
window.ChatBubbleManager = ChatBubbleManager;
