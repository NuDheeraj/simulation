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
        
        // Create walls around the perimeter
        this.createWalls();
    }
    
    /**
     * Create walls around the perimeter of the ground
     */
    createWalls() {
        const wallHeight = 1;
        const wallThickness = 0.2;
        const groundSize = 10;
        
        // Create wall material with a nice texture
        const wallMaterial = new BABYLON.StandardMaterial("wallMaterial", this.scene);
        wallMaterial.diffuseColor = new BABYLON.Color3(0.6, 0.4, 0.3); // Brownish color
        wallMaterial.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        
        // North wall (positive Z)
        const northWall = BABYLON.MeshBuilder.CreateBox("northWall", {
            width: groundSize + wallThickness * 2,
            height: wallHeight,
            depth: wallThickness
        }, this.scene);
        northWall.position = new BABYLON.Vector3(0, wallHeight / 2, groundSize / 2);
        northWall.material = wallMaterial;
        
        // South wall (negative Z)
        const southWall = BABYLON.MeshBuilder.CreateBox("southWall", {
            width: groundSize + wallThickness * 2,
            height: wallHeight,
            depth: wallThickness
        }, this.scene);
        southWall.position = new BABYLON.Vector3(0, wallHeight / 2, -groundSize / 2);
        southWall.material = wallMaterial;
        
        // East wall (positive X)
        const eastWall = BABYLON.MeshBuilder.CreateBox("eastWall", {
            width: wallThickness,
            height: wallHeight,
            depth: groundSize
        }, this.scene);
        eastWall.position = new BABYLON.Vector3(groundSize / 2, wallHeight / 2, 0);
        eastWall.material = wallMaterial;
        
        // West wall (negative X)
        const westWall = BABYLON.MeshBuilder.CreateBox("westWall", {
            width: wallThickness,
            height: wallHeight,
            depth: groundSize
        }, this.scene);
        westWall.position = new BABYLON.Vector3(-groundSize / 2, wallHeight / 2, 0);
        westWall.material = wallMaterial;
        
        // Add corner posts for visual interest
        this.createCornerPosts(groundSize, wallHeight);
    }
    
    /**
     * Create decorative corner posts
     */
    createCornerPosts(groundSize, wallHeight) {
        const postSize = 0.3;
        const postMaterial = new BABYLON.StandardMaterial("postMaterial", this.scene);
        postMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.25, 0.15); // Darker brown
        postMaterial.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);
        
        const corners = [
            [groundSize / 2, groundSize / 2],   // Northeast
            [groundSize / 2, -groundSize / 2],  // Southeast
            [-groundSize / 2, groundSize / 2],  // Northwest
            [-groundSize / 2, -groundSize / 2]  // Southwest
        ];
        
        corners.forEach(([x, z], index) => {
            const post = BABYLON.MeshBuilder.CreateBox(`cornerPost${index}`, {
                width: postSize,
                height: wallHeight + 0.2,
                depth: postSize
            }, this.scene);
            post.position = new BABYLON.Vector3(x, (wallHeight + 0.2) / 2, z);
            post.material = postMaterial;
        });
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
