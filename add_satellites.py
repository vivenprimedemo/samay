#!/usr/bin/env python3
import re

# Read the current script
with open('script.js', 'r') as f:
    content = f.read()

# 1. Add satellite and spaceship arrays after planets array
content = content.replace(
    'let planets = [];',
    'let planets = [];\nlet satellites = [];\nlet spaceships = [];'
)

# 2. Add creation calls after createPlanets()
content = content.replace(
    '    // Create planets\n    createPlanets();',
    '    // Create planets\n    createPlanets();\n    \n    // Create satellites\n    createSatellites();\n    \n    // Create spaceships\n    createSpaceships();'
)

# 3. Add satellite and spaceship creation functions before onMouseWheel
satellite_code = '''
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

'''

content = content.replace('// Mouse wheel zoom', satellite_code + '// Mouse wheel zoom')

# 4. Add satellite and spaceship animation after planet animation
animation_code = '''    
    // Animate satellites
    satellites.forEach(satellite => {
        satellite.userData.angle += satellite.userData.speed;
        satellite.position.x = Math.cos(satellite.userData.angle) * satellite.userData.distance;
        satellite.position.z = Math.sin(satellite.userData.angle) * satellite.userData.distance;
        
        // Rotate satellite slowly
        satellite.rotation.y += 0.02;
    });
    
    // Animate spaceships
    spaceships.forEach(ship => {
        ship.userData.angle += ship.userData.speed;
        ship.position.x = Math.cos(ship.userData.angle) * ship.userData.distance;
        ship.position.z = Math.sin(ship.userData.angle) * ship.userData.distance;
        
        // Gentle vertical movement
        ship.position.y += ship.userData.verticalSpeed;
        if (Math.abs(ship.position.y) > 100) {
            ship.userData.verticalSpeed *= -1;
        }
        
        // Point ship in direction of movement
        ship.rotation.y = ship.userData.angle + Math.PI / 2;
    });
'''

content = content.replace(
    '        // Rotate planet on its axis\n        planet.rotation.y += 0.01;\n    });',
    '        // Rotate planet on its axis\n        planet.rotation.y += 0.01;\n    });' + animation_code
)

# Write the modified content
with open('script.js', 'w') as f:
    f.write(content)

print("Successfully added satellites and spaceships!")
