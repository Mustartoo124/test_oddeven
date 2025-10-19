import React, { useState, useEffect, useRef } from "react";
import Board from "./Board";
import ChaosMode from "./ChaosMode";

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

    // Check if all even
    if (values.every(v => v > 0 && v % 2 === 0)) {
      return { winner: 'EVEN', winningLine: line };
    }
  }

  return null;
};

function Game() {
  const [board, setBoard] = useState(Array(25).fill(0));
  const [player, setPlayer] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const [winner, setWinner] = useState(null);
  const [winningLine, setWinningLine] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [pendingSquares, setPendingSquares] = useState(new Set());
  const [chaosMode, setChaosMode] = useState(false);
  const wsRef = useRef(null);
  const originalSendRef = useRef(null);

  const handleChaosToggle = (enabled, delay) => {
    setChaosMode(enabled);

    if (!wsRef.current) return;

    if (enabled) {
      // Wrap the send function with chaos delay
      if (!originalSendRef.current) {
        originalSendRef.current = wsRef.current.send.bind(wsRef.current);
      }

      wsRef.current.send = (data) => {
        const randomDelay = Math.random() * delay;
        setTimeout(() => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            originalSendRef.current(data);
          }
        }, randomDelay);
      };
    } else {
      // Restore original send function
      if (originalSendRef.current) {
        wsRef.current.send = originalSendRef.current;
      }
    }
  };

  useEffect(() => {
    if (wsRef.current) {
      return;
    }

    const ws = new WebSocket('ws://localhost:8081');
    wsRef.current = ws;
    originalSendRef.current = ws.send.bind(ws);

    ws.onopen = () => {
      console.log('Connected to server');
      setConnectionStatus('Connected');
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('Received message:', message);

        switch (message.type) {
          case 'PLAYER_ASSIGNED':
            setPlayer(message.player);
            setBoard([...message.board]);
            setWinner(null);
            setWinningLine(null);
            setConnectionStatus('Waiting for opponent...');
            break;

          case 'GAME_START':
            setGameStarted(true);
            setConnectionStatus('Connected');
            setBoard([...message.board]);
            setWinner(null);
            setWinningLine(null);
            setPendingSquares(new Set());
            break;

          case 'UPDATE':
            setBoard([...message.board]);
            setPendingSquares(prev => {
              const newSet = new Set(prev);
              newSet.delete(message.square);
              return newSet;
            });

            // Check for win after update
            const result = checkWin(message.board);
            if (result) {
              setWinner(result.winner);
              setWinningLine(result.winningLine);
            }
            break;

          case 'GAME_OVER':
            if (message.winner === 'DISCONNECT') {
              setConnectionStatus('Opponent disconnected');
              setWinner('DISCONNECT');
            } else {
              setWinner(message.winner);
              setWinningLine(message.winningLine);
            }
            break;

          case 'ERROR':
            setConnectionStatus('Error: ' + message.message);
            break;

          default:
            break;
        }
      } catch (err) {
        console.error('Error parsing message:', err);
      }
    };

    ws.onclose = () => {
      console.log('Disconnected from server');
      setConnectionStatus('Disconnected');
    };

    ws.onerror = (err) => {
      console.error('WebSocket error event:', err);
      console.error('WebSocket ready state:', ws.readyState);
      console.error('WebSocket URL:', ws.url);
      setConnectionStatus('Connection error - check console for details');
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, []);

  const handleClick = (squareIndex) => {
    if (!gameStarted || winner || !wsRef.current) {
      return;
    }

    // Optimistic update
    const newBoard = [...board];
    newBoard[squareIndex] += 1;
    setBoard(newBoard);

    // Track as pending
    setPendingSquares(prev => new Set(prev).add(squareIndex));

    // Send to server
    wsRef.current.send(
      JSON.stringify({
        type: 'INCREMENT',
        square: squareIndex,
      })
    );
  };

  const handleRestart = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'RESTART',
        })
      );
    }
    setWinner(null);
    setWinningLine(null);
    setBoard(Array(25).fill(0));
  };

  const playerDisplay = player ? `You are ${player} Player` : 'Assigning player...';
  const statusDisplay =
    winner === 'DISCONNECT'
      ? 'Opponent disconnected - Game ended'
      : winner === 'ODD'
      ? 'ODD PLAYER WINS! 🎉'
      : winner === 'EVEN'
      ? 'EVEN PLAYER WINS! 🎉'
      : gameStarted
      ? `Active Game - ${connectionStatus}`
      : connectionStatus;

  return (
    <div className="main">
      <div className="game-header">
        <h1 className="game-title">Odd/Even Tic-Tac-Toe</h1>
        <p className="player-info">{playerDisplay}</p>
        <p className="connection-status">{statusDisplay}</p>
      </div>

      <ChaosMode onToggle={handleChaosToggle} isEnabled={chaosMode} />

      {gameStarted && !winner && (
        <div className="game-instructions">
          <p>Click any square to increment by 1</p>
          <p>
            {player === 'ODD'
              ? 'Help odd numbers win (1, 3, 5, 7, ...)'
              : 'Help even numbers win (2, 4, 6, 8, ...)'}
          </p>
        </div>
      )}

      <Board
        board={board}
        handleClick={handleClick}
        gameStarted={gameStarted}
        winner={winner}
        winningLine={winningLine}
        pendingSquares={pendingSquares}
      />

      {winner && (
        <div className="game-over-message">
          {winner === 'DISCONNECT' ? (
            <h2 className="result">Game Ended</h2>
          ) : (
            <h2 className="result">{winner} PLAYER WINS!</h2>
          )}
        </div>
      )}

      {winner && (
        <button onClick={handleRestart} className="restart-btn">
          Start New Game
        </button>
      )}
    </div>
  );
}

export default Game;
