/**
 * 進捗率（パーセント）を計算する
 * @param total 全体の数
 * @param acquired 獲得済みの数
 * @returns 0-100 の整数
 */
export function calculateProgress(total: number, acquired: number): number {
  if (total <= 0) return 0;
  const percentage = (acquired / total) * 100;
  return Math.min(100, Math.max(0, Math.round(percentage)));
}
