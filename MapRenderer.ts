import { LevelData, playerSector, playerSectorWall } from './LevelData';
import * as THREE from 'three';

export class MapRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private scale: number = 20;
  private mapMode: 'texture' | 'portal' = 'texture';
  private hoveredVertex: { sectorIndex: number; vertexIndex: number } | null = null;
  private draggedVertex: { sectorIndex: number; vertexIndex: number } | null = null;
  private isDragging: boolean = false;
  private onLevelUpdate: (() => void) | null = null;

  constructor(onLevelUpdate?: () => void) {
    this.onLevelUpdate = onLevelUpdate || null;
    this.canvas = document.createElement('canvas');
    this.canvas.width = 200;
    this.canvas.height = 200;
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '20px';
    this.canvas.style.right = '20px';
    this.canvas.style.border = '2px solid red';
    this.canvas.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    this.canvas.style.zIndex = '1000';
    document.body.appendChild(this.canvas);

    this.ctx = this.canvas.getContext('2d')!;
    this.setupMouseEvents();
  }

  private getColorFromTextureId(textureId: number): string {
    const colors = [
      '#8B4513', // Brown
      '#696969', // Gray
      '#2F4F4F', // Dark Slate Gray
      '#800000', // Maroon
      '#556B2F', // Dark Olive Green
      '#483D8B', // Dark Slate Blue
      '#8B0000', // Dark Red
      '#2E8B57', // Sea Green
    ];
    return colors[textureId % colors.length];
  }

  zoomIn(): void {
    this.scale = Math.min(this.scale * 1.2, 100);
  }

  zoomOut(): void {
    this.scale = Math.max(this.scale / 1.2, 5);
  }

  toggleMapMode(): void {
    this.mapMode = this.mapMode === 'texture' ? 'portal' : 'texture';
  }

  private isPortal(wall: { bottomHeight: number; topHeight: number }): boolean {
    return wall.bottomHeight < 0 && wall.topHeight < 0;
  }

  private setupMouseEvents(): void {
    this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
  }

  private getMousePos(e: MouseEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  private screenToWorld(screenX: number, screenY: number, camera: THREE.Camera): { x: number; y: number } {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    return {
      x: camera.position.x + (screenX - centerX) / this.scale,
      y: camera.position.z + (screenY - centerY) / this.scale
    };
  }

  private snapToGrid(value: number): number {
    return Math.round(value / 0.2) * 0.2;
  }

  private findVertexAt(worldX: number, worldY: number): { sectorIndex: number; vertexIndex: number } | null {
    const threshold = 5 / this.scale; // 5 pixel threshold in world units
    
    for (let sectorIndex = 0; sectorIndex < LevelData.length; sectorIndex++) {
      const sector = LevelData[sectorIndex];
      for (let vertexIndex = 0; vertexIndex < sector.vertices.length; vertexIndex++) {
        const vertex = sector.vertices[vertexIndex];
        const distance = Math.sqrt((vertex.x - worldX) ** 2 + (vertex.y - worldY) ** 2);
        if (distance < threshold) {
          return { sectorIndex, vertexIndex };
        }
      }
    }
    return null;
  }

  private onMouseMove(e: MouseEvent): void {
    const mousePos = this.getMousePos(e);
    // We need camera position for world conversion, store it during drawMap
    if (!this.lastCamera) return;
    
    const worldPos = this.screenToWorld(mousePos.x, mousePos.y, this.lastCamera);
    
    if (this.isDragging && this.draggedVertex) {
      // Update vertex position with snap to grid
      const sector = LevelData[this.draggedVertex.sectorIndex];
      sector.vertices[this.draggedVertex.vertexIndex].x = this.snapToGrid(worldPos.x);
      sector.vertices[this.draggedVertex.vertexIndex].y = this.snapToGrid(worldPos.y);
    } else {
      // Check for vertex hover
      this.hoveredVertex = this.findVertexAt(worldPos.x, worldPos.y);
    }
  }

  private onMouseDown(e: MouseEvent): void {
    if (e.button === 0 && this.hoveredVertex) { // Left mouse button
      this.draggedVertex = this.hoveredVertex;
      this.isDragging = true;
    }
  }

  private onMouseUp(e: MouseEvent): void {
    if (e.button === 0 && this.isDragging) { // Left mouse button
      this.isDragging = false;
      this.draggedVertex = null;
      if (this.onLevelUpdate) {
        this.onLevelUpdate();
      }
    }
  }

  private lastCamera: THREE.Camera | null = null;

  drawMap(camera: THREE.Camera): void {
    this.lastCamera = camera;
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    LevelData.forEach((sector, index) => {
      // Draw walls individually with different colors
      for (let i = 0; i < sector.vertices.length; i++) {
        const nextI = (i + 1) % sector.vertices.length;
        const v1 = sector.vertices[i];
        const v2 = sector.vertices[nextI];
        const wall = sector.walls[i];
        
        const x1 = centerX + (v1.x - camera.position.x) * this.scale;
        const y1 = centerY + (v1.y - camera.position.z) * this.scale;
        const x2 = centerX + (v2.x - camera.position.x) * this.scale;
        const y2 = centerY + (v2.y - camera.position.z) * this.scale;
        
        // Set color based on mode
        if (index === playerSector && i === playerSectorWall && playerSectorWall !== -1) {
          this.ctx.strokeStyle = 'white';
        } else if (this.mapMode === 'portal') {
          // Portal mode: red for portals, yellow for walls
          this.ctx.strokeStyle = this.isPortal(wall) ? 'red' : 'yellow';
        } else {
          // Texture mode: use texture colors
          this.ctx.strokeStyle = this.getColorFromTextureId(wall.textureId);
        }
        this.ctx.lineWidth = 2;
        
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
      }
      
      // Highlight current player sector
      if (index === playerSector) {
        this.ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
        this.ctx.beginPath();
        sector.vertices.forEach((vertex, i) => {
          const x = centerX + (vertex.x - camera.position.x) * this.scale;
          const y = centerY + (vertex.y - camera.position.z) * this.scale;
          if (i === 0) {
            this.ctx.moveTo(x, y);
          } else {
            this.ctx.lineTo(x, y);
          }
        });
        this.ctx.closePath();
        this.ctx.fill();
      }
    });

    // Draw player position (center dot)
    this.ctx.fillStyle = 'white';
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, 3, 0, 2 * Math.PI);
    this.ctx.fill();

    // Draw look direction arrow
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const arrowLength = 15;
    const arrowEndX = centerX + forward.x * arrowLength;
    const arrowEndY = centerY + forward.z * arrowLength;
    
    this.ctx.strokeStyle = 'yellow';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(centerX, centerY);
    this.ctx.lineTo(arrowEndX, arrowEndY);
    this.ctx.stroke();
    
    // Arrow head
    const angle = Math.atan2(forward.z, forward.x);
    const headLength = 5;
    this.ctx.beginPath();
    this.ctx.moveTo(arrowEndX, arrowEndY);
    this.ctx.lineTo(
      arrowEndX - headLength * Math.cos(angle - Math.PI / 6),
      arrowEndY - headLength * Math.sin(angle - Math.PI / 6)
    );
    this.ctx.moveTo(arrowEndX, arrowEndY);
    this.ctx.lineTo(
      arrowEndX - headLength * Math.cos(angle + Math.PI / 6),
      arrowEndY - headLength * Math.sin(angle + Math.PI / 6)
    );
    this.ctx.stroke();
    
    // Draw vertices
    LevelData.forEach((sector, sectorIndex) => {
      sector.vertices.forEach((vertex, vertexIndex) => {
        const x = centerX + (vertex.x - camera.position.x) * this.scale;
        const y = centerY + (vertex.y - camera.position.z) * this.scale;
        
        // Highlight hovered or dragged vertex
        if ((this.hoveredVertex?.sectorIndex === sectorIndex && this.hoveredVertex?.vertexIndex === vertexIndex) ||
            (this.draggedVertex?.sectorIndex === sectorIndex && this.draggedVertex?.vertexIndex === vertexIndex)) {
          this.ctx.fillStyle = 'cyan';
          this.ctx.beginPath();
          this.ctx.arc(x, y, 4, 0, 2 * Math.PI);
          this.ctx.fill();
        } else {
          this.ctx.fillStyle = 'white';
          this.ctx.beginPath();
          this.ctx.arc(x, y, 2, 0, 2 * Math.PI);
          this.ctx.fill();
        }
      });
    });

    // Draw camera coordinates and sector
    this.ctx.fillStyle = 'white';
    this.ctx.font = '12px Arial';
    this.ctx.fillText(
      `X: ${camera.position.x.toFixed(1)}   Z: ${camera.position.z.toFixed(1)}`,
      5,
      this.canvas.height - 20
    );
    this.ctx.fillText(
      `Sector: ${playerSector === -1 ? 'outside' : playerSector}`,
      5,
      this.canvas.height - 5
    );
  }
}