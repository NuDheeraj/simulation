/**
 * Movement System - Handles movement animations and physics
 */
class MovementSystem {
    constructor(agentManager) {
        this.agentManager = agentManager;
        this.activeAnimations = new Map(); // Track active animations
    }
    
    /**
     * Stop all ongoing animations
     */
    stopAllAnimations() {
        this.activeAnimations.forEach((animationId, agentId) => {
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
        });
        this.activeAnimations.clear();
        console.log('All movement animations stopped');
    }
    
    /**
     * Stop movement animation for a specific agent
     */
    stopMovement(agentId) {
        const animationId = this.activeAnimations.get(agentId);
        if (animationId) {
            cancelAnimationFrame(animationId);
            this.activeAnimations.delete(agentId);
            console.log(`Movement animation stopped for ${agentId}`);
        }
    }
    
    /**
     * Helper method to trigger decisions
     */
    triggerDecision(agentId, type, details = {}) {
        if (window.app && window.app.worldSimulator) {
            window.app.worldSimulator.triggerDecision(agentId, type, details);
        }
    }

    /**
     * Execute movement action - FRONTEND ONLY (no backend calls)
     */
    async executeMovement(agentId, target) {
        const agent = this.agentManager.getAgent(agentId);
        const sphere = this.agentManager.agentSpheres.get(agentId);
        if (!agent || !sphere) {
            console.error(`Missing agent or sphere for ${agentId}:`, { agent: !!agent, sphere: !!sphere });
            return;
        }

        console.log(`Agent ${agentId} moving from (${agent.position.x}, ${agent.position.z}) to (${target.x}, ${target.z})`);

        const startPosition = { ...agent.position }; // World's position
        const targetPosition = {
            x: target.x,
            y: agent.position.y, // Keep Y fixed (height)
            z: target.z
        };

        // Calculate distance and duration
        const distance = Math.sqrt(
            Math.pow(targetPosition.x - startPosition.x, 2) + 
            Math.pow(targetPosition.z - startPosition.z, 2)
        );
        const duration = distance / 2.0; // 2 units per second
        
        console.log(`🏃 ${agentId} started movement animation (${distance.toFixed(1)} units, ${duration.toFixed(1)}s)`);

        // If already at target, just complete the action
        if (distance < 0.1) {
            console.log(`Agent ${agentId} already at target, completing action`);
            this.agentManager.updateAgentState(agentId, {
                currentAction: 'idle',
                goalTarget: null
            });
            
            console.log(`✅ ${agent.name} completed movement (already at target)`);
            
            // Trigger new decision after movement completion (no backend call)
            this.triggerDecision(agentId, 'action_completion', {
                actionType: 'move',
                final_position: { ...agent.position },
                distance_traveled: 0
            });
            return;
        }

        const startTime = Date.now();

        // Animation function
        const animate = () => {
            // Check if simulation is still running
            if (window.app && window.app.worldSimulator && !window.app.worldSimulator.simulationRunning) {
                console.log(`Animation cancelled for ${agentId} - simulation stopped`);
                this.activeAnimations.delete(agentId);
                return;
            }
            
            const elapsed = (Date.now() - startTime) / 1000;
            const progress = Math.min(elapsed / duration, 1);
            
            // Update world position (source of truth)
            agent.position.x = startPosition.x + (targetPosition.x - startPosition.x) * progress;
            agent.position.z = startPosition.z + (targetPosition.z - startPosition.z) * progress;
            
            // Update visual representation
            sphere.position.x = agent.position.x;
            sphere.position.z = agent.position.z;
            
            // Update visibility sphere position
            const visibilitySphere = this.agentManager.visibilitySpheres?.get(agentId);
            if (visibilitySphere) {
                visibilitySphere.position.x = agent.position.x;
                visibilitySphere.position.y = agent.position.y;
                visibilitySphere.position.z = agent.position.z;
            }
            
            if (progress < 1) {
                const animId = requestAnimationFrame(animate);
                this.activeAnimations.set(agentId, animId);
            } else {
                this.activeAnimations.delete(agentId);
                // Movement completed
                this.agentManager.updateAgentState(agentId, {
                    currentAction: 'idle',
                    goalTarget: null
                });
                
                console.log(`✅ ${agent.name} reached destination at (${agent.position.x}, ${agent.position.z})`);
                
                // Trigger new decision immediately (no backend call needed)
                this.triggerDecision(agentId, 'action_completion', {
                    actionType: 'move',
                    final_position: { ...agent.position },
                    distance_traveled: distance
                });
            }
        };

        animate();
    }

    /**
     * Animate agent movement to target position (legacy method)
     */
    animateAgentMovement(agentId, target) {
        const sphere = this.agentManager.agentSpheres.get(agentId);
        if (!sphere) return;
        
        const startPosition = {
            x: sphere.position.x,
            y: sphere.position.y,
            z: sphere.position.z
        };
        
        const targetPosition = {
            x: target.x,
            y: sphere.position.y, // Keep Y fixed (height)
            z: target.z
        };
        
        // Calculate distance and duration
        const distance = Math.sqrt(
            Math.pow(targetPosition.x - startPosition.x, 2) + 
            Math.pow(targetPosition.z - startPosition.z, 2)
        );
        
        const duration = distance / 2.0; // 2 units per second
        const startTime = Date.now();
        
        // Animation function
        const animate = () => {
            // Check if simulation is still running
            if (window.app && window.app.worldSimulator && !window.app.worldSimulator.simulationRunning) {
                console.log(`Animation cancelled for ${agentId} - simulation stopped`);
                this.activeAnimations.delete(agentId);
                return;
            }
            
            const elapsed = (Date.now() - startTime) / 1000;
            const progress = Math.min(elapsed / duration, 1);
            
            // Linear interpolation
            sphere.position.x = startPosition.x + (targetPosition.x - startPosition.x) * progress;
            sphere.position.z = startPosition.z + (targetPosition.z - startPosition.z) * progress;
            
            // Update visibility sphere position
            const visibilitySphere = this.agentManager.visibilitySpheres?.get(agentId);
            if (visibilitySphere) {
                visibilitySphere.position.x = sphere.position.x;
                visibilitySphere.position.y = sphere.position.y;
                visibilitySphere.position.z = sphere.position.z;
            }
            
            if (progress < 1) {
                const animId = requestAnimationFrame(animate);
                this.activeAnimations.set(agentId, animId);
            } else {
                this.activeAnimations.delete(agentId);
                // Movement completed, report to backend
                this.reportMovementCompletion(agentId, targetPosition);
            }
        };
        
        animate();
    }

    /**
     * Report movement completion to backend (legacy method)
     */
    async reportMovementCompletion(agentId, finalPosition) {
        try {
            const response = await fetch(`/api/agents/${agentId}/report-movement`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    position: finalPosition
                })
            });
            
            if (response.ok) {
                console.log(`Agent ${agentId} movement completed`);
            } else {
                console.error('Failed to report movement completion');
            }
        } catch (error) {
            console.error('Error reporting movement completion:', error);
        }
    }

}

// Export for use in other modules
window.MovementSystem = MovementSystem;
