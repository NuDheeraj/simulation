// Get the canvas element
const canvas = document.getElementById("renderCanvas");

// Check if canvas exists
if (!canvas) {
    console.error("Canvas element not found!");
    alert("Canvas element not found! Please check your HTML.");
}

// Check if Babylon.js is loaded
if (typeof BABYLON === 'undefined') {
    console.error("Babylon.js not loaded!");
    alert("Babylon.js failed to load. Please check your internet connection.");
}

// Create the Babylon.js engine
const engine = new BABYLON.Engine(canvas, true);

// Check if engine was created successfully
if (!engine) {
    console.error("Failed to create Babylon.js engine!");
    alert("Failed to create Babylon.js engine. Your browser might not support WebGL.");
}

// Create the scene
const scene = new BABYLON.Scene(engine);
console.log("Scene created successfully");

// Create a camera with proper controls
const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 10, BABYLON.Vector3.Zero(), scene);
// Try different attachControls methods for compatibility
if (camera.attachControls) {
    camera.attachControls(canvas, true);
} else if (camera.attachToCanvas) {
    camera.attachToCanvas(canvas, true);
} else {
    console.log("Camera controls not available in this Babylon.js version");
}
camera.wheelPrecision = 50;
camera.pinchPrecision = 20;
camera.lowerRadiusLimit = 2;
camera.upperRadiusLimit = 20;
console.log("Camera created and attached");

// Create lighting
const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
light.intensity = 0.7;

// Add directional light for better visibility
const directionalLight = new BABYLON.DirectionalLight("directionalLight", new BABYLON.Vector3(-1, -1, -1), scene);
directionalLight.intensity = 0.5;

// Create the first capsule
const capsule1 = BABYLON.MeshBuilder.CreateCapsule("capsule1", {
    radius: 0.5,
    height: 2,
    subdivisions: 4,
    tessellation: 8
}, scene);
capsule1.position = new BABYLON.Vector3(-2, 0, 0);

// Create material for first capsule
const material1 = new BABYLON.StandardMaterial("material1", scene);
material1.diffuseColor = new BABYLON.Color3(1, 0.2, 0.2); // Red
material1.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
capsule1.material = material1;

// Create the second capsule
const capsule2 = BABYLON.MeshBuilder.CreateCapsule("capsule2", {
    radius: 0.5,
    height: 2,
    subdivisions: 4,
    tessellation: 8
}, scene);
capsule2.position = new BABYLON.Vector3(2, 0, 0);

// Create material for second capsule
const material2 = new BABYLON.StandardMaterial("material2", scene);
material2.diffuseColor = new BABYLON.Color3(0.2, 0.2, 1); // Blue
material2.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
capsule2.material = material2;

// Add some rotation animation to make it more interesting
let time = 0;
scene.registerBeforeRender(() => {
    time += 0.01;
    capsule1.rotation.y = Math.sin(time) * 0.5;
    capsule2.rotation.y = Math.cos(time) * 0.5;
});

// Add a ground plane for reference
const ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 10, height: 10}, scene);
const groundMaterial = new BABYLON.StandardMaterial("groundMaterial", scene);
groundMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.3);
ground.material = groundMaterial;

// Start the render loop
engine.runRenderLoop(() => {
    scene.render();
});

// Add some debugging
console.log("Scene objects:", scene.meshes.length);
console.log("Camera position:", camera.position);
console.log("Camera target:", camera.target);

// Handle window resize
window.addEventListener("resize", () => {
    engine.resize();
});
