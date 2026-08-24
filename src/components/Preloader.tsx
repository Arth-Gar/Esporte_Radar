import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface PreloaderProps {
  isLoading: boolean;
  onFinished?: () => void;
}

export function Preloader({ isLoading, onFinished }: PreloaderProps) {
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    if (!isLoading) {
      setProgress(100);
      return;
    }

    setProgress(0);
    const startTime = Date.now();
    const duration = 3500; // 3.5s exatos

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.floor((elapsed / duration) * 100));
      setProgress(pct);

      if (elapsed >= duration) {
        clearInterval(interval);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [isLoading]);

  return (
    <AnimatePresence onExitComplete={onFinished}>
      {isLoading && (
        <motion.div
          key="esporte-radar-preloader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.4, ease: 'easeOut' } }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#020704] text-slate-100 overflow-hidden select-none"
        >
          {/* Fundo escuro com iluminação verde central */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.12)_0%,transparent_70%)] pointer-events-none" />

          {/* Container Principal do Preloader */}
          <div className="relative flex flex-col items-center justify-center my-auto">
            

            {/* TV / MONITOR RETRÔ */}
            <div className="relative flex flex-col items-center">
              
              {/* ANTENAS DA TV EM V */}
              <div className="relative w-28 h-10 flex justify-center -mb-1">
                <div className="w-1.5 h-12 bg-gradient-to-t from-slate-600 to-emerald-400 rounded-full transform -rotate-30 origin-bottom shadow-sm shadow-emerald-400/30" />
                <div className="w-1.5 h-12 bg-gradient-to-t from-slate-600 to-emerald-400 rounded-full transform rotate-30 origin-bottom shadow-sm shadow-emerald-400/30" />
                <div className="absolute bottom-0 w-6 h-3 bg-slate-800 rounded-t-lg border border-slate-700" />
              </div>

              {/* MOLDURA DA TV / GABINETE */}
              <div className="relative w-64 h-52 sm:w-72 sm:h-56 bg-[#081b11] border-4 border-green-900/80 rounded-3xl p-3 shadow-2xl shadow-emerald-500/20 flex items-center justify-center">
                
                {/* TELA DA TV COM O RADAR ESTILO PURE CSS */}
                <div className="relative w-full h-full bg-[#020b06] border-2 border-emerald-500/40 rounded-2xl overflow-hidden flex items-center justify-center shadow-inner">
                  
                  {/* CÍRCULO DO RADAR (ESTILO CSS CONCENTRIC RINGS) */}
                  <div className="relative w-36 h-36 sm:w-40 sm:h-40 flex items-center justify-center rounded-full bg-[#03130a] border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.15)] overflow-hidden">
                    
                    {/* ANÉIS CONCÊNTRICOS EM PURE CSS (repeating-radial-gradient) */}
                    <div 
                      className="absolute inset-0 rounded-full pointer-events-none"
                      style={{
                        background: 'repeating-radial-gradient(circle at center, transparent 0, transparent 18px, rgba(52, 211, 153, 0.22) 19px, transparent 20px)'
                      }}
                    />

                    {/* CRUZ DE MIRA (CROSSHAIR LINES) */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-full h-[1px] bg-emerald-500/30" />
                      <div className="h-full w-[1px] bg-emerald-500/30" />
                    </div>

                    {/* BOLA DE FUTEBOL VETORIAL INTEGRADA AO RADAR */}
                    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full text-emerald-400/70 fill-current pointer-events-none z-10 opacity-75">
                      <circle cx="50" cy="50" r="46" fill="transparent" stroke="currentColor" strokeWidth="1.8" />
                      <polygon points="50,32 63,42 58,58 42,58 37,42" fill="currentColor" opacity="0.35" />
                      <line x1="50" y1="32" x2="50" y2="10" stroke="currentColor" strokeWidth="1.5" />
                      <line x1="63" y1="42" x2="82" y2="30" stroke="currentColor" strokeWidth="1.5" />
                      <line x1="58" y1="58" x2="78" y2="72" stroke="currentColor" strokeWidth="1.5" />
                      <line x1="42" y1="58" x2="22" y2="72" stroke="currentColor" strokeWidth="1.5" />
                      <line x1="37" y1="42" x2="18" y2="30" stroke="currentColor" strokeWidth="1.5" />
                    </svg>

                    {/* PONTOS DE ALVO PULSANTES (BLIPS) */}
                    <motion.div
                      animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.25, 0.8] }}
                      transition={{ duration: 1.4, repeat: Infinity, delay: 0.1 }}
                      className="absolute top-7 left-10 w-2 h-2 rounded-full bg-emerald-300 shadow-[0_0_8px_#34d399] z-10"
                    />
                    <motion.div
                      animate={{ opacity: [0.1, 0.9, 0.1], scale: [0.8, 1.2, 0.8] }}
                      transition={{ duration: 1.4, repeat: Infinity, delay: 0.7 }}
                      className="absolute bottom-9 right-8 w-2 h-2 rounded-full bg-teal-300 shadow-[0_0_8px_#5eead4] z-10"
                    />

                    {/* VARREDURA DE RADAR ESTILO CODEPEN (RADAR SWEEP BEAM ROTATING FROM VERTEX AT CENTER) */}
                    <motion.div
                      animate={{ rotate: -360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                      style={{ transformOrigin: 'center center' }}
                      className="absolute inset-0 rounded-full pointer-events-none z-20"
                    >
                      {/* Leque de Conic-Gradient com rastro e fatia de abertura */}
                      <div 
                        className="w-full h-full rounded-full"
                        style={{
                          background: 'conic-gradient(from 0deg at 50% 50%, rgba(52, 211, 153, 0.85) 0deg, rgba(52, 211, 153, 0.25) 45deg, rgba(16, 185, 129, 0.05) 90deg, transparent 90deg)'
                        }}
                      />
                      {/* Raio frontal neon brilhante que nasce no centro (50%, 50%) */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[2px] h-1/2 bg-emerald-300 shadow-[0_0_10px_#34d399] origin-bottom" />
                    </motion.div>

                    {/* VÉRTICE/PONTO CENTRAL DO RADAR */}
                    <div className="absolute w-2.5 h-2.5 bg-emerald-300 rounded-full shadow-[0_0_8px_#34d399] z-30" />

                  </div>

                </div>

              </div>

            </div>

            {/* TÍTULO E BARRA DE PROGRESSO SLIM */}
            <div className="mt-6 flex flex-col items-center space-y-3">
              <h1 className="text-xl sm:text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 uppercase">
                ESPORTE RADAR
              </h1>

              {/* Barra de Progresso Simples */}
              <div className="w-56 bg-[#081f13] border border-green-900 rounded-full h-2 p-0.5 overflow-hidden relative">
                <motion.div
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-full shadow-sm shadow-emerald-400"
                  initial={{ width: '0%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.05, ease: 'linear' }}
                />
              </div>

              <span className="text-[11px] font-mono font-bold text-emerald-400 tracking-wider">
                Sintonizando transmissões... {progress}%
              </span>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
