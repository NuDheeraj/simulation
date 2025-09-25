/**
 * Scene management module for AI Agents Simulation
 */
class SceneManager {
    constructor() {
        this.engine = null;
        this.scene = null;
        this.camera = null;
        this.canvas = null;
    }

    /**
     * Initialize the 3D scene
     */
    async initialize() {
        try {
            // Get the canvas element
            this.canvas = document.getElementById("renderCanvas");
            if (!this.canvas) {
                throw new Error("Canvas element not found!");
            }

            // Check if Babylon.js is loaded
            if (typeof BABYLON === 'undefined') {
                throw new Error("Babylon.js not loaded!");
            }

            // Create the Babylon.js engine
            this.engine = new BABYLON.Engine(this.canvas, true);
            if (!this.engine) {
                throw new Error("Failed to create Babylon.js engine!");
            }

            // Create the scene
            this.scene = new BABYLON.Scene(this.engine);
            console.log("Scene created successfully");

            // Setup camera
            this.setupCamera();
            
            // Setup lighting
            this.setupLighting();
            
            // Create ground
            this.createGround();
            
            // Setup render loop
            this.setupRenderLoop();
            
            // Handle window resize
            this.setupResizeHandler();

            console.log("Scene initialized successfully!");
            return true;
        } catch (error) {
            console.error("Error initializing scene:", error);
            throw error;
        }
    }

    /**
     * Setup camera with proper controls
     */
    setupCamera() {
        try {
            this.camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 10, BABYLON.Vector3.Zero(), this.scene);
            
            // Try different attachControl methods for compatibility
            if (this.camera.attachControl) {
                this.camera.attachControl(this.canvas, true);
            } else if (this.camera.attachToCanvas) {
                this.camera.attachToCanvas(this.canvas, true);
            } else {
                console.log("ArcRotateCamera controls not available, using UniversalCamera");
                this.camera = new BABYLON.UniversalCamera("camera", new BABYLON.Vector3(0, 5, -10), this.scene);
                this.camera.setTarget(BABYLON.Vector3.Zero());
                this.camera.attachControl(this.canvas, true);
                this.camera.speed = 2;
                this.camera.angularSensibility = 2000;
            }
            
            if (this.camera.wheelPrecision !== undefined) {
                this.camera.wheelPrecision = 50;
                this.camera.pinchPrecision = 20;
                this.camera.lowerRadiusLimit = 2;
                this.camera.upperRadiusLimit = 20;
            }
            
            console.log("Camera created and attached");
        } catch (error) {
            console.log("ArcRotateCamera not available, using UniversalCamera:", error);
            this.camera = new BABYLON.UniversalCamera("camera", new BABYLON.Vector3(0, 5, -10), this.scene);
            this.camera.setTarget(BABYLON.Vector3.Zero());
            this.camera.attachControl(this.canvas, true);
            this.camera.speed = 2;
            this.camera.angularSensibility = 2000;
        }
    }

    /**
     * Setup lighting for the scene
     */
    setupLighting() {
        // Create hemispheric light
        const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), this.scene);
        light.intensity = 0.7;
        
        // Add directional light for better visibility
        const directionalLight = new BABYLON.DirectionalLight("directionalLight", new BABYLON.Vector3(-1, -1, -1), this.scene);
        directionalLight.intensity = 0.5;
    }

    /**
     * Create ground plane
     */
    createGround() {
        const ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 10, height: 10}, this.scene);
        const groundMaterial = new BABYLON.StandardMaterial("groundMaterial", this.scene);
        groundMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.3);
        ground.material = groundMaterial;
    }

    /**
     * Setup render loop
     */
    setupRenderLoop() {
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });
    }

    /**
     * Setup window resize handler
     */
    setupResizeHandler() {
        window.addEventListener("resize", () => {
            this.engine.resize();
        });
    }

    /**
     * Get the scene instance
     */
    getScene() {
        return this.scene;
    }

    /**
     * Get the engine instance
     */
    getEngine() {
        return this.engine;
    }

    /**
     * Get the camera instance
     */
    getCamera() {
        return this.camera;
    }
}

// Export for use in other modules
window.SceneManager = SceneManager;
