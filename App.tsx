
import React, { useRef } from 'react';
import { View } from 'react-native';
import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';

export default function App() {
  const raf = useRef<number | null>(null);

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
    camera.position.z = 2;

    // Light
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(1, 1, 1);
    scene.add(light);

    // Object: spinning cube
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: '#3f51b5' });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    // Render loop
    const render = () => {
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.015;

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
