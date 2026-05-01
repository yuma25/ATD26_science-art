import * as React from "react";

/**
 * グローバル変数の型定義
 * ブラウザに読み込まれた外部ライブラリ（A-FrameやThree.js）を、
 * TypeScriptから安全に使用できるように定義します。
 */
declare global {
  const AFRAME: {
    registerComponent: (name: string, component: object) => void;
    [key: string]: unknown;
  };
  const THREE: typeof import("three");

  /**
   * Reactコンポーネントの中で、標準のHTMLタグ（divやspan）以外の
   * 特殊なタグ（model-viewerやa-scene）をエラーなく書けるようにします。
   */
  namespace JSX {
    interface IntrinsicElements extends AFrameElements, ModelViewerElements {}
  }
}

/**
 * React 19 向けの型定義
 * Next.js 15などが使用する React 19 においても、
 * 同様に特殊なタグをサポートするための記述です。
 */
declare module "react" {
  namespace JSX {
    interface IntrinsicElements extends AFrameElements, ModelViewerElements {}
  }
}

/**
 * Google <model-viewer> の型定義
 * 3Dモデルを表示するための Web Component 用の属性（Props）を定義します。
 */
interface ModelViewerElements {
  "model-viewer": React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLElement> & {
      src?: string;
      alt?: string;
      ar?: boolean;
      "ar-modes"?: string;
      "ar-scale"?: string;
      "ar-placement"?: string;
      "camera-controls"?: boolean;
      "auto-rotate"?: boolean;
      "shadow-intensity"?: string;
      "environment-image"?: string;
      exposure?: string;
      loading?: string;
      reveal?: string;
      poster?: string;
      "interaction-prompt"?: string;
      "shadow-softness"?: string;
    },
    HTMLElement
  >;
}

/**
 * A-Frame (AR) 用の型定義
 * AR（拡張現実）を実現するための A-Frame 用のタグを定義します。
 */
interface AFrameElements {
  "a-scene": React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLElement> & { [key: string]: unknown },
    HTMLElement
  >;
  "a-assets": React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLElement>,
    HTMLElement
  >;
  "a-entity": React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLElement> & { [key: string]: unknown },
    HTMLElement
  >;
  "a-camera": React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLElement> & { [key: string]: unknown },
    HTMLElement
  >;
  "a-asset-item": React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLElement> & { [key: string]: unknown },
    HTMLElement
  >;
  "a-gltf-model": React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLElement> & { [key: string]: unknown },
    HTMLElement
  >;
}

export {};
