"use strict";

// ===== AUDIO MODULE =====
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
      if (s && typeof s.play === "function") {
        try { s.currentTime = 0; s.play(); } catch (e) {}
      }
    },
    toggleMute: () => { isMuted = !isMuted; return isMuted; },
    isMuted: () => isMuted
  };
})();

// ===== STORAGE MODULE =====
const StorageModule = (() => {
  const KEY = "memoryGameHighScore";
  return {
    getHighScore: () => parseInt(localStorage.getItem(KEY) || "0", 10),
    setHighScore: (v) => { localStorage.setItem(KEY, String(v)); }
  };
})();

// ===== UI MODULE =====
const UIModule = (() => {
  const el = {
    startScreen: document.getElementById('startScreen'),
    levelScreen: document.getElementById('levelScreen'),
    gameScreen: document.getElementById('gameScreen'),
    board: document.getElementById('board'),
    score: document.getElementById('score'),
    time: document.getElementById('time'),
    matches: document.getElementById('matches'),
    levelDisplay: document.getElementById('levelDisplay'),
    highScore: document.getElementById('highScore')
  };

  return {
    showScreen: (name) => {
      ['startScreen','levelScreen','gameScreen'].forEach(k => el[k].classList.add('hidden'));
      el[name + "Screen"].classList.remove('hidden');
    },
    clearBoard: () => el.board.innerHTML = "",
    appendCard: card => el.board.appendChild(card),
    setGridCols: c => el.board.style.gridTemplateColumns = `repeat(${c},1fr)`,
    setBoardClass: lvl => {
      el.board.classList.remove("easy","medium","hard");
      el.board.classList.add(lvl);
    },
    updateStats: (s,t,m) => {
      el.score.textContent = s;
      el.time.textContent = t;
      el.matches.textContent = m;
    },
    updateHighScore: () => el.highScore.textContent = StorageModule.getHighScore(),
    setLevelDisplay: lvl => el.levelDisplay.textContent = lvl.toUpperCase()
  };
})();

// ===== GAME STATE =====
const GameState = (() => {
  let state = {
    level: null, totalCards: 0, remainingTime: 0,
    score: 0, matched: 0, selected: [],
    isPaused: false, timerId: null
  };
  return {
    get: k => state[k],
    set: (k,v) => state[k] = v,
    resetForLevel: (lvl,cards,time) => {
      state = { level:lvl, totalCards:cards, remainingTime:time, score:0, matched:0, selected:[], isPaused:false, timerId:null };
    }
  };
})();

// ===== CONFIG =====
const CONFIG = {
  easy:{cards:16,time:60},
  medium:{cards:36,time:120},
  hard:{cards:64,time:150}
};

// ===== MODAL MODULE (WIN + LOSS FIXED) =====
const ModalModule = (() => {
  const modal = document.getElementById("congratsModal");
  const title = document.getElementById("congratsTitle");
  const msg = document.getElementById("congratsMessage");

  const setStyle = (win) => {
    modal.classList.toggle("win", win);
    modal.classList.toggle("lose", !win);
  };

  return {
    showCongrats: (score) => {
      setStyle(true);
      title.textContent = "🎉 Congratulations!";
      msg.textContent = `Level Complete! Score: ${score}`;
      modal.classList.remove("hidden");
    },
    showGameOver: (score) => {
      setStyle(false);
      title.textContent = "Time Over";
      msg.textContent = `Better luck next time! Score: ${score}`;
      modal.classList.remove("hidden");
    },
    hide: () => modal.classList.add("hidden")
  };
})();

// ===== GAME ENGINE =====
const GameEngine = (() => {

  const shuffle = a => { for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };

  const createBoard = level => {
    const cfg = CONFIG[level];
    GameState.resetForLevel(level,cfg.cards,cfg.time);

    UIModule.clearBoard();
    UIModule.setGridCols(Math.sqrt(cfg.cards));
    UIModule.setBoardClass(level);

    const arr=[];
    for(let i=1;i<=cfg.cards/2;i++) arr.push(i,i);
    shuffle(arr);

    arr.forEach(v=>{
      const card=document.createElement("div");
      card.className="card";
      card.dataset.value=v;
      card.innerHTML=`<div class="inner"><div class="front">🎮</div><div class="back">${v}</div></div>`;
      card.onclick=()=>onCardClick(card);
      UIModule.appendCard(card);
    });

    UIModule.updateStats(0,cfg.time,0);
  };

  const onCardClick = card => {
    if(GameState.get('isPaused')) return;
    if(card.classList.contains("flipped")) return;
    const sel = GameState.get('selected');
    if(sel.length===2) return;

    AudioModule.play("flip");
    card.classList.add("flipped");
    sel.push(card);
    GameState.set("selected",sel);

    if(sel.length===2) checkMatch();
  };

  const checkMatch = () => {
    const [c1,c2] = GameState.get('selected');
    GameState.set("isPaused",true);

    if(c1.dataset.value === c2.dataset.value){
      AudioModule.play("match");
      c1.classList.add("matched");
      c2.classList.add("matched");

      GameState.set("score",GameState.get("score")+10);
      GameState.set("matched",GameState.get("matched")+2);
      GameState.set("selected",[]);
      GameState.set("isPaused",false);

      UIModule.updateStats(
        GameState.get("score"),
        GameState.get("remainingTime"),
        GameState.get("matched")
      );

      if(GameState.get("matched") === GameState.get("totalCards")){
        AudioModule.play("win");
        GameEngine.clearTimer();

        StorageModule.setHighScore(
          Math.max(StorageModule.getHighScore(), GameState.get("score"))
        );
        UIModule.updateHighScore();

        ModalModule.showCongrats(GameState.get("score"));
      }

    } else {
      AudioModule.play("wrong");
      setTimeout(()=>{
        c1.classList.remove("flipped");
        c2.classList.remove("flipped");
        GameState.set("selected",[]);
        GameState.set("isPaused",false);
      },600);
    }
  };

  const startTimer = () => {
    clearInterval(GameState.get("timerId"));
    const tick = () => {
      if(GameState.get("isPaused")) return;
      const rem = GameState.get("remainingTime") - 1;
      GameState.set("remainingTime",rem);

      UIModule.updateStats(GameState.get("score"),rem,GameState.get("matched"));

      if(rem <= 0){
        GameEngine.clearTimer();
        GameState.set("isPaused",true);
        ModalModule.showGameOver(GameState.get("score")); // 🎯 FIXED
      }
    };
    GameState.set("timerId",setInterval(tick,1000));
  };

  const pause = () => GameState.set("isPaused", !GameState.get("isPaused"));
  const clearTimer = () => {clearInterval(GameState.get("timerId"));};

  return {createBoard,startTimer,pause,clearTimer};
})();

// ===== BOOTSTRAP =====
document.addEventListener("DOMContentLoaded",()=>{

  document.getElementById("startBtn").onclick=()=>UIModule.showScreen("level");

  document.querySelectorAll(".level").forEach(b=>{
    b.onclick=()=>{
      const lvl=b.dataset.level;
      GameEngine.createBoard(lvl);
      GameEngine.startTimer();
      UIModule.showScreen("game");
      UIModule.setLevelDisplay(lvl);
    };
  });

  document.getElementById("restartBtn").onclick=()=>{
    const lvl=GameState.get("level")||"easy";
    GameEngine.createBoard(lvl);
    GameEngine.startTimer();
  };

  document.getElementById("backBtn").onclick=()=>{
    GameEngine.clearTimer();
    UIModule.showScreen("level");
  };

  document.getElementById("modalRestart").onclick=()=>{
    ModalModule.hide();
    const lvl=GameState.get("level")||"easy";
    GameEngine.createBoard(lvl);
    GameEngine.startTimer();
  };

  document.getElementById("modalBack").onclick=()=>{
    ModalModule.hide();
    UIModule.showScreen("level");
  };

  UIModule.updateHighScore();
  UIModule.showScreen("start");
});
