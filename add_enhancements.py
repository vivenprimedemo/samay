#!/usr/bin/env python3

# Read the current script
with open('script.js', 'r') as f:
    content = f.read()

# 1. Add new arrays after spaceships
content = content.replace(
    'let spaceships = [];',
    '''let spaceships = [];
let asteroids = [];
let moon = null;
let comet = null;
let meteors = [];
let focusedPlanet = null;
let cameraTarget = { x: 0, y: 1200, z: 0 };'''
)

# 2. Add creation calls after createSpaceships()
content = content.replace(
    '    // Create spaceships\n    createSpaceships();',
    '''    // Create spaceships
    createSpaceships();
    
    // Create asteroid belt
    createAsteroidBelt();
    
    // Create Earth's moon
    createMoon();
    
    // Create comet
    createComet();
    
    // Create meteors
    createMeteors();'''
)

# 3. Add all creation functions before onMouseWheel
enhancement_code = '''
// Create asteroid belt
function createAsteroidBelt() {
    const asteroidCount = 500;
    const minDistance = 550;
    const maxDistance = 650;
    
    for (let i = 0; i < asteroidCount; i++) {
        const size = Math.random() * 1.5 + 0.5;
        const geometry = new THREE.DodecahedronGeometry(size, 0);
        const material = new THREE.MeshStandardMaterial({
            color: 0x888888,
            roughness: 0.9,
            metalness: 0.1
        });
        const asteroid = new THREE.Mesh(geometry, material);
        
        const distance = minDistance + Math.random() * (maxDistance - minDistance);
        const angle = Math.random() * Math.PI * 2;
        const verticalOffset = (Math.random() - 0.5) * 20;
        
        asteroid.position.x = Math.cos(angle) * distance;
        asteroid.position.z = Math.sin(angle) * distance;
        asteroid.position.y = verticalOffset;
        
        asteroid.userData = {
            distance: distance,
            speed: 0.003 + Math.random() * 0.002,
            angle: angle,
            rotationSpeed: {
                x: (Math.random() - 0.5) * 0.02,
                y: (Math.random() - 0.5) * 0.02,
                z: (Math.random() - 0.5) * 0.02
            }
        };
        
        scene.add(asteroid);
        asteroids.push(asteroid);
    }
}

// Create Earth's moon
function createMoon() {
    const moonGeometry = new THREE.SphereGeometry(7, 32, 32);
    const moonMaterial = new THREE.MeshStandardMaterial({
        color: 0xaaaaaa,
        roughness: 0.9,
        metalness: 0.1
    });
    moon = new THREE.Mesh(moonGeometry, moonMaterial);
    
    moon.userData = {
        orbitRadius: 40,
        speed: 0.05,
        angle: 0
    };
    
    scene.add(moon);
}

// Create comet
function createComet() {
    const cometGroup = new THREE.Group();
    
    // Comet nucleus
    const nucleusGeometry = new THREE.SphereGeometry(4, 16, 16);
    const nucleusMaterial = new THREE.MeshStandardMaterial({
        color: 0xccddff,
        emissive: 0x4488ff,
        emissiveIntensity: 0.5
    });
    const nucleus = new THREE.Mesh(nucleusGeometry, nucleusMaterial);
    cometGroup.add(nucleus);
    
    // Comet tail (particles)
    const tailGeometry = new THREE.BufferGeometry();
    const tailCount = 100;
    const tailPositions = new Float32Array(tailCount * 3);
    
    for (let i = 0; i < tailCount; i++) {
        const distance = i * 2;
        tailPositions[i * 3] = -distance;
        tailPositions[i * 3 + 1] = (Math.random() - 0.5) * 2;
        tailPositions[i * 3 + 2] = (Math.random() - 0.5) * 2;
    }
    
    tailGeometry.setAttribute('position', new THREE.BufferAttribute(tailPositions, 3));
    
    const tailMaterial = new THREE.PointsMaterial({
        color: 0x88ccff,
        size: 3,
        transparent: true,
        opacity: 0.6,
        sizeAttenuation: true
    });
    
    const tail = new THREE.Points(tailGeometry, tailMaterial);
    cometGroup.add(tail);
    
    cometGroup.userData = {
        angle: 0,
        speed: 0.008,
        minDistance: 300,
        maxDistance: 1400,
        eccentricity: 0.7
    };
    
    comet = cometGroup;
    scene.add(cometGroup);
}

// Create meteor shower
function createMeteors() {
    for (let i = 0; i < 10; i++) {
        createMeteor();
    }
}

function createMeteor() {
    const meteorGeometry = new THREE.SphereGeometry(1, 8, 8);
    const meteorMaterial = new THREE.MeshBasicMaterial({
        color: 0xffaa00,
        emissive: 0xffaa00,
        emissiveIntensity: 1,
        transparent: true,
        opacity: 1
    });
    const meteor = new THREE.Mesh(meteorGeometry, meteorMaterial);
    
    // Random starting position far from center
    const angle = Math.random() * Math.PI * 2;
    const distance = 2000 + Math.random() * 500;
    meteor.position.x = Math.cos(angle) * distance;
    meteor.position.y = (Math.random() - 0.5) * 1000;
    meteor.position.z = Math.sin(angle) * distance;
    
    // Direction towards center with some randomness
    const targetAngle = angle + Math.PI + (Math.random() - 0.5) * 0.5;
    meteor.userData = {
        velocity: {
            x: Math.cos(targetAngle) * 15,
            y: (Math.random() - 0.5) * 5,
            z: Math.sin(targetAngle) * 15
        },
        life: 1.0
    };
    
    scene.add(meteor);
    meteors.push(meteor);
}

// Click to focus on planet
function onPlanetClick(event) {
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    
    const intersects = raycaster.intersectObjects(planets);
    
    if (intersects.length > 0) {
        focusedPlanet = intersects[0].object;
        console.log('Focused on:', focusedPlanet.userData.name);
    } else if (focusedPlanet) {
        // Click empty space to unfocus
        focusedPlanet = null;
        cameraTarget = { x: 0, y: 1200, z: 0 };
    }
}

'''

content = content.replace('// Mouse wheel zoom', enhancement_code + '// Mouse wheel zoom')

# 4. Add event listener for clicks
content = content.replace(
    "    window.addEventListener('wheel', onMouseWheel);",
    "    window.addEventListener('wheel', onMouseWheel);\n    window.addEventListener('click', onPlanetClick);"
)

# 5. Add animation for all new objects before star animation
animation_code = '''    
    // Animate asteroids
    asteroids.forEach(asteroid => {
        asteroid.userData.angle += asteroid.userData.speed;
        asteroid.position.x = Math.cos(asteroid.userData.angle) * asteroid.userData.distance;
        asteroid.position.z = Math.sin(asteroid.userData.angle) * asteroid.userData.distance;
        
        asteroid.rotation.x += asteroid.userData.rotationSpeed.x;
        asteroid.rotation.y += asteroid.userData.rotationSpeed.y;
        asteroid.rotation.z += asteroid.userData.rotationSpeed.z;
    });
    
    // Animate Earth's moon
    if (moon && planets[2]) { // Earth is index 2
        const earth = planets[2];
        moon.userData.angle += moon.userData.speed;
        moon.position.x = earth.position.x + Math.cos(moon.userData.angle) * moon.userData.orbitRadius;
        moon.position.z = earth.position.z + Math.sin(moon.userData.angle) * moon.userData.orbitRadius;
        moon.position.y = earth.position.y;
    }
    
    // Animate comet (elliptical orbit)
    if (comet) {
        comet.userData.angle += comet.userData.speed;
        const a = comet.userData.maxDistance;
        const e = comet.userData.eccentricity;
        const r = a * (1 - e * e) / (1 + e * Math.cos(comet.userData.angle));
        
        comet.position.x = r * Math.cos(comet.userData.angle);
        comet.position.z = r * Math.sin(comet.userData.angle);
        comet.position.y = Math.sin(comet.userData.angle * 2) * 100;
        
        // Point comet in direction of movement
        comet.rotation.y = comet.userData.angle + Math.PI / 2;
    }
    
    // Animate meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
        const meteor = meteors[i];
        meteor.position.x += meteor.userData.velocity.x;
        meteor.position.y += meteor.userData.velocity.y;
        meteor.position.z += meteor.userData.velocity.z;
        
        meteor.userData.life -= 0.01;
        meteor.material.opacity = meteor.userData.life;
        
        if (meteor.userData.life <= 0) {
            scene.remove(meteor);
            meteors.splice(i, 1);
            createMeteor(); // Create new one
        }
    }
    
    // Camera follow focused planet
    if (focusedPlanet) {
        cameraTarget.x = focusedPlanet.position.x;
        cameraTarget.z = focusedPlanet.position.z;
        cameraTarget.y = 300;
    }
    
    // Smooth camera movement
    camera.position.x += (cameraTarget.x - camera.position.x) * 0.05;
    camera.position.y += (cameraTarget.y - camera.position.y) * 0.05;
    camera.position.z += (cameraTarget.z - camera.position.z) * 0.05;
    camera.lookAt(cameraTarget.x, 0, cameraTarget.z);
'''

content = content.replace(
    '    // Move stars towards camera (upward in Y direction)',
    animation_code + '    // Move stars towards camera (upward in Y direction)'
)

# Write the modified content
with open('script.js', 'w') as f:
    f.write(content)

print("Successfully added all enhancements!")
print("- Asteroid belt (500 asteroids)")
print("- Earth's moon")
print("- Comet with tail")
print("- Meteor shower (10 meteors)")
print("- Click-to-focus interaction")
