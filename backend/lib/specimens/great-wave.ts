import { SpecimenSettings } from "./types";

export const greatWave: SpecimenSettings = {
  // モデルの大きさ（絵画との調和を優先してさらに縮小）
  scale: "2.8 2.8 2.8",
  // モデルの重心補正（絵画の面に近づける）
  position: "0 -0.7 0.1",
  // モデルの向き
  rotation: "0 45 0",
  // 全体の回転アニメーション（停止）
  outerAnimation: "",
  // モデル自体の揺れアニメーション
  innerAnimation:
    "property: rotation; from: -10 40 -10; to: 15 50 10; dur: 3000; easing: easeInOutSine; dir: alternate; loop: true",
  // AR空間でのピンチ操作による最小・最大サイズ制限
  minScale: 0.3,
  maxScale: 7.0,
};
