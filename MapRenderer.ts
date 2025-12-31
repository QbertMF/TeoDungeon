import { LevelData, playerSector, playerSectorWall } from './LevelData';
import * as THREE from 'three';

export class MapRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private scale: number = 20;

  constructor() {
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

  drawMap(camera: THREE.Camera): void {
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
        
        // Set color based on texture ID or highlight if looking at this wall
        if (index === playerSector && i === playerSectorWall && playerSectorWall !== -1) {
          this.ctx.strokeStyle = 'white';
        } else {
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