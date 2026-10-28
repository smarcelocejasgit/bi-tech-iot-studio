/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CAMERA_GATEWAY_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
