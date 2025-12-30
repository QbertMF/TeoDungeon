// 2D coordinate for polygon vertices
export interface Vector2D {
  x: number;
  y: number;
}

// Wall segment between two vertices
export interface Wall {
  bottomHeight: number;    // Height of bottom wall part
  topHeight: number;       // Height of top wall part
  textureId: number;       // Unique texture identifier for this wall
}

// Polygonal level sector
export interface LevelSector {
  // Floor and ceiling properties
  floorHeight: number;     // Base floor height
  ceilingHeight: number;   // Base ceiling height
  floorTextureId: number;  // Floor texture identifier
  ceilingTextureId: number; // Ceiling texture identifier
  
  // Lighting
  brightness: number;      // Brightness level (0.0 - 1.0)
  
  // Geometry
  vertices: Vector2D[];    // Polygon vertices in 2D space
  walls: Wall[];          // Wall data (length must match vertices.length)
}

// Complete level structure
export interface Level {
  sectors: LevelSector[];
  name?: string;
  textureAtlas?: string;   // Path to texture atlas
}