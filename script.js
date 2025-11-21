// Three.js Scene Setup
let scene, camera, renderer;
let stars = [];
let planets = [];
let tick = 0;

// Camera controls
let cameraDistance = 1200;
const minDistance = 300;
const maxDistance = 3000;

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

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1, 0);
    pointLight.position.set(0, 500, 0);
    scene.add(pointLight);

    // Create starfield
    createStarfield();

    // Create Sun
    createSun();

    // Create planets
    createPlanets();

    // Event listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('wheel', onMouseWheel);

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
function createSun() {
    const sunGroup = new THREE.Group();

    // Outer glow
    const outerGlowGeometry = new THREE.SphereGeometry(100, 64, 64);
    const outerGlowMaterial = new THREE.MeshBasicMaterial({
        color: 0xffaa00,
        transparent: true,
        opacity: 0.1,
        side: THREE.BackSide
    });
    const outerGlow = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
    sunGroup.add(outerGlow);

    // Middle glow
    const midGlowGeometry = new THREE.SphereGeometry(70, 64, 64);
    const midGlowMaterial = new THREE.MeshBasicMaterial({
        color: 0xffcc00,
        transparent: true,
        opacity: 0.2,
        side: THREE.BackSide
    });
    const midGlow = new THREE.Mesh(midGlowGeometry, midGlowMaterial);
    sunGroup.add(midGlow);

    // Sun sphere
    const sunGeometry = new THREE.SphereGeometry(50, 64, 64);
    const sunMaterial = new THREE.MeshBasicMaterial({
        color: 0xffdd00,
        emissive: 0xffdd00,
        emissiveIntensity: 1
    });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sunGroup.add(sun);

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
        const material = new THREE.MeshStandardMaterial({
            color: data.color,
            roughness: 0.8,
            metalness: 0.1,
            emissive: data.color,
            emissiveIntensity: 0.05
        });
        const planet = new THREE.Mesh(geometry, material);

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

        // Add rings for Saturn
        if (data.hasRings) {
            const ringGeometry = new THREE.RingGeometry(data.radius * 1.5, data.radius * 2.5, 64);
            const ringMaterial = new THREE.MeshBasicMaterial({
                color: 0xC9B8A0,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.6
            });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.rotation.x = Math.PI / 2;
            planet.add(ring);
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

// Mouse wheel zoom
function onMouseWheel(event) {
    event.preventDefault();

    cameraDistance += event.deltaY * 0.5;
    cameraDistance = Math.max(minDistance, Math.min(maxDistance, cameraDistance));

    camera.position.y = cameraDistance;
}

// Window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    tick += 0.01;

    // Rotate planets in orbit
    planets.forEach(planet => {
        planet.userData.angle += planet.userData.speed;
        planet.position.x = Math.cos(planet.userData.angle) * planet.userData.distance;
        planet.position.z = Math.sin(planet.userData.angle) * planet.userData.distance;

        // Rotate planet on its axis
        planet.rotation.y += 0.01;
    });

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
