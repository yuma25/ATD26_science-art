import { SpecimenSettings } from "./types";

export const shellcrab: SpecimenSettings = {
  // モデルの大きさ（6.0 に微調整）
  scale: "6.0 6.0 6.0",
  // モデルの向き（正面固定）
  rotation: "0 0 0",
  // 全体の回転アニメーション（停止）
  outerAnimation: "",
  // モデル自体の浮遊・揺れアニメーション
  // 正面を向いたまま左右に 1m ほど横移動させる
  innerAnimation:
    "property: position; to: 1.0 0.1 0; dur: 3000; easing: easeInOutSine; dir: alternate; loop: true",
  // AR空間でのピンチ操作による最小・最大サイズ制限
  minScale: 1.0,
  maxScale: 15.0,
};
