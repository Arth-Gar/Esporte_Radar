import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Radio, Sparkles, Activity, Shield, Tv } from 'lucide-react';

interface PreloaderProps {
  isLoading: boolean;
  onFinished?: () => void;
}

export function Preloader({ isLoading, onFinished }: PreloaderProps) {
  const [progress, setProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('Sintonizando sinal da CBF e emissoras...');

  useEffect(() => {
    if (!isLoading) {
      setProgress(100);
      return;
    }

    setProgress(0);
    const startTime = Date.now();
    const duration = 1500; // Exact 1.5 seconds

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.floor((elapsed / duration) * 100));
      setProgress(pct);

      if (pct > 70) {
        setStatusMessage('Mapeando grade do Brasileirão e transmissões...');
      } else if (pct > 35) {
        setStatusMessage('Conectando aos servidores do Esporte Radar...');
      }

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
          exit={{ opacity: 0, scale: 1.04, transition: { duration: 0.5, ease: 'easeInOut' } }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#020704] text-slate-100 overflow-hidden select-none"
        >
          {/* Fundo com efeito de Grade Cibernética e Radar Radial */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.15)_0%,transparent_75%)] pointer-events-none" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#092215_1px,transparent_1px),linear-gradient(to_bottom,#092215_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] opacity-30 pointer-events-none" />

          {/* Radar Central Animado */}
          <div className="relative flex items-center justify-center w-52 h-52 mb-8">
            {/* Anéis de Sinal em Expansão */}
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [0.15, 0.5, 0.15] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 rounded-full border-2 border-emerald-500/30"
            />
            <motion.div
              animate={{ scale: [1, 1.25, 1], opacity: [0.25, 0.7, 0.25] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
              className="absolute inset-4 rounded-full border border-teal-400/40"
            />
            <div className="absolute inset-8 rounded-full border border-green-950 bg-[#05140d]/90 backdrop-blur-md shadow-2xl shadow-emerald-500/20 flex items-center justify-center" />

            {/* Linha de Varredura do Radar */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 rounded-full flex items-center justify-center overflow-hidden pointer-events-none"
            >
              <div className="w-1/2 h-1/2 bg-gradient-to-tr from-emerald-500/40 via-teal-400/20 to-transparent origin-bottom-right rounded-tl-full" />
            </motion.div>

            {/* Ícone Iluminado Central */}
            <motion.div
              animate={{ scale: [0.95, 1.08, 0.95] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              className="relative z-10 w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/40 ring-4 ring-emerald-400/30"
            >
              <Radio className="w-8 h-8 text-slate-950 animate-pulse" />
            </motion.div>

            {/* Ponto Orbital */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 rounded-full flex items-start justify-center p-1"
            >
              <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-md shadow-emerald-400" />
            </motion.div>
          </div>

          {/* Título & Marca */}
          <div className="text-center z-10 space-y-2 mb-6 px-4">
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <h1 className="text-2xl sm:text-3xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 uppercase drop-shadow-md">
                ESPORTE RADAR
              </h1>
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </motion.div>
            <p className="text-xs font-semibold tracking-wider text-emerald-400 uppercase font-mono">
              Sintonizando Transmissões ao Vivo e Agendadas
            </p>
          </div>

          {/* Barra de Progresso Suave (1.5s) */}
          <div className="w-72 sm:w-80 bg-[#081f13] border border-green-900 rounded-full h-3 p-0.5 overflow-hidden shadow-inner relative z-10">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-full shadow-md shadow-emerald-500/50"
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.05, ease: 'linear' }}
            />
          </div>

          {/* Mensagem de Status e Percentual */}
          <div className="mt-3 flex flex-col items-center space-y-1 z-10">
            <span className="text-xs font-medium text-emerald-300 font-mono tracking-tight animate-pulse flex items-center space-x-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>{statusMessage}</span>
            </span>
            <span className="text-[10px] font-bold text-green-500 font-mono">
              {progress}%
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
