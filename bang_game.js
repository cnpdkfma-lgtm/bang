// bang_game.js: 게임 핵심 로직

// 1. 전역 변수 선언 (값을 할당하지 않음. HTML에서 접근 가능하도록 let 사용)
let canvas;
let ctx;
let WIDTH = 850;
let HEIGHT = 1500;
let bang = {};
let bangImg;

// 이미지 및 게임 상태 변수
let images = {}; 
let imagesLoaded = 0;
let totalImages = 0;

let patients = [];
let score = 0;
let stage = 1;
let speed = 4;
let currentProtection = null;
let gameStarted = false; 
let gameOver = false;
let passedPatients = 0;
let nameEntered = false;
let showHeart = false;
let heartTimer = 0;
let stageUpTimer = 0;
let stageUpHandled = false;
let isRankingScreen = false;
let topRankings = [];

const imageSources = {
    bang_default: "img/bang.png",
    bang_dental: "img/bang_dental.png",
    bang_n95: "img/bang_n95.png",
    bang_gown: "img/bang_gown.png",
    bang_needle: "img/bang_needle.png",
    bang_over: "img/bang_over.png",
    pt1: "img/pt1.png",
    pt2: "img/pt2.png",
    pt3: "img/pt3.png",
    pt4: "img/pt4.png",
    background: "img/bg.jpg",
    startgame: "img/start.jpg",
    overgame: "img/over.jpg",
    ranking: "img/ranking.jpg"
};

const protectionMap = {
    "덴탈마스크": ["백일해", "인플루엔자", "성홍열", "유행성 이하선염", "풍진"],
    "N95": ["결핵", "수두", "홍역", "파종성 대상포진"],
    "가운+장갑": ["CRE", "Candida auris", "MRSA", "옴", "C.difficile", "MRAB", "MRPA", "Rotavirus"],
    "안전바늘": ["C형간염", "B형간염", "HIV"]
};

// 2. 이미지 로딩 및 시작 함수
function loadImagesAndStart() {
    totalImages = Object.keys(imageSources).length;
    imagesLoaded = 0;
    
    // 비동기 이미지 로딩
    for (const key in imageSources) {
        const img = new Image();
        img.src = imageSources[key];
        img.onload = () => {
            imagesLoaded++;
            if (imagesLoaded === totalImages) {
                // 모든 이미지 로드 완료 시
                bangImg = images.bang_default;
                resetGame();
                // gameStarted = false 상태로 gameLoop 시작하여 시작 화면을 그림
                requestAnimationFrame(gameLoop);
            }
        };
        images[key] = img;
    }
}

// 3. 캔버스 초기화 및 이벤트 연결 (가장 중요한 진입점!)
window.startGame = function() {
    // 캔버스 초기화 (HTML 요소 로드 후에 실행되어야 함)
    canvas = document.getElementById('gameCanvas');
    
    if (!canvas) {
        console.error("gameCanvas 요소를 찾을 수 없습니다. HTML 로드 순서를 확인하세요.");
        return;
    }
    
    ctx = canvas.getContext('2d');
    
    // 캔버스 크기 및 WIDTH, HEIGHT 설정
    canvas.width = 850;
    canvas.height = 1500;
    WIDTH = canvas.width;
    HEIGHT = canvas.height;

    // bang 객체 초기화 (WIDTH/HEIGHT 사용)
    bang = { x: WIDTH / 2 - 100, y: HEIGHT - 415, width: 200, height: 170 };
    
    // 이벤트 리스너 연결
    canvas.removeEventListener("click", handleInput); // 중복 방지
    canvas.removeEventListener("touchstart", handleInput); // 중복 방지
    canvas.addEventListener("click", handleInput);
    canvas.addEventListener("touchstart", function(e) {
        e.preventDefault(); 
        handleInput(e);
    }, { passive: false });
    
    // 이미지 로드 시작
    loadImagesAndStart();
    gameStarted = false; // 최초 상태는 시작 화면
}

// 4. 입력 핸들러
function handleInput(e) {
    if (!canvas || !WIDTH) return; // 초기화 전에 실행 방지
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX, clientY;

    if (e.type.startsWith("touch")) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }

    const mx = (clientX - rect.left) * scaleX;
    const my = (clientY - rect.top) * scaleY;

    if (isRankingScreen) {
        // 랭킹 화면에서 클릭 시 홈 버튼으로 돌아가는 로직 추가 가능
        return;
    }
    
    if (!gameStarted) {
        // 게임 시작 버튼 클릭 (캔버스 내부 버튼) - 시작 화면의 이미지에 맞춰 좌표 수정
        if (mx >= WIDTH / 2 - 225 && mx <= WIDTH / 2 + 222 &&
            my >= HEIGHT / 2 + 390 && my <= HEIGHT / 2 + 550) {
            console.log("캔버스 내 게임 시작 버튼 클릭됨");
            gameStarted = true;
            resetGame();
            requestAnimationFrame(gameLoop);
        }
    }
    else if (gameOver) {
        // 다시 시작 버튼
        if (mx >= WIDTH / 2 - 245 && mx <= WIDTH / 2 + 220 &&
            my >= HEIGHT / 2 - 116 && my <= HEIGHT / 2) {
            console.log("다시 시작 버튼 클릭됨");
            gameStarted = true;
            resetGame();
            requestAnimationFrame(gameLoop);
        }

        // 그만하기 버튼 (랭킹 화면으로 전환)
        else if (mx >= WIDTH / 2 - 245 && mx <= WIDTH / 2 + 220 &&
                    my >= HEIGHT / 2 + 17 && my <= HEIGHT / 2 + 135) {
            console.log("그만하기 버튼 클릭됨 - 랭킹 화면으로 이동");
            isRankingScreen = true;
            showRankingScreen(); 
            return;
        }
    }
    else {
        // 게임 중일 때 보호구 버튼 클릭 처리
        setProtectionByClick(mx, my);
    }
}

// 5. 유틸리티 및 보조 함수
function drawTextWithBackground(text, x, y, font = "10px NanumGothic", textColor, bgColor) {
    if (!ctx) return;
    ctx.font = font;
    ctx.textBaseline = "top";
    const padding = 5;

    const textMetrics = ctx.measureText(text);
    const textWidth = textMetrics.width;

    const fontSizeMatch = font.match(/\d+/);
    const textHeight = fontSizeMatch ? parseInt(fontSizeMatch[0], 10) : 10;

    ctx.fillStyle = bgColor;
    ctx.fillRect(x - padding, y - padding, textWidth + padding * 2, textHeight + padding * 2);

    ctx.fillStyle = textColor;
    ctx.fillText(text, x, y);
}

function showRankingScreen() {
    if (!ctx) return;
    
    ctx.drawImage(images.ranking, 0, 0, WIDTH, HEIGHT);

    if (window.loadTopRankings) {
        window.loadTopRankings((savedRankings) => {
            topRankings = savedRankings; 
            
            topRankings.forEach((entry, index) => {
                const line = `${entry.department}, ${entry.name}, ${entry.score}점`;
                ctx.font = "bold 40px NanumGothic";
                ctx.fillStyle = "#00003E";
                ctx.fillText(line, WIDTH / 2 - 185, HEIGHT / 2 - 460 + index * 180);
            });
        });
    } else {
        ctx.fillStyle = 'red';
        ctx.font = '50px NanumGothic';
        ctx.fillText('랭킹 기능 로드 실패', WIDTH/2 - 200, HEIGHT/2);
    }
}

function setProtectionByClick(mx, my) {
    if (mx >= WIDTH / 2 - 360 && mx <= WIDTH / 2 - 360 + 159 && my >= HEIGHT - 240 && my <= HEIGHT - 240 + 234) {
        currentProtection = "덴탈마스크";
        bangImg = images.bang_dental;
    } else if (mx >= WIDTH / 2 - 170 && mx <= WIDTH / 2 - 170 + 150 && my >= HEIGHT - 240 && my <= HEIGHT - 240 + 234) {
        currentProtection = "N95";
        bangImg = images.bang_n95;
    } else if (mx >= WIDTH / 2 + 10 && mx <= WIDTH / 2 + 10 + 150 && my >= HEIGHT - 240 && my <= HEIGHT - 240 + 234) {
        currentProtection = "가운+장갑";
        bangImg = images.bang_gown;
    } else if (mx >= WIDTH / 2 + 190 && mx <= WIDTH / 2 + 190 + 140 && my >= HEIGHT - 240 && my <= HEIGHT - 240 + 234) {
        currentProtection = "안전바늘";
        bangImg = images.bang_needle;
    }
}


function createPatient(offset = 0) {
    let diseases = ["인플루엔자", "성홍열", "결핵", "수두", "옴", "MRSA", "CRE", "HIV"];
    if (stage >= 3) {
        diseases = diseases.concat(["백일해", "유행성 이하선염", "홍역", "Candida auris", "B형간염", "C형간염"]);
        if (stage >= 5) {
            diseases = diseases.concat(["풍진", "파종성 대상포진", "C.difficile", "MRAB", "MRPA", "Rotavirus"]);
        }
    }

    const disease = diseases[Math.floor(Math.random() * diseases.length)];

    const patientImages = [images.pt1, images.pt2, images.pt3, images.pt4];
    const image = patientImages[Math.floor(Math.random() * patientImages.length)];

    const x = WIDTH / 2 - 70;
    const y = -offset;

    return { x, y, width: 165, height: 225, disease, image };
}

function resetGame() {
    bangImg = images.bang_default;
    currentProtection = null;
    gameOver = false;
    nameEntered = false;
    score = 0;
    stage = 1;
    passedPatients = 0;
    speed = 4;
    patients = [createPatient()];
    isRankingScreen = false;
}

// 6. 메인 게임 루프
function gameLoop() {
    if (!ctx || !imagesLoaded || isRankingScreen) { 
        // ctx가 없거나 이미지가 로드되지 않았거나 랭킹 화면이면 루프 중단
        if (isRankingScreen) {
             showRankingScreen(); // 랭킹 화면은 계속 그립니다.
        }
        requestAnimationFrame(gameLoop); // 로드될 때까지 대기
        return; 
    }
    
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // 배경 그리기
    if (gameStarted && !gameOver) {
        ctx.drawImage(images.background, 0, 0, WIDTH, HEIGHT);
    } else {
        ctx.fillStyle = "#EBEBE9";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }

    // 게임 시작 전 화면
    if (!gameStarted) {
        ctx.drawImage(images.startgame, 0, 0, WIDTH, HEIGHT);
        requestAnimationFrame(gameLoop); 
        return;
    }
    
    // 게임 오버 화면
    if (gameOver) {
        ctx.drawImage(images.overgame, 0, 0, WIDTH, HEIGHT);

        const msg2 = `${score} 점`;
        ctx.font = "bold 50px NanumGothic";
        ctx.fillStyle = "#000027ff";
        ctx.fillText(msg2, WIDTH / 2 - 56, HEIGHT / 2 - 240);

        if (!nameEntered && window.playerInfo && window.saveScoreToFirebase) {
            const { playerName, department } = window.playerInfo;
            window.saveScoreToFirebase(playerName, department, score);
            nameEntered = true; 
        }

        requestAnimationFrame(gameLoop);
        return;
    }

    // 방글이 이미지 및 점수 표시
    ctx.drawImage(bangImg, bang.x, bang.y, bang.width, bang.height);
    if (showHeart) {
        ctx.font = "bold 50px NanumGothic";
        ctx.fillStyle = "red";
        ctx.fillText("♥", bang.x + 10, bang.y + 5);
        heartTimer--;

        if (heartTimer <= 0) {
            showHeart = false;
        }
    }

    drawTextWithBackground(`스테이지: ${stage}`, 10, 10, "35px NanumGothic", "white", "black");
    drawTextWithBackground(`점수: ${score}`, 10, 65, "35px NanumGothic", "yellow", "black");

    if (stageUpTimer > 0) {
        let messageLines = ["Level UP!", "환자가 빨리 다가옵니다!"];

        if (stage === 3) {
            messageLines = ["Level UP!", "새로운 감염병 등장!"];
        } else if (stage === 5) {
            messageLines = ["Level UP!", "새로운 감염병 등장!"];
        } else if (stage === 7) {
            messageLines = [`스테이지 ${stage} 도달!`, "환자가 두명씩 등장!"];
        }

        ctx.font = "bold 40px NanumGothic";
        ctx.textBaseline = "top";

        const centerY = HEIGHT / 2 - 100;
        const padding = 10;

        messageLines.forEach((line, i) => {
            const textWidth = ctx.measureText(line).width;
            const textHeight = 40; 
            const x = WIDTH / 2 - textWidth / 2;
            const y = centerY + i * 60;

            ctx.fillStyle = "black";
            ctx.fillRect(x - padding, y - padding, textWidth + padding * 2, textHeight + padding * 2);
            ctx.fillStyle = i === 0 ? "yellow" : "white";
            ctx.fillText(line, x, y);
        });

        stageUpTimer--;

        if (stageUpTimer === 0 && !stageUpHandled) {
            patients = [];
            const maxPatients = stage < 7 ? 1 : 2;
            const fixedGap = 500;

            for (let i = 0; i < maxPatients; i++) {
                const offset = i * fixedGap;
                patients.push(createPatient(offset)); 
            }
            stageUpHandled = true;
        }

        requestAnimationFrame(gameLoop);
        return;
    }

    const maxPatients = stage < 7 ? 1 : 2;
    while (patients.length < maxPatients) {
        const fixedOffset = 400;
        const offset = patients.length === 0 ? 0 : fixedOffset;
        patients.push(createPatient(offset));
    }

    // 환자 이동 및 충돌 처리
    for (let i = patients.length - 1; i >= 0; i--) {
        const pt = patients[i];
        pt.y += speed;

        ctx.drawImage(pt.image, pt.x, pt.y, pt.width, pt.height);

        const text = pt.disease || "???"; 
        ctx.font = "bold 35px NanumGothic";
        ctx.textBaseline = "top";
        
        const textWidth = ctx.measureText(text).width || 0;
        const textX = pt.x + pt.width / 2 - textWidth / 2;
        const textY = pt.y - 30;

        const padding = 6;
        const textHeight = 35;

        ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
        ctx.fillRect(textX - padding, textY - padding, textWidth + padding * 2, textHeight + padding * 2);
        ctx.fillStyle = "black";
        ctx.fillText(text, textX, textY);


        if (pt.y + pt.height >= bang.y) {
            const correct = protectionMap[currentProtection]?.includes(pt.disease);
            if (correct) {
                score += 10;
                passedPatients += 1;
                patients.splice(i, 1);

                showHeart = true;
                heartTimer = 15;
            } else {
                gameOver = true;
                bangImg = images.bang_over;
                patients.splice(i, 1);
            }
        }
    }

    // 스테이지 증가
    if (passedPatients >= 10 && stage < 50) {
        stage += 1;
        passedPatients = 0;

        if (stage < 7) {
            speed += 0.4;
        } else {
            speed += 0.6;
        }
        stageUpTimer = 50;
        stageUpHandled = false;
    }

    requestAnimationFrame(gameLoop);
}





