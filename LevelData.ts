import { LevelSector } from './types/LevelStructure';

// Global player sector index
export let playerSector: number = 0;

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
  return 0; // Default to first sector if not found
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