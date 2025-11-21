#!/usr/bin/env python3

# Read the current script
with open('script.js', 'r') as f:
    content = f.read()

# 1. Add new global variables
content = content.replace(
    'let planetData = {};',
    '''let planetData = {};
let timeScale = 1;
let wormhole = null;
let ufos = [];
let lensFlare = null;'''
)

# 2. Add creation calls in init()
content = content.replace(
    '    // Add Atmospheres\n    addAtmospheres();',
    '''    // Add Atmospheres
    addAtmospheres();
    
    // Create Wormhole
    createWormhole();
    
    // Create UFOs
    createUFOs();
    
    // Create Lens Flare
    createLensFlare();
    
    // Init Controls
    initControls();'''
)

# 3. Add new functions
new_functions = '''
// Init Controls
function initControls() {
    const speedControl = document.getElementById('speed-control');
    if (speedControl) {
        speedControl.addEventListener('input', (e) => {
            timeScale = parseFloat(e.target.value);
        });
    }
}

// Create Wormhole
function createWormhole() {
    const wormholeGroup = new THREE.Group();
    
    // Torus Knot (The Portal)
    const geometry = new THREE.TorusKnotGeometry(40, 8, 100, 16);
    const material = new THREE.MeshBasicMaterial({
        color: 0x8800ff,
        wireframe: true,
        transparent: true,
        opacity: 0.5
    });
    const portal = new THREE.Mesh(geometry, material);
    wormholeGroup.add(portal);
    
    // Inner Glow
    const glowGeometry = new THREE.SphereGeometry(30, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    wormholeGroup.add(glow);
    
    // Particles sucking in
    const particleCount = 200;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    
    for(let i=0; i<particleCount; i++) {
        const r = 50 + Math.random() * 100;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI * 2;
        
        particlePositions[i*3] = r * Math.sin(theta) * Math.cos(phi);
        particlePositions[i*3+1] = r * Math.sin(theta) * Math.sin(phi);
        particlePositions[i*3+2] = r * Math.cos(theta);
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMaterial = new THREE.PointsMaterial({
        color: 0xff00ff,
        size: 2,
        transparent: true,
        opacity: 0.8
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    wormholeGroup.add(particles);
    
    // Position deep in space
    wormholeGroup.position.set(-1500, 200, -1500);
    wormholeGroup.lookAt(0, 0, 0);
    
    wormhole = wormholeGroup;
    scene.add(wormholeGroup);
}

// Create UFOs
function createUFOs() {
    const ufoCount = 3;
    
    for(let i=0; i<ufoCount; i++) {
        const ufoGroup = new THREE.Group();
        
        // Saucer Body
        const bodyGeometry = new THREE.SphereGeometry(5, 32, 16);
        bodyGeometry.scale(1, 0.3, 1);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x888888,
            metalness: 0.9,
            roughness: 0.1
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        ufoGroup.add(body);
        
        // Cockpit
        const cockpitGeometry = new THREE.SphereGeometry(2, 16, 16);
        const cockpitMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ff00,
            emissive: 0x00ff00,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.8
        });
        const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
        cockpit.position.y = 1.5;
        ufoGroup.add(cockpit);
        
        // Lights
        const lightCount = 8;
        for(let j=0; j<lightCount; j++) {
            const lightGeo = new THREE.SphereGeometry(0.5, 8, 8);
            const lightMat = new THREE.MeshBasicMaterial({ color: 0xff00ff });
            const light = new THREE.Mesh(lightGeo, lightMat);
            
            const angle = (j / lightCount) * Math.PI * 2;
            light.position.set(Math.cos(angle) * 4.5, 0, Math.sin(angle) * 4.5);
            ufoGroup.add(light);
        }
        
        // Initial Position
        ufoGroup.position.set(
            (Math.random() - 0.5) * 2000,
            (Math.random() - 0.5) * 200,
            (Math.random() - 0.5) * 2000
        );
        
        ufoGroup.userData = {
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2
            ),
            changeDirTimer: 0
        };
        
        ufos.push(ufoGroup);
        scene.add(ufoGroup);
    }
}

// Create Lens Flare (Simple Sprite Implementation)
function createLensFlare() {
    // Load texture (using a generated canvas for simplicity)
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 200, 0.5)');
    gradient.addColorStop(0.5, 'rgba(255, 200, 100, 0.1)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ 
        map: texture, 
        color: 0xffaa00, 
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.6
    });
    
    lensFlare = new THREE.Sprite(material);
    lensFlare.scale.set(200, 200, 1);
    scene.add(lensFlare);
}
'''

content = content.replace('// Mouse wheel zoom', new_functions + '// Mouse wheel zoom')

# 4. Update Animation Loop for Time Scale and New Objects
animation_update = '''
    // Apply Time Scale to global tick
    tick += 0.01 * timeScale;

    // Animate Wormhole
    if (wormhole) {
        wormhole.children[0].rotation.z -= 0.02 * timeScale; // Portal ring
        wormhole.children[2].rotation.y += 0.01 * timeScale; // Particles
    }
    
    // Animate UFOs
    ufos.forEach(ufo => {
        ufo.userData.changeDirTimer++;
        if (ufo.userData.changeDirTimer > 100) {
            ufo.userData.velocity.set(
                (Math.random() - 0.5) * 5,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 5
            );
            ufo.userData.changeDirTimer = 0;
        }
        
        ufo.position.add(ufo.userData.velocity.clone().multiplyScalar(timeScale));
        ufo.rotation.y += 0.1 * timeScale;
        
        // Keep within bounds
        if (ufo.position.length() > 2000) {
            ufo.position.setLength(1900);
            ufo.userData.velocity.negate();
        }
    });
    
    // Update Lens Flare Position
    if (lensFlare) {
        // Position flare between camera and sun (0,0,0)
        const sunPos = new THREE.Vector3(0, 0, 0);
        const camPos = camera.position.clone();
        
        // Simple flare logic: place at sun position
        lensFlare.position.copy(sunPos);
        
        // Fade out if looking away from sun
        const camDir = new THREE.Vector3();
        camera.getWorldDirection(camDir);
        const sunDir = sunPos.clone().sub(camPos).normalize();
        const angle = camDir.angleTo(sunDir);
        
        // Visible if angle is small (looking at sun)
        let opacity = Math.max(0, 1 - (angle / 1.5)); 
        lensFlare.material.opacity = opacity * 0.8;
    }
'''

# We need to inject the timeScale multiplier into existing animations
# This is a bit complex with regex, so we'll just append the new animation logic
# and manually update the existing ones if possible, or just let them run and add the new stuff.
# Ideally, we should update the existing speed constants to be multiplied by timeScale.

# Let's replace the specific speed additions with multiplied versions
replacements = [
    ('planet.userData.angle += planet.userData.speed;', 'planet.userData.angle += planet.userData.speed * timeScale;'),
    ('planet.rotation.y += 0.01;', 'planet.rotation.y += 0.01 * timeScale;'),
    ('satellite.userData.angle += satellite.userData.speed;', 'satellite.userData.angle += satellite.userData.speed * timeScale;'),
    ('satellite.rotation.y += 0.02;', 'satellite.rotation.y += 0.02 * timeScale;'),
    ('ship.userData.angle += ship.userData.speed;', 'ship.userData.angle += ship.userData.speed * timeScale;'),
    ('ship.position.y += ship.userData.verticalSpeed;', 'ship.position.y += ship.userData.verticalSpeed * timeScale;'),
    ('asteroid.userData.angle += asteroid.userData.speed;', 'asteroid.userData.angle += asteroid.userData.speed * timeScale;'),
    ('asteroid.rotation.x += asteroid.userData.rotationSpeed.x;', 'asteroid.rotation.x += asteroid.userData.rotationSpeed.x * timeScale;'),
    ('moon.userData.angle += moon.userData.speed;', 'moon.userData.angle += moon.userData.speed * timeScale;'),
    ('comet.userData.angle += comet.userData.speed;', 'comet.userData.angle += comet.userData.speed * timeScale;'),
    ('iss.userData.angle += iss.userData.speed;', 'iss.userData.angle += iss.userData.speed * timeScale;'),
    ('meteor.position.x += meteor.userData.velocity.x;', 'meteor.position.x += meteor.userData.velocity.x * timeScale;'),
    ('meteor.position.y += meteor.userData.velocity.y;', 'meteor.position.y += meteor.userData.velocity.y * timeScale;'),
    ('meteor.position.z += meteor.userData.velocity.z;', 'meteor.position.z += meteor.userData.velocity.z * timeScale;'),
    ('meteor.userData.life -= 0.01;', 'meteor.userData.life -= 0.01 * timeScale;')
]

for old, new in replacements:
    content = content.replace(old, new)

content = content.replace(
    '    // Camera follow focused planet',
    animation_update + '    // Camera follow focused planet'
)

# Write the modified content
with open('script.js', 'w') as f:
    f.write(content)

print("Successfully added Phase 3 enhancements!")
