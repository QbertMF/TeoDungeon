import { LevelData } from './LevelData';
import * as THREE from 'three';

export class MapRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

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

  drawMap(camera: THREE.Camera): void {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const scale = 20;

    LevelData.forEach(sector => {
      // Draw walls individually with different colors
      for (let i = 0; i < sector.vertices.length; i++) {
        const nextI = (i + 1) % sector.vertices.length;
        const v1 = sector.vertices[i];
        const v2 = sector.vertices[nextI];
        const wall = sector.walls[i];
        
        const x1 = centerX + (v1.x - camera.position.x) * scale;
        const y1 = centerY + (v1.y - camera.position.z) * scale;
        const x2 = centerX + (v2.x - camera.position.x) * scale;
        const y2 = centerY + (v2.y - camera.position.z) * scale;
        
        // Set color based on portal status
        this.ctx.strokeStyle = (wall.bottomHeight < 0 || wall.topHeight < 0) ? 'red' : 'gray';
        this.ctx.lineWidth = 2;
        
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
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
    
    // Draw camera coordinates
    this.ctx.fillStyle = 'white';
    this.ctx.font = '12px Arial';
    this.ctx.fillText(
      `X: ${camera.position.x.toFixed(1)}   Z: ${camera.position.z.toFixed(1)}`,
      5,
      this.canvas.height - 5
    );
  }
}