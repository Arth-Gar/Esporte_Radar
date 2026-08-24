// Acessibilidade e Motor de Leitura de Voz (Text-to-Speech) para Pessoas com Deficiência Visual e Cegos
import { FootballMatch } from '../types';

export interface AccessibilitySettings {
  theme: 'dark' | 'light';
  fontSize: 'normal' | 'large' | 'extra-large';
  highContrast: boolean;
  autoSpeechOnFocus: boolean;
  speechRate: number; // 0.8 to 1.5
  soundEffects: boolean;
}

const ACCESSIBILITY_STORAGE_KEY = 'onde_vai_passar_a11y_v1';

export const DEFAULT_A11Y_SETTINGS: AccessibilitySettings = {
  theme: 'dark',
  fontSize: 'normal',
  highContrast: false,
  autoSpeechOnFocus: false,
  speechRate: 1.0,
  soundEffects: true,
};

// Retrieve accessibility settings
export function getStoredA11ySettings(): AccessibilitySettings {
  try {
    const raw = localStorage.getItem(ACCESSIBILITY_STORAGE_KEY);
    if (!raw) return DEFAULT_A11Y_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      theme: parsed.theme === 'light' ? 'light' : 'dark',
      fontSize: ['normal', 'large', 'extra-large'].includes(parsed.fontSize) ? parsed.fontSize : 'normal',
      highContrast: Boolean(parsed.highContrast),
      autoSpeechOnFocus: Boolean(parsed.autoSpeechOnFocus),
      speechRate: typeof parsed.speechRate === 'number' ? Math.max(0.7, Math.min(1.6, parsed.speechRate)) : 1.0,
      soundEffects: parsed.soundEffects !== false,
    };
  } catch (e) {
    console.warn('Erro ao ler configurações de acessibilidade:', e);
    return DEFAULT_A11Y_SETTINGS;
  }
}

// Save accessibility settings
export function saveA11ySettings(settings: AccessibilitySettings): void {
  try {
    localStorage.setItem(ACCESSIBILITY_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Erro ao salvar acessibilidade:', e);
  }
}

// Web Audio API feedback tones (Beeps/Cues for blind navigation)
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function playAudioCue(type: 'select' | 'alert' | 'success' | 'toggle'): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'select') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'toggle') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, now); // D5
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (type === 'alert') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.setValueAtTime(480, now + 0.06);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.start(now);
      osc.stop(now + 0.14);
    } else if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.06); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.12); // G5
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  } catch (e) {
    // Audio Context not ready or blocked
  }
}

// Text-to-Speech Engine
let currentUtterance: SpeechSynthesisUtterance | null = null;
type SpeechStateListener = (speaking: boolean, text: string) => void;
const speechListeners: Set<SpeechStateListener> = new Set();

export function subscribeSpeechState(listener: SpeechStateListener): () => void {
  speechListeners.add(listener);
  return () => speechListeners.delete(listener);
}

function notifySpeechState(speaking: boolean, text: string = ''): void {
  speechListeners.forEach(l => l(speaking, text));
}

// Stop current narration
export function stopSpeech(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
  currentUtterance = null;
  notifySpeechState(false, '');
}

// Speak arbitrary text in PT-BR
export function speakText(
  text: string, 
  options: { rate?: number; pitch?: number; onEnd?: () => void; priority?: boolean } = {}
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Leitura de voz não suportada neste navegador.');
    return;
  }

  try {
    window.speechSynthesis.cancel();

    if (!text || text.trim() === '') {
      notifySpeechState(false, '');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = options.rate || 1.0;
    utterance.pitch = options.pitch || 1.0;

    // Pick a Portuguese voice if available
    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find(v => v.lang.startsWith('pt') || v.lang.includes('BR')) || null;
    if (ptVoice) {
      utterance.voice = ptVoice;
    }

    utterance.onstart = () => {
      notifySpeechState(true, text);
    };

    utterance.onend = () => {
      notifySpeechState(false, '');
      if (options.onEnd) options.onEnd();
    };

    utterance.onerror = () => {
      notifySpeechState(false, '');
    };

    currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.error('Erro ao sintetizar voz:', e);
    notifySpeechState(false, '');
  }
}

// Format a single match for natural voice reading
export function formatMatchForSpeech(match: FootballMatch): string {
  const [year, month, day] = (match.date || '').split('-');
  const monthNames = ['', 'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const monthName = monthNames[parseInt(month, 10)] || '';
  const dateFormatted = day && monthName ? `${parseInt(day, 10)} de ${monthName}` : 'data a definir';

  const timeFormatted = match.time ? `às ${match.time.replace(':', ' e ')}` : 'horário a confirmar';

  const statusText = match.status === 'ao_vivo' 
    ? 'Partida acontecendo ao vivo agora.' 
    : match.status === 'finalizado' 
      ? 'Partida já finalizada.' 
      : 'Partida agendada.';

  const scoreText = (match.status === 'ao_vivo' || match.status === 'finalizado') && match.score
    ? `Placar: ${match.homeTeam} ${match.score.home}, contra ${match.awayTeam} ${match.score.away}.`
    : '';

  const channelsText = match.broadcasters && match.broadcasters.length > 0
    ? `Transmissão confirmada nos canais: ${match.broadcasters.join(', ')}.`
    : 'Canais de transmissão a definir.';

  const stadiumText = match.stadium && match.stadium !== 'A definir'
    ? `Estádio: ${match.stadium}.`
    : '';

  return `
    ${match.division || 'Futebol'}.
    ${match.homeTeam} contra ${match.awayTeam}.
    ${statusText}
    ${scoreText}
    Data: ${dateFormatted}, ${timeFormatted}.
    ${stadiumText}
    ${channelsText}
  `.replace(/\s+/g, ' ').trim();
}

// Speak single match
export function speakMatch(match: FootballMatch, rate: number = 1.0): void {
  const text = formatMatchForSpeech(match);
  speakText(text, { rate });
}

// Speak summary of live matches
export function speakLiveMatchesSummary(matches: FootballMatch[], rate: number = 1.0): void {
  const liveMatches = matches.filter(m => m.status === 'ao_vivo');
  if (liveMatches.length === 0) {
    speakText('Não há partidas de futebol acontecendo ao vivo no momento.', { rate });
    return;
  }

  let text = `Atenção! Temos ${liveMatches.length} ${liveMatches.length === 1 ? 'partida' : 'partidas'} ao vivo agora: `;
  liveMatches.forEach((m, idx) => {
    const score = m.score ? `${m.score.home} a ${m.score.away}` : 'placar em andamento';
    const channels = m.broadcasters.length > 0 ? `Transmissão: ${m.broadcasters.join(', ')}.` : '';
    text += ` Jogo ${idx + 1}: ${m.homeTeam} contra ${m.awayTeam}, ${score}, pela ${m.division}. ${channels}`;
  });

  speakText(text, { rate });
}

// Speak summary of today's matches
export function speakTodayScheduleSummary(matches: FootballMatch[], rate: number = 1.0): void {
  const todayStr = new Date().toISOString().split('T')[0];
  const todayMatches = matches.filter(m => m.date === todayStr);

  if (todayMatches.length === 0) {
    const upcoming = matches.slice(0, 5);
    if (upcoming.length === 0) {
      speakText('Nenhum jogo encontrado na programação.', { rate });
      return;
    }
    let text = `Não encontramos jogos para hoje, mas aqui estão os próximos jogos da rodada: `;
    upcoming.forEach((m, idx) => {
      text += ` ${idx + 1}: ${m.homeTeam} contra ${m.awayTeam}, dia ${m.date.split('-').reverse().slice(0, 2).join('/')} às ${m.time}, pela ${m.division}. Onde assistir: ${m.broadcasters.join(', ') || 'A definir'}.`;
    });
    speakText(text, { rate });
    return;
  }

  let text = `Programação esportiva de hoje! Temos ${todayMatches.length} ${todayMatches.length === 1 ? 'jogo' : 'jogos'}: `;
  todayMatches.forEach((m, idx) => {
    const status = m.status === 'ao_vivo' ? 'Ao vivo agora!' : `às ${m.time}`;
    const channels = m.broadcasters.length > 0 ? `Transmissão em: ${m.broadcasters.join(', ')}` : 'Canais a definir';
    text += ` Partida ${idx + 1}: ${m.homeTeam} contra ${m.awayTeam}, ${status}, pela ${m.division}. ${channels}.`;
  });

  speakText(text, { rate });
}
