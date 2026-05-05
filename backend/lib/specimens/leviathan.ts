import { SpecimenSettings } from "./types";

export const leviathan: SpecimenSettings = {
  scale: "0.8 0.8 0.8",
  outerAnimation:
    "property: rotation; to: 0 0 360; dur: 40000; easing: linear; loop: true",
  innerAnimation:
    "property: position; to: 0 0 0.1; dur: 8000; easing: easeInOutSine; dir: alternate; loop: true",
  minScale: 0.2,
  maxScale: 2.0,
};
