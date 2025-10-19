import React, { useState, useEffect, useRef } from "react";
import Board from "./Board";

const calculateWinner = (squares) => {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (const [a, b, c] of lines) {
    if (
      squares[a] &&
      squares[a] === squares[b] &&
      squares[a] === squares[c]
    ) {
      return squares[a];
    }
  }

  if (!squares.includes(null)) {
    return 'Draw';
  }

  return null;
};


function Game() {
  const [squares, setSquares] = useState(Array(9).fill(null));
  const [player, setPlayer] = useState(null);
  const [isPlayable, setIsPlayable] = useState(false);
  const [winner, setWinner] = useState(null);
  const wsRef = useRef(null);


  useEffect(() => {
    if (wsRef.current) {
      return;
    }

    const ws = new WebSocket('ws://localhost:8081');
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'prepare'
      }));
    };

    wsRef.current.onmessage = (event) => {
      const { type, data } = JSON.parse(event.data);
  
      console.log('player', player);
      switch(type) {
        case 'start':
          setIsPlayable(data.player === 'X');
          setPlayer(data.player);
          break;
        case 'display':
          setIsPlayable(data.nextPlayer === player);
          setSquares(data.squares);
          break;
        default:
          break;
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    }

  }, []);

  //Declaring a Winner
  useEffect(() => {
    setWinner(calculateWinner(squares));
  }, [squares]);


  //Handle player
  const handleClick = (i) => {
    if (winner || squares[i] || !isPlayable) {
      return;
    }

    squares[i] = player;
    setSquares([...squares]);

    wsRef.current.send(JSON.stringify({
      data: {
        squares,
        nextPlayer: player === 'X' ? 'O' : 'X',
      },
      type: 'move',
    }));
  };

  //Restart game
  const handlRestart = () => {
    setWinner(null);
    setSquares(Array(9).fill(null));
  };

  return (
    <div className="main">
      <h2 className="result">Winner is: {winner ? winner : "N/N"}</h2>
      <div className="game">
        <span>{ isPlayable ? 'Your turn' : 'Please wait for the opponent' }</span>
        <span className="player">Next player is: { isPlayable ? player : player === 'X' ? 'O' : 'X' }</span>
        <Board squares={squares} handleClick={handleClick} />
      </div>
      <button onClick={handlRestart} className="restart-btn">
        Restart
      </button>
    </div>
  );
}

export default Game;
