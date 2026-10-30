/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CAMERA_GATEWAY_URL?: string;
  readonly VITE_BITECH_ASSISTANT_MODEL?: string;
  readonly VITE_FIREBASE_APPCHECK_DEBUG?: string;
  readonly VITE_FIREBASE_APPCHECK_SITE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
