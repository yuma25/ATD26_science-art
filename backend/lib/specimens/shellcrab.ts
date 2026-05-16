import { SpecimenSettings } from "./types";

export const shellcrab: SpecimenSettings = {
  // モデルの大きさ
  scale: "3.0 3.0 3.0",
  // モデルの重心補正（絵画の表面に密着させ、位置を少し下げる）
  position: "0 -0.4 0.01",
  // モデルの向き
  rotation: "0 0 0",
  // 全体の回転アニメーション（停止）
  outerAnimation: "",
  // モデル自体の浮遊・揺れアニメーション
  // 絵画の表面（Z軸 0.01）にほぼ密着
  innerAnimation:
    "property: position; to: 0.05 0.02 0.05; dur: 3000; easing: easeInOutSine; dir: alternate; loop: true",
  // AR空間でのピンチ操作による最小・最大サイズ制限
  minScale: 0.2,
  maxScale: 3.0,
};
