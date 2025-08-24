/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />
/// <reference types="vite-plugin-svgr/client" />

interface ImportMetaEnv {
  readonly VITE_API_KEY: string;
  readonly VITE_AUTH_DOMAIN: string;
  readonly VITE_DATABASE_URL: string;
  readonly VITE_PROJECT_ID: string;
  readonly VITE_STORAGE_BUCKET: string;
  readonly VITE_MESSAGING_SENDER_ID: string;
  readonly VITE_APP_ID: string;
  readonly VITE_NOTIFICATION_TOKEN: string;
  readonly VITE_GOOGLE_IMAGES_TOKEN: string;
  readonly VITE_CUSTOMABLE_SEARCH_ENGINE_ID: string;
  readonly VITE_FUNCTIONS_BASE_URL: string;
  readonly VITE_TEST_TO?: string;
  readonly VITE_SERVER_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}