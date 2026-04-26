/**
 * Calculate the best number of columns for a stamp grid so rows are balanced.
 * Prefers the column count that leaves the fewest empty cells in the last row,
 * while keeping rows under a max so stamps fit the fixed card shape.
 * Shared across business owner preview, staff page, and staff modal.
 */
export function getStampGridCols(total: number): number {
  if (total <= 3) return total; // single row for 1-3
  if (total <= 5) return 3;    // 4→3+1, 5→3+2 — avoids tall single-row stretch
  const maxCols = total <= 10 ? 5 : total <= 20 ? 7 : 10;
  const maxRows = 7; // cap rows so stamps fit the rectangular card
  let best = maxCols;
  let bestScore = -Infinity;
  for (let c = 3; c <= maxCols; c++) {
    const rows = Math.ceil(total / c);
    const empty = (c - (total % c)) % c;
    // Hard penalty if rows exceed max — forces more columns
    const rowPenalty = rows > maxRows ? (rows - maxRows) * 100 : 0;
    const score = -empty * 10 - rows - rowPenalty;
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return best;
}

/**
 * Fixed loyalty card aspect ratio — standard credit/loyalty card proportions.
 * The card shape never changes; stamps adapt their size to fit inside.
 */
export const STAMP_CARD_ASPECT = 1.586;
