import * as THREE from 'three';

console.log("Game script starting...");

// --- Game Constants ---
const WORLD_SIZE = 50;
const BUILDING_COUNT = 30;
const KITTY_SPEED = 0.2;
const KITTY_ROT_SPEED = 0.05;

// --- State ---
let score = 0;
const buildings = [];
const keys = {};

// --- Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Sky blue

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 10, 20); // Match the follow offset
camera.lookAt(0, 0, 0);

let renderer;
try {
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.getElementById('game-container').appendChild(renderer.domElement);
} catch (error) {
    console.error("WebGL Error:", error);
    document.getElementById('ui').innerHTML = `
        <div style="background: rgba(255,235,238,0.95); padding: 30px; border-radius: 12px; text-align: center; color: #b71c1c; max-width: 500px; margin: 100px auto; border: 2px solid #ef5350; box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
            <h2 style="margin-top:0;">⚠️ WebGL Failed</h2>
            <p style="font-size: 1.1em;">Your browser cannot render 3D graphics.</p>
            <p>Please enable <strong>Hardware Acceleration</strong> in your browser settings.</p>
            <div style="background: #fff; padding: 10px; border-radius: 6px; font-family: monospace; font-size: 0.8em; color: #333; margin-top: 15px;">
                ${error.message || "Unknown WebGL Error"}
            </div>
        </div>
    `;
    throw error; // Stop the script
}

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(10, 20, 10);
dirLight.castShadow = true;
dirLight.shadow.camera.left = -30;
dirLight.shadow.camera.right = 30;
dirLight.shadow.camera.top = 30;
dirLight.shadow.camera.bottom = -30;
scene.add(dirLight);

// --- World ---
const groundGeo = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE);
const groundMat = new THREE.MeshStandardMaterial({ color: 0xd2b48c }); // Tan cardboard color
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// --- Kaiju Kitty ---
const kitty = new THREE.Group();

// Body
const body = new THREE.Mesh(
    new THREE.BoxGeometry(2, 1.5, 3),
    new THREE.MeshStandardMaterial({ color: 0xffa500 }) // Orange kitty
);
body.position.y = 0.75;
body.castShadow = true;
kitty.add(body);

// Head
const head = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 1.2, 1.2),
    new THREE.MeshStandardMaterial({ color: 0xffa500 })
);
head.position.set(0, 1.8, 1.2);
head.castShadow = true;
kitty.add(head);

// Ears
const earGeo = new THREE.BoxGeometry(0.3, 0.5, 0.2);
const leftEar = new THREE.Mesh(earGeo, new THREE.MeshStandardMaterial({ color: 0xffa500 }));
leftEar.position.set(0.4, 2.5, 1.2);
kitty.add(leftEar);

const rightEar = new THREE.Mesh(earGeo, new THREE.MeshStandardMaterial({ color: 0xffa500 }));
rightEar.position.set(-0.4, 2.5, 1.2);
kitty.add(rightEar);

// Tail
const tail = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.4, 2),
    new THREE.MeshStandardMaterial({ color: 0xffa500 })
);
tail.position.set(0, 1, -2);
tail.rotation.x = 0.5;
kitty.add(tail);

scene.add(kitty);

// --- Buildings ---
function createBuilding() {
    const w = 1 + Math.random() * 2;
    const h = 2 + Math.random() * 6;
    const d = 1 + Math.random() * 2;
    
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshStandardMaterial({ 
        color: new THREE.Color().setHSL(Math.random(), 0.3, 0.6) 
    });
    const b = new THREE.Mesh(geo, mat);
    
    b.position.x = (Math.random() - 0.5) * (WORLD_SIZE - 10);
    b.position.z = (Math.random() - 0.5) * (WORLD_SIZE - 10);
    b.position.y = h / 2;
    b.castShadow = true;
    b.receiveShadow = true;
    
    // Custom properties for physics simulation
    b.velocity = new THREE.Vector3();
    b.isFalling = false;
    
    scene.add(b);
    buildings.push(b);
}

for (let i = 0; i < BUILDING_COUNT; i++) {
    createBuilding();
}

// --- Input ---
window.addEventListener('keydown', (e) => keys[e.code] = true);
window.addEventListener('keyup', (e) => keys[e.code] = false);

// --- Animation Loop ---
let frameCount = 0;
function animate() {
    requestAnimationFrame(animate);
    
    if (frameCount === 0) console.log("Animation loop started!");
    frameCount++;

    // Movement
    // Move "Forward" (negative Z)
    if (keys['KeyW'] || keys['ArrowUp']) {
        kitty.translateZ(-KITTY_SPEED);
    }
    // Move "Backward" (positive Z)
    if (keys['KeyS'] || keys['ArrowDown']) {
        kitty.translateZ(KITTY_SPEED);
    }
    if (keys['KeyA'] || keys['ArrowLeft']) {
        kitty.rotation.y += KITTY_ROT_SPEED;
    }
    if (keys['KeyD'] || keys['ArrowRight']) {
        kitty.rotation.y -= KITTY_ROT_SPEED;
    }

    // Camera follow
    // Offset relative to kitty: 0 horizontal, 10 up, 20 BEHIND (positive Z)
    const relativeCameraOffset = new THREE.Vector3(0, 10, 20);
    
    // Ensure matrix is updated before calculation (fixes potential jitter/lag)
    kitty.updateMatrixWorld();
    
    const cameraOffset = relativeCameraOffset.applyMatrix4(kitty.matrixWorld);
    camera.position.lerp(cameraOffset, 0.1);
    camera.lookAt(kitty.position);

    // Physics & Collision
    buildings.forEach((b, index) => {
        if (b.isFalling) {
            b.position.y -= 0.5;
            b.rotation.x += 0.1;
            b.rotation.z += 0.1;
            if (b.position.y < -20) {
                scene.remove(b);
                buildings.splice(index, 1);
                score++;
                document.getElementById('score').innerText = `Buildings Destroyed: ${score}`;
                createBuilding(); // Respawn new building
            }
            return;
        }

        // Simple distance check for collision
        // Use a dynamic radius based on building size (max dimension)
        const buildingRadius = Math.max(b.geometry.parameters.width, b.geometry.parameters.depth) / 2;
        const collisionThreshold = buildingRadius + 2.0; // 2.0 = approx kitty radius + buffer

        // Distance in 2D (ignore height differences for initial check)
        const distSq = (kitty.position.x - b.position.x) ** 2 + (kitty.position.z - b.position.z) ** 2;
        
        if (distSq < collisionThreshold ** 2) {
            // Calculate push direction (horizontal only)
            const dir = new THREE.Vector3()
                .subVectors(b.position, kitty.position)
                .setY(0) // Flatten vector so buildings don't fly up
                .normalize();
                
            // Apply impulse
            b.velocity.addScaledVector(dir, 0.5);
        }

        // Apply velocity
        b.position.add(b.velocity);
        b.velocity.multiplyScalar(0.9); // Friction

        // Check if falling off edge
        if (Math.abs(b.position.x) > WORLD_SIZE / 2 || Math.abs(b.position.z) > WORLD_SIZE / 2) {
            b.isFalling = true;
        }
    });

    renderer.render(scene, camera);
}

animate();

// Handle Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
