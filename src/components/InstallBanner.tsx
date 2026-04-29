import { useState, useEffect, useRef } from 'react';

const DISMISS_KEY = 'install-banner-dismissed';
const DISMISS_DAYS = 7;

function isDismissed(): boolean {
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const ts = Number(raw);
  return Date.now() - ts < DISMISS_DAYS * 86400000;
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true
  );
}

type Platform = 'ios' | 'android' | null;

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return null;
}

export function InstallBanner() {
  const [visible, setVisible] = useState(false);
  const deferredPrompt = useRef<any>(null);
  const platform = useRef<Platform>(null);

  useEffect(() => {
    if (isStandalone() || isDismissed()) return;
    platform.current = detectPlatform();

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e;
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // iOS doesn't fire beforeinstallprompt — show after short delay
    if (platform.current === 'ios') {
      const t = setTimeout(() => setVisible(true), 2000);
      return () => { clearTimeout(t); window.removeEventListener('beforeinstallprompt', handler); };
    }

    // For Android, also show after delay if prompt hasn't fired
    const t = setTimeout(() => setVisible(true), 3000);
    return () => { clearTimeout(t); window.removeEventListener('beforeinstallprompt', handler); };
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  const handleInstall = async () => {
    if (deferredPrompt.current) {
      deferredPrompt.current.prompt();
      const result = await deferredPrompt.current.userChoice;
      if (result.outcome === 'accepted') dismiss();
      deferredPrompt.current = null;
    }
  };

  if (!visible) return null;

  const isIOS = platform.current === 'ios';

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[100] max-w-md mx-auto animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-card border border-border rounded-2xl shadow-2xl p-4 flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-xl">
          📱
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">ホーム画面に追加</p>
          {isIOS ? (
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Safari下部の <span className="inline-block text-primary font-semibold">共有ボタン ↑</span> →「ホーム画面に追加」でアプリとして使えます
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              ホーム画面に追加するとアプリとして素早くアクセスできます
            </p>
          )}
          <div className="flex items-center gap-2 mt-2">
            {!isIOS && deferredPrompt.current && (
              <button
                onClick={handleInstall}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                インストール
              </button>
            )}
            <button
              onClick={dismiss}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg text-muted-foreground hover:text-foreground hover:bg-border/50 transition-colors"
            >
              閉じる
            </button>
          </div>
        </div>
        <button onClick={dismiss} className="text-muted-foreground hover:text-foreground text-lg leading-none -mt-1">
          ✕
        </button>
      </div>
    </div>
  );
}
