/**
 * Movement System - Handles movement animations and physics
 */
class MovementSystem {
    constructor(agentManager) {
        this.agentManager = agentManager;
    }

    /**
     * Execute movement action - World owns the movement
     */
    async executeMovement(agentId, target, brainService) {
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

        // If already at target, just complete the action
        if (distance < 0.1) {
            console.log(`Agent ${agentId} already at target, completing action`);
            this.agentManager.updateAgentState(agentId, {
                currentAction: 'idle',
                goalTarget: null
            });
            
            // Report completion to brain
            brainService.reportActionCompletion(agentId, 'move', {
                final_position: { ...agent.position },
                distance_traveled: 0
            });
            return;
        }

        const duration = distance / 2.0; // 2 units per second
        const startTime = Date.now();

        // Animation function
        const animate = () => {
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
                requestAnimationFrame(animate);
            } else {
                // Movement completed
                this.agentManager.updateAgentState(agentId, {
                    currentAction: 'idle',
                    goalTarget: null
                });
                
                console.log(`Agent ${agentId} reached destination at (${agent.position.x}, ${agent.position.z})`);
                
                // Report completion to brain
                brainService.reportActionCompletion(agentId, 'move', {
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
                requestAnimationFrame(animate);
            } else {
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

    /**
     * Update agent positions in the 3D scene (legacy method)
     */
    updateAgentPositions(agentStates) {
        for (const [agentId, agentState] of Object.entries(agentStates)) {
            const sphere = this.agentManager.agentSpheres.get(agentId);
            if (sphere) {
                // Handle movement animation for agents with move actions
                if (agentState.current_action === "move" && agentState.goal_target) {
                    this.animateAgentMovement(agentId, agentState.goal_target);
                } else {
                    // Direct mapping: simulation X,Y,Z -> 3D X,Y,Z (Y is height, X-Z is movement plane)
                    sphere.position.x = agentState.position.x;
                    sphere.position.y = agentState.position.y;
                    sphere.position.z = agentState.position.z;
                    
                    // Update visibility sphere position
                    const visibilitySphere = this.agentManager.visibilitySpheres?.get(agentId);
                    if (visibilitySphere) {
                        visibilitySphere.position.x = agentState.position.x;
                        visibilitySphere.position.y = agentState.position.y;
                        visibilitySphere.position.z = agentState.position.z;
                    }
                }
            }
        }
    }
}

// Export for use in other modules
window.MovementSystem = MovementSystem;
