/**
 * Main application module for AI Agents Simulation
 */
class AIAgentsApp {
    constructor() {
        this.sceneManager = null;
        this.agentManager = null;
        this.chatManager = null;
        this.initialized = false;
    }

    /**
     * Initialize the application
     */
    async initialize() {
        try {
            console.log('Initializing AI Agents Simulation...');
            
            // Initialize scene manager
            this.sceneManager = new SceneManager();
            await this.sceneManager.initialize();
            
            // Initialize agent manager
            this.agentManager = new AgentManager(this.sceneManager);
            await this.agentManager.loadAgents();
            
            // Initialize chat manager
            this.chatManager = new ChatManager(this.agentManager);
            if (!this.chatManager.initialize()) {
                throw new Error('Failed to initialize chat manager');
            }
            
            this.initialized = true;
            console.log('AI Agents Simulation initialized successfully!');
            
        } catch (error) {
            console.error('Error initializing application:', error);
            this.showError('Failed to initialize the application. Please refresh the page.');
        }
    }

    /**
     * Handle agent click
     */
    onAgentClick(agentId) {
        if (!this.initialized) {
            console.error('Application not initialized');
            return;
        }
        
        console.log('Agent clicked:', agentId);
        this.chatManager.selectAgent(agentId);
    }

    /**
     * Show error message to user
     */
    showError(message) {
        // Create error overlay
        const errorOverlay = document.createElement('div');
        errorOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            font-family: Arial, sans-serif;
        `;
        
        const errorContent = document.createElement('div');
        errorContent.style.cssText = `
            background: #dc3545;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            max-width: 400px;
        `;
        
        errorContent.innerHTML = `
            <h3>Error</h3>
            <p>${message}</p>
            <button onclick="location.reload()" style="
                background: white;
                color: #dc3545;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                margin-top: 10px;
            ">Reload Page</button>
        `;
        
        errorOverlay.appendChild(errorContent);
        document.body.appendChild(errorOverlay);
    }

    /**
     * Get application status
     */
    isInitialized() {
        return this.initialized;
    }

    /**
     * Get scene manager
     */
    getSceneManager() {
        return this.sceneManager;
    }

    /**
     * Get agent manager
     */
    getAgentManager() {
        return this.agentManager;
    }

    /**
     * Get chat manager
     */
    getChatManager() {
        return this.chatManager;
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    window.app = new AIAgentsApp();
    await window.app.initialize();
});

// Export for global access
window.AIAgentsApp = AIAgentsApp;
