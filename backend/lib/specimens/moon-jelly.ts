import { SpecimenSettings } from "./types";

export const moonJelly: SpecimenSettings = {
  // モデルの大きさ（絵画との調和を優先して縮小）
  scale: "4.0 4.0 4.0",
  // モデルの重心補正（絵画の下方から現れる）
  position: "0 -2.0 0.5",
  // モデルの向き
  rotation: "0 0 0",
  // 全体の回転アニメーション
  outerAnimation:
    "property: rotation; to: 0 360 0; dur: 60000; easing: linear; loop: true",
  // モデル自体の浮遊・揺れアニメーション
  innerAnimation:
    "property: position; to: 0.5 1.0 1.5; dur: 5000; easing: easeInOutSine; dir: alternate; loop: true",
  // AR空間でのピンチ操作による最小・最大サイズ制限
  minScale: 0.5,
  maxScale: 10.0,
};
