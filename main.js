import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- Global Variables ---
let scene, camera, renderer, controls;
let hypercubeMesh = null; // Will hold the lines representing the cube
let N = 4; // Current dimension
let vertices = []; // N-dimensional vertices
let edges = []; // Pairs of vertex indices
let rotationAngles = {}; // Angles for each rotation plane, e.g., { '0-1': 0, '1-2': 0, ... }
let rotationSpeeds = {}; // Speeds for each rotation plane
let globalRotationSpeed = 0.01;
let projectionType = 'orthographic'; // 'orthographic' or 'perspective'
let colorScheme = 'default';

const colors = {
    default: 0xffffff,
    edge: 0x00ff00,
    vertex: 0xff0000, // Placeholder if we add vertices later
};

// --- DOM Elements ---
const container = document.getElementById('container');
const dimensionsSlider = document.getElementById('dimensions');
const dimensionsValueSpan = document.getElementById('dimensions-value');
const projectionSelect = document.getElementById('projection-type');
const speedSlider = document.getElementById('rotation-speed');
const speedValueSpan = document.getElementById('rotation-speed-value');
const colorSchemeSelect = document.getElementById('color-scheme');
const rotationPlanesDiv = document.getElementById('rotation-planes');

// --- Initialization ---
function init() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);

    // Camera
    const aspect = window.innerWidth / window.innerHeight;
    // Initial setup for orthographic, will adjust if perspective is chosen
    const frustumSize = 6;
    camera = new THREE.OrthographicCamera(
        frustumSize * aspect / -2, frustumSize * aspect / 2,
        frustumSize / 2, frustumSize / -2,
        0.1, 1000
    );
    camera.position.z = 5;
    // Renderer MUST be created before OrbitControls
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // Controls (OrbitControls for camera manipulation) - Create BEFORE first camera update
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 1;
    controls.maxDistance = 50;

    updateCameraProjection(); // Set initial projection based on select - NOW controls exist

    // Initial Cube
    updateDimensions(); // Generate initial cube based on default N=4

    // Event Listeners
    dimensionsSlider.addEventListener('input', handleDimensionChange);
    projectionSelect.addEventListener('change', handleProjectionChange);
    speedSlider.addEventListener('input', handleGlobalSpeedChange);
    colorSchemeSelect.addEventListener('change', handleColorSchemeChange);
    window.addEventListener('resize', onWindowResize);

    // Start Animation Loop
    animate();
}

// --- Core Logic Functions (Placeholders) ---

function generateHypercubeVertices(n) {
    // TODO: Generate 2^n vertices for an n-dimensional hypercube centered at origin
    console.log(`Generating vertices for ${n}D cube`);
    vertices = []; // Reset
    const numVertices = 1 << n; // 2^n
    for (let i = 0; i < numVertices; i++) {
        const vertex = [];
        for (let j = 0; j < n; j++) {
            // Calculate coordinates based on binary representation of i
            vertex.push((i >> j) & 1 ? 0.5 : -0.5);
        }
        vertices.push(vertex);
    }
    console.log("Generated vertices:", vertices);
    generateHypercubeEdges(n); // Generate edges after vertices
}

function generateHypercubeEdges(n) {
    // TODO: Generate edges connecting vertices that differ by one coordinate
    console.log(`Generating edges for ${n}D cube`);
    edges = []; // Reset
    const numVertices = vertices.length;
    for (let i = 0; i < numVertices; i++) {
        for (let j = i + 1; j < numVertices; j++) {
            let diffCount = 0;
            for (let k = 0; k < n; k++) {
                if (vertices[i][k] !== vertices[j][k]) {
                    diffCount++;
                }
            }
            if (diffCount === 1) {
                edges.push([i, j]);
            }
        }
    }
     console.log("Generated edges:", edges);
}

function applyRotations(verts, n) {
    // TODO: Apply rotations based on rotationAngles and rotationSpeeds for each plane
    let rotatedVertices = verts.map(v => [...v]); // Deep copy

    for (const planeKey in rotationAngles) {
        const angle = rotationAngles[planeKey];
        if (Math.abs(angle) < 1e-6) continue; // Skip if angle is negligible

        const indices = planeKey.split('-').map(Number);
        const i = indices[0];
        const j = indices[1];

        const cosTheta = Math.cos(angle);
        const sinTheta = Math.sin(angle);

        for (let k = 0; k < rotatedVertices.length; k++) {
            const v = rotatedVertices[k];
            const vi = v[i];
            const vj = v[j];
            v[i] = vi * cosTheta - vj * sinTheta;
            v[j] = vi * sinTheta + vj * cosTheta;
        }
    }
    return rotatedVertices;
}

function projectTo3D(verts, n) {
    // Project n-dimensional vertices to 3D space
    const distanceFactor = 2; // How strongly higher dimensions affect perspective

    return verts.map(v => {
        let x = v[0] || 0;
        let y = v[1] || 0;
        let z = v[2] || 0;

        if (n >= 4) {
            // Simple perspective based on the 4th dimension (w)
            // Add contributions from other dimensions if needed, scaled down
            let w = v[3] || 0;
            // Add contributions from dimensions 5+ for a pseudo-perspective effect
            for(let d = 4; d < n; d++) {
                w += v[d] || 0; // Simple sum, could be more complex
            }

            // Perspective division: scale x, y, z based on distance in higher dimensions
            // Adding a base to prevent division by zero or extreme scaling near w = -distanceFactor
            const scale = distanceFactor / (distanceFactor + w);
            x *= scale;
            y *= scale;
            z *= scale; // Also scale z for depth effect
        }
        return new THREE.Vector3(x, y, z);
    });
}

function updateCubeGeometry() {
    if (hypercubeMesh) {
        scene.remove(hypercubeMesh);
        hypercubeMesh.geometry.dispose();
        // Assuming LineSegments uses an array of materials
        if (Array.isArray(hypercubeMesh.material)) {
            hypercubeMesh.material.forEach(mat => mat.dispose());
        } else {
            hypercubeMesh.material.dispose();
        }
    }

    // 1. Generate N-D vertices and edges if N changed
    // (Handled by updateDimensions)

    // 2. Apply current rotations
    const rotatedVertices = applyRotations(vertices, N);

    // 3. Project to 3D
    const projectedVertices = projectTo3D(rotatedVertices, N);

    // 4. Create Three.js geometry
    const geometry = new THREE.BufferGeometry().setFromPoints(projectedVertices);

    // 5. Define indices for line segments
    const indices = [];
    edges.forEach(edge => {
        indices.push(edge[0], edge[1]);
    });
    geometry.setIndex(indices);

    // 6. Create material and apply colors based on scheme
    let material;
    if (colorScheme === 'rainbow' || colorScheme === 'depth') {
        material = new THREE.LineBasicMaterial({ vertexColors: true });
        const lineColors = [];
        const color = new THREE.Color(); // Temporary color object

        edges.forEach((edge, index) => {
            const startVertex = projectedVertices[edge[0]];
            const endVertex = projectedVertices[edge[1]];

            let startColor, endColor;

            if (colorScheme === 'rainbow') {
                // Assign color based on edge index (simple rainbow effect)
                startColor = color.setHSL(index / edges.length, 1.0, 0.5);
                endColor = startColor; // Same color for both ends of the line segment
            } else { // depth cue
                // Assign color based on average Z depth of the edge's vertices
                // Normalize depth based on typical projection range (e.g., -2 to 2)
                const avgZ = (startVertex.z + endVertex.z) / 2;
                const depthFactor = THREE.MathUtils.smoothstep(avgZ, -2, 2); // Map z from [-2, 2] to [0, 1]
                startColor = color.setRGB(depthFactor, depthFactor, depthFactor); // Grayscale depth
                endColor = startColor;
            }

            lineColors.push(startColor.r, startColor.g, startColor.b);
            lineColors.push(endColor.r, endColor.g, endColor.b);
        });

        geometry.setAttribute('color', new THREE.Float32BufferAttribute(lineColors, 3));

    } else { // default
        material = new THREE.LineBasicMaterial({ color: colors.default });
    }


    // 7. Create mesh (LineSegments)
    hypercubeMesh = new THREE.LineSegments(geometry, material);
    scene.add(hypercubeMesh);
}

function updateRotationPlanesUI(n) {
    rotationPlanesDiv.innerHTML = ''; // Clear existing controls
    rotationAngles = {}; // Reset angles
    rotationSpeeds = {}; // Reset speeds

    const axes = ['x', 'y', 'z', 'w', 'v', 'u', 't', 's', 'r', 'q']; // Up to 10D
    const numPlanes = n * (n - 1) / 2;

    if (n < 2) {
         rotationPlanesDiv.innerHTML = '<p>Need at least 2 dimensions for rotation.</p>';
         return;
    }
     if (numPlanes === 0) {
         rotationPlanesDiv.innerHTML = '<p>No rotation planes for this dimension.</p>';
         return;
     }


    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            const planeKey = `${i}-${j}`;
            rotationAngles[planeKey] = 0; // Initialize angle
            rotationSpeeds[planeKey] = 1.0; // Default speed multiplier for this plane

            const controlDiv = document.createElement('div');
            controlDiv.className = 'plane-control';

            const label = document.createElement('label');
            const axis1 = axes[i] || `axis ${i+1}`;
            const axis2 = axes[j] || `axis ${j+1}`;
            label.htmlFor = `rot-${planeKey}`;
            label.textContent = `Plane ${axis1}-${axis2}:`;

            const slider = document.createElement('input');
            slider.type = 'range';
            slider.id = `rot-${planeKey}`;
            slider.min = "-1"; // Represents speed multiplier (-1 to 1)
            slider.max = "1";
            slider.step = "0.1";
            slider.value = "0"; // Initial speed multiplier is 0 (no rotation)
            slider.dataset.planeKey = planeKey; // Store key for lookup

            slider.addEventListener('input', (event) => {
                const key = event.target.dataset.planeKey;
                rotationSpeeds[key] = parseFloat(event.target.value);
                // We don't directly set angle here, speed controls rate of change in animate()
            });

            controlDiv.appendChild(label);
            controlDiv.appendChild(slider);
            rotationPlanesDiv.appendChild(controlDiv);
        }
    }
}


// --- Event Handlers ---
function handleDimensionChange(event) {
    N = parseInt(event.target.value);
    dimensionsValueSpan.textContent = N;
    updateDimensions();
}

function updateDimensions() {
    generateHypercubeVertices(N); // Regenerate vertices and edges for new N
    updateRotationPlanesUI(N); // Update sliders for rotation planes
    updateCubeGeometry(); // Recreate the visual object
}


function handleProjectionChange(event) {
    projectionType = event.target.value;
    updateCameraProjection();
    // No need to update geometry, just the camera
}

function updateCameraProjection() {
     const aspect = window.innerWidth / window.innerHeight;
     const frustumSize = 6; // Adjust as needed

    if (projectionType === 'perspective') {
        camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
         camera.position.z = 5; // Reset position for perspective
    } else { // orthographic
        camera = new THREE.OrthographicCamera(
            frustumSize * aspect / -2, frustumSize * aspect / 2,
            frustumSize / 2, frustumSize / -2,
            0.1, 1000
        );
         camera.position.z = 5; // Reset position for orthographic
    }
    // Important: Update OrbitControls to use the new camera
    controls.object = camera;
    controls.update();
}


function handleGlobalSpeedChange(event) {
    globalRotationSpeed = parseFloat(event.target.value);
    speedValueSpan.textContent = globalRotationSpeed.toFixed(3);
}

function handleColorSchemeChange(event) {
    colorScheme = event.target.value;
    // TODO: Implement logic to change colors in updateCubeGeometry or a dedicated function
    console.log("Color scheme changed to:", colorScheme);
     // Force geometry update to apply new color (if material needs changing)
     updateCubeGeometry();
}

function onWindowResize() {
    const aspect = window.innerWidth / window.innerHeight;
    if (camera.isPerspectiveCamera) {
        camera.aspect = aspect;
    } else if (camera.isOrthographicCamera) {
        const frustumHeight = camera.top - camera.bottom;
        camera.left = -frustumHeight * aspect / 2;
        camera.right = frustumHeight * aspect / 2;
    }
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate);

    // Update rotation angles based on speeds
    for (const planeKey in rotationAngles) {
        rotationAngles[planeKey] += globalRotationSpeed * (rotationSpeeds[planeKey] || 0);
         // Keep angles reasonable, e.g., wrap around 2*PI if desired, though not strictly necessary
         // rotationAngles[planeKey] %= (2 * Math.PI);
    }


    // Update the cube's geometry based on new rotations/projections
    updateCubeGeometry();

    // Update camera controls
    controls.update();

    // Render the scene
    renderer.render(scene, camera);
}

// --- Start ---
init();