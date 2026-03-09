const GRID_SIZE = 3;
const TOTAL_CARDS = GRID_SIZE * GRID_SIZE; // 9
const PAIRS_COUNT = 4; // 8 张牌参与配对，剩余 1 张作为装饰卡

const COLORS = ["#e74c3c", "#3498db", "#2ecc71", "#f1c40f"];

const { createApp } = Vue;

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

createApp({
  data() {
    return {
      screen: "intro", // intro | game
      cards: [],
      firstIndex: null,
      secondIndex: null,
      lockBoard: false,
      isInitialReveal: false,
      matchedCount: 0,
      initialRevealMs: 1500,
      flipBackDelayMs: 600,
      initialTimerId: null,
      flipBackTimerId: null,
    };
  },
  mounted() {
    // #region agent log
    fetch('http://127.0.0.1:7480/ingest/364f0178-665f-49bf-9eb0-352c804e2082', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': '8de089',
      },
      body: JSON.stringify({
        sessionId: '8de089',
        runId: 'pre-fix',
        hypothesisId: 'H1',
        location: 'script.js:mounted',
        message: 'Vue app mounted',
        data: { screen: this.screen },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion agent log
  },
  methods: {
    startGame() {
      this.screen = "game";
      this.playBgm();
      this.setupCards();
      // #region agent log
      fetch('http://127.0.0.1:7480/ingest/364f0178-665f-49bf-9eb0-352c804e2082', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Debug-Session-Id': '8de089',
        },
        body: JSON.stringify({
          sessionId: '8de089',
          runId: 'pre-fix',
          hypothesisId: 'H2',
          location: 'script.js:startGame',
          message: 'startGame invoked',
          data: { screenAfter: this.screen },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion agent log
    },
    restartGame() {
      if (this.screen !== "game") return;
      this.setupCards();
      // #region agent log
      fetch('http://127.0.0.1:7480/ingest/364f0178-665f-49bf-9eb0-352c804e2082', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Debug-Session-Id': '8de089',
        },
        body: JSON.stringify({
          sessionId: '8de089',
          runId: 'pre-fix',
          hypothesisId: 'H3',
          location: 'script.js:restartGame',
          message: 'restartGame invoked',
          data: { screenCurrent: this.screen },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion agent log
    },
    setupCards() {
      if (this.initialTimerId) {
        clearTimeout(this.initialTimerId);
        this.initialTimerId = null;
      }
      if (this.flipBackTimerId) {
        clearTimeout(this.flipBackTimerId);
        this.flipBackTimerId = null;
      }

      this.firstIndex = null;
      this.secondIndex = null;
      this.lockBoard = true;
      this.isInitialReveal = true;
      this.matchedCount = 0;

      const pairColors = [];
      for (let i = 0; i < PAIRS_COUNT; i++) {
        pairColors.push(COLORS[i], COLORS[i]);
      }
      shuffle(pairColors);

      const cards = [];
      for (let i = 0; i < TOTAL_CARDS; i++) {
        if (i < pairColors.length) {
          cards.push({
            id: i,
            color: pairColors[i],
            dummy: false,
            flipped: true, // 初始展示
            matched: false,
          });
        } else {
          // 第 9 张占位卡
          cards.push({
            id: i,
            color: "#7f8c8d",
            dummy: true,
            flipped: true,
            matched: false,
          });
        }
      }

      this.cards = cards;

      this.initialTimerId = setTimeout(() => {
        this.finishInitialReveal();
      }, this.initialRevealMs);
    },
    finishInitialReveal() {
      this.cards = this.cards.map((card) => ({
        ...card,
        flipped: false,
        matched: false,
      }));
      this.isInitialReveal = false;
      this.lockBoard = false;
    },
    handleCardClick(index) {
      if (this.lockBoard || this.isInitialReveal) return;
      const card = this.cards[index];
      if (!card || card.dummy || card.matched || card.flipped) return;

      this.flipCard(index);

      if (this.firstIndex === null) {
        this.firstIndex = index;
        return;
      }

      this.secondIndex = index;
      this.lockBoard = true;

      const firstCard = this.cards[this.firstIndex];
      const secondCard = this.cards[this.secondIndex];

      if (firstCard.color === secondCard.color) {
        this.handleMatch();
      } else {
        this.handleMismatch();
      }
    },
    flipCard(index) {
      this.cards[index] = {
        ...this.cards[index],
        flipped: true,
      };
    },
    handleMatch() {
      this.cards[this.firstIndex] = {
        ...this.cards[this.firstIndex],
        matched: true,
      };
      this.cards[this.secondIndex] = {
        ...this.cards[this.secondIndex],
        matched: true,
      };

      this.matchedCount += 2;
      this.resetTurn();

      if (this.matchedCount === PAIRS_COUNT * 2) {
        setTimeout(() => {
          alert("全部配对完成！");
        }, 300);
      }
    },
    handleMismatch() {
      this.flipBackTimerId = setTimeout(() => {
        this.cards[this.firstIndex] = {
          ...this.cards[this.firstIndex],
          flipped: false,
        };
        this.cards[this.secondIndex] = {
          ...this.cards[this.secondIndex],
          flipped: false,
        };
        this.resetTurn();
      }, this.flipBackDelayMs);
    },
    resetTurn() {
      this.firstIndex = null;
      this.secondIndex = null;
      this.lockBoard = false;
      this.flipBackTimerId = null;
    },
    cardBackground(card) {
      if (this.isInitialReveal) {
        return card.color;
      }
      if (card.flipped || card.matched) {
        return card.color;
      }
      return "#000";
    },
    playBgm() {
      const audio = this.$refs.bgm;
      if (audio && audio.paused) {
        audio.play().catch(() => {
          // 忽略可能的自动播放限制错误
        });
      }
    },
  },
}).mount("#app");

