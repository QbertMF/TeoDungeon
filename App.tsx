
import React, { useRef, useEffect } from 'react';
import { View } from 'react-native';
import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';
import { LevelRenderer } from './LevelRenderer';
import { MapRenderer } from './MapRenderer';
import { HelpOverlay } from './HelpOverlay';
import { LevelData, playerSector, playerSectorWall, updatePlayerSector, findLookingAtWall, toggleWall, addSector, deleteSector, checkCollision, toggleCollision, adjustWallBottomHeight, adjustWallTopHeight, printSectors } from './LevelData';
import { Asset } from 'expo-asset';

export default function App() {
  const raf = useRef<number | null>(null);
  const keys = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const onContextCreate = async (gl: any) => {
    // Renderer (connects Three.js to Expo's GL)
    const renderer = new Renderer({ gl });
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);

    // Scene + Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      70,
      gl.drawingBufferWidth / gl.drawingBufferHeight,
      0.01,
      1000
    );
    camera.position.set(0, 1.5, 0);
    const direction = new THREE.Vector3(0, 0, -1);
    const moveSpeed = 0.1;
    const rotateSpeed = 0.05;
    let yaw = 0;
    let pitch = 0;

    // FPS counter
    let frameCount = 0;
    let lastTime = performance.now();
    let fps = 0;
    const fpsElement = document.createElement('div');
    fpsElement.style.position = 'absolute';
    fpsElement.style.top = '10px';
    fpsElement.style.left = '10px';
    fpsElement.style.color = 'white';
    fpsElement.style.fontFamily = 'monospace';
    fpsElement.style.fontSize = '16px';
    fpsElement.style.zIndex = '2000';
    fpsElement.textContent = 'FPS: 0';
    document.body.appendChild(fpsElement);

    const sectorElement = document.createElement('div');
    sectorElement.style.position = 'absolute';
    sectorElement.style.top = '30px';
    sectorElement.style.left = '10px';
    sectorElement.style.color = 'white';
    sectorElement.style.fontFamily = 'monospace';
    sectorElement.style.fontSize = '16px';
    sectorElement.style.zIndex = '2000';
    sectorElement.textContent = `Sectors: ${LevelData.length}`;
    document.body.appendChild(sectorElement);

    // Light
    const light = new THREE.DirectionalLight(0xffffff, 2);
    light.position.set(1, 1, 1);
    scene.add(light);

    // Ambient light for overall brightness
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // Load skybox
    const textureLoader = new THREE.TextureLoader();
    const asset = Asset.fromModule(require('./assets/Tropenschauhaus.jpg'));
    await asset.downloadAsync();
    
    textureLoader.load(asset.localUri || asset.uri, (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      texture.colorSpace = THREE.SRGBColorSpace;
      scene.background = texture;
      console.log('Skybox loaded successfully');
    }, undefined, (error) => {
      console.error('Error loading skybox:', error);
    });

    // Draw all sectors from LevelData
    const levelRenderer = new LevelRenderer(scene);
    const mapRenderer = new MapRenderer(() => levelRenderer.refreshLevel());
    const helpOverlay = new HelpOverlay();
    LevelData.forEach(sector => {
      levelRenderer.drawSector(sector);
    });

    // Render loop
    const render = () => {
      // Update FPS counter
      frameCount++;
      const currentTime = performance.now();
      if (currentTime - lastTime >= 1000) {
        fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        fpsElement.textContent = `FPS: ${fps}`;
        sectorElement.textContent = `Sectors: ${LevelData.length}`;
        frameCount = 0;
        lastTime = currentTime;
      }
      // Handle rotation and vertical movement
      if (keys.current['shift']) {
        // Vertical movement when shift is held
        if (keys.current['arrowup']) {
          camera.position.y += moveSpeed;
        }
        if (keys.current['arrowdown']) {
          camera.position.y -= moveSpeed;
        }
        // Orthogonal rotation snapping
        if (keys.current['arrowright']) {
          yaw -= Math.PI / 4; // Turn 45 degrees clockwise
          yaw = Math.round(yaw / (Math.PI / 4)) * (Math.PI / 4); // Snap to 45-degree increments
          keys.current['arrowright'] = false;
        }
        if (keys.current['arrowleft']) {
          yaw += Math.PI / 4; // Turn 45 degrees counter-clockwise
          yaw = Math.round(yaw / (Math.PI / 4)) * (Math.PI / 4); // Snap to 45-degree increments
          keys.current['arrowleft'] = false;
        }
      } else if (keys.current['alt']) {
        // Position perpendicular to current wall
        if ((keys.current['arrowup'] || keys.current['arrowdown'] || keys.current['arrowleft'] || keys.current['arrowright']) && 
            playerSector >= 0 && playerSectorWall >= 0) {
          const sector = LevelData[playerSector];
          const nextWallIndex = (playerSectorWall + 1) % sector.vertices.length;
          const v1 = sector.vertices[playerSectorWall];
          const v2 = sector.vertices[nextWallIndex];
          
          // Calculate wall direction and perpendicular
          const wallDx = v2.x - v1.x;
          const wallDy = v2.y - v1.y;
          const wallLength = Math.sqrt(wallDx * wallDx + wallDy * wallDy);
          const perpX = -wallDy / wallLength;
          const perpY = wallDx / wallLength;
          
          // Set camera to look perpendicular to wall (toward the wall)
          yaw = -Math.atan2(perpX, -perpY) + Math.PI;
          
          keys.current['arrowup'] = false;
          keys.current['arrowdown'] = false;
          keys.current['arrowleft'] = false;
          keys.current['arrowright'] = false;
        }
      } else {
        // Rotation when shift is not held
        if (keys.current['arrowleft']) yaw += rotateSpeed;
        if (keys.current['arrowright']) yaw -= rotateSpeed;
        if (keys.current['arrowup']) pitch = Math.max(pitch - rotateSpeed, -Math.PI / 2);
        if (keys.current['arrowdown']) pitch = Math.min(pitch + rotateSpeed, Math.PI / 2);
      }
      
      // Apply rotations in correct order
      camera.rotation.order = 'YXZ';
      camera.rotation.y = yaw;
      camera.rotation.x = pitch;

      // Handle zoom and map resize
      if (keys.current['shift'] && keys.current['+']) {
        mapRenderer.resizeMapUp();
        keys.current['+'] = false;
      } else if (keys.current['shift'] && keys.current['-']) {
        mapRenderer.resizeMapDown();
        keys.current['-'] = false;
      } else if (keys.current['+']) {
        mapRenderer.zoomIn();
      } else if (keys.current['-']) {
        mapRenderer.zoomOut();
      }
      if (keys.current['0']) {
        pitch = 0;
        camera.rotation.x = pitch;
        if (playerSector >= 0 && playerSector < LevelData.length) {
          camera.position.y = LevelData[playerSector].floorHeight + 1.5;
        }
        keys.current['0'] = false; // Prevent continuous triggering
      }
      if (keys.current['1']) {
        toggleWall();
        levelRenderer.refreshLevel();
        keys.current['1'] = false; // Prevent continuous toggling
      }
      if (keys.current['m']) {
        mapRenderer.toggleMapMode();
        keys.current['m'] = false; // Prevent continuous toggling
      }
      if (keys.current['3']) {
        const forwardDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        addSector(3, forwardDir.x, forwardDir.z);
        levelRenderer.refreshLevel();
        keys.current['3'] = false;
      }
      if (keys.current['4']) {
        const forwardDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        addSector(4, forwardDir.x, forwardDir.z);
        levelRenderer.refreshLevel();
        keys.current['4'] = false;
      }
      if (keys.current['5']) {
        const forwardDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        addSector(5, forwardDir.x, forwardDir.z);
        levelRenderer.refreshLevel();
        keys.current['5'] = false;
      }
      if (keys.current['6']) {
        const forwardDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        addSector(6, forwardDir.x, forwardDir.z);
        levelRenderer.refreshLevel();
        keys.current['6'] = false;
      }
      if (keys.current['?']) {
        helpOverlay.toggle();
        keys.current['?'] = false; // Prevent continuous toggling
      }
      if (keys.current['c']) {
        toggleCollision();
        keys.current['c'] = false; // Prevent continuous toggling
      }
      if (keys.current['r']) {
        adjustWallBottomHeight(true);
        levelRenderer.refreshLevel();
        keys.current['r'] = false;
      }
      if (keys.current['f']) {
        adjustWallBottomHeight(false);
        levelRenderer.refreshLevel();
        keys.current['f'] = false;
      }
      if (keys.current['t']) {
        adjustWallTopHeight(false);
        levelRenderer.refreshLevel();
        keys.current['t'] = false;
      }
      if (keys.current['g']) {
        adjustWallTopHeight(true);
        levelRenderer.refreshLevel();
        keys.current['g'] = false;
      }
      if (keys.current['p']) {
        printSectors();
        keys.current['p'] = false;
      }
      if (keys.current['#']) {
        deleteSector();
        levelRenderer.refreshLevel();
        keys.current['#'] = false;
      }

      // Handle movement
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
      
      let newX = camera.position.x;
      let newZ = camera.position.z;

      if (keys.current['w']) {
        newX += forward.x * moveSpeed;
        newZ += forward.z * moveSpeed;
      }
      if (keys.current['s']) {
        newX -= forward.x * moveSpeed;
        newZ -= forward.z * moveSpeed;
      }
      if (keys.current['a']) {
        newX -= right.x * moveSpeed;
        newZ -= right.z * moveSpeed;
      }
      if (keys.current['d']) {
        newX += right.x * moveSpeed;
        newZ += right.z * moveSpeed;
      }
      

      // Apply collision detection
      const collisionResult = checkCollision(camera.position.x, camera.position.z, newX, newZ);
      camera.position.x = collisionResult.x;
      camera.position.z = collisionResult.z;

      // Update player sector after movement
      updatePlayerSector(camera.position.x, camera.position.z);
      
      // Update which wall player is looking at
      const forwardDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      findLookingAtWall(camera.position.x, camera.position.z, forwardDir.x, forwardDir.z);

      // Update 2D map
      mapRenderer.drawMap(camera);

      renderer.render(scene, camera);
      gl.endFrameEXP(); // tell Expo GL to display the frame
      raf.current = requestAnimationFrame(render);
    };
    render();
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <GLView style={{ flex: 1 }} onContextCreate={onContextCreate} />
    </View>
  );
}
