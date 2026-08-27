// Chrome/Android lancia `beforeinstallprompt` quasi subito dopo il caricamento,
// spesso prima che il banner sia montato: lo intercettiamo qui (importato da
// main.js) e lo teniamo da parte finche' non serve.

let deferred = null;
const listeners = new Set();

function notify() {
  listeners.forEach((cb) => cb());
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // niente banner di sistema: usiamo il nostro
    deferred = e;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    notify();
  });
}

export function getInstallPrompt() {
  return deferred;
}

export function onInstallPromptChange(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

// Mostra il prompt nativo di Android. Torna true se l'utente ha accettato.
export async function showInstallPrompt() {
  if (!deferred) return false;
  const evt = deferred;
  deferred = null;
  notify();
  evt.prompt();
  const { outcome } = await evt.userChoice;
  return outcome === 'accepted';
}
