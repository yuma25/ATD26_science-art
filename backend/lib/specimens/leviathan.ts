import { SpecimenSettings } from "./types";

export const leviathan: SpecimenSettings = {
  // モデルの大きさ（絵画との調和を優先して縮小）
  scale: "6.0 6.0 6.0",
  // モデルの重心補正（絵画に近い距離での旋回）
  position: "0 0 1.5",
  // モデルの向き
  rotation: "90 90 0",
  // 全体の回転アニメーション
  outerAnimation:
    "property: rotation; from: 90 90 0; to: 90 450 0; dur: 40000; easing: linear; loop: true",
  // モデル自体の浮遊・揺れアニメーション
  innerAnimation:
    "property: position; to: 0 1.0 1.8; dur: 15000; easing: easeInOutSine; dir: alternate; loop: true",
  // AR空間でのピンチ操作による最小・最大サイズ制限
  minScale: 1.0,
  maxScale: 12.0,
};
