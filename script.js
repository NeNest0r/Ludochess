const MODIFIERS = [
  {
    id: "deficit",
    name: "Дефицит",
    desc: "2 хода каждому игроку вместо трёх.",
  },
  {
    id: "surplus",
    name: "Избыток",
    desc: "4 хода каждому игроку вместо трёх.",
  },
  {
    id: "pawns",
    name: "Пешки",
    desc: "Вместо всех фигур (кроме короля) на доске стоят пешки.",
  },
  {
    id: "fate",
    name: "Судьба",
    desc: "Оба игрока получают одинаковые фигуры при каждом броске.",
  },
  {
    id: "bloodlust",
    name: "Жажда крови",
    desc: "Взятие фигуры оставляет повторный ход за срубившей фигурой!",
  },
  {
    id: "sudden_death",
    name: "Внезапная смерть",
    desc: "Игра заканчивается сразу же, как только королю объявлен шах.",
  },
  {
    id: "prophecy",
    name: "Пророчество",
    desc: "Результаты следующих трёх бросков видны заранее.",
  },
  {
    id: "equilibrium",
    name: "Равновесие",
    desc: "Отстающий по фигурам игрок получает бесплатный переброс.",
  },
  {
    id: "rebellion",
    name: "Восстание",
    desc: "После гибели ферзя одна случайная пешка этой стороны становится новым ферзем.",
  },
  {
    id: "last_chance",
    name: "Последний шанс",
    desc: "Когда на поле остается один король, он начинает ходить как Ферзь!",
  },
];

const THEMES = {
  default: {
    "--bg-color": "#0b0f19",
    "--panel-bg": "#131b2e",
    "--board-light": "#cbd5e1",
    "--board-dark": "#475569",
    "--slot-bg": "#475569",
    "--border-color": "#1e293b",
    "--player-info-bg": "#1e293b",
    "--select-bg": "#0b0f19",
    "--text-color": "#f8fafc",
    "--accent-gold": "#f59e0b",
    "--accent-blue": "#3b82f6",
  },
  wood: {
    "--bg-color": "#1c1917",
    "--panel-bg": "#292524",
    "--board-light": "#f0d9b5",
    "--board-dark": "#b58863",
    "--slot-bg": "#785d46",
    "--border-color": "#44403c",
    "--player-info-bg": "#382a21",
    "--select-bg": "#1c1917",
    "--text-color": "#f5f5f4",
    "--accent-gold": "#fbbf24",
    "--accent-blue": "#b45309",
  },
  green: {
    "--bg-color": "#141e17",
    "--panel-bg": "#1e2d23",
    "--board-light": "#ebecd0",
    "--board-dark": "#739552",
    "--slot-bg": "#53703d",
    "--border-color": "#2a3f31",
    "--player-info-bg": "#283c2e",
    "--select-bg": "#141e17",
    "--text-color": "#f0fdf4",
    "--accent-gold": "#a3e635",
    "--accent-blue": "#22c55e",
  },
};

const PIECE_IMAGES = {
  wP: "https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg",
  wR: "https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg",
  wN: "https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg",
  wB: "https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg",
  wQ: "https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg",
  wK: "https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg",

  bP: "https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg",
  bR: "https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg",
  bN: "https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg",
  bB: "https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg",
  bQ: "https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg",
  bK: "https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg",
};

const PIECE_NAMES = {
  P: "Пешка",
  N: "Конь",
  B: "Слон",
  R: "Ладья",
  Q: "Ферзь",
  K: "Король",
};
const VALUES = { P: 1, N: 3, B: 3, R: 5, Q: 9, K: 1000 };
const ALL_TYPES = ["P", "N", "B", "R", "Q", "K"];

let gameId = 0;
let board = [];
let currentTurn = "w";
let humanColor = "w";
let botColor = "b";

let casinoSlots = [];
let turnRolledPieces = [];
let selectedSquare = null;
let validMovesForSelected = [];
let turnStartTime = 0;
let isSpinning = false;
let isAnimating = false;
let isTurnTransitioning = false;

let capturedByWhite = [];
let capturedByBlack = [];
let arrows = [];
let previewArrow = null;
let redSquares = new Set();
let rightClickStart = null;

let useModifiers = false;
let autoSpin = false;
let currentModifier = null;
let fateMatrix = [];
let turnCount = 0;
let prophecyQueue = [];

let hasMoved = {
  wK: false,
  wR_a: false,
  wR_h: false,
  bK: false,
  bR_a: false,
  bR_h: false,
};

const boardEl = document.getElementById("board");
const logEl = document.getElementById("log");
const spinBtn = document.getElementById("spin-btn");
const turnInd = document.getElementById("turn-indicator");
const casinoSlotsEl = document.getElementById("casino-slots");

function toggleModifiers(val) {
  useModifiers = val === "on";
  initBoard();
}

function toggleAutospin() {
  autoSpin = !autoSpin;
  const btn = document.getElementById("autospin-btn");
  if (btn) btn.classList.toggle("active", autoSpin);

  if (
    autoSpin &&
    currentTurn === humanColor &&
    !isSpinning &&
    casinoSlots.length === 0 &&
    !isTurnTransitioning
  ) {
    humanSpin();
  }
}

function changeTheme(themeName) {
  const theme = THEMES[themeName];
  if (!theme) return;
  const root = document.documentElement;
  for (const [key, value] of Object.entries(theme)) {
    root.style.setProperty(key, value);
  }
  renderArrows();
}

function getSlotCount() {
  if (!useModifiers || !currentModifier) return 3;
  if (currentModifier.id === "deficit") return 2;
  if (currentModifier.id === "surplus") return 4;
  return 3;
}

function initBoard() {
  gameId++;
  const currentGameId = gameId;

  const modCard = document.getElementById("modifier-card");
  if (useModifiers) {
    currentModifier = MODIFIERS[Math.floor(Math.random() * MODIFIERS.length)];
    document.getElementById("modifier-name").innerText = currentModifier.name;
    document.getElementById("modifier-desc").innerText = currentModifier.desc;
    modCard.style.display = "block";
  } else {
    currentModifier = null;
    modCard.style.display = "none";
  }

  const defaultSetup = [
    ["bR", "bN", "bB", "bQ", "bK", "bB", "bN", "bR"],
    ["bP", "bP", "bP", "bP", "bP", "bP", "bP", "bP"],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["wP", "wP", "wP", "wP", "wP", "wP", "wP", "wP"],
    ["wR", "wN", "wB", "wQ", "wK", "wB", "wN", "wR"],
  ];

  if (useModifiers && currentModifier?.id === "pawns") {
    board = defaultSetup.map((row) =>
      row.map((cell) => {
        if (!cell || cell.endsWith("K")) return cell;
        return cell[0] + "P";
      }),
    );
  } else {
    board = JSON.parse(JSON.stringify(defaultSetup));
  }

  humanColor = Math.random() < 0.5 ? "w" : "b";
  botColor = humanColor === "w" ? "b" : "w";
  currentTurn = "w";

  casinoSlots = [];
  turnRolledPieces = [];
  selectedSquare = null;
  validMovesForSelected = [];
  isSpinning = false;
  isAnimating = false;
  isTurnTransitioning = false;

  capturedByWhite = [];
  capturedByBlack = [];

  const topCapEl = document.getElementById("top-captured");
  const bottomCapEl = document.getElementById("bottom-captured");
  const topAdvEl = document.getElementById("top-advantage");
  const bottomAdvEl = document.getElementById("bottom-advantage");

  if (topCapEl) {
    topCapEl.innerHTML = "";
    topCapEl.classList.remove("has-pieces");
  }
  if (bottomCapEl) {
    bottomCapEl.innerHTML = "";
    bottomCapEl.classList.remove("has-pieces");
  }
  if (topAdvEl) topAdvEl.innerHTML = "";
  if (bottomAdvEl) bottomAdvEl.innerHTML = "";

  arrows = [];
  previewArrow = null;
  redSquares.clear();
  turnCount = 0;

  fateMatrix = [];
  for (let i = 0; i < 100; i++) {
    const row = [];
    for (let j = 0; j < 10; j++) {
      row.push(ALL_TYPES[Math.floor(Math.random() * ALL_TYPES.length)]);
    }
    fateMatrix.push(row);
  }

  hasMoved = {
    wK: false,
    wR_a: false,
    wR_h: false,
    bK: false,
    bR_a: false,
    bR_h: false,
  };

  logEl.innerHTML = "";
  renderEmptySlots();

  const prophecyEl = document.getElementById("prophecy-container");
  if (useModifiers && currentModifier?.id === "prophecy") {
    prophecyEl.style.display = "flex";
    prophecyQueue = [];
    replenishProphecyQueue("w");
  } else {
    prophecyEl.style.display = "none";
  }

  updateTurnIndicator();
  checkEquilibriumNotice();
  renderBoard();

  if (currentTurn === humanColor) {
    spinBtn.disabled = false;
    if (autoSpin)
      setTimeout(() => {
        if (currentGameId === gameId) humanSpin();
      }, 300);
  } else {
    spinBtn.disabled = true;
    setTimeout(() => {
      if (currentGameId === gameId) playBotTurn();
    }, 600);
  }
}

function renderEmptySlots() {
  const count = getSlotCount();
  casinoSlotsEl.innerHTML = Array(count)
    .fill('<div class="slot"></div>')
    .join("");
}

function getActiveSlotIndex() {
  return casinoSlots.findIndex((s) => !s.used);
}

function findKing(color, currentBoard = board) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (currentBoard[r][c] === color + "K") return { r, c };
    }
  }
  return null;
}

function isKingInCheck(color, currentBoard = board) {
  const kingPos = findKing(color, currentBoard);
  if (!kingPos) return false;
  const opponentColor = color === "w" ? "b" : "w";

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (currentBoard[r][c] && currentBoard[r][c][0] === opponentColor) {
        const moves = getRawMoves(r, c, currentBoard);
        if (moves.some((m) => m.r === kingPos.r && m.c === kingPos.c)) {
          return true;
        }
      }
    }
  }
  return false;
}

function updateTurnIndicator() {
  if (currentTurn === "gameOver") return;
  turnInd.innerText = currentTurn === "w" ? "Ход белых" : "Ход чёрных";
}

function checkEquilibriumNotice() {
  const noticeEl = document.getElementById("equilibrium-notice");
  if (!noticeEl) return;

  if (useModifiers && currentModifier?.id === "equilibrium") {
    const myCount = board
      .flat()
      .filter((p) => p && p[0] === currentTurn).length;
    const oppCount = board
      .flat()
      .filter((p) => p && p[0] === (currentTurn === "w" ? "b" : "w")).length;
    if (myCount < oppCount) {
      noticeEl.style.display = "block";
      return;
    }
  }
  noticeEl.style.display = "none";
}

function updateCapturedUI() {
  const whiteScore = evaluateBoard("w");
  const sortPieces = (a, b) => VALUES[b[1]] - VALUES[a[1]];
  capturedByWhite.sort(sortPieces);
  capturedByBlack.sort(sortPieces);

  const botCap = botColor === "w" ? capturedByWhite : capturedByBlack;
  const humanCap = humanColor === "w" ? capturedByWhite : capturedByBlack;

  const topCapEl = document.getElementById("top-captured");
  if (topCapEl) {
    topCapEl.innerHTML = botCap
      .map((p) => `<img src="${PIECE_IMAGES[p]}" class="captured-piece-img">`)
      .join("");
    topCapEl.classList.toggle("has-pieces", botCap.length > 0);
  }

  const bottomCapEl = document.getElementById("bottom-captured");
  if (bottomCapEl) {
    bottomCapEl.innerHTML = humanCap
      .map((p) => `<img src="${PIECE_IMAGES[p]}" class="captured-piece-img">`)
      .join("");
    bottomCapEl.classList.toggle("has-pieces", humanCap.length > 0);
  }

  const topAdvEl = document.getElementById("top-advantage");
  const bottomAdvEl = document.getElementById("bottom-advantage");

  if (topAdvEl) topAdvEl.innerHTML = "";
  if (bottomAdvEl) bottomAdvEl.innerHTML = "";

  if (whiteScore > 0) {
    if (humanColor === "w" && bottomAdvEl)
      bottomAdvEl.innerHTML = `<span class="advantage-positive">+${whiteScore}</span>`;
    else if (topAdvEl)
      topAdvEl.innerHTML = `<span class="advantage-positive">+${whiteScore}</span>`;
  } else if (whiteScore < 0) {
    const val = Math.abs(whiteScore);
    if (humanColor === "b" && bottomAdvEl)
      bottomAdvEl.innerHTML = `<span class="advantage-positive">+${val}</span>`;
    else if (topAdvEl)
      topAdvEl.innerHTML = `<span class="advantage-positive">+${val}</span>`;
  }
}

function renderBoard() {
  const svgEl = document.getElementById("arrows-svg");
  boardEl.innerHTML = "";
  if (svgEl) boardEl.appendChild(svgEl);

  const activeIdx = getActiveSlotIndex();
  const activeType = activeIdx !== -1 ? casinoSlots[activeIdx].type : null;
  const inCheckKing = isKingInCheck(currentTurn) ? findKing(currentTurn) : null;
  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];

  for (let dispR = 0; dispR < 8; dispR++) {
    for (let dispC = 0; dispC < 8; dispC++) {
      const r = humanColor === "w" ? dispR : 7 - dispR;
      const c = humanColor === "w" ? dispC : 7 - dispC;

      const cell = document.createElement("div");
      cell.className = `cell ${(r + c) % 2 === 0 ? "white-cell" : "black-cell"}`;
      cell.dataset.r = r;
      cell.dataset.c = c;

      if (dispC === 0) {
        const rankLabel = document.createElement("span");
        rankLabel.className = "coord rank-coord";
        rankLabel.innerText = humanColor === "w" ? 8 - dispR : dispR + 1;
        cell.appendChild(rankLabel);
      }

      if (dispR === 7) {
        const fileLabel = document.createElement("span");
        fileLabel.className = "coord file-coord";
        fileLabel.innerText =
          humanColor === "w" ? files[dispC] : files[7 - dispC];
        cell.appendChild(fileLabel);
      }

      if (redSquares.has(`${r},${c}`)) cell.classList.add("red-cell");
      if (inCheckKing && inCheckKing.r === r && inCheckKing.c === c)
        cell.classList.add("check-cell");
      if (selectedSquare && selectedSquare.r === r && selectedSquare.c === c)
        cell.classList.add("selected-cell");

      const p = board[r][c];
      if (p) {
        const img = document.createElement("img");
        img.src = PIECE_IMAGES[p];
        img.className = "piece-img";

        if (
          p[0] === currentTurn &&
          p[0] === humanColor &&
          activeType &&
          p[1] === activeType &&
          !isSpinning &&
          !isAnimating
        ) {
          if (getValidMoves(r, c).length > 0)
            img.classList.add("piece-active-highlight");
        }
        cell.appendChild(img);
      }

      const move = validMovesForSelected.find((m) => m.r === r && m.c === c);
      if (move) {
        const mark = document.createElement("div");
        mark.className = move.capture ? "capture-ring" : "move-dot";
        cell.appendChild(mark);
      }

      cell.onclick = () => handleCellClick(r, c);
      boardEl.appendChild(cell);
    }
  }
  renderArrows();
}

// 2. Исключение запертых фигур (те, которые не имеют доступных ходов)
function getAvailableTypesWithMoves(color) {
  const types = new Set();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] && board[r][c][0] === color) {
        if (getValidMoves(r, c).length > 0) types.add(board[r][c][1]);
      }
    }
  }
  return Array.from(types);
}

function replenishProphecyQueue(nextPlayerColor) {
  while (prophecyQueue.length < 5) {
    const available = getAvailableTypesWithMoves(nextPlayerColor);
    if (available.length > 0 && prophecyQueue.length < 3) {
      const hasExecutable = prophecyQueue.some((t) => available.includes(t));
      if (!hasExecutable) {
        prophecyQueue.push(
          available[Math.floor(Math.random() * available.length)],
        );
        continue;
      }
    }
    const pool = available.length > 0 ? available : ALL_TYPES;
    prophecyQueue.push(pool[Math.floor(Math.random() * pool.length)]);
  }
  renderProphecyUI();
}

function renderProphecyUI() {
  const container = document.getElementById("prophecy-slots");
  if (!container) return;
  container.innerHTML = prophecyQueue
    .slice(0, 3)
    .map(
      (t) =>
        `<div class="prophecy-mini-slot"><img src="${PIECE_IMAGES[currentTurn + t]}"></div>`,
    )
    .join("");
}

async function spinCasinoAnimation(color) {
  const localGameId = gameId;
  isSpinning = true;
  spinBtn.disabled = true;

  // Берем только незапертые фигуры для выпадения
  const availableTypes = getAvailableTypesWithMoves(color);
  if (availableTypes.length === 0) {
    isSpinning = false;
    endGame(color === humanColor ? "Бот победил!" : "Вы победили!");
    return [];
  }

  const count = getSlotCount();
  const finalSlots = [];

  for (let i = 0; i < count; i++) {
    let chosenType;
    if (useModifiers && currentModifier?.id === "fate") {
      const roundIndex = Math.floor(turnCount / 2);
      const fateRow = fateMatrix[roundIndex % fateMatrix.length];
      const fateCandidate = fateRow[i % fateRow.length];
      // Если фигура из матрицы судьбы заперта, берем доступную
      chosenType = availableTypes.includes(fateCandidate)
        ? fateCandidate
        : availableTypes[Math.floor(Math.random() * availableTypes.length)];
    } else if (useModifiers && currentModifier?.id === "prophecy") {
      replenishProphecyQueue(color);
      chosenType = prophecyQueue.shift();
      replenishProphecyQueue(color === "w" ? "b" : "w");
    } else {
      chosenType =
        availableTypes[Math.floor(Math.random() * availableTypes.length)];
    }
    finalSlots.push({ type: chosenType, used: false });
  }

  turnRolledPieces = finalSlots.map((s) => color + s.type);

  const duration = 800;
  const intervalTime = 60;
  let elapsed = 0;

  return new Promise((resolve) => {
    const anim = setInterval(() => {
      if (localGameId !== gameId) {
        clearInterval(anim);
        return;
      }
      elapsed += intervalTime;
      casinoSlotsEl.innerHTML = "";

      for (let i = 0; i < count; i++) {
        const slotDiv = document.createElement("div");
        slotDiv.className = "slot";

        if (elapsed >= duration - (count - 1 - i) * 100) {
          const t = finalSlots[i].type;
          slotDiv.innerHTML = `<img src="${PIECE_IMAGES[color + t]}">`;
        } else {
          const randomT =
            availableTypes[Math.floor(Math.random() * availableTypes.length)];
          slotDiv.innerHTML = `<img src="${PIECE_IMAGES[color + randomT]}">`;
        }
        casinoSlotsEl.appendChild(slotDiv);
      }

      if (elapsed >= duration) {
        clearInterval(anim);
        isSpinning = false;
        casinoSlots = finalSlots;
        checkAndAdvanceSlots();
        resolve(finalSlots);
      }
    }, intervalTime);
  });
}

function renderCasinoUI() {
  casinoSlotsEl.innerHTML = "";
  const activeIdx = getActiveSlotIndex();

  casinoSlots.forEach((s, idx) => {
    const slotDiv = document.createElement("div");
    let stateClass = s.used ? "used" : idx === activeIdx ? "active" : "";
    slotDiv.className = `slot ${stateClass}`;

    if (idx === activeIdx && !s.used) {
      slotDiv.innerHTML += '<div class="slot-arrow">▼</div>';
    }
    slotDiv.innerHTML += `<img src="${PIECE_IMAGES[currentTurn + s.type]}">`;
    casinoSlotsEl.appendChild(slotDiv);
  });
}

async function humanSpin() {
  if (currentTurn !== humanColor || isSpinning || isTurnTransitioning) return;
  turnStartTime = performance.now();
  await spinCasinoAnimation(humanColor);
}

function checkAndAdvanceSlots() {
  if (currentTurn === "gameOver") return;

  let activeIdx = getActiveSlotIndex();
  while (activeIdx !== -1) {
    const activeType = casinoSlots[activeIdx].type;
    if (hasValidMovesForType(currentTurn, activeType)) {
      break;
    } else {
      casinoSlots[activeIdx].used = true;
      activeIdx = getActiveSlotIndex();
    }
  }

  renderCasinoUI();
  updateTurnIndicator();
  renderBoard();

  if (activeIdx === -1 && casinoSlots.length > 0) {
    if (currentTurn === humanColor) endHumanTurn();
  }
}

function hasValidMovesForType(color, type) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] && board[r][c][0] === color && board[r][c][1] === type) {
        if (getValidMoves(r, c).length > 0) return true;
      }
    }
  }
  return false;
}

function executeMove(fromR, fromC, toR, toC) {
  const localGameId = gameId;
  const piece = board[fromR][fromC];
  const targetPiece = board[toR][toC];

  isAnimating = true;

  const startCell = document.querySelector(
    `[data-r='${fromR}'][data-c='${fromC}']`,
  );
  const endCell = document.querySelector(`[data-r='${toR}'][data-c='${toC}']`);

  selectedSquare = null;
  validMovesForSelected = [];
  arrows = [];
  previewArrow = null;
  redSquares.clear();

  animateMove(startCell, endCell, piece, () => {
    if (localGameId !== gameId) return;
    isAnimating = false;

    const activeIdx = getActiveSlotIndex();

    // 1. «Жажда крови»: оставляет повторный ход той же фигурой в текущей ячейке
    let isBloodlustTriggered = false;
    if (
      targetPiece &&
      useModifiers &&
      currentModifier?.id === "bloodlust" &&
      activeIdx !== -1
    ) {
      casinoSlots[activeIdx].type = piece[1];
      casinoSlots[activeIdx].used = false; // Не сжигает слот, а оставляет ход той же фигурой
      isBloodlustTriggered = true;
      logSys(`Жажда крови! Повторный ход фигурой ${PIECE_NAMES[piece[1]]}`);
    } else if (activeIdx !== -1) {
      casinoSlots[activeIdx].used = true;
    }

    // Рокировка
    if (piece[1] === "K" && Math.abs(toC - fromC) === 2) {
      if (toC === 6) {
        board[fromR][5] = board[fromR][7];
        board[fromR][7] = "";
      } else if (toC === 2) {
        board[fromR][3] = board[fromR][0];
        board[fromR][0] = "";
      }
    }

    if (piece === "wK") hasMoved["wK"] = true;
    if (piece === "bK") hasMoved["bK"] = true;

    if (targetPiece) {
      if (targetPiece[0] === "b") capturedByWhite.push(targetPiece);
      if (targetPiece[0] === "w") capturedByBlack.push(targetPiece);

      if (
        useModifiers &&
        currentModifier?.id === "rebellion" &&
        targetPiece[1] === "Q"
      ) {
        const pawnColor = targetPiece[0];
        const pawns = [];
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            if (board[r][c] === pawnColor + "P") pawns.push({ r, c });
          }
        }
        if (pawns.length > 0) {
          const randPawn = pawns[Math.floor(Math.random() * pawns.length)];
          board[randPawn.r][randPawn.c] = pawnColor + "Q";
          logSys(
            `${pawnColor === "w" ? "Белая" : "Чёрная"} пешка подняла восстание и стала Ферзем!`,
          );
        }
      }
    }

    let newPiece = piece;
    if (piece[1] === "P" && (toR === 0 || toR === 7)) newPiece = piece[0] + "Q";

    board[toR][toC] = newPiece;
    board[fromR][fromC] = "";

    updateCapturedUI();
    renderBoard();

    const oppColor = piece[0] === "w" ? "b" : "w";

    // 3. Убран лишний текст в скобках при победе
    if (
      useModifiers &&
      currentModifier?.id === "sudden_death" &&
      isKingInCheck(oppColor)
    ) {
      endGame(piece[0] === humanColor ? "Вы победили!" : "Бот победил!");
      return;
    }

    if (targetPiece && targetPiece[1] === "K") {
      endGame(piece[0] === humanColor ? "Вы победили!" : "Бот победил!");
      return;
    }

    checkAndAdvanceSlots();
  });
}

function animateMove(startCell, endCell, pieceCode, onComplete) {
  if (!startCell || !endCell) {
    onComplete();
    return;
  }

  const startX = startCell.offsetLeft,
    startY = startCell.offsetTop;
  const endX = endCell.offsetLeft,
    endY = endCell.offsetTop;
  const width = startCell.offsetWidth,
    height = startCell.offsetHeight;

  const originalImg = startCell.querySelector("img");
  if (originalImg) originalImg.style.visibility = "hidden";

  const mover = document.createElement("div");
  mover.style.cssText = `position:absolute;left:${startX}px;top:${startY}px;width:${width}px;height:${height}px;z-index:100;pointer-events:none;transition:transform 0.25s cubic-bezier(0.1, 0.9, 0.2, 1);display:flex;justify-content:center;align-items:center;`;

  const img = document.createElement("img");
  img.src = PIECE_IMAGES[pieceCode];
  img.style.cssText = "width:84%;height:84%;object-fit:contain;";
  mover.appendChild(img);

  boardEl.appendChild(mover);
  mover.getBoundingClientRect();
  mover.style.transform = `translate(${endX - startX}px, ${endY - startY}px)`;

  setTimeout(() => {
    mover.remove();
    onComplete();
  }, 255);
}

function handleCellClick(r, c) {
  if (
    currentTurn !== humanColor ||
    isSpinning ||
    isAnimating ||
    casinoSlots.length === 0 ||
    isTurnTransitioning
  )
    return;

  if (
    selectedSquare &&
    validMovesForSelected.some((m) => m.r === r && m.c === c)
  ) {
    executeMove(selectedSquare.r, selectedSquare.c, r, c);
    return;
  }

  const activeIdx = getActiveSlotIndex();
  if (activeIdx === -1) return;

  const activeType = casinoSlots[activeIdx].type;
  const piece = board[r][c];

  if (piece && piece[0] === currentTurn && piece[1] === activeType) {
    selectedSquare = { r, c };
    validMovesForSelected = getValidMoves(r, c);
    renderBoard();
  } else {
    selectedSquare = null;
    validMovesForSelected = [];
    renderBoard();
  }
}

function endHumanTurn() {
  if (
    currentTurn === "gameOver" ||
    isTurnTransitioning ||
    turnRolledPieces.length === 0
  )
    return;
  const localGameId = gameId;
  isTurnTransitioning = true;

  const timeSpent = ((performance.now() - turnStartTime) / 1000).toFixed(1);
  const playerLabel = humanColor === "w" ? "Белые" : "Чёрные";
  logFormat(`${playerLabel} (${timeSpent}с)`, turnRolledPieces, true);

  turnCount++;
  currentTurn = botColor;
  updateTurnIndicator();
  checkEquilibriumNotice();
  spinBtn.disabled = true;
  selectedSquare = null;
  validMovesForSelected = [];

  setTimeout(() => {
    if (localGameId !== gameId) return;
    isTurnTransitioning = false;
    playBotTurn();
  }, 400);
}

async function playBotTurn() {
  const localGameId = gameId;
  if (
    currentTurn === "gameOver" ||
    currentTurn !== botColor ||
    isSpinning ||
    isAnimating
  )
    return;
  turnStartTime = performance.now();

  const slots = await spinCasinoAnimation(botColor);
  if (localGameId !== gameId || !slots || slots.length === 0) return;

  while (
    currentTurn === botColor &&
    currentTurn !== "gameOver" &&
    localGameId === gameId
  ) {
    const activeIdx = getActiveSlotIndex();
    if (activeIdx === -1) break;

    const activeType = casinoSlots[activeIdx].type;
    if (!hasValidMovesForType(botColor, activeType)) {
      casinoSlots[activeIdx].used = true;
      renderCasinoUI();
      continue;
    }

    await new Promise((r) => setTimeout(r, 400));
    if (
      localGameId !== gameId ||
      currentTurn !== botColor ||
      currentTurn === "gameOver"
    )
      break;

    let possibleMoves = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (
          board[r][c] &&
          board[r][c][0] === botColor &&
          board[r][c][1] === activeType
        ) {
          getValidMoves(r, c).forEach((m) =>
            possibleMoves.push({
              fromR: r,
              fromC: c,
              toR: m.r,
              toC: m.c,
              capture: m.capture,
            }),
          );
        }
      }
    }

    if (possibleMoves.length === 0) {
      casinoSlots[activeIdx].used = true;
      renderCasinoUI();
      continue;
    }

    const diff = document.getElementById("bot-difficulty").value;
    let chosen = possibleMoves[0];

    if (diff === "easy") {
      chosen = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
    } else {
      possibleMoves.sort((a, b) => {
        const valA = a.capture ? VALUES[board[a.toR][a.toC][1]] : 0;
        const valB = b.capture ? VALUES[board[b.toR][b.toC][1]] : 0;
        return valB - valA;
      });
      chosen = possibleMoves[0];
    }

    await new Promise((r) => {
      executeMove(chosen.fromR, chosen.fromC, chosen.toR, chosen.toC);
      const checkAnim = setInterval(() => {
        if (!isAnimating || localGameId !== gameId) {
          clearInterval(checkAnim);
          r();
        }
      }, 50);
    });
  }

  if (
    localGameId === gameId &&
    currentTurn === botColor &&
    currentTurn !== "gameOver"
  ) {
    endBotTurn();
  }
}

function endBotTurn() {
  if (
    currentTurn === "gameOver" ||
    isTurnTransitioning ||
    turnRolledPieces.length === 0
  )
    return;
  const localGameId = gameId;
  isTurnTransitioning = true;

  const timeSpent = ((performance.now() - turnStartTime) / 1000).toFixed(1);
  const botLabel = botColor === "w" ? "Белые" : "Чёрные";
  logFormat(`${botLabel} (${timeSpent}с)`, turnRolledPieces, false);

  turnCount++;
  currentTurn = humanColor;
  updateTurnIndicator();
  checkEquilibriumNotice();
  spinBtn.disabled = false;
  casinoSlots = [];
  renderEmptySlots();
  renderBoard();

  isTurnTransitioning = false;

  if (autoSpin)
    setTimeout(() => {
      if (localGameId === gameId) humanSpin();
    }, 300);
}

function evaluateBoard(color) {
  let score = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p) {
        const val = VALUES[p[1]];
        score += p[0] === "w" ? val : -val;
      }
    }
  }
  return color === "w" ? score : -score;
}

function getRawMoves(r, c, currentBoard = board) {
  const piece = currentBoard[r][c];
  if (!piece) return [];
  const color = piece[0];
  const type = piece[1];
  const moves = [];
  const dir = color === "w" ? -1 : 1;

  function add(nr, nc) {
    if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
      if (!currentBoard[nr][nc] || currentBoard[nr][nc][0] !== color) {
        moves.push({ r: nr, c: nc, capture: !!currentBoard[nr][nc] });
        return !currentBoard[nr][nc];
      }
    }
    return false;
  }

  let activeType = type;
  if (useModifiers && type === "K" && currentModifier?.id === "last_chance") {
    const piecesCount = currentBoard
      .flat()
      .filter((p) => p && p[0] === color).length;
    if (piecesCount === 1) activeType = "Q";
  }

  if (activeType === "P") {
    if (r + dir >= 0 && r + dir < 8 && !currentBoard[r + dir][c]) {
      moves.push({ r: r + dir, c, capture: false });
      if (
        ((color === "w" && r === 6) || (color === "b" && r === 1)) &&
        !currentBoard[r + dir * 2][c]
      ) {
        moves.push({ r: r + dir * 2, c, capture: false });
      }
    }
    [-1, 1].forEach((dc) => {
      const nc = c + dc,
        nr = r + dir;
      if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
        if (currentBoard[nr][nc] && currentBoard[nr][nc][0] !== color) {
          moves.push({ r: nr, c: nc, capture: true });
        }
      }
    });
  } else if (activeType === "R") {
    [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
    ].forEach((d) => {
      let nr = r + d[0],
        nc = c + d[1];
      while (add(nr, nc)) {
        nr += d[0];
        nc += d[1];
      }
    });
  } else if (activeType === "B") {
    [
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ].forEach((d) => {
      let nr = r + d[0],
        nc = c + d[1];
      while (add(nr, nc)) {
        nr += d[0];
        nc += d[1];
      }
    });
  } else if (activeType === "Q") {
    [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ].forEach((d) => {
      let nr = r + d[0],
        nc = c + d[1];
      while (add(nr, nc)) {
        nr += d[0];
        nc += d[1];
      }
    });
  } else if (activeType === "N") {
    [
      [2, 1],
      [2, -1],
      [-2, 1],
      [-2, -1],
      [1, 2],
      [1, -2],
      [-1, 2],
      [-1, -2],
    ].forEach((d) => add(r + d[0], c + d[1]));
  } else if (activeType === "K") {
    [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ].forEach((d) => add(r + d[0], c + d[1]));
  }

  return moves;
}

function getValidMoves(r, c) {
  const piece = board[r][c];
  if (!piece) return [];
  const color = piece[0];

  return getRawMoves(r, c).filter((m) => {
    const tempBoard = JSON.parse(JSON.stringify(board));
    tempBoard[m.r][m.c] = tempBoard[r][c];
    tempBoard[r][c] = "";
    return !isKingInCheck(color, tempBoard);
  });
}

function logFormat(playerStr, pieceCodes, isPlayer) {
  if (!pieceCodes || pieceCodes.length === 0) return;

  const d = document.createElement("div");
  d.className = "log-entry";

  const iconsHtml = pieceCodes
    .map(
      (code) =>
        `<img src="${PIECE_IMAGES[code]}" class="log-piece-img" title="${PIECE_NAMES[code[1]]}">`,
    )
    .join('<span class="log-arrow">➔</span>');

  d.innerHTML = `
    <span class="${isPlayer ? "log-player" : "log-bot"}">${playerStr}:</span>
    <span class="log-chain">${iconsHtml}</span>
  `;
  logEl.prepend(d);
}

function logSys(msg) {
  const d = document.createElement("div");
  d.className = "log-entry";
  d.innerHTML = `<span class="log-sys">⚡ ${msg}</span>`;
  logEl.prepend(d);
}

// 3. Лаконичное выведение сообщений
function endGame(msg) {
  currentTurn = "gameOver";
  turnInd.innerText = msg;
  spinBtn.disabled = true;
}

function renderArrows() {
  const svg = document.getElementById("arrows-svg");
  if (!svg) return;
  svg.innerHTML = `
    <defs>
      <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent-blue)"/>
      </marker>
    </defs>
  `;

  const allArrows = [...arrows];
  if (previewArrow) allArrows.push(previewArrow);

  allArrows.forEach((a) => {
    const dispFromR = humanColor === "w" ? a.fromR : 7 - a.fromR;
    const dispFromC = humanColor === "w" ? a.fromC : 7 - a.fromC;
    const dispToR = humanColor === "w" ? a.toR : 7 - a.toR;
    const dispToC = humanColor === "w" ? a.toC : 7 - a.toC;

    const x1 = dispFromC * 64 + 32,
      y1 = dispFromR * 64 + 32;
    const x2 = dispToC * 64 + 32,
      y2 = dispToR * 64 + 32;

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);
    line.setAttribute("stroke", "var(--accent-blue)");
    line.setAttribute("stroke-width", "5");
    line.setAttribute("marker-end", "url(#arrow)");
    svg.appendChild(line);
  });
}

boardEl.addEventListener("contextmenu", (e) => e.preventDefault());
boardEl.addEventListener("mousedown", (e) => {
  if (e.button === 0 && (arrows.length > 0 || redSquares.size > 0)) {
    arrows = [];
    previewArrow = null;
    redSquares.clear();
    renderBoard();
  } else if (e.button === 2) {
    const cell = e.target.closest(".cell");
    if (cell)
      rightClickStart = {
        r: parseInt(cell.dataset.r),
        c: parseInt(cell.dataset.c),
      };
  }
});

boardEl.addEventListener("mouseover", (e) => {
  if (rightClickStart) {
    const cell = e.target.closest(".cell");
    if (cell) {
      const toR = parseInt(cell.dataset.r),
        toC = parseInt(cell.dataset.c);
      if (rightClickStart.r !== toR || rightClickStart.c !== toC) {
        previewArrow = {
          fromR: rightClickStart.r,
          fromC: rightClickStart.c,
          toR,
          toC,
        };
      } else {
        previewArrow = null;
      }
      renderArrows();
    }
  }
});

boardEl.addEventListener("mouseup", (e) => {
  if (e.button === 2 && rightClickStart) {
    const cell = e.target.closest(".cell");
    if (cell) {
      const r = parseInt(cell.dataset.r),
        c = parseInt(cell.dataset.c);
      if (rightClickStart.r === r && rightClickStart.c === c) {
        const key = `${r},${c}`;
        if (redSquares.has(key)) redSquares.delete(key);
        else redSquares.add(key);
        renderBoard();
      } else if (previewArrow) {
        arrows.push(previewArrow);
        previewArrow = null;
        renderArrows();
      }
    }
    rightClickStart = null;
  }
});

initBoard();
