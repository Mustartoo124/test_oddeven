import React from "react";

function Square({ handleClick, value, isWinning, isPending, disabled }) {
  let squareClass = "square";

  if (isWinning) {
    squareClass += " square-winning";
  }

  if (isPending) {
    squareClass += " square-pending";
  }

  const isOdd = value > 0 && value % 2 === 1;
  const isEven = value > 0 && value % 2 === 0;

  if (isOdd) {
    squareClass += " square-odd";
  } else if (isEven) {
    squareClass += " square-even";
  }

  return (
    <button
      className={squareClass}
      onClick={handleClick}
      disabled={disabled}
    >
      {value}
    </button>
  );
}

export default Square;
