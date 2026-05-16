import { SpecimenSettings } from "./types";

export const moonJelly: SpecimenSettings = {
  // モデルの大きさ
  scale: "4.5 4.5 4.5",
  // モデルの重心補正（絵画の表面に密着させ、位置を少し下げる）
  position: "0 -0.4 0.01",
  // モデルの向き
  rotation: "0 0 0",
  // 全体の回転アニメーション
  outerAnimation:
    "property: rotation; to: 0 360 0; dur: 60000; easing: linear; loop: true",
  // モデル自体の浮遊・揺れアニメーション
  innerAnimation:
    "property: position; to: 0.05 0.1 0.05; dur: 5000; easing: easeInOutSine; dir: alternate; loop: true",
  // AR空間でのピンチ操作による最小・最大サイズ制限
  minScale: 0.1,
  maxScale: 3.0,
};
