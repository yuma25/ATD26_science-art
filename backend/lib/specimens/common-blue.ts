import { SpecimenSettings } from "./types";

export const commonBlue: SpecimenSettings = {
  // モデルの大きさ（7.0 に拡大）
  scale: "7.0 7.0 7.0",
  // モデルの向き [X軸(上下) Y軸(左右) Z軸(傾き)]
  // X: マイナスで上向き / Y: プラスで左向き
  rotation: "-15 20 0",
  // 回転の揺れ（一回転させず、特定の角度範囲でゆらゆらさせる）
  outerAnimation:
    "property: rotation; from: -15 10 -5; to: -15 30 5; dur: 4500; easing: easeInOutSine; dir: alternate; loop: true",
  // 位置の移動（浮遊）
  // Z軸を 3.5 に設定し、画面のこちら側（ユーザー側）へ迫ってくる動きにする
  innerAnimation:
    "property: position; to: 1.0 1.5 3.5; dur: 4000; easing: easeInOutSine; dir: alternate; loop: true",
  // AR空間でのピンチ操作による最小・最大サイズ制限
  minScale: 1.0,
  maxScale: 15.0,
};
