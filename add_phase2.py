#!/usr/bin/env python3

# Read the current script
with open('script.js', 'r') as f:
    content = f.read()

# 1. Add new global variables
content = content.replace(
    'let cameraTarget = { x: 0, y: 1200, z: 0 };',
    '''let cameraTarget = { x: 0, y: 1200, z: 0 };
let iss = null;
let nebulas = [];
let planetData = {};'''
)

# 2. Add creation calls in init()
content = content.replace(
    '    // Create meteors\n    createMeteors();',
    '''    // Create meteors
    createMeteors();
    
    // Create Nebula Background
    createNebula();
    
    // Create ISS
    createISS();
    
    // Initialize Planet Data
    initPlanetData();
    
    // Add Atmospheres
    addAtmospheres();'''
)

# 3. Add new functions
new_functions = '''
// Initialize Planet Data
function initPlanetData() {
    planetData = {
        'Mercury': { type: 'Terrestrial', diameter: '4,880 km', distance: '58 million km', desc: 'The smallest planet in our solar system and closest to the Sun.' },
        'Venus': { type: 'Terrestrial', diameter: '12,104 km', distance: '108 million km', desc: 'Spinning in the opposite direction to most planets, Venus is the hottest planet.' },
        'Earth': { type: 'Terrestrial', diameter: '12,742 km', distance: '149.6 million km', desc: 'Our home planet is the only place we know of so far that’s inhabited by living things.' },
        'Mars': { type: 'Terrestrial', diameter: '6,779 km', distance: '228 million km', desc: 'Mars is a dusty, cold, desert world with a very thin atmosphere.' },
        'Jupiter': { type: 'Gas Giant', diameter: '139,820 km', distance: '778 million km', desc: 'Jupiter is more than twice as massive as the other planets of our solar system combined.' },
        'Saturn': { type: 'Gas Giant', diameter: '116,460 km', distance: '1.4 billion km', desc: 'Adorned with a dazzling, complex system of icy rings, Saturn is unique in our solar system.' },
        'Uranus': { type: 'Ice Giant', diameter: '50,724 km', distance: '2.9 billion km', desc: 'Uranus rotates at a nearly 90-degree angle from the plane of its orbit.' },
        'Neptune': { type: 'Ice Giant', diameter: '49,244 km', distance: '4.5 billion km', desc: 'Neptune is dark, cold and whipped by supersonic winds.' },
        'Pluto': { type: 'Dwarf Planet', diameter: '2,377 km', distance: '5.9 billion km', desc: 'Pluto is a complex world of ice mountains and frozen plains.' }
    };
    
    // Close panel button
    document.getElementById('close-panel').addEventListener('click', () => {
        document.getElementById('planet-info-panel').classList.add('hidden');
        focusedPlanet = null;
        cameraTarget = { x: 0, y: 1200, z: 0 };
    });
}

// Add Atmospheres
function addAtmospheres() {
    // Add atmosphere to Earth, Venus, Mars, Jupiter, Saturn, Uranus, Neptune
    const atmospherePlanets = [
        { index: 1, color: 0xffddaa, size: 1.2, opacity: 0.4 }, // Venus
        { index: 2, color: 0x4488ff, size: 1.1, opacity: 0.3 }, // Earth
        { index: 3, color: 0xff4400, size: 1.1, opacity: 0.2 }, // Mars
        { index: 4, color: 0xffaa88, size: 1.05, opacity: 0.2 }, // Jupiter
        { index: 5, color: 0xeebb88, size: 1.05, opacity: 0.2 }, // Saturn
        { index: 6, color: 0x88ffff, size: 1.1, opacity: 0.3 }, // Uranus
        { index: 7, color: 0x4444ff, size: 1.1, opacity: 0.3 }  // Neptune
    ];
    
    atmospherePlanets.forEach(config => {
        if (planets[config.index]) {
            const planet = planets[config.index];
            const geometry = planet.geometry.clone();
            const material = new THREE.MeshBasicMaterial({
                color: config.color,
                transparent: true,
                opacity: config.opacity,
                side: THREE.BackSide,
                blending: THREE.AdditiveBlending
            });
            const atmosphere = new THREE.Mesh(geometry, material);
            atmosphere.scale.set(config.size, config.size, config.size);
            planet.add(atmosphere);
        }
    });
}

// Create ISS
function createISS() {
    const issGroup = new THREE.Group();
    
    // Main modules (cylinders)
    const moduleGeometry = new THREE.CylinderGeometry(0.5, 0.5, 6, 8);
    const moduleMaterial = new THREE.MeshStandardMaterial({
        color: 0xeeeeee,
        metalness: 0.8,
        roughness: 0.2
    });
    const mainModule = new THREE.Mesh(moduleGeometry, moduleMaterial);
    mainModule.rotation.z = Math.PI / 2;
    issGroup.add(mainModule);
    
    const crossModule = new THREE.Mesh(moduleGeometry, moduleMaterial);
    crossModule.scale.set(0.8, 0.6, 0.8);
    issGroup.add(crossModule);
    
    // Solar Arrays
    const solarGeometry = new THREE.BoxGeometry(2, 0.1, 8);
    const solarMaterial = new THREE.MeshStandardMaterial({
        color: 0x112244,
        metalness: 0.5,
        roughness: 0.1,
        emissive: 0x001133,
        emissiveIntensity: 0.2
    });
    
    const leftArray = new THREE.Mesh(solarGeometry, solarMaterial);
    leftArray.position.x = -4;
    issGroup.add(leftArray);
    
    const rightArray = new THREE.Mesh(solarGeometry, solarMaterial);
    rightArray.position.x = 4;
    issGroup.add(rightArray);
    
    // Position ISS around Earth
    issGroup.userData = {
        orbitRadius: 18, // Closer than Moon (40)
        speed: 0.08,     // Faster than Moon (0.05)
        angle: Math.PI // Start opposite to moon
    };
    
    iss = issGroup;
    scene.add(iss);
}

// Create Nebula Background
function createNebula() {
    const nebulaCount = 5;
    
    for (let i = 0; i < nebulaCount; i++) {
        // Create procedural cloud-like geometry using many transparent particles
        const particleCount = 50;
        const nebulaGroup = new THREE.Group();
        
        const geometry = new THREE.PlaneGeometry(400, 400);
        
        // Random colors: Purple, Blue, Pink
        const colors = [0x440088, 0x004488, 0x880044];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.03,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        for (let j = 0; j < particleCount; j++) {
            const cloud = new THREE.Mesh(geometry, material);
            cloud.position.set(
                (Math.random() - 0.5) * 600,
                (Math.random() - 0.5) * 200,
                (Math.random() - 0.5) * 600
            );
            cloud.rotation.z = Math.random() * Math.PI;
            cloud.scale.set(
                1 + Math.random(),
                1 + Math.random(),
                1
            );
            nebulaGroup.add(cloud);
        }
        
        // Position far away
        const angle = (i / nebulaCount) * Math.PI * 2;
        const distance = 2000;
        nebulaGroup.position.set(
            Math.cos(angle) * distance,
            (Math.random() - 0.5) * 1000,
            Math.sin(angle) * distance
        );
        
        nebulaGroup.lookAt(0, 0, 0);
        scene.add(nebulaGroup);
        nebulas.push(nebulaGroup);
    }
}
'''

content = content.replace('// Mouse wheel zoom', new_functions + '// Mouse wheel zoom')

# 4. Update onPlanetClick to show info
click_logic = '''
    if (intersects.length > 0) {
        focusedPlanet = intersects[0].object;
        
        // Show info panel
        const panel = document.getElementById('planet-info-panel');
        const name = focusedPlanet.userData.name;
        
        if (planetData[name]) {
            document.getElementById('panel-title').textContent = name;
            document.getElementById('panel-type').textContent = planetData[name].type;
            document.getElementById('panel-distance').textContent = planetData[name].distance;
            document.getElementById('panel-diameter').textContent = planetData[name].diameter;
            document.getElementById('panel-desc').textContent = planetData[name].desc;
            
            panel.classList.remove('hidden');
        }
        
    } else if (focusedPlanet) {
        // Click empty space to unfocus
        focusedPlanet = null;
        cameraTarget = { x: 0, y: 1200, z: 0 };
        document.getElementById('planet-info-panel').classList.add('hidden');
    }
'''

# Replace the body of onPlanetClick
content = content.replace(
    '''    if (intersects.length > 0) {
        focusedPlanet = intersects[0].object;
        console.log('Focused on:', focusedPlanet.userData.name);
    } else if (focusedPlanet) {
        // Click empty space to unfocus
        focusedPlanet = null;
        cameraTarget = { x: 0, y: 1200, z: 0 };
    }''',
    click_logic
)

# 5. Add animation for ISS
iss_animation = '''
    // Animate ISS
    if (iss && planets[2]) { // Earth is index 2
        const earth = planets[2];
        iss.userData.angle += iss.userData.speed;
        iss.position.x = earth.position.x + Math.cos(iss.userData.angle) * iss.userData.orbitRadius;
        iss.position.z = earth.position.z + Math.sin(iss.userData.angle) * iss.userData.orbitRadius;
        iss.position.y = earth.position.y;
        
        // Rotate to face earth
        iss.lookAt(earth.position);
    }
'''

content = content.replace(
    '    // Animate Earth\'s moon',
    iss_animation + '    // Animate Earth\'s moon'
)

# Write the modified content
with open('script.js', 'w') as f:
    f.write(content)

print("Successfully added Phase 2 enhancements!")
