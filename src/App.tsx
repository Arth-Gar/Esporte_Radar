import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Tv, 
  Calendar, 
  MapPin, 
  ExternalLink, 
  Filter, 
  RefreshCw, 
  Info, 
  ChevronRight, 
  SlidersHorizontal,
  TrendingUp,
  Radio,
  Play,
  X,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Star,
  Bell,
  BellRing,
  Watch
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FootballMatch, SportType, UserPreferences } from './types';
import { AdSlot, useAnchorAd } from './components/AdSlot';
import { SocialProjectsView } from './components/SocialProjectsView';
import { InstallPwaPrompt } from './components/InstallPwaPrompt';
import { Preloader } from './components/Preloader';
import { TeamPreferencesModal } from './components/TeamPreferencesModal';
import { 
  getStoredPreferences, 
  savePreferences, 
  checkAndTriggerMatchAlerts 
} from './utils/notificationService';
import { SOCIAL_PROJECTS } from './data/socialProjects';

const SPORTS_LIST: { id: SportType; label: string; icon: string }[] = [
  { id: 'futebol', label: 'Futebol', icon: '⚽' },
  { id: 'basquete', label: 'Basquete', icon: '🏀' },
  { id: 'volei', label: 'Vôlei', icon: '🏐' },
  { id: 'judo', label: 'Judô', icon: '🥋' },
  { id: 'automobilismo', label: 'Automobilismo / F1', icon: '🏎️' },
  { id: 'tenis', label: 'Tênis', icon: '🎾' },
  { id: 'filantropia', label: 'Projetos Sociais & Igrejas', icon: '🤝' },
];

// TeamLogo component displaying verified crests from CBF/UOL/Wikimedia with fallback
function TeamLogo({
  teamName,
  logoUrl,
  size = 'md',
  className = ''
}: {
  teamName: string;
  logoUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const [hasError, setHasError] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    setHasError(false);
    setUseFallback(false);
  }, [logoUrl, teamName]);

  const currentSrc = !useFallback ? logoUrl : undefined;

  const sizeClasses = {
    sm: 'w-6 h-6 p-0.5',
    md: 'w-7 h-7 p-0.5',
    lg: 'w-10 h-10 p-1',
    xl: 'w-14 h-14 p-1'
  }[size];

  const imgSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
    xl: 'w-10 h-10'
  }[size];

  const acronym = (teamName || 'TM')
    .replace(/[^a-zA-Z0-9]/g, ' ')
    .trim()
    .split(/\s+/)
    .map(w => w[0])
    .join('')
    .substring(0, 3)
    .toUpperCase() || 'TM';

  return (
    <div className={`relative shrink-0 rounded-full bg-white/95 border border-green-950/30 flex items-center justify-center overflow-hidden shadow-sm ${sizeClasses} ${className}`}>
      {!hasError && currentSrc ? (
        <img
          key={currentSrc}
          src={currentSrc}
          alt={teamName}
          referrerPolicy="no-referrer"
          className={`${imgSizeClasses} object-contain`}
          onError={() => {
            setHasError(true);
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-green-950 border border-green-800 rounded-full flex items-center justify-center text-[9px] font-bold text-white uppercase tracking-tighter">
          {acronym}
        </div>
      )}
    </div>
  );
}

export default function App() {
  // Initialize Bottom Anchor Ad (Google Ad Manager)
  useAnchorAd('/22404335646/ancora_inferior');

  // Matches and fetch states
  const [matches, setMatches] = useState<FootballMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scrapeInfo, setScrapeInfo] = useState<{ scrapedCount: number; fallbackCount: number } | null>(null);

  // Active Sport Tab State
  const [activeSport, setActiveSport] = useState<SportType>('futebol');

  // Dynamic current date reference
  const today = new Date();
  const currentDayNumber = today.getDate();
  const currentMonthIndex = today.getMonth(); // 0-indexed
  const currentYearNumber = today.getFullYear();
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const currentMonthName = monthNames[currentMonthIndex];
  const daysInCurrentMonth = new Date(currentYearNumber, currentMonthIndex + 1, 0).getDate();

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDivision, setSelectedDivision] = useState<string>('Tudo');
  const [selectedBroadcaster, setSelectedBroadcaster] = useState<string>('Tudo');
  const [selectedStatus, setSelectedStatus] = useState<'Tudo' | 'ao_vivo' | 'agendado' | 'finalizado'>('Tudo');
  const [selectedDay, setSelectedDay] = useState<number | 'Tudo'>('Tudo');
  const [showFilters, setShowFilters] = useState(false);

  // Ref for auto-scrolling calendar to today
  const todayButtonRef = React.useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (todayButtonRef.current) {
      todayButtonRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [selectedDay]);

  // Option to include finalized matches (excluídos por padrão)
  const [includeFinished, setIncludeFinished] = useState(false);

  // User preferences for Favorite Teams & Notifications (Smartwatch & Phone)
  const [preferences, setPreferences] = useState<UserPreferences>(() => getStoredPreferences());
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [onlyFavoritesFilter, setOnlyFavoritesFilter] = useState(false);

  // Update preferences and sync with localStorage
  const handleUpdatePreferences = (newPrefs: UserPreferences) => {
    setPreferences(newPrefs);
    savePreferences(newPrefs);
  };

  // Quick toggle favorite for a specific team (directly from match card)
  const handleToggleFavoriteTeam = (teamName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isFav = preferences.favoriteTeams.includes(teamName);
    const newFavorites = isFav
      ? preferences.favoriteTeams.filter(t => t !== teamName)
      : [...preferences.favoriteTeams, teamName];

    const newConfigs = { ...preferences.notificationConfigs };
    if (!isFav && !newConfigs[teamName]) {
      newConfigs[teamName] = {
        teamName,
        enabled: true,
        divisions: [],
        notifyBeforeMinutes: preferences.notifyBeforeMinutes || 15,
        soundEnabled: true,
      };
    }

    handleUpdatePreferences({
      ...preferences,
      favoriteTeams: newFavorites,
      notificationConfigs: newConfigs,
    });
  };

  // Helper to check if a match contains any favorite team
  const isFavoriteMatch = (match: FootballMatch) => {
    return preferences.favoriteTeams.some(fav => 
      match.homeTeam.toLowerCase().includes(fav.toLowerCase()) || 
      match.awayTeam.toLowerCase().includes(fav.toLowerCase())
    );
  };

  // Helper to check if a team is favorite
  const isTeamFavorite = (teamName: string) => {
    return preferences.favoriteTeams.some(fav => 
      teamName.toLowerCase().includes(fav.toLowerCase()) ||
      fav.toLowerCase().includes(teamName.toLowerCase())
    );
  };

  // Background check to trigger kickoff reminders on cellphone & smartwatch
  useEffect(() => {
    if (matches.length > 0) {
      checkAndTriggerMatchAlerts(matches, preferences);
      const interval = setInterval(() => {
        checkAndTriggerMatchAlerts(matches, preferences);
      }, 45000);
      return () => clearInterval(interval);
    }
  }, [matches, preferences]);

  // Selected Match for the Live Hub Modal
  const [selectedMatch, setSelectedMatch] = useState<FootballMatch | null>(null);
  const [showMatchModalHelp, setShowMatchModalHelp] = useState(false);

  // Fetch games from Express API
  const fetchGames = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    const startTime = Date.now();

    try {
      const response = await fetch(`/api/jogos${isRefresh ? '?refresh=true' : ''}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const result = await response.json();
      if (result && result.success && Array.isArray(result.data)) {
        // Enriquecer e validar o status em tempo real com base no relógio do usuário
        const nowTime = new Date().getTime();
        const enrichedData = result.data.map((m: FootballMatch) => {
          if (m.date && m.time) {
            try {
              const [yr, mo, dy] = m.date.split('-').map(Number);
              const [hr, mn] = m.time.split(':').map(Number);
              const matchMs = new Date(yr, mo - 1, dy, hr || 0, mn || 0).getTime();
              const diffHours = (nowTime - matchMs) / (1000 * 60 * 60);
              
              if (diffHours >= 2.5) {
                return { ...m, status: 'finalizado' as const };
              } else if (diffHours >= 0 && diffHours < 2.5) {
                return { ...m, status: 'ao_vivo' as const };
              } else {
                return { ...m, status: 'agendado' as const };
              }
            } catch (e) {
              return m;
            }
          }
          return m;
        });

        setMatches(enrichedData);
        setScrapeInfo({
          scrapedCount: result.info?.scrapedCount || result.info?.futebolCount || 0,
          fallbackCount: result.info?.fallbackCount || 0
        });
      }
    } catch (error) {
      console.warn('Conexão instável ao buscar transmissões. Mantendo lista atual:', error);
    } finally {
      const elapsedTime = Date.now() - startTime;
      const minDuration = 1500; // Animação de pré-carregamento bonita de 1.5 segundos
      const remainingTime = Math.max(0, minDuration - elapsedTime);

      setTimeout(() => {
        setLoading(false);
        setRefreshing(false);
      }, remainingTime);
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  // Helper to check if a match is CONMEBOL Libertadores
  const isLibertadoresMatch = (m: FootballMatch) => {
    return (m.division && m.division.toLowerCase().includes('libertadores')) || 
           ((m as any).competition && (m as any).competition.toLowerCase().includes('libertadores'));
  };

  // Filter lists derived from active sport
  const sportMatches = matches.filter(m => {
    return (m.sport || 'futebol') === activeSport;
  });

  const broadcastersList = ['Tudo', ...Array.from(new Set(sportMatches.flatMap(m => m.broadcasters)))];
  
  // Natural football division ordering with Libertadores prominently featured
  const preferredDivisionOrder = [
    'Série A',
    'Série B',
    'Copa do Brasil',
    'Libertadores',
    'Série C',
    'Série D',
    'Feminino',
    'Sub-20',
    'Sub-17',
    'Sub-15'
  ];

  const rawDivisions: string[] = Array.from(new Set(sportMatches.map(m => m.division).filter((d): d is string => Boolean(d))));
  rawDivisions.sort((a: string, b: string) => {
    const idxA = preferredDivisionOrder.indexOf(a);
    const idxB = preferredDivisionOrder.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });

  const divisionsList: string[] = ['Tudo', ...rawDivisions];
  
  // Apply filtering rules
  const filteredMatches = sportMatches.filter(match => {
    const matchDay = parseInt(match.date.split('-')[2]);
    
    // Search filter
    let matchesSearch = true;
    const trimmedSearch = searchTerm.trim().toLowerCase();
    if (trimmedSearch) {
      const searchWords = trimmedSearch.split(/\s+/).filter(Boolean);
      if (searchWords.length > 0) {
        const cleanWords = searchWords.length > 1
          ? searchWords.filter(word => !['e', 'o', 'a', 'de', 'do', 'da', 'em', 'vs', 'com', 'para'].includes(word))
          : searchWords;
        
        const wordsToMatch = cleanWords.length > 0 ? cleanWords : searchWords;

        matchesSearch = wordsToMatch.every(word => 
          match.homeTeam.toLowerCase().includes(word) ||
          match.awayTeam.toLowerCase().includes(word) ||
          match.stadium.toLowerCase().includes(word) ||
          (match.division && match.division.toLowerCase().includes(word)) ||
          (match.round && match.round.toLowerCase().includes(word)) ||
          match.broadcasters.some(b => b.toLowerCase().includes(word))
        );
      }
    }

    // Division filter
    const matchesDivision = selectedDivision === 'Tudo' || match.division === selectedDivision;

    // Broadcaster filter
    const matchesBroadcaster = selectedBroadcaster === 'Tudo' || match.broadcasters.includes(selectedBroadcaster);

    // Status filter (finalizados são segundo plano, excluídos por padrão)
    let matchesStatus = false;
    if (selectedStatus === 'Tudo') {
      matchesStatus = includeFinished ? true : match.status !== 'finalizado';
    } else {
      matchesStatus = match.status === selectedStatus;
    }

    // Day of Month filter
    const matchesDay = selectedDay === 'Tudo' || matchDay === selectedDay;

    // Favorite team filter
    const matchesFavoritesOnly = !onlyFavoritesFilter || isFavoriteMatch(match);

    return matchesSearch && matchesDivision && matchesBroadcaster && matchesStatus && matchesDay && matchesFavoritesOnly;
  });

  // Ordenar: 1º Jogos de Times Favoritos (Fixados no Topo), 2º Jogos da Série A, 3º Status (Ao Vivo > Agendado > Finalizado), 4º Data e Horário
  const sortedMatches = [...filteredMatches].sort((a, b) => {
    // Prioridade máxima: jogos dos times favoritos do usuário
    const aFav = isFavoriteMatch(a);
    const bFav = isFavoriteMatch(b);
    if (aFav !== bFav) {
      return aFav ? -1 : 1;
    }

    const isSerieA = (div: string) => {
      const d = (div || '').toLowerCase();
      return d.includes('série a') || d.includes('serie a');
    };

    const isASerieA = isSerieA(a.division);
    const isBSerieA = isSerieA(b.division);

    // Prioridade seguinte: jogos da Série A
    if (isASerieA !== isBSerieA) {
      return isASerieA ? -1 : 1;
    }

    const statusPriority = { ao_vivo: 1, agendado: 2, finalizado: 3 };
    const prioA = statusPriority[a.status] || 2;
    const prioB = statusPriority[b.status] || 2;
    if (prioA !== prioB) return prioA - prioB;
    return a.date.localeCompare(b.date) || a.time.localeCompare(b.time);
  });

  // Calculate stats for active sport
  const totalGames = filteredMatches.length;
  const liveCount = sportMatches.filter(m => m.status === 'ao_vivo').length;
  const scheduledCount = sportMatches.filter(m => m.status === 'agendado').length;
  const finishedCount = sportMatches.filter(m => m.status === 'finalizado').length;
  const favoriteMatchesCount = sportMatches.filter(m => isFavoriteMatch(m)).length;

  // Format date correctly in Portuguese
  const formatBrazilianDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    const year = parseInt(parts[0]) || currentYearNumber;
    const monthIndex = parseInt(parts[1]) - 1;
    const day = parseInt(parts[2]);
    
    const daysOfWeek = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    
    const dateObj = new Date(year, monthIndex, day);
    const dayOfWeek = daysOfWeek[dateObj.getDay()];
    
    return {
      dayOfWeek,
      dayAndMonth: `${day} de ${months[monthIndex]}`,
      shortDate: `${day}/${parts[1]}`
    };
  };

  // Broadcaster styling details helper
  const getBroadcasterStyle = (broadcaster: string) => {
    const name = broadcaster.toLowerCase();
    if (name.includes('globo')) {
      return { bg: 'bg-blue-600/20 text-blue-300 border-blue-500/30', badge: 'bg-blue-500 text-white' };
    } else if (name.includes('sportv')) {
      return { bg: 'bg-sky-600/20 text-sky-300 border-sky-500/30', badge: 'bg-sky-500 text-white' };
    } else if (name.includes('premiere')) {
      return { bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30', badge: 'bg-amber-500 text-black' };
    } else if (name.includes('caze') || name.includes('youtube')) {
      return { bg: 'bg-red-600/20 text-red-300 border-red-500/30', badge: 'bg-red-600 text-white' };
    } else if (name.includes('prime') || name.includes('amazon')) {
      return { bg: 'bg-cyan-600/20 text-cyan-300 border-cyan-500/30', badge: 'bg-cyan-500 text-white' };
    } else if (name.includes('brasil')) {
      return { bg: 'bg-yellow-600/20 text-yellow-300 border-yellow-500/30', badge: 'bg-yellow-600 text-black' };
    }
    return { bg: 'bg-emerald-600/20 text-emerald-300 border-emerald-500/30', badge: 'bg-emerald-500 text-white' };
  };

  const getDivisionStyle = (div: string) => {
    const name = (div || '').toLowerCase();
    if (name.includes('libertadores')) {
      return 'bg-amber-950/80 text-amber-300 border border-amber-500/50';
    }
    if (name.includes('série a') || name.includes('serie a')) {
      return 'bg-green-950/80 text-green-300 border border-green-700/40';
    }
    if (name.includes('série b') || name.includes('serie b')) {
      return 'bg-amber-950/80 text-amber-300 border border-amber-700/40';
    }
    if (name.includes('série c') || name.includes('serie c')) {
      return 'bg-blue-950/80 text-blue-300 border border-blue-700/40';
    }
    if (name.includes('série d') || name.includes('serie d')) {
      return 'bg-purple-950/80 text-purple-300 border border-purple-700/40';
    }
    if (name.includes('sub-17') || name.includes('sub17') || name.includes('sub-15') || name.includes('sub15') || name.includes('sub-20') || name.includes('sub20')) {
      return 'bg-cyan-950/80 text-cyan-300 border border-cyan-700/40';
    }
    if (name.includes('feminino')) {
      return 'bg-rose-950/80 text-rose-300 border border-rose-700/40';
    }
    if (name.includes('copa do brasil')) {
      return 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40';
    }
    return 'bg-zinc-900/80 text-zinc-300 border border-zinc-700/40';
  };

  return (
    <div className="min-h-screen bg-[#020704] text-slate-100 font-sans flex flex-col overflow-x-hidden selection:bg-yellow-400 selection:text-[#020704]">
      
      {/* FULLSCREEN PRELOADER (1.5s) */}
      <Preloader isLoading={loading} />

      {/* HEADER SECTION */}
      <header className="bg-[#05140d] border-b border-green-950/80 py-5 px-6 md:px-8 shrink-0 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white text-slate-900 rounded-full flex items-center justify-center shadow-md border-2 border-emerald-500/30 relative overflow-hidden shrink-0">
              {/* Football panel accents */}
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:6px_6px] rounded-full"></div>
              <div className="absolute top-0 left-1/2 w-3.5 h-3.5 bg-slate-900 transform -translate-x-1/2 -translate-y-2 rotate-45"></div>
              <div className="absolute bottom-0 left-1/2 w-3.5 h-3.5 bg-slate-900 transform -translate-x-1/2 translate-y-2 rotate-45"></div>
              <div className="absolute left-0 top-1/2 w-3.5 h-3.5 bg-slate-900 transform -translate-x-2 -translate-y-1/2 rotate-45"></div>
              <div className="absolute right-0 top-1/2 w-3.5 h-3.5 bg-slate-900 transform translate-x-2 -translate-y-1/2 rotate-45"></div>
              <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-slate-900 transform -translate-x-1/2 -translate-y-1/2 rotate-12 opacity-5"></div>
              <Tv className="w-5 h-5 text-emerald-950 relative z-10" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 id="app-title" className="text-xl md:text-2xl font-display font-bold tracking-tight text-white uppercase">
                  Esporte Radar
                </h1>
                {scrapeInfo?.scrapedCount && scrapeInfo.scrapedCount > 0 ? (
                  <span className="text-[9px] font-mono tracking-wider uppercase px-2 py-0.5 rounded bg-green-900 text-green-300 border border-green-800/60 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span>
                    Atualizado
                  </span>
                ) : (
                  <span className="text-[9px] font-mono tracking-wider uppercase px-2 py-0.5 rounded bg-seagreen/20 text-seagreen border border-seagreen/30">
                    Atualizado
                  </span>
                )}
              </div>
              <p className="text-xs text-green-400 font-mono tracking-wider mt-0.5">
                PARTIDAS BRASILEIRAS
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative group">
              <button
                onClick={() => setShowPreferencesModal(true)}
                title="receba a notificação dos times favoritos e divisões desejadas."
                aria-label="receba a notificação dos times favoritos e divisões desejadas."
                className="relative p-2 sm:px-2.5 sm:py-2 rounded-lg bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/50 hover:border-amber-400 text-amber-300 hover:text-white transition-all duration-200 cursor-pointer shadow-sm flex items-center justify-center"
              >
                <div className="relative flex items-center justify-center w-5 h-5">
                  <Bell className="h-5 w-5 text-amber-300 group-hover:text-amber-200 transition-colors" />
                  <Star className="h-2 w-2 fill-amber-400 text-amber-400 absolute top-1.5" />
                </div>

                {preferences.favoriteTeams.length > 0 && (
                  <span className="absolute -top-1 -right-1 text-[9px] min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-black font-mono font-black flex items-center justify-center shadow">
                    {preferences.favoriteTeams.length}
                  </span>
                )}
              </button>

              {/* Floating description on mouse hover */}
              <div className="absolute right-0 top-full mt-2 hidden group-hover:flex flex-col items-end z-50 pointer-events-none whitespace-nowrap">
                <div className="w-2 h-2 bg-slate-900 rotate-45 border-t border-l border-amber-500/40 mr-3 -mb-1"></div>
                <div className="px-3 py-1.5 bg-slate-900/95 border border-amber-500/40 rounded-md text-[11px] font-medium text-amber-200 shadow-xl backdrop-blur-md">
                  receba a notificação dos times favoritos e divisões desejadas.
                </div>
              </div>
            </div>

            <div className="bg-[#020704]/60 px-3.5 py-2 border border-green-950/60 rounded flex items-center gap-2 shadow-inner hidden md:flex">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              <span className="text-xs font-semibold uppercase tracking-wider text-green-300">
                {liveCount} {liveCount === 1 ? 'Ao Vivo' : 'Ao Vivo'}
              </span>
            </div>
            <button 
              onClick={() => fetchGames(true)} 
              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-2 rounded bg-green-900/60 border border-green-800 hover:border-seagreen hover:text-white text-green-300 text-xs font-bold transition-all duration-200 cursor-pointer uppercase tracking-wider"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{refreshing ? 'Buscando...' : 'Recarregar'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* SPORTS MODALITY TAB SELECTOR */}
      <nav className="bg-[#031109] border-b border-green-950 px-6 md:px-8 py-3 shrink-0 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5">
          <span className="text-[10px] font-bold text-seagreen uppercase tracking-widest shrink-0 mr-1 flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5 text-seagreen" /> Modalidade:
          </span>
          {SPORTS_LIST.map(sport => {
            const count = sport.id === 'filantropia'
              ? SOCIAL_PROJECTS.length
              : matches.filter(m => (m.sport || 'futebol') === sport.id).length;
            const isActive = activeSport === sport.id;

            return (
              <button
                key={sport.id}
                onClick={() => {
                  setActiveSport(sport.id);
                  setSelectedDivision('Tudo');
                  setSelectedBroadcaster('Tudo');
                }}
                className={`px-3.5 py-1.5 text-xs font-extrabold rounded-lg shrink-0 transition-all cursor-pointer flex items-center gap-2 uppercase tracking-wider ${
                  isActive
                    ? 'bg-seagreen text-white shadow-sm scale-102 ring-1 ring-seagreen/40'
                    : 'bg-[#081f13] text-emerald-300 hover:bg-[#0e2f1f] hover:text-white'
                }`}
              >
                <span className="text-sm">{sport.icon}</span>
                <span>{sport.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive 
                      ? 'bg-[#020704] text-seagreen font-bold'
                      : 'bg-green-950/80 text-emerald-300'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* FILTER BAR & SEARCH PANEL (FOR BROADCAST SCHEDULES) */}
      {activeSport !== 'filantropia' && (
        <section className="bg-[#05140d] border-b border-green-950/60 py-3 px-6 md:px-8 shrink-0">
        <div className="max-w-7xl mx-auto space-y-2.5">
          
          {/* Quick Division & Favorites Selector Pills for Futebol */}
          {activeSport === 'futebol' && (
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 pt-0.5">
              <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest shrink-0 mr-1 flex items-center gap-1">
                Filtro Rápido:
              </span>

              {/* Quick Filter: Only Favorites */}
              <button
                type="button"
                onClick={() => setOnlyFavoritesFilter(!onlyFavoritesFilter)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md shrink-0 transition-all cursor-pointer flex items-center gap-1.5 uppercase tracking-wider ${
                  onlyFavoritesFilter
                    ? 'bg-amber-500 text-black shadow-sm ring-1 ring-amber-400 font-black'
                    : 'bg-amber-950/30 text-amber-300 border border-amber-500/40 hover:bg-amber-900/50 hover:text-white'
                }`}
                title="Filtrar para ver somente partidas dos meus times favoritados"
              >
                <Star className={`h-3 w-3 ${onlyFavoritesFilter ? 'fill-black text-black' : 'fill-amber-400 text-amber-400'}`} />
                <span>Meus Times</span>
                <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                  onlyFavoritesFilter ? 'bg-black text-amber-300 font-bold' : 'bg-black/50 text-amber-400'
                }`}>
                  {favoriteMatchesCount}
                </span>
              </button>

              <span className="text-green-900 text-xs shrink-0">|</span>

              {divisionsList.map(div => {
                const isSelected = selectedDivision === div && !onlyFavoritesFilter;
                const count = div === 'Tudo' ? sportMatches.length : sportMatches.filter(m => m.division === div).length;
                const isLibertadores = div.toLowerCase().includes('libertadores');

                return (
                  <button
                    key={div}
                    type="button"
                    onClick={() => {
                      setSelectedDivision(div);
                      if (onlyFavoritesFilter) setOnlyFavoritesFilter(false);
                    }}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-md shrink-0 transition-all cursor-pointer flex items-center gap-1.5 uppercase tracking-wider ${
                      isSelected
                        ? isLibertadores
                          ? 'bg-amber-500 text-black shadow-sm ring-1 ring-amber-400 font-black'
                          : 'bg-seagreen text-white shadow-sm ring-1 ring-seagreen/40 font-black'
                        : isLibertadores
                          ? 'bg-amber-950/40 text-amber-300 border border-amber-500/30 hover:bg-amber-900/50 hover:text-white'
                          : 'bg-[#092215] text-slate-300 border border-green-950 hover:border-green-800 hover:text-white'
                    }`}
                  >
                    {isLibertadores && <span>🏆</span>}
                    <span>{div === 'Tudo' ? 'Todas Divisões' : div}</span>
                    <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                      isSelected 
                        ? isLibertadores ? 'bg-black text-amber-300 font-bold' : 'bg-black/60 text-green-300 font-bold'
                        : 'bg-black/40 text-green-400'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Collapsible Header Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-green-950/40 pt-2">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-xs font-bold text-emerald-300 hover:text-white uppercase tracking-widest cursor-pointer select-none"
            >
              <SlidersHorizontal className="h-4 w-4 text-seagreen" />
              <span>Mais Filtros e Busca</span>
              {showFilters ? <ChevronUp className="h-4 w-4 text-seagreen" /> : <ChevronDown className="h-4 w-4 text-seagreen" />}
            </button>
            
            {/* Short indicator of active filter terms if collapsed */}
            {!showFilters && (
              <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-emerald-300 font-mono">
                {searchTerm && (
                  <span className="bg-[#092215] px-2 py-0.5 rounded border border-green-900/30">
                    "{searchTerm}"
                  </span>
                )}
                {selectedDivision !== 'Tudo' && (
                  <span className="bg-[#092215] px-2 py-0.5 rounded border border-green-900/30">
                    {selectedDivision}
                  </span>
                )}
                {selectedBroadcaster !== 'Tudo' && (
                  <span className="bg-[#092215] px-2 py-0.5 rounded border border-green-900/30">
                    {selectedBroadcaster}
                  </span>
                )}
                {selectedStatus !== 'Tudo' && (
                  <span className="bg-[#092215] px-2 py-0.5 rounded border border-green-900/30">
                    {selectedStatus === 'ao_vivo' ? 'Ao Vivo' : selectedStatus === 'agendado' ? 'Agendados' : 'Finalizados'}
                  </span>
                )}
                {selectedDay !== 'Tudo' && (
                  <span className="bg-[#092215] px-2 py-0.5 rounded border border-green-900/30">
                    Dia {selectedDay}
                  </span>
                )}
                {(searchTerm || selectedDivision !== 'Tudo' || selectedBroadcaster !== 'Tudo' || selectedStatus !== 'Tudo' || selectedDay !== 'Tudo') && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchTerm('');
                      setSelectedDivision('Tudo');
                      setSelectedBroadcaster('Tudo');
                      setSelectedStatus('Tudo');
                      setSelectedDay('Tudo');
                    }}
                    className="text-red-400 hover:text-red-300 ml-1 font-bold uppercase text-[9px] cursor-pointer"
                  >
                    Resetar
                  </button>
                )}
              </div>
            )}
          </div>

          <AnimatePresence initial={true}>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="overflow-hidden space-y-4 pt-1"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  
                  {/* Input Filters Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
                    
                    {/* Search */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-seagreen uppercase tracking-widest shrink-0">Busca</span>
                      <div className="relative w-full">
                        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-green-600" />
                        <input 
                          type="text" 
                          value={searchTerm}
                          onChange={e => setSearchTerm(e.target.value)}
                          placeholder="Time, estádio..."
                          className="w-full bg-[#092215] border-none text-xs rounded pl-8 pr-3 py-2 text-white placeholder:text-green-700 focus:ring-1 focus:ring-seagreen outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Division */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-seagreen uppercase tracking-widest shrink-0">Divisão</span>
                      <select 
                        value={selectedDivision}
                        onChange={e => setSelectedDivision(e.target.value)}
                        className="w-full bg-[#092215] border-none text-xs rounded px-3 py-2 text-white focus:ring-1 focus:ring-seagreen outline-none cursor-pointer uppercase tracking-wider font-semibold"
                      >
                        <option value="Tudo" className="uppercase bg-[#081f13]">Todas as Divisões</option>
                        {divisionsList.filter(d => d !== 'Tudo').map(d => (
                          <option key={d} value={d} className="uppercase bg-[#081f13]">{d}</option>
                        ))}
                      </select>
                    </div>

                    {/* Broadcaster */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-seagreen uppercase tracking-widest shrink-0">Canal</span>
                      <select
                        value={selectedBroadcaster}
                        onChange={e => setSelectedBroadcaster(e.target.value)}
                        className="w-full bg-[#092215] border-none text-xs rounded px-3 py-2 text-white focus:ring-1 focus:ring-seagreen outline-none cursor-pointer uppercase tracking-wider font-semibold"
                      >
                        {broadcastersList.map(b => (
                          <option key={b} value={b} className="uppercase bg-[#081f13]">
                            {b === 'Tudo' ? 'Todas as Plataformas' : b}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Match State */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-seagreen uppercase tracking-widest shrink-0">Situação</span>
                      <select
                        value={selectedStatus}
                        onChange={e => setSelectedStatus(e.target.value as any)}
                        className="w-full bg-[#092215] border-none text-xs rounded px-3 py-2 text-white focus:ring-1 focus:ring-seagreen outline-none cursor-pointer uppercase tracking-wider font-semibold"
                      >
                        <option value="Tudo" className="uppercase bg-[#081f13]">Qualquer Situação</option>
                        <option value="ao_vivo" className="uppercase bg-[#081f13]">Ao vivo agora</option>
                        <option value="agendado" className="uppercase bg-[#081f13]">Agendados</option>
                        <option value="finalizado" className="uppercase bg-[#081f13]">Finalizados</option>
                      </select>
                    </div>

                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 self-end lg:self-auto">
                    <button 
                      type="button"
                      onClick={() => setIncludeFinished(!includeFinished)}
                      className={`px-3 py-2 rounded text-xs font-bold transition-all uppercase tracking-wider flex items-center gap-2 border cursor-pointer ${
                        includeFinished
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/80 shadow-sm'
                          : 'bg-[#092215] text-slate-400 border-green-900/30 hover:text-white'
                      }`}
                      title="Partidas finalizadas ficam ocultas por padrão e aparecem em segundo plano"
                    >
                      <span className={`w-2 h-2 rounded-full ${includeFinished ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`}></span>
                      <span>{includeFinished ? 'Ocultar Finalizados' : 'Incluir Finalizados'}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-950 font-mono text-green-400">
                        {finishedCount}
                      </span>
                    </button>

                    <button 
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedDivision('Tudo');
                        setSelectedBroadcaster('Tudo');
                        setSelectedStatus('Tudo');
                        setSelectedDay('Tudo');
                        setIncludeFinished(false);
                      }}
                      className="px-4 py-2 bg-green-900 text-green-300 text-xs font-bold rounded hover:bg-green-800 hover:text-white transition-all uppercase tracking-wider cursor-pointer"
                    >
                      Limpar
                    </button>
                  </div>

                </div>

                {/* DATE CAROUSEL */}
                <div className="border-t border-green-900/30 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-seagreen" /> Filtro por Data ({currentMonthName} {currentYearNumber})
                  </span>
                  
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-green-800">
                    <button
                      onClick={() => setSelectedDay('Tudo')}
                      className={`px-3 py-1 text-[10px] font-bold uppercase rounded tracking-wider shrink-0 transition-all cursor-pointer ${
                        selectedDay === 'Tudo'
                          ? 'bg-seagreen text-white border border-seagreen font-bold'
                          : 'bg-[#092215] text-green-300 hover:text-white'
                      }`}
                    >
                      Mês Inteiro
                    </button>

                    <button
                      onClick={() => setSelectedDay(currentDayNumber)}
                      className={`px-3 py-1 text-[10px] font-bold uppercase rounded tracking-wider shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
                        selectedDay === currentDayNumber
                          ? 'bg-seagreen text-white border border-seagreen font-bold'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-500/60 hover:bg-emerald-900/40'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Hoje ({currentDayNumber})
                    </button>

                    {Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1).map(day => {
                      const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
                      const dObj = new Date(currentYearNumber, currentMonthIndex, day);
                      const dayLabel = daysOfWeek[dObj.getDay()];
                      const isSelected = selectedDay === day;
                      const isToday = day === currentDayNumber;

                      return (
                        <button
                          key={day}
                          ref={isToday ? todayButtonRef : null}
                          onClick={() => setSelectedDay(day)}
                          className={`px-2.5 py-1 text-[10px] font-bold rounded shrink-0 transition-all cursor-pointer flex flex-col items-center justify-center min-w-[38px] relative ${
                            isSelected
                              ? 'bg-seagreen text-white font-extrabold shadow-sm border border-seagreen'
                              : isToday
                                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/60 hover:bg-emerald-900/50'
                                : 'bg-[#092215] text-green-300 hover:text-white'
                          }`}
                        >
                          <span className="text-[8px] opacity-75 uppercase">{dayLabel}</span>
                          <span className="text-xs font-bold leading-none mt-0.5">{day}</span>
                          {isToday && !isSelected && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 border border-black" title="Hoje"></span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </section>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-6">
        
        {/* Top Ad Slot (Google Ad Manager) */}
        <AdSlot
          adUnit="/22404335646/topo"
          sizes={[[728, 90], [320, 50], [970, 90]]}
          id="div-gpt-ad-topo"
          label="Patrocínio / Topo"
        />

        {activeSport === 'filantropia' ? (
          <SocialProjectsView />
        ) : (
          <>
            {/* CONMEBOL Libertadores Official Tournament Banner when Libertadores is selected */}
            {activeSport === 'futebol' && (selectedDivision === 'Libertadores' || selectedDivision.toLowerCase().includes('libertadores')) && (
              <div className="bg-gradient-to-r from-amber-950/60 via-[#101c13] to-amber-950/60 border border-amber-500/40 rounded-xl p-4 md:p-5 shadow-lg relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                      🏆
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-base md:text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                          CONMEBOL Libertadores 2026
                        </h2>
                        <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase rounded bg-amber-500 text-black">
                          Fase Final
                        </span>
                      </div>
                      <p className="text-xs text-amber-200/80 mt-1 max-w-2xl leading-relaxed">
                        Acompanhe os confrontos dos gigantes do continente sul-americano com horários, estádios e canais oficiais de transmissão (TV Globo, ESPN, Disney+, Paramount+ e CazéTV).
                      </p>
                    </div>
                  </div>

                  <a 
                    href="https://gol.conmebol.com/libertadores/pt-br" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="shrink-0 px-3.5 py-2 rounded-lg bg-amber-500/20 border border-amber-500/50 hover:bg-amber-500/30 text-amber-300 text-xs font-bold transition-all flex items-center justify-center gap-2 group"
                  >
                    <span>Portal Oficial CONMEBOL</span>
                    <ExternalLink className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </a>
                </div>
              </div>
            )}

            {/* Statistics Bar - Extremely Compact */}
            <section className="bg-[#05140d]/40 border border-green-950/40 rounded-lg py-1.5 px-3 flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1.5 text-[10px] text-green-400 font-mono tracking-wide">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
            <span>TOTAL FILTRADO: <strong className="text-white font-sans">{totalGames}</strong></span>
          </div>
          <div className="hidden sm:block text-green-950">•</div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
            <span>AO VIVO: <strong className="text-red-400 font-sans">{liveCount}</strong></span>
          </div>
          <div className="hidden sm:block text-green-950">•</div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-seagreen font-bold"></span>
            <span>PRÓXIMAS: <strong className="text-seagreen font-sans">{scheduledCount}</strong></span>
          </div>
          <div className="hidden sm:block text-green-950">•</div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-300"></span>
            <span>FINALIZADOS: <strong className="text-green-300 font-sans">{finishedCount}</strong></span>
          </div>
        </section>

        {/* LOADING & EMPTY STATES */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              <div className="absolute -inset-2 rounded-full border-t-2 border-seagreen animate-spin"></div>
              <div className="h-12 w-12 rounded-full border border-green-800 flex items-center justify-center">
                <Radio className="h-5 w-5 text-green-400 animate-pulse" />
              </div>
            </div>
            <p className="text-xs text-green-400 font-mono tracking-widest uppercase animate-pulse">Carregando transmissões do Esporte Radar...</p>
          </div>
        ) : sortedMatches.length === 0 ? (
          <div className="p-12 text-center rounded-lg bg-[#05140d] border border-green-950/60 space-y-4 max-w-lg mx-auto shadow-xl">
            <Info className="h-10 w-10 text-seagreen mx-auto" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Nenhum Evento Encontrado</h3>
            <p className="text-xs text-green-400/80 leading-relaxed">
              Não existem transmissões agendadas nesta modalidade para {
                selectedDay === 'Tudo'
                  ? 'a data ou filtros selecionados'
                  : selectedDay === currentDayNumber
                  ? 'hoje'
                  : `dia ${String(selectedDay).padStart(2, '0')}/${String(currentMonthIndex + 1).padStart(2, '0')}`
              }. Selecione outro dia no calendário ou resete os filtros.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedDivision('Tudo');
                setSelectedBroadcaster('Tudo');
                setSelectedStatus('Tudo');
                setSelectedDay('Tudo');
                setIncludeFinished(false);
              }}
              className="px-4 py-2 bg-seagreen text-white text-xs font-bold rounded hover:bg-seagreen-solid hover:text-black transition-all cursor-pointer uppercase tracking-wider"
            >
              Resetar Filtros
            </button>
          </div>
        ) : (
          /* TABLE GRID HEADER FOR LAPTOPS */
          <div className="space-y-3">
            
            {/* Table layout header */}
            <div className="hidden lg:grid grid-cols-12 px-6 py-2 text-[10px] font-bold text-green-500 uppercase tracking-widest border-b border-green-900/40">
              <div className="col-span-2">DATA / HORA</div>
              <div className="col-span-1">DIVISÃO</div>
              <div className="col-span-5 text-center">PARTIDA</div>
              <div className="col-span-2">TRANSMISSÃO</div>
              <div className="col-span-2 text-right">AÇÃO</div>
            </div>

            {/* List entries */}
            <div className="grid grid-cols-1 gap-3">
              <AnimatePresence mode="popLayout">
                {sortedMatches.flatMap((match, idx) => {
                  const dateInfo = formatBrazilianDate(match.date);
                  const isLive = match.status === 'ao_vivo';
                  const isFinished = match.status === 'finalizado';
                  const hasFavorite = isFavoriteMatch(match);
                  const isHomeFav = isTeamFavorite(match.homeTeam);
                  const isAwayFav = isTeamFavorite(match.awayTeam);

                  const showMiddleAd = idx === Math.floor(sortedMatches.length / 2) && sortedMatches.length > 2;

                  const isFirst = idx === 0;

                  const mainElement = (
                    <motion.div
                      key={match.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => setSelectedMatch(match)}
                      className={`group flex flex-col rounded-lg p-3 lg:p-2.5 transition-all duration-200 cursor-pointer relative shadow-[0_2px_8px_rgba(0,0,0,0.15)] hover:shadow-md gap-2 ${
                        hasFavorite
                          ? 'bg-amber-950/15 border-2 border-amber-500/60 hover:border-amber-400 hover:bg-amber-950/25 shadow-amber-950/30'
                          : 'bg-[oklch(85.2%_0.199_91.936)]/[0.04] border border-[oklch(85.2%_0.199_91.936)]/35 hover:bg-[color-mix(in_oklab,oklch(0.77_0.16_199.2)_55%,transparent)] hover:border-[oklch(0.77_0.16_199.2)]/80'
                      }`}
                    >
                      {/* Decorative live bar */}
                      {isLive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500 rounded-l"></div>
                      )}

                      {/* Top Meta Header: 20% Date/Time | 20% Day of Week | 20% Division | 40% Broadcasters */}
                      <div className="flex items-center w-full gap-1 border-b border-green-900/20 pb-1.5 text-left">
                        {/* 20% Data e Hora */}
                        <div className="w-[20%] shrink-0 min-w-0 pr-1">
                          <span className="text-[10px] sm:text-[11px] font-bold text-white uppercase tracking-tight truncate block" title={`${dateInfo.shortDate} às ${match.time}`}>
                            {dateInfo.shortDate} {match.time}
                          </span>
                        </div>

                        {/* 20% Dia da Semana */}
                        <div className="w-[20%] shrink-0 min-w-0 pr-1">
                          <span className="text-[9px] sm:text-[10px] text-emerald-300 font-mono uppercase tracking-wider truncate block" title={isLive ? 'Ao Vivo' : dateInfo.dayOfWeek}>
                            {isLive ? (
                              <span className="text-red-400 font-bold animate-pulse flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                                AO VIVO
                              </span>
                            ) : (
                              dateInfo.dayOfWeek
                            )}
                          </span>
                        </div>

                        {/* 20% Divisão & Favorito */}
                        <div className="w-[20%] shrink-0 min-w-0 pr-1 flex items-center gap-1">
                          <span 
                            className={`px-1.5 py-0.5 text-[8px] font-bold rounded uppercase tracking-wider truncate block ${getDivisionStyle(match.division)}`}
                            title={match.division}
                          >
                            {match.division}
                          </span>
                          {hasFavorite && (
                            <span 
                              className="px-1 py-0.5 text-[7px] font-black rounded uppercase tracking-wider bg-amber-500 text-black shadow-sm shrink-0 flex items-center gap-0.5" 
                              title="Meu Time Favorito"
                            >
                              <Star className="h-2 w-2 fill-black text-black" />
                            </span>
                          )}
                        </div>

                        {/* 40% Canais de Transmissão (empilhados / resumidos com +) */}
                        <div className="w-[40%] shrink-0 min-w-0 flex items-center justify-end gap-1 flex-wrap">
                          {match.broadcasters.slice(0, 2).map((b, i) => {
                            const style = getBroadcasterStyle(b);
                            return (
                              <div 
                                key={i} 
                                className={`px-1.5 py-0.5 bg-white/10 rounded flex items-center justify-center text-[8px] font-bold uppercase tracking-wider text-green-300 border border-green-800/30 truncate max-w-[85px] sm:max-w-[120px] ${style.bg}`}
                                title={b}
                              >
                                {b}
                              </div>
                            );
                          })}
                          {match.broadcasters.length > 2 && (
                            <div 
                              className="px-1.5 py-0.5 bg-green-950/90 rounded flex items-center justify-center text-[8px] font-bold uppercase tracking-wider text-green-400 border border-green-800/40 shrink-0"
                              title={`Mais canais: ${match.broadcasters.slice(2).join(', ')} (clique no card para ver detalhes)`}
                            >
                              +{match.broadcasters.length - 2}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Main Matchup Row */}
                      <div className="flex items-center justify-between gap-2 sm:gap-3 pt-0.5">
                        {/* Team matchup */}
                        <div className="flex-1 flex items-center justify-between md:justify-center gap-1.5 sm:gap-3 bg-[#020704]/30 md:bg-transparent p-2 md:p-0 rounded-lg min-w-0">
                          
                          {/* Home team */}
                          <div className="flex items-center gap-1 sm:gap-2 w-[45%] md:w-5/12 min-w-0 justify-end">
                            <button
                              type="button"
                              onClick={(e) => handleToggleFavoriteTeam(match.homeTeam, e)}
                              className={`p-1 rounded transition-all cursor-pointer shrink-0 ${
                                isHomeFav 
                                  ? 'text-amber-400 hover:text-amber-300 scale-110' 
                                  : 'text-slate-600 hover:text-amber-400 opacity-40 hover:opacity-100 hover:scale-110'
                              }`}
                              title={isHomeFav ? `Remover ${match.homeTeam} dos favoritos` : `Favoritar ${match.homeTeam} e receber alertas`}
                            >
                              <Star className={`h-3.5 w-3.5 ${isHomeFav ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
                            </button>
                            <span className={`text-[11px] sm:text-xs md:text-sm font-bold text-right line-clamp-2 break-words leading-tight min-w-0 ${
                              isHomeFav ? 'text-amber-300 font-extrabold' : 'text-white'
                            }`}>
                              {match.homeTeam}
                            </span>
                            <TeamLogo teamName={match.homeTeam} logoUrl={match.homeTeamLogo} size="md" />
                          </div>

                          {/* Versus state */}
                          <div className="flex flex-col items-center justify-center shrink-0 px-1">
                            {isFinished ? (
                              <span className="text-[9px] font-mono font-bold text-slate-300 bg-white/10 px-1.5 py-0.5 rounded border border-white/20 uppercase tracking-wider">
                                FINALIZADO
                              </span>
                            ) : isLive ? (
                              <span className="text-[9px] font-mono font-extrabold text-red-400 animate-pulse bg-red-950/60 px-1.5 py-0.5 rounded border border-red-800/40 uppercase tracking-wider flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></span>
                                AO VIVO
                              </span>
                            ) : (
                              <span className="text-seagreen text-[10px] font-black italic uppercase tracking-tighter bg-green-950/40 px-1.5 py-0.5 rounded border border-green-900/25">VS</span>
                            )}
                          </div>

                          {/* Away team */}
                          <div className="flex items-center gap-1 sm:gap-2 w-[45%] md:w-5/12 min-w-0 justify-start">
                            <TeamLogo teamName={match.awayTeam} logoUrl={match.awayTeamLogo} size="md" />
                            <span className={`text-[11px] sm:text-xs md:text-sm font-bold text-left line-clamp-2 break-words leading-tight min-w-0 ${
                              isAwayFav ? 'text-amber-300 font-extrabold' : 'text-white'
                            }`}>
                              {match.awayTeam}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleToggleFavoriteTeam(match.awayTeam, e)}
                              className={`p-1 rounded transition-all cursor-pointer shrink-0 ${
                                isAwayFav 
                                  ? 'text-amber-400 hover:text-amber-300 scale-110' 
                                  : 'text-slate-600 hover:text-amber-400 opacity-40 hover:opacity-100 hover:scale-110'
                              }`}
                              title={isAwayFav ? `Remover ${match.awayTeam} dos favoritos` : `Favoritar ${match.awayTeam} e receber alertas`}
                            >
                              <Star className={`h-3.5 w-3.5 ${isAwayFav ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
                            </button>
                          </div>

                        </div>

                        {/* Action click button */}
                        <div className="hidden md:block shrink-0 text-right">
                          {isLive ? (
                            <span className="inline-block px-3 py-1 bg-green-600/20 text-green-400 text-[10px] font-bold rounded border border-green-600/40 uppercase tracking-wider group-hover:bg-green-600 group-hover:text-black transition-all">
                              Assistir
                            </span>
                          ) : isFinished ? (
                            <span className="inline-block px-3 py-1 bg-white/5 text-slate-500 text-[10px] font-bold rounded border border-white/15 uppercase tracking-wider">
                              Detalhes
                            </span>
                          ) : hasFavorite ? (
                            <span className="inline-block px-3 py-1 bg-amber-500/20 text-amber-300 group-hover:bg-amber-500 group-hover:text-black group-hover:border-amber-400 text-[10px] font-bold rounded border border-amber-500/40 transition-all uppercase tracking-wider">
                              Ver Detalhes
                            </span>
                          ) : (
                            <span className="inline-block px-3 py-1 bg-white/5 text-[oklch(85.2%_0.199_91.936)] group-hover:bg-[color-mix(in_oklab,oklch(0.77_0.16_199.2)_55%,transparent)] group-hover:text-cyan-100 group-hover:border-[oklch(0.77_0.16_199.2)] text-[10px] font-bold rounded border border-[oklch(85.2%_0.199_91.936)]/30 transition-all uppercase tracking-wider">
                              Transmitir
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Small Bottom Indicator Arrow for Mobile Expand UX */}
                      <div className="flex items-center justify-center -mb-1 -mt-0.5 pt-0.5 border-t border-green-900/20 text-green-500/50 group-hover:text-seagreen transition-colors">
                        <ChevronDown className="h-3 w-3 transition-transform duration-200 group-hover:translate-y-0.5" />
                      </div>

                    </motion.div>
                  );

                  if (showMiddleAd) {
                    return [
                      mainElement,
                      (
                        <motion.div
                          key={`ad-meio-${match.id}`}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <AdSlot
                            adUnit="/22404335646/meio"
                            sizes={[[300, 250], [320, 50], [728, 90]]}
                            id="div-gpt-ad-meio"
                            label="Patrocínio / Meio da Lista"
                          />
                        </motion.div>
                      )
                    ];
                  }

                  return [mainElement];
                })}
              </AnimatePresence>
            </div>
          </div>
        )}
        </>
        )}
      </main>

      {/* FOOTER INFO & DISCLAIMER */}
      <footer className="bg-[#010402] border-t border-green-950/80 py-6 px-6 md:px-8 text-[10px] text-green-700 shrink-0 mt-auto space-y-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 uppercase tracking-widest">
          <div className="flex flex-wrap justify-center md:justify-start gap-6">
            <span>© 2026 Esporte Radar • Guia de Transmissões</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
              Sincronização Oficial CBF
            </span>
            <span>Horários padrão de Brasília (DF)</span>
          </div>
          <div className="text-center md:text-right font-mono text-[9px]">
            Exibindo {filteredMatches.length} de {matches.length} transmissões do mês
          </div>
        </div>

        {/* Legal Disclaimer */}
        <div className="max-w-7xl mx-auto pt-3 border-t border-green-950/40 text-[10px] text-green-600/75 leading-relaxed font-normal normal-case text-center md:text-left">
          <strong className="text-green-500 font-semibold">Aviso Legal & Transparência:</strong> O Esporte Radar atua estritamente como um guia informativo de transmissões esportivas. As datas, horários, estádios e canais de exibição são baseados nas divulgações públicas oficiais da CBF, CONMEBOL e das emissoras detentoras dos direitos, estando sujeitos a eventuais atrasos, remarcações ou cancelamentos sem aviso prévio. A plataforma não se responsabiliza por alterações de última hora efetuadas pelos organizadores.
        </div>
      </footer>

      {/* MATCH HUB MODAL (VIRTUAL LOUNGE) */}
      <AnimatePresence>
        {selectedMatch && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
          >
            {/* Modal Box */}
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-[#05140d] border border-green-950/60 rounded-lg shadow-2xl custom-scrollbar"
            >
              {/* Action buttons (Close 'X' and Info 'i' below it) */}
              <div className="absolute top-4 right-4 flex flex-col items-center gap-2 z-20">
                <button 
                  onClick={() => {
                    setSelectedMatch(null);
                    setShowMatchModalHelp(false);
                  }}
                  aria-label="Fechar detalhes da partida"
                  title="Fechar janela"
                  className="p-2 rounded-full bg-[#020704]/90 text-green-400 hover:text-white hover:bg-green-950 border border-green-950/80 transition-all cursor-pointer shadow-lg"
                >
                  <X className="h-4 w-4" />
                </button>

                <button 
                  onClick={() => setShowMatchModalHelp(prev => !prev)}
                  aria-label="Instruções e ajuda sobre a partida"
                  aria-expanded={showMatchModalHelp}
                  title="Instruções e informações da partida"
                  className={`p-2 rounded-full border transition-all cursor-pointer shadow-lg ${
                    showMatchModalHelp
                      ? 'bg-seagreen text-white font-bold border-seagreen ring-2 ring-seagreen/30'
                      : 'bg-[#020704]/90 text-green-300 hover:text-white hover:bg-green-950 border-green-950/80'
                  }`}
                >
                  <Info className="h-4 w-4" />
                </button>
              </div>

              {/* Header card info */}
              <div className="bg-[#020704] p-6 text-center border-b border-green-950/60 space-y-4">
                
                {/* Accessible Instructions Drawer when 'i' is clicked */}
                <AnimatePresence>
                  {showMatchModalHelp && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden mb-4 text-left"
                    >
                      <div className="p-4 rounded-lg bg-[#072417] border border-green-700/50 text-green-200 text-xs space-y-2.5 shadow-inner">
                        <div className="flex items-center justify-between font-bold text-sm text-white">
                          <span className="flex items-center gap-2">
                            <Info className="h-4 w-4 text-seagreen" />
                            Guia de Informações da Partida
                          </span>
                          <button
                            onClick={() => setShowMatchModalHelp(false)}
                            className="text-[10px] text-green-400 hover:text-white uppercase tracking-wider underline cursor-pointer"
                          >
                            Ocultar
                          </button>
                        </div>
                        <ul className="space-y-1.5 text-[11px] text-green-200/90 leading-relaxed list-disc list-inside">
                          <li><strong>Time da Casa:</strong> O time exibido à esquerda é o mandante (quem está sediando o jogo) no estádio indicado.</li>
                          <li><strong>Horário:</strong> Todos os horários seguem rigorosamente o fuso oficial de <em>Brasília (GMT-3)</em>.</li>
                          <li><strong>Onde Assistir:</strong> Clique em qualquer um dos canais listados abaixo para abrir diretamente o portal oficial de streaming ou transmissão.</li>
                          <li><strong>Status do Jogo:</strong> Indicado entre <em>Agendado</em>, <em>Ao Vivo</em> (durante a partida) ou <em>Finalizado</em>.</li>
                          <li><strong>Aviso de Transparência:</strong> Informamos dados públicos divulgados oficialmente pela CBF, CONMEBOL e pelas emissoras. Não nos responsabilizamos por eventuais alterações de datas, horários ou cancelamentos de última hora.</li>
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <div className="flex items-center justify-center gap-2">
                  <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider ${getDivisionStyle(selectedMatch.division)}`}>
                    {selectedMatch.division}
                  </span>
                  <span className="text-[10px] text-green-400 font-mono uppercase tracking-wider">
                    {selectedMatch.round}
                  </span>
                </div>

                {/* Main teams block */}
                <div className="grid grid-cols-7 items-center justify-center py-4">
                  {/* Home */}
                  <div className="col-span-3 flex flex-col items-center space-y-2">
                    <TeamLogo teamName={selectedMatch.homeTeam} logoUrl={selectedMatch.homeTeamLogo} size="xl" />
                    <span className="text-sm font-bold text-white text-center">
                      {selectedMatch.homeTeam}
                    </span>
                    <span className="text-[8px] font-bold text-green-500 uppercase tracking-widest bg-[#0a2e1e] px-1.5 py-0.5 rounded">
                      MANDO
                    </span>
                  </div>

                  {/* VS / Score / Status */}
                  <div className="col-span-1 flex flex-col items-center justify-center !-mt-[35px]" style={{ marginTop: '-35px' }}>
                    {selectedMatch.status === 'ao_vivo' ? (
                      <div className="space-y-1 !-mt-[35px]" style={{ marginTop: '-35px' }}>
                        <span className="text-[8px] font-bold text-red-500 uppercase tracking-wider block animate-pulse">STATUS</span>
                        <div className="text-xs font-mono font-black text-red-400 bg-red-950/80 px-2 py-1 rounded border border-red-900/30 whitespace-nowrap">
                          AO VIVO
                        </div>
                      </div>
                    ) : selectedMatch.status === 'finalizado' ? (
                      <div className="space-y-1 !-mt-[35px]" style={{ marginTop: '-35px' }}>
                        <span className="text-[8px] font-bold text-green-500 uppercase tracking-wider block">STATUS</span>
                        <div className="text-xs font-mono font-black text-seagreen bg-green-950/80 px-2 py-1 rounded border border-green-900/30 whitespace-nowrap">
                          FINALIZADO
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1 !-mt-[35px]" style={{ marginTop: '-35px' }}>
                        <span className="text-[8px] font-bold text-seagreen uppercase tracking-wider block">HORÁRIO</span>
                        <div className="text-xl font-mono font-black text-white">
                          {selectedMatch.time}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Away */}
                  <div className="col-span-3 flex flex-col items-center space-y-2">
                    <TeamLogo teamName={selectedMatch.awayTeam} logoUrl={selectedMatch.awayTeamLogo} size="xl" />
                    <span className="text-sm font-bold text-white text-center">
                      {selectedMatch.awayTeam}
                    </span>
                    <span className="text-[8px] font-bold text-green-500 uppercase tracking-widest bg-[#05140d] px-1.5 py-0.5 rounded">
                      VISITA
                    </span>
                  </div>
                </div>

                {/* Stadium details */}
                <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-green-400 bg-[#05140d]/60 px-3 py-1.5 rounded border border-green-950/40">
                  <MapPin className="h-3 w-3 text-green-500" />
                  <span>Estádio: <strong className="text-white">{selectedMatch.stadium}</strong></span>
                </div>

              </div>

              {/* Action and channels block */}
              <div className="p-6 space-y-6">
                
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-green-500 uppercase tracking-widest flex items-center gap-1">
                    <Tv className="h-3.5 w-3.5" /> Selecione o canal para assistir no navegador
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedMatch.broadcasters.map((broadcaster, index) => {
                      const style = getBroadcasterStyle(broadcaster);
                      let url = selectedMatch.transmissionUrl;
                      const name = broadcaster.toLowerCase();
                      
                      if (name.includes('globo')) url = 'https://globoplay.globo.com/';
                      else if (name.includes('sportv')) url = 'https://globoplay.globo.com/canais/sportv/';
                      else if (name.includes('premiere')) url = 'https://premiere.globo.com/';
                      else if (name.includes('caze') || name.includes('youtube')) url = 'https://www.youtube.com/@CazeTV';
                      else if (name.includes('prime')) url = 'https://www.primevideo.com';

                      return (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-4 rounded bg-[#020704] hover:bg-[#082015] border border-green-950/40 hover:border-seagreen text-white transition-all duration-200 group cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded bg-[#092215] flex items-center justify-center text-[9px] font-black uppercase text-seagreen">
                              {broadcaster.substring(0, 2).toUpperCase()}
                            </span>
                            <div>
                              <p className="text-xs font-bold text-white group-hover:text-seagreen">{broadcaster}</p>
                              <p className="text-[9px] text-green-400/70 font-mono uppercase tracking-wider">Transmissão Direta</p>
                            </div>
                          </div>
                          <ExternalLink className="h-3.5 w-3.5 text-green-500 group-hover:text-seagreen transition-colors" />
                        </a>
                      );
                    })}
                  </div>
                </div>

                <div className="p-3.5 rounded bg-[#092215]/50 border border-green-950/30 text-[11px] text-green-400 leading-relaxed">
                  <span className="font-bold text-seagreen">Dica:</span> Ao clicar em uma das plataformas listadas acima, o navegador abrirá diretamente o site oficial correspondente. Certifique-se de possuir login ou assinatura ativa para acompanhar a partida com melhor qualidade.
                </div>

                {/* Team Favoriting & Smartwatch Alerts in Modal */}
                <div className="p-4 rounded-lg bg-[#031109] border border-amber-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Star className="h-3.5 w-3.5 fill-amber-400" />
                      Favoritar Times desta Partida
                    </span>
                    <button
                      onClick={() => {
                        setSelectedMatch(null);
                        setShowPreferencesModal(true);
                      }}
                      className="text-[10px] text-amber-400 hover:text-white font-bold uppercase tracking-wider flex items-center gap-1 underline cursor-pointer"
                    >
                      <Watch className="h-3 w-3 text-sky-400" /> Configurar Alertas Smartwatch
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      onClick={() => handleToggleFavoriteTeam(selectedMatch.homeTeam)}
                      className={`p-2.5 rounded-lg border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                        isTeamFavorite(selectedMatch.homeTeam)
                          ? 'bg-amber-950/70 border-amber-500 text-amber-300 shadow-sm'
                          : 'bg-[#06180f] border-green-900/40 text-slate-300 hover:text-white hover:border-amber-500/50'
                      }`}
                    >
                      <span className="truncate">{selectedMatch.homeTeam}</span>
                      <span className="flex items-center gap-1 shrink-0 text-[10px] font-mono">
                        <Star className={`h-3 w-3 ${isTeamFavorite(selectedMatch.homeTeam) ? 'fill-amber-400 text-amber-400' : 'text-slate-500'}`} />
                        {isTeamFavorite(selectedMatch.homeTeam) ? 'Favoritado' : 'Favoritar'}
                      </span>
                    </button>

                    <button
                      onClick={() => handleToggleFavoriteTeam(selectedMatch.awayTeam)}
                      className={`p-2.5 rounded-lg border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                        isTeamFavorite(selectedMatch.awayTeam)
                          ? 'bg-amber-950/70 border-amber-500 text-amber-300 shadow-sm'
                          : 'bg-[#06180f] border-green-900/40 text-slate-300 hover:text-white hover:border-amber-500/50'
                      }`}
                    >
                      <span className="truncate">{selectedMatch.awayTeam}</span>
                      <span className="flex items-center gap-1 shrink-0 text-[10px] font-mono">
                        <Star className={`h-3 w-3 ${isTeamFavorite(selectedMatch.awayTeam) ? 'fill-amber-400 text-amber-400' : 'text-slate-500'}`} />
                        {isTeamFavorite(selectedMatch.awayTeam) ? 'Favoritado' : 'Favoritar'}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setSelectedMatch(null)}
                    className="px-4 py-2 bg-green-950 hover:bg-green-900 text-green-300 hover:text-white text-xs font-bold rounded uppercase tracking-wider cursor-pointer"
                  >
                    Voltar
                  </button>
                </div>

              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TEAM PREFERENCES & SMARTWATCH NOTIFICATIONS MODAL */}
      <TeamPreferencesModal
        isOpen={showPreferencesModal}
        onClose={() => setShowPreferencesModal(false)}
        matches={matches}
        preferences={preferences}
        onUpdatePreferences={handleUpdatePreferences}
      />

      {/* FLOATING PWA / ADD TO HOME SCREEN PROMPT */}
      <InstallPwaPrompt />

    </div>
  );
}
