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
  pt3: "img/pt3.png",
  pt4: "img/pt4.png",
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
let bang = { x: WIDTH / 2 - 100, y: HEIGHT - 415, width: 200, height: 170 };
let patients = [];
let score = 0;
let stage = 1;
let speed = 2;
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

function drawTextWithBackground(text, x, y, font = "10px Arial", textColor = "white", bgColor = "black") {
  ctx.font = font;
  ctx.textBaseline = "top"; // 글자 기준선
  const padding = 5;

  // 글자 크기 측정
  const textMetrics = ctx.measureText(text);
  const textWidth = textMetrics.width;
  const textHeight = parseInt(font, 10); // 대략 글씨 크기

  // 배경 박스 그리기
  ctx.fillStyle = bgColor;
  ctx.fillRect(x - padding, y - padding, textWidth + padding * 2, textHeight + padding * 2);

  // 글자 그리기
  ctx.fillStyle = textColor;
  ctx.fillText(text, x, y);
}

function setProtectionByClick(mx, my) {
  if (mx >= WIDTH / 2 - 250 && mx <= WIDTH / 2 - 250 + 159 && my >= HEIGHT - 240 && my <= HEIGHT - 240 + 234) {
    currentProtection = "덴탈마스크";
    bangImg = images.bang_dental;
  } else if (mx >= WIDTH / 2 - 80 && mx <= WIDTH / 2 - 80 + 166 && my >= HEIGHT - 240 && my <= HEIGHT - 240 + 234) {
    currentProtection = "N95";
    bangImg = images.bang_n95;
  } else if (mx >= WIDTH / 2 + 90 && mx <= WIDTH / 2 + 90 + 164 && my >= HEIGHT - 240 && my <= HEIGHT - 240 + 234) {
    currentProtection = "가운+장갑";
    bangImg = images.bang_gown;
  }
}

function createPatient(offset = 0) {
  const diseases = ["백일해", "인플루엔자", "결핵", "수두", "CRE", "Candida auris", "MRSA"];
  const disease = diseases[Math.floor(Math.random() * diseases.length)];

  const patientImages = [images.pt1, images.pt2, images.pt3, images.pt4];
  const image = patientImages[Math.floor(Math.random() * patientImages.length)];

  const x = WIDTH / 2 - 27.5; 
  const y = -offset; 

  return { x, y, width: 150, height: 220, disease, image };
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

function drawText(text, x, y, size = 40, color = "black") {
  ctx.fillStyle = color;
  ctx.font = `${size}px NanumGothic`;
  ctx.fillText(text, x, y);
}

function drawButton(text, x, y, width, height, color = "#0078FF") {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);

  ctx.save();

  ctx.fillStyle = "white";
  ctx.font = "40px NanumGothic";
  ctx.textAlign = "center";  
  ctx.textBaseline = "middle";

  const centerX = x + width / 2;
  const centerY = y + height / 2;

  ctx.fillText(text, centerX, centerY);

  ctx.restore();
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
    if (mx >= WIDTH / 2 - 200 && mx <= WIDTH / 2 + 200 &&
        my >= HEIGHT / 2 + 80 && my <= HEIGHT / 2 + 180) {
      console.log("게임 시작 버튼 클릭됨");
      gameStarted = true;
      resetGame();
      requestAnimationFrame(gameLoop);
    }
  } else if (gameOver) {
    if (mx >= WIDTH / 2 - 200 && mx <= WIDTH / 2 + 200 &&
        my >= HEIGHT / 2 + 80 && my <= HEIGHT / 2 + 180) {
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
    ctx.fillStyle = "#EBEBE9";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  if (!gameStarted) {
    ctx.drawImage(images.bang_default, WIDTH / 2 - 110, HEIGHT / 2 - 250, 200, 180);
    drawText("방글이에게 전파주의별", WIDTH / 2 - 200, HEIGHT / 2 - 10, 40, "black");
    drawText("적절한 보호구를 입혀주세요", WIDTH / 2 - 230, HEIGHT / 2 + 50, 40, "black");
    drawButton("게임 시작", WIDTH / 2 - 200, HEIGHT / 2 + 80, 400, 100);
    drawText("비말 = 마스크 / 공기 = N95 마스크 / 접촉 = 가운,장갑", WIDTH / 2 - 300, HEIGHT / 2 + 250, 30, "Red");
    return;
  }

  if (gameOver) {
    ctx.drawImage(images.bang_over, WIDTH / 2 - 110, HEIGHT / 2 - 250, 200, 180);
    drawText("감염되었습니다! 게임 종료", WIDTH / 2 - 220, HEIGHT / 2 - 45, 40, "black");
    drawText(`당신의 점수: ${score}`, WIDTH / 2 - 130, HEIGHT / 2 + 5, 40, "black");

    if (!nameEntered) {
      const playerName = prompt("이름을 입력하세요:");
      if (playerName) {
        const rankings = JSON.parse(localStorage.getItem("rankings") || "[]");
        rankings.push({ name: playerName, score });
        rankings.sort((a, b) => b.score - a.score);
        localStorage.setItem("rankings", JSON.stringify(rankings.slice(0, 5)));
      }
      nameEntered = true;
    }

    const savedRankings = JSON.parse(localStorage.getItem("rankings") || "[]");
    drawTextWithBackground("방글이 지킴이 당신의 점수 top 5", 210, 30, "30px NanumGothic", "white", "blue");
    savedRankings.slice(0, 5).forEach((entry, index) => {
      drawText(`${index + 1}. ${entry.name} - ${entry.score}`, 320, 80 + index * 30, 30, "black");
    });

    drawButton("다시 시작", WIDTH / 2 - 200, HEIGHT / 2 + 60, 400, 100);
    return;
  }

  const maxPatients = stage < 3 ? 1 : 2;
  while (patients.length < maxPatients) {
    const offset = patients.length === 0 ? 0 : 300;
    patients.push(createPatient(offset));
  }

  for (let i = patients.length - 1; i >= 0; i--) {
    const pt = patients[i];
    pt.y += speed;
    ctx.drawImage(pt.image, pt.x, pt.y, pt.width, pt.height);
    drawText(pt.disease, pt.x + 20, pt.y - 20, "bold 30px NanumGothic");

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

  if (passedPatients >= 5 && stage < 50) {
    stage += 1;
    passedPatients = 0;
    speed += 0.5;
  }

  ctx.drawImage(bangImg, bang.x, bang.y, bang.width, bang.height);
  drawTextWithBackground(`스테이지: ${stage}`, 10, 10, "35px NanumGothic", "white", "black");
  drawTextWithBackground(`점수: ${score}`, 10, 65, "35px NanumGothic", "yellow", "black");
  
drawButtonImage(images.icon_dental, WIDTH / 2 - 250, HEIGHT - 240, 159, 234);
drawButtonImage(images.icon_n95, WIDTH / 2 - 80, HEIGHT - 240, 166, 234);
drawButtonImage(images.icon_gown, WIDTH / 2 + 90, HEIGHT - 240, 164, 234);

  requestAnimationFrame(gameLoop);
}


