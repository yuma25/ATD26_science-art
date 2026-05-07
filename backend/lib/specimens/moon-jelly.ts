import { SpecimenSettings } from "./types";

export const moonJelly: SpecimenSettings = {
  // モデルの大きさ（拡大）
  scale: "8.0 8.0 8.0",
  // モデルの重心補正（3m 下げて、少し手前から現れるようにする）
  position: "0 -3.0 2.0",
  // モデルの向き [X軸(上下) Y軸(左右) Z軸(傾き)]
  rotation: "0 0 0",
  // 全体の回転アニメーション（60秒で超スロー旋回）
  outerAnimation:
    "property: rotation; to: 0 360 0; dur: 60000; easing: linear; loop: true",
  // モデル自体の浮遊・揺れアニメーション
  // 5秒かけて、上下だけでなく前後(Z軸)にも大きく漂わせ、カメラに近づける
  innerAnimation:
    "property: position; to: 1.0 2.0 4.0; dur: 5000; easing: easeInOutSine; dir: alternate; loop: true",
  // AR空間でのピンチ操作による最小・最大サイズ制限
  minScale: 1.0,
  maxScale: 20.0,
};
