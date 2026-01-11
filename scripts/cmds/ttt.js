const fs = require("fs");
const path = require("path");
const { createCanvas } = require("canvas");

let games = {};

// 🎨 Background Themes
const backgrounds = {
  neon: {
    primary: "#0f0f1a",
    grid: "#9b59b6",
    xColor: "#3498db",
    oColor: "#e67e22",
    titleBg: "#8e44ad"
  },
  cyberpunk: {
    primary: "#1a1a2e",
    grid: "#00ff9d",
    xColor: "#ff0080",
    oColor: "#00eeff",
    titleBg: "#16213e"
  }
};

// 🎮 Theme Selection Function
function getRandomTheme() {
  const themes = Object.keys(backgrounds);
  return backgrounds[themes[Math.floor(Math.random() * themes.length)]];
}

// 🖼️ Board Render Function
function renderBoard(board, playerXName, playerOName) {
  const canvas = createCanvas(400, 460);
  const ctx = canvas.getContext("2d");

  const theme = getRandomTheme();
  
  // Background
  ctx.fillStyle = theme.primary;
  ctx.fillRect(0, 0, 400, 460);

  // Title bar
  ctx.fillStyle = theme.titleBg;
  ctx.fillRect(0, 0, 400, 60);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 22px Arial";
  ctx.textAlign = "center";
  ctx.fillText(`${playerXName} (X) 🆚 ${playerOName} (O)`, 200, 35);

  // Grid lines
  ctx.strokeStyle = theme.grid;
  ctx.shadowColor = theme.grid;
  ctx.shadowBlur = 15;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(133, 70);
  ctx.lineTo(133, 430);
  ctx.moveTo(266, 70);
  ctx.lineTo(266, 430);
  ctx.moveTo(0, 170);
  ctx.lineTo(400, 170);
  ctx.moveTo(0, 300);
  ctx.lineTo(400, 300);
  ctx.stroke();

  // Reset shadow
  ctx.shadowBlur = 0;

  // Draw X and O
  ctx.font = "bold 80px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let i = 0; i < 9; i++) {
    const x = (i % 3) * 133 + 67;
    const y = Math.floor(i / 3) * 130 + 120;

    if (board[i] === "X") {
      ctx.fillStyle = theme.xColor;
      ctx.shadowColor = theme.xColor;
      ctx.shadowBlur = 20;
      ctx.fillText("X", x, y);
      ctx.shadowBlur = 0;
    } else if (board[i] === "O") {
      ctx.fillStyle = theme.oColor;
      ctx.shadowColor = theme.oColor;
      ctx.shadowBlur = 20;
      ctx.fillText("O", x, y);
      ctx.shadowBlur = 0;
    }
  }

  return canvas.toBuffer();
}

// 🏆 Check Winner
function checkWinner(board) {
  const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for (let line of wins) {
    const [a,b,c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  if (board.every(cell => cell)) return "draw";
  return null;
}

// ⏰ Timer reset function
function resetTimer(gameId, message) {
  const game = games[gameId];
  if (!game) return;

  if (game.timeout) clearTimeout(game.timeout);

  game.timeout = setTimeout(() => {
    delete games[gameId];
    message.reply("⏰ Time's up! Game cancelled.");
  }, 60000);
}

module.exports = {
  config: {
    name: "ttt",
    aliases: ["tictactoe", "xoxo"],
    version: "3.0",
    author: "Azadx69x",
    countDown: 5,
    role: 0,
    shortDescription: "Play Tic Tac Toe",
    longDescription: "Play Tic Tac Toe game with mention",
    category: "game",
    guide: {
      en: "/ttt @mention → start game\nThen reply with 1-9"
    }
  },

  onStart: async function ({ message, event, usersData }) {
    try {
      // Make a copy of event to avoid const issues
      const eventData = JSON.parse(JSON.stringify(event));
      
      const mentions = Object.keys(eventData.mentions || {});
      if (mentions.length === 0) {
        return message.reply("❌ Please mention someone to start the game!");
      }

      const playerX = eventData.senderID;
      const playerO = mentions[0];

      const playerXName = await usersData.getName(playerX);
      const playerOName = await usersData.getName(playerO);

      const gameId = `${eventData.threadID}`;
      if (games[gameId]) {
        return message.reply("⚠️ A game is already running in this group!");
      }

      games[gameId] = {
        board: Array(9).fill(null),
        players: { X: playerX, O: playerO },
        names: { X: playerXName, O: playerOName },
        turn: "X",
        timeout: null
      };

      resetTimer(gameId, message);

      const img = renderBoard(games[gameId].board, playerXName, playerOName);
      const filePath = path.join(__dirname, "ttt.png");
      
      // Use writeFile instead of writeFileSync to avoid blocking
      fs.writeFile(filePath, img, (err) => {
        if (err) {
          console.error("Error saving image:", err);
          message.reply("❌ Error creating game board.");
          delete games[gameId];
          return;
        }
        
        message.reply({
          body: `🎮 Tic Tac Toe Started!\n\n👉 ${playerXName} = X\n👉 ${playerOName} = O\n\nFirst turn: X`,
          attachment: fs.createReadStream(filePath)
        });
      });

    } catch (error) {
      console.error("Error in onStart:", error);
      message.reply("❌ An error occurred while starting the game.");
    }
  },

  onChat: async function ({ message, event }) {
    try {
      // Make a copy of event to avoid const issues
      const eventData = JSON.parse(JSON.stringify(event));
      
      const gameId = `${eventData.threadID}`;
      const game = games[gameId];
      if (!game) return;

      // Check if message is a number
      const body = String(eventData.body || "").trim();
      const move = parseInt(body);
      if (isNaN(move) || move < 1 || move > 9) return;

      const player = Object.keys(game.players).find(
        key => game.players[key] === eventData.senderID
      );

      if (!player) return;
      if (game.turn !== player) {
        return message.reply("⏳ It's not your turn!");
      }

      const index = move - 1;
      if (game.board[index]) {
        return message.reply("❌ This cell is already filled!");
      }

      game.board[index] = player;
      game.turn = game.turn === "X" ? "O" : "X";

      resetTimer(gameId, message);

      const winner = checkWinner(game.board);
      const img = renderBoard(game.board, game.names.X, game.names.O);
      const filePath = path.join(__dirname, "ttt_current.png");
      
      fs.writeFile(filePath, img, (err) => {
        if (err) {
          console.error("Error saving image:", err);
          message.reply("❌ Error updating game board.");
          return;
        }

        if (winner) {
          clearTimeout(game.timeout);
          delete games[gameId];

          if (winner === "draw") {
            message.reply({
              body: "🤝 It's a draw!",
              attachment: fs.createReadStream(filePath)
            });
          } else {
            message.reply({
              body: `🏆 Winner: ${game.names[winner]} (${winner})`,
              attachment: fs.createReadStream(filePath)
            });
          }
        } else {
          message.reply({
            body: `👉 Now it's ${game.names[game.turn]}'s (${game.turn}) turn`,
            attachment: fs.createReadStream(filePath)
          });
        }
      });

    } catch (error) {
      console.error("Error in onChat:", error);
      // Don't send error message to avoid spam
    }
  }
};
