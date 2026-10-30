import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  CustomProvider,
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
} from 'firebase/app-check';

/**
 * Configuración pública de la app web registrada en Firebase. Esta API key
 * identifica la app Firebase; no es una Gemini API key ni un secreto privado.
 */
const firebaseConfig = {
  projectId: 'bi-tech-iot-studio',
  appId: '1:464426544267:web:b84a22c872f4843316388e',
  storageBucket: 'bi-tech-iot-studio.firebasestorage.app',
  apiKey: 'AIzaSyDegZFpMaqUtU9qIBQv9YZdCydyphe0_Pw',
  authDomain: 'bi-tech-iot-studio.firebaseapp.com',
  messagingSenderId: '464426544267',
};

// Site key pública del proveedor reCAPTCHA Enterprise registrado para esta
// app web. No es un secreto: el navegador la necesita para ejecutar App Check.
const RECAPTCHA_ENTERPRISE_SITE_KEY =
  '6LfF2AcuAAAAAAG2cdnKJ_Crm5VAImb2udKuNwgT';

export const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export type AppCheckMode = 'debug' | 'production' | 'not-configured';

let appCheckMode: AppCheckMode | null = null;

/**
 * App Check es opcional durante el arranque para que nunca bloquee Blockly.
 * En localhost puede activarse el proveedor debug sin guardar ningún token;
 * Firebase imprime un token efímero que debe registrarse manualmente en Console.
 */
export function initializeBiTechAppCheck(): AppCheckMode {
  if (appCheckMode) return appCheckMode;

  const debugEnabled =
    import.meta.env.DEV &&
    import.meta.env.VITE_FIREBASE_APPCHECK_DEBUG === 'true';
  const productionSiteKey = import.meta.env.PROD
    ? import.meta.env.VITE_FIREBASE_APPCHECK_SITE_KEY?.trim() ||
      RECAPTCHA_ENTERPRISE_SITE_KEY
    : '';

  if (debugEnabled) {
    const debugGlobal = globalThis as typeof globalThis & {
      FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean | string;
    };
    // Las pruebas E2E pueden inyectar un token efímero ya registrado antes de
    // que cargue la aplicación. En el navegador de desarrollo normal, `true`
    // hace que el SDK genere y conserve uno en IndexedDB para registrarlo en
    // Firebase Console.
    if (typeof debugGlobal.FIREBASE_APPCHECK_DEBUG_TOKEN !== 'string') {
      debugGlobal.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }
    initializeAppCheck(firebaseApp, {
      // En modo debug el SDK intercambia el debug token antes de invocar
      // este proveedor. El callback evita fabricar un token alternativo.
      provider: new CustomProvider({
        getToken: async () => {
          throw new Error('App Check debug provider no inicializado.');
        },
      }),
      isTokenAutoRefreshEnabled: true,
    });
    appCheckMode = 'debug';
    return appCheckMode;
  }

  if (productionSiteKey) {
    initializeAppCheck(firebaseApp, {
      provider: new ReCaptchaEnterpriseProvider(productionSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
    appCheckMode = 'production';
    return appCheckMode;
  }

  appCheckMode = 'not-configured';
  return appCheckMode;
}
