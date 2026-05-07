import { SpecimenSettings } from "./types";

export const antiqueSword: SpecimenSettings = {
  // モデルの大きさ（手のひらサイズ）
  scale: "1.0 1.0 1.0",
  // モデルの重心補正（クジラに合わせて中央付近に配置）
  position: "0 0 0.01",
  // モデルの向き
  rotation: "0 0 0",
  // 全体の回転アニメーション
  outerAnimation:
    "property: rotation; to: 0 360 0; dur: 20000; easing: linear; loop: true",
  // モデル自体の浮遊・揺れアニメーション（手前への移動を最小化）
  innerAnimation:
    "property: position; to: 0 0.1 0.05; dur: 10000; easing: easeInOutSine; dir: alternate; loop: true",
  // AR空間でのピンチ操作による最小・最大サイズ制限
  minScale: 0.1,
  maxScale: 3.0,
};
