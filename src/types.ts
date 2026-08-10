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
  category?: string;
}

export interface ClubInfo {
  name: string;
  slug: string;
  logo: string;
}

