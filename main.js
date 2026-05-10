const GAME_CONFIG = {
    totalQuestions: 20,
    startLives: 5,
    roadSpeedInit: 40,
    lanes: [-9, -3, 3, 9],
    playerZ: 10,
    spawnZ: -150,
};

const SPEED_PRESETS = [
    { label: '🐢 Yavaş', base: 0.65 },
    { label: '🚗 Normal', base: 1.0 },
    { label: '🚀 Hızlı',  base: 1.55 },
];

const TOPIC_LABELS = { add: '➕', sub: '➖', mul: '✖️', div: '➗', mixed: '🔀' };

let gameState = {
    isActive: false,
    score: 0,
    lives: GAME_CONFIG.startLives,
    level: 1,
    currentLaneIndex: 1,
    speedMultiplier: 1.0,
    speedBase: 1.0,
    speedLabel: '🚗 Normal',
    topic: 'mixed',
    streak: 0,
    wrongCount: 0,
    startTime: null,
    correctAnswer: null,
    correctLane: 0,
    playerName: 'Oyuncu',
};

let gameObjects = [];
let scene, camera, renderer, clock;
let isNightMode = false;
let audioCtx = null;
let sceneAmbient, sceneDirLight;

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

// ── Sound ────────────────────────────────────────────────────────────────────

function getAudioCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
}

function playSound(type) {
    try {
        const ctx = getAudioCtx();
        if (type === 'correct') {
            [{ f: 523, t: 0 }, { f: 659, t: 0.12 }].forEach(({ f, t }) => {
                const o = ctx.createOscillator(), g = ctx.createGain();
                o.connect(g); g.connect(ctx.destination);
                o.frequency.value = f;
                g.gain.setValueAtTime(0.25, ctx.currentTime + t);
                g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.2);
                o.start(ctx.currentTime + t);
                o.stop(ctx.currentTime + t + 0.22);
            });
        } else if (type === 'streak') {
            [523, 659, 784, 1047].forEach((f, i) => {
                const o = ctx.createOscillator(), g = ctx.createGain();
                o.connect(g); g.connect(ctx.destination);
                o.frequency.value = f;
                const t = i * 0.09;
                g.gain.setValueAtTime(0.2, ctx.currentTime + t);
                g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.18);
                o.start(ctx.currentTime + t);
                o.stop(ctx.currentTime + t + 0.2);
            });
        } else if (type === 'wrong') {
            const o = ctx.createOscillator(), g = ctx.createGain();
            o.type = 'sawtooth';
            o.connect(g); g.connect(ctx.destination);
            o.frequency.setValueAtTime(220, ctx.currentTime);
            o.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);
            g.gain.setValueAtTime(0.3, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
            o.start(); o.stop(ctx.currentTime + 0.32);
        } else if (type === 'obstacle') {
            const o = ctx.createOscillator(), g = ctx.createGain();
            o.type = 'square';
            o.connect(g); g.connect(ctx.destination);
            o.frequency.value = 80;
            g.gain.setValueAtTime(0.4, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
            o.start(); o.stop(ctx.currentTime + 0.27);
        } else if (type === 'cloud') {
            const o = ctx.createOscillator(), g = ctx.createGain();
            o.frequency.value = 880;
            o.connect(g); g.connect(ctx.destination);
            g.gain.setValueAtTime(0.2, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
            o.start(); o.stop(ctx.currentTime + 0.22);
        }
    } catch (e) {}
}

// ── Night mode ───────────────────────────────────────────────────────────────

function toggleNightMode() {
    isNightMode = !isNightMode;
    document.body.classList.toggle('night-mode', isNightMode);
    document.getElementById('night-btn').textContent = isNightMode ? '☀️' : '🌙';
    if (scene) {
        const skyColor = isNightMode ? 0x0d1117 : 0x87CEEB;
        scene.background = new THREE.Color(skyColor);
        scene.fog = new THREE.Fog(skyColor, 50, 200);
    }
    if (sceneAmbient)  sceneAmbient.intensity  = isNightMode ? 0.25 : 0.6;
    if (sceneDirLight) sceneDirLight.intensity  = isNightMode ? 0.3  : 0.8;
    applyHeadlightState();
}

document.getElementById('night-btn').addEventListener('click', toggleNightMode);

// ── Three.js init ────────────────────────────────────────────────────────────

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

    sceneAmbient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(sceneAmbient);

    sceneDirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    sceneDirLight.position.set(20, 50, -20);
    sceneDirLight.castShadow = true;
    sceneDirLight.shadow.camera.left = -50;
    sceneDirLight.shadow.camera.right = 50;
    sceneDirLight.shadow.camera.top = 100;
    sceneDirLight.shadow.camera.bottom = -50;
    scene.add(sceneDirLight);

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

    const roadGeo = new THREE.PlaneGeometry(32, 500);
    const roadMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.y = 0.05;
    road.receiveShadow = true;
    scene.add(road);

    spawnInitialTrees();
    updateHighScoreDisplay();
}

function spawnInitialTrees() {
    for (let i = 0; i < 20; i++) spawnTree(Math.random() * -300);
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

    const sign = Math.random() > 0.5 ? 1 : -1;
    tree.position.set((18 + Math.random() * 10) * sign, 1.5, zPos);

    scene.add(tree);
    gameObjects.push({ mesh: tree, type: 'tree' });
}

// ── Car builder ──────────────────────────────────────────────────────────────

function buildCar(colorHex, carType = 0) {
    const isTruck = (carType === 1);
    const isSport = (carType === 2);
    const group = new THREE.Group();

    const chassisLen = isTruck ? 10 : 5;
    const chassisWidth = isSport ? 3.4 : 3;
    const chassisHeight = isSport ? 0.8 : 1;

    const chassisGeo = new THREE.BoxGeometry(chassisWidth, chassisHeight, chassisLen);
    const chassisMat = new THREE.MeshLambertMaterial({ color: colorHex });
    const chassis = new THREE.Mesh(chassisGeo, chassisMat);
    chassis.position.y = chassisHeight / 2;
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    chassis.name = 'chassis';
    group.add(chassis);

    const cabinLen = isTruck ? 3 : 2.5;
    const cabinHeight = isSport ? 0.8 : 1.2;
    const cabinGeo = new THREE.BoxGeometry(2.8, cabinHeight, cabinLen);
    const cabinMat = new THREE.MeshLambertMaterial({ color: 0xeeeeee });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.y = chassisHeight + cabinHeight / 2;
    cabin.position.z = isTruck ? -3.5 : isSport ? 0 : 0.5;
    cabin.castShadow = true;
    group.add(cabin);

    if (isSport) {
        const spoilerMat = new THREE.MeshLambertMaterial({ color: colorHex });
        const spoiler = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.2, 0.6), spoilerMat);
        spoiler.position.set(0, chassisHeight + 0.6, 2.2);
        const standGeo = new THREE.BoxGeometry(0.2, 0.6, 0.2);
        const s1 = new THREE.Mesh(standGeo, spoilerMat); s1.position.set(-1, chassisHeight + 0.3, 2.2);
        const s2 = new THREE.Mesh(standGeo, spoilerMat); s2.position.set( 1, chassisHeight + 0.3, 2.2);
        group.add(spoiler, s1, s2);
    }

    const wheelGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.5, 16);
    const wheelMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    const wheelPositions = isTruck
        ? [[-1.6,0.6,4],[1.6,0.6,4],[-1.6,0.6,-2],[1.6,0.6,-2],[-1.6,0.6,-4],[1.6,0.6,-4]]
        : [[-1.6,0.6,1.5],[1.6,0.6,1.5],[-1.6,0.6,-1.5],[1.6,0.6,-1.5]];

    wheelPositions.forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(
            isSport ? pos[0] * 1.1 : pos[0],
            isSport ? pos[1] * 0.9 : pos[1],
            pos[2]
        );
        if (isSport) wheel.scale.set(0.9, 1.2, 0.9);
        wheel.castShadow = true;
        group.add(wheel);
    });

    return group;
}

function createPlayer() {
    const col = document.getElementById('car-color') ? document.getElementById('car-color').value : '#ff3333';
    const type = document.getElementById('car-type') ? parseInt(document.getElementById('car-type').value) : 0;
    window.player = buildCar(col, type);
    window.player.position.set(GAME_CONFIG.lanes[gameState.currentLaneIndex], 0, GAME_CONFIG.playerZ);
    addHeadlightsToPlayer();
    scene.add(window.player);
}

function addHeadlightsToPlayer() {
    if (!window.player) return;
    const hlGeo = new THREE.SphereGeometry(0.28, 8, 8);

    [-1.1, 1.1].forEach(side => {
        // Parlak küre (far lambası)
        const mat = new THREE.MeshLambertMaterial({ color: 0xffffaa, emissive: 0xffff88, emissiveIntensity: 0 });
        const mesh = new THREE.Mesh(hlGeo, mat);
        mesh.position.set(side, 1.0, -2.6);
        mesh.name = 'headlight-mesh';
        window.player.add(mesh);

        // Görünür ışık huzmesi (koni)
        const beamGeo = new THREE.CylinderGeometry(5, 0.1, 20, 10, 1, true);
        const beamMat = new THREE.MeshBasicMaterial({
            color: 0xffffdd,
            transparent: true,
            opacity: 0,
            side: THREE.BackSide,
            depthWrite: false,
        });
        const beam = new THREE.Mesh(beamGeo, beamMat);
        beam.rotation.x = Math.PI / 2;
        beam.position.set(side, 0.8, -12);
        beam.name = 'headlight-beam';
        window.player.add(beam);

        // SpotLight (yere yönlendirilmiş)
        const spot = new THREE.SpotLight(0xffffcc, 0, 70, Math.PI * 0.16, 0.3);
        spot.position.set(side, 1.5, -2.8);
        spot.name = 'headlight';
        window.player.add(spot);

        // SpotLight hedefi (arabayla birlikte hareket eder)
        const target = new THREE.Object3D();
        target.position.set(side * 0.5, -2, -30);
        target.name = 'headlight-target';
        window.player.add(target);
        spot.target = target;
        scene.add(target); // Three.js hedefin scene'de olmasını gerektirir
    });

    applyHeadlightState();
}

function applyHeadlightState() {
    if (!window.player) return;
    const on = isNightMode;
    window.player.children.forEach(c => {
        if (c.name === 'headlight')      c.intensity = on ? 12 : 0;
        if (c.name === 'headlight-mesh') c.material.emissiveIntensity = on ? 1 : 0;
        if (c.name === 'headlight-beam') c.material.opacity = on ? 0.2 : 0;
    });
}

// ── Text texture ─────────────────────────────────────────────────────────────

function createTextTexture(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 256;
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
    return new THREE.CanvasTexture(canvas);
}

// ── Spawn functions ──────────────────────────────────────────────────────────

function spawnAnswerVehicle(laneIndex, text, isCorrect, zPos = GAME_CONFIG.spawnZ) {
    const isTruck = gameState.level >= 3;
    const col = isTruck ? 0x3333ff : 0xffff33;
    const group = new THREE.Group();
    group.add(buildCar(col, isTruck ? 1 : 0));

    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: createTextTexture(text), transparent: true }));
    sprite.scale.set(8, 4, 1);
    sprite.position.set(0, 5, 0);
    group.add(sprite);

    group.position.set(GAME_CONFIG.lanes[laneIndex], 0, zPos);
    scene.add(group);
    gameObjects.push({ mesh: group, type: 'answer', isCorrect, answered: false });
}

function spawnObstacle(zPos = GAME_CONFIG.spawnZ) {
    const availableLanes = (gameState.level === 1) ? [1, 2] : [0, 1, 2, 3];
    const nonCorrectLanes = availableLanes.filter(l => l !== gameState.correctLane);
    const lane = nonCorrectLanes[Math.floor(Math.random() * nonCorrectLanes.length)];

    const group = new THREE.Group();
    group.add(buildCar(0x880000, 0));

    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: createTextTexture('✖'), transparent: true }));
    sprite.scale.set(4, 2, 1);
    sprite.position.set(0, 4.5, 0);
    group.add(sprite);

    group.position.set(GAME_CONFIG.lanes[lane], 0, zPos);
    scene.add(group);
    gameObjects.push({ mesh: group, type: 'obstacle', answered: false });
}

function spawnCloudBonus(zPos = GAME_CONFIG.spawnZ) {
    const group = new THREE.Group();
    const geo = new THREE.SphereGeometry(2, 8, 8);
    const mat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    const s1 = new THREE.Mesh(geo, mat);
    const s2 = new THREE.Mesh(geo, mat); s2.position.set( 1.5, 0, 0); s2.scale.setScalar(0.8);
    const s3 = new THREE.Mesh(geo, mat); s3.position.set(-1.5, 0, 0); s3.scale.setScalar(0.8);
    const s4 = new THREE.Mesh(geo, mat); s4.position.set(0, 1, 0);    s4.scale.setScalar(0.9);
    group.add(s1, s2, s3, s4);

    const availableLanes = (gameState.level === 1) ? [1, 2] : [0, 1, 2, 3];
    const lane = availableLanes[Math.floor(Math.random() * availableLanes.length)];
    group.position.set(GAME_CONFIG.lanes[lane], 2, zPos);
    scene.add(group);
    gameObjects.push({ mesh: group, type: 'cloud', answered: false });
}

// ── Question generation ──────────────────────────────────────────────────────

function generateQuestion() {
    let num1, num2, operation, answer;
    const topic = gameState.topic;

    if (topic === 'add')      operation = '+';
    else if (topic === 'sub') operation = '-';
    else if (topic === 'mul') operation = '*';
    else if (topic === 'div') operation = '/';
    else {
        if (gameState.level === 1)      operation = ['+','-'][Math.floor(Math.random()*2)];
        else if (gameState.level === 2) operation = ['+','*','-'][Math.floor(Math.random()*3)];
        else                            operation = ['/','*'][Math.floor(Math.random()*2)];
    }

    if (operation === '+') {
        num1 = Math.floor(Math.random() * (gameState.level === 1 ? 40 : 100)) + (gameState.level === 1 ? 10 : 20);
        num2 = Math.floor(Math.random() * (gameState.level === 1 ? 40 : 100)) + (gameState.level === 1 ? 10 : 20);
        answer = num1 + num2;
    } else if (operation === '-') {
        num1 = Math.floor(Math.random() * (gameState.level === 1 ? 50 : 100)) + (gameState.level === 1 ? 20 : 50);
        num2 = Math.floor(Math.random() * (num1 - 10)) + (gameState.level === 1 ? 5 : 10);
        answer = num1 - num2;
    } else if (operation === '*') {
        num1 = Math.floor(Math.random() * (gameState.level <= 2 ? 9 : 15)) + (gameState.level <= 2 ? 2 : 5);
        num2 = Math.floor(Math.random() * 9) + 2;
        answer = num1 * num2;
    } else {
        num2 = Math.floor(Math.random() * 8) + 2;
        answer = Math.floor(Math.random() * 30) + 5;
        num1 = num2 * answer;
    }

    const displayOp = operation === '*' ? '×' : operation === '/' ? '÷' : operation;
    ui.questionBox.innerText = `${num1} ${displayOp} ${num2} = ?`;
    gameState.correctAnswer = answer;

    const availableLanes = (gameState.level === 1) ? [1, 2] : [0, 1, 2, 3];
    gameState.correctLane = availableLanes[Math.floor(Math.random() * availableLanes.length)];

    const distractors = new Set();
    while (distractors.size < availableLanes.length - 1) {
        const diff = Math.floor(Math.random() * 10) + 1;
        const dist = answer + diff * (Math.random() > 0.5 ? 1 : -1);
        if (dist > 0 && dist !== answer) distractors.add(dist);
    }
    const distractorArray = Array.from(distractors);

    availableLanes.forEach(lane => {
        if (lane === gameState.correctLane) spawnAnswerVehicle(lane, answer.toString(), true);
        else spawnAnswerVehicle(lane, distractorArray.pop().toString(), false);
    });

    spawnTree(); spawnTree();
}

// ── Window resize ────────────────────────────────────────────────────────────

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ── Game loop ────────────────────────────────────────────────────────────────

function updateGameLogic(delta) {
    const targetX = GAME_CONFIG.lanes[gameState.currentLaneIndex];
    window.player.position.x += (targetX - window.player.position.x) * 10 * delta;

    const speed = GAME_CONFIG.roadSpeedInit * gameState.speedBase * gameState.speedMultiplier;

    for (let i = gameObjects.length - 1; i >= 0; i--) {
        const obj = gameObjects[i];
        obj.mesh.position.z += speed * delta;

        if (obj.type === 'answer' && !obj.answered) {
            if (Math.abs(obj.mesh.position.z - window.player.position.z) < 5 &&
                Math.abs(obj.mesh.position.x - window.player.position.x) < 2) {
                obj.answered = true;
                handleCollision(obj);
            }
        }

        if (obj.type === 'obstacle' && !obj.answered) {
            if (Math.abs(obj.mesh.position.z - window.player.position.z) < 5 &&
                Math.abs(obj.mesh.position.x - window.player.position.x) < 2) {
                obj.answered = true;
                gameState.lives--;
                gameState.streak = 0;
                gameState.wrongCount++;
                updateStreakDisplay();
                playSound('obstacle');
                ui.questionBox.style.borderColor = '#f44336';
                setTimeout(() => ui.questionBox.style.borderColor = '#FFC107', 500);
                updateHUD();
                scene.remove(obj.mesh);
                gameObjects.splice(i, 1);
                if (gameState.lives <= 0) triggerGameOver();
                continue;
            }
        }

        if (obj.type === 'cloud' && !obj.answered) {
            if (Math.abs(obj.mesh.position.z - window.player.position.z) < 5 &&
                Math.abs(obj.mesh.position.x - window.player.position.x) < 2) {
                obj.answered = true;
                gameState.lives = Math.min(5, gameState.lives + 1);
                playSound('cloud');
                updateHUD();
                ui.scoreText.parentElement.style.color = '#4CAF50';
                setTimeout(() => ui.scoreText.parentElement.style.color = 'white', 500);
                scene.remove(obj.mesh);
                gameObjects.splice(i, 1);
                continue;
            }
        }

        if (obj.mesh.position.z > camera.position.z + 10) {
            scene.remove(obj.mesh);
            gameObjects.splice(i, 1);
        }
    }

    if (Math.random() < 5 * delta) spawnTree();

    if (gameState.lives < 5 && Math.random() < 0.2 * delta) {
        const answers = gameObjects.filter(o => o.type === 'answer');
        // Spawn cloud only during an active answer wave (not between waves),
        // when answers are close to player. Use z=-70 so cloud stays well
        // ahead of the next answer batch (which spawns at z=-150).
        if (!gameObjects.some(o => o.type === 'cloud') &&
            answers.length > 0 && answers.every(a => a.mesh.position.z > -25)) {
            spawnCloudBonus(-70);
        }
    }

    if (!gameObjects.some(o => o.type === 'answer')) {
        generateQuestion();
    }
}

// ── Collision handling ───────────────────────────────────────────────────────

function handleCollision(obj) {
    if (obj.isCorrect) {
        gameState.score++;
        gameState.streak++;

        playSound(gameState.streak >= 3 ? 'streak' : 'correct');
        updateStreakDisplay();

        if (gameState.score >= 5)  gameState.level = 2;
        if (gameState.score >= 12) gameState.level = 3;

        ui.questionBox.style.borderColor = '#4CAF50';
        setTimeout(() => ui.questionBox.style.borderColor = '#FFC107', 500);

        if (gameState.score >= GAME_CONFIG.totalQuestions) { triggerWin(); return; }
    } else {
        gameState.lives--;
        gameState.streak = 0;
        gameState.wrongCount++;

        playSound('wrong');
        updateStreakDisplay();

        ui.questionBox.style.borderColor = '#f44336';
        setTimeout(() => ui.questionBox.style.borderColor = '#FFC107', 500);

        if (gameState.lives <= 0) { triggerGameOver(); return; }
    }

    updateHUD();
    gameObjects.forEach(o => { if (o.type === 'answer') scene.remove(o.mesh); });
    gameObjects = gameObjects.filter(o => o.type !== 'answer');

    // Spawn obstacle between this wave and the next, well ahead of new answers
    if (gameState.score >= 3 && Math.random() < 0.45) {
        const zPos = -(60 + Math.random() * 40); // -60 to -100, new answers spawn at -150
        spawnObstacle(zPos);
    }
}

// ── HUD / streak ─────────────────────────────────────────────────────────────

function updateHUD() {
    ui.scoreText.innerText = gameState.score;
    let hearts = '';
    for (let i = 0; i < gameState.lives; i++) hearts += '❤️';
    ui.livesText.innerText = hearts;
}

function updateStreakDisplay() {
    const display = document.getElementById('streak-display');
    const countEl = document.getElementById('streak-count');
    if (gameState.streak >= 3) {
        display.classList.remove('hidden');
        countEl.textContent = gameState.streak;
    } else {
        display.classList.add('hidden');
    }
}

// ── Leaderboard ──────────────────────────────────────────────────────────────

function saveHighScore() {
    let lb = [];
    try { lb = JSON.parse(localStorage.getItem('mathGameLeaderboard')) || []; } catch (e) {}
    if (gameState.score > 0) {
        lb.push({
            name: gameState.playerName,
            score: gameState.score,
            speed: gameState.speedLabel,
            topic: gameState.topic,
        });
    }
    lb.sort((a, b) => b.score - a.score);
    lb = lb.slice(0, 5);
    localStorage.setItem('mathGameLeaderboard', JSON.stringify(lb));
    updateHighScoreDisplay();
}

function updateHighScoreDisplay() {
    let lb = [];
    try { lb = JSON.parse(localStorage.getItem('mathGameLeaderboard')) || []; } catch (e) {}
    const list = document.getElementById('leaderboard-list');
    if (!list) return;
    if (lb.length === 0) { list.innerHTML = '<li>Henüz skor yok</li>'; return; }
    list.innerHTML = '';
    lb.forEach((entry, idx) => {
        const li = document.createElement('li');
        const medal = ['🥇 ', '🥈 ', '🥉 '][idx] || '';
        const topicTag = entry.topic && entry.topic !== 'mixed' ? ` ${TOPIC_LABELS[entry.topic] || ''}` : '';
        const speedTag = entry.speed ? ` (${entry.speed}${topicTag})` : '';
        li.innerText = `${medal}${entry.name} - ${entry.score} Puan${speedTag}`;
        list.appendChild(li);
    });
}

// ── Win / Game Over ──────────────────────────────────────────────────────────

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
}

function triggerWin() {
    gameState.isActive = false;
    const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
    saveHighScore();
    document.getElementById('win-stat-correct').textContent = gameState.score;
    document.getElementById('win-stat-wrong').textContent = gameState.wrongCount;
    document.getElementById('win-stat-time').textContent = formatTime(elapsed);
    ui.hud.classList.add('hidden');
    ui.winScreen.classList.remove('hidden');
    triggerConfetti();
}

function triggerGameOver() {
    gameState.isActive = false;
    const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
    saveHighScore();
    ui.finalScoreText.innerText = gameState.score;
    document.getElementById('stat-correct').textContent = gameState.score;
    document.getElementById('stat-wrong').textContent = gameState.wrongCount;
    document.getElementById('stat-time').textContent = formatTime(elapsed);
    ui.hud.classList.add('hidden');
    ui.gameOverScreen.classList.remove('hidden');
}

// ── Confetti ─────────────────────────────────────────────────────────────────

function triggerConfetti() {
    const container = document.getElementById('confetti-container');
    container.innerHTML = '';
    const colors = ['#ff6b6b','#ffd93d','#6bcb77','#4d96ff','#ff922b','#cc5de8','#f06595'];
    for (let i = 0; i < 100; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.left = Math.random() * 100 + 'vw';
        piece.style.animationDuration = (2 + Math.random() * 2.5) + 's';
        piece.style.animationDelay = (Math.random() * 1.8) + 's';
        piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        piece.style.transform = `rotate(${Math.random() * 360}deg)`;
        container.appendChild(piece);
    }
    setTimeout(() => { container.innerHTML = ''; }, 6000);
}

// ── Share ────────────────────────────────────────────────────────────────────

function shareResult() {
    const elapsed = gameState.startTime ? Math.floor((Date.now() - gameState.startTime) / 1000) : 0;
    const topicName = { add:'Toplama', sub:'Çıkarma', mul:'Çarpma', div:'Bölme', mixed:'Karışık' }[gameState.topic] || '';
    const text =
        `🎮 Matematik Yolculuğu\n` +
        `👤 ${gameState.playerName}: ${gameState.score}/20 puan\n` +
        `🏎 Hız: ${gameState.speedLabel} | 📚 Konu: ${topicName}\n` +
        `✅ Doğru: ${gameState.score}  ❌ Yanlış: ${gameState.wrongCount}  ⏱ ${formatTime(elapsed)}\n\n` +
        `🔗 https://selek55.github.io/EylulOyun/`;
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text)
            .then(() => alert('Sonuç panoya kopyalandı! 📋'))
            .catch(() => prompt('Kopyala:', text));
    } else {
        prompt('Kopyala:', text);
    }
}

// ── Menu / restart ───────────────────────────────────────────────────────────

function returnToMenu() {
    ui.gameOverScreen.classList.add('hidden');
    ui.winScreen.classList.add('hidden');
    ui.hud.classList.add('hidden');
    ui.startScreen.classList.remove('hidden');
    document.getElementById('confetti-container').innerHTML = '';
    gameObjects.forEach(o => scene.remove(o.mesh));
    gameObjects = [];
    spawnInitialTrees();
    if (window.player) { scene.remove(window.player); window.player = null; }
}

// ── Start game ───────────────────────────────────────────────────────────────

function startGame() {
    gameObjects.forEach(o => scene.remove(o.mesh));
    gameObjects = [];
    spawnInitialTrees();
    document.getElementById('confetti-container').innerHTML = '';

    const selectedLevel    = parseInt(document.getElementById('start-level')?.value  ?? 1);
    const selectedColor    = document.getElementById('car-color')?.value ?? '#ff3333';
    const selectedType     = parseInt(document.getElementById('car-type')?.value     ?? 0);
    const selectedSpeedIdx = parseInt(document.getElementById('speed-setting')?.value ?? 1);
    const selectedTopic    = document.getElementById('topic-setting')?.value ?? 'mixed';
    const preset = SPEED_PRESETS[selectedSpeedIdx] ?? SPEED_PRESETS[1];

    gameState.playerName    = document.getElementById('player-name')?.value || 'Oyuncu';
    gameState.score         = 0;
    gameState.lives         = GAME_CONFIG.startLives;
    gameState.level         = selectedLevel;
    gameState.speedBase     = preset.base;
    gameState.speedLabel    = preset.label;
    gameState.topic         = selectedTopic;
    gameState.streak        = 0;
    gameState.wrongCount    = 0;
    gameState.startTime     = Date.now();
    gameState.currentLaneIndex = gameState.level === 1 ? 1 : 2;
    gameState.speedMultiplier  = 1.0 + (gameState.level - 1) * 0.2;
    gameState.isActive = true;

    updateStreakDisplay();

    if (window.player) scene.remove(window.player);
    window.player = buildCar(selectedColor, selectedType);
    window.player.position.set(GAME_CONFIG.lanes[gameState.currentLaneIndex], 0, GAME_CONFIG.playerZ);
    addHeadlightsToPlayer();
    scene.add(window.player);

    updateHUD();
    ui.startScreen.classList.add('hidden');
    ui.gameOverScreen.classList.add('hidden');
    ui.winScreen.classList.add('hidden');
    ui.hud.classList.remove('hidden');
}

// ── Animate ──────────────────────────────────────────────────────────────────

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    if (gameState.isActive) updateGameLogic(delta);
    if (renderer && scene && camera) renderer.render(scene, camera);
}

// ── Event listeners ──────────────────────────────────────────────────────────

ui.startBtn.addEventListener('click', startGame);
ui.restartBtn.addEventListener('click', startGame);
ui.winRestartBtn.addEventListener('click', startGame);

document.getElementById('menu-btn1')?.addEventListener('click', returnToMenu);
document.getElementById('menu-btn2')?.addEventListener('click', returnToMenu);
document.getElementById('share-btn1')?.addEventListener('click', shareResult);
document.getElementById('share-btn2')?.addEventListener('click', shareResult);

window.addEventListener('keydown', (e) => {
    if (!gameState.isActive) return;
    if (e.key === 'ArrowLeft'  || e.key === 'a' || e.key === 'A') movePlayerLeft();
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') movePlayerRight();
});

function movePlayerLeft() {
    if (!gameState.isActive) return;
    const min = gameState.level === 1 ? 1 : 0;
    if (gameState.currentLaneIndex > min) gameState.currentLaneIndex--;
}

function movePlayerRight() {
    if (!gameState.isActive) return;
    const max = gameState.level === 1 ? 2 : 3;
    if (gameState.currentLaneIndex < max) gameState.currentLaneIndex++;
}

const btnLeft  = document.getElementById('btn-left');
const btnRight = document.getElementById('btn-right');
btnLeft?.addEventListener('touchstart',  (e) => { e.preventDefault(); movePlayerLeft();  }, { passive: false });
btnLeft?.addEventListener('mousedown',   movePlayerLeft);
btnRight?.addEventListener('touchstart', (e) => { e.preventDefault(); movePlayerRight(); }, { passive: false });
btnRight?.addEventListener('mousedown',  movePlayerRight);

let touchStartX = 0;
window.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
window.addEventListener('touchend', (e) => {
    if (!gameState.isActive) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) { dx < 0 ? movePlayerLeft() : movePlayerRight(); }
}, { passive: true });

// ── Boot ─────────────────────────────────────────────────────────────────────

initThreeJS();
animate();
