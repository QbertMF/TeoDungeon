import { LevelSector } from './types/LevelStructure';

// Global player sector index
export let playerSector: number = 0;

// Global player sector wall index
export let playerSectorWall: number = -1;

// Function to find line-line intersection
function lineIntersection(
  x1: number, y1: number, x2: number, y2: number,
  x3: number, y3: number, x4: number, y4: number
): { x: number; y: number; t: number } | null {
  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(denom) < 1e-10) return null; // Lines are parallel
  
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
  
  if (t >= 0 && u >= 0 && u <= 1) {
    return {
      x: x1 + t * (x2 - x1),
      y: y1 + t * (y2 - y1),
      t: t
    };
  }
  return null;
}

// Function to find which wall the camera is looking at
export function findLookingAtWall(cameraX: number, cameraZ: number, lookDirX: number, lookDirZ: number): void {
  if (playerSector < 0 || playerSector >= LevelData.length) {
    playerSectorWall = -1;
    return;
  }
  
  const sector = LevelData[playerSector];
  let closestWall = -1;
  let closestDistance = Infinity;
  
  // Cast ray from camera position in look direction
  const rayEndX = cameraX + lookDirX * 1000; // Extend ray far out
  const rayEndZ = cameraZ + lookDirZ * 1000;
  
  // Check intersection with each wall
  for (let i = 0; i < sector.vertices.length; i++) {
    const nextI = (i + 1) % sector.vertices.length;
    const v1 = sector.vertices[i];
    const v2 = sector.vertices[nextI];
    
    const intersection = lineIntersection(
      cameraX, cameraZ, rayEndX, rayEndZ,
      v1.x, v1.y, v2.x, v2.y
    );
    
    if (intersection && intersection.t < closestDistance) {
      closestDistance = intersection.t;
      closestWall = i;
    }
  }
  
  playerSectorWall = closestWall;
}

// Function to check if point is inside polygon using ray casting
function isPointInPolygon(x: number, y: number, vertices: { x: number; y: number }[]): boolean {
  let inside = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    if (((vertices[i].y > y) !== (vertices[j].y > y)) &&
        (x < (vertices[j].x - vertices[i].x) * (y - vertices[i].y) / (vertices[j].y - vertices[i].y) + vertices[i].x)) {
      inside = !inside;
    }
  }
  return inside;
}

// Function to find which sector contains the given position
export function findPlayerSector(x: number, z: number): number {
  for (let i = 0; i < LevelData.length; i++) {
    if (isPointInPolygon(x, z, LevelData[i].vertices)) {
      return i;
    }
  }
  return -1; // Return -1 if not found in any sector
}

// Function to update player sector
export function updatePlayerSector(x: number, z: number): void {
  playerSector = findPlayerSector(x, z);
}

// Global level data array
export const LevelData: LevelSector[] = [
  {
    floorHeight: 0,
    ceilingHeight: 3,
    floorTextureId: 1,
    ceilingTextureId: 2,
    brightness: 0.8,
    vertices: [
      { x: -2, y: -2 },
      { x: 2, y: -2 },
      { x: 2, y: 2 },
      { x: -2, y: 2 }
    ],
    walls: [
      { bottomHeight: 0.0, topHeight: 1.0, textureId: 3 },
      { bottomHeight: -1, topHeight: -1, textureId: 4 },
      { bottomHeight: 0.0, topHeight: 1.0, textureId: 5 },
      { bottomHeight: 0.0, topHeight: 1.0, textureId: 6 }
    ]
  },
  {
    floorHeight: 0,
    ceilingHeight: 3,
    floorTextureId: 7,
    ceilingTextureId: 8,
    brightness: 0.7,
    vertices: [
      { x: -2, y: 2 },
      { x: 2, y: 2 },
      { x: 2, y: 6 },
      { x: -2, y: 6 }
    ],
    walls: [
      { bottomHeight: 1, topHeight: 0.5, textureId: 9 },
      { bottomHeight: 1, topHeight: 0.5, textureId: 10 },
      { bottomHeight: 0, topHeight: 0.5, textureId: 11 },
      { bottomHeight: 1, topHeight: 0.5, textureId: 12 }
    ]
  },
  {
    floorHeight: 0,
    ceilingHeight: 3,
    floorTextureId: 13,
    ceilingTextureId: 14,
    brightness: 0.6,
    vertices: [
      { x: 2, y: 2 },
      { x: 2, y: 6 },
      { x: 6, y: 7 },
      { x: 7, y: 4 },
      { x: 5, y: 1 }
    ],
    walls: [
      { bottomHeight: 1, topHeight: 0.5, textureId: 15 },
      { bottomHeight: 1, topHeight: 0.5, textureId: 16 },
      { bottomHeight: 1, topHeight: 0.5, textureId: 17 },
      { bottomHeight: 1, topHeight: 0.5, textureId: 18 },
      { bottomHeight: 1, topHeight: 0.5, textureId: 19 }
    ]
  },
  {
    floorHeight: 0,
    ceilingHeight: 3,
    floorTextureId: 20,
    ceilingTextureId: 21,
    brightness: 0.5,
    vertices: [
      { x: -2, y: 6 },
      { x: 2, y: 6 },
      { x: 0, y: 9 }
    ],
    walls: [
      { bottomHeight: 0, topHeight: 0.5, textureId: 22 },
      { bottomHeight: -1, topHeight: -1, textureId: 23 },
      { bottomHeight: -1, topHeight: -1, textureId: 24 }
    ]
  },
  {
    floorHeight: 0,
    ceilingHeight: 3,
    floorTextureId: 25,
    ceilingTextureId: 26,
    brightness: 0.9,
    vertices: [
      { x: -2, y: -2 },
      { x: -2-5, y: -8 },
      { x: 2-5, y: -8 },
      { x: 2, y: -2 }
    ],
    walls: [
      { bottomHeight: 1, topHeight: 0.5, textureId: 27 },
      { bottomHeight: 1, topHeight: 0.5, textureId: 28 },
      { bottomHeight: 1, topHeight: 0.5, textureId: 29 },
      { bottomHeight: 0.0, topHeight: 1.0, textureId: 30 }
    ]
  }
];

// Initialize player sector (assumes player starts at origin)
playerSector = findPlayerSector(0, 0);