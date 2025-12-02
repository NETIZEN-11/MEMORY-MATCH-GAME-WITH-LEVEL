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


