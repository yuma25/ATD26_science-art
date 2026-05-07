import { SpecimenSettings } from "./types";

export const leviathan: SpecimenSettings = {
  // モデルの大きさ（手のひらサイズ）
  scale: "1.2 1.2 1.2",
  // モデルの重心補正（絵画の表面スレスレで旋回）
  position: "0 0 0.05",
  // モデルの向き
  rotation: "90 90 0",
  // 全体の回転アニメーション
  outerAnimation:
    "property: rotation; from: 90 90 0; to: 90 450 0; dur: 40000; easing: linear; loop: true",
  // モデル自体の浮遊・揺れアニメーション（手前への突出を抑える）
  innerAnimation:
    "property: position; to: 0 0.1 0.15; dur: 15000; easing: easeInOutSine; dir: alternate; loop: true",
  // AR空間でのピンチ操作による最小・最大サイズ制限
  minScale: 0.2,
  maxScale: 4.0,
};
