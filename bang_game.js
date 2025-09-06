function startGame() {
  bangImg = images.bang_default;
  requestAnimationFrame(gameLoop);
}

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const imageSources = {
  bang_default: "img/bang.png",
  bang_dental: "img/bang_dental.png",
  bang_n95: "img/bang_n95.png",
  bang_gown: "img/bang_gown.png",
  bang_over: "img/bang_over.png",
  pt1: "img/pt1.png",
  pt2: "img/pt2.png",
  background: "img/bg.PNG",
  icon_dental: "img/mask.png",
  icon_n95: "img/n95.png",
  icon_gown: "img/gw.png"
};

const images = {};
let imagesLoaded = 0;
const totalImages = Object.keys(imageSources).length;

for (const key in imageSources) {
  const img = new Image();
  img.src = imageSources[key];
  img.onload = () => {
    imagesLoaded++;
    if (imagesLoaded === totalImages) {
      startGame();
    }
  };
  images[key] = img;
}

let bangImg;
let bang = { x: WIDTH / 2 - 45, y: HEIGHT - 160, width: 90, height: 80 };
let patients = [];
let score = 0;
let stage = 1;
let speed = 3;
let currentProtection = null;
let gameStarted = false;
let gameOver = false;
let passedPatients = 0;
let nameEntered = false;

const protectionMap = {
  "덴탈마스크": ["백일해", "인플루엔자"],
  "N95": ["결핵", "수두"],
  "가운+장갑": ["CRE", "Candida auris", "MRSA"]
};

function setProtectionByClick(mx, my) {
  if (mx >= WIDTH - 180 && mx <= WIDTH - 120 && my >= HEIGHT - 80 && my <= HEIGHT - 10) {
    currentProtection = "덴탈마스크";
    bangImg = images.bang_dental;
  } else if (mx >= WIDTH - 120 && mx <= WIDTH - 60 && my >= HEIGHT - 80 && my <= HEIGHT - 10) {
    currentProtection = "N95";
    bangImg = images.bang_n95;
  } else if (mx >= WIDTH - 60 && mx <= WIDTH && my >= HEIGHT - 80 && my <= HEIGHT - 10) {
    currentProtection = "가운+장갑";
    bangImg = images.bang_gown;
  }
}

function createPatient(offset = 0) {
  const diseases = ["백일해", "인플루엔자", "결핵", "수두", "CRE", "Candida auris", "MRSA"];
  const disease = diseases[Math.floor(Math.random() * diseases.length)];
  const image = Math.random() < 0.5 ? images.pt1 : images.pt2;
  const x = WIDTH / 2 - 27.5; // 중앙 정렬
  const y = -offset; // 화면 위에서 시작
  return { x, y, width: 55, height: 63, disease, image };
}

function resetGame() {
  bangImg = images.bang_default;
  currentProtection = null;
  gameOver = false;
  nameEntered = false;
  score = 0;
  stage = 1;
  passedPatients = 0;
  speed = 3;
  patients = [createPatient()];
}

function drawText(text, x, y, size = 20, color = "black") {
  ctx.fillStyle = color;
  ctx.font = `${size}px Nanum Gothic`;
  ctx.fillText(text, x, y);
}

function drawButton(text, x, y, width, height, color = "#0078FF") {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);
  drawText(text, x + 20, y + height / 2 + 5, 15, "white");
}

function drawButtonImage(image, x, y, width, height) {
  ctx.drawImage(image, x, y, width, height);
}

canvas.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  console.log("클릭 위치:", mx, my);

  if (!gameStarted) {
    if (mx >= WIDTH / 2 - 75 && mx <= WIDTH / 2 + 75 &&
        my >= HEIGHT / 2 + 40 && my <= HEIGHT / 2 + 90) {
      console.log("게임 시작 버튼 클릭됨");
      gameStarted = true;
      resetGame();
      requestAnimationFrame(gameLoop);
    }
  } else if (gameOver) {
    if (mx >= WIDTH / 2 - 75 && mx <= WIDTH / 2 + 75 &&
        my >= HEIGHT / 2 + 40 && my <= HEIGHT / 2 + 90) {
      console.log("다시 시작 버튼 클릭됨");
      resetGame();
      requestAnimationFrame(gameLoop);
    }
  } else {
    // 게임 중일 때 보호구 버튼 클릭 처리
    setProtectionByClick(mx, my);
  }
});

function gameLoop() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  if (gameStarted && !gameOver) {
    ctx.drawImage(images.background, 0, 0, WIDTH, HEIGHT);
  } else {
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  if (!gameStarted) {
    ctx.drawImage(images.bang_default, WIDTH / 2 - 45, HEIGHT / 2 - 120, 90, 80);
    drawText("방글이를 감염되지 않게 지켜주세요", WIDTH / 2 - 110, HEIGHT / 2 - 20, 20, "black");
    drawButton("게임 시작", WIDTH / 2 - 60, HEIGHT / 2 + 40, 120, 50);
    return;
  }

  if (gameOver) {
    ctx.drawImage(images.bang_over, WIDTH / 2 - 45, HEIGHT / 2 - 120, 90, 80);
    drawText("감염되었습니다! 게임 종료", WIDTH / 2 - 110, HEIGHT / 2 - 20, 20, "red");
    drawText(`당신의 점수: ${score}`, WIDTH / 2 - 60, HEIGHT / 2 + 10, 18, "black");

    if (!nameEntered) {
      const playerName = prompt("이름을 입력하세요:");
      if (playerName) {
        const rankings = JSON.parse(localStorage.getItem("rankings") || "[]");
        rankings.push({ name: playerName, score });
        rankings.sort((a, b) => b.score - a.score);
        localStorage.setItem("rankings", JSON.stringify(rankings.slice(0, 10)));
      }
      nameEntered = true;
    }

    const savedRankings = JSON.parse(localStorage.getItem("rankings") || "[]");
    drawText("방글이 지킴이 top 10", 5, 20, 18, "red");
    savedRankings.forEach((entry, index) => {
      drawText(`${index + 1}. ${entry.name} - ${entry.score}`, 5, 50 + index * 20, 16, "black");
    });

    drawButton("다시 시작", WIDTH / 2 - 75, HEIGHT / 2 + 40, 150, 50);
    return;
  }

  const maxPatients = stage < 2 ? 1 : 2;
  while (patients.length < maxPatients) {
    const offset = patients.length === 0 ? 0 : 300;
    patients.push(createPatient(offset));
  }

  for (let i = patients.length - 1; i >= 0; i--) {
    const pt = patients[i];
    pt.y += speed;
    ctx.drawImage(pt.image, pt.x, pt.y, pt.width, pt.height);
    drawText(pt.disease, pt.x, pt.y - 10, 15);

    if (pt.y + pt.height >= bang.y) {
      const correct = protectionMap[currentProtection]?.includes(pt.disease);
      if (correct) {
        score += 10;
        passedPatients += 1;
        patients.splice(i, 1);
      } else {
        gameOver = true;
        bangImg = images.bang_over;
        patients.splice(i, 1);
      }
    }
  }

  if (passedPatients >= 10 && stage < 50) {
    stage += 1;
    passedPatients = 0;
    speed += 1;
  }

  ctx.drawImage(bangImg, bang.x, bang.y, bang.width, bang.height);
  drawText(`스테이지: ${stage}`, 10, 35);
  drawText(`점수: ${score}`, 130, 35);
  
drawButtonImage(images.icon_dental, WIDTH / 2 - 90, HEIGHT - 80, 60, 70);
drawButtonImage(images.icon_n95, WIDTH / 2 - 30, HEIGHT - 80, 60, 70);
drawButtonImage(images.icon_gown, WIDTH / 2 + 30, HEIGHT - 80, 60, 70);

  requestAnimationFrame(gameLoop);
}

