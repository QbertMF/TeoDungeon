# Project initiation
expo init TeoDungeon
using a blank typescript template

additional packages:
npx expo install react-dom react-native-web
npm i three expo-gl expo-three
npm i expo-three-orbit-controls

# Run project
npm start # you can open iOS, Android, or web from here, or run them directly with the commands below.
- npm run android
- npm run ios # requires an iOS device or macOS for access to an iOS simulator
- npm run web

# Architecture
## Files and Code Summary
### TeoDungeon/types/LevelStructure.ts
Defines core interfaces - Vector2D, Wall, LevelSector with drawCount property, and Level structure

### TeoDungeon/LevelData.ts
Main game logic with collision detection, sector management, wall adjustments, and player tracking. Contains addSector(), deleteSector(), snapToGrid() functions

### TeoDungeon/App.tsx
Main application with render loop, keyboard controls, camera management, FPS counter, and sector count display

### TeoDungeon/MapRenderer.ts
2D map overlay with vertex dragging, coordinate display, zoom/resize functionality, and constrained movement

### TeoDungeon/LevelRenderer.ts
3D rendering system with proper wall/portal rendering based on height differences

### TeoDungeon/HelpOverlay.ts
Help system documenting all keyboard controls and features

# ToDo
## Z fighting 
because we draw double sided walls on same location for adjacent sectors.
Signle sided polygons would be better.

## Wall data
feature: use textures for walls and floor ad ceiling
feature: drawing ceiling to be disabled such that the sky is visible. 

## character movement
Fixed Issue: sometimes player sticks with the back to a wall.
-> Fixed by adding smapp buffer. A slight jitter is visible when sliding along walls. A smaller buffer value did not work. 

## Map editor
Feature: enable wall movement
feature: vertex coordinates should snap to existing vertex coordinates
issue: vertex coordinates only nees one decimal point for sanpping

## switch map modes
use a mode to display walls and portals only


