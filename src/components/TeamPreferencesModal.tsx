import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Star, 
  Bell, 
  BellRing, 
  BellOff, 
  Watch, 
  Smartphone, 
  Check, 
  Search, 
  X, 
  Sliders, 
  Info, 
  Zap,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Volume2
} from 'lucide-react';
import { FootballMatch, UserPreferences } from '../types';
import { TeamLogo } from './TeamLogo';
import { 
  getNotificationPermission, 
  requestNotificationPermission, 
  sendTestNotification,
  playNotificationChime,
  emitInAppToast
} from '../utils/notificationService';

interface TeamPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  matches: FootballMatch[];
  preferences: UserPreferences;
  onUpdatePreferences: (newPrefs: UserPreferences) => void;
}

export function TeamPreferencesModal({
  isOpen,
  onClose,
  matches,
  preferences,
  onUpdatePreferences,
}: TeamPreferencesModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTeamConfig, setExpandedTeamConfig] = useState<string | null>(null);
  const [notificationStatus, setNotificationStatus] = useState<'default' | 'granted' | 'denied' | 'unsupported'>(getNotificationPermission());
  const [testSent, setTestSent] = useState(false);
  const [testResultMessage, setTestResultMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'teams' | 'divisions' | 'smartwatch'>('teams');

  // Sync notification permission status when modal opens
  useEffect(() => {
    if (isOpen) {
      setNotificationStatus(getNotificationPermission());
    }
  }, [isOpen]);

  // Extract all unique clubs/teams and available divisions dynamically
  const { allTeams, allDivisions } = useMemo(() => {
    const teamMap = new Map<string, { name: string; logo: string; divisions: Set<string> }>();
    const divisionSet = new Set<string>();

    matches.forEach(m => {
      if (m.division) divisionSet.add(m.division);

      if (m.homeTeam) {
        const existing = teamMap.get(m.homeTeam) || { name: m.homeTeam, logo: m.homeTeamLogo, divisions: new Set() };
        if (m.division) existing.divisions.add(m.division);
        teamMap.set(m.homeTeam, existing);
      }

      if (m.awayTeam) {
        const existing = teamMap.get(m.awayTeam) || { name: m.awayTeam, logo: m.awayTeamLogo, divisions: new Set() };
        if (m.division) existing.divisions.add(m.division);
        teamMap.set(m.awayTeam, existing);
      }
    });

    // Default major Brazilian divisions list if not already present
    const defaultDivs = ['Série A', 'Série B', 'Copa do Brasil', 'Libertadores', 'Sul-Americana', 'Série C', 'Série D', 'Feminino', 'Sub-20', 'Sub-17'];
    defaultDivs.forEach(d => divisionSet.add(d));

    const preferredOrder = ['Série A', 'Série B', 'Copa do Brasil', 'Libertadores', 'Sul-Americana', 'Série C', 'Série D', 'Feminino', 'Sub-20', 'Sub-17', 'Sub-15'];
    const sortedDivisions = Array.from(divisionSet).sort((a, b) => {
      const idxA = preferredOrder.indexOf(a);
      const idxB = preferredOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    const teamsArray = Array.from(teamMap.values()).map(t => ({
      name: t.name,
      logo: t.logo,
      divisions: Array.from(t.divisions),
    }));

    // Sort teams by favorites first, then alphabetically
    teamsArray.sort((a, b) => {
      const aFav = preferences.favoriteTeams.includes(a.name);
      const bFav = preferences.favoriteTeams.includes(b.name);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return a.name.localeCompare(b.name);
    });

    return {
      allTeams: teamsArray,
      allDivisions: sortedDivisions,
    };
  }, [matches, preferences.favoriteTeams]);

  // Filtered teams list based on search
  const filteredTeams = useMemo(() => {
    if (!searchTerm.trim()) return allTeams;
    const term = searchTerm.toLowerCase();
    return allTeams.filter(t => t.name.toLowerCase().includes(term));
  }, [allTeams, searchTerm]);

  // Toggle favorite status and request browser permission if needed
  const handleToggleFavorite = async (teamName: string) => {
    const isFav = preferences.favoriteTeams.includes(teamName);

    // If adding a team to favorites, request browser notification permission
    if (!isFav && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        const perm = await requestNotificationPermission();
        setNotificationStatus(perm);
      }
    }

    const newFavorites = isFav 
      ? preferences.favoriteTeams.filter(t => t !== teamName)
      : [...preferences.favoriteTeams, teamName];

    // If favoriting, automatically initialize notification config if not present
    const newConfigs = { ...preferences.notificationConfigs };
    if (!isFav && !newConfigs[teamName]) {
      newConfigs[teamName] = {
        teamName,
        enabled: true,
        divisions: [], // all divisions
        notifyBeforeMinutes: preferences.notifyBeforeMinutes || 15,
        soundEnabled: true,
      };
    }

    onUpdatePreferences({
      ...preferences,
      favoriteTeams: newFavorites,
      notificationConfigs: newConfigs,
    });
  };

  // Toggle notifications for a team
  const handleToggleNotification = async (teamName: string) => {
    const current = preferences.notificationConfigs[teamName];
    const isCurrentlyEnabled = current?.enabled ?? false;

    // If turning on notification, request browser permission if default
    if (!isCurrentlyEnabled && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        const perm = await requestNotificationPermission();
        setNotificationStatus(perm);
      }
    }

    const newConfigs = {
      ...preferences.notificationConfigs,
      [teamName]: {
        teamName,
        enabled: !isCurrentlyEnabled,
        divisions: current?.divisions || [],
        notifyBeforeMinutes: current?.notifyBeforeMinutes || preferences.notifyBeforeMinutes || 15,
        soundEnabled: true,
      }
    };

    onUpdatePreferences({
      ...preferences,
      notificationConfigs: newConfigs,
    });
  };

  // Toggle a specific division for a team
  const handleToggleTeamDivision = (teamName: string, division: string) => {
    const current = preferences.notificationConfigs[teamName] || {
      teamName,
      enabled: true,
      divisions: [],
      notifyBeforeMinutes: 15,
      soundEnabled: true,
    };

    let newDivisions: string[];
    const currentDivs = current.divisions || [];

    if (currentDivs.length === 0) {
      newDivisions = [division];
    } else if (currentDivs.includes(division)) {
      newDivisions = currentDivs.filter(d => d !== division);
    } else {
      newDivisions = [...currentDivs, division];
    }

    const newConfigs = {
      ...preferences.notificationConfigs,
      [teamName]: {
        ...current,
        enabled: true,
        divisions: newDivisions,
      }
    };

    onUpdatePreferences({
      ...preferences,
      notificationConfigs: newConfigs,
    });
  };

  // Select all divisions for a team (empty array = all)
  const handleSetAllDivisions = (teamName: string, all: boolean) => {
    const current = preferences.notificationConfigs[teamName] || {
      teamName,
      enabled: true,
      divisions: [],
      notifyBeforeMinutes: 15,
      soundEnabled: true,
    };

    const newConfigs = {
      ...preferences.notificationConfigs,
      [teamName]: {
        ...current,
        enabled: true,
        divisions: all ? [] : ['Série A'],
      }
    };

    onUpdatePreferences({
      ...preferences,
      notificationConfigs: newConfigs,
    });
  };

  // Update notification timing window for a team
  const handleSetTiming = (teamName: string, minutes: number) => {
    const current = preferences.notificationConfigs[teamName] || {
      teamName,
      enabled: true,
      divisions: [],
      notifyBeforeMinutes: 15,
      soundEnabled: true,
    };

    const newConfigs = {
      ...preferences.notificationConfigs,
      [teamName]: {
        ...current,
        notifyBeforeMinutes: minutes,
      }
    };

    onUpdatePreferences({
      ...preferences,
      notificationConfigs: newConfigs,
    });
  };

  // Request browser permission directly
  const handleRequestPermission = async () => {
    const perm = await requestNotificationPermission();
    setNotificationStatus(perm);
    if (perm === 'granted') {
      onUpdatePreferences({
        ...preferences,
        notificationsGlobalEnabled: true,
      });
      emitInAppToast({
        title: '🔔 Permissão Concedida!',
        body: 'Notificações ativadas no seu celular, smartwatch e navegador.',
        type: 'success',
      });
    }
  };

  // Dispatch test notification
  const handleSendTest = async (teamName?: string) => {
    const targetTeam = teamName || preferences.favoriteTeams[0] || 'Flamengo';
    setTestSent(true);
    setTestResultMessage(null);

    const result = await sendTestNotification(targetTeam);
    setNotificationStatus(result.permission);
    setTestResultMessage(result.message);

    setTimeout(() => {
      setTestSent(false);
    }, 2500);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md"
      >
        <motion.div
          initial={{ scale: 0.95, y: 15 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-[#05140d] border border-green-900/60 rounded-xl shadow-2xl overflow-hidden"
        >
          {/* Top Header */}
          <div className="p-5 bg-[#020704] border-b border-green-950/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-seagreen/20 border border-seagreen/40 flex items-center justify-center text-seagreen">
                <BellRing className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-tight flex items-center gap-2">
                  Alertas & Times Favoritos
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Smartwatch & Celular
                  </span>
                </h3>
                <p className="text-xs text-green-400/80 mt-0.5">
                  Receba avisos no início das partidas e priorize seus clubes no topo da lista.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-[#05140d] text-green-400 hover:text-white hover:bg-green-950 border border-green-900/40 transition-all cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-green-950 bg-[#031109] px-4 pt-2 gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('teams')}
              className={`px-3.5 py-2 text-xs font-bold rounded-t-lg transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'teams'
                  ? 'bg-[#05140d] text-white border-t border-x border-green-800/80 text-seagreen'
                  : 'text-green-400/70 hover:text-white'
              }`}
            >
              <Star className="h-3.5 w-3.5 text-amber-400" />
              <span>Times & Alertas ({preferences.favoriteTeams.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('divisions')}
              className={`px-3.5 py-2 text-xs font-bold rounded-t-lg transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'divisions'
                  ? 'bg-[#05140d] text-white border-t border-x border-green-800/80 text-seagreen'
                  : 'text-green-400/70 hover:text-white'
              }`}
            >
              <Sliders className="h-3.5 w-3.5 text-seagreen" />
              <span>Filtro por Divisão</span>
            </button>

            <button
              onClick={() => setActiveTab('smartwatch')}
              className={`px-3.5 py-2 text-xs font-bold rounded-t-lg transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'smartwatch'
                  ? 'bg-[#05140d] text-white border-t border-x border-green-800/80 text-seagreen'
                  : 'text-green-400/70 hover:text-white'
              }`}
            >
              <Watch className="h-3.5 w-3.5 text-sky-400" />
              <span>Smartwatch / Teste</span>
            </button>
          </div>

          {/* Modal Body Container */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar">

            {/* TAB 1: MEUS TIMES E ALERTAS */}
            {activeTab === 'teams' && (
              <div className="space-y-4">
                
                {/* PROMINENT PERMISSION STATUS BANNER */}
                {notificationStatus !== 'granted' ? (
                  <div className="p-3.5 bg-amber-950/40 border border-amber-500/50 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-amber-200 uppercase tracking-tight">
                          {notificationStatus === 'denied' 
                            ? 'Permissão de Notificação Bloqueada' 
                            : 'Permissão de Notificação Pendente'}
                        </h4>
                        <p className="text-[11px] text-amber-300/80 mt-0.5 leading-snug">
                          {notificationStatus === 'denied'
                            ? 'As notificações estão desativadas no navegador. Clique no cadeado ao lado da URL para autorizar.'
                            : 'Para receber avisos quando os jogos começarem no celular e relógio, ative a permissão.'}
                        </p>
                      </div>
                    </div>

                    {notificationStatus !== 'denied' && (
                      <button
                        onClick={handleRequestPermission}
                        className="px-3.5 py-2 bg-amber-500 text-black hover:bg-amber-400 text-xs font-bold rounded-lg transition-all cursor-pointer uppercase tracking-wider shrink-0 flex items-center justify-center gap-1.5"
                      >
                        <Bell className="h-4 w-4 fill-black" />
                        Ativar Notificações
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl flex items-center justify-between gap-2 text-xs text-emerald-300 shadow-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>
                        <strong>Notificações Ativas:</strong> Seu celular, navegador e smartwatch receberão os avisos das partidas.
                      </span>
                    </div>
                    <button
                      onClick={() => handleSendTest()}
                      disabled={testSent}
                      className="px-2.5 py-1 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-500/40 text-[10px] font-bold rounded transition-all cursor-pointer uppercase shrink-0 flex items-center gap-1"
                    >
                      <Zap className="h-3 w-3 text-amber-300" />
                      {testSent ? 'Enviando...' : 'Testar'}
                    </button>
                  </div>
                )}

                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Buscar clube (ex: Flamengo, Palmeiras, São Paulo, Corinthians...)"
                    className="w-full bg-[#020704] border border-green-900/60 rounded-lg pl-10 pr-4 py-2.5 text-xs text-white placeholder-green-700 focus:outline-none focus:border-seagreen transition-colors"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 hover:text-white text-xs"
                    >
                      Limpar
                    </button>
                  )}
                </div>

                {/* Quick Info Box */}
                <div className="p-3 bg-[#082216]/60 border border-green-800/40 rounded-lg flex items-start gap-2.5 text-xs text-green-200">
                  <Info className="h-4 w-4 text-seagreen shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p>
                      <strong>Dica:</strong> Ao marcar um time com a estrela <strong className="text-amber-400">⭐ Favorito</strong>, suas partidas aparecem automaticamente no topo do feed do Esporte Radar e as notificações de início de jogo ficam ativas.
                    </p>
                  </div>
                </div>

                {/* Teams List */}
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {filteredTeams.length === 0 ? (
                    <div className="p-8 text-center bg-[#020704] rounded-lg border border-green-950 text-xs text-green-500">
                      Nenhum clube encontrado para "{searchTerm}".
                    </div>
                  ) : (
                    filteredTeams.map(team => {
                      const isFav = preferences.favoriteTeams.includes(team.name);
                      const config = preferences.notificationConfigs[team.name];
                      const isNotifEnabled = config?.enabled ?? isFav;
                      const hasSpecificDivisions = config?.divisions && config.divisions.length > 0;
                      const isExpanded = expandedTeamConfig === team.name;

                      return (
                        <div
                          key={team.name}
                          className={`border rounded-lg transition-all ${
                            isFav
                              ? 'bg-[#082216]/70 border-amber-500/40 shadow-sm'
                              : 'bg-[#020704] border-green-950 hover:border-green-800/60'
                          }`}
                        >
                          <div className="p-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <TeamLogo teamName={team.name} logoUrl={team.logo} size="md" />

                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs sm:text-sm font-bold text-white truncate">
                                    {team.name}
                                  </span>
                                  {isFav && (
                                    <span className="text-[9px] font-bold text-amber-300 bg-amber-950/60 border border-amber-500/40 px-1.5 py-0.2 rounded uppercase">
                                      Meu Time
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] text-green-400/80 font-mono">
                                    {hasSpecificDivisions 
                                      ? `Notificar em: ${config.divisions.join(', ')}`
                                      : 'Notificar em todas as divisões'
                                    }
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              {/* Notification Toggle */}
                              <button
                                onClick={() => handleToggleNotification(team.name)}
                                title={isNotifEnabled ? 'Desativar notificações' : 'Ativar notificações deste time'}
                                className={`p-2 rounded-lg border text-xs transition-all cursor-pointer flex items-center gap-1 ${
                                  isNotifEnabled
                                    ? 'bg-seagreen/20 text-seagreen border-seagreen/50'
                                    : 'bg-green-950/40 text-green-600 border-green-900/40 hover:text-green-300'
                                }`}
                              >
                                {isNotifEnabled ? <Bell className="h-4 w-4 fill-seagreen" /> : <BellOff className="h-4 w-4" />}
                              </button>

                              {/* Favorite Star Button */}
                              <button
                                onClick={() => handleToggleFavorite(team.name)}
                                title={isFav ? 'Remover dos favoritos' : 'Favoritar time (ver primeiro no feed & ativar alertas)'}
                                className={`p-2 rounded-lg border text-xs transition-all cursor-pointer flex items-center gap-1 ${
                                  isFav
                                    ? 'bg-amber-500 text-black font-black border-amber-400 shadow'
                                    : 'bg-green-950/40 text-slate-400 border-green-900/40 hover:text-amber-300'
                                }`}
                              >
                                <Star className={`h-4 w-4 ${isFav ? 'fill-black' : ''}`} />
                              </button>

                              {/* Division filter dropdown expand */}
                              <button
                                onClick={() => setExpandedTeamConfig(isExpanded ? null : team.name)}
                                title="Configurar divisões de notificação"
                                className="p-2 rounded-lg bg-green-950/30 text-green-400 hover:text-white border border-green-900/40 transition-all cursor-pointer"
                              >
                                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </button>
                            </div>
                          </div>

                          {/* Expanded division configuration for this team */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="border-t border-green-900/40 bg-[#010603] p-3.5 space-y-3 rounded-b-lg"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] font-bold text-green-300 uppercase tracking-wider flex items-center gap-1.5">
                                    <Sliders className="h-3.5 w-3.5 text-seagreen" />
                                    Divisões para receber notificação do {team.name}:
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleSetAllDivisions(team.name, true)}
                                      className="text-[10px] text-seagreen hover:underline font-bold cursor-pointer"
                                    >
                                      Todas
                                    </button>
                                    <span className="text-green-800">•</span>
                                    <button
                                      type="button"
                                      onClick={() => handleSetAllDivisions(team.name, false)}
                                      className="text-[10px] text-green-500 hover:underline cursor-pointer"
                                    >
                                      Só Série A
                                    </button>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                  {allDivisions.map(div => {
                                    const isSelected = !hasSpecificDivisions || (config?.divisions || []).includes(div);
                                    const isLibertadores = div.toLowerCase().includes('libertadores');

                                    return (
                                      <button
                                        key={div}
                                        type="button"
                                        onClick={() => handleToggleTeamDivision(team.name, div)}
                                        className={`px-2.5 py-1.5 rounded text-[10px] font-bold border transition-all text-left flex items-center justify-between cursor-pointer ${
                                          isSelected
                                            ? isLibertadores
                                              ? 'bg-amber-950/80 text-amber-300 border-amber-500/50'
                                              : 'bg-seagreen/20 text-white border-seagreen/50'
                                            : 'bg-[#020704] text-slate-500 border-green-950/60 hover:text-slate-300'
                                        }`}
                                      >
                                        <span className="truncate">{div}</span>
                                        {isSelected && <Check className="h-3 w-3 text-seagreen shrink-0 ml-1" />}
                                      </button>
                                    );
                                  })}
                                </div>

                                {/* Timing Selector */}
                                <div className="pt-2 border-t border-green-950/60 flex items-center justify-between text-[11px]">
                                  <span className="text-green-400">Tempo de antecedência:</span>
                                  <div className="flex items-center gap-1.5">
                                    {[
                                      { label: 'No início', value: 0 },
                                      { label: '15 min antes', value: 15 },
                                      { label: '30 min antes', value: 30 },
                                    ].map(item => (
                                      <button
                                        key={item.value}
                                        onClick={() => handleSetTiming(team.name, item.value)}
                                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                                          (config?.notifyBeforeMinutes ?? 15) === item.value
                                            ? 'bg-seagreen text-white border-seagreen'
                                            : 'bg-green-950/40 text-green-400 border-green-900/40 hover:text-white'
                                        }`}
                                      >
                                        {item.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: FILTRO GLOBAL POR DIVISÕES */}
            {activeTab === 'divisions' && (
              <div className="space-y-4">
                <div className="p-4 bg-[#020704] border border-green-950 rounded-lg space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-seagreen" />
                    Gerenciamento Rápido de Notificações por Time
                  </h4>
                  <p className="text-xs text-green-300/80 leading-relaxed">
                    Você pode escolher exatamente quais competições geram alertas no seu relógio e celular para cada clube. Por exemplo, você pode acompanhar a <strong>Série A</strong> e <strong>Libertadores</strong> do seu time principal, desativando alertas de categorias de base se preferir.
                  </p>
                </div>

                <div className="space-y-3">
                  {preferences.favoriteTeams.length === 0 ? (
                    <div className="p-8 text-center bg-[#020704] rounded-lg border border-green-950 text-xs text-green-400">
                      Você ainda não favoritou nenhum time. Adicione times na aba "Times & Alertas" para configurar divisões específicas.
                    </div>
                  ) : (
                    preferences.favoriteTeams.map(favTeam => {
                      const config = preferences.notificationConfigs[favTeam];
                      const selectedDivs = config?.divisions || [];
                      const isAll = selectedDivs.length === 0;

                      return (
                        <div key={favTeam} className="p-4 bg-[#020704] border border-green-900/50 rounded-lg space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white flex items-center gap-2">
                              <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                              {favTeam}
                            </span>
                            <span className="text-[10px] text-seagreen font-mono">
                              {isAll ? 'Todas as competições ativas' : `${selectedDivs.length} divisões ativas`}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {allDivisions.map(div => {
                              const isChecked = isAll || selectedDivs.includes(div);
                              return (
                                <button
                                  key={div}
                                  type="button"
                                  onClick={() => handleToggleTeamDivision(favTeam, div)}
                                  className={`px-3 py-1.5 rounded text-xs font-bold border transition-all text-left flex items-center justify-between cursor-pointer ${
                                    isChecked
                                      ? 'bg-seagreen/20 text-white border-seagreen/50'
                                      : 'bg-[#05140d] text-slate-500 border-green-950'
                                  }`}
                                >
                                  <span className="truncate">{div}</span>
                                  {isChecked && <Check className="h-3.5 w-3.5 text-seagreen shrink-0" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: SMARTWATCH & SINCRONIZAÇÃO */}
            {activeTab === 'smartwatch' && (
              <div className="space-y-4">
                {/* Visual Devices Banner */}
                <div className="p-5 bg-gradient-to-r from-[#03140a] via-[#072417] to-[#03140a] border border-green-800/60 rounded-xl space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-12 rounded-xl bg-sky-950/60 border border-sky-500/40 flex items-center justify-center text-sky-400 shadow-md">
                        <Watch className="h-6 w-6 animate-bounce" />
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-seagreen/20 border border-seagreen/40 flex items-center justify-center text-seagreen shadow-md">
                        <Smartphone className="h-6 w-6" />
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white uppercase tracking-tight flex items-center gap-2">
                        Integração Smartwatch & Mobile
                        <Sparkles className="h-4 w-4 text-amber-400" />
                      </h4>
                      <p className="text-xs text-green-300/90 mt-0.5">
                        Compatível com <strong>Apple Watch</strong>, <strong>Galaxy Watch (Wear OS)</strong>, <strong>Garmin</strong> e <strong>Smartbands</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-[#020704]/70 border border-green-950 rounded-lg text-xs text-green-200/90 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-white">
                      <ShieldCheck className="h-4 w-4 text-seagreen" />
                      Como funciona o espelhamento no seu relógio:
                    </div>
                    <p className="leading-relaxed">
                      Ao habilitar notificações no seu navegador do celular (Chrome no Android ou Safari no iOS), o sistema operacional do telefone encaminha instantaneamente o alerta com <strong>vibração háptica e som</strong> para o relógio conectado no pulso.
                    </p>
                  </div>
                </div>

                {/* Permission Box & Test Trigger */}
                <div className="p-4 bg-[#020704] border border-green-950 rounded-lg space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-white uppercase tracking-wider block">
                        Status das Notificações no Navegador:
                      </span>
                      <span className="text-xs font-mono font-bold mt-1 inline-flex items-center gap-1.5">
                        {notificationStatus === 'granted' ? (
                          <span className="text-seagreen flex items-center gap-1">
                            <Check className="h-3.5 w-3.5" /> Permissão Concedida (Pronto para receber alertas)
                          </span>
                        ) : notificationStatus === 'denied' ? (
                          <span className="text-red-400 flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5" /> Bloqueada nas configurações do navegador
                          </span>
                        ) : (
                          <span className="text-amber-400 flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5" /> Permissão pendente de autorização
                          </span>
                        )}
                      </span>
                    </div>

                    {notificationStatus !== 'granted' && (
                      <button
                        onClick={handleRequestPermission}
                        className="px-4 py-2 bg-seagreen text-white text-xs font-bold rounded-lg hover:bg-seagreen-solid hover:text-black transition-all cursor-pointer uppercase tracking-wider shrink-0 flex items-center gap-2 shadow"
                      >
                        <Bell className="h-4 w-4" />
                        Pedir Permissão Agora
                      </button>
                    )}
                  </div>

                  {/* Test Notification Trigger */}
                  <div className="pt-3 border-t border-green-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-xs text-green-400">
                      Envie um alerta agora mesmo para confirmar se seu celular e relógio estão vibrando e tocando.
                    </div>
                    <button
                      onClick={() => handleSendTest(preferences.favoriteTeams[0])}
                      disabled={testSent}
                      className="px-4 py-2 bg-sky-600/30 hover:bg-sky-600 text-sky-300 hover:text-white border border-sky-500/40 text-xs font-bold rounded-lg transition-all cursor-pointer uppercase tracking-wider shrink-0 flex items-center gap-2"
                    >
                      <Zap className={`h-4 w-4 ${testSent ? 'animate-spin' : ''}`} />
                      {testSent ? 'Enviando Notificação...' : 'Testar no Relógio / Celular'}
                    </button>
                  </div>

                  {testResultMessage && (
                    <div className="p-2.5 rounded bg-[#05140d] border border-sky-500/30 text-sky-300 text-xs flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-sky-400 shrink-0" />
                      <span>{testResultMessage}</span>
                    </div>
                  )}
                </div>

                {/* Feed Ordering Option */}
                <div className="p-4 bg-[#020704] border border-green-950 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white uppercase tracking-wider block">
                      Prioridade Máxima no Feed
                    </span>
                    <span className="text-xs text-green-400/80">
                      Fixa os jogos dos seus times favoritos sempre na primeira posição da lista de transmissões.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.notificationsGlobalEnabled}
                    onChange={e => {
                      onUpdatePreferences({
                        ...preferences,
                        notificationsGlobalEnabled: e.target.checked,
                      });
                    }}
                    className="w-5 h-5 accent-seagreen cursor-pointer"
                  />
                </div>
              </div>
            )}

          </div>

          {/* Modal Footer */}
          <div className="p-4 bg-[#020704] border-t border-green-950 flex items-center justify-between shrink-0">
            <div className="text-[11px] text-green-500 font-mono">
              {preferences.favoriteTeams.length} {preferences.favoriteTeams.length === 1 ? 'time favorito selecionado' : 'times favoritos selecionados'}
            </div>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-seagreen text-white text-xs font-bold rounded-lg hover:bg-seagreen-solid hover:text-black transition-all cursor-pointer uppercase tracking-wider"
            >
              Concluir & Salvar
            </button>
          </div>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
