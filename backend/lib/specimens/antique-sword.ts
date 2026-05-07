import { SpecimenSettings } from "./types";

export const antiqueSword: SpecimenSettings = {
  // モデルの大きさ（絵画との調和を優先してさらに縮小）
  scale: "2.8 2.8 2.8",
  // モデルの重心補正（絵画の中心付近）
  position: "0 -1.5 0.3",
  // モデルの向き
  rotation: "0 0 0",
  // 全体の回転アニメーション
  outerAnimation:
    "property: rotation; to: 0 360 0; dur: 20000; easing: linear; loop: true",
  // モデル自体の浮遊・揺れアニメーション
  innerAnimation:
    "property: position; to: 0 0.5 1.0; dur: 10000; easing: easeInOutSine; dir: alternate; loop: true",
  // AR空間でのピンチ操作による最小・最大サイズ制限
  minScale: 0.3,
  maxScale: 7.0,
};
