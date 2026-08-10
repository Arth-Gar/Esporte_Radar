import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  X, 
  Smartphone, 
  Share, 
  Sparkles, 
  CheckCircle2, 
  Download,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function InstallPwaPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showIosInstructions, setShowIosInstructions] = useState(false);
  const [installedSuccessfully, setInstalledSuccessfully] = useState(false);

  useEffect(() => {
    // Check if already running in standalone mode (installed as web app)
    const isInStandaloneMode = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isInStandaloneMode) {
      setIsStandalone(true);
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Listen for beforeinstallprompt event on Android/Chrome/Edge
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for appinstalled
    window.addEventListener('appinstalled', () => {
      setInstalledSuccessfully(true);
      setDeferredPrompt(null);
      setTimeout(() => {
        setIsStandalone(true);
      }, 3000);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // If already running as PWA, don't show prompt
  if (isStandalone) {
    return null;
  }

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Trigger native browser install prompt
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setInstalledSuccessfully(true);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      // Show iOS step-by-step instructions modal
      setShowIosInstructions(true);
    } else {
      // General browser instructions fallback
      setShowIosInstructions(true);
    }
  };

  return (
    <>
      {/* FLOATING PROMPT BANNER / POPUP */}
      <AnimatePresence>
        {!isDismissed && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-20 right-4 sm:right-6 z-40 max-w-sm w-[calc(100vw-2rem)] bg-[#05180f] border border-seagreen/60 rounded-2xl p-4 shadow-2xl shadow-black/80 backdrop-blur-md space-y-3"
          >
            {/* CLOSE BUTTON */}
            <button
              onClick={() => setIsDismissed(true)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-[#020d06] text-green-500 hover:text-white hover:bg-green-900/60 transition-colors cursor-pointer"
              title="Fechar aviso"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>

            {installedSuccessfully ? (
              <div className="flex items-center gap-3 py-1 text-emerald-400">
                <CheckCircle2 className="h-6 w-6 shrink-0 text-seagreen" />
                <div className="text-xs font-bold leading-tight">
                  <p className="text-white">Ícone adicionado com sucesso!</p>
                  <p className="text-[10px] text-green-300 font-normal">Acesse direto da sua tela inicial.</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start gap-3 pr-6">
                  <div className="p-2.5 rounded-xl bg-seagreen/20 border border-seagreen/40 text-seagreen shrink-0">
                    <Smartphone className="h-5 w-5 animate-pulse" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.2 rounded bg-seagreen text-white">
                        Web App
                      </span>
                    </div>
                    <h4 className="text-xs font-black text-white uppercase tracking-tight">
                      Adicione nosso APP sem precisar ocupar espaço no seu celular!
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-green-950/80">
                  <button
                    onClick={handleInstallClick}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-seagreen hover:bg-seagreen-solid text-white font-black text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-seagreen/30 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>Adicionar à Tela Inicial</span>
                  </button>

                  <button
                    onClick={() => setIsDismissed(true)}
                    className="px-3 py-2.5 rounded-xl bg-[#020d06] hover:bg-green-950 border border-green-900/60 text-green-400 text-xs font-bold transition-all cursor-pointer"
                  >
                    Agora não
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* DISMISSED FLOATING SMALL RE-OPEN BADGE */}
      {isDismissed && !installedSuccessfully && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => setIsDismissed(false)}
          className="fixed bottom-20 right-4 z-40 px-3.5 py-2.5 rounded-full bg-[#05180f] border border-seagreen text-seagreen font-black text-xs uppercase tracking-wider shadow-2xl hover:bg-seagreen hover:text-white transition-all cursor-pointer flex items-center gap-2 group"
          title="Adicionar à Tela Inicial"
        >
          <Smartphone className="h-4 w-4 text-seagreen group-hover:text-white" />
          <span className="hidden sm:inline">Adicionar à Tela Inicial</span>
          <PlusCircle className="h-3.5 w-3.5 text-white" />
        </motion.button>
      )}

      {/* IOS / BROWSER STEP-BY-STEP INSTRUCTIONS MODAL */}
      <AnimatePresence>
        {showIosInstructions && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#05180f] border border-seagreen rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative text-left"
            >
              <button
                onClick={() => setShowIosInstructions(false)}
                className="absolute top-4 right-4 text-green-500 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-seagreen/20 text-seagreen border border-seagreen/40">
                  <Smartphone className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white tracking-tight uppercase">
                    Como Adicionar à Tela Inicial
                  </h3>
                  <p className="text-xs text-green-300">
                    Siga o passo a passo rápido do seu navegador:
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-green-200 bg-[#020d06] p-4 rounded-xl border border-green-950">
                {isIOS ? (
                  <>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-seagreen text-white font-black text-[11px] flex items-center justify-center shrink-0">1</span>
                      <p>Toque no ícone de <strong className="text-white font-bold inline-flex items-center gap-1"><Share className="h-3.5 w-3.5 text-seagreen" /> Compartilhar</strong> na barra do Safari.</p>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-seagreen text-white font-black text-[11px] flex items-center justify-center shrink-0">2</span>
                      <p>Role o menu para baixo e selecione <strong className="text-white font-bold flex items-center gap-1 mt-0.5"><PlusCircle className="h-3.5 w-3.5 text-seagreen" /> "Adicionar à Tela de Início"</strong>.</p>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-seagreen text-white font-black text-[11px] flex items-center justify-center shrink-0">3</span>
                      <p>Toque em <strong className="text-white font-bold">"Adicionar"</strong> no canto superior direito.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-seagreen text-white font-black text-[11px] flex items-center justify-center shrink-0">1</span>
                      <p>Abra o menu do seu navegador (três pontos <strong className="text-white">⋮</strong> no canto superior).</p>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-seagreen text-white font-black text-[11px] flex items-center justify-center shrink-0">2</span>
                      <p>Selecione a opção <strong className="text-white font-bold flex items-center gap-1 mt-0.5"><PlusCircle className="h-3.5 w-3.5 text-seagreen" /> "Instalar aplicativo"</strong> ou <strong className="text-white font-bold">"Adicionar à tela inicial"</strong>.</p>
                    </div>
                  </>
                )}
              </div>

              <div className="p-3 rounded-lg bg-green-950/40 border border-green-900/60 text-[11px] text-green-300 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-seagreen shrink-0" />
                <span>Pronto! O aplicativo abrirá instantaneamente sem ocupar espaço de memória no seu aparelho.</span>
              </div>

              <button
                onClick={() => setShowIosInstructions(false)}
                className="w-full py-2.5 rounded-xl bg-seagreen text-white text-xs font-black uppercase tracking-wider hover:bg-seagreen-solid hover:text-black transition-all cursor-pointer"
              >
                Entendi!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
