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
    
    // Setup LLM configuration
    setupLLMConfiguration();
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
    const timeSpan = document.getElementById('simulationTime');
    
    if (statusSpan && statusDiv) {
        const isRunning = window.app.isSimulationRunning();
        statusSpan.textContent = isRunning ? 'Running' : 'Stopped';
        
        // Update CSS classes
        statusDiv.className = 'simulation-status ' + (isRunning ? 'running' : 'stopped');
    }
    
    // Update simulation time display
    if (timeSpan && window.app && window.app.worldSimulator) {
        const simulationTime = window.app.worldSimulator.getSimulationTime();
        timeSpan.textContent = `Time: ${simulationTime}s`;
    }
    
    // Update coin statistics
    updateCoinStats();
}

// Update coin collection statistics
function updateCoinStats() {
    const coinStatsDiv = document.getElementById('coinStats');
    if (coinStatsDiv && window.app && window.app.getWorldSimulator()) {
        const stats = window.app.getWorldSimulator().getCoinStats();
        coinStatsDiv.textContent = `Coins: ${stats.collected}/${stats.total} collected (${stats.remaining} remaining)`;
    }
}

// Setup LLM configuration event listeners
function setupLLMConfiguration() {
    const saveBtn = document.getElementById('saveLlmConfig');
    const clearBtn = document.getElementById('clearLlmConfig');
    const urlInput = document.getElementById('llmUrl');
    const modelInput = document.getElementById('llmModel');
    const apiKeyInput = document.getElementById('llmApiKey');
    const statusDiv = document.getElementById('llmConfigStatus');
    
    // Load current configuration from localStorage (values only, no validation check)
    loadLLMConfigValues();
    
    // Always start with disabled simulation buttons on page load
    updateSimulationButtonsState(false);
    
    // Re-enable save button if any input changes (config changed, needs re-validation)
    const configInputs = [urlInput, modelInput, apiKeyInput];
    configInputs.forEach(input => {
        if (input) {
            input.addEventListener('input', () => {
                if (saveBtn && saveBtn.disabled && saveBtn.classList.contains('validated')) {
                    saveBtn.disabled = false;
                    saveBtn.classList.remove('validated', 'loading');
                    saveBtn.textContent = '💾 Save & Test Config';
                }
            });
        }
    });
    
    // Save & Test LLM configuration
    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            const config = {
                url: urlInput.value.trim(),
                model: modelInput.value.trim(),
                apiKey: apiKeyInput.value.trim()
            };
            
            // Validate inputs
            if (!config.url) {
                showConfigStatus('error', '❌ LLM URL is required');
                return;
            }
            
            if (!config.model) {
                showConfigStatus('error', '❌ Model name is required');
                return;
            }
            
            // Disable button and show spinner with immediate feedback
            saveBtn.disabled = true;
            saveBtn.classList.add('loading');
            saveBtn.textContent = '⏳ Testing & Saving...';
            showConfigStatus('info', '🔄 Testing connection to LLM...');
            
            // Set a timeout for the request (30 seconds)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);
            
            try {
                // Test and save in backend (backend will test first)
                const response = await fetch('/api/agents/llm/config', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(config),
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                const result = await response.json();
                
                if (response.ok && result.success) {
                    // Save to localStorage (for convenience, but NOT for validation persistence)
                    localStorage.setItem('llm_config', JSON.stringify(config));
                    
                    // Enable simulation buttons now that config is validated (this session only)
                    updateSimulationButtonsState(true);
                    
                    // Remove loading state and show validated state (no need for status message - button shows it)
                    saveBtn.classList.remove('loading');
                    saveBtn.disabled = true;
                    saveBtn.classList.add('validated');
                    saveBtn.textContent = '✅ Validated';
                } else {
                    // Failed validation - re-enable button
                    saveBtn.disabled = false;
                    saveBtn.classList.remove('loading');
                    saveBtn.textContent = '💾 Save & Test Config';
                    showConfigStatus('error', `❌ ${result.error || 'Failed to save configuration'}`);
                }
            } catch (error) {
                clearTimeout(timeoutId);
                console.error('Error saving LLM config:', error);
                
                // Error occurred - re-enable button
                saveBtn.disabled = false;
                saveBtn.classList.remove('loading');
                saveBtn.textContent = '💾 Save & Test Config';
                
                if (error.name === 'AbortError') {
                    showConfigStatus('error', '❌ Request timeout. LLM server not responding. Please check URL.');
                } else if (error.message.includes('Failed to fetch')) {
                    showConfigStatus('error', '❌ Cannot connect to server. Check if the LLM URL is correct.');
                } else {
                    showConfigStatus('error', `❌ Error: ${error.message || 'Network error'}`);
                }
            }
        });
    }
    
    // Clear LLM configuration
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear the LLM configuration?')) {
                localStorage.removeItem('llm_config');
                urlInput.value = '';
                modelInput.value = '';
                apiKeyInput.value = '';
                showConfigStatus('success', '✅ Configuration cleared');
                
                // Disable simulation buttons when config is cleared
                updateSimulationButtonsState(false);
                
                // Reset save button to initial state
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.classList.remove('validated', 'loading');
                    saveBtn.textContent = '💾 Save & Test Config';
                }
            }
        });
    }
    
    function loadLLMConfigValues() {
        try {
            const saved = localStorage.getItem('llm_config');
            if (saved) {
                const config = JSON.parse(saved);
                // Load values only for convenience (validation state is NOT persisted)
                if (urlInput && config.url) urlInput.value = config.url;
                if (modelInput && config.model) modelInput.value = config.model;
                if (apiKeyInput && config.apiKey) apiKeyInput.value = config.apiKey;
            }
        } catch (error) {
            console.error('Error loading LLM config values:', error);
        }
    }
    
    function updateSimulationButtonsState(isEnabled) {
        const startBtn = document.getElementById('startSimulation');
        const stopBtn = document.getElementById('stopSimulation');
        
        console.log('Updating simulation buttons state:', isEnabled);
        console.log('Start button found:', !!startBtn, 'Stop button found:', !!stopBtn);
        
        // Only Start and Stop need LLM config - Reset doesn't need LLM
        if (startBtn) {
            startBtn.disabled = !isEnabled;
            startBtn.title = isEnabled ? 'Start simulation' : 'First save and test LLM config';
            console.log('Start button disabled:', startBtn.disabled);
        }
        if (stopBtn) {
            stopBtn.disabled = !isEnabled;
            stopBtn.title = isEnabled ? 'Stop simulation' : 'First save and test LLM config';
            console.log('Stop button disabled:', stopBtn.disabled);
        }
    }
    
    function showConfigStatus(type, message, noClear = false) {
        if (statusDiv) {
            statusDiv.className = `config-status ${type}`;
            statusDiv.textContent = message;
            
            // Clear status after 5 seconds (unless it's an 'info' loading message)
            if (!noClear && type !== 'info') {
                setTimeout(() => {
                    statusDiv.className = 'config-status';
                    statusDiv.textContent = '';
                }, 5000);
            }
        }
    }
}

// Export for global access
window.AIAgentsApp = AIAgentsApp;
