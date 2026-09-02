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
  Watch,
  Shield,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Square
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FootballMatch, SportType, UserPreferences } from './types';
import { AdSlot, useAnchorAd } from './components/AdSlot';
import { SocialProjectsView } from './components/SocialProjectsView';
import { InstallPwaPrompt } from './components/InstallPwaPrompt';
import { Preloader } from './components/Preloader';
import { TeamPreferencesModal } from './components/TeamPreferencesModal';
import { AccessibilityModal } from './components/AccessibilityModal';
import { UniversalAccessibilityIcon } from './components/UniversalAccessibilityIcon';
import { TeamLogo } from './components/TeamLogo';
import { NotificationToastContainer } from './components/NotificationToastContainer';
import { MultiSelectFilter, MultiSelectOption } from './components/MultiSelectFilter';
import { 
  getStoredPreferences, 
  savePreferences, 
  checkAndTriggerMatchAlerts,
  initServiceWorker,
  requestNotificationPermission,
  emitInAppToast
} from './utils/notificationService';
import { 
  isTeamInFavorites, 
  isMatchFavorite, 
  toggleFavoriteTeamInList, 
  isSameTeam, 
  sanitizeFavoritesList 
} from './utils/teamUtils';
import { 
  AccessibilitySettings, 
  getStoredA11ySettings, 
  saveA11ySettings, 
  speakMatch, 
  speakTodayScheduleSummary, 
  speakLiveMatchesSummary, 
  stopSpeech, 
  subscribeSpeechState, 
  playAudioCue 
} from './utils/accessibility';
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

  // Próximo mês e cálculo de antecipação nos últimos 5 dias do mês
  const isLast5DaysOfMonth = currentDayNumber >= (daysInCurrentMonth - 4);
  const nextMonthDate = new Date(currentYearNumber, currentMonthIndex + 1, 1);
  const nextMonthIndex = nextMonthDate.getMonth();
  const nextMonthYear = nextMonthDate.getFullYear();
  const nextMonthName = monthNames[nextMonthIndex];
  const daysInNextMonth = new Date(nextMonthYear, nextMonthIndex + 1, 0).getDate();

  const hasNextMonthGames = matches.some(m => {
    const parts = (m.date || '').split('-');
    if (parts.length >= 2) {
      return parseInt(parts[1], 10) === (nextMonthIndex + 1);
    }
    return false;
  });

  const isExtendedMonthPeriod = isLast5DaysOfMonth || hasNextMonthGames;

  // Filters state (supporting multi-select for divisions, broadcasters, status and day)
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDivisions, setSelectedDivisions] = useState<string[]>([]);
  const [selectedBroadcasters, setSelectedBroadcasters] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | string | 'Tudo'>('Tudo');
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

  // Accessibility & Text-to-Speech (Leitor de voz para cegos e modo claro/escuro)
  const [a11ySettings, setA11ySettings] = useState<AccessibilitySettings>(() => getStoredA11ySettings());
  const [showA11yModal, setShowA11yModal] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentSpokenText, setCurrentSpokenText] = useState('');

  // Update a11y settings and sync
  const handleUpdateA11y = (newSettings: AccessibilitySettings) => {
    setA11ySettings(newSettings);
    saveA11ySettings(newSettings);
  };

  // Toggle Theme (Modo Claro / Modo Escuro)
  const handleToggleTheme = () => {
    if (a11ySettings.soundEffects) playAudioCue('toggle');
    const newTheme = a11ySettings.theme === 'light' ? 'dark' : 'light';
    handleUpdateA11y({ ...a11ySettings, theme: newTheme });
  };

  // Subscribe to voice reading state
  useEffect(() => {
    const unsub = subscribeSpeechState((speaking, text) => {
      setIsSpeaking(speaking);
      setCurrentSpokenText(text);
    });
    return unsub;
  }, []);

  // Keyboard accessibility shortcuts (Alt+A, Alt+T, Alt+O, Alt+P)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        setShowA11yModal(prev => !prev);
      } else if (e.altKey && (e.key === 't' || e.key === 'T')) {
        e.preventDefault();
        handleToggleTheme();
      } else if (e.altKey && (e.key === 'o' || e.key === 'O')) {
        e.preventDefault();
        speakTodayScheduleSummary(matches, a11ySettings.speechRate);
      } else if (e.altKey && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        stopSpeech();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [a11ySettings, matches]);

  // Audio trigger for single match
  const handleSpeakSingleMatch = (m: FootballMatch, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (a11ySettings.soundEffects) playAudioCue('select');
    speakMatch(m, a11ySettings.speechRate);
  };

  // Update preferences and sync with localStorage
  const handleUpdatePreferences = (newPrefs: UserPreferences) => {
    setPreferences(newPrefs);
    savePreferences(newPrefs);
  };

  // Initialize Service Worker on mount for background push notifications & mobile alerts
  useEffect(() => {
    initServiceWorker();
  }, []);

  // Quick toggle favorite for a specific team (directly from match card or modal)
  const handleToggleFavoriteTeam = async (teamName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    const { newFavorites, wasRemoved, cleanName } = toggleFavoriteTeamInList(teamName, preferences.favoriteTeams);

    // If favoriting a team, prompt browser for notification permission if default
    if (!wasRemoved && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        try {
          const perm = await requestNotificationPermission();
          if (perm === 'granted') {
            emitInAppToast({
              title: `🔔 Alertas Ativados: ${cleanName}`,
              body: `Notificações autorizadas com sucesso! Você receberá avisos antes das partidas no celular e relógio.`,
              type: 'success',
            });
          }
        } catch {}
      } else if (Notification.permission === 'granted') {
        emitInAppToast({
          title: `⭐ Time Favoritado: ${cleanName}`,
          body: `Você receberá avisos no início das partidas do ${cleanName}.`,
          type: 'success',
        });
      }
    } else if (wasRemoved) {
      // Direct user confirmation when removing favorite team
      emitInAppToast({
        title: `⭐ Time Removido dos Favoritos`,
        body: `${cleanName} foi removido dos favoritos e seus alertas foram desativados.`,
        type: 'info',
      });
    }

    // Clean up or add notification config
    const newConfigs = { ...preferences.notificationConfigs };
    if (wasRemoved) {
      // Remove all notification entries corresponding to this team alias/canonical name
      Object.keys(newConfigs).forEach(key => {
        if (isSameTeam(key, cleanName)) {
          delete newConfigs[key];
        }
      });
      // If no favorite teams left and onlyFavoritesFilter is active, deactivate the filter
      if (newFavorites.length === 0 && onlyFavoritesFilter) {
        setOnlyFavoritesFilter(false);
      }
    } else {
      const existingKey = Object.keys(newConfigs).find(k => isSameTeam(k, cleanName));
      if (!existingKey) {
        newConfigs[cleanName] = {
          teamName: cleanName,
          enabled: true,
          divisions: [],
          notifyBeforeMinutes: preferences.notifyBeforeMinutes || 15,
          soundEnabled: true,
        };
      }
    }

    handleUpdatePreferences({
      ...preferences,
      favoriteTeams: newFavorites,
      notificationConfigs: newConfigs,
    });
  };

  // Helper to check if a match contains any favorite team
  const isFavoriteMatch = (match: FootballMatch) => {
    return isMatchFavorite(match, preferences.favoriteTeams);
  };

  // Helper to check if a team is favorite
  const isTeamFavorite = (teamName: string) => {
    return isTeamInFavorites(teamName, preferences.favoriteTeams);
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

  // Dynamic status calculator based on match date and start time in Brasília timezone (America/Sao_Paulo / UTC-3)
  const getEnrichedMatchStatus = (m: FootballMatch): 'agendado' | 'ao_vivo' | 'finalizado' => {
    if (m.date) {
      try {
        const parts = m.date.split('-');
        if (parts.length === 3) {
          const yr = parseInt(parts[0], 10);
          const mo = parseInt(parts[1], 10) - 1;
          const dy = parseInt(parts[2], 10);

          const timeClean = (m.time && m.time.includes(':')) ? m.time.trim() : '16:00';
          const [hrStr, mnStr] = timeClean.split(':');
          const hr = parseInt(hrStr, 10) || 16;
          const mn = parseInt(mnStr, 10) || 0;

          // Brasilia is UTC-3 -> Match start in UTC milliseconds:
          const matchStartUtcMs = Date.UTC(yr, mo, dy, hr + 3, mn);
          const matchEndUtcMs = matchStartUtcMs + (115 * 60 * 1000); // 115 min duration
          const nowMs = Date.now();

          if (nowMs < matchStartUtcMs) {
            return 'agendado';
          } else if (nowMs >= matchStartUtcMs && nowMs <= matchEndUtcMs) {
            return 'ao_vivo';
          } else {
            return 'finalizado';
          }
        }
      } catch (e) {
        return m.status || 'agendado';
      }
    }
    return m.status || 'agendado';
  };

  // Fetch games from Express API
  const fetchGames = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    const startTime = Date.now();

    try {
      const isLast5Days = currentDayNumber >= (daysInCurrentMonth - 4);
      const queryParams = new URLSearchParams();
      if (isRefresh) {
        queryParams.set('refresh', 'true');
        queryParams.set('scanToday', 'true');
      }
      if (isLast5Days) queryParams.set('advanceNextMonth', 'true');
      const qs = queryParams.toString();
      const response = await fetch(`/api/jogos${qs ? `?${qs}` : ''}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const result = await response.json();
      if (result && result.success && Array.isArray(result.data)) {
        // Enriquecer e validar o status em tempo real com base no fuso horário de Brasília (UTC-3)
        const enrichedData = result.data.map((m: FootballMatch) => ({
          ...m,
          status: getEnrichedMatchStatus(m)
        }));

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

  // Periodic real-time recalculation of match statuses every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setMatches(prev => prev.map(m => ({ ...m, status: getEnrichedMatchStatus(m) })));
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Helper to check if a match is CONMEBOL Libertadores
  const isLibertadoresMatch = (m: FootballMatch) => {
    return (m.division && m.division.toLowerCase().includes('libertadores')) || 
           ((m as any).competition && (m as any).competition.toLowerCase().includes('libertadores'));
  };

  // Helper to check if a match is CONMEBOL Sudamericana
  const isSulAmericanaMatch = (m: FootballMatch) => {
    return (m.division && (m.division.toLowerCase().includes('sul-americana') || m.division.toLowerCase().includes('sudamericana') || m.division.toLowerCase().includes('sul americana'))) || 
           ((m as any).competition && ((m as any).competition.toLowerCase().includes('sudamericana') || (m as any).competition.toLowerCase().includes('sul-americana')));
  };

  // Filter lists derived from active sport
  const sportMatches = matches.filter(m => {
    return (m.sport || 'futebol') === activeSport;
  });

  const rawBroadcasters: string[] = Array.from<string>(
    new Set(sportMatches.flatMap(m => m.broadcasters).filter((b): b is string => Boolean(b)))
  ).sort((a: string, b: string) => a.localeCompare(b));
  
  // Natural football division ordering with Copa Betano, Série A, Libertadores prominently featured
  const preferredDivisionOrder = [
    'Série A',
    'Copa Betano',
    'Copa do Brasil',
    'Série B',
    'Libertadores',
    'Sul-Americana',
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
  
  // Options for MultiSelect dropdowns
  const divisionOptions: MultiSelectOption[] = rawDivisions.map(div => ({
    value: div,
    label: div,
    count: sportMatches.filter(m => m.division === div).length,
  }));

  const broadcasterOptions: MultiSelectOption[] = rawBroadcasters.map(b => ({
    value: b,
    label: b,
    count: sportMatches.filter(m => m.broadcasters.includes(b)).length,
  }));

  const statusOptions: MultiSelectOption[] = [
    { value: 'ao_vivo', label: 'Ao Vivo Agora', count: sportMatches.filter(m => m.status === 'ao_vivo').length },
    { value: 'agendado', label: 'Agendados (Próximos)', count: sportMatches.filter(m => m.status === 'agendado').length },
    { value: 'finalizado', label: 'Finalizados (Encerrados)', count: sportMatches.filter(m => m.status === 'finalizado').length },
  ];
  
  // Apply filtering rules (supporting multiple selections per category)
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

    // Division filter (multi-select: matches if any selected division matches, or if empty = all)
    const matchesDivision = selectedDivisions.length === 0 || selectedDivisions.some(sel => {
      if (sel === match.division) return true;
      const selNorm = sel.toLowerCase();
      const matchNorm = (match.division || '').toLowerCase();
      if ((selNorm.includes('betano') || selNorm.includes('copa do brasil')) &&
          (matchNorm.includes('betano') || matchNorm.includes('copa do brasil'))) {
        return true;
      }
      return false;
    });

    // Broadcaster filter (multi-select: matches if any selected broadcaster is present in the match)
    const matchesBroadcaster = selectedBroadcasters.length === 0 || 
      match.broadcasters.some(b => selectedBroadcasters.includes(b));

    // Status filter (multi-select: if specific statuses selected, match them; else respect includeFinished toggle)
    let matchesStatus = false;
    if (selectedStatuses.length > 0) {
      matchesStatus = selectedStatuses.includes(match.status);
    } else {
      matchesStatus = includeFinished ? true : match.status !== 'finalizado';
    }

    // Day of Month filter (supports 'Tudo', exact 'YYYY-MM-DD', or numeric day)
    let matchesDay = true;
    if (selectedDay !== 'Tudo') {
      if (typeof selectedDay === 'string') {
        matchesDay = match.date === selectedDay;
      } else {
        const matchDay = parseInt(match.date.split('-')[2]);
        matchesDay = matchDay === selectedDay;
      }
    }

    // Favorite team filter
    const matchesFavoritesOnly = !onlyFavoritesFilter || isFavoriteMatch(match);

    return matchesSearch && matchesDivision && matchesBroadcaster && matchesStatus && matchesDay && matchesFavoritesOnly;
  });

  // Ordenar: 1º Jogos Ao Vivo, 2º Data Cronológica, 3º Horário, 4º Prioridade de Divisão
  const sortedMatches = [...filteredMatches].sort((a, b) => {
    // 1º: Ao Vivo no topo
    const statusPriority = { ao_vivo: 1, agendado: 2, finalizado: 3 };
    const prioA = statusPriority[a.status] || 2;
    const prioB = statusPriority[b.status] || 2;
    if (prioA !== prioB) return prioA - prioB;

    // 2º: Data cronológica ascendente
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }

    // 3º: Horário ascendente
    if (a.time !== b.time) {
      return a.time.localeCompare(b.time);
    }

    // 4º: Prioridade de Divisão
    const idxA = preferredDivisionOrder.indexOf(a.division);
    const idxB = preferredDivisionOrder.indexOf(b.division);
    if (idxA !== -1 && idxB !== -1 && idxA !== idxB) {
      return idxA - idxB;
    }

    return a.homeTeam.localeCompare(b.homeTeam);
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
    const name = (broadcaster || '').toLowerCase();
    if (name.includes('globo')) {
      return { bg: 'bg-blue-600/20 text-blue-300 border-blue-500/30', badge: 'bg-blue-500 text-white' };
    } else if (name.includes('sportv')) {
      return { bg: 'bg-sky-600/20 text-sky-300 border-sky-500/30', badge: 'bg-sky-500 text-white' };
    } else if (name.includes('premiere')) {
      return { bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30', badge: 'bg-amber-500 text-black' };
    } else if (name.includes('espn')) {
      return { bg: 'bg-red-600/20 text-red-300 border-red-500/30', badge: 'bg-red-600 text-white' };
    } else if (name.includes('disney')) {
      return { bg: 'bg-indigo-600/20 text-indigo-300 border-indigo-500/30', badge: 'bg-indigo-600 text-white' };
    } else if (name.includes('paramount')) {
      return { bg: 'bg-blue-700/20 text-blue-300 border-blue-600/30', badge: 'bg-blue-700 text-white' };
    } else if (name.includes('max') || name.includes('tnt') || name.includes('space') || name.includes('hbo')) {
      return { bg: 'bg-purple-600/20 text-purple-300 border-purple-500/30', badge: 'bg-purple-600 text-white' };
    } else if (name.includes('caze') || name.includes('youtube')) {
      return { bg: 'bg-red-600/20 text-red-300 border-red-500/30', badge: 'bg-red-600 text-white' };
    } else if (name.includes('prime') || name.includes('amazon')) {
      return { bg: 'bg-cyan-600/20 text-cyan-300 border-cyan-500/30', badge: 'bg-cyan-500 text-white' };
    } else if (name.includes('goat')) {
      return { bg: 'bg-emerald-600/20 text-emerald-300 border-emerald-500/30', badge: 'bg-emerald-500 text-white' };
    } else if (name.includes('sbt')) {
      return { bg: 'bg-teal-600/20 text-teal-300 border-teal-500/30', badge: 'bg-teal-600 text-white' };
    } else if (name.includes('band')) {
      return { bg: 'bg-orange-600/20 text-orange-300 border-orange-500/30', badge: 'bg-orange-500 text-white' };
    } else if (name.includes('brasil')) {
      return { bg: 'bg-yellow-600/20 text-yellow-300 border-yellow-500/30', badge: 'bg-yellow-600 text-black' };
    }
    return { bg: 'bg-emerald-600/20 text-emerald-300 border-emerald-500/30', badge: 'bg-emerald-500 text-white' };
  };

  // Direct official streaming portal URL resolver for each broadcaster
  const getBroadcasterUrl = (broadcaster: string, fallbackUrl?: string) => {
    const name = (broadcaster || '').toLowerCase().trim();
    if (!name || name.includes('confirmar')) return '';
    if (name.includes('disney')) return 'https://www.disneyplus.com/';
    if (name.includes('espn')) return 'https://www.espn.com.br/watch/';
    if (name.includes('paramount')) return 'https://www.paramountplus.com/';
    if (name.includes('max') || name.includes('tnt') || name.includes('space') || name.includes('hbo')) return 'https://www.max.com/';
    if (name.includes('sportv')) return 'https://globoplay.globo.com/canais/sportv/';
    if (name.includes('premiere')) return 'https://premiere.globo.com/';
    if (name.includes('globo')) return 'https://globoplay.globo.com/';
    if (name.includes('caze') || name.includes('cazetv')) return 'https://www.youtube.com/@CazeTV';
    if (name.includes('goat')) return 'https://www.youtube.com/@CanalGOATBR';
    if (name.includes('prime') || name.includes('amazon')) return 'https://www.primevideo.com/';
    if (name.includes('sbt')) return 'https://www.sbt.com.br/ao-vivo';
    if (name.includes('band')) return 'https://www.band.uol.com.br/';
    if (name.includes('record') || name.includes('playplus')) return 'https://www.playplus.com/';
    if (name.includes('cbf tv') || name.includes('cbftv') || name.includes('brasil')) return 'https://www.youtube.com/@brasil';
    if (name.includes('benja')) return 'https://www.youtube.com/@canaldobenja';
    if (name.includes('nbb')) return 'https://www.youtube.com/@NBB';
    if (name.includes('nba')) return 'https://www.nba.com/watch/league-pass-stream';
    if (name.includes('youtube')) return 'https://www.youtube.com/';
    return fallbackUrl || 'https://www.disneyplus.com/';
  };

  const getDivisionStyle = (div: string) => {
    const name = (div || '').toLowerCase();
    if (name.includes('libertadores')) {
      return 'bg-amber-950/80 text-amber-300 border border-amber-500/50';
    }
    if (name.includes('sul-americana') || name.includes('sudamericana') || name.includes('sul americana')) {
      return 'bg-blue-950/80 text-blue-300 border border-blue-500/50';
    }
    if (name.includes('sub-17') || name.includes('sub17') || name.includes('sub-15') || name.includes('sub15') || name.includes('sub-20') || name.includes('sub20') || name.includes('sub-23') || name.includes('sub23')) {
      return 'bg-cyan-950/80 text-cyan-300 border border-cyan-700/40';
    }
    if (name.includes('feminino') || name.includes('fem')) {
      return 'bg-rose-950/80 text-rose-300 border border-rose-700/40';
    }
    if (name.includes('copa betano') || name.includes('betano')) {
      return 'bg-amber-950/80 text-amber-300 border border-amber-500/50';
    }
    if (name.includes('copa do brasil')) {
      return 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40';
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
    return 'bg-zinc-900/80 text-zinc-300 border border-zinc-700/40';
  };

  const isLight = a11ySettings.theme === 'light';
  const isHighContrast = a11ySettings.highContrast;
  const fontSizeClass = a11ySettings.fontSize === 'extra-large' ? 'font-size-extra-large' : a11ySettings.fontSize === 'large' ? 'font-size-large' : '';

  return (
    <div className={`min-h-screen font-sans flex flex-col overflow-x-hidden transition-colors duration-200 selection:bg-yellow-400 selection:text-[#020704] ${
      isLight ? 'bg-slate-100 text-slate-900 light' : 'bg-[#020704] text-slate-100 dark'
    } ${isHighContrast ? 'high-contrast' : ''} ${fontSizeClass}`}>
      
      {/* FULLSCREEN PRELOADER (1.5s) */}
      <Preloader isLoading={loading} />

      {/* FLOATING AUDIO READER BAR (QUANDO HÁ LEITURA DE VOZ EM EXECUÇÃO) */}
      <AnimatePresence>
        {isSpeaking && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`sticky top-0 z-50 px-4 py-2.5 shadow-xl flex items-center justify-between gap-3 border-b ${
              isLight 
                ? 'bg-amber-100 border-amber-300 text-amber-950' 
                : 'bg-emerald-950/95 border-emerald-500/70 text-emerald-100 backdrop-blur-md'
            }`}
          >
            <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex items-center gap-1 shrink-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <Volume2 className="w-5 h-5 text-seagreen shrink-0 animate-pulse" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-500">
                    Leitor de Voz para Cegos & Acessibilidade:
                  </span>
                  <p className="text-xs font-semibold truncate max-w-[280px] sm:max-w-md md:max-w-xl">
                    {currentSpokenText || 'Narrando partidas brasileiras...'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => stopSpeech()}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold bg-red-600 hover:bg-red-500 text-white rounded-md shadow-sm cursor-pointer uppercase tracking-wider transition-all"
                  title="Parar leitura em voz alta (Alt+P)"
                >
                  <Square className="w-3 h-3 fill-current" />
                  <span>Parar</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER SECTION */}
      <header className={`border-b py-4 sm:py-5 px-4 sm:px-6 md:px-8 shrink-0 shadow-lg transition-colors ${
        isLight ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50' : 'bg-[#05140d] border-green-950/80 text-white'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
          <div className="flex items-center gap-3 sm:gap-4 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 sm:w-12 sm:h-12 bg-white text-slate-900 rounded-full flex items-center justify-center shadow-md border-2 border-emerald-500/30 relative overflow-hidden shrink-0">
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
                  <h1 id="app-title" className={`text-lg sm:text-xl md:text-2xl font-display font-bold tracking-tight uppercase ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}>
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
                <p className={`text-xs font-mono tracking-wider mt-0.5 ${isLight ? 'text-emerald-700 font-semibold' : 'text-green-400'}`}>
                  ENCONTRE SEU JOGO
                </p>
              </div>
            </div>

            {/* Mobile Header Quick Actions */}
            <div className="flex items-center gap-1.5 md:hidden">
              <button
                onClick={handleToggleTheme}
                title={isLight ? 'Alternar para Modo Escuro (Alt+T)' : 'Alternar para Modo Claro (Alt+T)'}
                aria-label={isLight ? 'Alternar para Modo Escuro' : 'Alternar para Modo Claro'}
                className={`p-2 rounded-lg border transition-all cursor-pointer ${
                  isLight 
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700' 
                    : 'bg-zinc-900 hover:bg-zinc-800 border-green-950 text-amber-300'
                }`}
              >
                {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </button>

              <button
                onClick={() => setShowA11yModal(true)}
                title="Acessibilidade para Deficientes Visuais & Configurações (Alt+A)"
                aria-label="Abrir menu de acessibilidade e leitor de voz"
                className={`p-2 rounded-lg border transition-all cursor-pointer ${
                  isLight
                    ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-800'
                    : 'bg-emerald-950/60 hover:bg-emerald-900/60 border-emerald-600/50 text-seagreen'
                }`}
              >
                <UniversalAccessibilityIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Desktop & Tablet Header Controls */}
          <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto justify-end flex-wrap">
            
            {/* Quick Read Today's Games button */}
            <button
              type="button"
              onClick={() => {
                if (isSpeaking) {
                  stopSpeech();
                } else {
                  if (a11ySettings.soundEffects) playAudioCue('select');
                  speakTodayScheduleSummary(sortedMatches, a11ySettings.speechRate);
                }
              }}
              title={isSpeaking ? 'Parar leitura em voz alta (Alt+P)' : 'Ouvir resumo dos jogos de hoje por voz (Alt+O)'}
              aria-label={isSpeaking ? 'Parar leitura de voz' : 'Ouvir resumo das transmissões de hoje'}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg border text-xs font-bold transition-all duration-200 cursor-pointer uppercase tracking-wider ${
                isSpeaking
                  ? 'bg-red-600 hover:bg-red-500 text-white border-red-400 animate-pulse'
                  : isLight
                    ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-900 shadow-sm'
                    : 'bg-emerald-950/70 hover:bg-emerald-900/80 border-emerald-600/60 text-seagreen hover:text-white'
              }`}
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="h-4 w-4" />
                  <span className="hidden sm:inline">Parar Voz</span>
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Ouvir Rodada</span>
                </>
              )}
            </button>

            {/* Mode Switcher: Claro / Escuro */}
            <button
              type="button"
              onClick={handleToggleTheme}
              title={isLight ? 'Mudar para Modo Escuro (Alt+T)' : 'Mudar para Modo Claro (Alt+T)'}
              aria-label={isLight ? 'Ativar Modo Escuro' : 'Ativar Modo Claro'}
              className={`hidden md:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg border text-xs font-bold transition-all duration-200 cursor-pointer uppercase tracking-wider ${
                isLight 
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800 shadow-sm' 
                  : 'bg-zinc-900/80 hover:bg-zinc-800 border-green-950 text-amber-300 hover:text-white'
              }`}
            >
              {isLight ? (
                <>
                  <Moon className="h-4 w-4 text-indigo-600" />
                  <span>Modo Escuro</span>
                </>
              ) : (
                <>
                  <Sun className="h-4 w-4 text-amber-400" />
                  <span>Modo Claro</span>
                </>
              )}
            </button>

            {/* Accessibility Center button */}
            <button
              type="button"
              onClick={() => setShowA11yModal(true)}
              title="Central de Acessibilidade para Cegos, Contraste e Fonte (Alt+A)"
              aria-label="Central de acessibilidade e leitor de voz"
              className={`hidden md:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg border text-xs font-bold transition-all duration-200 cursor-pointer uppercase tracking-wider ${
                isLight
                  ? 'bg-blue-50 hover:bg-blue-100 border-blue-300 text-blue-900 shadow-sm'
                  : 'bg-blue-950/40 hover:bg-blue-900/60 border-blue-500/50 text-blue-300 hover:text-white'
              }`}
            >
              <UniversalAccessibilityIcon className="h-4 w-4 text-blue-400" />
              <span>Acessibilidade</span>
            </button>

            {/* Favorite Teams and Notifications Bell */}
            <div className="relative group">
              <button
                onClick={() => setShowPreferencesModal(true)}
                title="Receba a notificação dos times favoritos e divisões desejadas."
                aria-label="Receba a notificação dos times favoritos e divisões desejadas."
                className={`relative p-2 sm:px-2.5 sm:py-2 rounded-lg border transition-all duration-200 cursor-pointer flex items-center justify-center ${
                  isLight
                    ? 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-900'
                    : 'bg-amber-950/40 hover:bg-amber-900/60 border-amber-500/50 hover:border-amber-400 text-amber-300 hover:text-white'
                }`}
              >
                <div className="relative flex items-center justify-center w-5 h-5">
                  <Bell className="h-5 w-5 text-amber-400 group-hover:text-amber-300 transition-colors" />
                  <Star className="h-2 w-2 fill-amber-400 text-amber-400 absolute top-1.5" />
                </div>

                {preferences.favoriteTeams.length > 0 && (
                  <span className="absolute -top-1 -right-1 text-[9px] min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-black font-mono font-black flex items-center justify-center">
                    {preferences.favoriteTeams.length}
                  </span>
                )}
              </button>

              {/* Floating description on mouse hover */}
              <div className="absolute right-0 top-full mt-2 hidden group-hover:flex flex-col items-end z-50 pointer-events-none whitespace-nowrap">
                <div className={`w-2 h-2 rotate-45 border-t border-l mr-3 -mb-1 ${
                  isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-amber-500/40'
                }`}></div>
                <div className={`px-3 py-1.5 rounded-md text-[11px] font-medium shadow-xl backdrop-blur-md ${
                  isLight ? 'bg-white border border-slate-300 text-slate-800' : 'bg-slate-900/95 border border-amber-500/40 text-amber-200'
                }`}>
                  Receba alertas dos times favoritos no celular & smartwatch.
                </div>
              </div>
            </div>

            <div className={`px-3.5 py-2 border rounded items-center gap-2 hidden md:flex ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#020704]/60 border-green-950/60'
            }`}>
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              <span className={`text-xs font-semibold uppercase tracking-wider ${
                isLight ? 'text-slate-800' : 'text-green-300'
              }`}>
                {liveCount} Ao Vivo
              </span>
            </div>

            <button 
              onClick={() => fetchGames(true)} 
              disabled={refreshing}
              className={`flex items-center gap-2 px-3 py-2 rounded border text-xs font-bold transition-all duration-200 cursor-pointer uppercase tracking-wider ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800 hover:text-black'
                  : 'bg-green-900/60 border-green-800 hover:border-seagreen hover:text-white text-green-300'
              }`}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{refreshing ? 'Buscando...' : 'Recarregar'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* SPORTS MODALITY TAB SELECTOR */}
      <nav className="bg-[#031109] border-b border-green-950 px-6 md:px-8 py-3 shrink-0">
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
                  setSelectedDivisions([]);
                  setSelectedBroadcasters([]);
                  setSelectedStatuses([]);
                }}
                className={`px-3.5 py-1.5 text-xs font-extrabold rounded-lg shrink-0 transition-all cursor-pointer flex items-center gap-2 uppercase tracking-wider ${
                  isActive
                    ? 'bg-seagreen text-white font-black'
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
                    ? 'bg-amber-500 text-black font-black'
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

              {/* All Divisions Button */}
              <button
                type="button"
                onClick={() => {
                  setSelectedDivisions([]);
                  if (onlyFavoritesFilter) setOnlyFavoritesFilter(false);
                }}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md shrink-0 transition-all cursor-pointer flex items-center gap-1.5 uppercase tracking-wider ${
                  selectedDivisions.length === 0 && !onlyFavoritesFilter
                    ? 'bg-seagreen text-white font-black'
                    : 'bg-[#092215] text-slate-300 border border-green-950 hover:border-green-800 hover:text-white'
                }`}
              >
                <span>Todas Divisões</span>
                <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                  selectedDivisions.length === 0 && !onlyFavoritesFilter
                    ? 'bg-black/60 text-green-300 font-bold'
                    : 'bg-black/40 text-green-400'
                }`}>
                  {sportMatches.length}
                </span>
              </button>

              {rawDivisions.map(div => {
                const isSelected = selectedDivisions.includes(div);
                const count = sportMatches.filter(m => m.division === div).length;
                const isLibertadores = div.toLowerCase().includes('libertadores');

                return (
                  <button
                    key={div}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedDivisions(selectedDivisions.filter(d => d !== div));
                      } else {
                        setSelectedDivisions([...selectedDivisions, div]);
                      }
                      if (onlyFavoritesFilter) setOnlyFavoritesFilter(false);
                    }}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-md shrink-0 transition-all cursor-pointer flex items-center gap-1.5 uppercase tracking-wider ${
                      isSelected
                        ? isLibertadores
                          ? 'bg-amber-500 text-black font-black'
                          : 'bg-seagreen text-white font-black'
                        : isLibertadores
                          ? 'bg-amber-950/40 text-amber-300 border border-amber-500/30 hover:bg-amber-900/50 hover:text-white'
                          : 'bg-[#092215] text-slate-300 border border-green-950 hover:border-green-800 hover:text-white'
                    }`}
                  >
                    {isLibertadores && <span>🏆</span>}
                    <span>{div}</span>
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
              <span>Mais Filtros e Busca Multi-Seleção</span>
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
                {selectedDivisions.length > 0 && (
                  <span className="bg-[#092215] px-2 py-0.5 rounded border border-green-900/30">
                    {selectedDivisions.length === 1 ? selectedDivisions[0] : `${selectedDivisions.length} Divisões`}
                  </span>
                )}
                {selectedBroadcasters.length > 0 && (
                  <span className="bg-[#092215] px-2 py-0.5 rounded border border-green-900/30">
                    {selectedBroadcasters.length === 1 ? selectedBroadcasters[0] : `${selectedBroadcasters.length} Canais`}
                  </span>
                )}
                {selectedStatuses.length > 0 && (
                  <span className="bg-[#092215] px-2 py-0.5 rounded border border-green-900/30">
                    {selectedStatuses.length === 1 
                      ? (selectedStatuses[0] === 'ao_vivo' ? 'Ao Vivo' : selectedStatuses[0] === 'agendado' ? 'Agendados' : 'Finalizados')
                      : `${selectedStatuses.length} Situações`}
                  </span>
                )}
                {selectedDay !== 'Tudo' && (
                  <span className="bg-[#092215] px-2 py-0.5 rounded border border-green-900/30">
                    {typeof selectedDay === 'string'
                      ? `Data ${selectedDay.split('-').slice(1).reverse().join('/')}`
                      : `Dia ${selectedDay}`}
                  </span>
                )}
                {(searchTerm || selectedDivisions.length > 0 || selectedBroadcasters.length > 0 || selectedStatuses.length > 0 || selectedDay !== 'Tudo') && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchTerm('');
                      setSelectedDivisions([]);
                      setSelectedBroadcasters([]);
                      setSelectedStatuses([]);
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
                  
                  {/* Input Multi-Select Filters Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
                    
                    {/* Search */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-seagreen uppercase tracking-widest shrink-0">Busca</span>
                      <div className="relative w-full">
                        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-green-600" />
                        <input 
                          type="text" 
                          value={searchTerm}
                          onChange={e => setSearchTerm(e.target.value)}
                          placeholder="Time, estádio..."
                          className="w-full bg-[#092215] border border-green-950/60 text-xs rounded pl-8 pr-3 py-2 text-white placeholder:text-green-700 focus:ring-1 focus:ring-seagreen outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Multi-Select Division */}
                    <MultiSelectFilter
                      id="filter-divisions"
                      label="Divisões / Torneios"
                      options={divisionOptions}
                      selectedValues={selectedDivisions}
                      onChange={setSelectedDivisions}
                      allLabel="Todas as Divisões"
                    />

                    {/* Multi-Select Broadcaster */}
                    <MultiSelectFilter
                      id="filter-broadcasters"
                      label="Plataformas / Canais"
                      options={broadcasterOptions}
                      selectedValues={selectedBroadcasters}
                      onChange={setSelectedBroadcasters}
                      allLabel="Todas as Plataformas"
                      icon={<Tv className="h-3 w-3 text-seagreen" />}
                    />

                    {/* Multi-Select Match State */}
                    <MultiSelectFilter
                      id="filter-status"
                      label="Situação da Partida"
                      options={statusOptions}
                      selectedValues={selectedStatuses}
                      onChange={setSelectedStatuses}
                      allLabel="Todas as Situações"
                    />

                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 self-end lg:self-auto pt-4 lg:pt-0">
                    <button 
                      type="button"
                      onClick={() => setIncludeFinished(!includeFinished)}
                      className={`px-3 py-2 rounded text-xs font-bold transition-all uppercase tracking-wider flex items-center gap-2 border cursor-pointer ${
                        includeFinished
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/80'
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
                        setSelectedDivisions([]);
                        setSelectedBroadcasters([]);
                        setSelectedStatuses([]);
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
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-seagreen" /> Filtro por Data (
                        {currentMonthName}{isExtendedMonthPeriod ? ` & ${nextMonthName}` : ''} {currentYearNumber}
                      )
                    </span>
                    {isExtendedMonthPeriod && (
                      <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        Próximo mês ({nextMonthName}) adiantado
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-green-800">
                    <button
                      onClick={() => setSelectedDay('Tudo')}
                      className={`px-3 py-1 text-[10px] font-bold uppercase rounded tracking-wider shrink-0 transition-all cursor-pointer ${
                        selectedDay === 'Tudo'
                          ? 'bg-seagreen text-white border border-seagreen font-bold'
                          : 'bg-[#092215] text-green-300 hover:text-white'
                      }`}
                    >
                      {isExtendedMonthPeriod ? 'Todos os Jogos' : 'Mês Inteiro'}
                    </button>

                    <button
                      onClick={() => {
                        const todayIso = `${currentYearNumber}-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(currentDayNumber).padStart(2, '0')}`;
                        setSelectedDay(todayIso);
                      }}
                      className={`px-3 py-1 text-[10px] font-bold uppercase rounded tracking-wider shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
                        selectedDay === currentDayNumber || selectedDay === `${currentYearNumber}-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(currentDayNumber).padStart(2, '0')}`
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
                      const dateKey = `${currentYearNumber}-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      const isSelected = selectedDay === dateKey || selectedDay === day;
                      const isToday = day === currentDayNumber;
                      const hasGames = matches.some(m => m.date === dateKey);

                      return (
                        <button
                          key={dateKey}
                          ref={isToday ? todayButtonRef : null}
                          onClick={() => setSelectedDay(dateKey)}
                          className={`px-2.5 py-1 text-[10px] font-bold rounded shrink-0 transition-all cursor-pointer flex flex-col items-center justify-center min-w-[38px] relative ${
                            isSelected
                              ? 'bg-seagreen text-white font-extrabold border border-seagreen shadow-md'
                              : isToday
                                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/60 hover:bg-emerald-900/50'
                                : hasGames
                                  ? 'bg-[#092215] text-green-300 hover:text-white border border-green-800/30'
                                  : 'bg-[#06180e] text-green-400/50 hover:text-green-300'
                          }`}
                        >
                          <span className="text-[8px] opacity-75 uppercase">{dayLabel}</span>
                          <span className="text-xs font-bold leading-none mt-0.5">{day}</span>
                          {isToday && !isSelected && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 border border-black" title="Hoje"></span>
                          )}
                          {!isToday && hasGames && !isSelected && (
                            <span className="w-1 h-1 rounded-full bg-emerald-400 mt-0.5"></span>
                          )}
                        </button>
                      );
                    })}

                    {/* SEPARADOR E DIAS DO PRÓXIMO MÊS */}
                    {isExtendedMonthPeriod && (
                      <>
                        <div className="flex items-center gap-1 shrink-0 px-2 py-0.5 bg-emerald-950/70 border border-emerald-500/30 rounded">
                          <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-300">
                            {nextMonthName}
                          </span>
                        </div>

                        {Array.from({ length: daysInNextMonth }, (_, i) => i + 1).map(day => {
                          const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
                          const dObj = new Date(nextMonthYear, nextMonthIndex, day);
                          const dayLabel = daysOfWeek[dObj.getDay()];
                          const dateKey = `${nextMonthYear}-${String(nextMonthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                          const isSelected = selectedDay === dateKey;
                          const hasGames = matches.some(m => m.date === dateKey);

                          return (
                            <button
                              key={dateKey}
                              onClick={() => setSelectedDay(dateKey)}
                              className={`px-2.5 py-1 text-[10px] font-bold rounded shrink-0 transition-all cursor-pointer flex flex-col items-center justify-center min-w-[38px] relative ${
                                isSelected
                                  ? 'bg-seagreen text-white font-extrabold border border-seagreen shadow-md'
                                  : hasGames
                                    ? 'bg-[#0c2e1d] text-emerald-300 border border-emerald-600/40 hover:bg-emerald-900/40 hover:text-white'
                                    : 'bg-[#06180e] text-green-400/50 hover:text-green-300'
                              }`}
                              title={`${day} de ${nextMonthName}`}
                            >
                              <span className="text-[8px] opacity-75 uppercase">{dayLabel}</span>
                              <span className="text-xs font-bold leading-none mt-0.5">{day}</span>
                              {hasGames && !isSelected && (
                                <span className="w-1 h-1 rounded-full bg-emerald-400 mt-0.5"></span>
                              )}
                            </button>
                          );
                        })}
                      </>
                    )}
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
            {activeSport === 'futebol' && selectedDivisions.some(d => d.toLowerCase().includes('libertadores')) && (
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

            {/* CONMEBOL Sudamericana Official Tournament Banner when Sul-Americana is selected */}
            {activeSport === 'futebol' && selectedDivisions.some(d => d.toLowerCase().includes('sul-americana') || d.toLowerCase().includes('sudamericana') || d.toLowerCase().includes('sul americana')) && (
              <div className="bg-gradient-to-r from-blue-950/60 via-[#0d1e18] to-blue-950/60 border border-blue-500/40 rounded-xl p-4 md:p-5 shadow-lg relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/50 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                      🛡️
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-base md:text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                          CONMEBOL Sudamericana 2026
                        </h2>
                        <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase rounded bg-blue-500 text-white">
                          Fase Final
                        </span>
                      </div>
                      <p className="text-xs text-blue-200/80 mt-1 max-w-2xl leading-relaxed">
                        Acompanhe todos os confrontos da Copa Sul-Americana com dados diretos do portal oficial da CONMEBOL e transmissões no SBT, ESPN, Disney+ e Paramount+.
                      </p>
                    </div>
                  </div>

                  <a 
                    href="https://gol.conmebol.com/sudamericana/pt-br" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="shrink-0 px-3.5 py-2 rounded-lg bg-blue-500/20 border border-blue-500/50 hover:bg-blue-500/30 text-blue-300 text-xs font-bold transition-all flex items-center justify-center gap-2 group"
                  >
                    <span>Portal Oficial Sudamericana</span>
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
            {onlyFavoritesFilter ? (
              <>
                <Star className="h-10 w-10 text-amber-400 mx-auto fill-amber-400/20" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Nenhuma Partida para Seus Times Favoritos
                </h3>
                <p className="text-xs text-green-400/80 leading-relaxed">
                  {preferences.favoriteTeams.length === 0
                    ? 'Você não possui nenhum clube favoritado no momento.'
                    : `Não há transmissões agendadas para seus times favoritos (${preferences.favoriteTeams.join(', ')}) no filtro selecionado.`}
                </p>
                <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setOnlyFavoritesFilter(false)}
                    className="px-4 py-2 bg-seagreen text-white text-xs font-bold rounded hover:bg-seagreen-solid hover:text-black transition-all cursor-pointer uppercase tracking-wider"
                  >
                    Ver Todas as Partidas
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPreferencesModal(true)}
                    className="px-4 py-2 bg-amber-950/50 text-amber-300 border border-amber-500/40 text-xs font-bold rounded hover:bg-amber-900/60 transition-all cursor-pointer uppercase tracking-wider"
                  >
                    Gerenciar Favoritos
                  </button>
                </div>
              </>
            ) : (
              <>
                <Info className="h-10 w-10 text-seagreen mx-auto" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Nenhum Evento Encontrado</h3>
                <p className="text-xs text-green-400/80 leading-relaxed">
                  Não existem transmissões agendadas nesta modalidade para {
                    selectedDay === 'Tudo'
                      ? 'a data ou filtros selecionados'
                      : selectedDay === currentDayNumber || selectedDay === `${currentYearNumber}-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(currentDayNumber).padStart(2, '0')}`
                      ? 'hoje'
                      : typeof selectedDay === 'string'
                      ? `o dia ${selectedDay.split('-').slice(1).reverse().join('/')}`
                      : `o dia ${String(selectedDay).padStart(2, '0')}/${String(currentMonthIndex + 1).padStart(2, '0')}`
                  }. Selecione outro dia no calendário ou resete os filtros.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedDivisions([]);
                    setSelectedBroadcasters([]);
                    setSelectedStatuses([]);
                    setSelectedDay('Tudo');
                    setIncludeFinished(false);
                    setOnlyFavoritesFilter(false);
                  }}
                  className="px-4 py-2 bg-seagreen text-white text-xs font-bold rounded hover:bg-seagreen-solid hover:text-black transition-all cursor-pointer uppercase tracking-wider"
                >
                  Resetar Filtros
                </button>
              </>
            )}
          </div>
        ) : (
          /* TABLE GRID HEADER FOR LAPTOPS */
          <div className="space-y-3">
            
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

                  const isCurrentlySpeakingThisMatch = isSpeaking && (
                    currentSpokenText.toLowerCase().includes(match.homeTeam.toLowerCase()) || 
                    currentSpokenText.toLowerCase().includes(match.awayTeam.toLowerCase())
                  );

                  const mainElement = (
                    <motion.div
                      key={match.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => {
                        setSelectedMatch(match);
                        if (a11ySettings.autoSpeechOnFocus) {
                          handleSpeakSingleMatch(match);
                        }
                      }}
                      className={`group flex flex-col rounded-lg p-3 lg:p-3 transition-all duration-200 cursor-pointer relative shadow-[0_2px_8px_rgba(0,0,0,0.15)] hover:shadow-md gap-2.5 ${
                        isLight
                          ? hasFavorite
                            ? 'bg-amber-50/90 border-2 border-amber-400 text-slate-900 shadow-amber-100/50 hover:bg-amber-100'
                            : 'bg-white border border-slate-200 text-slate-900 shadow-sm hover:border-emerald-500 hover:shadow-md hover:bg-emerald-50/20'
                          : hasFavorite
                            ? 'bg-amber-950/15 border-2 border-amber-500/60 hover:border-amber-400 hover:bg-amber-950/25 shadow-amber-950/30 text-white'
                            : 'bg-[oklch(85.2%_0.199_91.936)]/[0.04] border border-[oklch(85.2%_0.199_91.936)]/35 hover:bg-[color-mix(in_oklab,oklch(0.77_0.16_199.2)_55%,transparent)] hover:border-[oklch(0.77_0.16_199.2)]/80 text-white'
                      } ${isCurrentlySpeakingThisMatch ? 'ring-2 ring-emerald-500 shadow-lg' : ''}`}
                    >
                      {/* Decorative live bar */}
                      {isLive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500 rounded-l"></div>
                      )}

                      {/* Top Meta Header: 2 Colunas (Coluna 1: Data e Hora | Coluna 2: Dia da Semana e Divisão + Voz) */}
                      <div className={`flex items-center justify-between w-full border-b pb-1.5 text-left gap-2 ${
                        isLight ? 'border-slate-200' : 'border-green-900/20'
                      }`}>
                        {/* Coluna 1: Data e Hora */}
                        <div className="flex items-center gap-1.5 shrink-0 min-w-0">
                          <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-tight flex items-center gap-1.5 ${
                            isLight ? 'text-slate-900' : 'text-white'
                          }`} title={`${dateInfo.shortDate} às ${match.time}`}>
                            <Calendar className="h-3 w-3 text-seagreen shrink-0 hidden xs:inline" />
                            <span>{dateInfo.shortDate}</span>
                            <span className="text-seagreen font-mono font-bold opacity-80">•</span>
                            <span className={`font-mono font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-300'}`}>{match.time}</span>
                          </span>
                        </div>

                        {/* Coluna 2: Dia da Semana, Divisão e Leitor de Voz */}
                        <div className="flex items-center gap-2 justify-end shrink-0 min-w-0">
                          <span className={`text-[9px] sm:text-[10px] font-mono uppercase tracking-wider shrink-0 ${
                            isLight ? 'text-slate-600 font-semibold' : 'text-emerald-300/90'
                          }`} title={isLive ? 'Ao Vivo' : dateInfo.dayOfWeek}>
                            {isLive ? (
                              <span className="text-red-500 font-bold animate-pulse flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                                AO VIVO
                              </span>
                            ) : (
                              dateInfo.dayOfWeek
                            )}
                          </span>

                          <div className="flex items-center gap-1 shrink-0">
                            <span 
                              className={`px-1.5 py-0.5 text-[8px] sm:text-[9px] font-bold rounded uppercase tracking-wider truncate block max-w-[130px] sm:max-w-[200px] ${getDivisionStyle(match.division)}`}
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

                            {/* Voice Reader Single Match Button */}
                            <button
                              type="button"
                              onClick={(e) => handleSpeakSingleMatch(match, e)}
                              className={`p-1 rounded transition-all cursor-pointer shrink-0 ${
                                isCurrentlySpeakingThisMatch
                                  ? 'text-seagreen bg-emerald-500/20 animate-pulse'
                                  : isLight
                                    ? 'text-slate-400 hover:text-emerald-700 hover:bg-emerald-100'
                                    : 'text-slate-500 hover:text-seagreen hover:bg-green-950/60'
                              }`}
                              title="Ouvir transmissão desta partida em voz alta"
                              aria-label={`Ouvir detalhes da partida ${match.homeTeam} contra ${match.awayTeam}`}
                            >
                              <Volume2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Main Matchup Row */}
                      <div className="flex items-center justify-between gap-2 sm:gap-3 pt-0.5">
                        {/* Team matchup */}
                        <div className={`flex-1 flex items-center justify-between md:justify-center gap-1.5 sm:gap-3 p-2 md:p-0 rounded-lg min-w-0 ${
                          isLight ? 'bg-slate-50 md:bg-transparent' : 'bg-[#020704]/30 md:bg-transparent'
                        }`}>
                          
                          {/* Home team */}
                          <div className="flex items-center gap-1 sm:gap-2 w-[45%] md:w-5/12 min-w-0 justify-end">
                            <button
                              type="button"
                              onClick={(e) => handleToggleFavoriteTeam(match.homeTeam, e)}
                              className={`p-1 rounded transition-all cursor-pointer shrink-0 ${
                                isHomeFav 
                                  ? 'text-amber-500 hover:text-amber-400 scale-110' 
                                  : 'text-slate-400 hover:text-amber-400 opacity-40 hover:opacity-100 hover:scale-110'
                              }`}
                              title={isHomeFav ? `Remover ${match.homeTeam} dos favoritos` : `Favoritar ${match.homeTeam} e receber alertas`}
                            >
                              <Star className={`h-3.5 w-3.5 ${isHomeFav ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
                            </button>
                            <span className={`text-[11px] sm:text-xs md:text-sm font-bold text-right line-clamp-2 break-words leading-tight min-w-0 ${
                              isHomeFav 
                                ? 'text-amber-500 font-extrabold' 
                                : isLight ? 'text-slate-900' : 'text-white'
                            }`}>
                              {match.homeTeam}
                            </span>
                            <TeamLogo teamName={match.homeTeam} logoUrl={match.homeTeamLogo} size="md" />
                          </div>

                          {/* Versus state */}
                          <div className="flex flex-col items-center justify-center shrink-0 px-1">
                            {isFinished ? (
                              <div className="flex flex-col items-center justify-center gap-1">
                                {(match.score || (match.homeScore !== undefined && match.homeScore !== null && match.awayScore !== undefined && match.awayScore !== null)) ? (
                                  <div className="flex flex-col items-center">
                                    <div className="flex items-center gap-1 px-2 py-0.5 bg-black/70 border border-emerald-500/50 rounded shadow-sm">
                                      <span className="text-xs sm:text-sm font-black font-mono text-white leading-none">
                                        {match.score?.home ?? match.homeScore}
                                      </span>
                                      <span className="text-[10px] font-bold text-emerald-400 leading-none">×</span>
                                      <span className="text-xs sm:text-sm font-black font-mono text-white leading-none">
                                        {match.score?.away ?? match.awayScore}
                                      </span>
                                    </div>
                                    {match.score?.penalties && (
                                      <span className="text-[7.5px] font-mono font-bold text-amber-300 tracking-tight mt-0.5">
                                        ({match.score.penalties.home}-{match.score.penalties.away} pên.)
                                      </span>
                                    )}
                                  </div>
                                ) : null}
                                <span className="text-[8px] font-mono font-bold text-slate-400 bg-black/10 px-1.5 py-0.5 rounded border border-black/10 uppercase tracking-wider">
                                  FINALIZADO
                                </span>
                              </div>
                            ) : isLive ? (
                              <span className="text-[9px] font-mono font-extrabold text-red-500 animate-pulse bg-red-950/20 px-1.5 py-0.5 rounded border border-red-500/40 uppercase tracking-wider flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></span>
                                AO VIVO
                              </span>
                            ) : (
                              <span className="text-seagreen text-[10px] font-black italic uppercase tracking-tighter bg-green-950/20 px-1.5 py-0.5 rounded border border-green-900/20">VS</span>
                            )}
                          </div>

                          {/* Away team */}
                          <div className="flex items-center gap-1 sm:gap-2 w-[45%] md:w-5/12 min-w-0 justify-start">
                            <TeamLogo teamName={match.awayTeam} logoUrl={match.awayTeamLogo} size="md" />
                            <span className={`text-[11px] sm:text-xs md:text-sm font-bold text-left line-clamp-2 break-words leading-tight min-w-0 ${
                              isAwayFav 
                                ? 'text-amber-500 font-extrabold' 
                                : isLight ? 'text-slate-900' : 'text-white'
                            }`}>
                              {match.awayTeam}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleToggleFavoriteTeam(match.awayTeam, e)}
                              className={`p-1 rounded transition-all cursor-pointer shrink-0 ${
                                isAwayFav 
                                  ? 'text-amber-500 hover:text-amber-400 scale-110' 
                                  : 'text-slate-400 hover:text-amber-400 opacity-40 hover:opacity-100 hover:scale-110'
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
                            <span className="inline-block px-3 py-1 bg-green-600/20 text-green-500 text-[10px] font-bold rounded border border-green-600/40 uppercase tracking-wider group-hover:bg-green-600 group-hover:text-black transition-all">
                              Assistir
                            </span>
                          ) : isFinished ? (
                            <span className={`inline-block px-3 py-1 text-[10px] font-bold rounded border uppercase tracking-wider ${
                              isLight ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-white/5 text-slate-500 border-white/15'
                            }`}>
                              Detalhes
                            </span>
                          ) : hasFavorite ? (
                            <span className="inline-block px-3 py-1 bg-amber-500/20 text-amber-500 group-hover:bg-amber-500 group-hover:text-black group-hover:border-amber-400 text-[10px] font-bold rounded border border-amber-500/40 transition-all uppercase tracking-wider">
                              Ver Detalhes
                            </span>
                          ) : (
                            <span className={`inline-block px-3 py-1 text-[10px] font-bold rounded border transition-all uppercase tracking-wider ${
                              isLight 
                                ? 'bg-slate-100 text-slate-700 border-slate-300 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600' 
                                : 'bg-white/5 text-[oklch(85.2%_0.199_91.936)] group-hover:bg-[color-mix(in_oklab,oklch(0.77_0.16_199.2)_55%,transparent)] group-hover:text-cyan-100 group-hover:border-[oklch(0.77_0.16_199.2)] border-[oklch(85.2%_0.199_91.936)]/30'
                            }`}>
                              Transmitir
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Linha com todos os canais onde será transmitido */}
                      <div className={`flex items-center gap-1.5 flex-wrap pt-1.5 border-t ${
                        isLight ? 'border-slate-200' : 'border-green-900/20'
                      }`}>
                        <span className={`text-[8px] sm:text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 shrink-0 ${
                          isLight ? 'text-emerald-700' : 'text-green-500/80'
                        }`}>
                          <Tv className="h-2.5 w-2.5 text-seagreen" />
                          <span>Onde Assistir:</span>
                        </span>
                        <div className="flex items-center gap-1 flex-wrap flex-1 min-w-0">
                          {match.broadcasters && match.broadcasters.length > 0 ? (
                            match.broadcasters.map((b, i) => {
                              const style = getBroadcasterStyle(b);
                              return (
                                <span 
                                  key={i} 
                                  className={`px-1.5 py-0.5 rounded flex items-center justify-center text-[8px] font-bold uppercase tracking-wider border shrink-0 ${
                                    isLight 
                                      ? 'bg-slate-100 text-slate-800 border-slate-300' 
                                      : `bg-white/10 text-green-300 border-green-800/30 ${style.bg}`
                                  }`}
                                  title={b}
                                >
                                  {b}
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-[8px] text-slate-500 italic">A definir</span>
                          )}
                        </div>
                      </div>

                      {/* Small Bottom Indicator Arrow for Mobile Expand UX */}
                      <div className={`flex items-center justify-center -mb-1 -mt-1 pt-0.5 transition-colors ${
                        isLight ? 'text-slate-400 group-hover:text-emerald-600' : 'text-green-500/40 group-hover:text-seagreen'
                      }`}>
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
      <footer className={`border-t py-6 px-6 md:px-8 text-[10px] shrink-0 mt-auto space-y-4 ${
        isLight 
          ? 'bg-slate-100 border-slate-200 text-slate-600' 
          : 'bg-[#010402] border-green-950/80 text-green-700'
      }`}>
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
        <div className={`max-w-7xl mx-auto pt-3 border-t text-[10px] leading-relaxed font-normal normal-case text-center md:text-left ${
          isLight 
            ? 'border-slate-200 text-slate-500' 
            : 'border-green-950/40 text-green-600/75'
        }`}>
          <strong className={isLight ? 'text-slate-800 font-semibold' : 'text-green-500 font-semibold'}>Aviso Legal & Transparência:</strong> O Esporte Radar atua estritamente como um guia informativo de transmissões esportivas. As datas, horários, estádios e canais de exibição são baseados nas divulgações públicas oficiais da CBF, CONMEBOL e das emissoras detentoras dos direitos, estando sujeitos a eventuais atrasos, remarcações ou cancelamentos sem aviso prévio. A plataforma não se responsabiliza por alterações de última hora efetuadas pelos organizadores.
        </div>
      </footer>

      {/* MATCH HUB MODAL (VIRTUAL LOUNGE) */}
      <AnimatePresence>
        {selectedMatch && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            {/* Modal Box */}
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className={`relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl custom-scrollbar border ${
                isLight 
                  ? 'bg-white border-slate-200 text-slate-900' 
                  : 'bg-[#05140d] border-green-950/60 text-white'
              }`}
            >
              {/* Action buttons (Close 'X', Info 'i', and Voice Narrator '🔊') */}
              <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
                {/* Narrate Match with TTS */}
                <button
                  onClick={() => handleSpeakSingleMatch(selectedMatch)}
                  aria-label="Ouvir informações desta partida em voz alta"
                  title="Ouvir informações desta partida em voz alta (Alt+P para pausar)"
                  className={`p-2 rounded-full border transition-all cursor-pointer shadow-lg ${
                    isSpeaking
                      ? 'bg-seagreen text-white border-seagreen animate-pulse'
                      : isLight
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                        : 'bg-[#020704]/90 text-green-300 hover:text-white hover:bg-green-950 border-green-950/80'
                  }`}
                >
                  <Volume2 className="h-4 w-4" />
                </button>

                <button 
                  onClick={() => setShowMatchModalHelp(prev => !prev)}
                  aria-label="Instruções e ajuda sobre a partida"
                  aria-expanded={showMatchModalHelp}
                  title="Instruções e informações da partida"
                  className={`p-2 rounded-full border transition-all cursor-pointer shadow-lg ${
                    showMatchModalHelp
                      ? 'bg-seagreen text-white font-bold border-seagreen ring-2 ring-seagreen/30'
                      : isLight
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                        : 'bg-[#020704]/90 text-green-300 hover:text-white hover:bg-green-950 border-green-950/80'
                  }`}
                >
                  <Info className="h-4 w-4" />
                </button>

                <button 
                  onClick={() => {
                    setSelectedMatch(null);
                    setShowMatchModalHelp(false);
                  }}
                  aria-label="Fechar detalhes da partida"
                  title="Fechar janela (Esc)"
                  className={`p-2 rounded-full border transition-all cursor-pointer shadow-lg ${
                    isLight
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                      : 'bg-[#020704]/90 text-green-400 hover:text-white hover:bg-green-950 border-green-950/80'
                  }`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Header card info */}
              <div className={`p-6 text-center border-b space-y-4 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#020704] border-green-950/60'
              }`}>
                
                {/* Accessible Instructions Drawer when 'i' is clicked */}
                <AnimatePresence>
                  {showMatchModalHelp && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden mb-4 text-left"
                    >
                      <div className={`p-4 rounded-lg text-xs space-y-2.5 shadow-inner border ${
                        isLight 
                          ? 'bg-blue-50 border-blue-200 text-blue-900' 
                          : 'bg-[#072417] border-green-700/50 text-green-200'
                      }`}>
                        <div className="flex items-center justify-between font-bold text-sm">
                          <span className="flex items-center gap-2">
                            <Info className="h-4 w-4 text-seagreen" />
                            Guia de Informações da Partida
                          </span>
                          <button
                            onClick={() => setShowMatchModalHelp(false)}
                            className="text-[10px] text-seagreen hover:underline uppercase tracking-wider cursor-pointer"
                          >
                            Ocultar
                          </button>
                        </div>
                        <ul className="space-y-1.5 text-[11px] leading-relaxed list-disc list-inside">
                          <li><strong>Time da Casa:</strong> O time exibido à esquerda é o mandante no estádio indicado.</li>
                          <li><strong>Horário:</strong> Todos os horários seguem rigorosamente o fuso oficial de <em>Brasília (GMT-3)</em>.</li>
                          <li><strong>Onde Assistir:</strong> Clique em qualquer um dos canais listados abaixo para abrir diretamente o portal oficial de transmissão.</li>
                          <li><strong>Acessibilidade:</strong> Clique no ícone de alto-falante no topo para escutar todos os detalhes narrados em voz alta.</li>
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <div className="flex items-center justify-center gap-2">
                  <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider ${getDivisionStyle(selectedMatch.division)}`}>
                    {selectedMatch.division}
                  </span>
                  <span className={`text-[10px] font-mono uppercase tracking-wider ${
                    isLight ? 'text-slate-600 font-bold' : 'text-green-400'
                  }`}>
                    {selectedMatch.round}
                  </span>
                </div>

                {/* Main teams block */}
                <div className="grid grid-cols-7 items-center justify-center py-4">
                  {/* Home */}
                  <div className="col-span-3 flex flex-col items-center space-y-2">
                    <TeamLogo teamName={selectedMatch.homeTeam} logoUrl={selectedMatch.homeTeamLogo} size="xl" />
                    <span className={`text-sm font-bold text-center ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {selectedMatch.homeTeam}
                    </span>
                    <span className={`text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${
                      isLight ? 'bg-slate-200 text-slate-800' : 'bg-[#0a2e1e] text-green-500'
                    }`}>
                      MANDO
                    </span>
                  </div>

                  {/* VS / Score / Status */}
                  <div className="col-span-1 flex flex-col items-center justify-center !-mt-[35px]" style={{ marginTop: '-35px' }}>
                    {selectedMatch.status === 'ao_vivo' ? (
                      <div className="space-y-1 !-mt-[35px]" style={{ marginTop: '-35px' }}>
                        <span className="text-[8px] font-bold text-red-500 uppercase tracking-wider block animate-pulse">STATUS</span>
                        <div className="text-xs font-mono font-black text-red-500 bg-red-100 dark:bg-red-950/80 px-2 py-1 rounded border border-red-300 dark:border-red-900/30 whitespace-nowrap">
                          AO VIVO
                        </div>
                      </div>
                    ) : selectedMatch.status === 'finalizado' ? (
                      <div className="space-y-1 !-mt-[35px]" style={{ marginTop: '-35px' }}>
                        <span className="text-[8px] font-bold text-emerald-600 uppercase tracking-wider block">PLACAR FINAL</span>
                        {(selectedMatch.score || (selectedMatch.homeScore !== undefined && selectedMatch.homeScore !== null && selectedMatch.awayScore !== undefined && selectedMatch.awayScore !== null)) ? (
                          <div className="flex flex-col items-center">
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-black/80 border border-emerald-500/60 rounded-md shadow-md">
                              <span className="text-base sm:text-lg font-mono font-black text-white leading-none">
                                {selectedMatch.score?.home ?? selectedMatch.homeScore}
                              </span>
                              <span className="text-xs font-bold text-emerald-400 leading-none">×</span>
                              <span className="text-base sm:text-lg font-mono font-black text-white leading-none">
                                {selectedMatch.score?.away ?? selectedMatch.awayScore}
                              </span>
                            </div>
                            {selectedMatch.score?.penalties && (
                              <span className="text-[8px] font-mono font-bold text-amber-300 mt-0.5 bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-800/40 whitespace-nowrap">
                                Pên: {selectedMatch.score.penalties.home} × {selectedMatch.score.penalties.away}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs font-mono font-black text-seagreen bg-green-950/80 px-2 py-1 rounded border border-green-900/30 whitespace-nowrap">
                            FINALIZADO
                          </div>
                        )}
                        <span className="text-[7.5px] font-mono font-bold text-slate-400 uppercase tracking-wider block mt-0.5">
                          ENCERRADO
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-1 !-mt-[35px]" style={{ marginTop: '-35px' }}>
                        <span className="text-[8px] font-bold text-seagreen uppercase tracking-wider block">HORÁRIO</span>
                        <div className={`text-xl font-mono font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {selectedMatch.time}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Away */}
                  <div className="col-span-3 flex flex-col items-center space-y-2">
                    <TeamLogo teamName={selectedMatch.awayTeam} logoUrl={selectedMatch.awayTeamLogo} size="xl" />
                    <span className={`text-sm font-bold text-center ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {selectedMatch.awayTeam}
                    </span>
                    <span className={`text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${
                      isLight ? 'bg-slate-200 text-slate-800' : 'bg-[#05140d] text-green-500'
                    }`}>
                      VISITA
                    </span>
                  </div>
                </div>

                {/* Stadium & Referee details */}
                <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded border ${
                    isLight 
                      ? 'bg-white text-slate-800 border-slate-300' 
                      : 'text-green-400 bg-[#05140d]/80 border-green-950/40'
                  }`}>
                    <MapPin className="h-3.5 w-3.5 text-green-500 shrink-0" />
                    <span>Estádio: <strong className={isLight ? 'text-black' : 'text-white'}>{selectedMatch.stadium || 'A confirmar'}</strong></span>
                  </div>
                  {selectedMatch.referee && (
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded border ${
                      isLight 
                        ? 'bg-white text-slate-800 border-slate-300' 
                        : 'text-green-400 bg-[#05140d]/80 border-green-950/40'
                    }`}>
                      <Shield className="h-3.5 w-3.5 text-seagreen shrink-0" />
                      <span>Árbitro: <strong className={isLight ? 'text-black' : 'text-white'}>{selectedMatch.referee}</strong></span>
                    </div>
                  )}
                  {selectedMatch.matchViewUrl && (
                    <a
                      href={selectedMatch.matchViewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-amber-500 hover:text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded border border-amber-300 dark:border-amber-800/40 transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      <span>Súmula CONMEBOL</span>
                    </a>
                  )}
                </div>

              </div>

              {/* Action and channels block */}
              <div className="p-6 space-y-6">
                
                <div className="space-y-3">
                  <h4 className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 ${
                    isLight ? 'text-emerald-800' : 'text-green-500'
                  }`}>
                    <Tv className="h-3.5 w-3.5" /> Selecione o canal para assistir no navegador
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedMatch.broadcasters.map((broadcaster, index) => {
                      const style = getBroadcasterStyle(broadcaster);
                      const isUnconfirmed = broadcaster.toLowerCase().includes('confirmar');
                      const url = getBroadcasterUrl(broadcaster, selectedMatch.transmissionUrl);

                      if (isUnconfirmed || !url) {
                        return (
                          <div
                            key={index}
                            className={`flex items-center justify-between p-4 rounded border opacity-85 ${
                              isLight 
                                ? 'bg-amber-50/60 border-amber-300 text-amber-900' 
                                : 'bg-[#020704] border-amber-500/30 text-amber-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-[9px] font-black uppercase text-amber-600 dark:text-amber-400">
                                ?
                              </span>
                              <div>
                                <p className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Transmissão a confirmar</p>
                                <p className="text-[9px] text-amber-600 dark:text-amber-400/80 font-mono uppercase tracking-wider">Aguardando escala oficial</p>
                              </div>
                            </div>
                            <Clock className="h-3.5 w-3.5 text-amber-500" />
                          </div>
                        );
                      }

                      return (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center justify-between p-4 rounded border transition-all duration-200 group cursor-pointer ${
                            isLight
                              ? 'bg-slate-50 hover:bg-emerald-50 border-slate-200 hover:border-emerald-500 text-slate-900 shadow-sm'
                              : 'bg-[#020704] hover:bg-[#082015] border-green-950/40 hover:border-seagreen text-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-8 h-8 rounded flex items-center justify-center text-[9px] font-black uppercase ${style.badge}`}>
                              {broadcaster.substring(0, 3).toUpperCase()}
                            </span>
                            <div>
                              <p className={`text-xs font-bold group-hover:text-seagreen ${isLight ? 'text-slate-900' : 'text-white'}`}>{broadcaster}</p>
                              <p className="text-[9px] text-emerald-600 dark:text-green-400/70 font-mono uppercase tracking-wider">Abrir Portal Oficial</p>
                            </div>
                          </div>
                          <ExternalLink className="h-3.5 w-3.5 text-seagreen group-hover:translate-x-0.5 transition-transform" />
                        </a>
                      );
                    })}
                  </div>
                </div>

                <div className={`p-3.5 rounded border text-[11px] leading-relaxed ${
                  isLight 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                    : 'bg-[#092215]/50 border-green-950/30 text-green-400'
                }`}>
                  <span className="font-bold text-seagreen">Dica:</span> Ao clicar em uma das plataformas listadas acima, o navegador abrirá diretamente o site oficial correspondente. Certifique-se de possuir login ou assinatura ativa para acompanhar a partida com melhor qualidade.
                </div>

                {/* Team Favoriting & Smartwatch Alerts in Modal */}
                <div className={`p-4 rounded-lg border space-y-3 ${
                  isLight 
                    ? 'bg-amber-50/50 border-amber-300' 
                    : 'bg-[#031109] border-amber-500/30'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Star className="h-3.5 w-3.5 fill-amber-400" />
                      Favoritar Times desta Partida
                    </span>
                    <button
                      onClick={() => {
                        setSelectedMatch(null);
                        setShowPreferencesModal(true);
                      }}
                      className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                    >
                      <Watch className="h-3 w-3 text-sky-500" /> Configurar Alertas Smartwatch
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      onClick={() => handleToggleFavoriteTeam(selectedMatch.homeTeam)}
                      className={`p-2.5 rounded-lg border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                        isTeamFavorite(selectedMatch.homeTeam)
                          ? isLight
                            ? 'bg-amber-100 border-amber-400 text-amber-900 shadow-sm'
                            : 'bg-amber-950/70 border-amber-500 text-amber-300 shadow-sm'
                          : isLight
                            ? 'bg-white border-slate-300 text-slate-700 hover:border-amber-400'
                            : 'bg-[#06180f] border-green-900/40 text-slate-300 hover:text-white hover:border-amber-500/50'
                      }`}
                    >
                      <span className="truncate">{selectedMatch.homeTeam}</span>
                      <span className="flex items-center gap-1 shrink-0 text-[10px] font-mono">
                        <Star className={`h-3 w-3 ${isTeamFavorite(selectedMatch.homeTeam) ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
                        {isTeamFavorite(selectedMatch.homeTeam) ? 'Favoritado' : 'Favoritar'}
                      </span>
                    </button>

                    <button
                      onClick={() => handleToggleFavoriteTeam(selectedMatch.awayTeam)}
                      className={`p-2.5 rounded-lg border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                        isTeamFavorite(selectedMatch.awayTeam)
                          ? isLight
                            ? 'bg-amber-100 border-amber-400 text-amber-900 shadow-sm'
                            : 'bg-amber-950/70 border-amber-500 text-amber-300 shadow-sm'
                          : isLight
                            ? 'bg-white border-slate-300 text-slate-700 hover:border-amber-400'
                            : 'bg-[#06180f] border-green-900/40 text-slate-300 hover:text-white hover:border-amber-500/50'
                      }`}
                    >
                      <span className="truncate">{selectedMatch.awayTeam}</span>
                      <span className="flex items-center gap-1 shrink-0 text-[10px] font-mono">
                        <Star className={`h-3 w-3 ${isTeamFavorite(selectedMatch.awayTeam) ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
                        {isTeamFavorite(selectedMatch.awayTeam) ? 'Favoritado' : 'Favoritar'}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setSelectedMatch(null)}
                    className={`px-4 py-2 text-xs font-bold rounded uppercase tracking-wider cursor-pointer ${
                      isLight 
                        ? 'bg-slate-200 hover:bg-slate-300 text-slate-800' 
                        : 'bg-green-950 hover:bg-green-900 text-green-300 hover:text-white'
                    }`}
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

      {/* ACCESSIBILITY & AUDIO NARRATION SETTINGS MODAL */}
      <AccessibilityModal
        isOpen={showA11yModal}
        onClose={() => setShowA11yModal(false)}
        settings={a11ySettings}
        onUpdate={handleUpdateA11y}
      />

      {/* FLOATING PWA / ADD TO HOME SCREEN PROMPT */}
      <InstallPwaPrompt />

      {/* FLOATING IN-APP NOTIFICATION TOASTS (CELULAR, SMARTWATCH & NAVEGADOR) */}
      <NotificationToastContainer />

    </div>
  );
}
