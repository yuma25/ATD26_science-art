import { SpecimenSettings } from "./types";

export const moonJelly: SpecimenSettings = {
  // モデルの大きさ（4.0 に微調整して画面に収まりやすく）
  scale: "4.0 4.0 4.0",
  // モデルの重心補正（6m 下げて、かなり下の方から現れるようにする）
  position: "0 -6.0 0",
  // モデルの向き [X軸(上下) Y軸(左右) Z軸(傾き)]
  rotation: "0 0 0",
  // 全体の回転アニメーション（60秒で超スロー旋回）
  outerAnimation:
    "property: rotation; to: 0 360 0; dur: 60000; easing: linear; loop: true",
  // モデル自体の浮遊・揺れアニメーション
  // 5秒かけて、上下(2m)だけでなく前後(2m)や左右(1m)にも大きく漂わせる
  innerAnimation:
    "property: position; to: 1.0 2.0 2.0; dur: 5000; easing: easeInOutSine; dir: alternate; loop: true",
  // AR空間でのピンチ操作による最小・最大サイズ制限
  minScale: 0.5,
  maxScale: 10.0,
};
