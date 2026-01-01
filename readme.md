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

# ToDo
## Z fighting 
because we draw double sided walls on same location for adjacent sectors.
Signle sided polygons would be better.

## Wall data

## character movement

## Map editor
enable wall movement

## switch map modes
use a mode to display walls and portals only


