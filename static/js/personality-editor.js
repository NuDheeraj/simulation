/**
 * Agent Personality Editor Module
 * Handles personality configuration and editing for AI agents
 */

class PersonalityEditor {
    constructor() {
        this.agents = [];
        this.originalConfigs = new Map(); // Store original configs for reset
        this.API_BASE_URL = 'http://localhost:8080/api/agents';
    }

    /**
     * Initialize the personality editor
     */
    async initialize() {
        console.log('Initializing Personality Editor...');
        await this.loadAgents();
        this.renderPersonalityCards();
        console.log('Personality Editor initialized successfully');
    }

    /**
     * Load agents from the API
     */
    async loadAgents() {
        try {
            const response = await fetch(this.API_BASE_URL);
            if (!response.ok) {
                throw new Error(`Failed to load agents: ${response.statusText}`);
            }
            const agentsData = await response.json();
            
            // Convert object to array if needed
            if (Array.isArray(agentsData)) {
                this.agents = agentsData;
            } else {
                // Convert {agent1: {...}, agent2: {...}} to [{id: 'agent1', ...}, {id: 'agent2', ...}]
                this.agents = Object.entries(agentsData).map(([id, data]) => ({
                    id: id,
                    ...data
                }));
            }
            
            // Store original configs for reset functionality
            this.agents.forEach(agent => {
                this.originalConfigs.set(agent.id, {
                    personality: agent.personality,
                    system_prompt: agent.system_prompt,
                    color: agent.color
                });
            });
            
            console.log(`Loaded ${this.agents.length} agents:`, this.agents);
        } catch (error) {
            console.error('Error loading agents:', error);
            throw error;
        }
    }

    /**
     * Get avatar emoji for agent
     */
    getAgentAvatar(name) {
        const avatarMap = {
            'Alice': '🎨',
            'Bob': '🔬',
            'Charlie': '🎭',
            'Diana': '📚',
            'Eve': '🎵'
        };
        return avatarMap[name] || '🤖';
    }

    /**
     * Render personality cards for all agents
     */
    renderPersonalityCards() {
        const container = document.getElementById('agentPersonalityCards');
        if (!container) {
            console.error('Agent personality cards container not found');
            return;
        }

        container.innerHTML = '';

        this.agents.forEach(agent => {
            const card = this.createPersonalityCard(agent);
            container.appendChild(card);
        });
    }

    /**
     * Create a personality card for an agent
     */
    createPersonalityCard(agent) {
        const card = document.createElement('div');
        card.className = 'agent-personality-card collapsed';
        card.dataset.agentId = agent.id;

        const avatar = this.getAgentAvatar(agent.name);
        const avatarClass = agent.name.toLowerCase();

        card.innerHTML = `
            <div class="agent-card-header" data-toggle="header">
                <div class="agent-avatar ${avatarClass}">${avatar}</div>
                <div class="agent-info-header">
                    <h4>${agent.name}</h4>
                    <div class="agent-id">${agent.id}</div>
                </div>
                <div class="expand-indicator">▼</div>
            </div>

            <div class="agent-card-content">
                <div class="personality-field">
                    <label>Personality Description</label>
                    <textarea class="personality-textarea" 
                              data-field="personality" 
                              rows="10"
                              placeholder="Describe the agent's personality, traits, and behavior in detail...
                              
Examples:
• Creative and artistic AI who loves painting, music, and poetry
• Logical and analytical thinker who excels at problem-solving
• Friendly and social agent who enjoys collaboration">${agent.personality || ''}</textarea>
                    <div class="personality-hint">Press Ctrl+Enter to save quickly</div>
                </div>

                <div class="personality-actions">
                    <button class="personality-btn save" data-action="save">💾 Save</button>
                    <button class="personality-btn reset" data-action="reset">↺ Reset</button>
                </div>

                <div class="personality-status" style="display: none;"></div>
            </div>
        `;

        // Add event listeners
        this.attachCardEventListeners(card, agent);

        return card;
    }

    /**
     * Attach event listeners to a personality card
     */
    attachCardEventListeners(card, agent) {
        const agentId = agent.id;

        // Header click to toggle expand/collapse
        const header = card.querySelector('[data-toggle="header"]');
        const content = card.querySelector('.agent-card-content');
        const indicator = card.querySelector('.expand-indicator');

        header.addEventListener('click', () => {
            const isExpanded = card.classList.contains('expanded');
            
            if (isExpanded) {
                // Collapse
                card.classList.remove('expanded');
                card.classList.add('collapsed');
                content.classList.remove('expanded');
                indicator.classList.remove('expanded');
            } else {
                // Expand
                card.classList.add('expanded');
                card.classList.remove('collapsed');
                content.classList.add('expanded');
                indicator.classList.add('expanded');
            }
        });

        // Save button
        const saveBtn = card.querySelector('[data-action="save"]');
        saveBtn.addEventListener('click', () => this.savePersonality(agentId));

        // Reset button
        const resetBtn = card.querySelector('[data-action="reset"]');
        resetBtn.addEventListener('click', () => this.resetPersonality(agentId));

        // Ctrl+Enter to save
        const personalityTextarea = card.querySelector('[data-field="personality"]');
        personalityTextarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                this.savePersonality(agentId);
            }
        });
    }

    /**
     * Save personality configuration for an agent
     */
    async savePersonality(agentId) {
        const card = document.querySelector(`[data-agent-id="${agentId}"]`);
        if (!card) return;

        const statusDiv = card.querySelector('.personality-status');
        const saveBtn = card.querySelector('[data-action="save"]');

        try {
            // Disable button and show loading
            saveBtn.disabled = true;
            saveBtn.textContent = '💾 Saving...';
            this.showStatus(statusDiv, 'Saving changes...', 'info');

            // Collect data
            const personality = card.querySelector('[data-field="personality"]').value.trim();
            
            if (!personality) {
                throw new Error('Personality description cannot be empty');
            }

            const data = {
                personality: personality
            };

            console.log(`Saving personality for ${agentId}:`, data);

            // Send update to API
            const response = await fetch(`${this.API_BASE_URL}/${agentId}/personality`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to save personality');
            }

            const result = await response.json();
            console.log('Personality saved:', result);

            // Update local agent data
            const agent = this.agents.find(a => a.id === agentId);
            if (agent) {
                agent.personality = personality;
            }

            // Show success
            this.showStatus(statusDiv, '✓ Changes saved successfully!', 'success');
            setTimeout(() => this.hideStatus(statusDiv), 3000);

        } catch (error) {
            console.error('Error saving personality:', error);
            this.showStatus(statusDiv, `✗ Error: ${error.message}`, 'error');
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = '💾 Save';
        }
    }

    /**
     * Reset personality configuration to original
     */
    resetPersonality(agentId) {
        const card = document.querySelector(`[data-agent-id="${agentId}"]`);
        if (!card) return;

        const original = this.originalConfigs.get(agentId);
        if (!original) return;

        // Reset personality textarea
        const personalityTextarea = card.querySelector('[data-field="personality"]');
        personalityTextarea.value = original.personality;

        const statusDiv = card.querySelector('.personality-status');
        this.showStatus(statusDiv, '↺ Reset to original settings', 'success');
        setTimeout(() => this.hideStatus(statusDiv), 2000);
    }

    /**
     * Show status message
     */
    showStatus(statusDiv, message, type) {
        if (!statusDiv) return;
        statusDiv.textContent = message;
        statusDiv.className = `personality-status ${type}`;
        statusDiv.style.display = 'block';
    }

    /**
     * Hide status message
     */
    hideStatus(statusDiv) {
        if (!statusDiv) return;
        statusDiv.style.display = 'none';
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PersonalityEditor;
}

