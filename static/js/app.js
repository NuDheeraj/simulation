/**
 * Main application module for AI Agents Simulation
 */
class AIAgentsApp {
    constructor() {
        this.sceneManager = null;
        this.worldSimulator = null;
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
            
            // Initialize world simulator
            this.worldSimulator = new WorldSimulator(this.sceneManager);
            await this.worldSimulator.loadAgents();
            
            // Initialize chat manager
            this.chatManager = new ChatManager(this.worldSimulator);
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
    getWorldSimulator() {
        return this.worldSimulator;
    }

    /**
     * Get chat manager
     */
    getChatManager() {
        return this.chatManager;
    }
    
    /**
     * Start the agent simulation
     */
    async startSimulation() {
        if (!this.initialized) {
            console.error('Application not initialized');
            return;
        }
        
        await this.worldSimulator.startSimulation();
    }
    
    /**
     * Stop the agent simulation
     */
    async stopSimulation() {
        if (!this.initialized) {
            console.error('Application not initialized');
            return;
        }
        
        await this.worldSimulator.stopSimulation();
    }
    
    /**
     * Reset the simulation
     */
    async resetSimulation() {
        if (!this.initialized) {
            console.error('Application not initialized');
            return;
        }
        
        await this.worldSimulator.resetSimulation();
    }
    
    /**
     * Force an agent to make a decision
     */
    async forceAgentDecision(agentId) {
        if (!this.initialized) {
            console.error('Application not initialized');
            return;
        }
        
        return await this.worldSimulator.forceAgentDecision(agentId);
    }
    
    /**
     * Check if simulation is running
     */
    isSimulationRunning() {
        return this.worldSimulator ? this.worldSimulator.isSimulationRunning() : false;
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    window.app = new AIAgentsApp();
    await window.app.initialize();
    
    // Setup simulation controls
    setupSimulationControls();
});

// Setup simulation control event listeners
function setupSimulationControls() {
    const startBtn = document.getElementById('startSimulation');
    const stopBtn = document.getElementById('stopSimulation');
    const resetBtn = document.getElementById('resetSimulation');
    const forceAgent1Btn = document.getElementById('forceAgent1');
    const forceAgent2Btn = document.getElementById('forceAgent2');
    const statusSpan = document.getElementById('simulationStatus');
    
    if (startBtn) {
        startBtn.addEventListener('click', async () => {
            await window.app.startSimulation();
            updateSimulationStatus();
        });
    }
    
    if (stopBtn) {
        stopBtn.addEventListener('click', async () => {
            await window.app.stopSimulation();
            updateSimulationStatus();
        });
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', async () => {
            await window.app.resetSimulation();
            updateSimulationStatus();
        });
    }
    
    if (forceAgent1Btn) {
        forceAgent1Btn.addEventListener('click', async () => {
            await window.app.forceAgentDecision('agent1');
        });
    }
    
    if (forceAgent2Btn) {
        forceAgent2Btn.addEventListener('click', async () => {
            await window.app.forceAgentDecision('agent2');
        });
    }
    
    // Update status periodically
    setInterval(updateSimulationStatus, 1000);
}

// Update simulation status display
function updateSimulationStatus() {
    const statusSpan = document.getElementById('simulationStatus');
    const statusDiv = statusSpan?.parentElement;
    
    if (statusSpan && statusDiv) {
        const isRunning = window.app.isSimulationRunning();
        statusSpan.textContent = isRunning ? 'Running' : 'Stopped';
        
        // Update CSS classes
        statusDiv.className = 'simulation-status ' + (isRunning ? 'running' : 'stopped');
    }
}

// Export for global access
window.AIAgentsApp = AIAgentsApp;
