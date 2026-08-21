import { FootballMatch, UserPreferences, TeamNotificationConfig } from '../types';

const STORAGE_KEY = 'esporte_radar_user_prefs_v1';
const NOTIFIED_MATCHES_KEY = 'esporte_radar_notified_matches_v1';

export interface InAppToast {
  id: string;
  title: string;
  body: string;
  icon?: string;
  type: 'info' | 'success' | 'alert';
  timestamp: number;
}

type ToastListener = (toast: InAppToast) => void;
const toastListeners: Set<ToastListener> = new Set();

export function subscribeToInAppToasts(listener: ToastListener): () => void {
  toastListeners.add(listener);
  return () => {
    toastListeners.delete(listener);
  };
}

export function emitInAppToast(toast: Omit<InAppToast, 'id' | 'timestamp'>) {
  const fullToast: InAppToast = {
    ...toast,
    id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
  };
  toastListeners.forEach(listener => listener(fullToast));
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  favoriteTeams: ['Flamengo'],
  notificationConfigs: {
    'Flamengo': {
      teamName: 'Flamengo',
      enabled: true,
      divisions: [], // empty = all divisions
      notifyBeforeMinutes: 15,
      soundEnabled: true,
    }
  },
  notificationsGlobalEnabled: true,
  notifyBeforeMinutes: 15,
  onlyFavoritesInFeed: false,
};

// Register Service Worker for mobile browsers (required for Android Chrome showNotification)
export function initServiceWorker(): void {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.warn('[ServiceWorker] Registro falhou ou desabilitado:', err);
      });
    });
  }
}

// Retrieve stored preferences
export function getStoredPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw);
    return {
      favoriteTeams: Array.isArray(parsed.favoriteTeams) ? parsed.favoriteTeams : DEFAULT_PREFERENCES.favoriteTeams,
      notificationConfigs: parsed.notificationConfigs || DEFAULT_PREFERENCES.notificationConfigs,
      notificationsGlobalEnabled: parsed.notificationsGlobalEnabled ?? true,
      notifyBeforeMinutes: parsed.notifyBeforeMinutes ?? 15,
      onlyFavoritesInFeed: parsed.onlyFavoritesInFeed ?? false,
    };
  } catch (e) {
    console.warn('Erro ao carregar preferências de notificação do usuário:', e);
    return DEFAULT_PREFERENCES;
  }
}

// Save preferences to local storage
export function savePreferences(prefs: UserPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.error('Erro ao salvar preferências:', e);
  }
}

// Check notification support
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && ('Notification' in window || 'serviceWorker' in navigator);
}

// Get current permission status
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

// Request permission from browser
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Play a quick subtle audio confirmation
      playNotificationChime();
    }
    return permission;
  } catch (e) {
    console.warn('Erro ao solicitar permissão de notificação:', e);
    return Notification.permission;
  }
}

// Play pleasant web audio chime on mobile & desktop
export function playNotificationChime(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // First tone (523.25 Hz - C5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, ctx.currentTime);
    gain1.gain.setValueAtTime(0.12, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.25);

    // Second tone (659.25 Hz - E5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12);
    gain2.gain.setValueAtTime(0.15, ctx.currentTime + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.12);
    osc2.stop(ctx.currentTime + 0.45);
  } catch {
    // AudioContext blocked or unsupported in current state
  }
}

// Dispatch a system web notification with smartwatch & mobile haptic pattern
export async function dispatchNotification(
  title: string,
  options: {
    body: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: any;
    sound?: boolean;
  }
): Promise<boolean> {
  // Always emit an in-app visual toast so the user never misses an alert
  emitInAppToast({
    title,
    body: options.body,
    icon: options.icon,
    type: 'info',
  });

  if (options.sound !== false) {
    playNotificationChime();
  }

  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  const notificationOptions: NotificationOptions = {
    body: options.body,
    icon: options.icon || 'https://cdn-icons-png.flaticon.com/512/53/53283.png',
    badge: options.badge || 'https://cdn-icons-png.flaticon.com/512/53/53283.png',
    tag: options.tag || 'esporte-radar-alert',
    // Smartwatch & smartphone haptic vibration pattern: buzz-pause-buzz-pause-long buzz
    // @ts-ignore
    vibrate: [200, 100, 200, 100, 400],
    requireInteraction: false,
    data: options.data,
  };

  // 1. Try Service Worker showNotification (mandatory on Mobile Chrome/Android & PWA)
  if ('serviceWorker' in navigator) {
    try {
      let reg: ServiceWorkerRegistration | undefined;
      if (navigator.serviceWorker.ready) {
        reg = await navigator.serviceWorker.ready;
      }
      if (!reg) {
        reg = await navigator.serviceWorker.getRegistration();
      }
      if (reg && reg.showNotification) {
        await reg.showNotification(title, notificationOptions);
        return true;
      }
    } catch (swErr) {
      console.warn('Fallback de SW para window.Notification:', swErr);
    }
  }

  // 2. Standard Web Notification API (Desktop / Safari)
  try {
    const notif = new Notification(title, notificationOptions);
    notif.onclick = function () {
      window.focus();
      this.close();
    };
    return true;
  } catch (err) {
    console.warn('Falha ao emitir notificação nativa:', err);
    return false;
  }
}

// Send a test notification to verify mobile, browser and smartwatch pairing
export async function sendTestNotification(teamName = 'Flamengo'): Promise<{
  success: boolean;
  permission: NotificationPermission | 'unsupported';
  message: string;
}> {
  const perm = await requestNotificationPermission();

  if (perm === 'unsupported') {
    emitInAppToast({
      title: 'Notificações Não Suportadas',
      body: 'Seu navegador não oferece suporte à API de notificações nativas.',
      type: 'alert',
    });
    return {
      success: false,
      permission: 'unsupported',
      message: 'Seu navegador não suporta notificações nativas.',
    };
  }

  if (perm === 'denied') {
    emitInAppToast({
      title: 'Permissão Bloqueada',
      body: 'As notificações estão bloqueadas nas permissões do seu navegador. Habilite clicando no cadeado ao lado do endereço.',
      type: 'alert',
    });
    return {
      success: false,
      permission: 'denied',
      message: 'Permissão bloqueada nas configurações do navegador.',
    };
  }

  if (perm !== 'granted') {
    emitInAppToast({
      title: 'Permissão Pendente',
      body: 'Por favor, aprove o pedido de notificação na caixa de diálogo do seu navegador.',
      type: 'info',
    });
    return {
      success: false,
      permission: perm,
      message: 'Permissão não concedida.',
    };
  }

  const dispatched = await dispatchNotification(`⚽ Notificação de Teste: ${teamName}`, {
    body: `Transmissão confirmada! O jogo do ${teamName} começará em breve. Sincronizado com seu celular e smartwatch.`,
    tag: `test-alert-${Date.now()}`,
    icon: 'https://conteudo.cbf.com.br/clubes/20016/escudo.jpg',
  });

  return {
    success: dispatched,
    permission: 'granted',
    message: dispatched 
      ? 'Notificação enviada com sucesso! Verifique sua barra de avisos ou relógio.' 
      : 'Permissão concedida, alerta exibido no app.',
  };
}

// Get list of notified match keys to prevent duplicate alerts
function getNotifiedMatchIds(): Set<string> {
  try {
    const raw = sessionStorage.getItem(NOTIFIED_MATCHES_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function markMatchAsNotified(matchId: string, alertType: string): void {
  try {
    const set = getNotifiedMatchIds();
    set.add(`${matchId}_${alertType}`);
    sessionStorage.setItem(NOTIFIED_MATCHES_KEY, JSON.stringify(Array.from(set)));
  } catch {}
}

// Evaluate matches and trigger alerts for favorite/subscribed teams
export function checkAndTriggerMatchAlerts(matches: FootballMatch[], prefs: UserPreferences): void {
  if (!prefs.notificationsGlobalEnabled) return;
  if (!isNotificationSupported() || Notification.permission !== 'granted') return;

  const now = new Date();
  const notifiedIds = getNotifiedMatchIds();

  matches.forEach(match => {
    if (!match.date || !match.time) return;

    // Check if match contains a favorite team or a configured team
    const matchingTeams = prefs.favoriteTeams.filter(team => 
      match.homeTeam.toLowerCase().includes(team.toLowerCase()) || 
      match.awayTeam.toLowerCase().includes(team.toLowerCase())
    );

    if (matchingTeams.length === 0) return;

    matchingTeams.forEach(team => {
      const config: TeamNotificationConfig = prefs.notificationConfigs[team] || {
        teamName: team,
        enabled: true,
        divisions: [],
        notifyBeforeMinutes: prefs.notifyBeforeMinutes || 15,
        soundEnabled: true,
      };

      if (!config.enabled) return;

      // Check division filter for this team
      if (config.divisions && config.divisions.length > 0) {
        const divisionAllowed = config.divisions.some(div => 
          (match.division || '').toLowerCase().includes(div.toLowerCase())
        );
        if (!divisionAllowed) return; // User chose not to be notified for this division
      }

      // Calculate time difference
      try {
        const [yr, mo, dy] = match.date.split('-').map(Number);
        const [hr, mn] = match.time.split(':').map(Number);
        const matchTimeMs = new Date(yr, mo - 1, dy, hr || 0, mn || 0).getTime();
        const nowMs = now.getTime();
        const diffMinutes = Math.round((matchTimeMs - nowMs) / (1000 * 60));

        const reminderWindow = config.notifyBeforeMinutes ?? prefs.notifyBeforeMinutes ?? 15;
        const opponent = match.homeTeam.toLowerCase().includes(team.toLowerCase()) ? match.awayTeam : match.homeTeam;
        const broadcastersText = match.broadcasters.length > 0 ? match.broadcasters.join(', ') : 'Transmissão Esportiva';

        // 1. Kickoff Reminder (e.g. 15 minutes before)
        if (diffMinutes > 0 && diffMinutes <= reminderWindow) {
          const alertKey = `${match.id}_${team}_reminder_${match.date}`;
          if (!notifiedIds.has(alertKey)) {
            dispatchNotification(`⏱️ Falta pouco! ${team} × ${opponent}`, {
              body: `O jogo pela ${match.division} começará em ${diffMinutes} min! Onde assistir: ${broadcastersText}.`,
              tag: alertKey,
              icon: match.homeTeamLogo || match.awayTeamLogo,
              sound: config.soundEnabled,
            });
            markMatchAsNotified(match.id, `${team}_reminder_${match.date}`);
          }
        }

        // 2. Match Starting / Live Now
        if (match.status === 'ao_vivo' || (diffMinutes <= 0 && diffMinutes >= -10)) {
          const alertKey = `${match.id}_${team}_live_${match.date}`;
          if (!notifiedIds.has(alertKey)) {
            dispatchNotification(`🟢 BOLA ROLANDO! ${team} × ${opponent}`, {
              body: `A partida pela ${match.division} já começou! Estádio: ${match.stadium}. Sintonize em: ${broadcastersText}.`,
              tag: alertKey,
              icon: match.homeTeamLogo || match.awayTeamLogo,
              sound: config.soundEnabled,
            });
            markMatchAsNotified(match.id, `${team}_live_${match.date}`);
          }
        }
      } catch (err) {
        console.warn('Erro ao processar alerta de partida:', err);
      }
    });
  });
}
