/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Google Analytics Measurement ID (G-XXXXXXXXXX format)
   */
  readonly VITE_GA_MEASUREMENT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
