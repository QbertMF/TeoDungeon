import { LevelSector } from './types/LevelStructure';

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
      { bottomHeight: 1, topHeight: 0.5, textureId: 3 },
      { bottomHeight: -1, topHeight: -1, textureId: 4 },
      { bottomHeight: 1, topHeight: 0.5, textureId: 5 },
      { bottomHeight: 1, topHeight: 0.5, textureId: 6 }
    ]
  }
];