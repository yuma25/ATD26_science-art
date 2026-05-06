import { SpecimenSettings } from "./types";

export const antiqueSword: SpecimenSettings = {
  // モデルの大きさ（4.0 に縮小）
  scale: "4.0 4.0 4.0",
  // モデルの重心補正（サイズに合わせて少し調整）
  position: "0 -2.5 0",
  // モデルの向き [X軸(上下) Y軸(左右) Z軸(傾き)]
  rotation: "0 0 0",
  // 全体の回転アニメーション（20秒でゆったり旋回）
  outerAnimation:
    "property: rotation; to: 0 360 0; dur: 20000; easing: linear; loop: true",
  // モデル自体の浮遊・揺れアニメーション
  // 10秒かけてゆっくり 1.0m 昇降
  innerAnimation:
    "property: position; to: 0 1.0 0; dur: 10000; easing: easeInOutSine; dir: alternate; loop: true",
  // AR空間でのピンチ操作による最小・最大サイズ制限
  minScale: 0.5,
  maxScale: 10.0,
};
