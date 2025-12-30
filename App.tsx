
import React, { useRef, useEffect } from 'react';
import { View } from 'react-native';
import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';
import { LevelRenderer } from './LevelRenderer';
import { MapRenderer } from './MapRenderer';
import { LevelData } from './LevelData';

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

    // Light
    const light = new THREE.DirectionalLight(0xffffff, 2);
    light.position.set(1, 1, 1);
    scene.add(light);

    // Ambient light for overall brightness
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // Draw all segments from LevelData
    const levelRenderer = new LevelRenderer(scene);
    const mapRenderer = new MapRenderer();
    LevelData.forEach(segment => {
      levelRenderer.drawSegment(segment);
    });

    // Render loop
    const render = () => {
      // Handle rotation
      if (keys.current['arrowleft']) camera.rotation.y += rotateSpeed;
      if (keys.current['arrowright']) camera.rotation.y -= rotateSpeed;

      // Handle movement
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);

      if (keys.current['w']) camera.position.add(forward.multiplyScalar(moveSpeed));
      if (keys.current['s']) camera.position.add(forward.multiplyScalar(-moveSpeed));
      if (keys.current['a']) camera.position.add(right.multiplyScalar(-moveSpeed));
      if (keys.current['d']) camera.position.add(right.multiplyScalar(moveSpeed));

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
