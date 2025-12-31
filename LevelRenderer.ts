import * as THREE from 'three';
import { LevelSector } from './types/LevelStructure';
import { LevelData } from './LevelData';

export class LevelRenderer {
  private scene: THREE.Scene;
  private materials: Map<number, THREE.Material> = new Map();
  private sectorGroups: THREE.Group[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  private getColorFromTextureId(textureId: number): number {
    const colors = [
      0x8B4513, // Brown
      0x696969, // Gray
      0x2F4F4F, // Dark Slate Gray
      0x800000, // Maroon
      0x556B2F, // Dark Olive Green
      0x483D8B, // Dark Slate Blue
      0x8B0000, // Dark Red
      0x2E8B57, // Sea Green
    ];
    return colors[textureId % colors.length];
  }

  private getMaterial(textureId: number, brightness: number): THREE.Material {
    const key = textureId * 1000 + Math.floor(brightness * 100);
    
    if (!this.materials.has(key)) {
      const color = this.getColorFromTextureId(textureId);
      const material = new THREE.MeshLambertMaterial({ 
        color: new THREE.Color(color).multiplyScalar(brightness),
        side: THREE.DoubleSide
      });
      this.materials.set(key, material);
    }
    
    return this.materials.get(key)!;
  }

  private isPortal(wall: { bottomHeight: number; topHeight: number }): boolean {
    return wall.bottomHeight < 0 && wall.topHeight < 0;
  }

  drawSector(sector: LevelSector): THREE.Group {
    const group = new THREE.Group();

    // Draw floor
    const { shape: floorShape, center: floorCenter } = this.createCenteredShape(sector.vertices);
    const floorGeometry = new THREE.ShapeGeometry(floorShape);
    const floorMaterial = this.getMaterial(sector.floorTextureId, sector.brightness);
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = Math.PI / 2;
    floor.position.set(floorCenter.x, sector.floorHeight, floorCenter.y);
    group.add(floor);

    // Draw ceiling
    const { shape: ceilingShape, center: ceilingCenter } = this.createCenteredShape(sector.vertices);
    const ceilingGeometry = new THREE.ShapeGeometry(ceilingShape);
    const ceilingMaterial = this.getMaterial(sector.ceilingTextureId, sector.brightness);
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(ceilingCenter.x, sector.ceilingHeight, ceilingCenter.y);
    group.add(ceiling);

    // Draw walls
    for (let i = 0; i < sector.vertices.length; i++) {
      const nextI = (i + 1) % sector.vertices.length;
      const v1 = sector.vertices[i];
      const v2 = sector.vertices[nextI];
      const wall = sector.walls[i];

      // Check if wall is a full portal (bottomHeight equals floorHeight and topHeight equals ceilingHeight)
      if (wall.bottomHeight === sector.floorHeight && wall.topHeight === sector.ceilingHeight) {
        // Full portal - don't render any wall
        continue;
      }
      
      if (!this.isPortal(wall)) {
        // Normal walls: bottom and top parts
        const bottomWall = this.createWallGeometry(
          v1, v2, 
          sector.floorHeight, 
          sector.floorHeight + wall.bottomHeight
        );
        const bottomMesh = new THREE.Mesh(
          bottomWall, 
          this.getMaterial(wall.textureId, sector.brightness)
        );
        group.add(bottomMesh);

        // Top wall part
        const topWall = this.createWallGeometry(
          v1, v2, 
          sector.ceilingHeight - wall.topHeight, 
          sector.ceilingHeight
        );
        const topMesh = new THREE.Mesh(
          topWall, 
          this.getMaterial(wall.textureId, sector.brightness * 0.8)
        );
        group.add(topMesh);
      } else {
        // Solid wall: full height
        const fullWall = this.createWallGeometry(
          v1, v2, 
          sector.floorHeight, 
          sector.ceilingHeight
        );
        const fullMesh = new THREE.Mesh(
          fullWall, 
          this.getMaterial(wall.textureId, sector.brightness)
        );
        group.add(fullMesh);
      }
    }

    this.scene.add(group);
    this.sectorGroups.push(group);
    return group;
  }

  refreshLevel(): void {
    // Remove all existing sector groups
    this.sectorGroups.forEach(group => {
      this.scene.remove(group);
    });
    this.sectorGroups = [];
    
    // Redraw all sectors
    LevelData.forEach(sector => {
      this.drawSector(sector);
    });
  }

  private createShape(vertices: { x: number; y: number }[]): THREE.Shape {
    const shape = new THREE.Shape();
    shape.moveTo(vertices[0].x, vertices[0].y);
    for (let i = 1; i < vertices.length; i++) {
      shape.lineTo(vertices[i].x, vertices[i].y);
    }
    shape.closePath();
    return shape;
  }

  private getCenterPoint(vertices: { x: number; y: number }[]): { x: number; y: number } {
    const centerX = vertices.reduce((sum, v) => sum + v.x, 0) / vertices.length;
    const centerY = vertices.reduce((sum, v) => sum + v.y, 0) / vertices.length;
    return { x: centerX, y: centerY };
  }

  private createCenteredShape(vertices: { x: number; y: number }[]): { shape: THREE.Shape; center: { x: number; y: number } } {
    const center = this.getCenterPoint(vertices);
    const shape = new THREE.Shape();
    
    // Create shape relative to center
    const relativeVertices = vertices.map(v => ({ x: v.x - center.x, y: v.y - center.y }));
    shape.moveTo(relativeVertices[0].x, relativeVertices[0].y);
    for (let i = 1; i < relativeVertices.length; i++) {
      shape.lineTo(relativeVertices[i].x, relativeVertices[i].y);
    }
    shape.closePath();
    
    return { shape, center };
  }

  private createWallGeometry(
    v1: { x: number; y: number }, 
    v2: { x: number; y: number }, 
    bottomY: number, 
    topY: number
  ): THREE.PlaneGeometry {
    const width = Math.sqrt((v2.x - v1.x) ** 2 + (v2.y - v1.y) ** 2);
    const height = topY - bottomY;
    const geometry = new THREE.PlaneGeometry(width, height);
    
    // Position at center of wall segment
    const centerX = (v1.x + v2.x) / 2;
    const centerZ = (v1.y + v2.y) / 2;
    const centerY = (bottomY + topY) / 2;
    
    // Calculate rotation angle (v1.y and v2.y map to Z coordinates)
    const angle = -Math.atan2(v2.y - v1.y, v2.x - v1.x) + Math.PI;
    
    // Apply transformations
    geometry.rotateY(angle);
    geometry.translate(centerX, centerY, centerZ);
    
    return geometry;
  }
}