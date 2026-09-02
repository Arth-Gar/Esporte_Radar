// Utilitários para identificação, normalização e gerenciamento de times favoritos
import { FootballMatch } from '../types';

/**
 * Normaliza o nome do clube removendo acentos, pontuação,
 * espaços extras e termos de denominação jurídica/esportiva comuns (SAF, FC, EC, etc.)
 */
export function normalizeTeamName(name: string): string {
  if (!name) return '';
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .toLowerCase()
    .replace(/\b(saf|s\.a\.f\.|fc|f\.c\.|ec|e\.c\.|ac|a\.c\.|sc|s\.c\.|cr|c\.r\.|se|s\.e\.|aa|a\.a\.)\b/gi, '')
    .replace(/\b(clube de regatas|esporte clube|sport club|associacao atletica|sociedade esportiva|futebol clube)\b/gi, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Mapeamento canônico de apelidos e termos equivalentes para times brasileiros
 */
const TEAM_CANONICAL_MAP: Record<string, string> = {
  'flamengo': 'flamengo',
  'cr flamengo': 'flamengo',
  'mengo': 'flamengo',
  'mengao': 'flamengo',

  'vasco': 'vasco',
  'vasco da gama': 'vasco',
  'vasco da gama saf': 'vasco',

  'palmeiras': 'palmeiras',
  'se palmeiras': 'palmeiras',
  'verdao': 'palmeiras',

  'corinthians': 'corinthians',
  'sc corinthians': 'corinthians',
  'corinthians paulista': 'corinthians',
  'timao': 'corinthians',

  'santos': 'santos',
  'santos fc': 'santos',
  'peixe': 'santos',

  'sao paulo': 'sao paulo',
  'sao paulo fc': 'sao paulo',
  'spfc': 'sao paulo',
  'tricolor paulista': 'sao paulo',

  'gremio': 'gremio',
  'gremio fbpa': 'gremio',
  'imortal': 'gremio',

  'internacional': 'internacional',
  'inter': 'internacional',
  'colorado': 'internacional',
  'sci': 'internacional',

  'atletico mineiro': 'atletico mineiro',
  'atletico mg': 'atletico mineiro',
  'atletico': 'atletico mineiro',
  'galo': 'atletico mineiro',
  'cam': 'atletico mineiro',

  'cruzeiro': 'cruzeiro',
  'cruzeiro saf': 'cruzeiro',
  'raposa': 'cruzeiro',

  'botafogo': 'botafogo',
  'botafogo saf': 'botafogo',
  'botafogo rj': 'botafogo',
  'fogao': 'botafogo',

  'fluminense': 'fluminense',
  'fluminense fc': 'fluminense',
  'flu': 'fluminense',
  'tricolor carioca': 'fluminense',

  'athletico': 'athletico paranaense',
  'athletico paranaense': 'athletico paranaense',
  'athletico pr': 'athletico paranaense',
  'atletico paranaense': 'athletico paranaense',
  'atletico pr': 'athletico paranaense',
  'furacao': 'athletico paranaense',
  'cap': 'athletico paranaense',

  'coritiba': 'coritiba',
  'coritiba saf': 'coritiba',
  'coxa': 'coritiba',

  'bahia': 'bahia',
  'ec bahia': 'bahia',
  'bahia saf': 'bahia',
  'esquadrao': 'bahia',

  'vitoria': 'vitoria',
  'ec vitoria': 'vitoria',
  'leao da barra': 'vitoria',

  'fortaleza': 'fortaleza',
  'fortaleza ec': 'fortaleza',
  'leao do pici': 'fortaleza',

  'ceara': 'ceara',
  'ceara sc': 'ceara',
  'vozao': 'ceara',

  'goias': 'goias',
  'goias ec': 'goias',
  'esmeraldino': 'goias',

  'sport': 'sport recife',
  'sport recife': 'sport recife',
  'leao da ilha': 'sport recife',

  'red bull bragantino': 'bragantino',
  'rb bragantino': 'bragantino',
  'bragantino': 'bragantino',
  'massa bruta': 'bragantino',

  'mirassol': 'mirassol',
  'mirassol fc': 'mirassol',

  'juventude': 'juventude',
  'ec juventude': 'juventude',

  'cuiaba': 'cuiaba',
  'cuiaba ec': 'cuiaba',
  'dourado': 'cuiaba',

  'chapecoense': 'chapecoense',
  'chape': 'chapecoense',

  'avai': 'avai',
  'avai fc': 'avai',

  'ponte preta': 'ponte preta',
  'aa ponte preta': 'ponte preta',
  'macaca': 'ponte preta',

  'guarani': 'guarani',
  'guarani fc': 'guarani',
  'bugre': 'guarani',

  'vila nova': 'vila nova',
  'vila nova fc': 'vila nova',
  'tigre': 'vila nova',

  'novorizontino': 'novorizontino',
  'gremio novorizontino': 'novorizontino',

  'operario': 'operario',
  'operario ferroviario': 'operario',
  'fantasma': 'operario',

  'amazonas': 'amazonas',
  'amazonas fc': 'amazonas',

  'paysandu': 'paysandu',
  'paysandu sc': 'paysandu',
  'papao': 'paysandu',

  'remo': 'remo',
  'clube do remo': 'remo',
  'leao azul': 'remo',

  'america mineiro': 'america mineiro',
  'america mg': 'america mineiro',
  'coelho': 'america mineiro',

  'crb': 'crb',
  'clube de regatas brasil': 'crb',

  'csa': 'csa',
  'centro sportivo alagoano': 'csa',

  'nautico': 'nautico',
  'timbu': 'nautico',

  'santa cruz': 'santa cruz',
  'santa': 'santa cruz',

  'figueirense': 'figueirense',
  'figueira': 'figueirense',

  'criciuma': 'criciuma',
  'criciuma ec': 'criciuma',
  'tigre carvoeiro': 'criciuma',

  'londrina': 'londrina',
  'tubarao': 'londrina',

  'sampaio correa': 'sampaio correa',
  'bolivia querida': 'sampaio correa'
};

/**
 * Retorna a chave canônica do clube para comparação consistente
 */
export function getCanonicalTeamKey(name: string): string {
  const norm = normalizeTeamName(name);
  if (!norm) return '';
  if (TEAM_CANONICAL_MAP[norm]) {
    return TEAM_CANONICAL_MAP[norm];
  }
  return norm;
}

/**
 * Verifica se dois nomes representam o mesmo clube de forma inteligente,
 * comparando igualdade exata, normalizada, termos canônicos ou contenção de palavra principal.
 */
export function isSameTeam(teamA?: string, teamB?: string): boolean {
  if (!teamA || !teamB) return false;
  
  const cleanA = teamA.trim().toLowerCase();
  const cleanB = teamB.trim().toLowerCase();
  if (cleanA === cleanB) return true;

  const keyA = getCanonicalTeamKey(teamA);
  const keyB = getCanonicalTeamKey(teamB);
  if (keyA && keyB && keyA === keyB) return true;

  const normA = normalizeTeamName(teamA);
  const normB = normalizeTeamName(teamB);
  if (!normA || !normB) return false;
  if (normA === normB) return true;

  // Se uma das strings normalizadas tem 3 ou mais caracteres e uma está contida na outra
  if (normA.length >= 4 && normB.length >= 4) {
    if (normA.includes(normB) || normB.includes(normA)) {
      return true;
    }
  }

  // Comparação por palavras significativas (ex: "Santos" em "Santos Futebol Clube")
  const wordsA = normA.split(' ').filter(w => w.length >= 4);
  const wordsB = normB.split(' ').filter(w => w.length >= 4);
  if (wordsA.length > 0 && wordsB.length > 0) {
    const hasCommonSignificantWord = wordsA.some(w => wordsB.includes(w));
    if (hasCommonSignificantWord) {
      // Evitar falsos positivos genéricos (como "atletico" puro se um for MG e outro PR ou GO)
      const isAStateSpecific = normA.includes('mineiro') || normA.includes('paranaense') || normA.includes('goianiense');
      const isBStateSpecific = normB.includes('mineiro') || normB.includes('paranaense') || normB.includes('goianiense');
      if (isAStateSpecific || isBStateSpecific) {
        return keyA === keyB;
      }
      return true;
    }
  }

  return false;
}

/**
 * Verifica se o time fornecido está na lista de favoritos
 */
export function isTeamInFavorites(teamName: string, favoriteTeams: string[]): boolean {
  if (!teamName || !Array.isArray(favoriteTeams) || favoriteTeams.length === 0) return false;
  return favoriteTeams.some(fav => isSameTeam(fav, teamName));
}

/**
 * Verifica se a partida envolve algum time favorito
 */
export function isMatchFavorite(match: FootballMatch, favoriteTeams: string[]): boolean {
  if (!match || !Array.isArray(favoriteTeams) || favoriteTeams.length === 0) return false;
  return isTeamInFavorites(match.homeTeam, favoriteTeams) || isTeamInFavorites(match.awayTeam, favoriteTeams);
}

/**
 * Alterna (adiciona ou remove) um time da lista de favoritos com consistência e sem duplicações.
 * Quando o time já é favorito, remove TODAS as variações do mesmo clube.
 */
export function toggleFavoriteTeamInList(
  teamName: string, 
  currentFavorites: string[]
): {
  newFavorites: string[];
  wasRemoved: boolean;
  cleanName: string;
} {
  const cleanName = teamName.trim();
  const isFav = isTeamInFavorites(cleanName, currentFavorites);

  if (isFav) {
    // Remover todas as variações desse clube para garantir que a retirada seja 100% limpa
    const newFavorites = currentFavorites.filter(existing => !isSameTeam(existing, cleanName));
    return {
      newFavorites,
      wasRemoved: true,
      cleanName,
    };
  } else {
    // Adiciona o time, garantindo que não haja resíduos parciais
    const filtered = currentFavorites.filter(existing => !isSameTeam(existing, cleanName));
    return {
      newFavorites: [...filtered, cleanName],
      wasRemoved: false,
      cleanName,
    };
  }
}

/**
 * Limpa e desduplica a lista de favoritos, eliminando variações repetidas salvas no localStorage
 */
export function sanitizeFavoritesList(favoriteTeams: string[]): string[] {
  if (!Array.isArray(favoriteTeams)) return [];
  const sanitized: string[] = [];

  favoriteTeams.forEach(rawTeam => {
    if (!rawTeam || typeof rawTeam !== 'string') return;
    const trimmed = rawTeam.trim();
    if (!trimmed) return;

    const alreadyExists = sanitized.some(existing => isSameTeam(existing, trimmed));
    if (!alreadyExists) {
      sanitized.push(trimmed);
    }
  });

  return sanitized;
}
