import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Sun, 
  Moon, 
  Type, 
  Contrast, 
  Sparkles, 
  HelpCircle, 
  X, 
  Play, 
  Square, 
  Radio, 
  Keyboard, 
  Check, 
  Sliders
} from 'lucide-react';
import { 
  AccessibilitySettings, 
  speakTodayScheduleSummary, 
  speakLiveMatchesSummary, 
  stopSpeech, 
  subscribeSpeechState, 
  playAudioCue 
} from '../utils/accessibility';
import { FootballMatch } from '../types';

interface AccessibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AccessibilitySettings;
  onUpdateSettings: (newSettings: AccessibilitySettings) => void;
  matches: FootballMatch[];
}

export const AccessibilityModal: React.FC<AccessibilityModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  matches,
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentSpokenText, setCurrentSpokenText] = useState('');

  useEffect(() => {
    const unsub = subscribeSpeechState((speaking, text) => {
      setIsSpeaking(speaking);
      setCurrentSpokenText(text);
    });
    return unsub;
  }, []);

  if (!isOpen) return null;

  const isLight = settings.theme === 'light';

  const handleToggleTheme = () => {
    if (settings.soundEffects) playAudioCue('toggle');
    const newTheme = settings.theme === 'light' ? 'dark' : 'light';
    onUpdateSettings({ ...settings, theme: newTheme });
  };

  const handleSetFontSize = (size: 'normal' | 'large' | 'extra-large') => {
    if (settings.soundEffects) playAudioCue('select');
    onUpdateSettings({ ...settings, fontSize: size });
  };

  const handleToggleHighContrast = () => {
    if (settings.soundEffects) playAudioCue('toggle');
    onUpdateSettings({ ...settings, highContrast: !settings.highContrast });
  };

  const handleToggleAutoSpeech = () => {
    if (settings.soundEffects) playAudioCue('toggle');
    onUpdateSettings({ ...settings, autoSpeechOnFocus: !settings.autoSpeechOnFocus });
  };

  const handleToggleSoundEffects = () => {
    playAudioCue('toggle');
    onUpdateSettings({ ...settings, soundEffects: !settings.soundEffects });
  };

  const handleSpeechRateChange = (rate: number) => {
    onUpdateSettings({ ...settings, speechRate: rate });
  };

  const handleSpeakToday = () => {
    if (settings.soundEffects) playAudioCue('select');
    speakTodayScheduleSummary(matches, settings.speechRate);
  };

  const handleSpeakLive = () => {
    if (settings.soundEffects) playAudioCue('select');
    speakLiveMatchesSummary(matches, settings.speechRate);
  };

  const handleStopSpeech = () => {
    if (settings.soundEffects) playAudioCue('select');
    stopSpeech();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="a11y-modal-title"
    >
      <div 
        className={`w-full max-w-xl max-h-[90vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden border ${
          isLight 
            ? 'bg-white text-slate-900 border-slate-200 shadow-slate-900/20' 
            : 'bg-zinc-950 text-slate-100 border-green-800/50 shadow-black'
        }`}
      >
        {/* Modal Header */}
        <div 
          className={`p-4 sm:p-5 flex items-center justify-between border-b ${
            isLight 
              ? 'bg-slate-50 border-slate-200' 
              : 'bg-[#031109] border-green-900/60'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isLight ? 'bg-emerald-100 text-emerald-800' : 'bg-green-950/80 text-seagreen border border-green-700/50'}`}>
              <Volume2 className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h2 id="a11y-modal-title" className="text-lg font-bold tracking-tight">
                Acessibilidade & Leitor de Voz
              </h2>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-emerald-400/80'}`}>
                Recursos para deficientes visuais, leitor de tela e temas
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Fechar painel de acessibilidade"
            className={`p-2 rounded-lg transition-colors ${
              isLight 
                ? 'hover:bg-slate-200 text-slate-600' 
                : 'hover:bg-green-950 text-green-400 hover:text-white'
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-sm">
          
          {/* AUDIO SYNTHESIS & VOICE READER SECTION */}
          <section className={`p-4 rounded-xl border space-y-3 ${
            isLight 
              ? 'bg-emerald-50/70 border-emerald-200' 
              : 'bg-emerald-950/25 border-emerald-800/40'
          }`}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2 text-sm uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                <Radio className="h-4 w-4" /> Narração de Jogos em Voz Alta
              </h3>
              {isSpeaking && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white animate-pulse flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                  Lendo agora...
                </span>
              )}
            </div>

            <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              Ouça o resumo completo das partidas e canais de transmissão sintetizados em português brasileiro.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleSpeakToday}
                className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-seagreen-solid text-white font-bold text-xs uppercase tracking-wide hover:brightness-110 active:scale-[0.98] transition-all shadow-sm"
              >
                <Play className="h-4 w-4 fill-white" />
                <span>Ouvir Jogos de Hoje</span>
              </button>

              <button
                type="button"
                onClick={handleSpeakLive}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-lg font-bold text-xs uppercase tracking-wide transition-all border ${
                  isLight 
                    ? 'bg-white text-rose-700 border-rose-300 hover:bg-rose-50' 
                    : 'bg-rose-950/40 text-rose-300 border-rose-700/50 hover:bg-rose-900/60'
                }`}
              >
                <Radio className="h-4 w-4 text-rose-500 animate-pulse" />
                <span>Ouvir Jogos Ao Vivo</span>
              </button>
            </div>

            {isSpeaking && (
              <div className="pt-1 flex items-center justify-between gap-2">
                <p className="text-[11px] truncate flex-1 opacity-75 italic">
                  "{currentSpokenText.substring(0, 70)}..."
                </p>
                <button
                  type="button"
                  onClick={handleStopSpeech}
                  className="px-3 py-1.5 rounded-md bg-red-600 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-red-700 shrink-0"
                >
                  <Square className="h-3 w-3 fill-white" />
                  <span>Parar Áudio</span>
                </button>
              </div>
            )}

            {/* Voice Speed Control */}
            <div className="pt-2 border-t border-emerald-900/20 flex items-center justify-between gap-4">
              <span className="text-xs font-medium flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5 opacity-70" /> Velocidade da Voz:
              </span>
              <div className="flex items-center gap-1">
                {[0.8, 1.0, 1.25, 1.5].map(rate => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => handleSpeechRateChange(rate)}
                    className={`px-2 py-1 rounded text-[11px] font-bold ${
                      settings.speechRate === rate
                        ? 'bg-emerald-600 text-white font-black'
                        : isLight 
                          ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' 
                          : 'bg-zinc-800 text-slate-300 hover:bg-zinc-700'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* THEME (LIGHT / DARK) & CONTRAST */}
          <section className="space-y-3">
            <h3 className={`font-bold text-xs uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-emerald-400'}`}>
              Aparência & Contraste
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Theme Toggle Button */}
              <button
                type="button"
                onClick={handleToggleTheme}
                className={`p-3.5 rounded-xl border flex items-center justify-between text-left transition-all ${
                  isLight 
                    ? 'bg-amber-50 border-amber-300 text-amber-950 hover:bg-amber-100/80' 
                    : 'bg-zinc-900 border-zinc-800 text-slate-200 hover:bg-zinc-850'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isLight ? 'bg-amber-400 text-black' : 'bg-zinc-800 text-amber-400'}`}>
                    {isLight ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  </div>
                  <div>
                    <div className="font-bold text-sm">Tema: {isLight ? 'Modo Claro' : 'Modo Escuro'}</div>
                    <div className="text-[11px] opacity-70">
                      {isLight ? 'Ideal para ambientes iluminados' : 'Confortável para a visão'}
                    </div>
                  </div>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded ${isLight ? 'bg-amber-300 text-black' : 'bg-zinc-800 text-emerald-400'}`}>
                  Alternar
                </span>
              </button>

              {/* High Contrast Toggle Button */}
              <button
                type="button"
                onClick={handleToggleHighContrast}
                className={`p-3.5 rounded-xl border flex items-center justify-between text-left transition-all ${
                  settings.highContrast 
                    ? isLight 
                      ? 'bg-black text-white border-black ring-2 ring-emerald-500' 
                      : 'bg-zinc-900 text-white border-white ring-2 ring-seagreen'
                    : isLight 
                      ? 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100' 
                      : 'bg-zinc-900 border-zinc-800 text-slate-200 hover:bg-zinc-850'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${settings.highContrast ? 'bg-white text-black' : isLight ? 'bg-slate-200 text-slate-700' : 'bg-zinc-800 text-slate-300'}`}>
                    <Contrast className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm">Alto Contraste</div>
                    <div className="text-[11px] opacity-70">Bordas e cores hiper legíveis</div>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${settings.highContrast ? 'bg-emerald-500 border-emerald-400 text-black' : 'border-slate-400'}`}>
                  {settings.highContrast && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                </div>
              </button>
            </div>
          </section>

          {/* FONT SIZE SCALING */}
          <section className="space-y-3">
            <h3 className={`font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 ${isLight ? 'text-slate-600' : 'text-emerald-400'}`}>
              <Type className="h-4 w-4" /> Tamanho do Texto
            </h3>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'normal', label: 'Padrão', scale: '100%' },
                { id: 'large', label: 'Grande', scale: '115%' },
                { id: 'extra-large', label: 'Extra Grande', scale: '130%' },
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => handleSetFontSize(f.id as any)}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                    settings.fontSize === f.id
                      ? 'bg-seagreen-solid text-white font-black border-transparent shadow-md'
                      : isLight 
                        ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100' 
                        : 'bg-zinc-900 border-zinc-800 text-slate-300 hover:bg-zinc-850'
                  }`}
                >
                  <span className="font-bold text-sm">{f.label}</span>
                  <span className="text-[10px] opacity-75">{f.scale}</span>
                </button>
              ))}
            </div>
          </section>

          {/* ACCESSIBILITY TOGGLES (AUTO-SPEECH & SOUND CUES) */}
          <section className="space-y-3">
            <h3 className={`font-bold text-xs uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-emerald-400'}`}>
              Preferências de Leitura e Sons
            </h3>

            <div className="space-y-2">
              {/* Auto speech on click/focus */}
              <label 
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  isLight ? 'bg-slate-50 border-slate-200 hover:bg-slate-100' : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-850'
                }`}
              >
                <div className="flex items-center gap-3 pr-2">
                  <Volume2 className={`h-5 w-5 ${settings.autoSpeechOnFocus ? 'text-emerald-500' : 'text-slate-400'}`} />
                  <div>
                    <div className="font-bold text-xs sm:text-sm">Auto-leitura ao clicar ou focar na partida</div>
                    <div className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Lê os detalhes do jogo automaticamente ao selecionar um card
                    </div>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  checked={settings.autoSpeechOnFocus} 
                  onChange={handleToggleAutoSpeech}
                  className="h-5 w-5 rounded accent-emerald-500 cursor-pointer"
                />
              </label>

              {/* Sound Cues (Feedback Sonoro) */}
              <label 
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  isLight ? 'bg-slate-50 border-slate-200 hover:bg-slate-100' : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-850'
                }`}
              >
                <div className="flex items-center gap-3 pr-2">
                  <Sparkles className={`h-5 w-5 ${settings.soundEffects ? 'text-amber-500' : 'text-slate-400'}`} />
                  <div>
                    <div className="font-bold text-xs sm:text-sm">Sinais sonoros de confirmação</div>
                    <div className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Emite pequenos bipes auditivos ao clicar em botões e filtros
                    </div>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  checked={settings.soundEffects} 
                  onChange={handleToggleSoundEffects}
                  className="h-5 w-5 rounded accent-emerald-500 cursor-pointer"
                />
              </label>
            </div>
          </section>

          {/* KEYBOARD SHORTCUTS FOR SCREEN READERS & BLIND USERS */}
          <section className={`p-4 rounded-xl border text-xs space-y-2 ${
            isLight ? 'bg-slate-100/70 border-slate-200' : 'bg-zinc-900/60 border-zinc-800'
          }`}>
            <div className="font-bold flex items-center gap-1.5 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <Keyboard className="h-4 w-4" /> Atalhos de Teclado Rápidos
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center justify-between">
                <span>Abrir / Fechar Acessibilidade:</span>
                <kbd className="px-1.5 py-0.5 rounded bg-black/20 font-mono font-bold">Alt + A</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>Ouvir resumo de hoje:</span>
                <kbd className="px-1.5 py-0.5 rounded bg-black/20 font-mono font-bold">Alt + O</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>Parar leitura de áudio:</span>
                <kbd className="px-1.5 py-0.5 rounded bg-black/20 font-mono font-bold">Alt + P</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>Alternar Modo Claro/Escuro:</span>
                <kbd className="px-1.5 py-0.5 rounded bg-black/20 font-mono font-bold">Alt + T</kbd>
              </div>
            </div>
          </section>

        </div>

        {/* Modal Footer */}
        <div className={`p-4 border-t flex items-center justify-end ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#031109] border-green-900/60'
        }`}>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-seagreen-solid text-white font-bold text-xs uppercase tracking-wider hover:brightness-110 transition-all cursor-pointer shadow-md"
          >
            Concluir & Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
