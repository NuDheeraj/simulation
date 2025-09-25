/**
 * Chat management module for AI Agents Simulation
 */
class ChatManager {
    constructor(agentManager) {
        this.agentManager = agentManager;
        this.selectedAgent = null;
        this.chatPanel = null;
        this.chatHistory = null;
        this.chatInput = null;
        this.sendButton = null;
        this.closeButton = null;
        this.agentInfo = null;
    }

    /**
     * Initialize chat UI elements
     */
    initialize() {
        this.chatPanel = document.getElementById('chatPanel');
        this.chatHistory = document.getElementById('chatHistory');
        this.chatInput = document.getElementById('chatInput');
        this.sendButton = document.getElementById('sendButton');
        this.closeButton = document.getElementById('closeChat');
        this.agentInfo = document.getElementById('agentInfo');

        if (!this.chatPanel || !this.chatHistory || !this.chatInput || !this.sendButton || !this.closeButton || !this.agentInfo) {
            console.error('Chat UI elements not found');
            return false;
        }

        this.setupEventListeners();
        return true;
    }

    /**
     * Setup event listeners for chat functionality
     */
    setupEventListeners() {
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
        this.closeButton.addEventListener('click', () => this.closeChat());
    }

    /**
     * Select an agent for chatting
     */
    selectAgent(agentId) {
        this.selectedAgent = agentId;
        const agent = this.agentManager.getAgent(agentId);
        
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
            this.displayConversation(data.conversation);
        } catch (error) {
            console.error('Error loading conversation:', error);
        }
    }

    /**
     * Display conversation history
     */
    displayConversation(conversation) {
        this.chatHistory.innerHTML = '';
        
        conversation.forEach(msg => {
            const userDiv = document.createElement('div');
            userDiv.className = 'message user-message';
            userDiv.textContent = `You: ${msg.user}`;
            this.chatHistory.appendChild(userDiv);
            
            const agentDiv = document.createElement('div');
            agentDiv.className = 'message agent-message';
            agentDiv.textContent = `${this.agentManager.getAgent(this.selectedAgent).name}: ${msg.agent}`;
            this.chatHistory.appendChild(agentDiv);
        });
    }

    /**
     * Send a message to the selected agent
     */
    async sendMessage() {
        if (!this.selectedAgent) return;
        
        const message = this.chatInput.value.trim();
        if (!message) return;
        
        // Add user message to chat
        this.addUserMessage(message);
        this.chatInput.value = '';
        
        try {
            const response = await fetch(`/api/agents/${this.selectedAgent}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: message })
            });
            
            const data = await response.json();
            
            // Add agent response to chat
            this.addAgentMessage(data.agent_name, data.response);
            
            // Update floating chat bubble
            this.agentManager.updateFloatingChatMessage(this.selectedAgent, data.response);
            
            // Scroll to bottom
            this.chatHistory.scrollTop = this.chatHistory.scrollHeight;
            
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Error sending message. Please try again.');
        }
    }

    /**
     * Add user message to chat history
     */
    addUserMessage(message) {
        const userDiv = document.createElement('div');
        userDiv.className = 'message user-message';
        userDiv.textContent = `You: ${message}`;
        this.chatHistory.appendChild(userDiv);
    }

    /**
     * Add agent message to chat history
     */
    addAgentMessage(agentName, message) {
        const agentDiv = document.createElement('div');
        agentDiv.className = 'message agent-message';
        agentDiv.textContent = `${agentName}: ${message}`;
        this.chatHistory.appendChild(agentDiv);
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
