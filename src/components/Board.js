import React from "react";
import Square from "./Square";

export default function Board({
  board,
  handleClick,
  gameStarted,
  winner,
  winningLine,
  pendingSquares,
}) {
  const isWinningSquare = (index) => {
    return winningLine && winningLine.includes(index);
  };

  const squareComponents = board.map((value, index) => (
    <Square
      key={index}
      handleClick={() => handleClick(index)}
      value={value}
      isWinning={isWinningSquare(index)}
      isPending={pendingSquares && pendingSquares.has(index)}
      disabled={!gameStarted || winner}
    />
  ));

  const rows = [];
  for (let i = 0; i < 5; i++) {
    rows.push(
      <div key={i} className="board-row">
        {squareComponents.slice(i * 5, (i + 1) * 5)}
      </div>
    );
  }

  return (
    <div className="board">
      <div className="board-inner">{rows}</div>
    </div>
  );
}
