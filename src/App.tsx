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
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FootballMatch, SportType } from './types';
import { AdSlot, useAnchorAd } from './components/AdSlot';
import { SocialProjectsView } from './components/SocialProjectsView';
import { InstallPwaPrompt } from './components/InstallPwaPrompt';
import { Preloader } from './components/Preloader';
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

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDivision, setSelectedDivision] = useState<string>('Tudo');
  const [selectedBroadcaster, setSelectedBroadcaster] = useState<string>('Tudo');
  const [selectedStatus, setSelectedStatus] = useState<'Tudo' | 'ao_vivo' | 'agendado' | 'finalizado'>('Tudo');
  const [selectedDay, setSelectedDay] = useState<number | 'Tudo'>(currentDayNumber);
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

  // Selected Match for the Live Hub Modal
  const [selectedMatch, setSelectedMatch] = useState<FootballMatch | null>(null);

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
        setMatches(result.data);
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

  // Filter lists derived from active sport
  const sportMatches = matches.filter(m => (m.sport || 'futebol') === activeSport);
  const broadcastersList = ['Tudo', ...Array.from(new Set(sportMatches.flatMap(m => m.broadcasters)))];
  const divisionsList = ['Tudo', ...Array.from(new Set(sportMatches.map(m => m.division).filter(Boolean)))];
  
  // Apply filtering rules
  const filteredMatches = matches.filter(match => {
    const matchSport = match.sport || 'futebol';
    if (matchSport !== activeSport) return false;

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

    return matchesSearch && matchesDivision && matchesBroadcaster && matchesStatus && matchesDay;
  });

  // Ordenar: Ao Vivo (1º), Agendados (2º), Finalizados no final (3º)
  const sortedMatches = [...filteredMatches].sort((a, b) => {
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

          <div className="flex items-center gap-4">
            <div className="bg-[#020704]/60 px-4 py-2 border border-green-950/60 rounded flex items-center gap-2.5 shadow-inner">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              <span className="text-xs font-semibold uppercase tracking-wider text-green-300">
                {liveCount} {liveCount === 1 ? 'Jogo ao Vivo' : 'Jogos ao Vivo'}
              </span>
            </div>
            <button 
              onClick={() => fetchGames(true)} 
              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-2 rounded bg-green-900/60 border border-green-800 hover:border-seagreen hover:text-white text-green-300 text-xs font-bold transition-all duration-200 cursor-pointer uppercase tracking-wider"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Buscando...' : 'Recarregar'}
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
                    isActive ? 'bg-[#020704] text-seagreen font-bold' : 'bg-green-950/80 text-emerald-300'
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
        <section className="bg-[#05140d] border-b border-green-950/60 py-3.5 px-6 md:px-8 shrink-0">
        <div className="max-w-7xl mx-auto space-y-3">
          
          {/* Collapsible Header Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-green-950/40 pb-2">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-xs font-bold text-emerald-300 hover:text-white uppercase tracking-widest cursor-pointer select-none"
            >
              <SlidersHorizontal className="h-4 w-4 text-seagreen" />
              <span>Filtros e Busca</span>
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
                      className="group flex flex-col bg-[oklch(85.2%_0.199_91.936)]/[0.04] border border-[oklch(85.2%_0.199_91.936)]/35 hover:bg-[color-mix(in_oklab,oklch(0.77_0.16_199.2)_55%,transparent)] hover:border-[oklch(0.77_0.16_199.2)]/80 rounded-lg p-3 lg:p-2.5 transition-all duration-200 cursor-pointer relative shadow-[0_2px_8px_rgba(0,0,0,0.15)] hover:shadow-md gap-2"
                    >
                      {/* Decorative live bar */}
                      {isLive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 rounded-l"></div>
                      )}

                      {/* Top Meta Header: Date/Time + Division Tag + Broadcasters */}
                      <div className="flex items-center justify-between gap-2 border-b border-green-900/20 pb-1.5">
                        {/* Date, Time & Division Tag (Moved higher up to avoid crowding team names) */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold text-white uppercase tracking-tight">
                              {dateInfo.shortDate} às {match.time}
                            </span>
                            <span className="text-[9px] text-emerald-300 font-mono uppercase tracking-wider">
                              {isLive ? '• AO VIVO' : `• ${dateInfo.dayOfWeek}`}
                            </span>
                          </div>
                          <span className={`px-1.5 py-0.5 text-[8px] font-bold rounded uppercase tracking-wider ${getDivisionStyle(match.division)}`}>
                            {match.division}
                          </span>
                        </div>

                        {/* Broadcaster channels */}
                        <div className="flex items-center gap-1 flex-wrap shrink-0">
                          {match.broadcasters.map((b, i) => {
                            const style = getBroadcasterStyle(b);
                            return (
                              <div 
                                key={i} 
                                className={`px-1.5 py-0.5 bg-white/10 rounded flex items-center justify-center text-[8px] font-bold uppercase tracking-wider text-green-300 border border-green-800/30 ${style.bg}`}
                              >
                                {b}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Main Matchup Row */}
                      <div className="flex items-center justify-between gap-2 sm:gap-3 pt-0.5">
                        {/* Team matchup */}
                        <div className="flex-1 flex items-center justify-between md:justify-center gap-1.5 sm:gap-3 bg-[#020704]/30 md:bg-transparent p-2 md:p-0 rounded-lg min-w-0">
                          
                          {/* Home team */}
                          <div className="flex items-center gap-1.5 sm:gap-2 w-[45%] md:w-5/12 min-w-0 justify-end">
                            <span className="text-[11px] sm:text-xs md:text-sm font-bold text-white text-right line-clamp-2 break-words leading-tight min-w-0">
                              {match.homeTeam}
                            </span>
                            <div className="relative shrink-0 w-7 h-7 rounded-full bg-white/95 border border-green-950/30 flex items-center justify-center overflow-hidden p-0.5 shadow-sm">
                              <img 
                                src={match.homeTeamLogo} 
                                alt={match.homeTeam} 
                                referrerPolicy="no-referrer"
                                className="w-5 h-5 object-contain"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                  const fallback = (e.target as HTMLElement).nextElementSibling;
                                  if (fallback) fallback.classList.remove('hidden');
                                }}
                              />
                              <div className="absolute inset-0 bg-green-950 border border-green-800 rounded-full flex items-center justify-center text-[9px] font-bold text-white hidden">
                                {match.homeTeam.substring(0, 3).toUpperCase()}
                              </div>
                            </div>
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
                          <div className="flex items-center gap-1.5 sm:gap-2 w-[45%] md:w-5/12 min-w-0 justify-start">
                            <div className="relative shrink-0 w-7 h-7 rounded-full bg-white/95 border border-green-950/30 flex items-center justify-center overflow-hidden p-0.5 shadow-sm">
                              <img 
                                src={match.awayTeamLogo} 
                                alt={match.awayTeam} 
                                referrerPolicy="no-referrer"
                                className="w-5 h-5 object-contain"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                  const fallback = (e.target as HTMLElement).nextElementSibling;
                                  if (fallback) fallback.classList.remove('hidden');
                                }}
                              />
                              <div className="absolute inset-0 bg-green-950 border border-green-800 rounded-full flex items-center justify-center text-[9px] font-bold text-white hidden">
                                {match.awayTeam.substring(0, 3).toUpperCase()}
                              </div>
                            </div>
                            <span className="text-[11px] sm:text-xs md:text-sm font-bold text-white text-left line-clamp-2 break-words leading-tight min-w-0">
                              {match.awayTeam}
                            </span>
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
                          ) : (
                            <span className="inline-block px-3 py-1 bg-white/5 text-[oklch(85.2%_0.199_91.936)] group-hover:bg-[color-mix(in_oklab,oklch(0.77_0.16_199.2)_55%,transparent)] group-hover:text-cyan-100 group-hover:border-[oklch(0.77_0.16_199.2)] text-[10px] font-bold rounded border border-[oklch(85.2%_0.199_91.936)]/30 transition-all uppercase tracking-wider">
                              Transmitir
                            </span>
                          )}
                        </div>
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

      {/* FOOTER INFO */}
      <footer className="bg-[#010402] border-t border-green-950/80 py-6 px-6 md:px-8 text-[10px] text-green-700 uppercase tracking-widest shrink-0 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap justify-center md:justify-start gap-6">
            <span>© 2026 Confederação Brasileira de Futebol</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
              Sincronização Ativa
            </span>
            <span>Estádios e horários oficiais padrão de Brasília</span>
          </div>
          <div className="text-center md:text-right font-mono text-[9px]">
            Exibindo {filteredMatches.length} de {matches.length} transmissões do mês
          </div>
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
              className="relative w-full max-w-xl bg-[#05140d] border border-green-950/60 rounded-lg overflow-hidden shadow-2xl"
            >
              {/* Close Icon */}
              <button 
                onClick={() => setSelectedMatch(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-[#020704]/60 text-green-400 hover:text-white transition-all cursor-pointer z-10"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Header card info */}
              <div className="bg-[#020704] p-6 text-center border-b border-green-950/60 space-y-4">
                
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
                    <div className="h-14 w-14 rounded-full bg-white flex items-center justify-center p-1 border border-green-950/40 shadow-inner overflow-hidden">
                      <img 
                        src={selectedMatch.homeTeamLogo} 
                        alt={selectedMatch.homeTeam} 
                        referrerPolicy="no-referrer"
                        className="h-10 w-10 object-contain"
                      />
                    </div>
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
                    <div className="h-14 w-14 rounded-full bg-white flex items-center justify-center p-1 border border-green-950/40 shadow-inner overflow-hidden">
                      <img 
                        src={selectedMatch.awayTeamLogo} 
                        alt={selectedMatch.awayTeam} 
                        referrerPolicy="no-referrer"
                        className="h-10 w-10 object-contain"
                      />
                    </div>
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

      {/* FLOATING PWA / ADD TO HOME SCREEN PROMPT */}
      <InstallPwaPrompt />

    </div>
  );
}
