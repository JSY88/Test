 // Web Audio Context Initialization
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Game State
const gameState = {
    stimulusDuration: 1000,      // 자극 제시 지속시간 (ms)
    stimulusInterval: 2500,      // 자극 간 간격 시간 (ms)
    isPlaying: false,
    nBackLevel: 1,
    currentBlock: 0,
    maxBlocks: 12,
    stimuliPerBlock: 30,
    currentStimulus: 0,
    sceneHistory: [],
    locationHistory: [],
    soundHistory: [],
    colorHistory: [],
    sceneTargets: 0,
    locationTargets: 0,
    soundTargets: 0,
    colorTargets: 0,
    bothTargets: 0,
    sceneResponses: 0,
    locationResponses: 0,
    soundResponses: 0,
    colorResponses: 0,
    sceneErrors: 0,
    locationErrors: 0,
    soundErrors: 0,
    colorErrors: 0,
    currentTimer: null,
    responseWindowTimer: null,
    sceneTargetProcessed: false,
    locationTargetProcessed: false,
    soundTargetProcessed: false,
    colorTargetProcessed: false,
    currentIsSceneTarget: false,
    currentIsLocationTarget: false,
    currentIsSoundTarget: false,
    currentIsColorTarget: false,
    inResponseWindow: false,
    canRespond: true,
    presentedStimulusHistory: [],
    interferenceType: "random",
    randomInterferenceProbabilities: {
        "previous": 0.33,
        "cyclic": 0.33,
        "next": 0.34
    },
    cyclicInterferenceNBackLevel: 2,
    nextStimulusInfo: null,
    consecutiveGames: 0,
    totalGamesToday: 0,
    stimulusTypes: [],
    soundSource: "pianoTones",
    soundFiles: ['sounds/sound001.mp3', 'sounds/sound002.mp3', 'sounds/sound003.mp3'],
    audioLoader: new THREE.AudioLoader(),
    soundStimulus: null,
    pianoTones: ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"],
    pianoFrequencies: {
        "C4": 261.63,
        "D4": 293.66,
        "E4": 329.63,
        "F4": 349.23,
        "G4": 392.00,
        "A4": 440.00,
        "B4": 493.88,
        "C5": 523.25
    },
    isLevelLocked: false,
    imageSourceUrl: "images/",
    resultImageUrl: "",
    sceneKey: "S",
    locationKey: "A",
    soundKey: "L",
    colorKey: "K",
    soundSourceUrl: "sounds/",
    isPaused: false, // ⏸️ 일시정지 상태 추가
    isFullscreen: false, // 🖼️ 전체화면 상태 추가
    targetCountGoals: {},
    showStimulusCounter: false,
    targetCountGoals: {
        scene: 12,
        location: 12,
        sound: 6,
        color: 12
    },
    interferenceProbability: 0.9,
    stimulusRandomness: 0.5,
    soundVolume: 0.5,
    imageBrightness: 1.0,
    imageContrast: 1.0
};

const wallColor = 0x262626;
const floorColor = 0x393734;
const panelColor = 0x000000;
const imageScale = 1.0;
const randomizeStimulusColor = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f0f0);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.6, 2);
camera.lookAt(0, 1.6, -5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(0, 1, 0);
directionalLight.intensity = 0.8;
scene.add(directionalLight);

const roomWidth = 5;
const roomHeight = 3;
const roomDepth = 5;

function createBrickTexture() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const width = 512;
    const height = 512;
    canvas.width = width;
    canvas.height = height;
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, width, height);
    const brickHeight = 30;
    const brickWidth = 80;
    const mortarSize = 5;
    ctx.fillStyle = '#e0e0e0';
    let offsetX = 0;
    for (let y = 0; y < height; y += brickHeight + mortarSize) {
        offsetX = (Math.floor(y / (brickHeight + mortarSize)) % 2) * (brickWidth / 2);
        for (let x = -brickWidth / 2; x < width + brickWidth / 2; x += brickWidth + mortarSize) {
            ctx.fillRect(x + offsetX, y, brickWidth, brickHeight);
            ctx.fillStyle = '#d8d8d8';
            for (let i = 0; i < 15; i++) {
                const spotX = x + offsetX + Math.random() * brickWidth;
                const spotY = y + Math.random() * brickHeight;
                const spotSize = 1 + Math.random() * 3;
                ctx.beginPath();
                ctx.arc(spotX, spotY, spotSize, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.fillStyle = '#e0e0e0';
        }
    }
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    for (let y = 0; y < height; y += brickHeight + mortarSize) {
        ctx.fillRect(0, y - 1, width, 2);
        offsetX = (Math.floor(y / (brickHeight + mortarSize)) % 2) * (brickWidth / 2);
        for (let x = -brickWidth / 2; x < width + brickWidth / 2; x += brickWidth + mortarSize) {
            ctx.fillRect(x + offsetX - 1, y, 2, brickHeight);
        }
    }
    return new THREE.CanvasTexture(canvas);
}

const brickTexture = createBrickTexture();
brickTexture.wrapT = THREE.RepeatWrapping;
brickTexture.repeat.set(2, 1);

const wallMaterial = new THREE.MeshStandardMaterial({
    map: brickTexture,
    roughness: 0.0,
    metalness: 0.0,
    color: wallColor
});

const wallGeometry = new THREE.BoxGeometry(0.1, roomHeight, roomDepth);
const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
leftWall.position.set(-roomWidth / 2, roomHeight / 2, 0);
scene.add(leftWall);

const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
rightWall.position.set(roomWidth / 2, roomHeight / 2, 0);
scene.add(rightWall);

const backWallGeometry = new THREE.BoxGeometry(roomWidth, roomHeight, 0.1);
const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
backWall.position.set(0, roomHeight / 2, -roomDepth / 2);
scene.add(backWall);

function createWoodTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    context.fillStyle = '#8B4513';
    context.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < 40; i++) {
        const x = Math.random() * canvas.width;
        context.strokeStyle = `rgba(139, 69, 19, ${Math.random() * 0.5})`;
        context.lineWidth = 1 + Math.random() * 10;
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x + Math.random() * 50 - 25, canvas.height);
        context.stroke();
    }
    for (let i = 0; i < 30; i++) {
        const y = Math.random() * canvas.height;
        const width = 2 + Math.random() * 10;
        context.fillStyle = `rgba(60, 30, 15, ${Math.random() * 0.3})`;
        context.fillRect(0, y, canvas.width, width);
    }
    for (let i = 0; i < 800; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = 1 + Math.random() * 2;
        context.fillStyle = `rgba(200, 150, 100, ${Math.random() * 0.2})`;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
    }
    return new THREE.CanvasTexture(canvas);
}

const floorGeometry = new THREE.PlaneGeometry(roomWidth, roomDepth);
const woodTexture = createWoodTexture();
woodTexture.wrapS = THREE.RepeatWrapping;
woodTexture.wrapT = THREE.RepeatWrapping;
woodTexture.repeat.set(4, 4);

const floorMaterial = new THREE.MeshStandardMaterial({
    map: woodTexture,
    roughness: 0.8,
    metalness: 0.2,
    color: floorColor
});

const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

const ceilingGeometry = new THREE.PlaneGeometry(roomWidth, roomDepth);
const ceiling = new THREE.Mesh(ceilingGeometry, wallMaterial);
ceiling.rotation.x = Math.PI / 2;
ceiling.position.y = roomHeight;
scene.add(ceiling);

const panelWidth = 1.0;
const panelHeight = 1.0;
const panelDepth = 0.02;

const panelMaterial = new THREE.MeshStandardMaterial({
    color: panelColor,
    roughness: 0.5,
    metalness: 0.0
});

const panels = [];
const panelPositions = [
    { x: -1.3, y: 1.9, z: -roomDepth / 2 + 0.06, rotation: [0, 0, 0] },
    { x: 1.3, y: 1.9, z: -roomDepth / 2 + 0.06, rotation: [0, 0, 0] },
    { x: -1.3, y: 0.8, z: -roomDepth / 2 + 0.06, rotation: [0, 0, 0] },
    { x: 1.3, y: 0.8, z: -roomDepth / 2 + 0.06, rotation: [0, 0, 0] },
    { x: -roomWidth / 2 + 0.06, y: 1.9, z: -0.5, rotation: [0, Math.PI / 2, 0] },
    { x: -roomWidth / 2 + 0.06, y: 0.8, z: -0.5, rotation: [0, Math.PI / 2, 0] },
    { x: roomWidth / 2 - 0.06, y: 1.9, z: -0.5, rotation: [0, -Math.PI / 2, 0] },
    { x: roomWidth / 2 - 0.06, y: 0.8, z: -0.5, rotation: [0, -Math.PI / 2, 0] }
];

panelPositions.forEach((pos, index) => {
    const panelGroup = new THREE.Group();
    const panel = new THREE.Mesh(
        new THREE.BoxGeometry(panelWidth, panelHeight, panelDepth),
        panelMaterial
    );
    panelGroup.add(panel);
    panelGroup.position.set(pos.x, pos.y, pos.z);
    panelGroup.rotation.set(pos.rotation[0], pos.rotation[1], pos.rotation[2]);
    scene.add(panelGroup);
    panels.push({
        group: panelGroup,
        position: index,
        panel: panel,
        rotation: pos.rotation,
        stimulusObject: null
    });
});

const imageLoader = new THREE.TextureLoader();
const imageTextures = [];
//랜덤 색상 종류표
const distinctColors = [
    new THREE.Color(0xFF6B6B), // Vivid Red
    new THREE.Color(0x1E90FF), // Dodger Blue
    new THREE.Color(0x32CD32), // Lime Green
    new THREE.Color(0xFFD700), // Gold
    new THREE.Color(0x9932CC), // Dark Orchid
    new THREE.Color(0xFF69B4), // Hot Pink
    new THREE.Color(0x00CED1), // Dark Turquoise
    new THREE.Color(0xFFA07A), // Light Salmon
    new THREE.Color(0x9ACD32), // Yellow Green
    new THREE.Color(0x87CEFA), // Light Sky Blue
    new THREE.Color(0xFFFFFF), // White
    new THREE.Color(0xFFFF00), // Yellow
    new THREE.Color(0x00FF00), // Green
    new THREE.Color(0x00FFFF), // Cyan
];

function getRandomColor() {
    return distinctColors[Math.floor(Math.random() * distinctColors.length)];
}

function loadImageTextures() {
    imageTextures.length = 0;
    const baseUrl = gameState.imageSourceUrl || "images/";
    for (let i = 1; i <= 101; i++) {
        const filename = `image${String(i).padStart(3, '0')}.png`;
        const texture = imageLoader.load(`${baseUrl}${filename}`, 
            () => console.log(`Loaded: ${baseUrl}${filename}`),
            undefined,
            (err) => console.error(`Error loading ${baseUrl}${filename}:`, err)
        );
        let color = randomizeStimulusColor ? getRandomColor() : null;
        imageTextures.push({ texture: texture, color: color });
    }
}

function createStimulusImage(imageIndex, panel, colorIndex) {
    clearStimulus(panel);
    const imageGeometry = new THREE.PlaneGeometry(panelWidth * imageScale, panelHeight * imageScale);
    const imageMaterial = new THREE.MeshBasicMaterial({
        map: imageTextures[imageIndex].texture,
        transparent: true,
        blending: THREE.NormalBlending,
        opacity: gameState.imageContrast, // 설정된 대비 적용
        color: new THREE.Color(1, 1, 1).multiplyScalar(gameState.imageBrightness) // 설정된 밝기 적용
    });
    if (gameState.stimulusTypes.includes("color")) {
        const colors = distinctColors;
        if (colorIndex >= 0 && colorIndex < colors.length) {
            imageMaterial.color = colors[colorIndex];
            gameState.currentColorStimulusColor = colors[colorIndex];
        } else if (imageTextures[imageIndex].color && randomizeStimulusColor) {
            imageMaterial.color = imageTextures[imageIndex].color;
            gameState.currentColorStimulusColor = imageTextures[imageIndex].color;
        } else {
            gameState.currentColorStimulusColor = null;
        }
    }
    const imagePlane = new THREE.Mesh(imageGeometry, imageMaterial);
    imagePlane.position.set(0, 0, panelDepth / 2 + 0.01);
    panel.group.add(imagePlane);
    panel.stimulusObject = imagePlane;
    console.log("createStimulusImage() - Created stimulus image:", {
        imageIndex,
        panelIndex: panel.position,
        brightness: gameState.imageBrightness,
        contrast: gameState.imageContrast,
        colorIndex
    });
    return imagePlane;
}

function clearStimulus(panel) {
    if (panel.stimulusObject) {
        panel.group.remove(panel.stimulusObject);
        panel.stimulusObject = null;
    }
}

function clearAllStimuli() {
    panels.forEach(panel => {
        clearStimulus(panel);
    });
}

const sceneIndicator = document.getElementById('scene-indicator');
const locationIndicator = document.getElementById('location-indicator');
const soundIndicator = document.getElementById('sound-indicator');
const colorIndicator = document.getElementById('color-indicator');



function resetIndicators() {
    console.log("resetIndicators() - Resetting all indicators, previous states:", {
        scene: sceneIndicator.classList.value,
        location: locationIndicator.classList.value,
        sound: soundIndicator.classList.value,
        color: colorIndicator.classList.value
    });
    sceneIndicator.classList.remove('correct', 'incorrect', 'missed', 'early');
    locationIndicator.classList.remove('correct', 'incorrect', 'missed', 'early');
    soundIndicator.classList.remove('correct', 'incorrect', 'missed', 'early');
    colorIndicator.classList.remove('correct', 'incorrect', 'missed', 'early');
    gameState.sceneTargetProcessed = false;
    gameState.locationTargetProcessed = false;
    gameState.soundTargetProcessed = false;
    gameState.colorTargetProcessed = false;
    gameState.canRespond = true;
    console.log("resetIndicators() - Reset complete, canRespond:", gameState.canRespond);
}


function showIndicatorFeedback(indicatorId, isCorrect) {
    console.log(`showIndicatorFeedback() - 적용: ${indicatorId}, 정답 여부: ${isCorrect}`);
    const indicator = document.getElementById(indicatorId);
    if (!indicator) {
        console.error(`showIndicatorFeedback() - Indicator with ID '${indicatorId}' not found in DOM.`);
        return;
    }
    console.log(`showIndicatorFeedback() - Indicator found: ${indicatorId}, applying classes`);
    indicator.classList.remove('correct', 'incorrect');
    indicator.classList.add(isCorrect ? 'correct' : 'incorrect');
}


function showEarlyResponseFeedback(indicatorId) {
    console.log(`showEarlyResponseFeedback() - 적용: ${indicatorId}`);
    const indicator = document.getElementById(indicatorId);
    if (!indicator) {
        console.error(`showEarlyResponseFeedback() - Indicator with ID '${indicatorId}' not found in DOM.`);
        return;
    }
    console.log(`showEarlyResponseFeedback() - Indicator found: ${indicatorId}, marking as early`);
    indicator.classList.add('early');
}


function showMissedTargetFeedback(indicatorId) {
    const indicator = typeof indicatorId === 'string' ? document.getElementById(indicatorId) : indicatorId;
    if (!indicator) {
        console.error(`showMissedTargetFeedback() - Indicator with ID '${indicatorId}' not found in DOM.`);
        return;
    }
    indicator.classList.add('missed');
}

function introduceInterference(currentImageIndex, currentPanelIndex, currentSoundIndex, currentColorIndex) {
    let currentInterferenceType = gameState.interferenceType;
    console.log("introduceInterference() - Starting with type:", currentInterferenceType, 
                "currentStimulus:", gameState.currentStimulus, 
                "inputs:", { currentImageIndex, currentPanelIndex, currentSoundIndex, currentColorIndex });

    // 간섭 없음 처리
    if (currentInterferenceType === "none") {
        console.log("introduceInterference() - No interference applied");
        return { imageIndex: currentImageIndex, panelIndex: currentPanelIndex, soundIndex: currentSoundIndex, colorIndex: currentColorIndex };
    }

    // "random" 유형에서 무작위 간섭 유형 선택
    if (currentInterferenceType === "random") {
        const rand = Math.random();
        let cumulativeProbability = 0;
        for (const type in gameState.randomInterferenceProbabilities) {
            cumulativeProbability += gameState.randomInterferenceProbabilities[type];
            if (rand < cumulativeProbability) {
                currentInterferenceType = type;
                break;
            }
        }
        console.log("introduceInterference() - Random interference type selected:", currentInterferenceType, 
                    "rand:", rand, "probabilities:", gameState.randomInterferenceProbabilities);
    }

    // 간섭 적용 확률 (90%)
    const interferenceChance = gameState.interferenceProbability || 0.9;
    if (Math.random() < interferenceChance) {
        let interferedImageIndex = currentImageIndex;
        let interferedPanelIndex = currentPanelIndex;
        let interferedSoundIndex = currentSoundIndex;
        let interferedColorIndex = currentColorIndex;

        // "previous" 간섭: 이전 자극에서 무작위로 하나 선택
        if (currentInterferenceType === "previous" && gameState.currentStimulus > 0) {
            const previousImageIndex = gameState.sceneHistory[gameState.currentStimulus - 1];
            const previousPanelIndex = gameState.locationHistory[gameState.currentStimulus - 1];
            const previousSoundIndex = gameState.soundHistory[gameState.currentStimulus - 1];
            const previousColorIndex = gameState.colorHistory[gameState.currentStimulus - 1];
            const type = Math.random();
            if (type < 0.25) {
                interferedImageIndex = previousImageIndex;
                console.log("Interference applied (previous): image, from:", currentImageIndex, "to:", interferedImageIndex);
            } else if (type < 0.5) {
                interferedPanelIndex = previousPanelIndex;
                console.log("Interference applied (previous): location, from:", currentPanelIndex, "to:", interferedPanelIndex);
            } else if (type < 0.75) {
                interferedSoundIndex = previousSoundIndex;
                console.log("Interference applied (previous): sound, from:", currentSoundIndex, "to:", interferedSoundIndex);
            } else {
                interferedColorIndex = previousColorIndex;
                console.log("Interference applied (previous): color, from:", currentColorIndex, "to:", interferedColorIndex);
            }
        } 
        // "cyclic" 간섭: N-Back 레벨만큼 이전 자극에서 무작위로 하나 선택
        else if (currentInterferenceType === "cyclic" && gameState.currentStimulus >= gameState.cyclicInterferenceNBackLevel) {
            const cyclicNBackLevel = gameState.cyclicInterferenceNBackLevel;
            const cyclicImageIndex = gameState.sceneHistory[gameState.currentStimulus - cyclicNBackLevel];
            const cyclicPanelIndex = gameState.locationHistory[gameState.currentStimulus - cyclicNBackLevel];
            const cyclicSoundIndex = gameState.soundHistory[gameState.currentStimulus - cyclicNBackLevel];
            const cyclicColorIndex = gameState.colorHistory[gameState.currentStimulus - cyclicNBackLevel];
            const type = Math.random();
            if (type < 0.25) {
                interferedImageIndex = cyclicImageIndex;
                console.log("Interference applied (cyclic, N=" + cyclicNBackLevel + "): image, from:", currentImageIndex, "to:", interferedImageIndex);
            } else if (type < 0.5) {
                interferedPanelIndex = cyclicPanelIndex;
                console.log("Interference applied (cyclic, N=" + cyclicNBackLevel + "): location, from:", currentPanelIndex, "to:", interferedPanelIndex);
            } else if (type < 0.75) {
                interferedSoundIndex = cyclicSoundIndex;
                console.log("Interference applied (cyclic, N=" + cyclicNBackLevel + "): sound, from:", currentSoundIndex, "to:", interferedSoundIndex);
            } else {
                interferedColorIndex = cyclicColorIndex;
                console.log("Interference applied (cyclic, N=" + cyclicNBackLevel + "): color, from:", currentColorIndex, "to:", interferedColorIndex);
            }
        } 
        // "next" 간섭: 다음 자극에서 무작위로 하나 선택
        else if (currentInterferenceType === "next" && gameState.nextStimulusInfo) {
            const type = Math.random();
            if (type < 0.25) {
                interferedImageIndex = gameState.nextStimulusInfo.imageIndex;
                console.log("Interference applied (next): image, from:", currentImageIndex, "to:", interferedImageIndex);
            } else if (type < 0.5) {
                interferedPanelIndex = gameState.nextStimulusInfo.panelIndex;
                console.log("Interference applied (next): location, from:", currentPanelIndex, "to:", interferedPanelIndex);
            } else if (type < 0.75) {
                interferedSoundIndex = gameState.nextStimulusInfo.soundIndex;
                console.log("Interference applied (next): sound, from:", currentSoundIndex, "to:", interferedSoundIndex);
            } else {
                interferedColorIndex = gameState.nextStimulusInfo.colorIndex;
                console.log("Interference applied (next): color, from:", currentColorIndex, "to:", interferedColorIndex);
            }
        }

        // 결과 반환 및 디버깅 로그
        console.log("introduceInterference() - Result:", { 
            imageIndex: interferedImageIndex, 
            panelIndex: interferedPanelIndex, 
            soundIndex: interferedSoundIndex, 
            colorIndex: interferedColorIndex 
        });
        return { imageIndex: interferedImageIndex, panelIndex: interferedPanelIndex, soundIndex: interferedSoundIndex, colorIndex: interferedColorIndex };
    }

    // 간섭 미적용 시 원래 값 반환
    console.log("introduceInterference() - No interference applied due to chance, probability:", interferenceChance);
    return { imageIndex: currentImageIndex, panelIndex: currentPanelIndex, soundIndex: currentSoundIndex, colorIndex: currentColorIndex };
}

function playSound(soundIndex) {
    stopSound(); // 기존 소리 중지
    if (!gameState.stimulusTypes.includes("sound")) {
        console.log("playSound() - Sound stimulus not enabled, skipping.");
        return;
    }
    if (gameState.soundSource === "pianoTones") {
        if (soundIndex >= 0 && soundIndex < gameState.pianoTones.length) {
            const note = gameState.pianoTones[soundIndex];
            const frequency = gameState.pianoFrequencies[note];
            if (frequency) {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                oscillator.type = 'sine';
                oscillator.frequency.value = frequency;
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                gainNode.gain.value = gameState.soundVolume; // 설정된 볼륨 적용
                const now = audioContext.currentTime;
                gainNode.gain.setValueAtTime(gameState.soundVolume, now);
                gainNode.gain.linearRampToValueAtTime(0, now + 0.2);
                oscillator.start();
                gameState.soundStimulus = { oscillator: oscillator, gainNode: gainNode };
                setTimeout(() => {
                    stopSound();
                }, 1000);
                console.log("playSound() - Piano tone:", note, frequency, "Hz, duration: 1000ms, volume:", gameState.soundVolume);
            } else {
                console.error("playSound() - Invalid piano note:", note);
            }
        } else {
            console.error("playSound() - Invalid pianoTones index:", soundIndex, "Max:", gameState.pianoTones.length - 1);
        }
    } else if (gameState.soundSource === "soundFiles") {
        if (soundIndex >= 0 && soundIndex < gameState.soundFiles.length) {
            const baseUrl = gameState.soundSourceUrl || "sounds/";
            const soundUrl = `${baseUrl}${gameState.soundFiles[soundIndex].split('/').pop()}`;
            console.log("playSound() - Loading sound file:", soundUrl);
            gameState.audioLoader.load(
                soundUrl,
                function (buffer) {
                    const listener = new THREE.AudioListener();
                    camera.add(listener);
                    const sound = new THREE.Audio(listener);
                    sound.setBuffer(buffer);
                    sound.setVolume(gameState.soundVolume); // 설정된 볼륨 적용
                    sound.play();
                    gameState.soundStimulus = sound;
                    console.log("playSound() - Sound file playing:", soundUrl, "volume:", gameState.soundVolume);
                },
                function (xhr) {
                    console.log("playSound() - Loading progress:", (xhr.loaded / xhr.total * 100) + '%');
                },
                function (err) {
                    console.error("playSound() - Error loading sound:", soundUrl, err);
                }
            );
        } else {
            console.error("playSound() - Invalid soundFiles index:", soundIndex, "Max:", gameState.soundFiles.length - 1);
        }
    }
}

function stopSound() {
    if (gameState.soundSource === "pianoTones") {
        if (gameState.soundStimulus && gameState.soundStimulus.oscillator && gameState.soundStimulus.gainNode) {
            const gainNode = gameState.soundStimulus.gainNode;
            const now = audioContext.currentTime;
            gainNode.gain.setValueAtTime(gainNode.gain.value, now);
            gainNode.gain.linearRampToValueAtTime(0, now + 0.2);
            setTimeout(() => {
                if (gameState.soundStimulus && gameState.soundStimulus.oscillator) {
                    gameState.soundStimulus.oscillator.stop();
                    gameState.soundStimulus.oscillator.disconnect();
                    gameState.soundStimulus.gainNode.disconnect();
                    gameState.soundStimulus = null;
                    console.log("stopSound() - Piano tone stopped with fade-out (200ms)");
                }
            }, 200);
        } else {
            console.log("stopSound() - No piano tone to stop.");
        }
    } else {
        if (gameState.soundStimulus && gameState.soundStimulus.isPlaying) {
            gameState.soundStimulus.stop();
            gameState.soundStimulus = null;
            console.log("stopSound() - Sound file stopped");
        } else {
            console.log("stopSound() - No sound file playing to stop.");
        }
    }
}

function clearAllSounds() {
    stopSound();
    console.log("clearAllSounds() - All sounds cleared.");
}


function showStimulus(imageIndex, panelIndex, soundIndex, colorIndex) {
    if (gameState.isPaused) return; // ⏸️ paused 상태일 때 stimuli 표시 방지
    console.log("showStimulus() - Starting: imageIndex:", imageIndex, "panelIndex:", panelIndex, "soundIndex:", soundIndex, "colorIndex:", colorIndex, "currentStimulus:", gameState.currentStimulus);
    resetIndicators();
    const panel = panels[panelIndex];

    // 미리 설정된 타겟 여부 사용
    if (gameState.currentStimulus >= gameState.nBackLevel) {
        gameState.currentIsSceneTarget = gameState.stimulusSequence[gameState.currentStimulus].isSceneTarget;
        gameState.currentIsLocationTarget = gameState.stimulusSequence[gameState.currentStimulus].isLocationTarget;
        gameState.currentIsSoundTarget = gameState.stimulusSequence[gameState.currentStimulus].isSoundTarget;
        gameState.currentIsColorTarget = gameState.stimulusSequence[gameState.currentStimulus].isColorTarget;
        console.log("showStimulus() - Predefined targets from sequence:", {
            scene: gameState.currentIsSceneTarget,
            location: gameState.currentIsLocationTarget,
            sound: gameState.currentIsSoundTarget,
            color: gameState.currentIsColorTarget
        });
    } else {
        gameState.currentIsSceneTarget = false;
        gameState.currentIsLocationTarget = false;
        gameState.currentIsSoundTarget = false;
        gameState.currentIsColorTarget = false;
        console.log("showStimulus() - Initial stimulus, no targets set");
    }

    // 간섭이 이미 시퀀스에 적용되었으므로 introduceInterference() 호출 제거
    console.log("showStimulus() - Presenting stimulus directly from sequence:", { imageIndex, panelIndex, soundIndex, colorIndex });

    // 자극 제시
    createStimulusImage(imageIndex, panel, colorIndex);
    if (gameState.stimulusTypes.includes("sound")) {
        playSound(soundIndex);
    }

    console.log("showStimulus() - Presented stimulus:", imageIndex, panelIndex, soundIndex, colorIndex);
    gameState.sceneHistory.push(imageIndex);
    gameState.locationHistory.push(panelIndex);
    gameState.soundHistory.push(soundIndex);
    gameState.colorHistory.push(colorIndex);

    gameState.presentedStimulusHistory.push({
        imageIndex,
        panelIndex,
        soundIndex,
        colorIndex
    });

    // 타겟 카운트는 시퀀스 생성 시 이미 계산됨, 여기서는 증가시키지 않음
    if (gameState.currentStimulus >= gameState.nBackLevel) {
        if (gameState.currentIsSceneTarget && gameState.currentIsLocationTarget && gameState.currentIsSoundTarget && gameState.currentIsColorTarget) {
            gameState.bothTargets++;
            console.log("showStimulus() - Both targets detected, bothTargets:", gameState.bothTargets);
        }
    }

    gameState.currentStimulus++;

    if (gameState.currentStimulus < gameState.stimuliPerBlock) {
        gameState.currentTimer = setTimeout(() => {
            console.log("Timer - Clearing stimuli and stopping sound, currentStimulus:", gameState.currentStimulus, "timestamp:", Date.now());
            clearAllStimuli();
            stopSound();
            gameState.inResponseWindow = true;
            gameState.canRespond = true;

            gameState.responseWindowTimer = setTimeout(() => {
                console.log("Timer - Response window closed, currentStimulus:", gameState.currentStimulus, "stimulusInterval:", gameState.stimulusInterval, "timestamp:", Date.now());
                gameState.inResponseWindow = false;
                gameState.canRespond = false;

                const lastPresented = gameState.presentedStimulusHistory[gameState.currentStimulus - 1];
                if (gameState.stimulusTypes.includes("scene") && gameState.currentIsSceneTarget && !gameState.sceneTargetProcessed) {
                    showMissedTargetFeedback('scene-indicator');
                    gameState.sceneErrors++;
                    console.log("Timer - Missed scene target:", {
                        imageIndex: lastPresented.imageIndex,
                        nBackIndex: gameState.sceneHistory[gameState.currentStimulus - 1 - gameState.nBackLevel],
                        sceneErrors: gameState.sceneErrors
                    });
                }
                if (gameState.stimulusTypes.includes("location") && gameState.currentIsLocationTarget && !gameState.locationTargetProcessed) {
                    showMissedTargetFeedback('location-indicator');
                    gameState.locationErrors++;
                    console.log("Timer - Missed location target:", {
                        panelIndex: lastPresented.panelIndex,
                        nBackIndex: gameState.locationHistory[gameState.currentStimulus - 1 - gameState.nBackLevel],
                        locationErrors: gameState.locationErrors
                    });
                }
                if (gameState.stimulusTypes.includes("sound") && gameState.currentIsSoundTarget && !gameState.soundTargetProcessed) {
                    showMissedTargetFeedback('sound-indicator');
                    gameState.soundErrors++;
                    console.log("Timer - Missed sound target:", {
                        soundIndex: lastPresented.soundIndex,
                        nBackIndex: gameState.soundHistory[gameState.currentStimulus - 1 - gameState.nBackLevel],
                        soundErrors: gameState.soundErrors
                    });
                }
                if (gameState.stimulusTypes.includes("color") && gameState.currentIsColorTarget && !gameState.colorTargetProcessed) {
                    showMissedTargetFeedback('color-indicator');
                    gameState.colorErrors++;
                    console.log("Timer - Missed color target:", {
                        colorIndex: lastPresented.colorIndex,
                        nBackIndex: gameState.colorHistory[gameState.currentStimulus - 1 - gameState.nBackLevel],
                        colorErrors: gameState.colorErrors
                    });
                }

                generateNextStimulus();
            }, gameState.stimulusInterval);
        }, gameState.stimulusDuration);
    } else {
        gameState.currentTimer = setTimeout(() => {
            console.log("Timer - Final stimulus cleared, ending block, timestamp:", Date.now());
            clearAllStimuli();
            stopSound();
            gameState.inResponseWindow = true;
            gameState.canRespond = true;

            gameState.responseWindowTimer = setTimeout(() => {
                console.log("Timer - Response window closed (final), currentStimulus:", gameState.currentStimulus, "stimulusInterval:", gameState.stimulusInterval, "timestamp:", Date.now());
                gameState.inResponseWindow = false;
                gameState.canRespond = false;

                const lastPresented = gameState.presentedStimulusHistory[gameState.currentStimulus - 1];
                if (gameState.stimulusTypes.includes("scene") && gameState.currentIsSceneTarget && !gameState.sceneTargetProcessed) {
                    showMissedTargetFeedback('scene-indicator');
                    gameState.sceneErrors++;
                    console.log("Timer - Missed scene target (final):", {
                        imageIndex: lastPresented.imageIndex,
                        nBackIndex: gameState.sceneHistory[gameState.currentStimulus - 1 - gameState.nBackLevel],
                        sceneErrors: gameState.sceneErrors
                    });
                }
                if (gameState.stimulusTypes.includes("location") && gameState.currentIsLocationTarget && !gameState.locationTargetProcessed) {
                    showMissedTargetFeedback('location-indicator');
                    gameState.locationErrors++;
                    console.log("Timer - Missed location target (final):", {
                        panelIndex: lastPresented.panelIndex,
                        nBackIndex: gameState.locationHistory[gameState.currentStimulus - 1 - gameState.nBackLevel],
                        locationErrors: gameState.locationErrors
                    });
                }
                if (gameState.stimulusTypes.includes("sound") && gameState.currentIsSoundTarget && !gameState.soundTargetProcessed) {
                    showMissedTargetFeedback('sound-indicator');
                    gameState.soundErrors++;
                    console.log("Timer - Missed sound target (final):", {
                        soundIndex: lastPresented.soundIndex,
                        nBackIndex: gameState.soundHistory[gameState.currentStimulus - 1 - gameState.nBackLevel],
                        soundErrors: gameState.soundErrors
                    });
                }
                if (gameState.stimulusTypes.includes("color") && gameState.currentIsColorTarget && !gameState.colorTargetProcessed) {
                    showMissedTargetFeedback('color-indicator');
                    gameState.colorErrors++;
                    console.log("Timer - Missed color target (final):", {
                        colorIndex: lastPresented.colorIndex,
                        nBackIndex: gameState.colorHistory[gameState.currentStimulus - 1 - gameState.nBackLevel],
                        colorErrors: gameState.colorErrors
                    });
                }

                setTimeout(() => {
                    endBlock();
                }, 500);
            }, gameState.stimulusInterval);
        }, gameState.stimulusDuration);
    }
}




function selectIndexAvoidingRecent(recentIndices, maxRange, recentLimit) {
    // 최근 인덱스가 recentLimit을 초과하면 오래된 항목 제거
    while (recentIndices.length >= recentLimit) {
        recentIndices.shift();
    }

    // 사용 가능한 인덱스 배열 생성
    const availableIndices = [];
    for (let i = 0; i < maxRange; i++) {
        if (!recentIndices.includes(i)) {
            availableIndices.push(i);
        }
    }

    // 디버깅 로그: 사용 가능한 인덱스 확인
    console.log("selectIndexAvoidingRecent() - Available indices:", availableIndices, 
                "Recent indices:", recentIndices, "Max range:", maxRange, "Recent limit:", recentLimit);

    // 사용 가능한 인덱스가 없으면 기본값 반환 (0)
    if (availableIndices.length === 0) {
        console.warn("selectIndexAvoidingRecent() - No available indices, returning 0");
        return 0;
    }

    // 무작위로 인덱스 선택
    const selectedIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    console.log("selectIndexAvoidingRecent() - Selected index:", selectedIndex);

    return selectedIndex;
}


function updateRecentIndices(type, index, n) {
    const historyKey = `${type}History`;
    const recentKey = `recent${type.charAt(0).toUpperCase() + type.slice(1)}Indices`;
    const maxRecent = n + 1;

    gameState[historyKey].push(index);
    gameState[recentKey].push(index);

    if (gameState[recentKey].length > maxRecent) {
        const removedIndex = gameState[recentKey].shift();
        console.log(`updateRecentIndices() - Updated ${type}: Removed old index ${removedIndex}, Added ${index}`);
    } else {
        console.log(`updateRecentIndices() - Updated ${type}: Added ${index}`);
    }
}


function generateNextStimulus() {
    if (!gameState.isPlaying || gameState.isPaused) return;
    console.log("generateNextStimulus() - Starting, currentStimulus:", gameState.currentStimulus);

    if (!gameState.stimulusSequence || gameState.currentStimulus >= gameState.stimulusSequence.length) {
        console.error("generateNextStimulus() - Stimulus sequence is invalid or index out of bounds", {
            stimulusSequence: gameState.stimulusSequence,
            currentStimulus: gameState.currentStimulus
        });
        endBlock();
        return;
    }

    const stimulus = gameState.stimulusSequence[gameState.currentStimulus];
    if (!stimulus || typeof stimulus !== 'object') {
        console.error("generateNextStimulus() - Invalid stimulus object at index:", gameState.currentStimulus, "stimulus:", stimulus);
        endBlock();
        return;
    }

    // 속성 확인 및 기본값 설정
    const { 
        imageIndex = 0, 
        panelIndex = 0, 
        soundIndex = 0, 
        colorIndex = 0, 
        targetType = "non-target" 
    } = stimulus;

    console.log("generateNextStimulus() - Stimulus data:", { imageIndex, panelIndex, soundIndex, colorIndex, targetType });

    gameState.nextStimulusInfo = { imageIndex, panelIndex, soundIndex, colorIndex, targetType };
    updateStimulusCounter();
    showStimulus(imageIndex, panelIndex, soundIndex, colorIndex);
}




function cancelAllTimers() {
    if (gameState.currentTimer) {
        clearTimeout(gameState.currentTimer);
        gameState.currentTimer = null;
        console.log("cancelAllTimers() - Cleared currentTimer");
    }
    if (gameState.responseWindowTimer) {
        clearTimeout(gameState.responseWindowTimer);
        gameState.responseWindowTimer = null;
        console.log("cancelAllTimers() - Cleared responseWindowTimer");
    }
    console.log("cancelAllTimers() - All timers canceled", { timestamp: Date.now() });
}

function pauseGame() {
    if (!gameState.isPlaying || gameState.isPaused) {
        console.log("pauseGame() - Aborted: Game not playing or already paused", {
            isPlaying: gameState.isPlaying,
            isPaused: gameState.isPaused
        });
        return;
    }
    gameState.isPaused = true;
    cancelAllTimers();
    clearAllStimuli();
    stopSound();
    const pauseScreen = document.getElementById('pauseScreen');
    if (pauseScreen) {
        pauseScreen.style.display = 'flex';
        console.log("pauseGame() - pauseScreen displayed successfully");
    } else {
        console.error("pauseGame() - pauseScreen element not found in DOM");
    }
    gameState.isPlaying = false; // Prevent generateNextStimulus()
    console.log("pauseGame() - Game paused, timers canceled, stimuli cleared", {
        timestamp: Date.now()
    });
}

// ⏸️ 게임 재개 기능
function resumeGame() {
    if (!gameState.isPaused) return;
    gameState.isPaused = false;
    document.getElementById('pauseScreen').style.display = 'none';
    gameState.isPlaying = true; // generateNextStimulus() 다시 시작 가능하도록
    generateNextStimulus(); // 즉시 다음 stimuli 표시
}

// 🖼️ 전체화면 토글 함수
function toggleFullscreen() {
    if (!gameState.isFullscreen) {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        } else if (document.documentElement.mozRequestFullScreen) { /* Firefox */
            document.documentElement.mozRequestFullScreen();
        } else if (document.documentElement.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
            document.documentElement.webkitRequestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) { /* IE/Edge */
            document.documentElement.msRequestFullscreen();
        }
        gameState.isFullscreen = true;
        document.getElementById('fullscreenBtn').textContent = 'Normal';
        console.log('전체화면 모드 활성화! 🌕');
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) { /* Firefox */
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { /* IE/Edge */
            document.msExitFullscreen();
        }
        gameState.isFullscreen = false;
        document.getElementById('fullscreenBtn').textContent = 'Full';
        console.log('일반 화면 모드! ☀️');
    }
}





function handleKeyPress(e) {
    if (gameState.isPaused) return;
    if (e.key === 'Escape') {
        showTitleScreen();
        return;
    }
    if (!gameState.isPlaying) {
        if (e.code === 'Space') {
            startBlock(); // 결과 화면에서도 게임 시작
        }
        return;
    }
    console.log("handleKeyPress() - Key pressed:", e.key, "timestamp:", Date.now(), "canRespond:", gameState.canRespond, "inResponseWindow:", gameState.inResponseWindow);
    if (gameState.stimulusTypes.includes("scene") && e.key.toUpperCase() === gameState.sceneKey && !gameState.sceneTargetProcessed && gameState.canRespond) {
        console.log("handleKeyPress() - Scene key pressed:", e.key, "calling handleSceneResponse()");
        handleSceneResponse();
    }
    if (gameState.stimulusTypes.includes("location") && e.key.toUpperCase() === gameState.locationKey && !gameState.locationTargetProcessed && gameState.canRespond) {
        console.log("handleKeyPress() - Location key pressed:", e.key, "calling handleLocationResponse()");
        handleLocationResponse();
    }
    if (gameState.stimulusTypes.includes("sound") && e.key.toUpperCase() === gameState.soundKey && !gameState.soundTargetProcessed && gameState.canRespond) {
        console.log("handleKeyPress() - Sound key pressed:", e.key, "calling handleSoundResponse()");
        handleSoundResponse();
    }
    if (gameState.stimulusTypes.includes("color") && e.key.toUpperCase() === gameState.colorKey && !gameState.colorTargetProcessed && gameState.canRespond) {
        console.log("handleKeyPress() - Color key pressed:", e.key, "calling handleColorResponse()");
        handleColorResponse();
    }
}



function handleSceneResponse() {
    if (gameState.isPaused) return;
    console.log("handleSceneResponse() - Before processing: canRespond:", gameState.canRespond, "sceneTargetProcessed:", gameState.sceneTargetProcessed, "currentStimulus:", gameState.currentStimulus);
    gameState.sceneTargetProcessed = true;
    if (gameState.currentStimulus <= gameState.nBackLevel) {
        showEarlyResponseFeedback('scene-indicator');
        console.log("handleSceneResponse() - Early response, stimulus:", gameState.currentStimulus, "nBackLevel:", gameState.nBackLevel);
        return;
    }
    gameState.sceneResponses++;
    const currentPresented = gameState.presentedStimulusHistory[gameState.currentStimulus - 1];
    const nBackPresented = gameState.presentedStimulusHistory[gameState.currentStimulus - 1 - gameState.nBackLevel];
    console.log("handleSceneResponse() - Comparing scene: current imageIndex:", currentPresented.imageIndex, "with N-back imageIndex:", nBackPresented.imageIndex);
    const isCorrect = currentPresented.imageIndex === nBackPresented.imageIndex;
    console.log("handleSceneResponse() - Target verification:", {
        predefined: gameState.currentIsSceneTarget,
        dynamic: isCorrect,
        match: gameState.currentIsSceneTarget === isCorrect
    });
    showIndicatorFeedback('scene-indicator', isCorrect);
    if (!isCorrect && gameState.currentIsSceneTarget) {
        gameState.sceneErrors++;
        console.log("handleSceneResponse() - Scene error, sceneErrors:", gameState.sceneErrors, "isCorrect:", isCorrect);
    } else if (isCorrect) {
        console.log("handleSceneResponse() - Correct scene response, isCorrect:", isCorrect);
    } else {
        console.log("handleSceneResponse() - Non-target response, no error, isCorrect:", isCorrect);
    }
    console.log("handleSceneResponse() - After processing: sceneResponses:", gameState.sceneResponses, "sceneErrors:", gameState.sceneErrors, "sceneTargetProcessed:", gameState.sceneTargetProcessed);
}

function handleLocationResponse() {
    if (gameState.isPaused) return;
    console.log("handleLocationResponse() - Before processing: canRespond:", gameState.canRespond, "locationTargetProcessed:", gameState.locationTargetProcessed, "currentStimulus:", gameState.currentStimulus);
    gameState.locationTargetProcessed = true;
    if (gameState.currentStimulus <= gameState.nBackLevel) {
        showEarlyResponseFeedback('location-indicator');
        console.log("handleLocationResponse() - Early response, stimulus:", gameState.currentStimulus, "nBackLevel:", gameState.nBackLevel);
        return;
    }
    gameState.locationResponses++;
    const currentPresented = gameState.presentedStimulusHistory[gameState.currentStimulus - 1];
    const nBackPresented = gameState.presentedStimulusHistory[gameState.currentStimulus - 1 - gameState.nBackLevel];
    console.log("handleLocationResponse() - Comparing location: current panelIndex:", currentPresented.panelIndex, "with N-back panelIndex:", nBackPresented.panelIndex);
    const isCorrect = currentPresented.panelIndex === nBackPresented.panelIndex;
    console.log("handleLocationResponse() - Target verification:", {
        predefined: gameState.currentIsLocationTarget,
        dynamic: isCorrect,
        match: gameState.currentIsLocationTarget === isCorrect
    });
    showIndicatorFeedback('location-indicator', isCorrect);
    if (!isCorrect && gameState.currentIsLocationTarget) {
        gameState.locationErrors++;
        console.log("handleLocationResponse() - Location error, locationErrors:", gameState.locationErrors, "isCorrect:", isCorrect);
    } else if (isCorrect) {
        console.log("handleLocationResponse() - Correct location response, isCorrect:", isCorrect);
    } else {
        console.log("handleLocationResponse() - Non-target response, no error, isCorrect:", isCorrect);
    }
    console.log("handleLocationResponse() - After processing: locationResponses:", gameState.locationResponses, "locationErrors:", gameState.locationErrors, "locationTargetProcessed:", gameState.locationTargetProcessed);
}

function handleSoundResponse() {
    if (gameState.isPaused) return;
    console.log("handleSoundResponse() - Before processing: canRespond:", gameState.canRespond, "soundTargetProcessed:", gameState.soundTargetProcessed, "currentStimulus:", gameState.currentStimulus);
    gameState.soundTargetProcessed = true;
    if (gameState.currentStimulus <= gameState.nBackLevel) {
        showEarlyResponseFeedback('sound-indicator');
        console.log("handleSoundResponse() - Early response, stimulus:", gameState.currentStimulus, "nBackLevel:", gameState.nBackLevel);
        return;
    }
    gameState.soundResponses++;
    const currentPresented = gameState.presentedStimulusHistory[gameState.currentStimulus - 1];
    const nBackPresented = gameState.presentedStimulusHistory[gameState.currentStimulus - 1 - gameState.nBackLevel];
    console.log("handleSoundResponse() - Comparing sound: current soundIndex:", currentPresented.soundIndex, "with N-back soundIndex:", nBackPresented.soundIndex);
    const isCorrect = currentPresented.soundIndex === nBackPresented.soundIndex;
    console.log("handleSoundResponse() - Target verification:", {
        predefined: gameState.currentIsSoundTarget,
        dynamic: isCorrect,
        match: gameState.currentIsSoundTarget === isCorrect
    });
    showIndicatorFeedback('sound-indicator', isCorrect);
    if (!isCorrect && gameState.currentIsSoundTarget) {
        gameState.soundErrors++;
        console.log("handleSoundResponse() - Sound error, soundErrors:", gameState.soundErrors, "isCorrect:", isCorrect);
    } else if (isCorrect) {
        console.log("handleSoundResponse() - Correct sound response, isCorrect:", isCorrect);
    } else {
        console.log("handleSoundResponse() - Non-target response, no error, isCorrect:", isCorrect);
    }
    console.log("handleSoundResponse() - After processing: soundResponses:", gameState.soundResponses, "soundErrors:", gameState.soundErrors, "soundTargetProcessed:", gameState.soundTargetProcessed);
}

function handleColorResponse() {
    if (gameState.isPaused) return;
    console.log("handleColorResponse() - Before processing: canRespond:", gameState.canRespond, "colorTargetProcessed:", gameState.colorTargetProcessed, "currentStimulus:", gameState.currentStimulus);
    gameState.colorTargetProcessed = true;
    if (gameState.currentStimulus <= gameState.nBackLevel) {
        showEarlyResponseFeedback('color-indicator');
        console.log("handleColorResponse() - Early response, stimulus:", gameState.currentStimulus, "nBackLevel:", gameState.nBackLevel);
        return;
    }
    gameState.colorResponses++;
    const currentPresented = gameState.presentedStimulusHistory[gameState.currentStimulus - 1];
    const nBackPresented = gameState.presentedStimulusHistory[gameState.currentStimulus - 1 - gameState.nBackLevel];
    console.log("handleColorResponse() - Comparing color: current colorIndex:", currentPresented.colorIndex, "with N-back colorIndex:", nBackPresented.colorIndex);
    const isCorrect = currentPresented.colorIndex === nBackPresented.colorIndex;
    console.log("handleColorResponse() - Target verification:", {
        predefined: gameState.currentIsColorTarget,
        dynamic: isCorrect,
        match: gameState.currentIsColorTarget === isCorrect
    });
    showIndicatorFeedback('color-indicator', isCorrect);
    if (!isCorrect && gameState.currentIsColorTarget) {
        gameState.colorErrors++;
        console.log("handleColorResponse() - Color error, colorErrors:", gameState.colorErrors, "isCorrect:", isCorrect);
    } else if (isCorrect) {
        console.log("handleColorResponse() - Correct color response, isCorrect:", isCorrect);
    } else {
        console.log("handleColorResponse() - Non-target response, no error, isCorrect:", isCorrect);
    }
    console.log("handleColorResponse() - After processing: colorResponses:", gameState.colorResponses, "colorErrors:", gameState.colorErrors, "colorTargetProcessed:", gameState.colorTargetProcessed);
}






function setTargetGoal(type, value) {
    if (!Number.isInteger(value) || value <= 0) {
        console.error(`Invalid target goal for ${type}: ${value}`);
        return;
    }
    gameState.targetCountGoals[type] = value;
    console.log(`Set target goal for ${type} to ${value}`); // 디버깅 로그 추가
}




function startBlock() {
    console.log("startBlock() - Starting new block at timestamp:", Date.now());
    gameState.isPlaying = true;
    gameState.isPaused = false;
    gameState.currentStimulus = 0;
    gameState.sceneTargets = 0;
    gameState.locationTargets = 0;
    gameState.soundTargets = 0;
    gameState.colorTargets = 0;
    gameState.bothTargets = 0;
    gameState.sceneErrors = 0;
    gameState.locationErrors = 0;
    gameState.soundErrors = 0;
    gameState.colorErrors = 0;
    gameState.sceneHistory = [];
    gameState.locationHistory = [];
    gameState.soundHistory = [];
    gameState.colorHistory = [];
    gameState.recentSceneIndices = [];
    gameState.recentLocationIndices = [];
    gameState.recentSoundIndices = [];
    gameState.recentColorIndices = [];
    gameState.recentTargetTypes = [];
    gameState.recentInterferenceCount = 0;
    gameState.presentedStimulusHistory = [];

    // 타겟 목표 설정
    setTargetGoal("scene", 12);
    setTargetGoal("location", 12);
    setTargetGoal("sound", 6);
    setTargetGoal("color", 12);

    // 자극 시퀀스 생성
    gameState.stimulusSequence = generateStimulusSequence();

    // UI 전환
    console.log("startBlock() - Checking DOM elements before UI transition");
    const titleScreen = document.getElementById('titleScreen');
    const gameScreen = document.getElementById('gameScreen');
    const blockCount = document.getElementById('blockCount');

    if (!titleScreen || !gameScreen || !blockCount) {
        console.error("startBlock() - Missing critical UI elements:", {
            titleScreen: titleScreen ? "Found" : "Missing",
            gameScreen: gameScreen ? "Found" : "Missing",
            blockCount: blockCount ? "Found" : "Missing"
        });
        return;
    }

    titleScreen.style.display = 'none';
    gameScreen.style.display = 'block';
    blockCount.textContent = gameState.currentBlock;
    blockCount.style.display = 'none';

    document.getElementById('totalGamesTodayCountValue').textContent = gameState.totalGamesToday;

    // 인디케이터 표시
    sceneIndicator.style.display = gameState.stimulusTypes.includes("scene") ? 'flex' : 'none';
    soundIndicator.style.display = gameState.stimulusTypes.includes("sound") ? 'flex' : 'none';
    locationIndicator.style.display = gameState.stimulusTypes.includes("location") ? 'flex' : 'none';
    colorIndicator.style.display = gameState.stimulusTypes.includes("color") ? 'flex' : 'none';

    // 1초 후에 첫 자극 제시
    setTimeout(() => {
        if (!gameState.isPaused) {
            generateNextStimulus();
            console.log("startBlock() - First stimulus presented after 1-second delay", {
                timestamp: Date.now()
            });
        } else {
            console.log("startBlock() - Delayed stimulus skipped due to pause", {
                isPaused: gameState.isPaused
            });
        }
    }, 1000);
}








function generateStimulusSequence() {
    console.log("generateStimulusSequence() - Generating stimulus sequence with pre-applied interference");
    const sequence = [];
    const recentLimit = gameState.nBackLevel * 2;
    const maxConsecutiveTargets = 2;
    const maxConsecutiveInterference = 1;
    const interferenceChance = gameState.interferenceProbability || 0.9;

    let sceneTargets = 0;
    let locationTargets = 0;
    let soundTargets = 0;
    let colorTargets = 0;
    let bothTargets = 0;
    const recentTargetTypes = [];
    let recentInterferenceCount = 0;

    // 초기 자극 (nBackLevel만큼 타겟 없이 생성)
    for (let i = 0; i < gameState.nBackLevel; i++) {
        const imageIndex = selectIndexAvoidingRecent(gameState.recentSceneIndices || [], imageTextures.length, recentLimit);
        const panelIndex = selectIndexAvoidingRecent(gameState.recentLocationIndices || [], panels.length, recentLimit);
        const soundIndex = selectIndexAvoidingRecent(gameState.recentSoundIndices || [], gameState.soundSource === "soundFiles" ? gameState.soundFiles.length : gameState.pianoTones.length, recentLimit);
        const colorIndex = selectIndexAvoidingRecent(gameState.recentColorIndices || [], distinctColors.length, recentLimit);

        updateRecentIndices("scene", imageIndex, recentLimit);
        updateRecentIndices("location", panelIndex, recentLimit);
        updateRecentIndices("sound", soundIndex, recentLimit);
        updateRecentIndices("color", colorIndex, recentLimit);

        sequence.push({
            imageIndex,
            panelIndex,
            soundIndex,
            colorIndex,
            targetType: "initial",
            isSceneTarget: false,
            isLocationTarget: false,
            isSoundTarget: false,
            isColorTarget: false
        });
        recentTargetTypes.push("initial");
    }

    // 나머지 자극 생성
    for (let i = gameState.nBackLevel; i < gameState.stimuliPerBlock; i++) {
        let shouldBeSceneTarget = false;
        let shouldBeLocationTarget = false;
        let shouldBeSoundTarget = false;
        let shouldBeColorTarget = false;

        // 남은 타겟 개수 계산
        const remainingStimuli = gameState.stimuliPerBlock - i;
        const sceneRemaining = gameState.targetCountGoals.scene - sceneTargets;
        const locationRemaining = gameState.targetCountGoals.location - locationTargets;
        const soundRemaining = gameState.targetCountGoals.sound - soundTargets;
        const colorRemaining = gameState.targetCountGoals.color - colorTargets;

        // 타겟 생성 확률 조정
        if (gameState.stimulusTypes.includes("scene") && sceneRemaining > 0) {
            shouldBeSceneTarget = Math.random() < (sceneRemaining / remainingStimuli);
        }
        if (gameState.stimulusTypes.includes("location") && locationRemaining > 0) {
            shouldBeLocationTarget = Math.random() < (locationRemaining / remainingStimuli);
        }
        if (gameState.stimulusTypes.includes("sound") && soundRemaining > 0) {
            shouldBeSoundTarget = Math.random() < (soundRemaining / remainingStimuli);
        }
        if (gameState.stimulusTypes.includes("color") && colorRemaining > 0) {
            shouldBeColorTarget = Math.random() < (colorRemaining / remainingStimuli);
        }

        // 연속 타겟 방지
        if (recentTargetTypes.length >= maxConsecutiveTargets) {
            const lastTargets = recentTargetTypes.slice(-maxConsecutiveTargets);
            if (lastTargets.every(type => type === "scene")) shouldBeSceneTarget = false;
            if (lastTargets.every(type => type === "location")) shouldBeLocationTarget = false;
            if (lastTargets.every(type => type === "sound")) shouldBeSoundTarget = false;
            if (lastTargets.every(type => type === "color")) shouldBeColorTarget = false;
        }

        let imageIndex, panelIndex, soundIndex, colorIndex;
        let targetType = "none";

        // 타겟 자극 생성
        if (shouldBeSceneTarget) {
            imageIndex = sequence[i - gameState.nBackLevel].imageIndex;
            targetType = targetType === "none" ? "scene" : "multiple";
            recentTargetTypes.push("scene");
            sceneTargets++;
        } else {
            imageIndex = selectIndexAvoidingRecent(gameState.recentSceneIndices, imageTextures.length, recentLimit);
        }

        if (shouldBeLocationTarget) {
            panelIndex = sequence[i - gameState.nBackLevel].panelIndex;
            targetType = targetType === "none" ? "location" : "multiple";
            recentTargetTypes.push("location");
            locationTargets++;
        } else {
            panelIndex = selectIndexAvoidingRecent(gameState.recentLocationIndices, panels.length, recentLimit);
        }

        if (shouldBeSoundTarget) {
            soundIndex = sequence[i - gameState.nBackLevel].soundIndex;
            targetType = targetType === "none" ? "sound" : "multiple";
            recentTargetTypes.push("sound");
            soundTargets++;
        } else {
            soundIndex = selectIndexAvoidingRecent(gameState.recentSoundIndices, gameState.soundSource === "soundFiles" ? gameState.soundFiles.length : gameState.pianoTones.length, recentLimit);
        }

        if (shouldBeColorTarget) {
            colorIndex = sequence[i - gameState.nBackLevel].colorIndex;
            targetType = targetType === "none" ? "color" : "multiple";
            recentTargetTypes.push("color");
            colorTargets++;
        } else {
            colorIndex = selectIndexAvoidingRecent(gameState.recentColorIndices, distinctColors.length, recentLimit);
        }

        if (targetType === "none") {
            targetType = "non-target";
            recentTargetTypes.push("non-target");
        }

        // 간섭 적용
        let interferedImageIndex = imageIndex;
        let interferedPanelIndex = panelIndex;
        let interferedSoundIndex = soundIndex;
        let interferedColorIndex = colorIndex;

        if (gameState.interferenceType !== "none" && Math.random() < interferenceChance) {
            let interferenceApplied = false;
            if (gameState.interferenceType === "previous" && i > 0) {
                const type = Math.random();
                if (type < 0.25) {
                    interferedImageIndex = sequence[i - 1].imageIndex;
                    interferenceApplied = true;
                    console.log("Interference applied (previous): image, index:", i, "from:", imageIndex, "to:", interferedImageIndex);
                } else if (type < 0.5) {
                    interferedPanelIndex = sequence[i - 1].panelIndex;
                    interferenceApplied = true;
                    console.log("Interference applied (previous): location, index:", i, "from:", panelIndex, "to:", interferedPanelIndex);
                } else if (type < 0.75) {
                    interferedSoundIndex = sequence[i - 1].soundIndex;
                    interferenceApplied = true;
                    console.log("Interference applied (previous): sound, index:", i, "from:", soundIndex, "to:", interferedSoundIndex);
                } else {
                    interferedColorIndex = sequence[i - 1].colorIndex;
                    interferenceApplied = true;
                    console.log("Interference applied (previous): color, index:", i, "from:", colorIndex, "to:", interferedColorIndex);
                }
            } else if (gameState.interferenceType === "cyclic" && i >= gameState.cyclicInterferenceNBackLevel) {
                const cyclicNBackLevel = gameState.cyclicInterferenceNBackLevel;
                const type = Math.random();
                if (type < 0.25) {
                    interferedImageIndex = sequence[i - cyclicNBackLevel].imageIndex;
                    interferenceApplied = true;
                    console.log("Interference applied (cyclic, N=" + cyclicNBackLevel + "): image, index:", i, "from:", imageIndex, "to:", interferedImageIndex);
                } else if (type < 0.5) {
                    interferedPanelIndex = sequence[i - cyclicNBackLevel].panelIndex;
                    interferenceApplied = true;
                    console.log("Interference applied (cyclic, N=" + cyclicNBackLevel + "): location, index:", i, "from:", panelIndex, "to:", interferedPanelIndex);
                } else if (type < 0.75) {
                    interferedSoundIndex = sequence[i - cyclicNBackLevel].soundIndex;
                    interferenceApplied = true;
                    console.log("Interference applied (cyclic, N=" + cyclicNBackLevel + "): sound, index:", i, "from:", soundIndex, "to:", interferedSoundIndex);
                } else {
                    interferedColorIndex = sequence[i - cyclicNBackLevel].colorIndex;
                    interferenceApplied = true;
                    console.log("Interference applied (cyclic, N=" + cyclicNBackLevel + "): color, index:", i, "from:", colorIndex, "to:", interferedColorIndex);
                }
            } else if (gameState.interferenceType === "next" && i < gameState.stimuliPerBlock - 1) {
                const nextStimulus = sequence[i + 1] || {};
                const type = Math.random();
                if (type < 0.25) {
                    interferedImageIndex = nextStimulus.imageIndex || selectIndexAvoidingRecent(gameState.recentSceneIndices, imageTextures.length, recentLimit);
                    interferenceApplied = true;
                    console.log("Interference applied (next): image, index:", i, "from:", imageIndex, "to:", interferedImageIndex);
                } else if (type < 0.5) {
                    interferedPanelIndex = nextStimulus.panelIndex || selectIndexAvoidingRecent(gameState.recentLocationIndices, panels.length, recentLimit);
                    interferenceApplied = true;
                    console.log("Interference applied (next): location, index:", i, "from:", panelIndex, "to:", interferedPanelIndex);
                } else if (type < 0.75) {
                    interferedSoundIndex = nextStimulus.soundIndex || selectIndexAvoidingRecent(gameState.recentSoundIndices, gameState.soundSource === "soundFiles" ? gameState.soundFiles.length : gameState.pianoTones.length, recentLimit);
                    interferenceApplied = true;
                    console.log("Interference applied (next): sound, index:", i, "from:", soundIndex, "to:", interferedSoundIndex);
                } else {
                    interferedColorIndex = nextStimulus.colorIndex || selectIndexAvoidingRecent(gameState.recentColorIndices, distinctColors.length, recentLimit);
                    interferenceApplied = true;
                    console.log("Interference applied (next): color, index:", i, "from:", colorIndex, "to:", interferedColorIndex);
                }
            }
            if (interferenceApplied) {
                recentInterferenceCount++;
                targetType = targetType === "non-target" ? "interference" : targetType;
            } else {
                recentInterferenceCount = 0;
            }
        } else {
            recentInterferenceCount = 0;
        }

        // 타겟 여부 결정 (간섭 후 자극 기준)
        const nBackStimulus = sequence[i - gameState.nBackLevel];
        const isSceneTarget = interferedImageIndex === nBackStimulus.imageIndex;
        const isLocationTarget = interferedPanelIndex === nBackStimulus.panelIndex;
        const isSoundTarget = interferedSoundIndex === nBackStimulus.soundIndex;
        const isColorTarget = interferedColorIndex === nBackStimulus.colorIndex;

        // 타겟 카운트 업데이트
        if (isSceneTarget) sceneTargets++;
        if (isLocationTarget) locationTargets++;
        if (isSoundTarget) soundTargets++;
        if (isColorTarget) colorTargets++;
        if (isSceneTarget && isLocationTarget && isSoundTarget && isColorTarget) bothTargets++;

        sequence.push({
            imageIndex: interferedImageIndex,
            panelIndex: interferedPanelIndex,
            soundIndex: interferedSoundIndex,
            colorIndex: interferedColorIndex,
            targetType: targetType,
            isSceneTarget: isSceneTarget,
            isLocationTarget: isLocationTarget,
            isSoundTarget: isSoundTarget,
            isColorTarget: isColorTarget
        });

        updateRecentIndices("scene", interferedImageIndex, recentLimit);
        updateRecentIndices("location", interferedPanelIndex, recentLimit);
        updateRecentIndices("sound", interferedSoundIndex, recentLimit);
        updateRecentIndices("color", interferedColorIndex, recentLimit);
    }

    console.log("generateStimulusSequence() - Generated sequence with pre-applied interference:", sequence);
    console.log("generateStimulusSequence() - Final target counts:", {
        scene: sceneTargets,
        location: locationTargets,
        sound: soundTargets,
        color: colorTargets,
        both: bothTargets,
        goals: gameState.targetCountGoals
    });
    return sequence;
}





function endBlock() {
    gameState.isPlaying = false;
    gameState.isPaused = false;
    gameState.currentBlock++;
    gameState.totalGamesToday++;
    localStorage.setItem('totalGamesToday', gameState.totalGamesToday);
    const totalSceneErrors = gameState.sceneErrors;
    const totalLocationErrors = gameState.locationErrors;
    const totalSoundErrors = gameState.soundErrors;
    const totalColorErrors = gameState.colorErrors;
    document.getElementById('sceneErrors').textContent = totalSceneErrors;
    document.getElementById('locationErrors').textContent = totalLocationErrors;
    document.getElementById('soundErrors').textContent = totalSoundErrors;
    document.getElementById('colorErrors').textContent = totalColorErrors;
    document.getElementById('resultNLevel').textContent = gameState.nBackLevel;

    // 타겟 목표 달성 여부 체크 (both 포함)
    const unmetGoals = [];
    if (gameState.sceneTargets < gameState.targetCountGoals.scene) unmetGoals.push(`Scene: ${gameState.sceneTargets}/${gameState.targetCountGoals.scene}`);
    if (gameState.locationTargets < gameState.targetCountGoals.location) unmetGoals.push(`Location: ${gameState.locationTargets}/${gameState.targetCountGoals.location}`);
    if (gameState.soundTargets < gameState.targetCountGoals.sound) unmetGoals.push(`Sound: ${gameState.soundTargets}/${gameState.targetCountGoals.sound}`);
    if (gameState.colorTargets < gameState.targetCountGoals.color) unmetGoals.push(`Color: ${gameState.colorTargets}/${gameState.targetCountGoals.color}`);
    if (unmetGoals.length > 0) {
        console.warn("endBlock() - Target goals not fully met:", unmetGoals, "Both targets:", gameState.bothTargets);
    } else {
        console.log("endBlock() - All target goals met:", {
            scene: gameState.sceneTargets,
            location: gameState.locationTargets,
            sound: gameState.soundTargets,
            color: gameState.colorTargets,
            both: gameState.bothTargets
        });
    }

    let levelChange = '';
    let nextNBackLevel = gameState.nBackLevel;
    let totalErrors = totalSceneErrors + totalLocationErrors + totalSoundErrors + totalColorErrors;
    if (!gameState.isLevelLocked) {
        if (gameState.nBackLevel === 1 && totalErrors > 5) {
            levelChange = '즐기는 거야~!😆';
        } else if (totalErrors < 3) {
            nextNBackLevel = gameState.nBackLevel + 1;
            levelChange = '⬆️ 최고야! 레벨업!!♥️🥰';
        } else if (totalErrors > 5) {
            nextNBackLevel = Math.max(1, gameState.nBackLevel - 1);
            levelChange = '⬇️ 괜찮아! 다시 해보자!😉♥️';
        } else {
            levelChange = '➡️ 오 좋아! 킵고잉!👏♥️';
        }
        gameState.nBackLevel = nextNBackLevel;
    } else {
        levelChange = '🔒 레벨 고정됨';
    }
    document.getElementById('levelChange').textContent = levelChange;
    document.getElementById('nBackLevel').textContent = gameState.nBackLevel;
    localStorage.setItem('nBackLevel', gameState.nBackLevel);
    document.getElementById('consecutiveGamesCount').textContent = gameState.consecutiveGames;
    document.getElementById('resultScreen').style.display = 'flex';
    setBackgroundImageToResultScreen();
}




function showTitleScreen() {
    gameState.isPlaying = false;
    gameState.isPaused = false; // ⏸️ 타이틀 화면으로 돌아갈 때 paused 상태 해제
    cancelAllTimers();
    clearAllStimuli();
    clearAllSounds();

    const titleScreen = document.getElementById('titleScreen');
    const gameScreen = document.getElementById('gameScreen');
    const resultScreen = document.getElementById('resultScreen');
    const pauseScreen = document.getElementById('pauseScreen');

    if (titleScreen) {
        titleScreen.style.display = 'flex';
        console.log("showTitleScreen() - titleScreen displayed");
    } else {
        console.error("showTitleScreen() - titleScreen element not found");
    }
    if (gameScreen) {
        gameScreen.style.display = 'none';
        console.log("showTitleScreen() - gameScreen hidden");
    } else {
        console.error("showTitleScreen() - gameScreen element not found");
    }
    if (resultScreen) {
        resultScreen.style.display = 'none';
        console.log("showTitleScreen() - resultScreen hidden");
    }
    if (pauseScreen) {
        pauseScreen.style.display = 'none'; // ⏸️ 일시정지 화면 숨기기
        console.log("showTitleScreen() - pauseScreen hidden");
    }

    document.getElementById('totalGamesTodayCountValue').textContent = gameState.totalGamesToday;

    sceneIndicator.style.display = 'none';
    soundIndicator.style.display = 'none';
    locationIndicator.style.display = 'none';
    colorIndicator.style.display = 'none';
}

function resetStimulusCounter() {
    const stimulusCounter = document.getElementById('stimulus-counter');
    stimulusCounter.textContent = `Stimulus: ${gameState.currentStimulus} / ${gameState.stimuliPerBlock}`;
}

function updateStimulusCounter() {
    const stimulusCounter = document.getElementById('stimulus-counter');
    stimulusCounter.textContent = `Stimulus: ${gameState.currentStimulus + 1} / ${gameState.stimuliPerBlock}`;
}

function setBackgroundImageToResultScreen() {
    const resultBackgroundImage = document.getElementById('resultBackgroundImage');
    if (gameState.resultImageUrl) {
        resultBackgroundImage.style.backgroundImage = `url(${gameState.resultImageUrl})`;
    } else {
        resultBackgroundImage.style.backgroundImage = '';
    }
}

document.getElementById('pressSpaceResult').addEventListener('click', () => {
    if (!gameState.isPlaying) {
        const resultScreen = document.getElementById('resultScreen');
        if (resultScreen) {
            resultScreen.style.display = 'none';
            console.log("pressSpaceResult - resultScreen hidden successfully");
        } else {
            console.error("pressSpaceResult - resultScreen element not found in DOM");
        }
        startBlock();
        console.log("pressSpaceResult - Clicked '게임 계속', starting new block", {
            timestamp: Date.now()
        });
    }
});
document.getElementById('pressSpace').addEventListener('click', () => {
    if (!gameState.isPlaying) {
        startBlock();
    }
});

document.addEventListener('keydown', handleKeyPress);

sceneIndicator.addEventListener('click', () => {
    if (gameState.isPlaying && gameState.stimulusTypes.includes("scene") && !gameState.sceneTargetProcessed && gameState.canRespond) {
        handleSceneResponse();
    }
});

locationIndicator.addEventListener('click', () => {
    if (gameState.isPlaying && gameState.stimulusTypes.includes("location") && !gameState.locationTargetProcessed && gameState.canRespond) {
        handleLocationResponse();
    }
});

soundIndicator.addEventListener('click', () => {
    if (gameState.isPlaying && gameState.stimulusTypes.includes("sound") && !gameState.soundTargetProcessed && gameState.canRespond) {
        handleSoundResponse();
    }
});

colorIndicator.addEventListener('click', () => {
    if (gameState.isPlaying && gameState.stimulusTypes.includes("color") && !gameState.colorTargetProcessed && gameState.canRespond) {
        handleColorResponse();
    }
});

// ⏸️ 일시정지 버튼 이벤트
document.getElementById('pauseBtn').addEventListener('click', pauseGame);

// ⏸️ 게임 재개 버튼 이벤트
document.getElementById('resumeGameBtn').addEventListener('click', resumeGame);

// ⏸️ 메인 메뉴로 돌아가기 버튼 이벤트
document.getElementById('mainMenuBtn').addEventListener('click', showTitleScreen);

// 🖼️ 전체화면 버튼 이벤트
document.getElementById('fullscreenBtn').addEventListener('click', toggleFullscreen);

document.getElementById('setLevelBtn').addEventListener('click', () => {
    const customLevel = parseInt(document.getElementById('customLevel').value);
    if (customLevel >= 1 && customLevel <= 9) {
        gameState.nBackLevel = customLevel;
        document.getElementById('nBackLevel').textContent = gameState.nBackLevel;
        localStorage.setItem('nBackLevel', gameState.nBackLevel);
    }
});

document.getElementById('lockLevelBtn').addEventListener('click', () => {
    gameState.isLevelLocked = !gameState.isLevelLocked;
    const lockButton = document.getElementById('lockLevelBtn');
    lockButton.classList.toggle('locked', gameState.isLevelLocked);
    lockButton.textContent = gameState.isLevelLocked ? '해제' : '고정';
});

document.getElementById('openSettingsBtn').addEventListener('click', () => {
    document.getElementById('settingsPanel').style.display = 'block';
    populateSettings();
});

document.getElementById('closeSettingsBtn').addEventListener('click', () => {
    document.getElementById('settingsPanel').style.display = 'none';
});

document.getElementById('applySettingsBtn').addEventListener('click', () => {
    applySettings();
    document.getElementById('settingsPanel').style.display = 'none';
});

function populateSettings() {
    document.getElementById('sceneStimulus').checked = gameState.stimulusTypes.includes('scene');
    document.getElementById('locationStimulus').checked = gameState.stimulusTypes.includes('location');
    document.getElementById('soundStimulus').checked = gameState.stimulusTypes.includes('sound');
    document.getElementById('colorStimulus').checked = gameState.stimulusTypes.includes('color');
    document.getElementById('stimuliPerBlock').value = gameState.stimuliPerBlock;
    document.getElementById('stimulusDuration').value = gameState.stimulusDuration;
    document.getElementById('stimulusInterval').value = gameState.stimulusInterval;
    document.getElementById('showStimulusCounter').checked = gameState.showStimulusCounter;
    document.getElementById('sceneTargetGoal').value = gameState.targetCountGoals.scene;
    document.getElementById('locationTargetGoal').value = gameState.targetCountGoals.location;
    document.getElementById('soundTargetGoal').value = gameState.targetCountGoals.sound;
    document.getElementById('colorTargetGoal').value = gameState.targetCountGoals.color;
    document.getElementById('interferenceProbability').value = gameState.interferenceProbability;
    document.getElementById('interferenceType').value = gameState.interferenceType;
    document.getElementById('stimulusRandomness').value = gameState.stimulusRandomness;
    document.getElementById('soundVolume').value = gameState.soundVolume;
    document.getElementById('imageBrightness').value = gameState.imageBrightness;
    document.getElementById('imageContrast').value = gameState.imageContrast;
    document.getElementById('imageSourceUrl').value = gameState.imageSourceUrl;
    document.getElementById('resultImageUrl').value = gameState.resultImageUrl;
    document.getElementById('soundSourceSelect').value = gameState.soundSource;
    document.getElementById('soundSourceUrl').value = gameState.soundSourceUrl;
    document.getElementById('sceneKey').value = gameState.sceneKey;
    document.getElementById('locationKey').value = gameState.locationKey;
    document.getElementById('soundKey').value = gameState.soundKey;
    document.getElementById('colorKey').value = gameState.colorKey;
    document.getElementById('cyclicInterferenceNBackLevel').value = gameState.cyclicInterferenceNBackLevel;

    // 버튼 스타일 및 위치 설정
    const buttonStyles = JSON.parse(localStorage.getItem('buttonStyles')) || {
        bgColor: '#ffffff',
        bgOpacity: 0.1,
        textColor: '#ffffff',
        textOpacity: 0.0,
        width: 80,
        height: 80
    };
    document.getElementById('buttonBgColor').value = buttonStyles.bgColor;
    document.getElementById('buttonBgOpacity').value = buttonStyles.bgOpacity;
    document.getElementById('buttonTextColor').value = buttonStyles.textColor;
    document.getElementById('buttonTextOpacity').value = buttonStyles.textOpacity;
    document.getElementById('buttonWidth').value = buttonStyles.width;
    document.getElementById('buttonHeight').value = buttonStyles.height;

    document.getElementById('button1Left').value = parseInt(sceneIndicator.style.left) || 30;
    document.getElementById('button1Bottom').value = parseInt(sceneIndicator.style.bottom) || 40;
    document.getElementById('button2Left').value = parseInt(soundIndicator.style.left) || 130;
    document.getElementById('button2Bottom').value = parseInt(soundIndicator.style.bottom) || 40;
    document.getElementById('button3Right').value = parseInt(locationIndicator.style.right) || 130;
    document.getElementById('button3Bottom').value = parseInt(locationIndicator.style.bottom) || 40;
    document.getElementById('button4Right').value = parseInt(colorIndicator.style.right) || 30;
    document.getElementById('button4Bottom').value = parseInt(colorIndicator.style.bottom) || 40;

    console.log("populateSettings() - Settings populated in UI", { timestamp: Date.now() });
}

function applySettings() {
    const newStimulusTypes = [];
    if (document.getElementById('sceneStimulus').checked) newStimulusTypes.push('scene');
    if (document.getElementById('locationStimulus').checked) newStimulusTypes.push('location');
    if (document.getElementById('soundStimulus').checked) newStimulusTypes.push('sound');
    if (document.getElementById('colorStimulus').checked) newStimulusTypes.push('color');

    if (newStimulusTypes.length < 2 || newStimulusTypes.length > 4) {
        document.getElementById('settingsError').textContent = '자극 유형은 최소 2개, 최대 4개 선택해야 합니다.';
        document.getElementById('settingsError').style.display = 'block';
        return;
    }

    gameState.stimulusTypes = newStimulusTypes;
    gameState.stimuliPerBlock = parseInt(document.getElementById('stimuliPerBlock').value) || 30;
    gameState.stimulusDuration = parseInt(document.getElementById('stimulusDuration').value) || 1000;
    gameState.stimulusInterval = parseInt(document.getElementById('stimulusInterval').value) || 2500;

    gameState.showStimulusCounter = document.getElementById('showStimulusCounter').checked;
    document.getElementById('stimulus-counter').style.display = gameState.showStimulusCounter ? 'block' : 'none';
    gameState.targetCountGoals.scene = parseInt(document.getElementById('sceneTargetGoal').value) || 12;
    gameState.targetCountGoals.location = parseInt(document.getElementById('locationTargetGoal').value) || 12;
    gameState.targetCountGoals.sound = parseInt(document.getElementById('soundTargetGoal').value) || 6;
    gameState.targetCountGoals.color = parseInt(document.getElementById('colorTargetGoal').value) || 12;
    gameState.interferenceProbability = parseFloat(document.getElementById('interferenceProbability').value) || 0.9;
    gameState.interferenceType = document.getElementById('interferenceType').value;
    gameState.stimulusRandomness = parseFloat(document.getElementById('stimulusRandomness').value) || 0.5;
    gameState.soundVolume = parseFloat(document.getElementById('soundVolume').value) || 0.5;
    gameState.imageBrightness = parseFloat(document.getElementById('imageBrightness').value) || 1.0;
    gameState.imageContrast = parseFloat(document.getElementById('imageContrast').value) || 1.0;
    gameState.imageSourceUrl = document.getElementById('imageSourceUrl').value || 'images/';
    gameState.resultImageUrl = document.getElementById('resultImageUrl').value || '';
    gameState.soundSource = document.getElementById('soundSourceSelect').value || 'pianoTones';
    gameState.soundSourceUrl = document.getElementById('soundSourceUrl').value || 'sounds/';
    gameState.cyclicInterferenceNBackLevel = parseInt(document.getElementById('cyclicInterferenceNBackLevel').value) || 2;

    gameState.sceneKey = document.getElementById('sceneKey').value.toUpperCase() || 'S';
    gameState.locationKey = document.getElementById('locationKey').value.toUpperCase() || 'A';
    gameState.soundKey = document.getElementById('soundKey').value.toUpperCase() || 'L';
    gameState.colorKey = document.getElementById('colorKey').value.toUpperCase() || 'K';

    const buttonStyles = {
        bgColor: document.getElementById('buttonBgColor').value,
        bgOpacity: parseFloat(document.getElementById('buttonBgOpacity').value),
        textColor: document.getElementById('buttonTextColor').value,
        textOpacity: parseFloat(document.getElementById('buttonTextOpacity').value),
        width: parseInt(document.getElementById('buttonWidth').value),
        height: parseInt(document.getElementById('buttonHeight').value)
    };

    [sceneIndicator, soundIndicator, locationIndicator, colorIndicator].forEach(indicator => {
        indicator.style.backgroundColor = hexToRgba(buttonStyles.bgColor, buttonStyles.bgOpacity);
        indicator.style.color = hexToRgba(buttonStyles.textColor, buttonStyles.textOpacity);
        indicator.style.width = `${buttonStyles.width}px`;
        indicator.style.height = `${buttonStyles.height}px`;
    });

    sceneIndicator.style.left = `${document.getElementById('button1Left').value}px`;
    sceneIndicator.style.bottom = `${document.getElementById('button1Bottom').value}px`;
    soundIndicator.style.left = `${document.getElementById('button2Left').value}px`;
    soundIndicator.style.bottom = `${document.getElementById('button2Bottom').value}px`;
    locationIndicator.style.right = `${document.getElementById('button3Right').value}px`;
    locationIndicator.style.bottom = `${document.getElementById('button3Bottom').value}px`;
    colorIndicator.style.right = `${document.getElementById('button4Right').value}px`;
    colorIndicator.style.bottom = `${document.getElementById('button4Bottom').value}px`;

    // 실시간으로 이미지 밝기/대비 적용
    panels.forEach(panel => {
        if (panel.stimulusObject) {
            panel.stimulusObject.material.color.setScalar(gameState.imageBrightness);
            panel.stimulusObject.material.opacity = gameState.imageContrast;
            console.log("applySettings() - Updated existing stimulus:", {
                panelIndex: panel.position,
                brightness: gameState.imageBrightness,
                contrast: gameState.imageContrast
            });
        }
    });

    // 실시간으로 사운드 볼륨 적용
    if (gameState.soundStimulus) {
        if (gameState.soundSource === "pianoTones" && gameState.soundStimulus.gainNode) {
            gameState.soundStimulus.gainNode.gain.value = gameState.soundVolume;
            console.log("applySettings() - Updated piano tone volume:", gameState.soundVolume);
        } else if (gameState.soundSource === "soundFiles" && gameState.soundStimulus.setVolume) {
            gameState.soundStimulus.setVolume(gameState.soundVolume);
            console.log("applySettings() - Updated sound file volume:", gameState.soundVolume);
        }
    }

    localStorage.setItem('stimulusTypes', JSON.stringify(gameState.stimulusTypes));
    localStorage.setItem('stimuliPerBlock', gameState.stimuliPerBlock);
    localStorage.setItem('stimulusDuration', gameState.stimulusDuration);
    localStorage.setItem('stimulusInterval', gameState.stimulusInterval);
    localStorage.setItem('showStimulusCounter', gameState.showStimulusCounter);
    localStorage.setItem('targetCountGoals', JSON.stringify(gameState.targetCountGoals));
    localStorage.setItem('interferenceProbability', gameState.interferenceProbability);
    localStorage.setItem('interferenceType', gameState.interferenceType);
    localStorage.setItem('stimulusRandomness', gameState.stimulusRandomness);
    localStorage.setItem('soundVolume', gameState.soundVolume);
    localStorage.setItem('imageBrightness', gameState.imageBrightness);
    localStorage.setItem('imageContrast', gameState.imageContrast);
    localStorage.setItem('imageSourceUrl', gameState.imageSourceUrl);
    localStorage.setItem('resultImageUrl', gameState.resultImageUrl);
    localStorage.setItem('soundSource', gameState.soundSource);
    localStorage.setItem('soundSourceUrl', gameState.soundSourceUrl);
    localStorage.setItem('sceneKey', gameState.sceneKey);
    localStorage.setItem('locationKey', gameState.locationKey);
    localStorage.setItem('soundKey', gameState.soundKey);
    localStorage.setItem('colorKey', gameState.colorKey);
    localStorage.setItem('buttonStyles', JSON.stringify(buttonStyles));
    localStorage.setItem('sceneIndicatorPos', JSON.stringify({ left: sceneIndicator.style.left, bottom: sceneIndicator.style.bottom }));
    localStorage.setItem('soundIndicatorPos', JSON.stringify({ left: soundIndicator.style.left, bottom: soundIndicator.style.bottom }));
    localStorage.setItem('locationIndicatorPos', JSON.stringify({ right: locationIndicator.style.right, bottom: locationIndicator.style.bottom }));
    localStorage.setItem('colorIndicatorPos', JSON.stringify({ right: colorIndicator.style.right, bottom: colorIndicator.style.bottom }));
    localStorage.setItem('cyclicInterferenceNBackLevel', gameState.cyclicInterferenceNBackLevel);

    loadImageTextures();
    document.getElementById('settingsError').style.display = 'none';
    console.log("applySettings() - Settings applied and saved to localStorage", { timestamp: Date.now() });
}



function hexToRgba(hex, opacity) {
    let r = 0, g = 0, b = 0;
    if (hex.length === 7) {
        r = parseInt(hex.slice(1, 3), 16);
        g = parseInt(hex.slice(3, 5), 16);
        b = parseInt(hex.slice(5, 7), 16);
    }
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function loadSettings() {
    // N백 레벨 불러오기
    const savedNBackLevel = localStorage.getItem('nBackLevel');
    if (savedNBackLevel) {
        gameState.nBackLevel = parseInt(savedNBackLevel);
        document.getElementById('nBackLevel').textContent = gameState.nBackLevel;
        document.getElementById('customLevel').value = gameState.nBackLevel;
    }

    // 게임 횟수 및 날짜 불러오기
    const lastGameDate = localStorage.getItem('lastGameDate');
    const today = new Date().toDateString();
    if (lastGameDate !== today) {
        gameState.totalGamesToday = 0;
    } else {
        const savedTotalGames = localStorage.getItem('totalGamesToday');
        gameState.totalGamesToday = savedTotalGames ? parseInt(savedTotalGames) : 0;
    }
    document.getElementById('totalGamesTodayCountValue').textContent = gameState.totalGamesToday;

    // 모든 설정 불러오기
    gameState.stimulusTypes = JSON.parse(localStorage.getItem('stimulusTypes')) || ['scene', 'location'];
    gameState.stimuliPerBlock = parseInt(localStorage.getItem('stimuliPerBlock')) || 30;
    gameState.stimulusDuration = parseInt(localStorage.getItem('stimulusDuration')) || 1000;
    gameState.stimulusInterval = parseInt(localStorage.getItem('stimulusInterval')) || 2500;
    gameState.showStimulusCounter = localStorage.getItem('showStimulusCounter') === 'true';
    gameState.targetCountGoals = JSON.parse(localStorage.getItem('targetCountGoals')) || { scene: 12, location: 12, sound: 6, color: 12 };
    gameState.interferenceProbability = parseFloat(localStorage.getItem('interferenceProbability')) || 0.9;
    gameState.interferenceType = localStorage.getItem('interferenceType') || 'random';
    gameState.stimulusRandomness = parseFloat(localStorage.getItem('stimulusRandomness')) || 0.5;
    gameState.soundVolume = parseFloat(localStorage.getItem('soundVolume')) || 0.5;
    gameState.imageBrightness = parseFloat(localStorage.getItem('imageBrightness')) || 1.0;
    gameState.imageContrast = parseFloat(localStorage.getItem('imageContrast')) || 1.0;
    gameState.imageSourceUrl = localStorage.getItem('imageSourceUrl') || 'images/';
    gameState.resultImageUrl = localStorage.getItem('resultImageUrl') || '';
    gameState.soundSource = localStorage.getItem('soundSource') || 'pianoTones';
    gameState.soundSourceUrl = localStorage.getItem('soundSourceUrl') || 'sounds/';
    gameState.sceneKey = localStorage.getItem('sceneKey') || 'S';
    gameState.locationKey = localStorage.getItem('locationKey') || 'A';
    gameState.soundKey = localStorage.getItem('soundKey') || 'L';
    gameState.colorKey = localStorage.getItem('colorKey') || 'K';
    gameState.cyclicInterferenceNBackLevel = parseInt(localStorage.getItem('cyclicInterferenceNBackLevel')) || 2;

    // 버튼 스타일 불러오기
    const buttonStyles = JSON.parse(localStorage.getItem('buttonStyles')) || {
        bgColor: '#ffffff',
        bgOpacity: 0.1,
        textColor: '#ffffff',
        textOpacity: 0.0,
        width: 80,
        height: 80
    };
    [sceneIndicator, soundIndicator, locationIndicator, colorIndicator].forEach(indicator => {
        indicator.style.backgroundColor = hexToRgba(buttonStyles.bgColor, buttonStyles.bgOpacity);
        indicator.style.color = hexToRgba(buttonStyles.textColor, buttonStyles.textOpacity);
        indicator.style.width = `${buttonStyles.width}px`;
        indicator.style.height = `${buttonStyles.height}px`;
    });

    // 인디케이터 위치 불러오기
    const scenePos = JSON.parse(localStorage.getItem('sceneIndicatorPos')) || { left: '30px', bottom: '40px' };
    const soundPos = JSON.parse(localStorage.getItem('soundIndicatorPos')) || { left: '130px', bottom: '40px' };
    const locationPos = JSON.parse(localStorage.getItem('locationIndicatorPos')) || { right: '130px', bottom: '40px' };
    const colorPos = JSON.parse(localStorage.getItem('colorIndicatorPos')) || { right: '30px', bottom: '40px' };
    sceneIndicator.style.left = scenePos.left;
    sceneIndicator.style.bottom = scenePos.bottom;
    soundIndicator.style.left = soundPos.left;
    soundIndicator.style.bottom = soundPos.bottom;
    locationIndicator.style.right = locationPos.right;
    locationIndicator.style.bottom = locationPos.bottom;
    colorIndicator.style.right = colorPos.right;
    colorIndicator.style.bottom = colorPos.bottom;

    // UI 동기화
    document.getElementById('stimulus-counter').style.display = gameState.showStimulusCounter ? 'block' : 'none';
    populateSettings();

    console.log("loadSettings() - Settings loaded from localStorage", { timestamp: Date.now(), gameState });
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded at timestamp:", Date.now());
    console.log("Initial DOM check:", {
        titleScreen: document.getElementById('titleScreen') ? "Found" : "Missing",
        gameScreen: document.getElementById('gameScreen') ? "Found" : "Missing",
        blockCount: document.getElementById('blockCount') ? "Found" : "Missing"
    });
});


window.onload = () => {
    loadImageTextures();
    loadSettings();
    animate();
    document.getElementById('mainMenuResultBtn').addEventListener('click', showTitleScreen);
    document.getElementById('toggleAdvancedSettingsBtn').addEventListener('click', () => {
        const advancedSettings = document.getElementById('advancedSettings');
        advancedSettings.style.display = advancedSettings.style.display === 'none' ? 'block' : 'none';
    });
    // "버튼 설정" 토글 이벤트 추가
    document.getElementById('toggleButtonSettingsBtn').addEventListener('click', () => {
        const buttonSettings = document.getElementById('buttonSettings');
        buttonSettings.style.display = buttonSettings.style.display === 'none' ? 'block' : 'none';
        console.log("toggleButtonSettingsBtn clicked - Button settings toggled", { display: buttonSettings.style.display, timestamp: Date.now() });
    });
};
