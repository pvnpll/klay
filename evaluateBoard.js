const pieceValues = { p: 10, n: 30, b: 30, r: 50, q: 90, k: 900 };

function evaluateBoard(game) {
  let value = 0;
  const board = game.board();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece) {
        const val = pieceValues[piece.type] || 0;
        value += piece.color === 'w' ? val : -val;
      }
    }
  }
  return value;
}
