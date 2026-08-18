import { FootballMatch, UserPreferences, TeamNotificationConfig } from '../types';

const STORAGE_KEY = 'esporte_radar_user_prefs_v1';
const NOTIFIED_MATCHES_KEY = 'esporte_radar_notified_matches_v1';

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
  return typeof window !== 'undefined' && 'Notification' in window;
}

// Get current permission status
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

// Request permission from browser
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isNotificationSupported()) return 'unsupported';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (e) {
    console.warn('Erro ao solicitar permissão de notificação:', e);
    return Notification.permission;
  }
}

// Dispatch a system web notification with smartwatch haptic pattern
export async function dispatchNotification(
  title: string,
  options: {
    body: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: any;
  }
): Promise<boolean> {
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

  try {
    // Try service worker notification first (better integration with background & smartwatches)
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration && registration.showNotification) {
          await registration.showNotification(title, notificationOptions);
          return true;
        }
      } catch (swErr) {
        // Fallback to standard Notification
      }
    }

    // Standard Web Notification API
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

// Send a test notification to verify mobile and smartwatch pairing
export async function sendTestNotification(teamName = 'Flamengo'): Promise<boolean> {
  const perm = await requestNotificationPermission();
  if (perm !== 'granted') {
    return false;
  }

  return dispatchNotification(`⚽ Notificação de Jogo: ${teamName}`, {
    body: `Transmissão confirmada! O jogo do ${teamName} começará em breve. Sincronizado com seu celular e smartwatch.`,
    tag: `test-alert-${Date.now()}`,
    icon: 'https://conteudo.cbf.com.br/clubes/20016/escudo.jpg',
  });
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
