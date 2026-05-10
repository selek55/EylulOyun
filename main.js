const GAME_CONFIG = {
    totalQuestions: 20,
    startLives: 5,
    roadSpeedInit: 40,
    lanes: [-9, -3, 3, 9], // Widened lanes for better separation
    playerZ: 10,
    spawnZ: -150,
};

const SPEED_PRESETS = [
    { label: '🐢 Yavaş', base: 0.65 },
    { label: '🚗 Normal', base: 1.0 },
    { label: '🚀 Hızlı',  base: 1.55 },
];

let gameState = {
    isActive: false,
    score: 0,
    lives: GAME_CONFIG.startLives,
    level: 1, // 1: 2 lanes, 2: 4 lanes, 3: trucks
    currentLaneIndex: 1, // 0 to 3
    speedMultiplier: 1.0,
    speedBase: 1.0,
    speedLabel: '🚗 Normal',
    correctAnswer: null,
    correctLane: 0,
    playerName: "Oyuncu"
};

let gameObjects = []; // Stores moving objects: { mesh, type, isCorrect }
let scene, camera, renderer, clock;

const ui = {
    hud: document.getElementById('hud'),
    startScreen: document.getElementById('start-screen'),
    gameOverScreen: document.getElementById('game-over-screen'),
    winScreen: document.getElementById('win-screen'),
    questionBox: document.getElementById('question-box'),
    scoreText: document.getElementById('score'),
    livesText: document.getElementById('lives'),
    finalScoreText: document.getElementById('final-score'),
    startBtn: document.getElementById('start-btn'),
    restartBtn: document.getElementById('restart-btn'),
    winRestartBtn: document.getElementById('win-restart-btn'),
};

function initThreeJS() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 50, 200);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 15, 30);
    camera.lookAt(0, 0, -30);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.getElementById('game-container').appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(20, 50, -20);
    dirLight.castShadow = true;
    dirLight.shadow.camera.left = -50;
    dirLight.shadow.camera.right = 50;
    dirLight.shadow.camera.top = 100;
    dirLight.shadow.camera.bottom = -50;
    scene.add(dirLight);

    createEnvironment();
    createPlayer();

    window.addEventListener('resize', onWindowResize, false);
    clock = new THREE.Clock();
}

function createEnvironment() {
    const groundGeo = new THREE.PlaneGeometry(500, 500);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x55aa55 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const roadGeo = new THREE.PlaneGeometry(32, 500); // Widened road
    const roadMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.y = 0.05;
    road.receiveShadow = true;
    scene.add(road);

    spawnInitialTrees();
    updateHighScoreDisplay(); // Show initial high score
}

function spawnInitialTrees() {
    for(let i=0; i<20; i++) {
        spawnTree(Math.random() * -300);
    }
}

function spawnTree(zPos = GAME_CONFIG.spawnZ) {
    const trunkGeo = new THREE.CylinderGeometry(0.5, 0.5, 3);
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    
    const leavesGeo = new THREE.ConeGeometry(2.5, 6, 8);
    const leavesMat = new THREE.MeshLambertMaterial({ color: 0x228B22 });
    const leaves = new THREE.Mesh(leavesGeo, leavesMat);
    leaves.position.y = 4.5;

    const tree = new THREE.Group();
    tree.add(trunk);
    tree.add(leaves);
    
    // Spawn further outwards due to wider road
    const sign = Math.random() > 0.5 ? 1 : -1;
    tree.position.set((18 + Math.random() * 10) * sign, 1.5, zPos);
    
    scene.add(tree);
    gameObjects.push({ mesh: tree, type: 'tree' });
}

function buildCar(colorHex, carType = 0) {
    // carType: 0 = Standard, 1 = Truck, 2 = Sport
    const isTruck = (carType === 1);
    const isSport = (carType === 2);
    
    const group = new THREE.Group();
    
    // Chassis
    const chassisLen = isTruck ? 10 : 5;
    const chassisWidth = isSport ? 3.4 : 3;
    const chassisHeight = isSport ? 0.8 : 1;
    
    const chassisGeo = new THREE.BoxGeometry(chassisWidth, chassisHeight, chassisLen);
    const chassisMat = new THREE.MeshLambertMaterial({ color: colorHex });
    const chassis = new THREE.Mesh(chassisGeo, chassisMat);
    chassis.position.y = chassisHeight / 2; // Offset above ground level
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    chassis.name = "chassis"; // For color updates later
    chassis.userData.isSport = isSport; 
    group.add(chassis);
    
    // Cabin (Windows)
    const cabinLen = isTruck ? 3 : 2.5;
    const cabinWidth = isSport ? 2.8 : 2.8;
    const cabinHeight = isSport ? 0.8 : 1.2;
    
    const cabinGeo = new THREE.BoxGeometry(cabinWidth, cabinHeight, cabinLen);
    const cabinMat = new THREE.MeshLambertMaterial({ color: 0xeeeeee }); 
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.y = chassisHeight + (cabinHeight / 2);
    
    if (isTruck) {
        cabin.position.z = -3.5; // Front of the truck
    } else if (isSport) {
        cabin.position.z = 0; // Middle
    } else {
        cabin.position.z = 0.5; // Slightly back for normal car
    }
    cabin.castShadow = true;
    group.add(cabin);
    
    // Spoiler for sport
    if (isSport) {
        const spoilerGeo = new THREE.BoxGeometry(3.2, 0.2, 0.6);
        const spoilerMat = new THREE.MeshLambertMaterial({ color: colorHex });
        const spoiler = new THREE.Mesh(spoilerGeo, spoilerMat);
        spoiler.position.set(0, chassisHeight + 0.6, 2.2);
        spoiler.name = "spoiler";
        
        // Spoiler stands
        const standGeo = new THREE.BoxGeometry(0.2, 0.6, 0.2);
        const s1 = new THREE.Mesh(standGeo, spoilerMat); s1.position.set(-1, chassisHeight + 0.3, 2.2); s1.name = "stand";
        const s2 = new THREE.Mesh(standGeo, spoilerMat); s2.position.set(1, chassisHeight + 0.3, 2.2); s2.name = "stand";
        
        group.add(spoiler); group.add(s1); group.add(s2);
    }

    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.5, 16);
    const wheelMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    
    const wheelPositions = isTruck 
        ? [ [-1.6, 0.6, 4], [1.6, 0.6, 4], [-1.6, 0.6, -2], [1.6, 0.6, -2], [-1.6, 0.6, -4], [1.6, 0.6, -4] ] 
        : [ [-1.6, 0.6, 1.5], [1.6, 0.6, 1.5], [-1.6, 0.6, -1.5], [1.6, 0.6, -1.5] ];

    wheelPositions.forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.rotation.z = Math.PI / 2;
        
        if (isSport) {
            wheel.position.set(pos[0] * 1.1, pos[1]*0.9, pos[2]); // Wider stance, lower
            wheel.scale.set(0.9, 1.2, 0.9); // Wider tires
        } else {
            wheel.position.set(pos[0], pos[1], pos[2]);
        }
        
        wheel.castShadow = true;
        group.add(wheel);
    });

    return group;
}

function createPlayer() {
    const initialColor = document.getElementById('car-color') ? document.getElementById('car-color').value : '#ff3333';
    const initialType = document.getElementById('car-type') ? parseInt(document.getElementById('car-type').value) : 0;
    
    window.player = buildCar(initialColor, initialType);
    window.player.position.set(GAME_CONFIG.lanes[gameState.currentLaneIndex], 0, GAME_CONFIG.playerZ);
    scene.add(window.player);
}

function createTextTexture(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, 512, 256);
    
    ctx.font = 'bold 160px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.lineWidth = 15;
    ctx.strokeStyle = '#000000';
    ctx.strokeText(text, 256, 128);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(text, 256, 128);
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}

function spawnAnswerVehicle(laneIndex, text, isCorrect, zPos = GAME_CONFIG.spawnZ) {
    const isTruck = gameState.level >= 3;
    const col = isTruck ? 0x3333ff : 0xffff33;

    const group = new THREE.Group();

    // Use carType = 1 for trucks, 0 for regular cars for answer vehicles
    const carType = isTruck ? 1 : 0;
    const carModel = buildCar(col, carType);
    group.add(carModel);
    
    // Floating Text Sprite
    const textTexture = createTextTexture(text);
    const spriteMaterial = new THREE.SpriteMaterial({ map: textTexture, transparent: true });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(8, 4, 1); 
    sprite.position.set(0, 5, 0); // Float above the car/truck
    group.add(sprite);

    group.position.set(GAME_CONFIG.lanes[laneIndex], 0, zPos);
    
    scene.add(group);
    gameObjects.push({ mesh: group, type: 'answer', isCorrect: isCorrect, answered: false });
}

function spawnCloudBonus(zPos = GAME_CONFIG.spawnZ) {
    const group = new THREE.Group();
    const geo = new THREE.SphereGeometry(2, 8, 8);
    const mat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    
    // Cloud consists of a few overlapping spheres
    const s1 = new THREE.Mesh(geo, mat);
    const s2 = new THREE.Mesh(geo, mat); s2.position.set(1.5, 0, 0); s2.scale.set(0.8, 0.8, 0.8);
    const s3 = new THREE.Mesh(geo, mat); s3.position.set(-1.5, 0, 0); s3.scale.set(0.8, 0.8, 0.8);
    const s4 = new THREE.Mesh(geo, mat); s4.position.set(0, 1, 0); s4.scale.set(0.9, 0.9, 0.9);
    
    group.add(s1); group.add(s2); group.add(s3); group.add(s4);
    
    // Pick an empty lane
    let availableLanes = (gameState.level === 1) ? [1, 2] : [0, 1, 2, 3];
    let lane = availableLanes[Math.floor(Math.random() * availableLanes.length)];
    
    group.position.set(GAME_CONFIG.lanes[lane], 2, zPos);
    scene.add(group);
    
    gameObjects.push({ mesh: group, type: 'cloud', answered: false });
}

function generateQuestion() {
    let num1, num2, operation, answer, questionText;
    
    if (gameState.level === 1) {
        // Simple add/sub
        const ops = ['+', '-'];
        operation = ops[Math.floor(Math.random() * ops.length)];
        if (operation === '+') {
            num1 = Math.floor(Math.sortedRandom() * 40) + 10;
            num2 = Math.floor(Math.random() * 40) + 10;
            answer = num1 + num2;
        } else {
            num1 = Math.floor(Math.random() * 50) + 20;
            num2 = Math.floor(Math.random() * (num1 - 10)) + 5;
            answer = num1 - num2;
        }
    } else if (gameState.level === 2) {
        // Multi/Add
        const ops = ['+', '*', '-'];
        operation = ops[Math.floor(Math.random() * ops.length)];
        if (operation === '*') {
            num1 = Math.floor(Math.random() * 9) + 2;
            num2 = Math.floor(Math.random() * 9) + 2;
            answer = num1 * num2;
        } else if (operation === '+') {
            num1 = Math.floor(Math.random() * 100) + 20;
            num2 = Math.floor(Math.random() * 100) + 20;
            answer = num1 + num2;
        } else {
            num1 = Math.floor(Math.random() * 100) + 50;
            num2 = Math.floor(Math.random() * (num1 - 10)) + 10;
            answer = num1 - num2;
        }
    } else {
        // Trucks level: Division and larger mult
        const ops = ['/', '*'];
        operation = ops[Math.floor(Math.random() * ops.length)];
        if (operation === '/') {
            num2 = Math.floor(Math.random() * 8) + 2;
            answer = Math.floor(Math.random() * 30) + 5;
            num1 = num2 * answer;
        } else {
            num1 = Math.floor(Math.random() * 15) + 5;
            num2 = Math.floor(Math.random() * 9) + 2;
            answer = num1 * num2;
        }
    }

    questionText = `${num1} ${operation} ${num2} = ?`;
    ui.questionBox.innerText = questionText;
    gameState.correctAnswer = answer;

    // Determine available lanes based on level
    let availableLanes = (gameState.level === 1) ? [1, 2] : [0, 1, 2, 3];
    gameState.correctLane = availableLanes[Math.floor(Math.random() * availableLanes.length)];

    // Generate distractors
    let distractors = new Set();
    while (distractors.size < availableLanes.length - 1) {
        let diff = Math.floor(Math.random() * 10) + 1;
        let sign = Math.random() > 0.5 ? 1 : -1;
        let dist = answer + (diff * sign);
        if (dist > 0 && dist !== answer) {
            distractors.add(dist);
        }
    }
    let distractorArray = Array.from(distractors);

    // Spawn vehicles
    availableLanes.forEach(lane => {
        if (lane === gameState.correctLane) {
            spawnAnswerVehicle(lane, answer.toString(), true);
        } else {
            let fakeAns = distractorArray.pop();
            spawnAnswerVehicle(lane, fakeAns.toString(), false);
        }
    });

    // Also spawn some trees
    spawnTree();
    spawnTree();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function updateGameLogic(delta) {
    // Player lateral movement
    const targetX = GAME_CONFIG.lanes[gameState.currentLaneIndex];
    window.player.position.x += (targetX - window.player.position.x) * 10 * delta;

    // Check collisions and move objects
    let speed = GAME_CONFIG.roadSpeedInit * gameState.speedBase * gameState.speedMultiplier;
    
    for (let i = gameObjects.length - 1; i >= 0; i--) {
        let obj = gameObjects[i];
        obj.mesh.position.z += speed * delta;

        // Collision detection for answers
        if (obj.type === 'answer' && !obj.answered) {
            // Check bounding box roughly
            if (Math.abs(obj.mesh.position.z - window.player.position.z) < 5 &&
                Math.abs(obj.mesh.position.x - window.player.position.x) < 2) {
                
                obj.answered = true;
                handleCollision(obj);
            }
        }

        // Collision detection for cloud bonus
        if (obj.type === 'cloud' && !obj.answered) {
            if (Math.abs(obj.mesh.position.z - window.player.position.z) < 5 &&
                Math.abs(obj.mesh.position.x - window.player.position.x) < 2) {
                
                obj.answered = true;
                gameState.lives = Math.min(5, gameState.lives + 1);
                updateHUD();
                
                // Visual feedback for cloud (making score text flash green)
                ui.scoreText.parentElement.style.color = "#4CAF50";
                setTimeout(() => ui.scoreText.parentElement.style.color = "white", 500);
                
                scene.remove(obj.mesh);
                gameObjects.splice(i, 1);
                continue; // Move to next object
            }
        }

        // Remove if passed camera
        if (obj.mesh.position.z > camera.position.z + 10) {
            scene.remove(obj.mesh);
            gameObjects.splice(i, 1);
        }
    }

    // Spawn trees constantly
    if (Math.random() < 5 * delta) {
        spawnTree();
    }
    
    // Spawn Cloud Bonus rarely
    if (gameState.lives < 5 && Math.random() < 0.2 * delta) {
        const existingClouds = gameObjects.filter(o => o.type === 'cloud');
        // also check if distance to questions is large enough to not overlap
        const answers = gameObjects.filter(o => o.type === 'answer');
        if (existingClouds.length === 0 && (answers.length === 0 || answers[0].mesh.position.z > -100)) {
            spawnCloudBonus();
        }
    }

    // Spawn next question if last vehicles are close to player
    // Or if there are no answer vehicles
    const answers = gameObjects.filter(o => o.type === 'answer');
    if (answers.length === 0) {
        generateQuestion();
    }
}

function handleCollision(obj) {
    if (obj.isCorrect) {
        gameState.score++;

        // Level up logic
        if (gameState.score >= 5) gameState.level = 2; // 4 lanes
        if (gameState.score >= 12) gameState.level = 3; // Trucks

        // Flash green
        ui.questionBox.style.borderColor = "#4CAF50";
        setTimeout(() => ui.questionBox.style.borderColor = "#FFC107", 500);

        if (gameState.score >= GAME_CONFIG.totalQuestions) {
            triggerWin();
        }

    } else {
        gameState.lives--;
        // Flash red
        ui.questionBox.style.borderColor = "#f44336";
        setTimeout(() => ui.questionBox.style.borderColor = "#FFC107", 500);

        if (gameState.lives <= 0) {
            triggerGameOver();
        }
    }
    updateHUD();

    // Remove all current answer objects so new ones spawn
    gameObjects.forEach(o => {
        if (o.type === 'answer') {
            scene.remove(o.mesh);
        }
    });
    gameObjects = gameObjects.filter(o => o.type !== 'answer');
}

function saveHighScore() {
    let leaderboard = [];
    try {
        leaderboard = JSON.parse(localStorage.getItem('mathGameLeaderboard')) || [];
    } catch(e) { /* ignore parse errors */ }
    
    // Only add if score > 0 conceptually, but let's add all attempts
    if (gameState.score > 0) {
        leaderboard.push({ name: gameState.playerName, score: gameState.score, speed: gameState.speedLabel });
    }
    
    // Sort descending by score
    leaderboard.sort((a, b) => b.score - a.score);
    // Keep top 5
    leaderboard = leaderboard.slice(0, 5);
    
    localStorage.setItem('mathGameLeaderboard', JSON.stringify(leaderboard));
    updateHighScoreDisplay();
}

function updateHighScoreDisplay() {
    let leaderboard = [];
    try {
        leaderboard = JSON.parse(localStorage.getItem('mathGameLeaderboard')) || [];
    } catch(e) {}
    
    const targetUl = document.getElementById('leaderboard-list');
    if (!targetUl) return;
    
    if (leaderboard.length === 0) {
        targetUl.innerHTML = "<li>Henüz skor yok</li>";
        return;
    }
    
    targetUl.innerHTML = "";
    leaderboard.forEach((entry, idx) => {
        const li = document.createElement('li');
        let medal = "";
        if (idx === 0) medal = "🥇 ";
        else if (idx === 1) medal = "🥈 ";
        else if (idx === 2) medal = "🥉 ";
        
        const speedTag = entry.speed ? ` (${entry.speed})` : '';
        li.innerText = `${medal}${entry.name} - ${entry.score} Puan${speedTag}`;
        targetUl.appendChild(li);
    });
}

function triggerWin() {
    gameState.isActive = false;
    saveHighScore();
    ui.hud.classList.add('hidden');
    ui.winScreen.classList.remove('hidden');
}

function triggerGameOver() {
    gameState.isActive = false;
    saveHighScore();
    ui.hud.classList.add('hidden');
    ui.finalScoreText.innerText = gameState.score;
    ui.gameOverScreen.classList.remove('hidden');
}

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    if (gameState.isActive) {
        updateGameLogic(delta);
    }
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

// Math.random sorted trick polyfill
Math.sortedRandom = function() {
    return Math.random();
};

ui.startBtn.addEventListener('click', startGame);
ui.restartBtn.addEventListener('click', startGame);
ui.winRestartBtn.addEventListener('click', startGame);

const menuBtn1 = document.getElementById('menu-btn1');
const menuBtn2 = document.getElementById('menu-btn2');
if (menuBtn1) menuBtn1.addEventListener('click', returnToMenu);
if (menuBtn2) menuBtn2.addEventListener('click', returnToMenu);

function returnToMenu() {
    ui.gameOverScreen.classList.add('hidden');
    ui.winScreen.classList.add('hidden');
    ui.hud.classList.add('hidden');
    ui.startScreen.classList.remove('hidden');
    
    gameObjects.forEach(o => scene.remove(o.mesh));
    gameObjects = [];
    spawnInitialTrees();
    
    if (window.player) {
        scene.remove(window.player);
        window.player = null;
    }
}

window.addEventListener('keydown', (e) => {
    if (!gameState.isActive) return;
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        movePlayerLeft();
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        movePlayerRight();
    }
});

function movePlayerLeft() {
    if (!gameState.isActive) return;
    let minLane = (gameState.level === 1) ? 1 : 0;
    if (gameState.currentLaneIndex > minLane) gameState.currentLaneIndex--;
}

function movePlayerRight() {
    if (!gameState.isActive) return;
    let maxLane = (gameState.level === 1) ? 2 : 3;
    if (gameState.currentLaneIndex < maxLane) gameState.currentLaneIndex++;
}

// Mobile touch buttons
const btnLeft = document.getElementById('btn-left');
const btnRight = document.getElementById('btn-right');
if (btnLeft) {
    btnLeft.addEventListener('touchstart', (e) => { e.preventDefault(); movePlayerLeft(); }, { passive: false });
    btnLeft.addEventListener('mousedown', movePlayerLeft);
}
if (btnRight) {
    btnRight.addEventListener('touchstart', (e) => { e.preventDefault(); movePlayerRight(); }, { passive: false });
    btnRight.addEventListener('mousedown', movePlayerRight);
}

// Swipe support
let touchStartX = 0;
window.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
window.addEventListener('touchend', (e) => {
    if (!gameState.isActive) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) {
        if (dx < 0) movePlayerLeft();
        else movePlayerRight();
    }
}, { passive: true });

function startGame() {
    // Clear old objects
    gameObjects.forEach(o => scene.remove(o.mesh));
    gameObjects = [];
    spawnInitialTrees(); // Respawn trees

    // Determine initial selected options
    const selectedLevel = document.getElementById('start-level') ? parseInt(document.getElementById('start-level').value) : 1;
    const selectedColor = document.getElementById('car-color') ? document.getElementById('car-color').value : '#ff3333';
    const selectedType = document.getElementById('car-type') ? parseInt(document.getElementById('car-type').value) : 0;
    const selectedSpeedIdx = document.getElementById('speed-setting') ? parseInt(document.getElementById('speed-setting').value) : 1;
    const preset = SPEED_PRESETS[selectedSpeedIdx] || SPEED_PRESETS[1];

    gameState.playerName = document.getElementById('player-name') ? document.getElementById('player-name').value || "Oyuncu" : "Oyuncu";
    gameState.score = 0;
    gameState.lives = GAME_CONFIG.startLives;
    gameState.level = selectedLevel;
    gameState.speedBase = preset.base;
    gameState.speedLabel = preset.label;

    // Depending on chosen level, start on proper lane
    gameState.currentLaneIndex = (gameState.level === 1) ? 1 : 2;
    gameState.speedMultiplier = 1.0 + ((gameState.level - 1) * 0.2);
    
    gameState.isActive = true;
    
    // Rebuild player car completely to adopt new type
    if (window.player) scene.remove(window.player);
    window.player = buildCar(selectedColor, selectedType);
    window.player.position.set(GAME_CONFIG.lanes[gameState.currentLaneIndex], 0, GAME_CONFIG.playerZ);
    scene.add(window.player);

    updateHUD();
    ui.startScreen.classList.add('hidden');
    ui.gameOverScreen.classList.add('hidden');
    ui.winScreen.classList.add('hidden');
    ui.hud.classList.remove('hidden');
}

function updateHUD() {
    ui.scoreText.innerText = gameState.score;
    let hearts = '';
    for(let i=0; i<gameState.lives; i++) hearts += '❤️';
    ui.livesText.innerText = hearts;
}

initThreeJS();
animate();
