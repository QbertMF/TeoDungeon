import * as THREE from 'three';
import { Asset } from 'expo-asset';

// Static texture imports
const textureAssets = {
  Bricks087: {
    color: require('./assets/textures/Bricks087_1K-JPG/Bricks087_1K-JPG_Color.jpg'),
    normal: require('./assets/textures/Bricks087_1K-JPG/Bricks087_1K-JPG_NormalGL.jpg'),
    roughness: require('./assets/textures/Bricks087_1K-JPG/Bricks087_1K-JPG_Roughness.jpg')
  },
  Bricks089: {
    color: require('./assets/textures/Bricks089_1K-JPG/Bricks089_1K-JPG_Color.jpg'),
    normal: require('./assets/textures/Bricks089_1K-JPG/Bricks089_1K-JPG_NormalGL.jpg'),
    roughness: require('./assets/textures/Bricks089_1K-JPG/Bricks089_1K-JPG_Roughness.jpg')
  },
  Bricks095: {
    color: require('./assets/textures/Bricks095_1K-JPG/Bricks095_1K-JPG_Color.jpg'),
    normal: require('./assets/textures/Bricks095_1K-JPG/Bricks095_1K-JPG_NormalGL.jpg'),
    roughness: require('./assets/textures/Bricks095_1K-JPG/Bricks095_1K-JPG_Roughness.jpg')
  },
  Rocks001: {
    color: require('./assets/textures/Rocks001_1K-JPG/Rocks001_1K-JPG_Color.jpg'),
    normal: require('./assets/textures/Rocks001_1K-JPG/Rocks001_1K-JPG_NormalGL.jpg'),
    roughness: require('./assets/textures/Rocks001_1K-JPG/Rocks001_1K-JPG_Roughness.jpg')
  }
};

export interface TextureSet {
  name: string;
  colorMap: THREE.Texture;
  normalMap: THREE.Texture;
  roughnessMap: THREE.Texture;
  material: THREE.MeshStandardMaterial;
}

export class TextureManager {
  public textureArray: TextureSet[] = [];
  private scene: THREE.Scene;
  private cubes: THREE.Mesh[] = [];
  private cubeContainer: THREE.Group;
  private selectionFrame: THREE.Mesh;
  public selectedIndex: number = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.cubeContainer = new THREE.Group();
    this.scene.add(this.cubeContainer);
    
    // Create selection frame
    const frameGeometry = new THREE.BoxGeometry(0.32, 0.32, 0.32);
    const frameMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xffffff, 
      wireframe: true, 
      transparent: true, 
      opacity: 0.8 
    });
    this.selectionFrame = new THREE.Mesh(frameGeometry, frameMaterial);
    this.selectionFrame.renderOrder = 1001;
    //this.selectionFrame.material.depthTest = false;
    this.cubeContainer.add(this.selectionFrame);
  }

  async loadTextures(): Promise<void> {
    const loader = new THREE.TextureLoader();

    for (const [name, assets] of Object.entries(textureAssets)) {
      try {
        const colorAsset = Asset.fromModule(assets.color);
        const normalAsset = Asset.fromModule(assets.normal);
        const roughnessAsset = Asset.fromModule(assets.roughness);

        await Promise.all([colorAsset.downloadAsync(), normalAsset.downloadAsync(), roughnessAsset.downloadAsync()]);

        const colorMap = await new Promise<THREE.Texture>((resolve, reject) => {
          loader.load(colorAsset.localUri || colorAsset.uri, resolve, undefined, reject);
        });
        
        const normalMap = await new Promise<THREE.Texture>((resolve, reject) => {
          loader.load(normalAsset.localUri || normalAsset.uri, resolve, undefined, reject);
        });
        
        const roughnessMap = await new Promise<THREE.Texture>((resolve, reject) => {
          loader.load(roughnessAsset.localUri || roughnessAsset.uri, resolve, undefined, reject);
        });

        colorMap.colorSpace = THREE.SRGBColorSpace;
        
        const material = new THREE.MeshStandardMaterial({
          map: colorMap,
          normalMap: normalMap,
          roughnessMap: roughnessMap,
        });

        this.textureArray.push({
          name,
          colorMap,
          normalMap,
          roughnessMap,
          material
        });

      } catch (error) {
        console.error(`Failed to load texture ${name}:`, error);
      }
    }

    this.createTextureCubes();
  }

  private createTextureCubes(): void {
    const geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    
    this.textureArray.forEach((textureSet, index) => {
      const cube = new THREE.Mesh(geometry, textureSet.material);
      cube.position.set(index * 0.5 - (this.textureArray.length * 0.25), -2, -3);
      cube.renderOrder = 1000;
      cube.material.depthTest = false;
      this.cubes.push(cube);
      this.cubeContainer.add(cube);
    });
  }

  updateCubePositions(camera: THREE.Camera): void {
    this.cubes.forEach((cube, index) => {
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;
      
      const cameraDirection = new THREE.Vector3();
      camera.getWorldDirection(cameraDirection);
      const rightVector = new THREE.Vector3().crossVectors(camera.up, cameraDirection).normalize();
      
      cube.position.copy(camera.position);
      cube.position.add(cameraDirection.multiplyScalar(2));
      cube.position.add(rightVector.multiplyScalar((index - this.textureArray.length / 2 + 0.5) * 0.5));
      cube.position.y -= 0.8;
    });
    
    // Update selection frame position
    if (this.selectedIndex < this.cubes.length) {
      this.selectionFrame.position.copy(this.cubes[this.selectedIndex].position);
    }
  }

  changeSelection(delta: number): void {
    if (this.textureArray.length === 0) return;
    
    this.selectedIndex = (this.selectedIndex + delta + this.textureArray.length) % this.textureArray.length;
  }
}