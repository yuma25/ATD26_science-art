import { SpecimenSettings } from "./types";

export const commonBlue: SpecimenSettings = {
  // モデルの大きさ（絵画との調和を優先して縮小）
  scale: "6.0 6.0 6.0",
  // モデルの向き [X軸(上下) Y軸(左右) Z軸(傾き)]
  rotation: "-15 20 0",
  // 回転の揺れ
  outerAnimation:
    "property: rotation; from: -15 10 -5; to: -15 30 5; dur: 4500; easing: easeInOutSine; dir: alternate; loop: true",
  // 位置の移動（浮遊）
  // 絵画の少し手前（Z軸 1.5）に配置
  innerAnimation:
    "property: position; to: 0.5 0.5 1.5; dur: 4000; easing: easeInOutSine; dir: alternate; loop: true",
  // AR空間でのピンチ操作による最小・最大サイズ制限
  minScale: 1.0,
  maxScale: 10.0,
};
