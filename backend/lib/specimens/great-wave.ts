import { SpecimenSettings } from "./types";

export const greatWave: SpecimenSettings = {
  // モデルの大きさ（絵画との調和を優先して縮小）
  scale: "4.0 4.0 4.0",
  // モデルの重心補正（絵画の面に近づける）
  position: "0 -1.0 0.2",
  // モデルの向き
  rotation: "0 45 0",
  // 全体の回転アニメーション（停止）
  outerAnimation: "",
  // モデル自体の揺れアニメーション
  innerAnimation:
    "property: rotation; from: -10 40 -10; to: 15 50 10; dur: 3000; easing: easeInOutSine; dir: alternate; loop: true",
  // AR空間でのピンチ操作による最小・最大サイズ制限
  minScale: 0.5,
  maxScale: 10.0,
};
