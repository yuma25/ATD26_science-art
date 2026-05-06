import { SpecimenSettings } from "./types";

export const leviathan: SpecimenSettings = {
  // モデルの大きさ（8.0 に微調整して画面に収まりやすく）
  scale: "8.0 8.0 8.0",
  // モデルの重心補正（半径 2m の旋回に縮小）
  position: "0 0 2.0",
  // モデルの向き（X軸 90度で水平、Y軸 90度で横向き）
  rotation: "90 90 0",
  // 全体の回転アニメーション（40秒で1回旋回）
  outerAnimation:
    "property: rotation; from: 90 90 0; to: 90 450 0; dur: 40000; easing: linear; loop: true",
  // モデル自体の浮遊・揺れアニメーション
  // 半径 2m を維持しつつ、15秒かけてゆっくりと 1.5m 浮き沈みさせる
  innerAnimation:
    "property: position; to: 0 1.5 2.0; dur: 15000; easing: easeInOutSine; dir: alternate; loop: true",
  // AR空間でのピンチ操作による最小・最大サイズ制限
  minScale: 1.0,
  maxScale: 15.0,
};
