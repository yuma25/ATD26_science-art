import { SpecimenSettings } from "./types";

export const shellcrab: SpecimenSettings = {
  // モデルの大きさ（絵画との調和を優先して縮小）
  scale: "5.0 5.0 5.0",
  // モデルの向き
  rotation: "0 0 0",
  // 全体の回転アニメーション（停止）
  outerAnimation: "",
  // モデル自体の浮遊・揺れアニメーション
  // 絵画の表面付近を移動
  innerAnimation:
    "property: position; to: 0.5 0.1 0.5; dur: 3000; easing: easeInOutSine; dir: alternate; loop: true",
  // AR空間でのピンチ操作による最小・最大サイズ制限
  minScale: 1.0,
  maxScale: 10.0,
};
