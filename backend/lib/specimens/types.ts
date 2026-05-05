/**
 * 標本ごとの個別設定を定義するインターフェース
 */
export interface SpecimenSettings {
  // --- 基本トランスフォーム ---
  scale: string; // A-Frameでの初期サイズ（スキャン用）
  position?: string; // モデルの重心補正用（例: "0 0.5 0"）
  rotation?: string; // 初期向きの補正用（例: "0 90 0"）

  // --- アニメーション制御 ---
  outerAnimation: string; // 外側の動き（スキャン用）
  innerAnimation: string; // 内側の動き（スキャン用）
  animationMixer?: string; // GLB内部アニメーション設定（例: "clip: flight; timeScale: 2"）

  // --- AR挙動 ---
  minScale: number; // ARオートスケーリングの最小値
  maxScale: number; // ARオートスケーリングの最大値
}
