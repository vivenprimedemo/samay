// Three.js Scene Setup
let scene, camera, renderer;
let stars = [];
let planets = [];
let satellites = [];
let spaceships = [];
let asteroids = [];
let moon = null;
let comet = null;
let meteors = [];
let focusedPlanet = null;
let cameraTarget = { x: 0, y: 1200, z: 0 };
let iss = null;
let nebulas = [];
let planetInfoData = {};
let timeScale = 1;
let wormhole = null;
let ufos = [];
let lensFlare = null;
let tick = 0;
let controls = null;

// Motion trails
let trails = {
    iss: { line: null, positions: [], maxPoints: 80 },
    spaceships: [],
    comet: { line: null, positions: [], maxPoints: 100 },
    meteors: []
};

// Camera controls
let cameraDistance = 1200;
const minDistance = 300;
const maxDistance = 3000;
let cameraAnimating = false;

// Camera presets
const cameraPresets = {
    overview: { position: { x: 0, y: 1200, z: 0 }, target: { x: 0, y: 0, z: 0 } },
    earth: { position: { x: 400, y: 300, z: 400 }, target: { x: 400, y: 0, z: 400 } },
    saturn: { position: { x: 900, y: 400, z: 900 }, target: { x: 900, y: 0, z: 900 } },
    asteroidBelt: { position: { x: 600, y: 800, z: 0 }, target: { x: 600, y: 0, z: 0 } },
    innerPlanets: { position: { x: 0, y: 600, z: 600 }, target: { x: 0, y: 0, z: 300 } },
    outerPlanets: { position: { x: -1200, y: 800, z: 800 }, target: { x: -1200, y: 0, z: 1200 } }
};

// Texture loader
const textureLoader = new THREE.TextureLoader();

// Helper function to load textures with high-quality filtering
function loadTextureWithFiltering(url) {
    const texture = textureLoader.load(url);
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy(); // Best quality at angles
    texture.minFilter = THREE.LinearMipmapLinearFilter; // Smooth when zoomed out
    texture.magFilter = THREE.LinearFilter; // Smooth when zoomed in
    texture.generateMipmaps = true; // Enable mipmaps for better LOD
    return texture;
}

// Planet texture URLs (local files)
const planetTextures = {
    sun: 'textures/2k_sun.jpg',
    mercury: 'textures/2k_mercury.jpg',
    venus: 'textures/2k_venus_surface.jpg',
    earth: 'textures/2k_earth_daymap.jpg',
    earthClouds: 'textures/2k_earth_clouds.jpg',
    mars: 'textures/2k_mars.jpg',
    jupiter: 'textures/2k_jupiter.jpg',
    saturn: 'textures/2k_saturn.jpg',
    uranus: 'textures/2k_uranus.jpg',
    neptune: 'textures/2k_neptune.jpg',
    moon: 'textures/2k_moon.jpg'
};

// Initialize Three.js
function init() {
    // Scene
    scene = new THREE.Scene();

    // Camera - top-down view with reduced FOV for less distortion
    camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        0.1,
        5000
    );
    camera.position.set(0, cameraDistance, 0);
    camera.lookAt(0, 0, 0);

    // Renderer
    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('starfield'),
        antialias: true,
        alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // OrbitControls for interactive camera movement (must be after renderer)
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = minDistance;
    controls.maxDistance = maxDistance;
    controls.enablePan = true;
    controls.panSpeed = 1.0;
    controls.rotateSpeed = 0.5;
    controls.target.set(0, 0, 0);

    // Enhanced Lighting System
    // Ambient light (subtle base lighting)
    const ambientLight = new THREE.AmbientLight(0x404060, 0.2);
    scene.add(ambientLight);

    // Hemisphere light (simulates space lighting)
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x080820, 0.4);
    hemiLight.position.set(0, 1000, 0);
    scene.add(hemiLight);

    // Main sun point light (strong, from center)
    const sunLight = new THREE.PointLight(0xffee88, 2, 3000);
    sunLight.position.set(0, 0, 0);
    sunLight.castShadow = false; // Disable for performance
    scene.add(sunLight);

    // Secondary fill light (softer, for planet visibility)
    const fillLight = new THREE.PointLight(0xffffff, 0.5, 2500);
    fillLight.position.set(500, 500, 500);
    scene.add(fillLight);

    // Create starfield
    createStarfield();

    // Create Sun
    createSun();

    // Create planets
    createPlanets();

    // Create satellites
    createSatellites();

    // Create spaceships
    createSpaceships();

    // Create asteroid belt
    createAsteroidBelt();

    // Create Earth's moon
    createMoon();

    // Create comet
    createComet();

    // Create meteors
    createMeteors();

    // Create Nebula Background
    createNebula();

    // Create ISS
    createISS();

    // Initialize Planet Data
    initPlanetData();

    // Add Atmospheres
    addAtmospheres();

    // Create Wormhole
    createWormhole();

    // Create UFOs
    createUFOs();

    // Create Lens Flare
    createLensFlare();

    // Init Controls
    initControls();

    // Initialize motion trails
    trails.iss.line = createTrail(0x88ccff, trails.iss.maxPoints);
    trails.comet.line = createTrail(0x00ffff, trails.comet.maxPoints);

    // Initialize spaceship trails
    spaceships.forEach(() => {
        trails.spaceships.push({
            line: createTrail(0xff8844, 60),
            positions: [],
            maxPoints: 60
        });
    });

    // Event listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('click', onPlanetClick);
    window.addEventListener('keydown', onKeyDown);

    // Start animation
    animate();
}

// Create 3D starfield
function createStarfield() {
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 5000;
    const positions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 4000;
        positions[i + 1] = (Math.random() - 0.5) * 4000;
        positions[i + 2] = (Math.random() - 0.5) * 4000;
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const starMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 2,
        sizeAttenuation: true
    });

    const starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);
    stars.push(starField);
}

// Planet data
const planetData = [
    { name: 'Mercury', color: 0xA5A5A5, radius: 15, distance: 200, speed: 0.02 },
    { name: 'Venus', color: 0xE3BB76, radius: 25, distance: 300, speed: 0.015 },
    { name: 'Earth', color: 0x22A6B3, radius: 26, distance: 400, speed: 0.01 },
    { name: 'Mars', color: 0xDD4C39, radius: 18, distance: 500, speed: 0.008 },
    { name: 'Jupiter', color: 0xD9A066, radius: 60, distance: 700, speed: 0.005 },
    { name: 'Saturn', color: 0xEAD6B8, radius: 50, distance: 900, speed: 0.004, hasRings: true },
    { name: 'Uranus', color: 0xD1F7F8, radius: 35, distance: 1100, speed: 0.003 },
    { name: 'Neptune', color: 0x4B70DD, radius: 34, distance: 1300, speed: 0.002 },
    { name: 'Pluto', color: 0xE3D2B4, radius: 8, distance: 1500, speed: 0.001 }
];

// Create Sun at center
let sunGroup; // Make it accessible for animations
function createSun() {
    sunGroup = new THREE.Group();

    // Far outer corona (very subtle)
    const coronaGeometry = new THREE.SphereGeometry(130, 64, 64);
    const coronaMaterial = new THREE.MeshBasicMaterial({
        color: 0xff8800,
        transparent: true,
        opacity: 0.05,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending
    });
    const corona = new THREE.Mesh(coronaGeometry, coronaMaterial);
    sunGroup.add(corona);

    // Outer glow (enhanced)
    const outerGlowGeometry = new THREE.SphereGeometry(100, 64, 64);
    const outerGlowMaterial = new THREE.MeshBasicMaterial({
        color: 0xffaa00,
        transparent: true,
        opacity: 0.15,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending
    });
    const outerGlow = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
    sunGroup.add(outerGlow);

    // Middle glow (brighter)
    const midGlowGeometry = new THREE.SphereGeometry(70, 64, 64);
    const midGlowMaterial = new THREE.MeshBasicMaterial({
        color: 0xffcc00,
        transparent: true,
        opacity: 0.3,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending
    });
    const midGlow = new THREE.Mesh(midGlowGeometry, midGlowMaterial);
    sunGroup.add(midGlow);

    // Inner glow (bright)
    const innerGlowGeometry = new THREE.SphereGeometry(55, 64, 64);
    const innerGlowMaterial = new THREE.MeshBasicMaterial({
        color: 0xffee00,
        transparent: true,
        opacity: 0.4,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending
    });
    const innerGlow = new THREE.Mesh(innerGlowGeometry, innerGlowMaterial);
    sunGroup.add(innerGlow);

    // Sun sphere (core) with realistic texture
    const sunGeometry = new THREE.SphereGeometry(50, 64, 64);
    const sunTexture = loadTextureWithFiltering(planetTextures.sun);
    const sunMaterial = new THREE.MeshBasicMaterial({
        map: sunTexture,
        emissive: 0xffff00,
        emissiveIntensity: 0.8
    });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sunGroup.add(sun);

    // Store glow layers for animation
    sunGroup.userData.glowLayers = [corona, outerGlow, midGlow, innerGlow];

    // Position at center
    sunGroup.position.set(0, 0, 0);

    scene.add(sunGroup);

    // Add orbital path lines for each planet
    planetData.forEach(data => {
        const orbitGeometry = new THREE.RingGeometry(data.distance - 0.5, data.distance + 0.5, 128);
        const orbitMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
        orbit.rotation.x = Math.PI / 2;
        scene.add(orbit);
    });
}

// Create 3D planets
function createPlanets() {
    planetData.forEach((data, index) => {
        // Planet sphere
        const geometry = new THREE.SphereGeometry(data.radius, 64, 64);

        // Get texture URL based on planet name
        const textureKey = data.name.toLowerCase();
        let material;

        // Create material with texture if available, fallback to color
        if (planetTextures[textureKey]) {
            const texture = loadTextureWithFiltering(planetTextures[textureKey]);
            material = new THREE.MeshStandardMaterial({
                map: texture,
                roughness: data.name === 'Jupiter' || data.name === 'Saturn' ? 0.7 : 0.9,
                metalness: data.name === 'Mercury' ? 0.3 : 0.05
            });
        } else {
            // Fallback to color if texture not found
            material = new THREE.MeshStandardMaterial({
                color: data.color,
                roughness: data.name === 'Jupiter' || data.name === 'Saturn' ? 0.7 : 0.9,
                metalness: data.name === 'Mercury' ? 0.3 : 0.05,
                emissive: data.color,
                emissiveIntensity: data.name === 'Venus' ? 0.15 : 0.08
            });
        }

        const planet = new THREE.Mesh(geometry, material);

        // Special handling for Earth - add clouds layer
        if (data.name === 'Earth') {
            // Load Earth textures with high-quality filtering
            const earthTexture = loadTextureWithFiltering(planetTextures.earth);
            const cloudTexture = loadTextureWithFiltering(planetTextures.earthClouds);

            // Update main material with Earth texture
            planet.material = new THREE.MeshStandardMaterial({
                map: earthTexture,
                roughness: 0.9,
                metalness: 0.1
            });

            // Add clouds layer (slightly larger sphere)
            const cloudsGeometry = new THREE.SphereGeometry(data.radius * 1.01, 64, 64);
            const cloudsMaterial = new THREE.MeshStandardMaterial({
                map: cloudTexture,
                transparent: true,
                opacity: 0.4,
                blending: THREE.NormalBlending
            });
            const clouds = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
            planet.add(clouds);

            // Store clouds for animation
            planet.userData.clouds = clouds;
        }

        // Position in orbit on same plane
        const angle = (index / planetData.length) * Math.PI * 2;
        planet.position.x = Math.cos(angle) * data.distance;
        planet.position.z = Math.sin(angle) * data.distance;
        planet.position.y = 0;

        // Store data for animation
        planet.userData = {
            name: data.name,
            distance: data.distance,
            speed: data.speed,
            angle: angle
        };

        scene.add(planet);
        planets.push(planet);

        // Add enhanced rings for Saturn
        if (data.hasRings) {
            // Inner ring (brighter)
            const innerRing = new THREE.RingGeometry(data.radius * 1.2, data.radius * 1.8, 128);
            const innerRingMaterial = new THREE.MeshBasicMaterial({
                color: 0xE8D4B5,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.8
            });
            const innerRingMesh = new THREE.Mesh(innerRing, innerRingMaterial);
            innerRingMesh.rotation.x = Math.PI / 2;
            planet.add(innerRingMesh);

            // Cassini Division (dark gap)
            const gapRing = new THREE.RingGeometry(data.radius * 1.8, data.radius * 1.95, 128);
            const gapRingMaterial = new THREE.MeshBasicMaterial({
                color: 0x8B7355,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.3
            });
            const gapRingMesh = new THREE.Mesh(gapRing, gapRingMaterial);
            gapRingMesh.rotation.x = Math.PI / 2;
            planet.add(gapRingMesh);

            // Outer ring (fading)
            const outerRing = new THREE.RingGeometry(data.radius * 1.95, data.radius * 2.6, 128);
            const outerRingMaterial = new THREE.MeshBasicMaterial({
                color: 0xC9B8A0,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.5
            });
            const outerRingMesh = new THREE.Mesh(outerRing, outerRingMaterial);
            outerRingMesh.rotation.x = Math.PI / 2;
            planet.add(outerRingMesh);

            // Store rings for animation
            planet.userData.rings = [innerRingMesh, gapRingMesh, outerRingMesh];
        }

        // Add text label
        createTextLabel(planet, data.name);
    });
}

// Create text labels for planets
function createTextLabel(planet, text) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 64;

    context.fillStyle = 'rgba(255, 255, 255, 0.9)';
    context.font = 'Bold 24px Outfit, Arial';
    context.textAlign = 'center';
    context.fillText(text, 128, 40);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(50, 12.5, 1);
    sprite.position.y = planet.geometry.parameters.radius + 20;

    planet.add(sprite);
}


// Create satellites
function createSatellites() {
    const satelliteConfigs = [
        { distance: 600, speed: 0.015, size: 3 },
        { distance: 850, speed: 0.01, size: 4 },
        { distance: 1200, speed: 0.008, size: 3.5 }
    ];

    satelliteConfigs.forEach((config, index) => {
        const satelliteGroup = new THREE.Group();

        // Satellite body
        const bodyGeometry = new THREE.BoxGeometry(config.size * 2, config.size, config.size);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            metalness: 0.7,
            roughness: 0.3
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        satelliteGroup.add(body);

        // Solar panels
        const panelGeometry = new THREE.BoxGeometry(config.size * 4, config.size * 0.2, config.size * 2);
        const panelMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a3a5c,
            metalness: 0.5,
            roughness: 0.2,
            emissive: 0x0a1a2c,
            emissiveIntensity: 0.3
        });

        const leftPanel = new THREE.Mesh(panelGeometry, panelMaterial);
        leftPanel.position.x = -config.size * 3;
        satelliteGroup.add(leftPanel);

        const rightPanel = new THREE.Mesh(panelGeometry, panelMaterial);
        rightPanel.position.x = config.size * 3;
        satelliteGroup.add(rightPanel);

        // Antenna
        const antennaGeometry = new THREE.CylinderGeometry(0.2, 0.2, config.size * 2, 8);
        const antennaMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 0.8
        });
        const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
        antenna.position.y = config.size * 1.5;
        satelliteGroup.add(antenna);

        // Position in orbit
        const angle = (index / satelliteConfigs.length) * Math.PI * 2;
        satelliteGroup.position.x = Math.cos(angle) * config.distance;
        satelliteGroup.position.z = Math.sin(angle) * config.distance;
        satelliteGroup.position.y = 0;

        satelliteGroup.userData = {
            distance: config.distance,
            speed: config.speed,
            angle: angle
        };

        scene.add(satelliteGroup);
        satellites.push(satelliteGroup);
    });
}

// Create spaceships
function createSpaceships() {
    const spaceshipConfigs = [
        { distance: 1000, speed: 0.012, type: 'explorer' },
        { distance: 750, speed: 0.018, type: 'shuttle' }
    ];

    spaceshipConfigs.forEach((config, index) => {
        const shipGroup = new THREE.Group();

        if (config.type === 'explorer') {
            // Main body (cylinder)
            const bodyGeometry = new THREE.CylinderGeometry(3, 3, 15, 16);
            const bodyMaterial = new THREE.MeshStandardMaterial({
                color: 0xeeeeee,
                metalness: 0.6,
                roughness: 0.4
            });
            const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            body.rotation.z = Math.PI / 2;
            shipGroup.add(body);

            // Cockpit (sphere)
            const cockpitGeometry = new THREE.SphereGeometry(3.5, 16, 16);
            const cockpitMaterial = new THREE.MeshStandardMaterial({
                color: 0x4488ff,
                metalness: 0.8,
                roughness: 0.2,
                transparent: true,
                opacity: 0.7
            });
            const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
            cockpit.position.x = 8;
            shipGroup.add(cockpit);

            // Engine glow
            const engineGeometry = new THREE.ConeGeometry(2, 4, 8);
            const engineMaterial = new THREE.MeshBasicMaterial({
                color: 0xff6600,
                emissive: 0xff6600,
                emissiveIntensity: 1
            });
            const engine = new THREE.Mesh(engineGeometry, engineMaterial);
            engine.rotation.z = -Math.PI / 2;
            engine.position.x = -9;
            shipGroup.add(engine);
        } else {
            // Shuttle design
            const bodyGeometry = new THREE.ConeGeometry(4, 12, 8);
            const bodyMaterial = new THREE.MeshStandardMaterial({
                color: 0xdddddd,
                metalness: 0.7,
                roughness: 0.3
            });
            const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            body.rotation.z = -Math.PI / 2;
            shipGroup.add(body);

            // Wings
            const wingGeometry = new THREE.BoxGeometry(1, 8, 6);
            const wingMaterial = new THREE.MeshStandardMaterial({
                color: 0xaaaaaa,
                metalness: 0.6
            });

            const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
            leftWing.position.z = 5;
            shipGroup.add(leftWing);

            const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
            rightWing.position.z = -5;
            shipGroup.add(rightWing);
        }

        // Position in orbit
        const angle = (index / spaceshipConfigs.length) * Math.PI * 2 + Math.PI;
        shipGroup.position.x = Math.cos(angle) * config.distance;
        shipGroup.position.z = Math.sin(angle) * config.distance;
        shipGroup.position.y = (Math.random() - 0.5) * 50;

        shipGroup.userData = {
            distance: config.distance,
            speed: config.speed,
            angle: angle,
            verticalSpeed: (Math.random() - 0.5) * 0.01
        };

        scene.add(shipGroup);
        spaceships.push(shipGroup);
    });
}


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
    const moonTexture = loadTextureWithFiltering(planetTextures.moon);
    const moonMaterial = new THREE.MeshStandardMaterial({
        map: moonTexture,
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

// Click to focus on any object
function onPlanetClick(event) {
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    // Check all clickable objects
    const clickableObjects = [
        ...planets,
        ...(iss ? [iss] : []),
        ...(moon ? [moon] : []),
        ...(comet ? [comet] : []),
        ...satellites,
        ...spaceships
    ];

    const intersects = raycaster.intersectObjects(clickableObjects, true);

    if (intersects.length > 0) {
        // Find the top-level object
        let clickedObject = intersects[0].object;
        while (clickedObject.parent && !clickableObjects.includes(clickedObject)) {
            clickedObject = clickedObject.parent;
        }

        focusedPlanet = clickedObject;

        // Show info panel
        const panel = document.getElementById('planet-info-panel');
        const name = clickedObject.userData.name || getObjectName(clickedObject);
        const objectInfo = getObjectInfo(clickedObject, name);

        if (objectInfo) {
            document.getElementById('panel-title').textContent = objectInfo.title;
            document.getElementById('panel-type').textContent = objectInfo.type;
            document.getElementById('panel-distance').textContent = objectInfo.distance;
            document.getElementById('panel-diameter').textContent = objectInfo.diameter;
            document.getElementById('panel-desc').textContent = objectInfo.desc;

            panel.classList.remove('hidden');

            // Update OrbitControls target to focused object
            controls.target.set(clickedObject.position.x, 0, clickedObject.position.z);
        }

    } else if (focusedPlanet) {
        // Click empty space to unfocus
        focusedPlanet = null;
        controls.target.set(0, 0, 0);
        document.getElementById('planet-info-panel').classList.add('hidden');
    }
}

// Helper function to identify object type
function getObjectName(obj) {
    if (obj === iss) return 'ISS';
    if (obj === moon) return 'Moon';
    if (obj === comet) return 'Comet';
    if (satellites.includes(obj)) return 'Satellite';
    if (spaceships.includes(obj)) return 'Spaceship';
    return 'Unknown';
}

// Get info for any object
function getObjectInfo(obj, name) {
    // Check if it's a planet
    if (planetInfoData[name]) {
        return {
            title: name,
            type: planetInfoData[name].type,
            distance: planetInfoData[name].distance,
            diameter: planetInfoData[name].diameter,
            desc: planetInfoData[name].desc
        };
    }

    // ISS
    if (obj === iss) {
        return {
            title: 'International Space Station',
            type: 'Space Station',
            distance: 'Orbits Earth at ~420 km',
            diameter: '109m × 73m',
            desc: 'The ISS orbits Earth 16 times per day at 28,000 km/h. Home to astronauts conducting scientific research in microgravity.'
        };
    }

    // Moon
    if (obj === moon) {
        return {
            title: 'The Moon',
            type: 'Natural Satellite',
            distance: '384,400 km from Earth',
            diameter: '3,474 km',
            desc: 'Earth\'s only natural satellite. It takes 27.3 days to orbit Earth and is the fifth largest moon in our solar system.'
        };
    }

    // Comet
    if (obj === comet) {
        return {
            title: 'Comet',
            type: 'Icy Body',
            distance: 'Elliptical orbit',
            diameter: '~10 km nucleus',
            desc: 'A cosmic snowball of frozen gases, rock and dust. When near the Sun, it heats up and releases gases, forming a glowing tail.'
        };
    }

    // Satellite
    if (satellites.includes(obj)) {
        const index = satellites.indexOf(obj) + 1;
        return {
            title: `Artificial Satellite ${index}`,
            type: 'Communications Satellite',
            distance: `Orbit: ${Math.round(obj.userData.distance)} units`,
            diameter: '~10m with solar panels',
            desc: 'Part of a global network providing GPS, telecommunications, weather monitoring, and Earth observation services.'
        };
    }

    // Spaceship
    if (spaceships.includes(obj)) {
        const index = spaceships.indexOf(obj);
        const types = ['Deep Space Explorer', 'Cargo Shuttle'];
        return {
            title: types[index] || 'Spaceship',
            type: 'Spacecraft',
            distance: `Currently at ${Math.round(obj.userData.distance)} units`,
            diameter: '~15m',
            desc: index === 0 ?
                'On a mission to explore the outer solar system and study distant planets and asteroids.' :
                'Transporting supplies and equipment between Earth and orbital stations.'
        };
    }

    return null;
}

// Camera Animation System
function animateCameraTo(preset) {
    if (cameraAnimating) return;

    const targetPos = cameraPresets[preset].position;
    const targetLookAt = cameraPresets[preset].target;

    cameraAnimating = true;
    const startPos = camera.position.clone();
    const startTarget = controls.target.clone();
    const duration = 2000; // 2 seconds
    const startTime = Date.now();

    function easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeInOutCubic(progress);

        // Interpolate camera position
        camera.position.x = startPos.x + (targetPos.x - startPos.x) * eased;
        camera.position.y = startPos.y + (targetPos.y - startPos.y) * eased;
        camera.position.z = startPos.z + (targetPos.z - startPos.z) * eased;

        // Interpolate target
        controls.target.x = startTarget.x + (targetLookAt.x - startTarget.x) * eased;
        controls.target.y = startTarget.y + (targetLookAt.y - startTarget.y) * eased;
        controls.target.z = startTarget.z + (targetLookAt.z - startTarget.z) * eased;

        controls.update();

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            cameraAnimating = false;
            focusedPlanet = null; // Clear focused planet when using presets
        }
    }

    animate();
}


// Initialize Planet Data
function initPlanetData() {
    planetInfoData = {
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
        controls.target.set(0, 0, 0);
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

// Init Controls
function initControls() {
    const speedControl = document.getElementById('speed-control');
    if (speedControl) {
        speedControl.addEventListener('input', (e) => {
            timeScale = parseFloat(e.target.value);
        });
    }
}

// Motion Trail Functions
function createTrail(color, maxPoints) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(maxPoints * 3);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.6,
        linewidth: 2
    });

    const line = new THREE.Line(geometry, material);
    line.frustumCulled = false;
    scene.add(line);

    return line;
}

function updateTrail(trail, newPosition) {
    // Add new position
    trail.positions.push(newPosition.clone());

    // Remove old positions if exceeding max
    if (trail.positions.length > trail.maxPoints) {
        trail.positions.shift();
    }

    // Update line geometry
    if (trail.line && trail.positions.length > 1) {
        const positions = trail.line.geometry.attributes.position.array;

        for (let i = 0; i < trail.positions.length; i++) {
            positions[i * 3] = trail.positions[i].x;
            positions[i * 3 + 1] = trail.positions[i].y;
            positions[i * 3 + 2] = trail.positions[i].z;
        }

        // Fill remaining with last position to avoid artifacts
        const lastPos = trail.positions[trail.positions.length - 1];
        for (let i = trail.positions.length; i < trail.maxPoints; i++) {
            positions[i * 3] = lastPos.x;
            positions[i * 3 + 1] = lastPos.y;
            positions[i * 3 + 2] = lastPos.z;
        }

        trail.line.geometry.attributes.position.needsUpdate = true;
        trail.line.geometry.setDrawRange(0, trail.positions.length);
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

    for (let i = 0; i < particleCount; i++) {
        const r = 50 + Math.random() * 100;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI * 2;

        particlePositions[i * 3] = r * Math.sin(theta) * Math.cos(phi);
        particlePositions[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi);
        particlePositions[i * 3 + 2] = r * Math.cos(theta);
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

    for (let i = 0; i < ufoCount; i++) {
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
        for (let j = 0; j < lightCount; j++) {
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
// Window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Keyboard shortcuts
function onKeyDown(event) {
    switch (event.key) {
        case '1':
            animateCameraTo('overview');
            break;
        case '2':
            animateCameraTo('earth');
            break;
        case '3':
            animateCameraTo('saturn');
            break;
        case '4':
            animateCameraTo('asteroidBelt');
            break;
        case '5':
            animateCameraTo('innerPlanets');
            break;
        case '6':
            animateCameraTo('outerPlanets');
            break;
        case 'r':
        case 'R':
            animateCameraTo('overview');
            break;
    }
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    tick += 0.01;

    // Animate sun glow (pulsing effect)
    if (sunGroup && sunGroup.userData.glowLayers) {
        const pulseSpeed = 0.5;
        const pulseAmount = 0.05;
        sunGroup.userData.glowLayers.forEach((layer, index) => {
            const baseOpacity = [0.05, 0.15, 0.3, 0.4][index];
            const pulse = Math.sin(tick * pulseSpeed + index * 0.5) * pulseAmount;
            layer.material.opacity = baseOpacity + pulse;
        });
    }

    // Rotate planets in orbit
    planets.forEach(planet => {
        planet.userData.angle += planet.userData.speed * timeScale;
        planet.position.x = Math.cos(planet.userData.angle) * planet.userData.distance;
        planet.position.z = Math.sin(planet.userData.angle) * planet.userData.distance;

        // Rotate planet on its axis
        planet.rotation.y += 0.01 * timeScale;

        // Animate Earth's clouds (rotate slightly faster than planet)
        if (planet.userData.clouds) {
            planet.userData.clouds.rotation.y += 0.012 * timeScale;
        }

        // Animate Saturn's rings (subtle rotation)
        if (planet.userData.rings) {
            planet.userData.rings.forEach((ring, index) => {
                ring.rotation.z += (0.0001 + index * 0.00005) * timeScale;
            });
        }
    });
    // Animate satellites
    satellites.forEach(satellite => {
        satellite.userData.angle += satellite.userData.speed * timeScale;
        satellite.position.x = Math.cos(satellite.userData.angle) * satellite.userData.distance;
        satellite.position.z = Math.sin(satellite.userData.angle) * satellite.userData.distance;

        // Rotate satellite slowly
        satellite.rotation.y += 0.02 * timeScale;
    });

    // Animate spaceships
    spaceships.forEach((ship, index) => {
        ship.userData.angle += ship.userData.speed * timeScale;
        ship.position.x = Math.cos(ship.userData.angle) * ship.userData.distance;
        ship.position.z = Math.sin(ship.userData.angle) * ship.userData.distance;

        // Gentle vertical movement
        ship.position.y += ship.userData.verticalSpeed * timeScale;
        if (Math.abs(ship.position.y) > 100) {
            ship.userData.verticalSpeed *= -1;
        }

        // Point ship in direction of movement
        ship.rotation.y = ship.userData.angle + Math.PI / 2;

        // Update motion trail
        if (trails.spaceships[index]) {
            updateTrail(trails.spaceships[index], ship.position);
        }
    });



    // Animate asteroids
    asteroids.forEach(asteroid => {
        asteroid.userData.angle += asteroid.userData.speed * timeScale;
        asteroid.position.x = Math.cos(asteroid.userData.angle) * asteroid.userData.distance;
        asteroid.position.z = Math.sin(asteroid.userData.angle) * asteroid.userData.distance;

        asteroid.rotation.x += asteroid.userData.rotationSpeed.x * timeScale;
        asteroid.rotation.y += asteroid.userData.rotationSpeed.y;
        asteroid.rotation.z += asteroid.userData.rotationSpeed.z;
    });


    // Animate ISS
    if (iss && planets[2]) { // Earth is index 2
        const earth = planets[2];
        iss.userData.angle += iss.userData.speed * timeScale;
        iss.position.x = earth.position.x + Math.cos(iss.userData.angle) * iss.userData.orbitRadius;
        iss.position.z = earth.position.z + Math.sin(iss.userData.angle) * iss.userData.orbitRadius;
        iss.position.y = earth.position.y;

        // Rotate to face earth
        iss.lookAt(earth.position);

        // Update ISS motion trail
        updateTrail(trails.iss, iss.position);
    }
    // Animate Earth's moon
    if (moon && planets[2]) { // Earth is index 2
        const earth = planets[2];
        moon.userData.angle += moon.userData.speed * timeScale;
        moon.position.x = earth.position.x + Math.cos(moon.userData.angle) * moon.userData.orbitRadius;
        moon.position.z = earth.position.z + Math.sin(moon.userData.angle) * moon.userData.orbitRadius;
        moon.position.y = earth.position.y;
    }

    // Animate comet (elliptical orbit)
    if (comet) {
        comet.userData.angle += comet.userData.speed * timeScale;
        const a = comet.userData.maxDistance;
        const e = comet.userData.eccentricity;
        const r = a * (1 - e * e) / (1 + e * Math.cos(comet.userData.angle));

        comet.position.x = r * Math.cos(comet.userData.angle);
        comet.position.z = r * Math.sin(comet.userData.angle);
        comet.position.y = Math.sin(comet.userData.angle * 2) * 100;

        // Point comet in direction of movement
        comet.rotation.y = comet.userData.angle + Math.PI / 2;

        // Update comet motion trail
        updateTrail(trails.comet, comet.position);
    }

    // Animate meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
        const meteor = meteors[i];
        meteor.position.x += meteor.userData.velocity.x * timeScale;
        meteor.position.y += meteor.userData.velocity.y * timeScale;
        meteor.position.z += meteor.userData.velocity.z * timeScale;

        meteor.userData.life -= 0.01 * timeScale;
        meteor.material.opacity = meteor.userData.life;

        if (meteor.userData.life <= 0) {
            scene.remove(meteor);
            meteors.splice(i, 1);
            createMeteor(); // Create new one
        }
    }


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
    // Update OrbitControls target to follow focused planet
    if (focusedPlanet) {
        controls.target.set(focusedPlanet.position.x, 0, focusedPlanet.position.z);
    }

    // Update OrbitControls (required for damping)
    controls.update();
    // Move stars towards camera (upward in Y direction)
    if (stars[0]) {
        const positions = stars[0].geometry.attributes.position.array;

        for (let i = 0; i < positions.length; i += 3) {
            // Move star upward (towards camera)
            positions[i + 1] += 2;

            // Reset star position when it gets too close
            if (positions[i + 1] > 2000) {
                positions[i + 1] = -2000;
                positions[i] = (Math.random() - 0.5) * 4000;
                positions[i + 2] = (Math.random() - 0.5) * 4000;
            }
        }

        stars[0].geometry.attributes.position.needsUpdate = true;
    }

    renderer.render(scene, camera);
}

// Initialize when DOM is ready
init();

// Clock Logic
function updateClocks() {
    const now = new Date();

    const options = {
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };

    const dateOptions = {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    };

    // India (IST)
    const indiaTime = now.toLocaleTimeString('en-US', { ...options, timeZone: 'Asia/Kolkata' });
    const indiaDate = now.toLocaleDateString('en-US', { ...dateOptions, timeZone: 'Asia/Kolkata' });
    document.getElementById('time-india').textContent = indiaTime;
    document.getElementById('date-india').textContent = indiaDate;

    // New York (EST/EDT)
    const nyTime = now.toLocaleTimeString('en-US', { ...options, timeZone: 'America/New_York' });
    const nyDate = now.toLocaleDateString('en-US', { ...dateOptions, timeZone: 'America/New_York' });
    document.getElementById('time-ny').textContent = nyTime;
    document.getElementById('date-ny').textContent = nyDate;

    // Los Angeles (PST/PDT)
    const laTime = now.toLocaleTimeString('en-US', { ...options, timeZone: 'America/Los_Angeles' });
    const laDate = now.toLocaleDateString('en-US', { ...dateOptions, timeZone: 'America/Los_Angeles' });
    document.getElementById('time-la').textContent = laTime;
    document.getElementById('date-la').textContent = laDate;

    // UTC
    const utcTime = now.toLocaleTimeString('en-US', { ...options, timeZone: 'UTC' });
    const utcDate = now.toLocaleDateString('en-US', { ...dateOptions, timeZone: 'UTC' });
    document.getElementById('time-utc').textContent = utcTime;
    document.getElementById('date-utc').textContent = utcDate;
}

setInterval(updateClocks, 1000);
updateClocks();

// Theme Toggle
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;

// Check local storage
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    body.className = savedTheme;
}

themeToggle.addEventListener('click', () => {
    if (body.classList.contains('dark-theme')) {
        body.classList.replace('dark-theme', 'light-theme');
        localStorage.setItem('theme', 'light-theme');
    } else {
        body.classList.replace('light-theme', 'dark-theme');
        localStorage.setItem('theme', 'dark-theme');
    }
});
