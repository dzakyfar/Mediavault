type GoogleCredentialResponse = {
  credential: string;
};

type GoogleAccounts = {
  id: {
    initialize: (options: {
      client_id: string;
      callback: (response: GoogleCredentialResponse) => void;
    }) => void;
    prompt: (callback?: (notification: GooglePromptNotification) => void) => void;
  };
};

type GooglePromptNotification = {
  isNotDisplayed: () => boolean;
  isSkippedMoment: () => boolean;
  isDismissedMoment: () => boolean;
  getNotDisplayedReason?: () => string;
  getSkippedReason?: () => string;
  getDismissedReason?: () => string;
};

declare global {
  interface Window {
    google?: {
      accounts: GoogleAccounts;
    };
  }
}

const GOOGLE_SCRIPT_ID = 'google-identity-services';

export function loadGoogleIdentityScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.google?.accounts) {
      resolve();
      return;
    }

    const existingScript = document.getElementById(GOOGLE_SCRIPT_ID);
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Gagal memuat Google Login')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = GOOGLE_SCRIPT_ID;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Gagal memuat Google Login'));
    document.head.appendChild(script);
  });
}

export async function requestGoogleCredential() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!clientId) {
    throw new Error('VITE_GOOGLE_CLIENT_ID belum dikonfigurasi');
  }

  await loadGoogleIdentityScript();

  return new Promise<string>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(new Error('Google Login tidak merespons. Coba refresh halaman atau cek konfigurasi OAuth origin.'));
    }, 30000);

    window.google?.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        window.clearTimeout(timeout);
        if (!response.credential) {
          reject(new Error('Credential Google tidak diterima'));
          return;
        }
        resolve(response.credential);
      },
    });

    window.google?.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed()) {
        window.clearTimeout(timeout);
        reject(new Error(`Google Login tidak tampil: ${notification.getNotDisplayedReason?.() || 'unknown reason'}`));
        return;
      }

      if (notification.isSkippedMoment()) {
        window.clearTimeout(timeout);
        reject(new Error(`Google Login dilewati: ${notification.getSkippedReason?.() || 'unknown reason'}`));
        return;
      }

      if (notification.isDismissedMoment()) {
        window.clearTimeout(timeout);
        reject(new Error(`Google Login ditutup: ${notification.getDismissedReason?.() || 'unknown reason'}`));
      }
    });
  });
}
