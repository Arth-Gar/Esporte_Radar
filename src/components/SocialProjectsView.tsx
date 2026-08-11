import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MapPin, 
  Phone, 
  MessageSquare, 
  Plus, 
  Building2, 
  Users, 
  Check, 
  Copy, 
  Clock, 
  Heart, 
  X, 
  ExternalLink,
  ShieldCheck,
  Award,
  Sparkles,
  Lock,
  KeyRound,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Trash2,
  FileCheck,
  ShieldAlert,
  SlidersHorizontal
} from 'lucide-react';
import { SocialProject } from '../types';
import { SOCIAL_PROJECTS } from '../data/socialProjects';

interface StoredProject extends SocialProject {
  status?: 'approved' | 'pending';
  createdAt?: string;
  submitterIp?: string;
}

export function SocialProjectsView() {
  const [projects, setProjects] = useState<StoredProject[]>(SOCIAL_PROJECTS);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('Tudo');
  const [selectedSport, setSelectedSport] = useState<string>('Tudo');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal State for New Suggestion
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSuccessMessage, setFormSuccessMessage] = useState<string | null>(null);
  const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null);

  // Anti-DDoS CAPTCHA & Honeypot state
  const [numA, setNumA] = useState(3);
  const [numB, setNumB] = useState(4);
  const [userCaptcha, setUserCaptcha] = useState('');
  const [honeypotWebsite, setHoneypotWebsite] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    title: '',
    sport: 'Jiu-Jitsu',
    neighborhood: '',
    city: 'Rio de Janeiro - RJ',
    address: '',
    phone: '',
    whatsapp: '',
    organization: '',
    targetPublic: 'Crianças, Jovens e Adultos',
    schedule: '',
    price: 'Totalmente Gratuito',
    description: '',
    requirements: 'Aberto ao público. Trazer documento com foto.'
  });

  // Admin Modal & Approval State
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [activeAdminPin, setActiveAdminPin] = useState<string | null>(() => localStorage.getItem('admin_session_pin'));
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => !!localStorage.getItem('admin_session_pin'));
  const [adminAuthError, setAdminAuthError] = useState<string | null>(null);

  const [pendingProjects, setPendingProjects] = useState<StoredProject[]>([]);
  const [approvedAdminProjects, setApprovedAdminProjects] = useState<StoredProject[]>([]);
  const [adminTab, setAdminTab] = useState<'pending' | 'approved' | 'ddos'>('pending');
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminActionSuccess, setAdminActionSuccess] = useState<string | null>(null);

  // Fetch public approved projects
  const fetchApprovedProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/projetos-sociais');
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        setProjects(json.data);
      } else {
        setProjects(SOCIAL_PROJECTS);
      }
    } catch (err) {
      console.error('Erro ao carregar projetos sociais:', err);
      setProjects(SOCIAL_PROJECTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovedProjects();
  }, []);

  // Generate new math CAPTCHA
  const generateCaptcha = () => {
    const a = Math.floor(Math.random() * 8) + 1;
    const b = Math.floor(Math.random() * 8) + 1;
    setNumA(a);
    setNumB(b);
    setUserCaptcha('');
  };

  const handleOpenAddModal = () => {
    generateCaptcha();
    setFormSuccessMessage(null);
    setFormErrorMessage(null);
    setHoneypotWebsite('');
    setShowAddModal(true);
  };

  // Submit project for admin review
  const handleSubmitSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrorMessage(null);
    setFormSuccessMessage(null);

    // Frontend captcha check
    if (parseInt(userCaptcha.trim(), 10) !== numA + numB) {
      setFormErrorMessage('Resposta incorreta do desafio de verificação humana.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/projetos-sociais/sugerir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          honeypot_website: honeypotWebsite,
          captchaAnswer: userCaptcha.trim(),
          captchaExpected: numA + numB
        })
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Erro ao enviar projeto para análise.');
      }

      setFormSuccessMessage(json.message || 'Projeto enviado com sucesso para aprovação do administrador!');
      
      // Reset form after delay
      setTimeout(() => {
        setShowAddModal(false);
        setFormSuccessMessage(null);
        setFormData({
          title: '',
          sport: 'Jiu-Jitsu',
          neighborhood: '',
          city: 'Rio de Janeiro - RJ',
          address: '',
          phone: '',
          whatsapp: '',
          organization: '',
          targetPublic: 'Crianças, Jovens e Adultos',
          schedule: '',
          price: 'Totalmente Gratuito',
          description: '',
          requirements: 'Aberto ao público. Trazer documento com foto.'
        });
      }, 2500);
    } catch (err: any) {
      setFormErrorMessage(err.message || 'Erro de conexão.');
      generateCaptcha();
    } finally {
      setIsSubmitting(false);
    }
  };

  // ADMIN AUTH & MANAGEMENT
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminAuthError(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: adminPin })
      });
      const json = await res.json();

      if (res.ok && json.success) {
        setIsAdminLoggedIn(true);
        setActiveAdminPin(adminPin);
        localStorage.setItem('admin_session_pin', adminPin);
        fetchAdminPending(adminPin);
      } else {
        setAdminAuthError(json.error || 'PIN incorreto.');
      }
    } catch (err) {
      setAdminAuthError('Erro ao autenticar administrador.');
    }
  };

  const fetchAdminPending = async (pinToUse?: string) => {
    const pin = pinToUse || activeAdminPin;
    if (!pin) return;

    setAdminLoading(true);
    try {
      const res = await fetch('/api/admin/projetos-pendentes', {
        headers: { 'x-admin-pin': pin }
      });
      const json = await res.json();
      if (json.success) {
        setPendingProjects(json.pending || []);
        setApprovedAdminProjects(json.approved || []);
      }
    } catch (err) {
      console.error('Erro ao carregar dados do admin:', err);
    } finally {
      setAdminLoading(false);
    }
  };

  const handleApproveProject = async (id: string) => {
    if (!activeAdminPin) return;
    setAdminActionSuccess(null);

    try {
      const res = await fetch('/api/admin/aprovar-projeto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': activeAdminPin
        },
        body: JSON.stringify({ id })
      });

      const json = await res.json();
      if (json.success) {
        setAdminActionSuccess('Projeto APROVADO e publicado com sucesso!');
        fetchAdminPending();
        fetchApprovedProjects(); // Refresh public list
        setTimeout(() => setAdminActionSuccess(null), 3000);
      } else {
        alert(json.error || 'Erro ao aprovar projeto.');
      }
    } catch (err) {
      alert('Erro de conexão ao aprovar projeto.');
    }
  };

  const handleRejectProject = async (id: string) => {
    if (!activeAdminPin) return;
    if (!confirm('Deseja realmente remover/rejeitar este projeto?')) return;
    setAdminActionSuccess(null);

    try {
      const res = await fetch('/api/admin/rejeitar-projeto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': activeAdminPin
        },
        body: JSON.stringify({ id })
      });

      const json = await res.json();
      if (json.success) {
        setAdminActionSuccess('Projeto removido com sucesso!');
        fetchAdminPending();
        fetchApprovedProjects();
        setTimeout(() => setAdminActionSuccess(null), 3000);
      } else {
        alert(json.error || 'Erro ao remover projeto.');
      }
    } catch (err) {
      alert('Erro de conexão ao remover projeto.');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    setActiveAdminPin(null);
    localStorage.removeItem('admin_session_pin');
    setAdminPin('');
  };

  // Filter dropdowns
  const neighborhoods = ['Tudo', ...Array.from(new Set(projects.map(p => p.neighborhood)))];
  const sports = ['Tudo', ...Array.from(new Set(projects.map(p => p.sport)))];

  const filteredProjects = projects.filter(project => {
    const matchesNeighborhood = selectedNeighborhood === 'Tudo' || project.neighborhood === selectedNeighborhood;
    const matchesSport = selectedSport === 'Tudo' || project.sport === selectedSport;
    
    const searchLower = searchTerm.trim().toLowerCase();
    const matchesSearch = !searchLower || 
      project.title.toLowerCase().includes(searchLower) ||
      project.neighborhood.toLowerCase().includes(searchLower) ||
      project.city.toLowerCase().includes(searchLower) ||
      project.address.toLowerCase().includes(searchLower) ||
      project.organization.toLowerCase().includes(searchLower) ||
      project.sport.toLowerCase().includes(searchLower);

    return matchesNeighborhood && matchesSport && matchesSearch;
  });

  const handleCopyAddress = (project: SocialProject) => {
    const fullText = `${project.title} - ${project.address}, ${project.neighborhood}, ${project.city}. Tel/WhatsApp: ${project.phone}`;
    navigator.clipboard.writeText(fullText);
    setCopiedId(project.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER BANNER */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#031c0e] via-[#052b16] to-[#011409] border border-green-900/60 p-6 md:p-8 shadow-xl">
        <div className="relative z-10 space-y-3 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-seagreen/20 border border-seagreen/40 text-seagreen text-xs font-black uppercase tracking-wider">
              <Heart className="h-3.5 w-3.5 fill-current animate-pulse" />
              <span>Esporte Solidário & Inclusão Social</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/40 text-emerald-400 text-[10px] font-mono">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Aprovação Humana & Proteção Anti-DDoS</span>
            </div>
          </div>

          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase">
            Atividades Esportivas Filantrópicas nos Bairros
          </h2>

          <p className="text-xs md:text-sm text-green-300 leading-relaxed font-normal">
            Encontre locais com <strong className="text-seagreen font-bold">treinos gratuitos de Jiu-Jitsu em igrejas</strong>, escolinhas comunitárias de futebol para crianças, judô e capoeira. Todas as sugestões enviadas passam por <strong className="text-white">análise e aprovação do administrador</strong> para garantir a veracidade dos locais e contatos.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-seagreen text-white text-xs font-black uppercase tracking-wider hover:bg-seagreen-solid hover:text-black transition-all shadow-lg hover:shadow-seagreen/20 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Sugerir Igreja ou Projeto Social</span>
            </button>

            <button
              onClick={() => {
                setShowAdminModal(true);
                if (isAdminLoggedIn) fetchAdminPending();
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#082215] hover:bg-[#0e3320] border border-green-800/60 text-green-200 hover:text-white text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer"
            >
              <Lock className="h-3.5 w-3.5 text-seagreen" />
              <span>Painel do Administrador</span>
              {pendingProjects.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber-500 text-black font-black text-[10px] flex items-center justify-center animate-bounce">
                  {pendingProjects.length}
                </span>
              )}
            </button>

            <span className="text-xs text-green-400/80 font-mono flex items-center gap-1.5 bg-[#020d06] px-3 py-2 rounded-lg border border-green-950">
              <CheckCircle2 className="h-4 w-4 text-seagreen" />
              <span>{projects.length} Locais Aprovados</span>
            </span>
          </div>
        </div>

        {/* Decorative background overlay */}
        <div className="absolute right-[-20px] bottom-[-20px] text-green-900/10 pointer-events-none select-none">
          <Heart className="h-64 w-64" />
        </div>
      </div>

      {/* FILTERS & SEARCH */}
      <div className="p-4 rounded-xl bg-[#05140d] border border-green-950/80 space-y-4 shadow-lg">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          
          {/* SEARCH INPUT */}
          <div className="relative w-full md:w-1/2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-green-600" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por bairro, igreja, projeto, modalidade..."
              className="w-full bg-[#081f13] border border-green-900/60 text-xs rounded-lg pl-9 pr-3 py-2.5 text-white placeholder:text-green-700 focus:ring-1 focus:ring-seagreen focus:border-seagreen outline-none transition-all"
            />
          </div>

          {/* DROPDOWN FILTERS */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            {/* Neighborhood Filter */}
            <div className="w-1/2 md:w-48">
              <select
                value={selectedNeighborhood}
                onChange={e => setSelectedNeighborhood(e.target.value)}
                className="w-full bg-[#081f13] border-none text-xs rounded-lg px-3 py-2.5 text-white focus:ring-1 focus:ring-seagreen outline-none cursor-pointer uppercase tracking-wider font-semibold"
              >
                <option value="Tudo" className="uppercase bg-[#081f13]">📍 Todos os Bairros</option>
                {neighborhoods.filter(n => n !== 'Tudo').map(n => (
                  <option key={n} value={n} className="uppercase bg-[#081f13]">Bairro: {n}</option>
                ))}
              </select>
            </div>

            {/* Sport Filter */}
            <div className="w-1/2 md:w-48">
              <select
                value={selectedSport}
                onChange={e => setSelectedSport(e.target.value)}
                className="w-full bg-[#081f13] border-none text-xs rounded-lg px-3 py-2.5 text-white focus:ring-1 focus:ring-seagreen outline-none cursor-pointer uppercase tracking-wider font-semibold"
              >
                <option value="Tudo" className="uppercase bg-[#081f13]">🥋 Todas Modalidades</option>
                {sports.filter(s => s !== 'Tudo').map(s => (
                  <option key={s} value={s} className="uppercase bg-[#081f13]">{s}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ACTIVE FILTER TAGS */}
        {(selectedNeighborhood !== 'Tudo' || selectedSport !== 'Tudo' || searchTerm) && (
          <div className="flex items-center gap-2 pt-1 border-t border-green-950/60 text-[11px] text-green-400">
            <span className="font-bold text-seagreen uppercase tracking-wider">Filtros Ativos:</span>
            {selectedNeighborhood !== 'Tudo' && (
              <span className="px-2 py-0.5 rounded bg-green-950 text-green-300 border border-green-800/40">
                Bairro: {selectedNeighborhood}
              </span>
            )}
            {selectedSport !== 'Tudo' && (
              <span className="px-2 py-0.5 rounded bg-green-950 text-green-300 border border-green-800/40">
                Modalidade: {selectedSport}
              </span>
            )}
            {searchTerm && (
              <span className="px-2 py-0.5 rounded bg-green-950 text-green-300 border border-green-800/40">
                Busca: "{searchTerm}"
              </span>
            )}
            <button
              onClick={() => {
                setSelectedNeighborhood('Tudo');
                setSelectedSport('Tudo');
                setSearchTerm('');
              }}
              className="ml-auto text-xs text-seagreen font-bold hover:underline cursor-pointer"
            >
              Limpar Filtros
            </button>
          </div>
        )}
      </div>

      {/* PROJECTS LIST GRID */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-seagreen border-t-transparent animate-spin mx-auto"></div>
          <p className="text-xs text-green-400 font-mono">Carregando projetos filantrópicos aprovados...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-[#05140d] border border-green-950 space-y-3">
          <Heart className="h-10 w-10 text-seagreen mx-auto opacity-80" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Nenhum Projeto Encontrado</h3>
          <p className="text-xs text-green-400/80 max-w-md mx-auto">
            Não encontramos atividades esportivas filantrópicas para os filtros selecionados. Tente alterar o bairro ou busque por outro termo.
          </p>
          <button
            onClick={() => {
              setSelectedNeighborhood('Tudo');
              setSelectedSport('Tudo');
              setSearchTerm('');
            }}
            className="px-4 py-2 bg-seagreen text-white text-xs font-bold rounded-lg hover:bg-seagreen-solid hover:text-black transition-all cursor-pointer uppercase tracking-wider"
          >
            Ver Todos os Projetos
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProjects.map(project => {
            const cleanPhone = project.phone.replace(/\D/g, '');
            const whatsappNum = project.whatsapp ? project.whatsapp.replace(/\D/g, '') : cleanPhone;

            return (
              <div
                key={project.id}
                className="bg-[#05140d] border border-green-950/80 hover:border-seagreen/60 rounded-xl p-5 space-y-4 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-seagreen/5 group"
              >
                <div className="space-y-3">
                  {/* CARD HEADER BADGES */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-seagreen text-white tracking-wider shadow-sm">
                      <Sparkles className="h-3 w-3" />
                      {project.price}
                    </span>

                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-[#092416] text-seagreen border border-green-900/60">
                      {project.sport}
                    </span>
                  </div>

                  {/* TITLE & ORGANIZATION */}
                  <div>
                    <h3 className="text-base font-extrabold text-white group-hover:text-seagreen transition-colors tracking-tight">
                      {project.title}
                    </h3>
                    <p className="text-xs text-green-300/90 font-medium flex items-center gap-1.5 mt-0.5">
                      <Building2 className="h-3.5 w-3.5 text-seagreen shrink-0" />
                      <span>{project.organization}</span>
                    </p>
                  </div>

                  {/* ADDRESS & LOCATION */}
                  <div className="p-3 rounded-lg bg-[#020b06] border border-green-950/60 space-y-1.5 text-xs">
                    <div className="flex items-start gap-2 text-white font-medium">
                      <MapPin className="h-4 w-4 text-seagreen shrink-0 mt-0.5" />
                      <div className="leading-snug">
                        <span className="font-extrabold text-seagreen">{project.neighborhood}</span> • {project.city}
                        <p className="text-green-400/90 text-[11px] font-mono mt-0.5">{project.address}</p>
                      </div>
                    </div>
                  </div>

                  {/* SCHEDULE & TARGET PUBLIC */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded bg-[#081f13] border border-green-900/40 text-green-300">
                      <span className="text-[10px] font-bold text-seagreen uppercase tracking-wider block flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Dias e Horários
                      </span>
                      <p className="text-[11px] leading-tight font-sans mt-0.5">{project.schedule}</p>
                    </div>

                    <div className="p-2.5 rounded bg-[#081f13] border border-green-900/40 text-green-300">
                      <span className="text-[10px] font-bold text-seagreen uppercase tracking-wider block flex items-center gap-1">
                        <Users className="h-3 w-3" /> Público-Alvo
                      </span>
                      <p className="text-[11px] leading-tight font-sans mt-0.5">{project.targetPublic}</p>
                    </div>
                  </div>

                  {/* REQUIREMENTS & DESCRIPTION */}
                  <p className="text-xs text-green-400/90 leading-relaxed font-sans bg-[#031109] p-2.5 rounded border border-green-950/40">
                    <strong className="text-white">Descrição:</strong> {project.description}
                  </p>

                  <div className="text-[11px] text-green-400/80 bg-[#081f13]/40 p-2 rounded border border-green-950/40">
                    <strong className="text-seagreen">Requisitos:</strong> {project.requirements}
                  </div>
                </div>

                {/* CARD ACTIONS / CONTACT BUTTONS */}
                <div className="pt-3 border-t border-green-950/80 flex flex-wrap items-center gap-2">
                  <a
                    href={`https://wa.me/${whatsappNum}?text=Ol%C3%A1!%20Vi%20o%20projeto%20${encodeURIComponent(project.title)}%20no%20Esporte%20Radar%20e%20gostaria%20de%20mais%20informa%C3%A7%C3%B5es.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
                  >
                    <MessageSquare className="h-3.5 w-3.5 fill-current" />
                    <span>WhatsApp</span>
                  </a>

                  <a
                    href={`tel:${cleanPhone}`}
                    className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-[#082215] hover:bg-[#0e3320] border border-green-900/60 text-green-200 hover:text-white text-xs font-bold transition-all cursor-pointer"
                  >
                    <Phone className="h-3.5 w-3.5 text-seagreen" />
                    <span>Ligar</span>
                  </a>

                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${project.address}, ${project.neighborhood}, ${project.city}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center p-2 rounded-lg bg-[#082215] hover:bg-[#0e3320] border border-green-900/60 text-green-300 hover:text-white text-xs transition-all cursor-pointer"
                    title="Ver no Google Maps"
                  >
                    <ExternalLink className="h-4 w-4 text-seagreen" />
                  </a>

                  <button
                    onClick={() => handleCopyAddress(project)}
                    className="inline-flex items-center justify-center p-2 rounded-lg bg-[#082215] hover:bg-[#0e3320] border border-green-900/60 text-green-300 hover:text-white text-xs transition-all cursor-pointer"
                    title="Copiar informações do projeto"
                  >
                    {copiedId === project.id ? (
                      <Check className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Copy className="h-4 w-4 text-seagreen" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PUBLIC SUGGESTION MODAL (WITH DDOS & CAPTCHA PROTECTION) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#05180f] border border-green-900 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl relative my-8">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute right-4 top-4 text-green-600 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-seagreen text-xs font-black uppercase tracking-wider">
                <Heart className="h-4 w-4 fill-current" />
                <span>Sugestão de Projeto Comunitário</span>
              </div>
              <h3 className="text-xl font-extrabold text-white tracking-tight">
                Sugerir Novo Projeto Esportivo ou Igreja
              </h3>
              <p className="text-xs text-green-400/80">
                Seu cadastro será enviado para o <strong className="text-white">administrador</strong> para verificação antes de ser publicado no site.
              </p>
            </div>

            {formSuccessMessage ? (
              <div className="py-8 text-center space-y-3 bg-[#031109] rounded-xl p-6 border border-emerald-800/60">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h4 className="text-base font-extrabold text-white">Sugestão Enviada com Sucesso!</h4>
                <p className="text-xs text-green-300 leading-relaxed max-w-md mx-auto">
                  {formSuccessMessage}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitSuggestion} className="space-y-3 text-xs">
                {formErrorMessage && (
                  <div className="p-3 rounded-lg bg-red-950/80 border border-red-800 text-red-200 text-xs font-medium flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{formErrorMessage}</span>
                  </div>
                )}

                {/* INVISIBLE HONEYPOT FIELD FOR BOT/DDOS PROTECTION */}
                <div className="hidden" aria-hidden="true">
                  <input
                    type="text"
                    name="honeypot_website"
                    tabIndex={-1}
                    value={honeypotWebsite}
                    onChange={e => setHoneypotWebsite(e.target.value)}
                    autoComplete="off"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-green-400 font-bold mb-1">Nome do Projeto *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Jiu-Jitsu com Cristo"
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      className="w-full bg-[#031109] border border-green-900 rounded p-2.5 text-white outline-none focus:border-seagreen"
                    />
                  </div>

                  <div>
                    <label className="block text-green-400 font-bold mb-1">Modalidade *</label>
                    <select
                      value={formData.sport}
                      onChange={e => setFormData({ ...formData, sport: e.target.value })}
                      className="w-full bg-[#031109] border border-green-900 rounded p-2.5 text-white outline-none focus:border-seagreen cursor-pointer"
                    >
                      <option value="Jiu-Jitsu">Jiu-Jitsu</option>
                      <option value="Escolinha de Futebol">Escolinha de Futebol</option>
                      <option value="Judô Comunitário">Judô Comunitário</option>
                      <option value="Capoeira & Artes">Capoeira & Artes</option>
                      <option value="Basquete de Rua">Basquete de Rua</option>
                      <option value="Vôlei Comunitário">Vôlei Comunitário</option>
                      <option value="Outra Modalidade">Outra Modalidade</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-green-400 font-bold mb-1">Igreja / Organização *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Igreja Batista Central do Bairro"
                      value={formData.organization}
                      onChange={e => setFormData({ ...formData, organization: e.target.value })}
                      className="w-full bg-[#031109] border border-green-900 rounded p-2.5 text-white outline-none focus:border-seagreen"
                    />
                  </div>

                  <div>
                    <label className="block text-green-400 font-bold mb-1">Bairro *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Copacabana, Tijuca, Tatuapé"
                      value={formData.neighborhood}
                      onChange={e => setFormData({ ...formData, neighborhood: e.target.value })}
                      className="w-full bg-[#031109] border border-green-900 rounded p-2.5 text-white outline-none focus:border-seagreen"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-green-400 font-bold mb-1">Cidade - Estado *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Rio de Janeiro - RJ"
                      value={formData.city}
                      onChange={e => setFormData({ ...formData, city: e.target.value })}
                      className="w-full bg-[#031109] border border-green-900 rounded p-2.5 text-white outline-none focus:border-seagreen"
                    />
                  </div>

                  <div>
                    <label className="block text-green-400 font-bold mb-1">Telefone / WhatsApp *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: (21) 99999-8888"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-[#031109] border border-green-900 rounded p-2.5 text-white outline-none focus:border-seagreen"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-green-400 font-bold mb-1">Endereço Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Rua das Flores, 120 - Anexo Igreja"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    className="w-full bg-[#031109] border border-green-900 rounded p-2.5 text-white outline-none focus:border-seagreen"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-green-400 font-bold mb-1">Dias e Horários</label>
                    <input
                      type="text"
                      placeholder="Ex: Terças e Quintas às 19h"
                      value={formData.schedule}
                      onChange={e => setFormData({ ...formData, schedule: e.target.value })}
                      className="w-full bg-[#031109] border border-green-900 rounded p-2.5 text-white outline-none focus:border-seagreen"
                    />
                  </div>

                  <div>
                    <label className="block text-green-400 font-bold mb-1">Público-Alvo</label>
                    <input
                      type="text"
                      placeholder="Ex: Crianças de 6 a 15 anos"
                      value={formData.targetPublic}
                      onChange={e => setFormData({ ...formData, targetPublic: e.target.value })}
                      className="w-full bg-[#031109] border border-green-900 rounded p-2.5 text-white outline-none focus:border-seagreen"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-green-400 font-bold mb-1">Descrição / Detalhes</label>
                  <textarea
                    rows={2}
                    placeholder="Conte mais sobre o projeto, objetivo, se emprestam kimono ou fornecem chuteira..."
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-[#031109] border border-green-900 rounded p-2.5 text-white outline-none focus:border-seagreen resize-none"
                  />
                </div>

                {/* HUMAN CAPTCHA MATH CHALLENGE */}
                <div className="p-3 rounded-lg bg-[#020d06] border border-seagreen/40 space-y-1.5">
                  <div className="flex items-center justify-between text-green-300">
                    <span className="font-bold flex items-center gap-1.5 text-xs text-seagreen">
                      <ShieldAlert className="h-4 w-4" />
                      Verificação Anti-Robô (Segurança):
                    </span>
                    <button
                      type="button"
                      onClick={generateCaptcha}
                      className="text-[10px] text-green-500 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="h-3 w-3" /> Gerar Novo
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-extrabold text-white bg-black/50 px-3 py-1 rounded border border-green-900">
                      Quanto é {numA} + {numB} ?
                    </span>
                    <input
                      type="number"
                      required
                      placeholder="Resposta"
                      value={userCaptcha}
                      onChange={e => setUserCaptcha(e.target.value)}
                      className="w-24 bg-[#081f13] border border-green-900 rounded p-2 text-white font-mono font-bold text-center outline-none focus:border-seagreen"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded bg-green-950 text-green-400 hover:text-white text-xs font-bold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded bg-seagreen text-white hover:bg-seagreen-solid hover:text-black text-xs font-extrabold cursor-pointer transition-all uppercase tracking-wider disabled:opacity-50"
                  >
                    {isSubmitting ? 'Enviando...' : 'Enviar para Análise'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ADMIN PANEL MODAL */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#05180f] border border-green-900 rounded-2xl max-w-3xl w-full p-6 space-y-5 shadow-2xl relative my-8">
            <button
              onClick={() => setShowAdminModal(false)}
              className="absolute right-4 top-4 text-green-600 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            {/* ADMIN HEADER */}
            <div className="flex items-center justify-between border-b border-green-950/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-seagreen/20 border border-seagreen/40 text-seagreen">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-wide flex items-center gap-2">
                    Painel do Administrador
                  </h3>
                  <p className="text-xs text-green-400/80">
                    Aprovação de projetos filantrópicos e monitoramento de segurança
                  </p>
                </div>
              </div>

              {isAdminLoggedIn && (
                <button
                  onClick={handleAdminLogout}
                  className="px-3 py-1.5 rounded bg-red-950/60 hover:bg-red-900 border border-red-800/60 text-red-200 text-xs font-bold cursor-pointer"
                >
                  Sair
                </button>
              )}
            </div>

            {/* IF NOT LOGGED IN: LOGIN FORM */}
            {!isAdminLoggedIn ? (
              <form onSubmit={handleAdminLogin} className="max-w-md mx-auto py-8 space-y-4">
                <div className="text-center space-y-1">
                  <KeyRound className="h-10 w-10 text-seagreen mx-auto" />
                  <h4 className="text-base font-bold text-white">Acesso do Administrador</h4>
                  <p className="text-xs text-green-400/80">
                    Digite a chave de acesso para gerenciar sugestões de projetos e aprovações.
                  </p>
                </div>

                {adminAuthError && (
                  <div className="p-3 rounded bg-red-950/80 border border-red-800 text-red-200 text-xs font-medium text-center">
                    {adminAuthError}
                  </div>
                )}

                <div className="space-y-2">
                  <input
                    type="password"
                    required
                    placeholder="PIN de acesso (Padrão: admin2026)"
                    value={adminPin}
                    onChange={e => setAdminPin(e.target.value)}
                    className="w-full bg-[#031109] border border-green-900 rounded-lg p-3 text-white text-center font-mono text-sm tracking-widest outline-none focus:border-seagreen"
                  />
                  <p className="text-[11px] text-green-500 text-center italic">
                    Dica: Chave padrão configurada no servidor é <code className="text-seagreen font-bold">admin2026</code>
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-lg bg-seagreen hover:bg-seagreen-solid text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg"
                >
                  Entrar no Painel
                </button>
              </form>
            ) : (
              /* LOGGED IN ADMIN DASHBOARD */
              <div className="space-y-4">
                {/* ADMIN TABS */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-green-950/80 pb-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setAdminTab('pending')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                        adminTab === 'pending'
                          ? 'bg-seagreen text-white shadow-md'
                          : 'bg-[#081f13] text-green-400 hover:text-white'
                      }`}
                    >
                      <FileCheck className="h-3.5 w-3.5" />
                      <span>Pendentes</span>
                      {pendingProjects.length > 0 && (
                        <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-400 text-black font-black text-[10px]">
                          {pendingProjects.length}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => setAdminTab('approved')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                        adminTab === 'approved'
                          ? 'bg-seagreen text-white shadow-md'
                          : 'bg-[#081f13] text-green-400 hover:text-white'
                      }`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Ativos no Site ({approvedAdminProjects.length})</span>
                    </button>

                    <button
                      onClick={() => setAdminTab('ddos')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                        adminTab === 'ddos'
                          ? 'bg-seagreen text-white shadow-md'
                          : 'bg-[#081f13] text-green-400 hover:text-white'
                      }`}
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>Proteção DDoS</span>
                    </button>
                  </div>

                  <button
                    onClick={() => fetchAdminPending()}
                    className="p-1.5 rounded bg-[#081f13] hover:bg-[#0d331f] text-green-400 hover:text-white text-xs cursor-pointer"
                    title="Atualizar lista"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>

                {/* FEEDBACK MSG */}
                {adminActionSuccess && (
                  <div className="p-3 rounded bg-emerald-950 border border-emerald-800 text-emerald-200 text-xs font-bold text-center">
                    {adminActionSuccess}
                  </div>
                )}

                {/* TAB 1: PENDING PROJECTS */}
                {adminTab === 'pending' && (
                  <div className="space-y-3">
                    {adminLoading ? (
                      <div className="py-8 text-center text-xs text-green-400 font-mono">
                        Carregando solicitações pendentes...
                      </div>
                    ) : pendingProjects.length === 0 ? (
                      <div className="p-8 text-center bg-[#031109] rounded-xl border border-green-950 space-y-2">
                        <CheckCircle2 className="h-8 w-8 text-seagreen mx-auto" />
                        <h4 className="text-sm font-bold text-white">Nenhuma Solicitação Pendente</h4>
                        <p className="text-xs text-green-400/80">
                          Todos os cadastros enviados pela comunidade já foram analisados e processados.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                        {pendingProjects.map(proj => (
                          <div
                            key={proj.id}
                            className="bg-[#031109] border border-amber-500/40 rounded-xl p-4 space-y-3 relative"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-green-950 pb-2">
                              <div>
                                <span className="inline-block px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold uppercase tracking-wider mb-1">
                                  Aguardando Aprovação
                                </span>
                                <h4 className="text-sm font-bold text-white">{proj.title}</h4>
                                <p className="text-xs text-green-300">{proj.organization} • <strong className="text-seagreen">{proj.sport}</strong></p>
                              </div>

                              <div className="text-right text-[10px] text-green-500 font-mono">
                                <div>Cadastrado em: {new Date(proj.createdAt || '').toLocaleDateString('pt-BR')}</div>
                                {proj.submitterIp && <div>IP Origem: {proj.submitterIp}</div>}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-green-300">
                              <div>📍 <strong>Endereço:</strong> {proj.address}, {proj.neighborhood}</div>
                              <div>📞 <strong>Contato:</strong> {proj.phone} (WhatsApp: {proj.whatsapp})</div>
                              <div>🕒 <strong>Horário:</strong> {proj.schedule}</div>
                              <div>👥 <strong>Público:</strong> {proj.targetPublic}</div>
                            </div>

                            <div className="text-xs text-green-400/90 bg-[#081f13] p-2.5 rounded border border-green-900/40">
                              <strong>Descrição:</strong> {proj.description || 'Nenhuma descrição detalhada fornecida.'}
                            </div>

                            {/* ACTION BUTTONS */}
                            <div className="flex items-center justify-end gap-2 pt-1">
                              <button
                                onClick={() => handleRejectProject(proj.id)}
                                className="px-3 py-1.5 rounded bg-red-950 hover:bg-red-900 border border-red-800 text-red-200 text-xs font-bold cursor-pointer transition-all flex items-center gap-1"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                <span>Rejeitar</span>
                              </button>

                              <button
                                onClick={() => handleApproveProject(proj.id)}
                                className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black cursor-pointer transition-all shadow-md flex items-center gap-1 uppercase tracking-wider"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>Aprovar & Publicar</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: APPROVED PROJECTS */}
                {adminTab === 'approved' && (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {approvedAdminProjects.map(proj => (
                      <div
                        key={proj.id}
                        className="bg-[#031109] border border-green-950 rounded-xl p-3 flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="font-bold text-white">{proj.title}</div>
                          <div className="text-green-400 text-[11px]">
                            {proj.neighborhood} • {proj.organization} • <span className="text-seagreen">{proj.sport}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleRejectProject(proj.id)}
                          className="px-2.5 py-1 rounded bg-red-950/60 hover:bg-red-900 text-red-300 text-[11px] font-bold cursor-pointer border border-red-900/60 flex items-center gap-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Remover</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* TAB 3: DDOS & SECURITY STATS */}
                {adminTab === 'ddos' && (
                  <div className="bg-[#031109] p-5 rounded-xl border border-green-900 space-y-4 text-xs">
                    <div className="flex items-center gap-2 text-seagreen font-bold text-sm">
                      <ShieldCheck className="h-5 w-5" />
                      <span>Status do Sistema Anti-DDoS e Segurança</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-[11px]">
                      <div className="p-3 rounded bg-[#081f13] border border-green-900/60 space-y-1">
                        <span className="text-green-400 block">Rate Limit Global</span>
                        <strong className="text-white text-sm">120 req/min por IP</strong>
                      </div>

                      <div className="p-3 rounded bg-[#081f13] border border-green-900/60 space-y-1">
                        <span className="text-green-400 block">Rate Limit Cadastros</span>
                        <strong className="text-white text-sm">5 envios / 15 min</strong>
                      </div>

                      <div className="p-3 rounded bg-[#081f13] border border-green-900/60 space-y-1">
                        <span className="text-green-400 block">Proteção Bot/Spam</span>
                        <strong className="text-emerald-400 text-sm">Honeypot + Math CAPTCHA</strong>
                      </div>
                    </div>

                    <p className="text-green-300/80 leading-relaxed text-[11px]">
                      Todas as requisições de cadastros passam por sanitização rigorosa de texto, validação matemática no servidor e limite estrito por IP de origem para impedir ataques automatizados de negação de serviço (DDoS) ou inundação por spambots.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
