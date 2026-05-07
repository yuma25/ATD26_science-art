import { SpecimenSettings } from "./types";

export const leviathan: SpecimenSettings = {
  // モデルの大きさ（拡大）
  scale: "15.0 15.0 15.0",
  // モデルの重心補正（半径 5m の旋回に拡大、より手前を通るように）
  position: "0 0 5.0",
  // モデルの向き（X軸 90度で水平、Y軸 90度で横向き）
  rotation: "90 90 0",
  // 全体の回転アニメーション（40秒で1回旋回）
  outerAnimation:
    "property: rotation; from: 90 90 0; to: 90 450 0; dur: 40000; easing: linear; loop: true",
  // モデル自体の浮遊・揺れアニメーション
  // 半径 5m を維持しつつ、手前の方へ浮き沈みさせる
  innerAnimation:
    "property: position; to: 0 1.5 5.5; dur: 15000; easing: easeInOutSine; dir: alternate; loop: true",
  // AR空間でのピンチ操作による最小・最大サイズ制限
  minScale: 2.0,
  maxScale: 25.0,
};
