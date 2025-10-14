/**
 * Brain Service - Communicates with AI brains on the backend
 * 
 * ARCHITECTURE NOTE:
 * This service handles ONLY the decision-making requests to the backend LLM.
 * All action execution, completion tracking, and agent interactions happen
 * entirely in the frontend for better performance and simpler architecture.
 */
class BrainService {
    constructor() {
        this.baseUrl = '/api/agents';
    }

    /**
     * Request a decision from an agent's brain (the ONLY backend call needed)
     */
    async requestDecision(agentId, sensoryData) {
        try {
            const response = await fetch(`${this.baseUrl}/${agentId}/brain/decide`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sensory_data: sensoryData
                })
            });

            if (response.ok) {
                const result = await response.json();
                return result.decision;
            } else {
                console.error(`Brain ${agentId} failed to make decision`);
                return null;
            }
        } catch (error) {
            console.error(`Error requesting decision from brain ${agentId}:`, error);
            return null;
        }
    }
}

// Export for use in other modules
window.BrainService = BrainService;
