export type SportType = 'futebol' | 'basquete' | 'volei' | 'judo' | 'automobilismo' | 'tenis' | 'filantropia';

export interface SocialProject {
  id: string;
  title: string;
  sport: string;
  neighborhood: string;
  city: string;
  address: string;
  phone: string;
  whatsapp?: string;
  organization: string;
  targetPublic: string;
  schedule: string;
  price: string;
  description: string;
  requirements: string;
}

export interface MatchScore {
  home: number | string;
  away: number | string;
  penalties?: {
    home: number | string;
    away: number | string;
  };
  display?: string;
}

export interface FootballMatch {
  id: string;
  sport?: SportType;
  homeTeam: string;
  homeTeamSlug: string;
  homeTeamLogo: string;
  awayTeam: string;
  awayTeamSlug: string;
  awayTeamLogo: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  division: string;
  stadium: string;
  broadcasters: string[];
  transmissionUrl: string;
  round: string;
  status: 'agendado' | 'ao_vivo' | 'finalizado';
  scraped: boolean;
  score?: MatchScore | null;
  homeScore?: number | string | null;
  awayScore?: number | string | null;
  category?: string;
  referee?: string;
  matchViewUrl?: string;
}

export interface ClubInfo {
  name: string;
  slug: string;
  logo: string;
}

export interface TeamNotificationConfig {
  teamName: string;
  enabled: boolean;
  divisions: string[]; // List of divisions to receive notifications, e.g. ['Série A', 'Libertadores'] or [] for all
  notifyBeforeMinutes: number; // 0 = at kickoff, 15 = 15m before, 30 = 30m before
  soundEnabled?: boolean;
}

export interface UserPreferences {
  favoriteTeams: string[]; // List of favorite team names
  notificationConfigs: Record<string, TeamNotificationConfig>; // Keyed by team name
  notificationsGlobalEnabled: boolean;
  notifyBeforeMinutes: number; // default reminder window (0, 15, 30, 60)
  onlyFavoritesInFeed: boolean;
}

