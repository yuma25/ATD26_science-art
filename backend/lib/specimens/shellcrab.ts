import { SpecimenSettings } from "./types";

export const shellcrab: SpecimenSettings = {
  // モデルの大きさ（拡大）
  scale: "10.0 10.0 10.0",
  // モデルの向き（正面固定）
  rotation: "0 0 0",
  // 全体の回転アニメーション（停止）
  outerAnimation: "",
  // モデル自体の浮遊・揺れアニメーション
  // 正面を向いたまま左右に 1m、手前(Z軸)に 2m ほど動かす
  innerAnimation:
    "property: position; to: 1.0 0.1 2.0; dur: 3000; easing: easeInOutSine; dir: alternate; loop: true",
  // AR空間でのピンチ操作による最小・最大サイズ制限
  minScale: 2.0,
  maxScale: 25.0,
};
