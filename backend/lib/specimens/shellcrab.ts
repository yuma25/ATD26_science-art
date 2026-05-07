import { SpecimenSettings } from "./types";

export const shellcrab: SpecimenSettings = {
  // モデルの大きさ（絵画との調和を優先してさらに縮小）
  scale: "3.5 3.5 3.5",
  // モデルの向き
  rotation: "0 0 0",
  // 全体の回転アニメーション（停止）
  outerAnimation: "",
  // モデル自体の浮遊・揺れアニメーション
  // 絵画の表面付近を移動
  innerAnimation:
    "property: position; to: 0.3 0.1 0.3; dur: 3000; easing: easeInOutSine; dir: alternate; loop: true",
  // AR空間でのピンチ操作による最小・最大サイズ制限
  minScale: 0.7,
  maxScale: 7.0,
};
