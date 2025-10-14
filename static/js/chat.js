/**
 * Chat management module for AI Agents Simulation
 */
class ChatManager {
    constructor(worldSimulator) {
        this.worldSimulator = worldSimulator;
        this.selectedAgent = null;
        this.chatPanel = null;
        this.chatHistory = null;
        this.refreshButton = null;
        this.closeButton = null;
        this.agentInfo = null;
    }

    /**
     * Initialize chat UI elements
     * Note: Chat panel has been removed. This manager is kept for potential future use.
     */
    initialize() {
        console.log('ChatManager: Chat panel has been removed, skipping initialization');
        return true;
    }

    /**
     * Setup event listeners for chat functionality
     */
    setupEventListeners() {
        this.refreshButton.addEventListener('click', () => this.refreshConversation());
        this.closeButton.addEventListener('click', () => this.closeChat());
    }

    /**
     * Select an agent for chatting
     */
    selectAgent(agentId) {
        this.selectedAgent = agentId;
        const agent = this.worldSimulator.agentManager.getAgent(agentId);
        
        if (!agent) {
            console.error('Agent not found:', agentId);
            return;
        }

        // Show chat panel
        this.chatPanel.style.display = 'block';
        this.agentInfo.innerHTML = `
            <strong>${agent.name}</strong><br>
            ${agent.personality}
        `;
        
        // Load conversation history
        this.loadConversation(agentId);
    }

    /**
     * Load conversation history for an agent
     */
    async loadConversation(agentId) {
        try {
            const response = await fetch(`/api/agents/${agentId}/conversation`);
            const data = await response.json();
            
            if (data.conversation) {
                this.displayConversation(data.conversation);
            } else {
                // Handle case where conversation data is not available
                this.displayConversation([]);
            }
        } catch (error) {
            console.error('Error loading conversation:', error);
            // Show empty conversation on error
            this.displayConversation([]);
        }
    }

    /**
     * Display agent-to-agent conversation history
     */
    displayConversation(conversation) {
        this.chatHistory.innerHTML = '';
        
        if (!conversation || conversation.length === 0) {
            const noMessagesDiv = document.createElement('div');
            noMessagesDiv.className = 'message no-messages';
            noMessagesDiv.textContent = 'No conversations yet. Start the simulation to see agents interact!';
            this.chatHistory.appendChild(noMessagesDiv);
            return;
        }
        
        conversation.forEach(msg => {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message agent-message';
            messageDiv.textContent = `${msg.speaker}: ${msg.message}`;
            this.chatHistory.appendChild(messageDiv);
        });
    }

    /**
     * Refresh conversation history (read-only view)
     */
    async refreshConversation() {
        if (!this.selectedAgent) return;
        
        try {
            const response = await fetch(`/api/agents/${this.selectedAgent}/conversation`);
            const data = await response.json();
            
            if (data.conversation) {
                this.displayConversation(data.conversation);
            }
            
        } catch (error) {
            console.error('Error refreshing conversation:', error);
        }
    }


    /**
     * Close the chat panel
     */
    closeChat() {
        this.chatPanel.style.display = 'none';
        this.selectedAgent = null;
    }

    /**
     * Get the currently selected agent
     */
    getSelectedAgent() {
        return this.selectedAgent;
    }
}

// Export for use in other modules
window.ChatManager = ChatManager;
