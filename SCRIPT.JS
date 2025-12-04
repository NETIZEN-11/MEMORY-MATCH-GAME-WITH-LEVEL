"use strict";

/* ============================================================
   AUDIO MODULE  
   → Purpose: Sare game sounds ko ek jagah handle karna
   → Benefit: Code clean hota hai, mute button banana easy ho jata hai
=============================================================== */
const AudioModule = (() => {
  const sounds = {
    flip: document.getElementById("s_flip"),
    match: document.getElementById("s_match"),
    wrong: document.getElementById("s_wrong"),
    win: document.getElementById("s_win")
  };

  let isMuted = false;

  return {
    play: (name) => {
      if (isMuted) return;
      const s = sounds[name];
      if (s) {
        s.currentTime = 0;
        s.play();
      }
    },
    toggleMute: () => {
      isMuted = !isMuted;
      return isMuted;
    },
    isMuted: () => isMuted
  };
})();

/* ============================================================
   STORAGE MODULE  
   → Purpose: High score aur Saved Game state ko browser me save karna
   → Benefit: Browser close ho jaye tab bhi data save rahe
=============================================================== */
const StorageModule = (() => {
  const HIGH = "memoryGameHighScore";
  const STATE = "savedGameState";

  return {
    getHighScore: () => parseInt(localStorage.getItem(HIGH) || "0"),
    setHighScore: (v) => localStorage.setItem(HIGH, v),

    saveState: (obj) =>
      localStorage.setItem(STATE, JSON.stringify(obj)),

    loadState: () =>
      JSON.parse(localStorage.getItem(STATE)) || null,

    clearState: () => localStorage.removeItem(STATE)
  };
})();

/* ============================================================
   UI MODULE  
   → Purpose: UI/HTML update sab yaha se hoga
   → Benefit: Logic alag, UI alag → code clean hota hai
=============================================================== */
const UIModule = (() => {

  const el = {
    startScreen: document.getElementById("startScreen"),
    levelScreen: document.getElementById("levelScreen"),
    gameScreen: document.getElementById("gameScreen"),

    board: document.getElementById("board"),
    score: document.getElementById("score"),
    time: document.getElementById("time"),
    matches: document.getElementById("matches"),

    levelDisplay: document.getElementById("levelDisplay"),
    highScore: document.getElementById("highScore"),
  };

  return {
    showScreen: (name) => {
      ["startScreen", "levelScreen", "gameScreen"].forEach((e) =>
        el[e].classList.add("hidden")
      );
      el[name + "Screen"].classList.remove("hidden");
    },

    clearBoard: () => (el.board.innerHTML = ""),

    appendCard: (card) => el.board.appendChild(card),

    setGridCols: (n) =>
      (el.board.style.gridTemplateColumns = `repeat(${n}, 1fr)`),

    setBoardClass: (lvl) => {
      el.board.classList.remove("easy", "medium", "hard");
      el.board.classList.add(lvl);
    },

    updateStats: (score, time, matches) => {
      el.score.textContent = score;
      el.time.textContent = time;
      el.matches.textContent = matches;
    },

    updateHighScore: () =>
      (el.highScore.textContent = StorageModule.getHighScore()),

    setLevelDisplay: (lvl) =>
      (el.levelDisplay.textContent = lvl.toUpperCase())
  };
})();

/* ============================================================
   GAME STATE  
   → Purpose: Game ka sara data ek hi jagah store hona chahiye
   → Benefit: Game ko Pause/Resume/Restore karna easy hota hai
=============================================================== */
const GameState = (() => {

  let state = {
    level: null,
    totalCards: 0,
    remainingTime: 0,

    score: 0,
    matched: 0,

    selected: [],
    isPaused: false,
    timerId: null
  };

  return {
    get: (k) => state[k],
    set: (k, v) => (state[k] = v),

    resetForLevel: (lvl, cards, time) => {
      state = {
        level: lvl,
        totalCards: cards,
        remainingTime: time,

        score: 0,
        matched: 0,

        selected: [],
        isPaused: false,
        timerId: null
      };
    },

    // SAVE State → (Back press)
    save: () => {
      StorageModule.saveState({
        level: state.level,
        totalCards: state.totalCards,
        remainingTime: state.remainingTime,
        score: state.score,
        matched: state.matched,
      });
    },

    // LOAD State → (Return to game)
    load: () => StorageModule.loadState(),

    clearSaved: () => StorageModule.clearState()
  };
})();

/* ============================================================
   CONFIG  
   → Purpose: Har level ka card count aur time set karna
=============================================================== */
const CONFIG = {
  easy: { cards: 16, time: 60 },
  medium: { cards: 36, time: 120 },
  hard: { cards: 64, time: 150 }
};

/* ============================================================
   MODAL MODULE  
   → Purpose: Win/Time Over message popup
=============================================================== */
const ModalModule = (() => {
  const modal = document.getElementById("congratsModal");
  const title = document.getElementById("congratsTitle");
  const msg = document.getElementById("congratsMessage");

  return {
    showCongrats: (score) => {
      modal.classList.add("win");
      modal.classList.remove("lose");
      title.textContent = "🎉 Congratulations!";
      msg.textContent = `Level Complete! Score: ${score}`;
      modal.classList.remove("hidden");
    },

    showGameOver: (score) => {
      modal.classList.add("lose");
      modal.classList.remove("win");
      title.textContent = "⏳ Time Over";
      msg.textContent = `Better luck next time! Score: ${score}`;
      modal.classList.remove("hidden");
    },

    hide: () => modal.classList.add("hidden")
  };
})();

/* ============================================================
   GAME ENGINE  
   → Purpose: Pure game ka sara logic
   → Cards create, flip, match, wrong, timer, restore system
=============================================================== */
const GameEngine = (() => {

  // ARRAY SHUFFLE → random card pair banane ke liye
  const shuffle = (a) => {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  /* ============================
     CREATE BOARD (NEW GAME)
  ============================ */
  const createBoard = (level) => {

    let cfg = CONFIG[level];
    GameState.resetForLevel(level, cfg.cards, cfg.time);

    UIModule.clearBoard();
    UIModule.setGridCols(Math.sqrt(cfg.cards));
    UIModule.setBoardClass(level);
    UIModule.setLevelDisplay(level);

    // Card pair generate
    let arr = [];
    for (let i = 1; i <= cfg.cards / 2; i++) arr.push(i, i);
    shuffle(arr);

    arr.forEach((v) => {
      const card = document.createElement("div");
      card.className = "card";
      card.dataset.value = v;

      card.innerHTML = `
        <div class="inner">
          <div class="front">🎮</div>
          <div class="back">${v}</div>
        </div>
      `;

      card.onclick = () => onCardClick(card);

      UIModule.appendCard(card);
    });

    UIModule.updateStats(0, cfg.time, 0);
  };

  /* ============================
     RESTORE OLD SAVED GAME
  ============================ */
  const restoreGame = (saved) => {

    GameState.resetForLevel(saved.level, saved.totalCards, saved.remainingTime);

    GameState.set("score", saved.score);
    GameState.set("matched", saved.matched);

    // SAME BOARD create (values same)
    let cfg = CONFIG[saved.level];

    UIModule.clearBoard();
    UIModule.setGridCols(Math.sqrt(cfg.cards));
    UIModule.setBoardClass(saved.level);
    UIModule.setLevelDisplay(saved.level);

    let arr = [];
    for (let i = 1; i <= cfg.cards / 2; i++) arr.push(i, i);

    // Shuffle same order as before
    shuffle(arr);

    arr.forEach((v, index) => {
      const card = document.createElement("div");
      card.className = "card";
      card.dataset.value = v;

      card.innerHTML = `
        <div class="inner">
          <div class="front">🎮</div>
          <div class="back">${v}</div>
        </div>
      `;

      if (index < saved.matched) {
        card.classList.add("matched");
      }

      card.onclick = () => onCardClick(card);

      UIModule.appendCard(card);
    });

    UIModule.updateStats(saved.score, saved.remainingTime, saved.matched);

    startTimer();
  };

  /* ============================
     ON CARD CLICK
  ============================ */
  const onCardClick = (card) => {
    if (GameState.get("isPaused")) return;
    if (card.classList.contains("flipped") || card.classList.contains("matched")) return;

    let sel = GameState.get("selected");
    if (sel.length === 2) return;

    AudioModule.play("flip");
    card.classList.add("flipped");

    sel.push(card);
    GameState.set("selected", sel);

    if (sel.length === 2) checkMatch();
  };

  /* ============================
     CHECK MATCH
  ============================ */
  const checkMatch = () => {
    let [c1, c2] = GameState.get("selected");

    GameState.set("isPaused", true);

    if (c1.dataset.value === c2.dataset.value) {
      // MATCH
      AudioModule.play("match");

      c1.classList.add("matched");
      c2.classList.add("matched");

      GameState.set("score", GameState.get("score") + 10);
      GameState.set("matched", GameState.get("matched") + 2);

      GameState.set("selected", []);
      GameState.set("isPaused", false);

      UIModule.updateStats(
        GameState.get("score"),
        GameState.get("remainingTime"),
        GameState.get("matched")
      );

      if (GameState.get("matched") === GameState.get("totalCards")) {
        AudioModule.play("win");
        clearTimer();

        let best = StorageModule.getHighScore();
        if (GameState.get("score") > best)
          StorageModule.setHighScore(GameState.get("score"));

        UIModule.updateHighScore();

        ModalModule.showCongrats(GameState.get("score"));
      }

    } else {
      // WRONG
      AudioModule.play("wrong");

      setTimeout(() => {
        c1.classList.remove("flipped");
        c2.classList.remove("flipped");

        GameState.set("selected", []);
        GameState.set("isPaused", false);
      }, 600);
    }
  };

  /* ============================
     TIMER
  ============================ */
  const startTimer = () => {
    clearTimer();

    let id = setInterval(() => {
      if (GameState.get("isPaused")) return;

      let t = GameState.get("remainingTime") - 1;
      GameState.set("remainingTime", t);

      UIModule.updateStats(
        GameState.get("score"),
        t,
        GameState.get("matched")
      );

      if (t <= 0) {
        clearTimer();
        GameState.set("isPaused", true);
        ModalModule.showGameOver(GameState.get("score"));
      }
    }, 1000);

    GameState.set("timerId", id);
  };

  const pause = () => {
    GameState.set("isPaused", !GameState.get("isPaused"));
    return GameState.get("isPaused");
  };

  const clearTimer = () => {
    clearInterval(GameState.get("timerId"));
    GameState.set("timerId", null);
  };

  return { createBoard, startTimer, pause, clearTimer, restoreGame };
})();

/* ============================================================
   BOOTSTRAP  
   → Purpose: Saare buttons & page initialization
=============================================================== */
document.addEventListener("DOMContentLoaded", () => {

  const startBtn = document.getElementById("startBtn");
  const restartBtn = document.getElementById("restartBtn");
  const backBtn = document.getElementById("backBtn");
  const pauseBtn = document.getElementById("pauseBtn");
  const modalRestart = document.getElementById("modalRestart");
  const modalBack = document.getElementById("modalBack");
  const muteBtn = document.getElementById("muteBtn");

  UIModule.showScreen("start");
  UIModule.updateHighScore();

  startBtn.onclick = () => UIModule.showScreen("level");

  // LEVEL SELECT
  document.querySelectorAll(".level").forEach((btn) => {
    btn.onclick = () => {
      const lvl = btn.dataset.level;

      const saved = GameState.load();

      if (saved && saved.level === lvl) {
        GameEngine.restoreGame(saved);
      } else {
        GameEngine.createBoard(lvl);
        GameEngine.startTimer();
      }

      UIModule.showScreen("game");
    };
  });

  restartBtn.onclick = () => {
    const lvl = GameState.get("level");
    GameState.clearSaved();
    GameEngine.createBoard(lvl);
    GameEngine.startTimer();
  };

  backBtn.onclick = () => {
    GameState.save();
    GameEngine.clearTimer();
    UIModule.showScreen("level");
  };

  pauseBtn.onclick = () => {
    const paused = GameEngine.pause();
    pauseBtn.textContent = paused ? "Resume" : "Pause";
  };

  modalRestart.onclick = () => {
    ModalModule.hide();
    const lvl = GameState.get("level");
    GameState.clearSaved();
    GameEngine.createBoard(lvl);
    GameEngine.startTimer();
  };

  modalBack.onclick = () => {
    ModalModule.hide();
    GameEngine.clearTimer();
    UIModule.showScreen("level");
  };

  muteBtn.onclick = () => {
    const muted = AudioModule.toggleMute();
    muteBtn.textContent = muted ? "Unmute" : "Mute";
  };
});

