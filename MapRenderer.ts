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

    // Set line style
    this.ctx.strokeStyle = 'red';
    this.ctx.lineWidth = 2;

    LevelData.forEach(segment => {
      this.ctx.beginPath();
      
      segment.vertices.forEach((vertex, index) => {
        const x = centerX + (vertex.x - camera.position.x) * scale;
        const y = centerY + (vertex.y - camera.position.z) * scale;
        
        if (index === 0) {
          this.ctx.moveTo(x, y);
        } else {
          this.ctx.lineTo(x, y);
        }
      });
      
      // Close the polygon
      const firstVertex = segment.vertices[0];
      const x = centerX + (firstVertex.x - camera.position.x) * scale;
      const y = centerY + (firstVertex.y - camera.position.z) * scale;
      this.ctx.lineTo(x, y);
      
      this.ctx.stroke();
    });

    // Draw player position (center dot)
    this.ctx.fillStyle = 'white';
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, 3, 0, 2 * Math.PI);
    this.ctx.fill();
  }
}