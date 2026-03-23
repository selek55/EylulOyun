# 3D Math Game Implementation Plan

## Goal Description
Create an engaging, web-based 3D math educational game for a 10-year-old (5th grade). The game features a car driving down a moving road with trees passing by. Math questions appear on the screen, and the player must steer their vehicle into the correct "answer car" or "answer truck" that match the solution. 

## Proposed Changes

### Configuration
We will use plain HTML, CSS, and vanilla JavaScript, pulling in [Three.js](https://threejs.org/) via CDN. This setup guarantees easy testing in the browser without complex build steps. 

#### [NEW] index.html
- The main entry point.
- Imports `three.js` via a CDN script tag.
- Contains the UI elements (Current Question, Lives: ❤️❤️❤️❤️❤️, Score: x/20, Game Over screen, Win screen).

#### [NEW] style.css
- Customizes the UI: Big, bold, kid-friendly fonts (e.g., Fredoka One or similar via Google Fonts).
- Clean, modern, vibrant colored UI overlays that don't obscure the 3D action.
- Uses absolute positioning to render UI on top of the Three.js `<canvas>`.

#### [NEW] main.js
This file will contain all game logic and 3D rendering:
- **Scene Setup**: Basic Three.js setup with a perspective camera looking slightly down at the player's vehicle, facing down the road.
- **Environment**: 
  - A scrolling road texture or alternating color planes to simulate moving forward.
  - Trees (made of simple geometric shapes) spawning on the edges of the road and moving towards the camera.
- **Math Generation**: `generateQuestion(level)` function.
  - Contains logic for operations: `+`, `-`, `*`, `/` appropriate for 10-year-olds.
  - Distractor answers will be close to the correct answer to make it challenging.
- **Vehicles & Entities**:
  - **Player Car**: A simple 3D model made of combined BoxGeometries.
  - **Answer Cars/Trucks**: Spawn in the distance and move towards the player. Levels determine if there are 2 or 4 lanes. Textures will be dynamically generated `CanvasTexture`s to display numbers on the vehicles.
  - **Clouds (Life Bonuses)**: Spawn occasionally in side lanes, shaped like clouds, giving +1 life upon collision.
- **Game Logic/Loop**:
  - Update positions of trees, answer cars, and clouds.
  - Check bounding boxes for collisions with the player.
  - Handle score progression, life deduction, and reaching 20 required correct answers.
- **Controls**: Smoothly transition the player car left and right between lanes using `ArrowLeft` / `ArrowRight` or `A` / `D` keys.

## Verification Plan

### Automated Tests
- No automated unit tests planned; verification will be largely visual and interaction-based.

### Manual Verification
1. Open `index.html` in a modern browser.
2. Verify that the 3D scene renders and performance is smooth.
3. Validate that questions generate correctly for a 5th-grade level.
4. Drive the car into the correct answer and verify the score increments and a new question appears.
5. Drive the car into a wrong answer and verify life count decreases.
6. Verify level progression occurs seamlessly (more lanes, trucks appearing).
7. Collect a cloud bonus and verify life is incremented.
