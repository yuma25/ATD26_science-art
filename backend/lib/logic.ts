/**
 * 【計算ロジック】
 * アプリケーション内で使用される共通の計算処理をまとめています。
 */

/**
 * --- 進捗率の計算 ---
 * 全体の数と獲得した数から、進捗をパーセント（0〜100）で計算します。
 *
 * @param {number} total - 全体の数（目標数）
 * @param {number} acquired - 獲得済みの数（現在の成果）
 * @returns {number} 0-100 の整数（進捗率）
 */
export function calculateProgress(total: number, acquired: number): number {
  // 1. 分母（全体の数）が 0 以下の場合は計算できないため、0% を返します（早期リターン）
  if (total <= 0) {
    return 0;
  }

  // 2. 割合を計算して 100 を掛け、パーセント形式にします
  const percentage = (acquired / total) * 100;

  // 3. 数値を丸めて（四捨五入）、0 から 100 の範囲内に収まるように調整して返します
  // Math.round: 四捨五入
  // Math.max(0, ...): 0 未満にならないようにする
  // Math.min(100, ...): 100 を超えないようにする
  return Math.min(100, Math.max(0, Math.round(percentage)));
}
