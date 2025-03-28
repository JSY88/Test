 // Web Audio Context Initialization
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

let nearMissHistory = []; // 전역 변수: 니얼미스 이벤트(타겟 아닌 자극에 대한 오반응 추적)를 기록하는 배열


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
buttonStyles: null, // 버튼 스타일 저장용 속성 추가
accuracyHistory: [], // 정확도 기록 배열 추가
nearMissProbability: 0.3, // 니얼미스 발생 확률 (기본 10%)
    nearMissResponses: 0,     // 니얼미스에 반응한 횟수
    sceneTargets: 0,
    locationTargets: 0,
    soundTargets: 0,
    colorTargets: 0,
    bothTargets: 0,
    canRespondScene: true,      // Scene 응답 가능 여부
    canRespondLocation: true,   // Location 응답 가능 여부
    canRespondSound: true,      // Sound 응답 가능 여부
    canRespondColor: true,      // Color 응답 가능 여부
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
    consecutiveGames: 0,
    totalGamesToday: 0,
    stimulusTypes: [],
    soundSource: "pianoTones",
    soundFiles: ['sounds/sound001.wav', 'sounds/sound002.wav', 'sounds/sound003.wav', 'sounds/sound004.wav', 'sounds/sound005.wav', 'sounds/sound006.wav', 'sounds/sound007.wav', 'sounds/sound008.wav'],
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
};

// Fisher-Yates (Knuth) 셔플 알고리즘
function shuffleArray(array) {
    const shuffled = array.slice(); // 원본 배열 복사
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // 요소 교환
    }
    console.log("shuffleArray() - Shuffled array:", shuffled);
    return shuffled;
}

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
 new THREE.Color(0xFF8C00), // 선명한 주황 (Vivid Orange)
 new THREE.Color(0x00008B), // 짙은 파랑 (Deep Blue)
 new THREE.Color(0xFFD700), // 황금색 (Gold)
 new THREE.Color(0x8B008B), // 진한 자주색 (Dark Magenta)
 new THREE.Color(0xFF69B4), // 핫핑크 (Hot Pink)
 new THREE.Color(0x008080), // 청록색 (Teal)
 new THREE.Color(0xFF7F50), // 코랄 (Coral)
 new THREE.Color(0x32CD32), // 연두색 (Lime Green)
 new THREE.Color(0x87CEEB), // 하늘색 (Sky Blue)
 new THREE.Color(0xFFFFFF), // 흰색 (White)
];

function getRandomColor() {
    return distinctColors[Math.floor(Math.random() * distinctColors.length)];
}

function loadImageTextures() {
    imageTextures.length = 0;
    const baseUrl = gameState.imageSourceUrl || "images/";
    const maxRetries = 3;
    const promises = [];

    for (let i = 1; i <= 101; i++) {
        const filename = `image${String(i).padStart(3, '0')}.png`;
        const loadPromise = new Promise((resolve, reject) => {
            let attempts = 0;

            function tryLoad() {
                const texture = imageLoader.load(
                    `${baseUrl}${filename}`,
                    (loadedTexture) => {
                        console.log(`loadImageTextures() - 성공적으로 로드됨: ${baseUrl}${filename}`);
                        resolve({ texture: loadedTexture, color: randomizeStimulusColor ? getRandomColor() : null });
                    },
                    undefined,
                    (err) => {
                        attempts++;
                        console.error(`loadImageTextures() - 로드 실패: ${baseUrl}${filename}, 시도 ${attempts}/${maxRetries}`, err);
                        if (attempts < maxRetries) {
                            setTimeout(tryLoad, 500); // 500ms 후 재시도
                        } else {
                            console.error(`loadImageTextures() - 최종 실패: ${baseUrl}${filename}`);
                            resolve({ texture: null, color: null }); // 실패 시 null 반환
                        }
                    }
                );
            }

            tryLoad();
        });
        promises.push(loadPromise);
    }

    return Promise.all(promises).then(results => {
        results.forEach(result => {
            if (result.texture) {
                imageTextures.push(result);
            }
        });
        console.log(`loadImageTextures() - 총 ${imageTextures.length}/101 이미지 로드 완료`);
        if (imageTextures.length < 101) {
            console.warn(`loadImageTextures() - 일부 이미지 로드 실패, 게임 진행 가능 여부 확인 필요`);
        }
    });
}
function createStimulusImage(imageIndex, panel, colorIndex) {
  clearStimulus(panel);
  const imageGeometry = new THREE.PlaneGeometry(panelWidth * imageScale, panelHeight * imageScale);
  const imageMaterial = new THREE.MeshBasicMaterial({
      map: imageTextures[imageIndex].texture,
      transparent: true,
      blending: THREE.NormalBlending
  });
  if (gameState.stimulusTypes.includes("color")) {
      const colors = distinctColors;
      // colorIndex가 유효한 범위 내에 있는지 확인
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
    gameState.canRespondScene = true;      // Scene 응답 가능으로 초기화
    gameState.canRespondLocation = true;   // Location 응답 가능으로 초기화
    gameState.canRespondSound = true;      // Sound 응답 가능으로 초기화
    gameState.canRespondColor = true;      // Color 응답 가능으로 초기화
    console.log("resetIndicators() - Reset complete, canRespond states:", {
        scene: gameState.canRespondScene,
        location: gameState.canRespondLocation,
        sound: gameState.canRespondSound,
        color: gameState.canRespondColor
    });
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
                gainNode.gain.value = 0.3;
                const now = audioContext.currentTime;
                gainNode.gain.setValueAtTime(0.3, now);
                gainNode.gain.linearRampToValueAtTime(0, now + 0.2);
                oscillator.start();
                gameState.soundStimulus = { oscillator: oscillator, gainNode: gainNode };
                setTimeout(() => {
                    stopSound();
                }, 1000);
                console.log("playSound() - Piano tone:", note, frequency, "Hz, duration: 1000ms");
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
                    sound.setVolume(0.5);
                    sound.play();
                    gameState.soundStimulus = sound;
                    console.log("playSound() - Sound file playing:", soundUrl);
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
    if (gameState.isPaused) return;
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

    gameState.currentStimulus++;

    if (gameState.currentStimulus < gameState.stimuliPerBlock) {
        gameState.currentTimer = setTimeout(() => {
            console.log("Timer - Clearing stimuli and stopping sound, currentStimulus:", gameState.currentStimulus, "timestamp:", Date.now());
            clearAllStimuli();
            stopSound();
            gameState.inResponseWindow = true;
            gameState.canRespondScene = true;
            gameState.canRespondLocation = true;
            gameState.canRespondSound = true;
            gameState.canRespondColor = true;

            gameState.responseWindowTimer = setTimeout(() => {
                console.log("Timer - Response window closed, currentStimulus:", gameState.currentStimulus, "stimulusInterval:", gameState.stimulusInterval, "timestamp:", Date.now());
                gameState.inResponseWindow = false;
                gameState.canRespondScene = false;
                gameState.canRespondLocation = false;
                gameState.canRespondSound = false;
                gameState.canRespondColor = false;

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

                console.log("Timer - Error counts after response window:", {
                    sceneErrors: gameState.sceneErrors,
                    locationErrors: gameState.locationErrors,
                    soundErrors: gameState.soundErrors,
                    colorErrors: gameState.colorErrors
                });

                generateNextStimulus();
            }, gameState.stimulusInterval);
        }, gameState.stimulusDuration);
    } else {
        gameState.currentTimer = setTimeout(() => {
            console.log("Timer - Final stimulus cleared, ending block, timestamp:", Date.now());
            clearAllStimuli();
            stopSound();
            gameState.inResponseWindow = true;
            gameState.canRespondScene = true;
            gameState.canRespondLocation = true;
            gameState.canRespondSound = true;
            gameState.canRespondColor = true;

            gameState.responseWindowTimer = setTimeout(() => {
                console.log("Timer - Response window closed (final), currentStimulus:", gameState.currentStimulus, "stimulusInterval:", gameState.stimulusInterval, "timestamp:", Date.now());
                gameState.inResponseWindow = false;
                gameState.canRespondScene = false;
                gameState.canRespondLocation = false;
                gameState.canRespondSound = false;
                gameState.canRespondColor = false;

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

                console.log("Timer - Final error counts before ending block:", {
                    sceneErrors: gameState.sceneErrors,
                    locationErrors: gameState.locationErrors,
                    soundErrors: gameState.soundErrors,
                    colorErrors: gameState.colorErrors
                });

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
    const guide = document.getElementById('fullscreenGuide'); // 메시지 요소
    if (!gameState.isFullscreen) {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        } else if (document.documentElement.mozRequestFullScreen) {
            document.documentElement.mozRequestFullScreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
            document.documentElement.webkitRequestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) {
            document.documentElement.msRequestFullscreen();
        }
        // iPhone에서만 메시지 표시
        if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
            guide.style.display = 'block';
            console.log('전체화면 안내 메시지 표시됨! 📱');
            setTimeout(() => {
                guide.style.display = 'none';
                console.log('전체화면 안내 메시지 3초 후 숨김! ⏳');
            }, 3000);
        }
        gameState.isFullscreen = true;
        document.getElementById('fullscreenBtn').textContent = 'Normal';
        console.log('전체화면 모드 활성화! 🌕');
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
        guide.style.display = 'none'; // 모드 해제 시 메시지 즉시 숨김
        console.log('전체화면 안내 메시지 숨김 (모드 해제)! 🚪');
        gameState.isFullscreen = false;
        document.getElementById('fullscreenBtn').textContent = 'Full';
        console.log('일반 화면 모드로 복귀! ☀️');
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
          const resultScreen = document.getElementById('resultScreen');
            if (resultScreen) {
                resultScreen.style.display = 'none'; //결과창 숨기기
            }
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
    console.log("handleSceneResponse() - 처리 시작: canRespondScene=", gameState.canRespondScene, "sceneTargetProcessed=", gameState.sceneTargetProcessed, "currentStimulus=", gameState.currentStimulus);

    console.log("handleSceneResponse() - 현재 타겟 상태:", {
        currentIsSceneTarget: gameState.currentIsSceneTarget,
        inResponseWindow: gameState.inResponseWindow
    });

    if (!gameState.canRespondScene || gameState.sceneTargetProcessed) {
        console.log("handleSceneResponse() - 응답 차단: canRespondScene=", gameState.canRespondScene, "sceneTargetProcessed=", gameState.sceneTargetProcessed);
        return;
    }

    gameState.sceneTargetProcessed = true;
    gameState.canRespondScene = false;
    if (gameState.currentStimulus <= gameState.nBackLevel) {
        showEarlyResponseFeedback('scene-indicator');
        console.log("handleSceneResponse() - 조기 응답: stimulus=", gameState.currentStimulus, "nBackLevel=", gameState.nBackLevel);
        return;
    }

    gameState.sceneResponses++;
    const currentPresented = gameState.presentedStimulusHistory[gameState.currentStimulus - 1];
    const nBackPresented = gameState.presentedStimulusHistory[gameState.currentStimulus - 1 - gameState.nBackLevel];

    console.log("handleSceneResponse() - 장면 비교: 현재 imageIndex=", currentPresented.imageIndex, "N백 imageIndex=", nBackPresented.imageIndex);

    const isCorrect = currentPresented.imageIndex === nBackPresented.imageIndex;
    console.log("handleSceneResponse() - 타겟 검증:", {
        predefined: gameState.currentIsSceneTarget,
        dynamic: isCorrect,
        match: gameState.currentIsSceneTarget === isCorrect
    });

    showIndicatorFeedback('scene-indicator', gameState.currentIsSceneTarget && isCorrect);

    if (gameState.currentIsSceneTarget) {
        if (!isCorrect) {
            gameState.sceneErrors++;
            console.log("handleSceneResponse() - 장면 오류 (타겟 놓침): sceneErrors=", gameState.sceneErrors, "isCorrect=", isCorrect);
        } else {
            console.log("handleSceneResponse() - 장면 정답: isCorrect=", isCorrect);
        }
    } else {
        gameState.sceneErrors++;
        console.log("handleSceneResponse() - 장면 오류 (논타겟 오반응): sceneErrors=", gameState.sceneErrors);
        if (currentPresented.isNearMiss) {
            gameState.nearMissResponses++;
            console.log("handleSceneResponse() - 니얼미스 반응 감지: nearMissResponses=", gameState.nearMissResponses);
        }
    }

    console.log("handleSceneResponse() - 처리 완료: sceneResponses=", gameState.sceneResponses, "sceneErrors=", gameState.sceneErrors, "sceneTargetProcessed=", gameState.sceneTargetProcessed);
}








function handleLocationResponse() {
    if (gameState.isPaused) return;
    console.log("handleLocationResponse() - 처리 시작: canRespondLocation=", gameState.canRespondLocation, "locationTargetProcessed=", gameState.locationTargetProcessed, "currentStimulus=", gameState.currentStimulus);

    console.log("handleLocationResponse() - 현재 타겟 상태:", {
        currentIsLocationTarget: gameState.currentIsLocationTarget,
        inResponseWindow: gameState.inResponseWindow
    });

    if (!gameState.canRespondLocation || gameState.locationTargetProcessed) {
        console.log("handleLocationResponse() - 응답 차단: canRespondLocation=", gameState.canRespondLocation, "locationTargetProcessed=", gameState.locationTargetProcessed);
        return;
    }

    gameState.locationTargetProcessed = true;
    gameState.canRespondLocation = false;
    if (gameState.currentStimulus <= gameState.nBackLevel) {
        showEarlyResponseFeedback('location-indicator');
        console.log("handleLocationResponse() - 조기 응답: stimulus=", gameState.currentStimulus, "nBackLevel=", gameState.nBackLevel);
        return;
    }

    gameState.locationResponses++;
    const currentPresented = gameState.presentedStimulusHistory[gameState.currentStimulus - 1];
    const nBackPresented = gameState.presentedStimulusHistory[gameState.currentStimulus - 1 - gameState.nBackLevel];

    console.log("handleLocationResponse() - 위치 비교: 현재 panelIndex=", currentPresented.panelIndex, "N백 panelIndex=", nBackPresented.panelIndex);

    const isCorrect = currentPresented.panelIndex === nBackPresented.panelIndex;
    console.log("handleLocationResponse() - 타겟 검증:", {
        predefined: gameState.currentIsLocationTarget,
        dynamic: isCorrect,
        match: gameState.currentIsLocationTarget === isCorrect
    });

    showIndicatorFeedback('location-indicator', gameState.currentIsLocationTarget && isCorrect);

    if (gameState.currentIsLocationTarget) {
        if (!isCorrect) {
            gameState.locationErrors++;
            console.log("handleLocationResponse() - 위치 오류 (타겟 놓침): locationErrors=", gameState.locationErrors, "isCorrect=", isCorrect);
        } else {
            console.log("handleLocationResponse() - 위치 정답: isCorrect=", isCorrect);
        }
    } else {
        gameState.locationErrors++;
        console.log("handleLocationResponse() - 위치 오류 (논타겟 오반응): locationErrors=", gameState.locationErrors);
        if (currentPresented.isNearMiss) {
            gameState.nearMissResponses++;
            console.log("handleLocationResponse() - 니얼미스 반응 감지: nearMissResponses=", gameState.nearMissResponses);
        }
    }

    console.log("handleLocationResponse() - 처리 완료: locationResponses=", gameState.locationResponses, "locationErrors=", gameState.locationErrors, "locationTargetProcessed=", gameState.locationTargetProcessed);
}

function handleSoundResponse() {
    if (gameState.isPaused) return;
    console.log("handleSoundResponse() - 처리 시작: canRespondSound=", gameState.canRespondSound, "soundTargetProcessed=", gameState.soundTargetProcessed, "currentStimulus=", gameState.currentStimulus);

    console.log("handleSoundResponse() - 현재 타겟 상태:", {
        currentIsSoundTarget: gameState.currentIsSoundTarget,
        inResponseWindow: gameState.inResponseWindow
    });

    if (!gameState.canRespondSound || gameState.soundTargetProcessed) {
        console.log("handleSoundResponse() - 응답 차단: canRespondSound=", gameState.canRespondSound, "soundTargetProcessed=", gameState.soundTargetProcessed);
        return;
    }

    gameState.soundTargetProcessed = true;
    gameState.canRespondSound = false;
    if (gameState.currentStimulus <= gameState.nBackLevel) {
        showEarlyResponseFeedback('sound-indicator');
        console.log("handleSoundResponse() - 조기 응답: stimulus=", gameState.currentStimulus, "nBackLevel=", gameState.nBackLevel);
        return;
    }

    gameState.soundResponses++;
    const currentPresented = gameState.presentedStimulusHistory[gameState.currentStimulus - 1];
    const nBackPresented = gameState.presentedStimulusHistory[gameState.currentStimulus - 1 - gameState.nBackLevel];

    console.log("handleSoundResponse() - 소리 비교: 현재 soundIndex=", currentPresented.soundIndex, "N백 soundIndex=", nBackPresented.soundIndex);

    const isCorrect = currentPresented.soundIndex === nBackPresented.soundIndex;
    console.log("handleSoundResponse() - 타겟 검증:", {
        predefined: gameState.currentIsSoundTarget,
        dynamic: isCorrect,
        match: gameState.currentIsSoundTarget === isCorrect
    });

    showIndicatorFeedback('sound-indicator', gameState.currentIsSoundTarget && isCorrect);

    if (gameState.currentIsSoundTarget) {
        if (!isCorrect) {
            gameState.soundErrors++;
            console.log("handleSoundResponse() - 소리 오류 (타겟 놓침): soundErrors=", gameState.soundErrors, "isCorrect=", isCorrect);
        } else {
            console.log("handleSoundResponse() - 소리 정답: isCorrect=", isCorrect);
        }
    } else {
        gameState.soundErrors++;
        console.log("handleSoundResponse() - 소리 오류 (논타겟 오반응): soundErrors=", gameState.soundErrors);
        if (currentPresented.isNearMiss) {
            gameState.nearMissResponses++;
            console.log("handleSoundResponse() - 니얼미스 반응 감지: nearMissResponses=", gameState.nearMissResponses);
        }
    }

    console.log("handleSoundResponse() - 처리 완료: soundResponses=", gameState.soundResponses, "soundErrors=", gameState.soundErrors, "soundTargetProcessed=", gameState.soundTargetProcessed);
}

function handleColorResponse() {
    if (gameState.isPaused) return;
    console.log("handleColorResponse() - 처리 시작: canRespondColor=", gameState.canRespondColor, "colorTargetProcessed=", gameState.colorTargetProcessed, "currentStimulus=", gameState.currentStimulus);

    console.log("handleColorResponse() - 현재 타겟 상태:", {
        currentIsColorTarget: gameState.currentIsColorTarget,
        inResponseWindow: gameState.inResponseWindow
    });

    if (!gameState.canRespondColor || gameState.colorTargetProcessed) {
        console.log("handleColorResponse() - 응답 차단: canRespondColor=", gameState.canRespondColor, "colorTargetProcessed=", gameState.colorTargetProcessed);
        return;
    }

    gameState.colorTargetProcessed = true;
    gameState.canRespondColor = false;
    if (gameState.currentStimulus <= gameState.nBackLevel) {
        showEarlyResponseFeedback('color-indicator');
        console.log("handleColorResponse() - 조기 응답: stimulus=", gameState.currentStimulus, "nBackLevel=", gameState.nBackLevel);
        return;
    }

    gameState.colorResponses++;
    const currentPresented = gameState.presentedStimulusHistory[gameState.currentStimulus - 1];
    const nBackPresented = gameState.presentedStimulusHistory[gameState.currentStimulus - 1 - gameState.nBackLevel];

    console.log("handleColorResponse() - 색상 비교: 현재 colorIndex=", currentPresented.colorIndex, "N백 colorIndex=", nBackPresented.colorIndex);

    const isCorrect = currentPresented.colorIndex === nBackPresented.colorIndex;
    console.log("handleColorResponse() - 타겟 검증:", {
        predefined: gameState.currentIsColorTarget,
        dynamic: isCorrect,
        match: gameState.currentIsColorTarget === isCorrect
    });

    showIndicatorFeedback('color-indicator', gameState.currentIsColorTarget && isCorrect);

    if (gameState.currentIsColorTarget) {
        if (!isCorrect) {
            gameState.colorErrors++;
            console.log("handleColorResponse() - 색상 오류 (타겟 놓침): colorErrors=", gameState.colorErrors, "isCorrect=", isCorrect);
        } else {
            console.log("handleColorResponse() - 색상 정답: isCorrect=", isCorrect);
        }
    } else {
        gameState.colorErrors++;
        console.log("handleColorResponse() - 색상 오류 (논타겟 오반응): colorErrors=", gameState.colorErrors);
        if (currentPresented.isNearMiss) {
            gameState.nearMissResponses++;
            console.log("handleColorResponse() - 니얼미스 반응 감지: nearMissResponses=", gameState.nearMissResponses);
        }
    }

    console.log("handleColorResponse() - 처리 완료: colorResponses=", gameState.colorResponses, "colorErrors=", gameState.colorErrors, "colorTargetProcessed=", gameState.colorTargetProcessed);
}








function setTargetGoal(type, baseValue) {
    if (!Number.isInteger(baseValue) || baseValue < 0) {
        console.error(`setTargetGoal() - 잘못된 타겟 목표 값: ${type}=${baseValue}`);
        baseValue = 0; // 기본값으로 0 설정
    }
    // 최대 타겟 수는 stimuliPerBlock과 nBackLevel을 고려해 제한
    const maxTargets = Math.floor((gameState.stimuliPerBlock - gameState.nBackLevel) / (gameState.nBackLevel + 1));
    const adjustedValue = Math.max(0, Math.min(baseValue, maxTargets));
    gameState.targetCountGoals[type] = adjustedValue;
    console.log(`setTargetGoal() - ${type} 타겟 목표 설정: 입력값=${baseValue}, 조정값=${adjustedValue}, 최대 가능=${maxTargets}`);
}

function startBlock() {
    console.log("startBlock() - 새로운 블록 시작, 타임스탬프:", Date.now());
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
    nearMissHistory = []; // 니얼미스 기록 초기화
    console.log("startBlock() - nearMissHistory 초기화 완료, 길이:", nearMissHistory.length);

    // 동적 타겟 목표 설정
    setTargetGoal("scene", Math.ceil(3 * (gameState.nBackLevel / 2)));
    setTargetGoal("location", Math.ceil(3 * (gameState.nBackLevel / 2)));
    setTargetGoal("sound", Math.ceil(1 * (gameState.nBackLevel / 2)));
    setTargetGoal("color", Math.ceil(3 * (gameState.nBackLevel / 2)));

    gameState.stimulusSequence = generateStimulusSequence();

    // UI 전환
    console.log("startBlock() - DOM 요소 확인 후 UI 전환 시작");
    const titleScreen = document.getElementById('titleScreen');
    const gameScreen = document.getElementById('gameScreen');
    const blockCount = document.getElementById('blockCount');

    if (!titleScreen || !gameScreen || !blockCount) {
        console.error("startBlock() - 필수 UI 요소 누락:", {
            titleScreen: titleScreen ? "발견" : "누락",
            gameScreen: gameScreen ? "발견" : "누락",
            blockCount: blockCount ? "발견" : "누락"
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
            console.log("startBlock() - 1초 후 첫 자극 제시 완료, 타임스탬프:", Date.now());
        } else {
            console.log("startBlock() - 일시정지 상태로 인해 첫 자극 제시 생략:", {
                isPaused: gameState.isPaused
            });
        }
    }, 1000);
}




function generateStimulusSequence() {
    console.log("generateStimulusSequence() - 시퀀스 생성 시작: 새로운 패턴방지 및 니얼미스 로직 적용");
    console.log("generateStimulusSequence() - nearMissHistory 초기화 상태 확인, 길이:", nearMissHistory.length);
    const sequence = [];
    const recentLimit = gameState.nBackLevel * 2;
    const targetGoals = { scene: 4, location: 4, sound: 2, color: 4 };
    const targetPositions = {};
    const targetTypes = ['scene', 'location', 'sound', 'color'];

    const patternPreventionStrength = gameState.patternPreventionStrength;
    const minTargetInterval = gameState.minTargetInterval;
    const maxTargetInterval = Math.min(gameState.maxTargetInterval, gameState.stimuliPerBlock - gameState.nBackLevel - 1);
    const totalStimuli = gameState.stimuliPerBlock - gameState.nBackLevel;

    targetTypes.forEach(type => {
        targetPositions[type] = selectTargetPositions(totalStimuli, targetGoals[type], minTargetInterval, maxTargetInterval, patternPreventionStrength);
        console.log(`generateStimulusSequence() - ${type} 타겟 위치:`, targetPositions[type]);
    });

    for (let i = 0; i < gameState.nBackLevel; i++) {
        const imageIndex = selectIndexAvoidingRecent(gameState.recentSceneIndices || [], imageTextures.length, recentLimit);
        const panelIndex = selectIndexAvoidingRecent(gameState.recentLocationIndices || [], panels.length, recentLimit);
        const soundIndex = selectIndexAvoidingRecent(gameState.recentSoundIndices || [], gameState.pianoTones.length, recentLimit);
        const colorIndex = selectIndexAvoidingRecent(gameState.recentColorIndices || [], distinctColors.length, recentLimit);

        sequence.push({
            imageIndex, panelIndex, soundIndex, colorIndex,
            targetType: "initial",
            isSceneTarget: false, isLocationTarget: false, isSoundTarget: false, isColorTarget: false,
            isNearMiss: false
        });
        updateRecentIndices("scene", imageIndex, recentLimit);
        updateRecentIndices("location", panelIndex, recentLimit);
        updateRecentIndices("sound", soundIndex, recentLimit);
        updateRecentIndices("color", colorIndex, recentLimit);
    }

    const allTargets = [];
    targetTypes.forEach(type => {
        targetPositions[type].forEach(pos => allTargets.push({ pos, type }));
    });
    allTargets.sort((a, b) => a.pos - b.pos);

    const nearMissTypes = ['N-1', 'N+1', '2N'];

    for (let i = 0; i < totalStimuli; i++) {
        const absoluteIndex = i + gameState.nBackLevel;
        const nBackIndex = absoluteIndex - gameState.nBackLevel;
        const targetsAtPos = allTargets.filter(t => t.pos === i);

        let isSceneTarget = targetsAtPos.some(t => t.type === 'scene');
        let isLocationTarget = targetsAtPos.some(t => t.type === 'location');
        let isSoundTarget = targetsAtPos.some(t => t.type === 'sound');
        let isColorTarget = targetsAtPos.some(t => t.type === 'color');
        let targetType = targetsAtPos.length ? targetsAtPos[0].type : "non-target";

        let imageIndex = isSceneTarget ? sequence[nBackIndex].imageIndex : selectIndexAvoidingRecent(gameState.recentSceneIndices, imageTextures.length, recentLimit);
        let panelIndex = isLocationTarget ? sequence[nBackIndex].panelIndex : selectIndexAvoidingRecent(gameState.recentLocationIndices, panels.length, recentLimit);
        let soundIndex = isSoundTarget ? sequence[nBackIndex].soundIndex : selectIndexAvoidingRecent(gameState.recentSoundIndices, gameState.pianoTones.length, recentLimit);
        let colorIndex = isColorTarget ? sequence[nBackIndex].colorIndex : selectIndexAvoidingRecent(gameState.recentColorIndices, distinctColors.length, recentLimit);

        let isNearMiss = false;
        if (!isSceneTarget && !isLocationTarget && !isSoundTarget && !isColorTarget) {
            const previousStimulus = sequence[absoluteIndex - 1];
            const isPreviousNearMiss = previousStimulus && previousStimulus.isNearMiss;
            const distanceToNearestTarget = Math.min(
                ...allTargets.map(t => Math.abs(t.pos - i))
            );
            if (!isPreviousNearMiss && distanceToNearestTarget > 1 && Math.random() < gameState.nearMissProbability) {
                isNearMiss = true;
                const nearMissType = nearMissTypes[Math.floor(Math.random() * nearMissTypes.length)];
                console.log(`generateStimulusSequence() - 니얼미스 생성: 위치=${absoluteIndex}, 유형=${nearMissType}, 확률=${gameState.nearMissProbability}`);

                if (nearMissType === 'N-1' && absoluteIndex - 1 >= 0) {
                    imageIndex = sequence[absoluteIndex - 1].imageIndex;
                    panelIndex = sequence[absoluteIndex - 1].panelIndex;
                    soundIndex = sequence[absoluteIndex - 1].soundIndex;
                    colorIndex = sequence[absoluteIndex - 1].colorIndex;
                } else if (nearMissType === 'N+1' && absoluteIndex + 1 < gameState.stimuliPerBlock) {
                    const nextStimulus = generateNextStimulusPreview(absoluteIndex + 1, sequence, allTargets);
                    imageIndex = nextStimulus.imageIndex;
                    panelIndex = nextStimulus.panelIndex;
                    soundIndex = nextStimulus.soundIndex;
                    colorIndex = nextStimulus.colorIndex;
                } else if (nearMissType === '2N' && absoluteIndex - 2 * gameState.nBackLevel >= 0) {
                    imageIndex = sequence[absoluteIndex - 2 * gameState.nBackLevel].imageIndex;
                    panelIndex = sequence[absoluteIndex - 2 * gameState.nBackLevel].panelIndex;
                    soundIndex = sequence[absoluteIndex - 2 * gameState.nBackLevel].soundIndex;
                    colorIndex = sequence[absoluteIndex - 2 * gameState.nBackLevel].colorIndex;
                }
                nearMissHistory.push({ type: nearMissType, index: absoluteIndex });
                console.log("generateStimulusSequence() - nearMissHistory에 추가, 현재 길이:", nearMissHistory.length);
            }
        }

        sequence.push({
            imageIndex, panelIndex, soundIndex, colorIndex,
            targetType, isSceneTarget, isLocationTarget, isSoundTarget, isColorTarget,
            isNearMiss
        });

        updateRecentIndices("scene", imageIndex, recentLimit);
        updateRecentIndices("location", panelIndex, recentLimit);
        updateRecentIndices("sound", soundIndex, recentLimit);
        updateRecentIndices("color", colorIndex, recentLimit);
    }

    console.log("generateStimulusSequence() - 시퀀스 생성 완료: 길이=", sequence.length, "니얼미스 개수=", nearMissHistory.length);

    const { patternCounts } = analyzePatterns(sequence);
    console.log("%c패턴 분석 결과: A-B-A: %d, A-B-A-B: %d", "color: red", patternCounts["A-B-A"], patternCounts["A-B-A-B"]);

    return sequence;
}



// N+1 미리보기 함수 (안정성 확보)
function generateNextStimulusPreview(absoluteIndex, sequence, allTargets) {
    const nBackIndex = absoluteIndex - gameState.nBackLevel;
    const targetsAtPos = allTargets.filter(t => t.pos === absoluteIndex - gameState.nBackLevel);
    const recentLimit = gameState.nBackLevel * 2;

    let isSceneTarget = targetsAtPos.some(t => t.type === 'scene');
    let isLocationTarget = targetsAtPos.some(t => t.type === 'location');
    let isSoundTarget = targetsAtPos.some(t => t.type === 'sound');
    let isColorTarget = targetsAtPos.some(t => t.type === 'color');

    const imageIndex = isSceneTarget ? sequence[nBackIndex].imageIndex : selectIndexAvoidingRecent(gameState.recentSceneIndices, imageTextures.length, recentLimit);
    const panelIndex = isLocationTarget ? sequence[nBackIndex].panelIndex : selectIndexAvoidingRecent(gameState.recentLocationIndices, panels.length, recentLimit);
    const soundIndex = isSoundTarget ? sequence[nBackIndex].soundIndex : selectIndexAvoidingRecent(gameState.recentSoundIndices, gameState.pianoTones.length, recentLimit);
    const colorIndex = isColorTarget ? sequence[nBackIndex].colorIndex : selectIndexAvoidingRecent(gameState.recentColorIndices, distinctColors.length, recentLimit);

    return { imageIndex, panelIndex, soundIndex, colorIndex };
}











// N+1 미리보기 함수 (안정성 확보)
function generateNextStimulusPreview(absoluteIndex, sequence, allTargets) {
    const nBackIndex = absoluteIndex - gameState.nBackLevel;
    const targetsAtPos = allTargets.filter(t => t.pos === absoluteIndex - gameState.nBackLevel);
    const recentLimit = gameState.nBackLevel * 2;

    let isSceneTarget = targetsAtPos.some(t => t.type === 'scene');
    let isLocationTarget = targetsAtPos.some(t => t.type === 'location');
    let isSoundTarget = targetsAtPos.some(t => t.type === 'sound');
    let isColorTarget = targetsAtPos.some(t => t.type === 'color');

    const imageIndex = isSceneTarget ? sequence[nBackIndex].imageIndex : selectIndexAvoidingRecent(gameState.recentSceneIndices, imageTextures.length, recentLimit);
    const panelIndex = isLocationTarget ? sequence[nBackIndex].panelIndex : selectIndexAvoidingRecent(gameState.recentLocationIndices, panels.length, recentLimit);
    const soundIndex = isSoundTarget ? sequence[nBackIndex].soundIndex : selectIndexAvoidingRecent(gameState.recentSoundIndices, gameState.pianoTones.length, recentLimit);
    const colorIndex = isColorTarget ? sequence[nBackIndex].colorIndex : selectIndexAvoidingRecent(gameState.recentColorIndices, distinctColors.length, recentLimit);

    return { imageIndex, panelIndex, soundIndex, colorIndex };
}

















// 타겟 위치를 선정하는 함수 (패턴 방지 및 안정성 강화)
function selectTargetPositions(intervalStimuli, targetCount, minInterval) {
    console.log(`selectTargetPositions() - 타겟 위치 선정 시작: 구간 자극 수=${intervalStimuli}, 타겟 수=${targetCount}, 최소 간격=${minInterval}`);
    const positions = [];
    let attempts = 0;
    const maxAttempts = 200;

    while (attempts < maxAttempts) {
        const availablePositions = Array.from({ length: intervalStimuli }, (_, i) => i);
        shuffleArray(availablePositions);

        while (positions.length < targetCount && availablePositions.length > 0) {
            const pos = availablePositions.pop();
            if (positions.every(p => Math.abs(p - pos) >= minInterval)) {
                positions.push(pos);
            }
        }

        if (positions.length < targetCount) {
            console.warn(`selectTargetPositions() - 모든 타겟 배치 불가: 배치된 타겟 ${positions.length}/${targetCount}`);
            return positions.sort((a, b) => a - b);
        }

        positions.sort((a, b) => a - b);
        const diffs = positions.slice(1).map((p, i) => p - positions[i]);
        const isEqualInterval = diffs.length > 1 && diffs.every(d => d === diffs[0]);
        const isConsecutive = diffs.some(d => d === 1);
        const isCyclic = checkCyclicPattern(positions);

        console.log(`selectTargetPositions() - 시도 ${attempts + 1}: 위치=${positions}, 간격=${diffs}`);

        if (!isConsecutive && !isCyclic && (!isEqualInterval || diffs.length <= 2)) {
            console.log(`selectTargetPositions() - 성공: 위치=${positions}, 시도 횟수=${attempts}`);
            return positions;
        }

        positions.length = 0; // 실패 시 초기화
        attempts++;
    }

    console.error(`selectTargetPositions() - ${maxAttempts}번 시도 후 실패`);
    return [];
}


// 주기적 패턴 감지 함수
function checkCyclicPattern(positions) {
    if (positions.length < 4) return false;
    for (let i = 0; i < positions.length - 3; i++) {
        const seq = positions.slice(i, i + 4);
        const diffs = seq.slice(1).map((p, idx) => p - seq[idx]);
        if (diffs[0] === diffs[2] && diffs[0] !== diffs[1]) { // A-B-C-A 패턴 체크
            console.log(`checkCyclicPattern() - Cyclic pattern found: ${seq}, Diffs: ${diffs}`);
            return true;
        }
    }
    return false;
}


function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}



// 패턴 분석 함수: 시퀀스의 패턴 유형과 횟수를 계산
// A-B-A: 동일한 타겟 유형이 한 자극을 사이에 두고 반복되는 경우
// A-B-A-B: 두 쌍의 타겟 유형이 교차 반복되는 경우
function analyzePatterns(sequence) {
    const patternCounts = {
        "A-B-A": 0,
        "A-B-A-B": 0
    };

    const targetTypeSequence = sequence.map(s => s.targetType);

    // A-B-A 패턴 분석
    for (let i = 2; i < targetTypeSequence.length; i++) {
        const last3 = targetTypeSequence.slice(i - 2, i + 1);
        if (last3[0] === last3[2] && last3[0] !== last3[1] && last3[0] !== "non-target" && last3[2] !== "non-target") {
            patternCounts["A-B-A"]++;
        }
    }

    // A-B-A-B 패턴 분석
    for (let i = 3; i < targetTypeSequence.length; i++) {
        const last4 = targetTypeSequence.slice(i - 3, i + 1);
        if (last4[0] === last4[2] && last4[1] === last4[3] && last4[0] !== last4[1] && last4[0] !== "non-target" && last4[2] !== "non-target") {
            patternCounts["A-B-A-B"]++;
        }
    }

    // 디버깅: 패턴 분석 결과를 빨간색으로 출력
    console.log("%c패턴 분석 결과: A-B-A: %d, A-B-A-B: %d", "color: red", patternCounts["A-B-A"], patternCounts["A-B-A-B"]);
    console.log(`analyzePatterns() - 패턴 분석 완료:`, patternCounts);
    return { patternCounts };
}




function findProblematicPositions(sequence) {
    const problematicPositions = [];
    const targetTypeSequence = sequence.map(s => s.targetType);

    for (let i = 2; i < targetTypeSequence.length; i++) {
        const last3 = targetTypeSequence.slice(i - 2, i + 1);
        if (last3[0] === last3[2] && last3[0] !== last3[1] && last3[0] !== "non-target") {
            problematicPositions.push(i - 1);
        }
    }

    for (let i = 3; i < targetTypeSequence.length; i++) {
        const last4 = targetTypeSequence.slice(i - 3, i + 1);
        if (last4[0] === last4[2] && last4[1] === last4[3] && last4[0] !== last4[1] && last4[0] !== "non-target") {
            problematicPositions.push(i - 2);
        }
    }

    console.log(`findProblematicPositions() - 문제 위치 발견:`, problematicPositions);
    return [...new Set(problematicPositions)];
}

function adjustTargetPositions(sequence, problematicPositions) {
    problematicPositions.forEach(pos => {
        const currentType = sequence[pos].targetType;
        const newTargetType = shuffleArray(targetTypes.filter(t => t !== currentType))[0];
        sequence[pos].targetType = newTargetType;
        sequence[pos].isSceneTarget = newTargetType === 'scene';
        sequence[pos].isLocationTarget = newTargetType === 'location';
        sequence[pos].isSoundTarget = newTargetType === 'sound';
        sequence[pos].isColorTarget = newTargetType === 'color';
        console.log(`adjustTargetPositions() - 위치 ${pos} 조정: ${currentType} -> ${newTargetType}`);
    });
}


function endBlock() {
    console.log("endBlock() - 블록 종료 시작");
    gameState.isPlaying = false;
    gameState.isPaused = false;
    gameState.currentBlock++;
    gameState.totalGamesToday++;
    localStorage.setItem('totalGamesToday', gameState.totalGamesToday);

    // 오류 수 집계
    const totalErrors = gameState.sceneErrors + gameState.locationErrors + gameState.soundErrors + gameState.colorErrors;
    if (!gameState.errorHistory) gameState.errorHistory = [];
    gameState.errorHistory.push(totalErrors);
    if (gameState.errorHistory.length > 2) gameState.errorHistory.shift();

    console.log("endBlock() - 오류 집계:", {
        sceneErrors: gameState.sceneErrors,
        locationErrors: gameState.locationErrors,
        soundErrors: gameState.soundErrors,
        colorErrors: gameState.colorErrors,
        totalErrors: totalErrors,
        errorHistory: gameState.errorHistory
    });

    // 니얼미스 통계 계산
    const totalNearMisses = nearMissHistory.length;
    const nearMissResponseRate = totalNearMisses > 0 ? (gameState.nearMissResponses / totalNearMisses) * 100 : 0;
    console.log(`endBlock() - 니얼미스 통계: 반응 횟수=${gameState.nearMissResponses}, 총 니얼미스=${totalNearMisses}, 비율=${nearMissResponseRate.toFixed(2)}%`);

    // DOM 업데이트
    document.getElementById('sceneErrors').textContent = gameState.sceneErrors;
    document.getElementById('locationErrors').textContent = gameState.locationErrors;
    document.getElementById('soundErrors').textContent = gameState.soundErrors;
    document.getElementById('colorErrors').textContent = gameState.colorErrors;
    document.getElementById('resultNLevel').textContent = gameState.nBackLevel;
    document.getElementById('nearMissStats').textContent = `니얼미스 반응: ${gameState.nearMissResponses}/${totalNearMisses} (${nearMissResponseRate.toFixed(2)}%)`;

    // 레벨 조정 로직
    let levelChange = '';
    let nextNBackLevel = gameState.nBackLevel;
    if (!gameState.isLevelLocked) {
        const lastTwo = gameState.errorHistory.slice(-2);
        const lastErrors = lastTwo[lastTwo.length - 1] || 0;
        const secondLastErrors = lastTwo.length > 1 ? lastTwo[0] : null;

        if ((secondLastErrors !== null && secondLastErrors <= 4 && lastErrors <= 4) || lastErrors <= 3) {
            nextNBackLevel = gameState.nBackLevel + 1;
            levelChange = '⬆️ 최고야! 레벨업!!♥️🥰';
            gameState.errorHistory = [];
            console.log("endBlock() - 레벨업 조건 만족");
        } else if ((secondLastErrors !== null && secondLastErrors >= 7 && lastErrors >= 7) || lastErrors >= 9) {
            nextNBackLevel = Math.max(1, gameState.nBackLevel - 1);
            levelChange = '⬇️ 괜찮아! 다시 해보자!😉♥️';
            gameState.errorHistory = [];
            console.log("endBlock() - 레벨다운 조건 만족");
        } else {
            levelChange = '➡️ 오 좋아! 킵고잉!👏♥️';
            console.log("endBlock() - 레벨 유지");
        }
        gameState.nBackLevel = nextNBackLevel;
    } else {
        levelChange = '🔒 레벨 고정됨';
        console.log("endBlock() - 레벨 고정 상태");
    }

    const pressSpaceResult = document.getElementById('pressSpaceResult');
    if (pressSpaceResult) {
        pressSpaceResult.textContent = `다음 라운드 ${gameState.nBackLevel}레벨`;
        pressSpaceResult.style.fontWeight = 'bold';
        pressSpaceResult.style.color = '#000';
        console.log("endBlock() - 게임 계속 버튼 업데이트:", { text: pressSpaceResult.textContent });
    }

    document.getElementById('levelChange').textContent = levelChange;
    document.getElementById('nBackLevel').textContent = gameState.nBackLevel;
    localStorage.setItem('nBackLevel', gameState.nBackLevel);
    document.getElementById('consecutiveGamesCount').textContent = gameState.consecutiveGames;
    document.getElementById('resultScreen').style.display = 'flex';
    setBackgroundImageToResultScreen();

    // 니얼미스 기록 초기화
    nearMissHistory = [];
    gameState.nearMissResponses = 0;
    console.log("endBlock() - nearMissHistory 및 nearMissResponses 초기화 완료, 길이:", nearMissHistory.length);

    console.log("endBlock() - 블록 종료 완료, 다음 N백 레벨:", nextNBackLevel);
}







function showTitleScreen() {
    console.log("showTitleScreen() - 타이틀 화면 표시 시작"); // 디버깅: 함수 시작
    gameState.isPlaying = false;
    gameState.isPaused = false;
    cancelAllTimers();
    clearAllStimuli();
    clearAllSounds();

    const titleScreen = document.getElementById('titleScreen');
    const gameScreen = document.getElementById('gameScreen');
    const resultScreen = document.getElementById('resultScreen');
    const pauseScreen = document.getElementById('pauseScreen');

    if (titleScreen) titleScreen.style.display = 'flex';
    else console.error("showTitleScreen() - titleScreen 요소 없음");
    if (gameScreen) gameScreen.style.display = 'none';
    if (resultScreen) resultScreen.style.display = 'none';
    if (pauseScreen) pauseScreen.style.display = 'none';

    document.getElementById('totalGamesTodayCountValue').textContent = gameState.totalGamesToday;

    const indicators = ['sceneIndicator', 'soundIndicator', 'locationIndicator', 'colorIndicator'];
    indicators.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.style.display = 'none';
    });

    console.log("showTitleScreen() - 타이틀 화면 표시 완료"); // 디버깅: 완료 확인
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

// 기존 click 이벤트 유지
sceneIndicator.addEventListener('click', () => {
    if (gameState.isPlaying && gameState.stimulusTypes.includes("scene") && !gameState.sceneTargetProcessed && gameState.canRespondScene) {
        handleSceneResponse();
    }
});

locationIndicator.addEventListener('click', () => {
    if (gameState.isPlaying && gameState.stimulusTypes.includes("location") && !gameState.locationTargetProcessed && gameState.canRespondLocation) {
        handleLocationResponse();
    }
});

soundIndicator.addEventListener('click', () => {
    if (gameState.isPlaying && gameState.stimulusTypes.includes("sound") && !gameState.soundTargetProcessed && gameState.canRespondSound) {
        handleSoundResponse();
    }
});

colorIndicator.addEventListener('click', () => {
    if (gameState.isPlaying && gameState.stimulusTypes.includes("color") && !gameState.colorTargetProcessed && gameState.canRespondColor) {
        handleColorResponse();
    }
});

// touchstart 이벤트 추가
sceneIndicator.addEventListener('touchstart', (e) => {
    e.preventDefault(); // 기본 동작 방지 (줌 등)
    if (gameState.isPlaying && gameState.stimulusTypes.includes("scene") && !gameState.sceneTargetProcessed && gameState.canRespondScene) {
        handleSceneResponse();
        console.log("touchstart - Scene touched, touches:", e.touches.length, "timestamp:", Date.now());
    }
});

locationIndicator.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameState.isPlaying && gameState.stimulusTypes.includes("location") && !gameState.locationTargetProcessed && gameState.canRespondLocation) {
        handleLocationResponse();
        console.log("touchstart - Location touched, touches:", e.touches.length, "timestamp:", Date.now());
    }
});

soundIndicator.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameState.isPlaying && gameState.stimulusTypes.includes("sound") && !gameState.soundTargetProcessed && gameState.canRespondSound) {
        handleSoundResponse();
        console.log("touchstart - Sound touched, touches:", e.touches.length, "timestamp:", Date.now());
    }
});

colorIndicator.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameState.isPlaying && gameState.stimulusTypes.includes("color") && !gameState.colorTargetProcessed && gameState.canRespondColor) {
        handleColorResponse();
        console.log("touchstart - Color touched, touches:", e.touches.length, "timestamp:", Date.now());
    }
});

// ⏸️ 일시정지 버튼 이벤트
document.getElementById('pauseBtn').addEventListener('click', pauseGame);

// ⏸️ 게임 재개 버튼 이벤트
document.getElementById('resumeGameBtn').addEventListener('click', resumeGame);

// ⏸️ 메인 메뉴로 돌아가기 버튼 이벤트
document.getElementById('mainMenuBtn').addEventListener('click', () => {
    console.log("mainMenuBtn clicked"); // 클릭 확인용 로그
    showTitleScreen();
});

document.getElementById('mainMenuResultBtn').addEventListener('click', () => {
    console.log("mainMenuResultBtn 클릭됨 - 메인메뉴로 이동 시작"); // 디버깅: 클릭 감지
    showTitleScreen();
    console.log("mainMenuResultBtn - showTitleScreen 호출 완료"); // 디버깅: 호출 확인
});



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
    document.getElementById('imageSourceUrl').value = gameState.imageSourceUrl;
    document.getElementById('resultImageUrl').value = gameState.resultImageUrl;
    document.getElementById('button1Assignment').value = gameState.stimulusTypes.includes('scene') ? 'scene' : 'location';
    document.getElementById('button2Assignment').value = gameState.stimulusTypes.includes('sound') ? 'sound' : 'scene';
    document.getElementById('button3Assignment').value = gameState.stimulusTypes.includes('location') ? 'location' : 'sound';
    document.getElementById('button4Assignment').value = gameState.stimulusTypes.includes('color') ? 'color' : 'location';
    document.getElementById('sceneKey').value = gameState.sceneKey;
    document.getElementById('locationKey').value = gameState.locationKey;
    document.getElementById('soundKey').value = gameState.soundKey;
    document.getElementById('colorKey').value = gameState.colorKey;
    document.getElementById('soundSourceSelect').value = gameState.soundSource;
    document.getElementById('soundSourceUrl').value = gameState.soundSourceUrl;
    document.getElementById('button1Left').value = parseInt(sceneIndicator.style.left) || 30;
    document.getElementById('button1Bottom').value = parseInt(sceneIndicator.style.bottom) || 40;
    document.getElementById('button2Left').value = parseInt(soundIndicator.style.left) || 130;
    document.getElementById('button2Bottom').value = parseInt(soundIndicator.style.bottom) || 40;
    document.getElementById('button3Right').value = parseInt(locationIndicator.style.right) || 130;
    document.getElementById('button3Bottom').value = parseInt(locationIndicator.style.bottom) || 40;
    document.getElementById('button4Right').value = parseInt(colorIndicator.style.right) || 30;
    document.getElementById('button4Bottom').value = parseInt(colorIndicator.style.bottom) || 40;
    document.getElementById('buttonBgColor').value = '#ffffff';
    document.getElementById('buttonBgOpacity').value = 0.1;
    document.getElementById('buttonTextColor').value = '#ffffff';
    document.getElementById('buttonTextOpacity').value = 0.2;
    document.getElementById('buttonWidth').value = 80;
    document.getElementById('buttonHeight').value = 80;
document.getElementById('stimuliPerBlock').value = gameState.stimuliPerBlock;
    document.getElementById('stimulusDuration').value = gameState.stimulusDuration;
    document.getElementById('stimulusInterval').value = gameState.stimulusInterval;
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
        console.log("applySettings() - 오류: 자극 유형 개수 부적합", { selectedTypes: newStimulusTypes });
        return;
    }

    gameState.stimulusTypes = newStimulusTypes;
    gameState.stimuliPerBlock = Math.min(Math.max(parseInt(document.getElementById('stimuliPerBlock').value) || 30, 10), 100);
    gameState.stimulusDuration = Math.min(Math.max(parseInt(document.getElementById('stimulusDuration').value) || 1000, 500), 5000);
    gameState.stimulusInterval = Math.min(Math.max(parseInt(document.getElementById('stimulusInterval').value) || 2500, 1000), 10000);

    gameState.patternPreventionStrength = Math.min(Math.max(parseInt(document.getElementById('patternPreventionStrength').value) || 5, 0), 10);
    gameState.minTargetInterval = Math.min(Math.max(parseInt(document.getElementById('minTargetInterval').value) || 2, 1), 20);
    gameState.maxTargetInterval = Math.min(Math.max(parseInt(document.getElementById('maxTargetInterval').value) || 10, 5), 50);
    if (gameState.maxTargetInterval < gameState.minTargetInterval) {
        gameState.maxTargetInterval = gameState.minTargetInterval + 1;
        console.log("applySettings() - 경고: 최대 간격이 최소 간격보다 작아 조정됨", { maxTargetInterval: gameState.maxTargetInterval });
    }

    gameState.nearMissProbability = Math.min(Math.max(parseFloat(document.getElementById('nearMissProbability').value) || 0.1, 0), 1);

    gameState.imageSourceUrl = document.getElementById('imageSourceUrl').value;
    gameState.resultImageUrl = document.getElementById('resultImageUrl').value;
    gameState.soundSource = document.getElementById('soundSourceSelect').value;
    gameState.soundSourceUrl = document.getElementById('soundSourceUrl').value;

    gameState.sceneKey = document.getElementById('sceneKey').value.toUpperCase();
    gameState.locationKey = document.getElementById('locationKey').value.toUpperCase();
    gameState.soundKey = document.getElementById('soundKey').value.toUpperCase();
    gameState.colorKey = document.getElementById('colorKey').value.toUpperCase();

    const bgColor = document.getElementById('buttonBgColor').value;
    const bgOpacity = Math.min(Math.max(parseFloat(document.getElementById('buttonBgOpacity').value) || 0.1, 0), 1);
    const textColor = document.getElementById('buttonTextColor').value;
    const textOpacity = Math.min(Math.max(parseFloat(document.getElementById('buttonTextOpacity').value) || 0.0, 0), 1);
    const width = Math.max(parseInt(document.getElementById('buttonWidth').value) || 80, 20);
    const height = Math.max(parseInt(document.getElementById('buttonHeight').value) || 80, 20);

    gameState.buttonStyles = { bgColor, bgOpacity, textColor, textOpacity, width, height };

    [sceneIndicator, soundIndicator, locationIndicator, colorIndicator].forEach(indicator => {
        indicator.style.left = null;
        indicator.style.right = null;
        indicator.style.bottom = null;
    });

    sceneIndicator.style.left = `${document.getElementById('button1Left').value}px`;
    sceneIndicator.style.bottom = `${document.getElementById('button1Bottom').value}px`;
    soundIndicator.style.left = `${document.getElementById('button2Left').value}px`;
    soundIndicator.style.bottom = `${document.getElementById('button2Bottom').value}px`;
    locationIndicator.style.right = `${document.getElementById('button3Right').value}px`;
    locationIndicator.style.bottom = `${document.getElementById('button3Bottom').value}px`;
    colorIndicator.style.right = `${document.getElementById('button4Right').value}px`;
    colorIndicator.style.bottom = `${document.getElementById('button4Bottom').value}px`;

    [sceneIndicator, soundIndicator, locationIndicator, colorIndicator].forEach(indicator => {
        indicator.style.backgroundColor = hexToRgba(bgColor, bgOpacity);
        indicator.style.color = hexToRgba(textColor, textOpacity);
        indicator.style.width = `${width}px`;
        indicator.style.height = `${height}px`;
    });

    localStorage.setItem('stimulusTypes', JSON.stringify(gameState.stimulusTypes));
    localStorage.setItem('stimuliPerBlock', gameState.stimuliPerBlock);
    localStorage.setItem('stimulusDuration', gameState.stimulusDuration);
    localStorage.setItem('stimulusInterval', gameState.stimulusInterval);
    localStorage.setItem('patternPreventionStrength', gameState.patternPreventionStrength);
    localStorage.setItem('minTargetInterval', gameState.minTargetInterval);
    localStorage.setItem('maxTargetInterval', gameState.maxTargetInterval);
    localStorage.setItem('nearMissProbability', gameState.nearMissProbability);
    localStorage.setItem('imageSourceUrl', gameState.imageSourceUrl);
    localStorage.setItem('resultImageUrl', gameState.resultImageUrl);
    localStorage.setItem('soundSource', gameState.soundSource);
    localStorage.setItem('soundSourceUrl', gameState.soundSourceUrl);
    localStorage.setItem('sceneKey', gameState.sceneKey);
    localStorage.setItem('locationKey', gameState.locationKey);
    localStorage.setItem('soundKey', gameState.soundKey);
    localStorage.setItem('colorKey', gameState.colorKey);
    localStorage.setItem('sceneIndicatorPos', JSON.stringify({ left: sceneIndicator.style.left, bottom: sceneIndicator.style.bottom }));
    localStorage.setItem('soundIndicatorPos', JSON.stringify({ left: soundIndicator.style.left, bottom: soundIndicator.style.bottom }));
    localStorage.setItem('locationIndicatorPos', JSON.stringify({ right: locationIndicator.style.right, bottom: locationIndicator.style.bottom }));
    localStorage.setItem('colorIndicatorPos', JSON.stringify({ right: colorIndicator.style.right, bottom: colorIndicator.style.bottom }));
    localStorage.setItem('buttonStyles', JSON.stringify(gameState.buttonStyles));

    document.getElementById('settingsError').style.display = 'none';
    loadImageTextures();

    console.log("applySettings() - 설정 저장 완료", {
        stimulusTypes: gameState.stimulusTypes,
        stimuliPerBlock: gameState.stimuliPerBlock,
        stimulusDuration: gameState.stimulusDuration,
        stimulusInterval: gameState.stimulusInterval,
        patternPreventionStrength: gameState.patternPreventionStrength,
        minTargetInterval: gameState.minTargetInterval,
        maxTargetInterval: gameState.maxTargetInterval,
        nearMissProbability: gameState.nearMissProbability,
        buttonStyles: gameState.buttonStyles,
        timestamp: Date.now()
    });
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
    const savedNBackLevel = localStorage.getItem('nBackLevel');
    if (savedNBackLevel) {
        gameState.nBackLevel = Math.min(Math.max(parseInt(savedNBackLevel), 1), 9);
        document.getElementById('nBackLevel').textContent = gameState.nBackLevel;
        document.getElementById('customLevel').value = gameState.nBackLevel;
    }

    const lastGameDate = localStorage.getItem('lastGameDate');
    const today = new Date().toDateString();
    if (lastGameDate !== today) {
        gameState.totalGamesToday = 0;
        localStorage.setItem('lastGameDate', today);
    } else {
        const savedTotalGames = localStorage.getItem('totalGamesToday');
        gameState.totalGamesToday = savedTotalGames ? parseInt(savedTotalGames) : 0;
    }
    document.getElementById('totalGamesTodayCountValue').textContent = gameState.totalGamesToday;

    gameState.stimulusTypes = JSON.parse(localStorage.getItem('stimulusTypes')) || ['scene', 'location'];
    gameState.stimuliPerBlock = Math.min(Math.max(parseInt(localStorage.getItem('stimuliPerBlock')) || 30, 10), 100);
    gameState.stimulusDuration = Math.min(Math.max(parseInt(localStorage.getItem('stimulusDuration')) || 1000, 500), 5000);
    gameState.stimulusInterval = Math.min(Math.max(parseInt(localStorage.getItem('stimulusInterval')) || 2500, 1000), 10000);

    gameState.patternPreventionStrength = Math.min(Math.max(parseInt(localStorage.getItem('patternPreventionStrength')) || 5, 0), 10);
    gameState.minTargetInterval = Math.min(Math.max(parseInt(localStorage.getItem('minTargetInterval')) || 2, 1), 20);
    gameState.maxTargetInterval = Math.min(Math.max(parseInt(localStorage.getItem('maxTargetInterval')) || 10, 5), 50);
    if (gameState.maxTargetInterval < gameState.minTargetInterval) {
        gameState.maxTargetInterval = gameState.minTargetInterval + 1;
        console.log("loadSettings() - 경고: 최대 간격이 최소 간격보다 작아 조정됨", { maxTargetInterval: gameState.maxTargetInterval });
    }

    gameState.nearMissProbability = Math.min(Math.max(parseFloat(localStorage.getItem('nearMissProbability')) || 0.1, 0), 1);

    gameState.imageSourceUrl = localStorage.getItem('imageSourceUrl') || 'images/';
    gameState.resultImageUrl = localStorage.getItem('resultImageUrl') || '';
    gameState.soundSource = localStorage.getItem('soundSource') || 'pianoTones';
    gameState.soundSourceUrl = localStorage.getItem('soundSourceUrl') || 'sounds/';
    gameState.sceneKey = localStorage.getItem('sceneKey') || 'S';
    gameState.locationKey = localStorage.getItem('locationKey') || 'A';
    gameState.soundKey = localStorage.getItem('soundKey') || 'L';
    gameState.colorKey = localStorage.getItem('colorKey') || 'K';

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

    gameState.buttonStyles = JSON.parse(localStorage.getItem('buttonStyles')) || {
        bgColor: '#ffffff',
        bgOpacity: 0.1,
        textColor: '#ffffff',
        textOpacity: 0.0,
        width: 80,
        height: 80
    };
    [sceneIndicator, soundIndicator, locationIndicator, colorIndicator].forEach(indicator => {
        indicator.style.backgroundColor = hexToRgba(gameState.buttonStyles.bgColor, gameState.buttonStyles.bgOpacity);
        indicator.style.color = hexToRgba(gameState.buttonStyles.textColor, gameState.buttonStyles.textOpacity);
        indicator.style.width = `${gameState.buttonStyles.width}px`;
        indicator.style.height = `${gameState.buttonStyles.height}px`;
    });

    populateSettings();

    console.log("loadSettings() - 설정 불러오기 완료", {
        stimulusTypes: gameState.stimulusTypes,
        stimuliPerBlock: gameState.stimuliPerBlock,
        stimulusDuration: gameState.stimulusDuration,
        stimulusInterval: gameState.stimulusInterval,
        patternPreventionStrength: gameState.patternPreventionStrength,
        minTargetInterval: gameState.minTargetInterval,
        maxTargetInterval: gameState.maxTargetInterval,
        nearMissProbability: gameState.nearMissProbability,
        buttonStyles: gameState.buttonStyles,
        timestamp: Date.now()
    });
}



window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    console.log("window.onresize - 뷰포트 업데이트: width:", window.innerWidth, "height:", window.innerHeight);
    renderer.render(scene, camera); // 즉시 렌더링 호출
});

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    document.getElementById('fullscreenGuide').style.display = 'block';
    console.log("아이폰 감지 - 전체화면 안내 표시");
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
    console.log("Window fully loaded (including resources) at timestamp:", Date.now());
    loadImageTextures().then(() => {
        loadSettings();
        animate();

    // 고급 설정 토글 버튼 이벤트 리스너
    const toggleAdvancedSettingsBtn = document.getElementById('toggleAdvancedSettingsBtn');
    if (toggleAdvancedSettingsBtn) {
        toggleAdvancedSettingsBtn.addEventListener('click', () => {
            const advancedSettings = document.getElementById('advancedSettings');
            if (advancedSettings) {
                advancedSettings.style.display = advancedSettings.style.display === 'none' ? 'block' : 'none';
                console.log("toggleAdvancedSettingsBtn clicked - Advanced settings visibility:", advancedSettings.style.display);
            } else {
                console.error("advancedSettings element not found in DOM");
            }
        });
        console.log("toggleAdvancedSettingsBtn event listener added successfully");
    } else {
        console.error("toggleAdvancedSettingsBtn not found in DOM at window.onload");
    }

    // 버튼 설정 토글 버튼 이벤트 리스너
    const toggleButtonSettingsBtn = document.getElementById('toggleButtonSettingsBtn');
    if (toggleButtonSettingsBtn) {
        toggleButtonSettingsBtn.addEventListener('click', () => {
            const buttonSettings = document.getElementById('buttonSettings');
            if (buttonSettings) {
                buttonSettings.style.display = buttonSettings.style.display === 'none' ? 'block' : 'none';
                console.log("toggleButtonSettingsBtn clicked - Button settings visibility:", buttonSettings.style.display);
            } else {
                console.error("buttonSettings element not found in DOM");
            }
        });
        console.log("toggleButtonSettingsBtn event listener added successfully");
    } else {
        console.error("toggleButtonSettingsBtn not found in DOM at window.onload");
    }

    // 설정 패널 닫기 버튼 이벤트 리스너
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    if (closeSettingsBtn) {
        closeSettingsBtn.addEventListener('click', () => {
            const settingsPanel = document.getElementById('settingsPanel');
            const advancedSettings = document.getElementById('advancedSettings');
            const buttonSettings = document.getElementById('buttonSettings');
            if (settingsPanel) {
                settingsPanel.style.display = 'none';
                console.log("closeSettingsBtn clicked - Settings panel closed");
            } else {
                console.error("settingsPanel not found in DOM");
            }
            if (advancedSettings) {
                advancedSettings.style.display = 'none';
                console.log("closeSettingsBtn clicked - Advanced settings hidden");
            }
            if (buttonSettings) {
                buttonSettings.style.display = 'none';
                console.log("closeSettingsBtn clicked - Button settings hidden");
            }
        });
        console.log("closeSettingsBtn event listener added successfully");
    } else {
        console.error("closeSettingsBtn not found in DOM at window.onload");
    }
}).catch(err => {
        console.error("window.onload - 이미지 로딩 중 오류 발생:", err);
    });
};
