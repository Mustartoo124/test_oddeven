const WebSocket = require('ws');
const http = require('http');

const server = http.createServer();
const wss = new WebSocket.Server({ server });

let gameState = {
  board: Array(25).fill(0),
  oddPlayer: null,
  evenPlayer: null,
  gameOver: false,
  winner: null,
  winningLine: null,
};

const checkWin = (board) => {
  const lines = [
    // Rows
    [0, 1, 2, 3, 4],
    [5, 6, 7, 8, 9],
    [10, 11, 12, 13, 14],
    [15, 16, 17, 18, 19],
    [20, 21, 22, 23, 24],
    // Columns
    [0, 5, 10, 15, 20],
    [1, 6, 11, 16, 21],
    [2, 7, 12, 17, 22],
    [3, 8, 13, 18, 23],
    [4, 9, 14, 19, 24],
    // Diagonals
    [0, 6, 12, 18, 24],
    [4, 8, 12, 16, 20],
  ];

  for (const line of lines) {
    const values = line.map(i => board[i]);
    
    // Check if all odd
    if (values.every(v => v > 0 && v % 2 === 1)) {
      return { winner: 'ODD', winningLine: line };
    }
    
    // Check if all even (and not 0, unless we allow 0 as even)
    if (values.every(v => v > 0 && v % 2 === 0)) {
      return { winner: 'EVEN', winningLine: line };
    }
  }

  return null;
};

const broadcastUpdate = (square, value) => {
  const message = JSON.stringify({
    type: 'UPDATE',
    square,
    value,
    board: gameState.board,
  });

  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};

const broadcastGameOver = (winner, winningLine) => {
  const message = JSON.stringify({
    type: 'GAME_OVER',
    winner,
    winningLine,
  });

  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};

const broadcastPlayerAssignment = (client, player, board) => {
  const message = JSON.stringify({
    type: 'PLAYER_ASSIGNED',
    player,
    board,
  });
  client.send(message);
};

const broadcastGameStart = () => {
  const message = JSON.stringify({
    type: 'GAME_START',
    board: gameState.board,
  });

  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};

wss.on('connection', (ws) => {
  // Assign player
  let playerType = null;

  if (!gameState.oddPlayer) {
    gameState.oddPlayer = ws;
    playerType = 'ODD';
    broadcastPlayerAssignment(ws, 'ODD', gameState.board);
  } else if (!gameState.evenPlayer) {
    gameState.evenPlayer = ws;
    playerType = 'EVEN';
    broadcastPlayerAssignment(ws, 'EVEN', gameState.board);
    // Both players connected, start game
    broadcastGameStart();
  } else {
    // Third player - reject
    ws.send(JSON.stringify({
      type: 'ERROR',
      message: 'Game is full. Only 2 players allowed.',
    }));
    ws.close();
    return;
  }

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);

      if (message.type === 'INCREMENT') {
        // Ignore moves after game is over
        if (gameState.gameOver) {
          return;
        }

        const square = message.square;

        if (square < 0 || square >= 25) {
          return;
        }

        // Increment the value
        gameState.board[square] += 1;
        const newValue = gameState.board[square];

        // Broadcast the update to all clients
        broadcastUpdate(square, newValue);

        // Check for winner
        const result = checkWin(gameState.board);
        if (result) {
          gameState.gameOver = true;
          gameState.winner = result.winner;
          gameState.winningLine = result.winningLine;
          broadcastGameOver(result.winner, result.winningLine);
        }
      } else if (message.type === 'RESTART') {
        // Reset game state for a new game
        gameState = {
          board: Array(25).fill(0),
          oddPlayer: gameState.oddPlayer,
          evenPlayer: gameState.evenPlayer,
          gameOver: false,
          winner: null,
          winningLine: null,
        };

        // Broadcast game start to both players
        if (gameState.oddPlayer && gameState.evenPlayer) {
          broadcastGameStart();
        }
      }
    } catch (err) {
      console.error('Error processing message:', err);
    }
  });

  ws.on('close', () => {
    // Player disconnected - end game
    if (!gameState.gameOver) {
      gameState.gameOver = true;
      const message = JSON.stringify({
        type: 'GAME_OVER',
        winner: 'DISCONNECT',
        message: 'Opponent disconnected',
      });
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    }

    // Reset player reference
    if (gameState.oddPlayer === ws) {
      gameState.oddPlayer = null;
    } else if (gameState.evenPlayer === ws) {
      gameState.evenPlayer = null;
    }

    // Reset game state if both players disconnected
    if (!gameState.oddPlayer && !gameState.evenPlayer) {
      gameState = {
        board: Array(25).fill(0),
        oddPlayer: null,
        evenPlayer: null,
        gameOver: false,
        winner: null,
        winningLine: null,
      };
    }
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
  });
});

const PORT = process.env.PORT || 8081;
server.listen(PORT, () => {
  console.log(`WebSocket server listening on port ${PORT}`);
});
