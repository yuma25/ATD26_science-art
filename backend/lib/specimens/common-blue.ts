import { SpecimenSettings } from "./types";

export const commonBlue: SpecimenSettings = {
  // モデルの大きさ（手のひらサイズ）
  scale: "1.2 1.2 1.2",
  // モデルの向き [X軸(上下) Y軸(左右) Z軸(傾き)]
  rotation: "-15 20 0",
  // 回転の揺れ
  outerAnimation:
    "property: rotation; from: -15 10 -5; to: -15 30 5; dur: 4500; easing: easeInOutSine; dir: alternate; loop: true",
  // 位置の移動（浮遊）
  // 絵画の表面（Z軸 0.05）に極めて近い位置で動かす
  innerAnimation:
    "property: position; to: 0.1 0.05 0.1; dur: 4000; easing: easeInOutSine; dir: alternate; loop: true",
  // AR空間でのピンチ操作による最小・最大サイズ制限
  minScale: 0.2,
  maxScale: 3.0,
};
