"use strict";
// THIS IS JS OF POWER FULL MODE - CLEAN CODE ,DIBUG FREE,REMOVE LET CONST VAT ERROR

// SOUND
const flipSound = document.getElementById("s_flip");
const matchSound = document.getElementById("s_match");
const wrongSound = document.getElementById("s_wrong");
const winSound = document.getElementById("s_win");

// SCREEN ELEMENTS
const startBtn = document.getElementById("startBtn");
const startScreen = document.getElementById("startScreen");
const levelScreen = document.getElementById("levelScreen");
const gameScreen = document.getElementById("gameScreen");

const board = document.getElementById("board");
const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");
const matchesEl = document.getElementById("matches");

const restartBtn = document.getElementById("restartBtn");
const pauseBtn = document.getElementById("pauseBtn");
const backBtn = document.getElementById("backBtn");
const message = document.getElementById("message");


// VARIABLES
let score = 0;
let timer = 0;
let remainingTime = 0;
let interval = null; 
// THIS IS STORE THE SETINTERVAL ID AND SAVE DUPLICATE TIME
let matchedCount = 0;
let selected = [];
// STORE THE CURRENTLY FLIP CARD AND MAX 2 CARD STORE
let currentLevel = null;
// USER WHICH LEVEL PLAY

let isPaused = false;     
// STORE THE ON OFF BOTTON   
let isInputLocked = false; 
// IF WRONG CARD FLIP THEN LOCK THE INPUT

// LEVEL CARD COUNTS
const levelConfig = {
    easy: 16,
    medium: 36,
    hard: 64
};
// LEVEL TIMER
const timerConfig = {
    easy: 60,
    medium: 90,
    hard: 120
};

// START
startBtn.onclick = () => {
    startScreen.classList.add("hidden");
    // IN CSS HIDEEN -> DISPLAY NONE
    levelScreen.classList.remove("hidden");
    // SHOW THE LEVEL SCREEN
    // REMOVE THE HIDDEN CLASS
};

// SELECT LEVEL
document.querySelectorAll(".level").forEach(btn => {
    btn.onclick = () => startGame(btn.dataset.level);
    // SELECT ALL LEVEL USE FOR EACH LOOP AND ALL BOOTON ADD EVENT
});

// START GAME FUNCTION
function startGame(level) {
    currentLevel = level;
    // USER CHOSE LEVEL
    remainingTime = timerConfig[level];
    // TIMER SET = LEVEL


    resetGame();

    levelScreen.classList.add("hidden");
    // LEVEL SCREEN HIDE 
    gameScreen.classList.remove("hidden");
    // GAME SCREEN SHOW

    createBoard(levelConfig[level]);
    // CREATE THE BOARD GRID
    startTimer();
    // START TIMER
}

// RESET GAME

function resetGame() {
    score = 0;
    matchedCount = 0;
    selected = [];
    // TWO FLIP CARD OF ARRAY EMPTY
    isPaused = false;
    isInputLocked = false;
    // MISMATCH LOCK /TIME OVER/WIN LOCK

    clearInterval(interval);
    // OLDER TIME DEL

    timer = remainingTime;
    // SHOW TIMER
    scoreEl.textContent = score;
    // UPDATE UI SCORE
    timeEl.textContent = timer;
    // UPDATE UI TIME
    matchesEl.textContent = matchedCount;
    // SHOW HOW MANY CARDS HAVE BEEN SUCCESFULLY MATCHED SO FAR

    board.innerHTML = "";
    // CLEAN OLDER CARD
    message.classList.add("hidden");
    // LEVEL COMP ->TIME OVER MSG HIDE

    pauseBtn.textContent = "Pause";
    // RESET THE PAUSE BOTTON
}
// CREATE BOARDS
function createBoard(total) {
    board.classList.remove("easy", "medium", "hard");
    // REMOVE THE BEFORE CLASS LEVEL
    board.classList.add(currentLevel);
    // ADD NEW LEVEL

    let arr = [];
    // STORE THE CARD VALUE

    for (let i = 1; i <= total / 2; i++) {
        arr.push(i, i);
    }
    // USING LOOP DIV BY 2 BEACAUSE MATCH PAIR CARD

    arr = shuffle(arr);
    // PAIR THE RANDOM POSITION FIX

// SET THE NO OF THE COLUMNS
    let cols = Math.sqrt(total);
    board.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

    arr.forEach(value => {
        const card = document.createElement("div");
        card.className = "card";
        // CREATE NEW DIV CARD
        card.dataset.value = value;
        // SET THE MATCHING CARD VALUE

        card.innerHTML = `
            <div class="inner">
                <div class="front">?</div>
                <div class="back">${value}</div>
            </div>
            
        `;
        // CREATE THE CARD FRONT AND BAC
        // THIS STRUCTURE BASE ON CSS FLIP ANIMATION

        card.onclick = () => {
            if (!isInputLocked) flipCard(card);
        };
        // IF CARD FLIP BUT INPUT LOCKED HONE PR CARD NOT FLIP

        board.appendChild(card);
        // ADD TWO CARD IN BOARD
        // ALL CARD ARRANGE IN GRID
    });
    
    
}

// fFLIP CARD
function flipCard(card) {
    if (isPaused) return;  
    // IF GAME PAUSE CARD NOT FLIP
    if (isInputLocked) return; 
    // IF WRONG MATCHH THEN 600MS LETTER THEN FLIP BLOCK
    if (card.classList.contains("flipped")) return;
    // STOP TWO TIME FLIP CARD
    if (selected.length === 2) return;
    // ONE TIME TWO CARD FLIP

    flipSound.play();
    // START SOUND
    card.classList.add("flipped");
    // CSS 3D ROTATE
    selected.push(card);
    // AFTER FLIP THE ADD EMPTY ARRAY

    if (selected.length === 2) checkMatch();
    // IF TWO CARD FLIP THE CHECK MATCH RUN
}

// CHECK MATCH
function checkMatch() {
    const [c1, c2] = selected;

    isInputLocked = true;
    // FIRST CARD MATCH THEN NEXT CARD FLIP

    // MATCH CASES-

    if (c1.dataset.value === c2.dataset.value) {
        matchSound.play();

        score += 10;
        matchedCount += 2;
// UI UPDATE
        scoreEl.textContent = score;
        matchesEl.textContent = matchedCount;
// EMPTY ARRAY THEN CARD FLIP
        selected = [];
        isInputLocked = false;
        // WIN CONDITION

        if (matchedCount === levelConfig[currentLevel]) {
            winSound.play();
            clearInterval(interval);
            isInputLocked = true;
            message.textContent = "🎉 Level Complete!";
            message.classList.remove("hidden");
        }

    } else {
        // WRONG CASE(MISMATCH)
        wrongSound.play();
        setTimeout(() => {
            c1.classList.remove("flipped");
            c2.classList.remove("flipped");
            selected = [];
            isInputLocked = false;
        }, 600);
        // 600 MS AFTER CARD FLIP
    }
}

// TIMER
function startTimer() {
    clearInterval(interval);
    // OLDER TIME BAND

    interval = setInterval(() => {
        if (isPaused) return;
        // FUN RUN IN EACH SECOND
        // AFTER PAUSE THEN TIMER STOP

        remainingTime--;
        // TIME = TIME-1
        timeEl.textContent = remainingTime;
        // UPDATE SCREEN TIME


// TIME OVER CASE
        if (remainingTime <= 0) {
            clearInterval(interval);
            isInputLocked = true;
            message.textContent = "⏳ Time Over!";
            message.classList.remove("hidden");
        }
    }, 1000);
}

// SHUFFLE
function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
//    Shuffle = swapping array elements from the end to the beginning with random positions so the entire deck gets perfectly mixed.
}
// BUTTONS
// PAUSE BTN
pauseBtn.onclick = () => {
    isPaused = !isPaused;
    pauseBtn.textContent = isPaused ? "Resume" : "Pause";

    if (!isPaused) startTimer();
};
// RESTART BTN
restartBtn.onclick = () => {
    remainingTime = timerConfig[currentLevel];
    startGame(currentLevel);
};
// BACK BTN
backBtn.onclick = () => {
    clearInterval(interval);
    gameScreen.classList.add("hidden");
    levelScreen.classList.remove("hidden");
    message.classList.add("hidden");
};


