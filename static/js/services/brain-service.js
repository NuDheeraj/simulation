/**
 * Brain Service - Communicates with AI brains on the backend
 */
class BrainService {
    constructor() {
        this.baseUrl = '/api/agents';
    }

    /**
     * Request a decision from an agent's brain
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

    /**
     * Report action completion to brain
     */
    async reportActionCompletion(agentId, actionType, result = null) {
        try {
            const response = await fetch(`${this.baseUrl}/${agentId}/brain/action-complete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action_type: actionType,
                    result: result
                })
            });

            if (response.ok) {
                console.log(`Reported ${actionType} completion to brain ${agentId}`);
                return true;
            } else {
                console.error(`Failed to report ${actionType} completion to brain ${agentId}`);
                return false;
            }
        } catch (error) {
            console.error(`Error reporting action completion to brain ${agentId}:`, error);
            throw error;
        }
    }
}

// Export for use in other modules
window.BrainService = BrainService;
