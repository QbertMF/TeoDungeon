import { LevelSector } from './types/LevelStructure';

// Global player sector index
export let playerSector: number = 0;

// Global player sector wall index
export let playerSectorWall: number = -1;

// Player collision settings
export const playerRadius = 0.3;
const wallHeightThreshold = 0.5;
export let collisionEnabled = true;

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

// Function to toggle wall between solid and portal
export function toggleWall(): void {
  if (playerSector < 0 || playerSector >= LevelData.length || playerSectorWall < 0) {
    return; // Can't toggle if not in a sector or not looking at a wall
  }
  
  const sector = LevelData[playerSector];
  const wall = sector.walls[playerSectorWall];
  console.log(`Toggling wall ${playerSectorWall} in sector ${playerSector}`);
  
  // Check if current wall is a solid wall (both heights are -1)
  if (wall.bottomHeight === -1 && wall.topHeight === -1) {
    // Convert to portal: set heights to sector floor/ceiling
    wall.bottomHeight = 0.0;
    wall.topHeight = 0.0;
  } else {
    // Convert to solid wall: set both heights to -1
    wall.bottomHeight = -1;
    wall.topHeight = -1;
  }
}

// Function to update player sector
export function updatePlayerSector(x: number, z: number): void {
  playerSector = findPlayerSector(x, z);
}

// Function to check collision with a single wall
function checkSingleWallCollision(x: number, z: number, v1: {x: number, y: number}, v2: {x: number, y: number}, wall: {bottomHeight: number, topHeight: number}): boolean {
  if ((wall.bottomHeight < wallHeightThreshold) && (wall.bottomHeight >= 0.0)) return false;
  
  const wallDx = v2.x - v1.x;
  const wallDy = v2.y - v1.y;
  const wallLength = Math.sqrt(wallDx * wallDx + wallDy * wallDy);
  const wallNormX = wallDx / wallLength;
  const wallNormY = wallDy / wallLength;
  const perpX = -wallNormY;
  const perpY = wallNormX;
  
  const toPointX = x - v1.x;
  const toPointY = z - v1.y;
  const distanceToLine = Math.abs(toPointX * perpX + toPointY * perpY);
  const projectionOnWall = toPointX * wallNormX + toPointY * wallNormY;
  
  return projectionOnWall >= 0 && projectionOnWall <= wallLength && distanceToLine < playerRadius;
}

// Function to check collision and reflect movement
export function checkCollision(currentX: number, currentZ: number, newX: number, newZ: number): { x: number; z: number } {
  if (!collisionEnabled) return { x: newX, z: newZ };
  
  // Check all sectors for wall collisions
  for (const sector of LevelData) {
    for (let i = 0; i < sector.vertices.length; i++) {
      const nextI = (i + 1) % sector.vertices.length;
      const v1 = sector.vertices[i];
      const v2 = sector.vertices[nextI];
      const wall = sector.walls[i];
      
      // Skip if wall can be passed through
      if ((wall.bottomHeight < wallHeightThreshold) && (wall.bottomHeight >= 0.0))  continue;
      
      // Calculate distance from new position to wall line
      const wallDx = v2.x - v1.x;
      const wallDy = v2.y - v1.y;
      const wallLength = Math.sqrt(wallDx * wallDx + wallDy * wallDy);
      const wallNormX = wallDx / wallLength;
      const wallNormY = wallDy / wallLength;
      const perpX = -wallNormY;
      const perpY = wallNormX;
      
      // Point to line distance
      const toPointX = newX - v1.x;
      const toPointY = newZ - v1.y;
      const distanceToLine = Math.abs(toPointX * perpX + toPointY * perpY);
      
      // Check if within wall segment bounds
      const projectionOnWall = toPointX * wallNormX + toPointY * wallNormY;
      if (projectionOnWall < 0 || projectionOnWall > wallLength) continue;
      
      // Check collision
      if (distanceToLine < playerRadius) {
        // Calculate movement along the wall
        const movementX = newX - currentX;
        const movementZ = newZ - currentZ;
        const dotProduct = movementX * wallNormX + movementZ * wallNormY;
        const slideX = currentX + dotProduct * wallNormX;
        const slideZ = currentZ + dotProduct * wallNormY;
        
        // Add small buffer to prevent edge sticking
        const bufferX = perpX * 0.001;
        const bufferZ = perpY * 0.001;
        const finalX = slideX + bufferX;
        const finalZ = slideZ + bufferZ;
        
        // Check if sliding position would collide with any other wall
        for (const otherSector of LevelData) {
          for (let j = 0; j < otherSector.vertices.length; j++) {
            const nextJ = (j + 1) % otherSector.vertices.length;
            const otherV1 = otherSector.vertices[j];
            const otherV2 = otherSector.vertices[nextJ];
            const otherWall = otherSector.walls[j];
            
            // Skip the current wall
            if (otherSector === sector && j === i) continue;
            
            if (checkSingleWallCollision(finalX, finalZ, otherV1, otherV2, otherWall)) {
              return { x: currentX, z: currentZ };
            }
          }
        }
        
        return { x: finalX, z: finalZ };
      }
    }
  }
  
  return { x: newX, z: newZ };
}

// Function to toggle collision
export function toggleCollision(): void {
  collisionEnabled = !collisionEnabled;
}

// Function to adjust wall bottom height
export function adjustWallBottomHeight(increase: boolean): void {
  if (playerSector < 0 || playerSector >= LevelData.length || playerSectorWall < 0) {
    return;
  }
  
  const sector = LevelData[playerSector];
  const wall = sector.walls[playerSectorWall];
  
  if (increase) {
    wall.bottomHeight = Math.min(wall.bottomHeight + 0.1, sector.ceilingHeight - wall.topHeight - 0.1);
  } else {
    wall.bottomHeight = Math.max(wall.bottomHeight - 0.1, 0.0);
  }
}

// Function to adjust wall top height
export function adjustWallTopHeight(increase: boolean): void {
  if (playerSector < 0 || playerSector >= LevelData.length || playerSectorWall < 0) {
    return;
  }
  
  const sector = LevelData[playerSector];
  const wall = sector.walls[playerSectorWall];
  
  if (increase) {
    wall.topHeight = Math.min(wall.topHeight + 0.1, sector.ceilingHeight - sector.floorHeight - wall.bottomHeight - 0.1);
  } else {
    wall.topHeight = Math.max(wall.topHeight - 0.1, 0.0);
  }
}

// Function to print all sectors to console
export function printSectors(): void {
  console.log('All Sectors:', JSON.stringify(LevelData, null, 2));
}

// Function to snap coordinate to 0.1 grid
function snapToGrid(value: number): number {
  return Math.round(value * 10) / 10;
}

// Function to get random texture ID
function getRandomTextureId(): number {
  return Math.floor(Math.random() * 8) + 1;
}

// Function to delete current player sector
export function deleteSector(): void {
  if (playerSector >= 0 && playerSector < LevelData.length) {
    LevelData.splice(playerSector, 1);
    playerSector = findPlayerSector(0, 0); // Reset player sector
  }
}

// Function to add new sector sharing the current wall
export function addSector(vertexCount: number, lookDirX?: number, lookDirZ?: number): void {
  if (playerSector < 0 || playerSector >= LevelData.length || playerSectorWall < 0) {
    return;
  }
  
  const currentSector = LevelData[playerSector];
  const currentWall = currentSector.walls[playerSectorWall];
  const nextWallIndex = (playerSectorWall + 1) % currentSector.vertices.length;
  const v1 = currentSector.vertices[playerSectorWall];
  const v2 = currentSector.vertices[nextWallIndex];
  
  // Create vertices for new sector
  const vertices = [];
  const walls = [];
  
  // Add shared wall vertices (reversed order for counter-clockwise)
  vertices.push({ x: v2.x, y: v2.y });
  vertices.push({ x: v1.x, y: v1.y });
  
  if (vertexCount === 3 && lookDirX !== undefined && lookDirZ !== undefined) {
    // Triangle: place third vertex in look direction
    const wallCenterX = (v1.x + v2.x) / 2;
    const wallCenterY = (v1.y + v2.y) / 2;
    const distance = 2;
    vertices.push({
      x: snapToGrid(wallCenterX + lookDirX * distance),
      y: snapToGrid(wallCenterY + lookDirZ * distance)
    });
  } else if (vertexCount === 4 && lookDirX !== undefined && lookDirZ !== undefined) {
    // Quad: place two vertices in look direction
    const distance = 2;
    vertices.push({
      x: snapToGrid(v1.x + lookDirX * distance),
      y: snapToGrid(v1.y + lookDirZ * distance)
    });
    vertices.push({
      x: snapToGrid(v2.x + lookDirX * distance),
      y: snapToGrid(v2.y + lookDirZ * distance)
    });
  } else if (lookDirX !== undefined && lookDirZ !== undefined) {
    // Pentagon/Hexagon: place center in look direction, arrange vertices around it
    const wallCenterX = (v1.x + v2.x) / 2;
    const wallCenterY = (v1.y + v2.y) / 2;
    const centerX = wallCenterX + lookDirX * 2;
    const centerY = wallCenterY + lookDirZ * 2;
    const radius = 1.5;
    
    // Calculate angle to first vertex (v2) to align polygon properly
    const baseAngle = Math.atan2(v2.y - centerY, v2.x - centerX);
    
    for (let i = 2; i < vertexCount; i++) {
      const angle = baseAngle + (Math.PI * 2 * i) / vertexCount;
      vertices.push({
        x: snapToGrid(centerX + Math.cos(angle) * radius),
        y: snapToGrid(centerY + Math.sin(angle) * radius)
      });
    }
  } else {
    // Other polygons: use perpendicular placement
    const wallDx = v2.x - v1.x;
    const wallDy = v2.y - v1.y;
    const perpX = -wallDy;
    const perpY = wallDx;
    const perpLength = Math.sqrt(perpX * perpX + perpY * perpY);
    const normPerpX = perpX / perpLength;
    const normPerpY = perpY / perpLength;
    
    const centerX = (v1.x + v2.x) / 2 + normPerpX * 2;
    const centerY = (v1.y + v2.y) / 2 + normPerpY * 2;
    const radius = 2;
    
    for (let i = 2; i < vertexCount; i++) {
      const angle = (Math.PI * 2 * (i - 2)) / (vertexCount - 2);
      vertices.push({
        x: snapToGrid(centerX + Math.cos(angle) * radius),
        y: snapToGrid(centerY + Math.sin(angle) * radius)
      });
    }
  }
  
  // Transform solid wall to portal if it has negative values
  if (currentWall.bottomHeight < 0 || currentWall.topHeight < 0) {
    currentWall.bottomHeight = 0.0;
    currentWall.topHeight = 0.0;
  }
  
  // Create walls
  for (let i = 0; i < vertexCount; i++) {
    if (i === 0) {
      // Shared wall - make it a portal with no wall parts
      walls.push({ bottomHeight: 0.0, topHeight: 0.0, textureId: getRandomTextureId() });
    } else {
      // Other walls - solid
      walls.push({ bottomHeight: -1, topHeight: -1, textureId: getRandomTextureId() });
    }
  }
  
  // Calculate floor and ceiling heights based on portal dimensions
  const newFloorHeight = currentWall.bottomHeight > 0 
    ? currentSector.floorHeight + currentWall.bottomHeight 
    : currentSector.floorHeight;
  const newCeilingHeight = currentSector.ceilingHeight - currentWall.topHeight;
  
  // Create new sector
  const newSector: LevelSector = {
    floorHeight: newFloorHeight,
    ceilingHeight: newCeilingHeight,
    floorTextureId: getRandomTextureId(),
    ceilingTextureId: getRandomTextureId(),
    brightness: 0.8,
    vertices,
    walls,
    drawCount: 0
  };
  
  LevelData.push(newSector);
}

// Global level data array
export const LevelData: LevelSector[] = [
  {
    "floorHeight": 0,
    "ceilingHeight": 3,
    "floorTextureId": 1,
    "ceilingTextureId": 2,
    "brightness": 0.8,
    "vertices": [
      {
        "x": -2,
        "y": -2
      },
      {
        "x": 2,
        "y": -2
      },
      {
        "x": 2,
        "y": 2
      },
      {
        "x": -2,
        "y": 2
      }
    ],
    "walls": [
      {
        "bottomHeight": 0,
        "topHeight": 1,
        "textureId": 3
      },
      {
        "bottomHeight": -1,
        "topHeight": -1,
        "textureId": 4
      },
      {
        "bottomHeight": 0,
        "topHeight": 1,
        "textureId": 5
      },
      {
        "bottomHeight": 0,
        "topHeight": 1,
        "textureId": 6
      }
    ],
    "drawCount": 0
  },
  {
    "floorHeight": 0,
    "ceilingHeight": 3,
    "floorTextureId": 7,
    "ceilingTextureId": 8,
    "brightness": 0.7,
    "vertices": [
      {
        "x": -2,
        "y": 2
      },
      {
        "x": 2,
        "y": 2
      },
      {
        "x": 2,
        "y": 6
      },
      {
        "x": -2,
        "y": 6
      }
    ],
    "walls": [
      {
        "bottomHeight": 1,
        "topHeight": 0.5,
        "textureId": 9
      },
      {
        "bottomHeight": 1,
        "topHeight": 0.5,
        "textureId": 10
      },
      {
        "bottomHeight": 0,
        "topHeight": 0.5,
        "textureId": 11
      },
      {
        "bottomHeight": 1,
        "topHeight": 0.5,
        "textureId": 12
      }
    ],
    "drawCount": 0
  },
  {
    "floorHeight": 0,
    "ceilingHeight": 3,
    "floorTextureId": 13,
    "ceilingTextureId": 14,
    "brightness": 0.6,
    "vertices": [
      {
        "x": 2,
        "y": 2
      },
      {
        "x": 2,
        "y": 6
      },
      {
        "x": 6,
        "y": 7
      },
      {
        "x": 7,
        "y": 4
      },
      {
        "x": 5,
        "y": 1
      }
    ],
    "walls": [
      {
        "bottomHeight": 1,
        "topHeight": 0.5,
        "textureId": 15
      },
      {
        "bottomHeight": 1,
        "topHeight": 0.5,
        "textureId": 16
      },
      {
        "bottomHeight": 1,
        "topHeight": 0.5,
        "textureId": 17
      },
      {
        "bottomHeight": 1,
        "topHeight": 0.5,
        "textureId": 18
      },
      {
        "bottomHeight": 1,
        "topHeight": 0.5,
        "textureId": 19
      }
    ],
    "drawCount": 0
  },
  {
    "floorHeight": 0,
    "ceilingHeight": 3,
    "floorTextureId": 20,
    "ceilingTextureId": 21,
    "brightness": 0.5,
    "vertices": [
      {
        "x": -2,
        "y": 6
      },
      {
        "x": 2,
        "y": 6
      },
      {
        "x": 0,
        "y": 9
      }
    ],
    "walls": [
      {
        "bottomHeight": 0,
        "topHeight": 0.5,
        "textureId": 22
      },
      {
        "bottomHeight": 0,
        "topHeight": 0.5,
        "textureId": 23
      },
      {
        "bottomHeight": -1,
        "topHeight": -1,
        "textureId": 24
      }
    ],
    "drawCount": 0
  },
  {
    "floorHeight": 0,
    "ceilingHeight": 3,
    "floorTextureId": 25,
    "ceilingTextureId": 26,
    "brightness": 0.9,
    "vertices": [
      {
        "x": -2,
        "y": -2
      },
      {
        "x": -7,
        "y": -8
      },
      {
        "x": -3,
        "y": -8
      },
      {
        "x": 2,
        "y": -2
      }
    ],
    "walls": [
      {
        "bottomHeight": 1,
        "topHeight": 0.5,
        "textureId": 27
      },
      {
        "bottomHeight": 0,
        "topHeight": 0,
        "textureId": 28
      },
      {
        "bottomHeight": 1,
        "topHeight": 0.5,
        "textureId": 29
      },
      {
        "bottomHeight": 0,
        "topHeight": 1,
        "textureId": 30
      }
    ],
    "drawCount": 0
  },
  {
    "floorHeight": 0,
    "ceilingHeight": 3,
    "floorTextureId": 3,
    "ceilingTextureId": 1,
    "brightness": 0.8,
    "vertices": [
      {
        "x": -3,
        "y": -8
      },
      {
        "x": -7,
        "y": -8
      },
      {
        "x": -6.59,
        "y": -10.2
      },
      {
        "x": -5.37,
        "y": -11.47
      },
      {
        "x": -3.78,
        "y": -10.71
      }
    ],
    "walls": [
      {
        "bottomHeight": 0,
        "topHeight": 0,
        "textureId": 7
      },
      {
        "bottomHeight": -1,
        "topHeight": -1,
        "textureId": 1
      },
      {
        "bottomHeight": 0,
        "topHeight": 0,
        "textureId": 5
      },
      {
        "bottomHeight": -1,
        "topHeight": -1,
        "textureId": 2
      },
      {
        "bottomHeight": -1,
        "topHeight": -1,
        "textureId": 4
      }
    ],
    "drawCount": 0
  },
  {
    "floorHeight": 0,
    "ceilingHeight": 3,
    "floorTextureId": 8,
    "ceilingTextureId": 5,
    "brightness": 0.8,
    "vertices": [
      {
        "x": -5.37,
        "y": -11.47
      },
      {
        "x": -6.59,
        "y": -10.2
      },
      {
        "x": -8.03,
        "y": -11.59
      },
      {
        "x": -6.81,
        "y": -12.86
      }
    ],
    "walls": [
      {
        "bottomHeight": 0,
        "topHeight": 0,
        "textureId": 5
      },
      {
        "bottomHeight": -1,
        "topHeight": -1,
        "textureId": 8
      },
      {
        "bottomHeight": 0,
        "topHeight": 0,
        "textureId": 6
      },
      {
        "bottomHeight": -1,
        "topHeight": -1,
        "textureId": 1
      }
    ],
    "drawCount": 0
  },
  {
    "floorHeight": 0,
    "ceilingHeight": 3,
    "floorTextureId": 3,
    "ceilingTextureId": 6,
    "brightness": 0.8,
    "vertices": [
      {
        "x": -6.81,
        "y": -12.86
      },
      {
        "x": -8.03,
        "y": -11.59
      },
      {
        "x": -9.47,
        "y": -12.98
      },
      {
        "x": -8.25,
        "y": -14.25
      }
    ],
    "walls": [
      {
        "bottomHeight": 0,
        "topHeight": 0,
        "textureId": 6
      },
      {
        "bottomHeight": -1,
        "topHeight": -1,
        "textureId": 2
      },
      {
        "bottomHeight": 0,
        "topHeight": 0,
        "textureId": 8
      },
      {
        "bottomHeight": -1,
        "topHeight": -1,
        "textureId": 8
      }
    ],
    "drawCount": 0
  },
  {
    "floorHeight": 0,
    "ceilingHeight": 3,
    "floorTextureId": 6,
    "ceilingTextureId": 1,
    "brightness": 0.8,
    "vertices": [
      {
        "x": -8.25,
        "y": -14.25
      },
      {
        "x": -9.47,
        "y": -12.98
      },
      {
        "x": -10.91,
        "y": -14.37
      },
      {
        "x": -9.69,
        "y": -15.64
      }
    ],
    "walls": [
      {
        "bottomHeight": 0,
        "topHeight": 0,
        "textureId": 8
      },
      {
        "bottomHeight": -1,
        "topHeight": -1,
        "textureId": 2
      },
      {
        "bottomHeight": 0,
        "topHeight": 0,
        "textureId": 4
      },
      {
        "bottomHeight": -1,
        "topHeight": -1,
        "textureId": 6
      }
    ],
    "drawCount": 0
  },
  {
    "floorHeight": 0,
    "ceilingHeight": 3,
    "floorTextureId": 1,
    "ceilingTextureId": 1,
    "brightness": 0.8,
    "vertices": [
      {
        "x": -9.69,
        "y": -15.64
      },
      {
        "x": -10.91,
        "y": -14.37
      },
      {
        "x": -12.35,
        "y": -15.76
      },
      {
        "x": -11.13,
        "y": -17.03
      }
    ],
    "walls": [
      {
        "bottomHeight": 0,
        "topHeight": 0,
        "textureId": 5
      },
      {
        "bottomHeight": -1,
        "topHeight": -1,
        "textureId": 1
      },
      {
        "bottomHeight": 0,
        "topHeight": 0,
        "textureId": 1
      },
      {
        "bottomHeight": 0,
        "topHeight": 0,
        "textureId": 1
      }
    ],
    "drawCount": 0
  },
  {
    "floorHeight": 0,
    "ceilingHeight": 3,
    "floorTextureId": 5,
    "ceilingTextureId": 1,
    "brightness": 0.8,
    "vertices": [
      {
        "x": -11.13,
        "y": -17.03
      },
      {
        "x": -12.35,
        "y": -15.76
      },
      {
        "x": -13.79,
        "y": -17.15
      },
      {
        "x": -12.57,
        "y": -18.42
      }
    ],
    "walls": [
      {
        "bottomHeight": 0,
        "topHeight": 0,
        "textureId": 2
      },
      {
        "bottomHeight": -1,
        "topHeight": -1,
        "textureId": 2
      },
      {
        "bottomHeight": 0,
        "topHeight": 0,
        "textureId": 1
      },
      {
        "bottomHeight": -1,
        "topHeight": -1,
        "textureId": 2
      }
    ],
    "drawCount": 0
  },
  {
    "floorHeight": 0,
    "ceilingHeight": 3,
    "floorTextureId": 3,
    "ceilingTextureId": 8,
    "brightness": 0.8,
    "vertices": [
      {
        "x": -12.57,
        "y": -18.42
      },
      {
        "x": -13.79,
        "y": -17.15
      },
      {
        "x": -15.23,
        "y": -18.54
      },
      {
        "x": -14.01,
        "y": -19.81
      }
    ],
    "walls": [
      {
        "bottomHeight": 0,
        "topHeight": 0,
        "textureId": 4
      },
      {
        "bottomHeight": -1,
        "topHeight": -1,
        "textureId": 7
      },
      {
        "bottomHeight": 0,
        "topHeight": 0,
        "textureId": 1
      },
      {
        "bottomHeight": -1,
        "topHeight": -1,
        "textureId": 3
      }
    ],
    "drawCount": 0
  },
  {
    "floorHeight": 0,
    "ceilingHeight": 3,
    "floorTextureId": 6,
    "ceilingTextureId": 5,
    "brightness": 0.8,
    "vertices": [
      {
        "x": -14.01,
        "y": -19.81
      },
      {
        "x": -15.23,
        "y": -18.54
      },
      {
        "x": -16.67,
        "y": -19.93
      },
      {
        "x": -15.45,
        "y": -21.2
      }
    ],
    "walls": [
      {
        "bottomHeight": 0,
        "topHeight": 0,
        "textureId": 5
      },
      {
        "bottomHeight": -1,
        "topHeight": -1,
        "textureId": 1
      },
      {
        "bottomHeight": 0,
        "topHeight": 0,
        "textureId": 2
      },
      {
        "bottomHeight": -1,
        "topHeight": -1,
        "textureId": 8
      }
    ],
    "drawCount": 0
  },
  {
    "floorHeight": 0,
    "ceilingHeight": 3,
    "floorTextureId": 7,
    "ceilingTextureId": 5,
    "brightness": 0.8,
    "vertices": [
      {
        "x": -15.45,
        "y": -21.2
      },
      {
        "x": -16.67,
        "y": -19.93
      },
      {
        "x": -18.11,
        "y": -21.32
      },
      {
        "x": -16.89,
        "y": -22.59
      }
    ],
    "walls": [
      {
        "bottomHeight": 0,
        "topHeight": 0,
        "textureId": 5
      },
      {
        "bottomHeight": -1,
        "topHeight": -1,
        "textureId": 4
      },
      {
        "bottomHeight": 0,
        "topHeight": 0,
        "textureId": 8
      },
      {
        "bottomHeight": -1,
        "topHeight": -1,
        "textureId": 6
      }
    ],
    "drawCount": 0
  },
  {
    "floorHeight": 0,
    "ceilingHeight": 3,
    "floorTextureId": 8,
    "ceilingTextureId": 4,
    "brightness": 0.8,
    "vertices": [
      {
        "x": -16.89,
        "y": -22.59
      },
      {
        "x": -18.11,
        "y": -21.32
      },
      {
        "x": -20.38,
        "y": -22.93
      },
      {
        "x": -19.78,
        "y": -24.59
      },
      {
        "x": -18.02,
        "y": -24.52
      }
    ],
    "walls": [
      {
        "bottomHeight": 0,
        "topHeight": 0,
        "textureId": 1
      },
      {
        "bottomHeight": -1,
        "topHeight": -1,
        "textureId": 2
      },
      {
        "bottomHeight": -1,
        "topHeight": -1,
        "textureId": 1
      },
      {
        "bottomHeight": -1,
        "topHeight": -1,
        "textureId": 3
      },
      {
        "bottomHeight": 0,
        "topHeight": 0,
        "textureId": 2
      }
    ],
    "drawCount": 0
  },
  {
    "floorHeight": 0,
    "ceilingHeight": 3,
    "floorTextureId": 6,
    "ceilingTextureId": 2,
    "brightness": 0.8,
    "vertices": [
      {
        "x": -16.89,
        "y": -22.59
      },
      {
        "x": -18.02,
        "y": -24.52
      },
      {
        "x": -16.28,
        "y": -28.41
      },
      {
        "x": -11.06,
        "y": -30.57
      },
      {
        "x": -7.28,
        "y": -24.51
      },
      {
        "x": -12.59,
        "y": -21.88
      }
    ],
    "walls": [
      {
        "bottomHeight": 0,
        "topHeight": 0,
        "textureId": 8
      },
      {
        "bottomHeight": -1,
        "topHeight": -1,
        "textureId": 4
      },
      {
        "bottomHeight": -1,
        "topHeight": -1,
        "textureId": 1
      },
      {
        "bottomHeight": 0,
        "topHeight": 0,
        "textureId": 7
      },
      {
        "bottomHeight": -1,
        "topHeight": -1,
        "textureId": 8
      },
      {
        "bottomHeight": -1,
        "topHeight": -1,
        "textureId": 4
      }
    ],
    "drawCount": 0
  },
  {
    "floorHeight": 0,
    "ceilingHeight": 3,
    "floorTextureId": 3,
    "ceilingTextureId": 3,
    "brightness": 0.8,
    "vertices": [
      {
        "x": -9.69,
        "y": -15.64
      },
      {
        "x": -11.13,
        "y": -17.03
      },
      {
        "x": -9.74,
        "y": -18.47
      },
      {
        "x": -8.3,
        "y": -17.08
      }
    ],
    "walls": [
      {
        "bottomHeight": 0,
        "topHeight": 0,
        "textureId": 1
      },
      {
        "bottomHeight": -1,
        "topHeight": -1,
        "textureId": 6
      },
      {
        "bottomHeight": 0,
        "topHeight": 0,
        "textureId": 5
      },
      {
        "bottomHeight": -1,
        "topHeight": -1,
        "textureId": 3
      }
    ],
    "drawCount": 0
  },
  {
    "floorHeight": 0,
    "ceilingHeight": 3,
    "floorTextureId": 1,
    "ceilingTextureId": 6,
    "brightness": 0.8,
    "vertices": [
      {
        "x": -8.3,
        "y": -17.08
      },
      {
        "x": -9.74,
        "y": -18.47
      },
      {
        "x": -8.35,
        "y": -19.91
      },
      {
        "x": -6.91,
        "y": -18.52
      }
    ],
    "walls": [
      {
        "bottomHeight": 0,
        "topHeight": 0,
        "textureId": 5
      },
      {
        "bottomHeight": -1,
        "topHeight": -1,
        "textureId": 5
      },
      {
        "bottomHeight": 0,
        "topHeight": 0,
        "textureId": 5
      },
      {
        "bottomHeight": -1,
        "topHeight": -1,
        "textureId": 8
      }
    ],
    "drawCount": 0
  },
  {
    "floorHeight": 0,
    "ceilingHeight": 3,
    "floorTextureId": 2,
    "ceilingTextureId": 6,
    "brightness": 0.8,
    "vertices": [
      {
        "x": -6.91,
        "y": -18.52
      },
      {
        "x": -8.35,
        "y": -19.91
      },
      {
        "x": -6.96,
        "y": -21.35
      },
      {
        "x": -5.52,
        "y": -19.96
      }
    ],
    "walls": [
      {
        "bottomHeight": 0,
        "topHeight": 0,
        "textureId": 3
      },
      {
        "bottomHeight": -1,
        "topHeight": -1,
        "textureId": 7
      },
      {
        "bottomHeight": 0,
        "topHeight": 0,
        "textureId": 1
      },
      {
        "bottomHeight": -1,
        "topHeight": -1,
        "textureId": 4
      }
    ],
    "drawCount": 0
  },
  {
    "floorHeight": 0,
    "ceilingHeight": 3,
    "floorTextureId": 6,
    "ceilingTextureId": 5,
    "brightness": 0.8,
    "vertices": [
      {
        "x": -5.52,
        "y": -19.96
      },
      {
        "x": -6.96,
        "y": -21.35
      },
      {
        "x": -5.57,
        "y": -22.79
      },
      {
        "x": -4.13,
        "y": -21.4
      }
    ],
    "walls": [
      {
        "bottomHeight": 0,
        "topHeight": 0,
        "textureId": 2
      },
      {
        "bottomHeight": -1,
        "topHeight": -1,
        "textureId": 1
      },
      {
        "bottomHeight": 0,
        "topHeight": 0,
        "textureId": 5
      },
      {
        "bottomHeight": -1,
        "topHeight": -1,
        "textureId": 8
      }
    ],
    "drawCount": 0
  },
  {
    "floorHeight": 0,
    "ceilingHeight": 3,
    "floorTextureId": 6,
    "ceilingTextureId": 8,
    "brightness": 0.8,
    "vertices": [
      {
        "x": -4.13,
        "y": -21.4
      },
      {
        "x": -5.57,
        "y": -22.79
      },
      {
        "x": -4.18,
        "y": -24.23
      },
      {
        "x": -2.74,
        "y": -22.84
      }
    ],
    "walls": [
      {
        "bottomHeight": 0,
        "topHeight": 0,
        "textureId": 1
      },
      {
        "bottomHeight": -1,
        "topHeight": -1,
        "textureId": 5
      },
      {
        "bottomHeight": 0,
        "topHeight": 0,
        "textureId": 2
      },
      {
        "bottomHeight": -1,
        "topHeight": -1,
        "textureId": 6
      }
    ],
    "drawCount": 0
  },
  {
    "floorHeight": 0,
    "ceilingHeight": 3,
    "floorTextureId": 4,
    "ceilingTextureId": 3,
    "brightness": 0.8,
    "vertices": [
      {
        "x": -2.74,
        "y": -22.84
      },
      {
        "x": -4.18,
        "y": -24.23
      },
      {
        "x": -2.79,
        "y": -25.67
      },
      {
        "x": -1.35,
        "y": -24.28
      }
    ],
    "walls": [
      {
        "bottomHeight": 0,
        "topHeight": 0,
        "textureId": 3
      },
      {
        "bottomHeight": 0,
        "topHeight": 0,
        "textureId": 3
      },
      {
        "bottomHeight": -1,
        "topHeight": -1,
        "textureId": 1
      },
      {
        "bottomHeight": -1,
        "topHeight": -1,
        "textureId": 4
      }
    ],
    "drawCount": 0
  },
  {
    "floorHeight": 0,
    "ceilingHeight": 3,
    "floorTextureId": 1,
    "ceilingTextureId": 2,
    "brightness": 0.8,
    "vertices": [
      {
        "x": -2.79,
        "y": -25.67
      },
      {
        "x": -4.18,
        "y": -24.23
      },
      {
        "x": -5.62,
        "y": -25.62
      },
      {
        "x": -4.23,
        "y": -27.06
      }
    ],
    "walls": [
      {
        "bottomHeight": 0,
        "topHeight": 0,
        "textureId": 6
      },
      {
        "bottomHeight": -1,
        "topHeight": -1,
        "textureId": 5
      },
      {
        "bottomHeight": 0,
        "topHeight": 0,
        "textureId": 1
      },
      {
        "bottomHeight": -1,
        "topHeight": -1,
        "textureId": 4
      }
    ],
    "drawCount": 0
  },
  {
    "floorHeight": 0,
    "ceilingHeight": 3,
    "floorTextureId": 6,
    "ceilingTextureId": 1,
    "brightness": 0.8,
    "vertices": [
      {
        "x": -4.23,
        "y": -27.06
      },
      {
        "x": -5.62,
        "y": -25.62
      },
      {
        "x": -7.28,
        "y": -24.51
      },
      {
        "x": -11.08,
        "y": -30.59
      }
    ],
    "walls": [
      {
        "bottomHeight": 0,
        "topHeight": 0,
        "textureId": 1
      },
      {
        "bottomHeight": -1,
        "topHeight": -1,
        "textureId": 7
      },
      {
        "bottomHeight": 0,
        "topHeight": 0,
        "textureId": 3
      },
      {
        "bottomHeight": -1,
        "topHeight": -1,
        "textureId": 6
      }
    ],
    "drawCount": 0
  }
];

// Initialize player sector (assumes player starts at origin)
playerSector = findPlayerSector(0, 0);