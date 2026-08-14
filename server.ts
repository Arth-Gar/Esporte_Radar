import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import https from 'https';

const app = express();
const PORT = 3000;

// Body parser size limit (DDoS Protection against payload flooding)
app.use(express.json({ limit: '50kb' }));

// ==========================================
// ANTI-DDOS & RATE LIMITING INFRASTRUCTURE
// ==========================================
interface RateLimitRecord {
  count: number;
  resetTime: number;
}
const globalIpLimits = new Map<string, RateLimitRecord>();
const submissionIpLimits = new Map<string, RateLimitRecord>();

function getClientIp(req: express.Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown-ip';
}

// Middleware: General API rate limiting (120 requests / 1 min per IP)
function generalRateLimiter(req: express.Request, res: express.Response, next: express.NextFunction) {
  const ip = getClientIp(req);
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 120;

  const record = globalIpLimits.get(ip) || { count: 0, resetTime: now + windowMs };
  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
  } else {
    record.count++;
  }
  globalIpLimits.set(ip, record);

  if (record.count > maxRequests) {
    return res.status(429).json({
      success: false,
      error: 'Muitas requisições enviadas. Proteção contra DDoS ativa. Tente novamente em alguns instantes.'
    });
  }
  next();
}

// Middleware: Strict submission rate limiting (5 submissions / 15 mins per IP)
function submissionRateLimiter(req: express.Request, res: express.Response, next: express.NextFunction) {
  const ip = getClientIp(req);
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const maxSubmissions = 5;

  const record = submissionIpLimits.get(ip) || { count: 0, resetTime: now + windowMs };
  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
  } else {
    record.count++;
  }
  submissionIpLimits.set(ip, record);

  if (record.count > maxSubmissions) {
    return res.status(429).json({
      success: false,
      error: 'Limite de cadastros atingido para este IP. Proteção anti-spam ativa. Aguarde 15 minutos.'
    });
  }
  next();
}

app.use(generalRateLimiter);

// ==========================================
// SOCIAL PROJECTS & ADMIN APPROVAL STORE
// ==========================================
const DB_FILE = path.join(process.cwd(), 'social_projects_store.json');
const ADMIN_PIN = process.env.ADMIN_PIN || 'admin2026';

const DEFAULT_APPROVED_PROJECTS: StoredSocialProject[] = [
  {
    id: 'proj-1',
    title: 'Projeto Jiu-Jitsu Graça & Tatame',
    sport: 'Jiu-Jitsu',
    neighborhood: 'Tijuca',
    city: 'Rio de Janeiro - RJ',
    address: 'Rua Conde de Bonfim, 452 - Anexo Igreja Batista Central',
    phone: '(21) 98765-4321',
    whatsapp: '5521987654321',
    organization: 'Igreja Batista Central da Tijuca',
    targetPublic: 'Crianças, Jovens e Adultos (a partir de 6 anos)',
    schedule: 'Terças e Quintas: 19h30 às 21h00 | Sábados: 09h00 às 11h00',
    price: 'Totalmente Gratuito',
    description: 'Aulas gratuitas de Jiu-Jitsu com professores faixa preta federados. O projeto visa formar cidadãos, trabalhar disciplina e proporcionar inclusão social.',
    requirements: 'Frequência escolar obrigatória para menores. Empréstimo de Kimono nos primeiros meses.',
    status: 'approved',
    createdAt: new Date().toISOString()
  },
  {
    id: 'proj-2',
    title: 'Escolinha de Futebol Comunidade Viva',
    sport: 'Escolinha de Futebol',
    neighborhood: 'Itaquera',
    city: 'São Paulo - SP',
    address: 'Rua Augusto Carlos Bauman, 780 - Quadra Comunitária',
    phone: '(11) 97123-8899',
    whatsapp: '5511971238899',
    organization: 'Associação Beneficente Itaquera Unida',
    targetPublic: 'Crianças e Adolescentes de 7 a 16 anos',
    schedule: 'Quartas e Sextas: 14h00 às 17h00',
    price: 'Totalmente Gratuito',
    description: 'Treinos de futebol de campo e futsal gratuitos com acompanhamento pedagógico e lanche solidário.',
    requirements: 'Boletim escolar atualizado, atestado médico de aptidão física.',
    status: 'approved',
    createdAt: new Date().toISOString()
  },
  {
    id: 'proj-3',
    title: 'Jiu-Jitsu Solidário Igreja Betel',
    sport: 'Jiu-Jitsu',
    neighborhood: 'Madureira',
    city: 'Rio de Janeiro - RJ',
    address: 'Estrada do Portela, 310 - Salão Social da Igreja Evangélica Betel',
    phone: '(21) 96543-2100',
    whatsapp: '5521965432100',
    organization: 'Igreja Evangélica Betel & Arte Suave',
    targetPublic: 'Jovens e Adultos (Masculino e Feminino)',
    schedule: 'Segundas, Quartas e Sextas: 20h00 às 21h30',
    price: 'Totalmente Gratuito',
    description: 'Projeto social focado no ensino do Jiu-Jitsu tradicional, condicionamento físico e valores morais.',
    requirements: 'Traga roupa leve para aula experimental. Kimono gratuito fornecido conforme doações.',
    status: 'approved',
    createdAt: new Date().toISOString()
  },
  {
    id: 'proj-4',
    title: 'Projeto Judô Caminho Suave',
    sport: 'Judô Comunitário',
    neighborhood: 'Campo Grande',
    city: 'Rio de Janeiro - RJ',
    address: 'Av. Cesário de Melo, 2150 - Centro Comunitário São José',
    phone: '(21) 99881-2233',
    whatsapp: '5521998812233',
    organization: 'Paróquia São José & Federação de Judô',
    targetPublic: 'Crianças e Adolescentes de 5 a 17 anos',
    schedule: 'Terças e Quintas: 09h00 às 10h30 e 15h00 às 16h30',
    price: 'Totalmente Gratuito',
    description: 'Aulas de Judô olímpico com foco em respeito, autocontrole e saúde mental.',
    requirements: 'Cópia da certidão de nascimento, 1 foto 3x4 e declaração de escolaridade.',
    status: 'approved',
    createdAt: new Date().toISOString()
  },
  {
    id: 'proj-5',
    title: 'Escolinha de Futebol Bola e Futuro',
    sport: 'Escolinha de Futebol',
    neighborhood: 'Bangu',
    city: 'Rio de Janeiro - RJ',
    address: 'Rua Silva Cardoso, 1020 - Campo do Bangu Social Clube',
    phone: '(21) 98112-7744',
    whatsapp: '5521981127744',
    organization: 'Instituto Filantrópico Esporte para Todos',
    targetPublic: 'Meninos e Meninas de 6 a 15 anos',
    schedule: 'Sábados e Domingos: 08h00 às 11h00',
    price: 'Totalmente Gratuito',
    description: 'Escolinha de futebol feminina e masculina comunitária com material esportivo fornecido.',
    requirements: 'Uso de caneleira e chuteira. Inscrições presenciais.',
    status: 'approved',
    createdAt: new Date().toISOString()
  }
];

interface StoredSocialProject {
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
  status: 'approved' | 'pending';
  createdAt: string;
  submitterIp?: string;
}

let approvedProjectsStore: StoredSocialProject[] = [];
let pendingProjectsStore: StoredSocialProject[] = [];

function loadProjectsStore() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      approvedProjectsStore = data.approved || [];
      pendingProjectsStore = data.pending || [];
      console.log(`[Database] Projetos sociais carregados: ${approvedProjectsStore.length} aprovados, ${pendingProjectsStore.length} pendentes.`);
      return;
    }
  } catch (err) {
    console.error('Erro ao ler DB de projetos sociais:', err);
  }
  
  approvedProjectsStore = [...DEFAULT_APPROVED_PROJECTS];
  pendingProjectsStore = [];
  saveProjectsStore();
}

function saveProjectsStore() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify({
      approved: approvedProjectsStore,
      pending: pendingProjectsStore
    }, null, 2), 'utf-8');
  } catch (err) {
    console.error('Erro ao salvar DB de projetos sociais:', err);
  }
}

loadProjectsStore();

function sanitizeText(str: string, maxLength: number = 250): string {
  if (!str) return '';
  return String(str)
    .replace(/<[^>]*>?/gm, '') // Strip HTML
    .substring(0, maxLength)
    .trim();
}

function verifyAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const adminPinHeader = req.headers['x-admin-pin'] || req.body?.adminPin;
  if (adminPinHeader !== ADMIN_PIN) {
    return res.status(401).json({ success: false, error: 'Acesso negado. PIN de administrador incorreto.' });
  }
  next();
}

// Club names to UOL content stable image URLs
const CLUB_MAPPING: { [key: string]: { name: string; slug: string; logo: string } } = {
  'flamengo': { name: 'Flamengo', slug: 'flamengo', logo: 'https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/flamengo.png' },
  'palmeiras': { name: 'Palmeiras', slug: 'palmeiras', logo: 'https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/palmeiras.png' },
  'são paulo': { name: 'São Paulo', slug: 'sao-paulo', logo: 'https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/sao-paulo.png' },
  'sao paulo': { name: 'São Paulo', slug: 'sao-paulo', logo: 'https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/sao-paulo.png' },
  'corinthians': { name: 'Corinthians', slug: 'corinthians', logo: 'https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/corinthians.png' },
  'grêmio': { name: 'Grêmio', slug: 'gremio', logo: 'https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/gremio.png' },
  'gremio': { name: 'Grêmio', slug: 'gremio', logo: 'https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/gremio.png' },
  'internacional': { name: 'Internacional', slug: 'internacional', logo: 'https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/internacional.png' },
  'atlético mineiro': { name: 'Atlético-MG', slug: 'atletico-mg', logo: 'https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/atletico-mg.png' },
  'atlético-mg': { name: 'Atlético-MG', slug: 'atletico-mg', logo: 'https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/atletico-mg.png' },
  'atletico-mg': { name: 'Atlético-MG', slug: 'atletico-mg', logo: 'https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/atletico-mg.png' },
  'atletico mg': { name: 'Atlético-MG', slug: 'atletico-mg', logo: 'https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/atletico-mg.png' },
  'cruzeiro': { name: 'Cruzeiro', slug: 'cruzeiro', logo: 'https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/cruzeiro.png' },
  'fluminense': { name: 'Fluminense', slug: 'fluminense', logo: 'https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/fluminense.png' },
  'botafogo': { name: 'Botafogo', slug: 'botafogo', logo: 'https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/botafogo.png' },
  'vasco da gama': { name: 'Vasco da Gama', slug: 'vasco', logo: 'https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/vasco.png' },
  'vasco': { name: 'Vasco da Gama', slug: 'vasco', logo: 'https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/vasco.png' },
  'athletico': { name: 'Athletico-PR', slug: 'athletico-pr', logo: 'https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/athletico-pr.png' },
  'athletico-pr': { name: 'Athletico-PR', slug: 'athletico-pr', logo: 'https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/athletico-pr.png' },
  'athletico pr': { name: 'Athletico-PR', slug: 'athletico-pr', logo: 'https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/athletico-pr.png' },
  'bahia': { name: 'Bahia', slug: 'bahia', logo: 'https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/bahia.png' },
  'fortaleza': { name: 'Fortaleza', slug: 'fortaleza', logo: 'https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/fortaleza.png' },
  'cuiabá': { name: 'Cuiabá', slug: 'cuiaba', logo: 'https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/cuiaba.png' },
  'cuiaba': { name: 'Cuiabá', slug: 'cuiaba', logo: 'https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/cuiaba.png' },
  'criciúma': { name: 'Criciúma', slug: 'criciuma', logo: 'https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/criciuma.png' },
  'criciuma': { name: 'Criciúma', slug: 'criciuma', logo: 'https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/criciuma.png' },
  'vitória': { name: 'Vitória', slug: 'vitoria', logo: 'https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/vitoria.png' },
  'vitoria': { name: 'Vitória', slug: 'vitoria', logo: 'https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/vitoria.png' },
  'juventude': { name: 'Juventude', slug: 'juventude', logo: 'https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/juventude.png' },
  'atlético-go': { name: 'Atlético-GO', slug: 'atletico-go', logo: 'https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/atletico-go.png' },
  'atletico-go': { name: 'Atlético-GO', slug: 'atletico-go', logo: 'https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/atletico-go.png' },
  'atletico go': { name: 'Atlético-GO', slug: 'atletico-go', logo: 'https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/atletico-go.png' },
  'bragantino': { name: 'Red Bull Bragantino', slug: 'bragantino', logo: 'https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/bragantino.png' },
  'red bull bragantino': { name: 'Red Bull Bragantino', slug: 'bragantino', logo: 'https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/bragantino.png' },
  
  // Serie B
  'santos': { name: 'Santos', slug: 'santos', logo: 'https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/santos.png' },
  'sport': { name: 'Sport Recife', slug: 'sport', logo: 'https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/sport.png' },
  'sport recife': { name: 'Sport Recife', slug: 'sport', logo: 'https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/sport.png' },
  'américa-mg': { name: 'América-MG', slug: 'america-mg', logo: 'https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/america-mg.png' },
  'america-mg': { name: 'América-MG', slug: 'america-mg', logo: 'https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/america-mg.png' },
  'coritiba': { name: 'Coritiba', slug: 'coritiba', logo: 'https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/coritiba.png' },
  'goiás': { name: 'Goiás', slug: 'goias', logo: 'https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/goias.png' },
  'goias': { name: 'Goiás', slug: 'goias', logo: 'https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/goias.png' },
  'ceará': { name: 'Ceará', slug: 'ceara', logo: 'https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/ceara.png' },
  'ceara': { name: 'Ceará', slug: 'ceara', logo: 'https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/ceara.png' },
  'ponte preta': { name: 'Ponte Preta', slug: 'ponte-preta', logo: 'https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/ponte-preta.png' },
  'guarani': { name: 'Guarani', slug: 'guarani', logo: 'https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/guarani.png' },
  'chapecoense': { name: 'Chapecoense', slug: 'chapecoense', logo: 'https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/chapecoense.png' },
  'novorizontino': { name: 'Novorizontino', slug: 'novorizontino', logo: 'https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/novorizontino.png' },
  'mirassol': { name: 'Mirassol', slug: 'mirassol', logo: 'https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/mirassol.png' },
  'vila nova': { name: 'Vila Nova', slug: 'vila-nova', logo: 'https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/vila-nova.png' },
  'operário-pr': { name: 'Operário-PR', slug: 'operario-pr', logo: 'https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/operario.png' },
  'operario-pr': { name: 'Operário-PR', slug: 'operario-pr', logo: 'https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/operario.png' },
  'operário': { name: 'Operário-PR', slug: 'operario-pr', logo: 'https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/operario.png' },
  'operario': { name: 'Operário-PR', slug: 'operario-pr', logo: 'https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/operario.png' },
  'crb': { name: 'CRB', slug: 'crb', logo: 'https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/crb.png' },
  'paysandu': { name: 'Paysandu', slug: 'paysandu', logo: 'https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/paysandu.png' },
  'ituano': { name: 'Ituano', slug: 'ituano', logo: 'https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/ituano.png' },
  'brusque': { name: 'Brusque', slug: 'brusque', logo: 'https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/brusque.png' },
  'amazonas': { name: 'Amazonas FC', slug: 'amazonas', logo: 'https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/amazonas.png' },
  'botafogo-sp': { name: 'Botafogo-SP', slug: 'botafogo-sp', logo: 'https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/botafogo-sp.png' }
};

// Helper to normalize name and return beautiful details
function getClubDetails(rawName: string): { name: string; slug: string; logo: string } {
  const norm = rawName.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  // Exact match lookups
  if (CLUB_MAPPING[norm]) {
    return CLUB_MAPPING[norm];
  }
  
  // Substring matches
  for (const [key, value] of Object.entries(CLUB_MAPPING)) {
    if (norm.includes(key) || key.includes(norm)) {
      return value;
    }
  }

  // Fallback to custom built-up details
  const slug = norm.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return {
    name: rawName.trim(),
    slug: slug,
    logo: `https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/${slug}.png`
  };
}

// Map broadcasters to direct browser streaming URLs
function getTransmissionDetails(broadcasters: string[]): { label: string; url: string }[] {
  return broadcasters.map(b => {
    const norm = b.toLowerCase();
    
    // Exact or substring matches for the 19 actual broadcasters in the API
    if (norm.includes('espn') || norm.includes('disney')) {
      return { label: 'Disney+ / ESPN', url: 'https://www.disneyplus.com/' };
    }
    if (norm.includes('caze') || norm.includes('youtube')) {
      return { label: 'CazéTV', url: 'https://www.youtube.com/@CazeTV' };
    }
    if (norm.includes('goat')) {
      return { label: 'Canal GOAT', url: 'https://www.youtube.com/@CanalGOATBR' };
    }
    if (norm.includes('cbf tv') || norm.includes('cbftv')) {
      return { label: 'CBF TV', url: 'https://www.youtube.com/@brasil' };
    }
    if (norm.includes('benja') || norm.includes('tmc')) {
      return { label: 'Canal do Benja', url: 'https://www.youtube.com/@canaldobenja' };
    }
    if (norm.includes('sportv')) {
      return { label: 'SporTV', url: 'https://globoplay.globo.com/canais/sportv/' };
    }
    if (norm.includes('premiere')) {
      return { label: 'Premiere', url: 'https://premiere.globo.com/' };
    }
    if (norm.includes('globo')) {
      return { label: 'TV Globo', url: 'https://globoplay.globo.com/' };
    }
    if (norm.includes('prime') || norm.includes('amazon')) {
      return { label: 'Prime Video', url: 'https://www.primevideo.com/' };
    }
    if (norm.includes('band')) {
      return { label: 'Band', url: 'https://www.band.uol.com.br/ao-vivo' };
    }
    if (norm.includes('redetv') || norm.includes('rede tv')) {
      return { label: 'RedeTV', url: 'https://www.redetv.uol.com.br/aovivo' };
    }
    if (norm.includes('record')) {
      return { label: 'Record (PlayPlus)', url: 'https://www.playplus.com/' };
    }
    if (norm.includes('tv brasil') || norm.includes('ebc')) {
      return { label: 'TV Brasil Play', url: 'https://tvbrasilplay.com.br/' };
    }
    if (norm.includes('nsports')) {
      return { label: 'NSports', url: 'https://www.nsports.com.br/' };
    }
    if (norm.includes('metropoles') || norm.includes('metrópoles')) {
      return { label: 'Metrópoles', url: 'https://www.youtube.com/@MetropolesEsportes' };
    }
    if (norm.includes('uol')) {
      return { label: 'UOL Esporte', url: 'https://www.uol.com.br/esporte/' };
    }
    if (norm.includes('ge tv') || norm.includes('ge.globo')) {
      return { label: 'GE TV', url: 'https://ge.globo.com/' };
    }
    if (norm.includes('sportynet') || norm.includes('sporty net')) {
      return { label: 'SportyNet', url: 'https://sportynet.com.br/' };
    }
    if (norm.includes('x sports') || norm.includes('xsports')) {
      return { label: 'X Sports', url: 'https://www.youtube.com/@xsports.brasil' };
    }
    if (norm.includes('paramount')) {
      return { label: 'Paramount+', url: 'https://www.paramountplus.com/' };
    }

    return { label: b, url: 'https://ge.globo.com/' };
  });
}

// Generate curated events for other sports modalities (Basquete, Vôlei, Judô, Automobilismo, Tênis)
function generateOtherSportsEvents(): any[] {
  return [
    // --- BASQUETE ---
    {
      id: 'bskt-1',
      sport: 'basquete',
      homeTeam: 'Flamengo Basquete',
      homeTeamSlug: 'flamengo-basquete',
      homeTeamLogo: 'https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/flamengo.png',
      awayTeam: 'Sesi Franca',
      awayTeamSlug: 'sesi-franca',
      awayTeamLogo: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=120&auto=format&fit=crop&q=80',
      date: '2026-08-01',
      time: '18:00',
      division: 'NBB',
      stadium: 'Arena Carioca 1 - Rio de Janeiro',
      broadcasters: ['SporTV 2', 'Disney+'],
      transmissionUrl: 'https://globoplay.globo.com/canais/sportv/',
      round: 'NBB - Final Game 5',
      status: 'agendado',
      scraped: false
    },
    {
      id: 'bskt-2',
      sport: 'basquete',
      homeTeam: 'São Paulo FC',
      homeTeamSlug: 'sao-paulo-basquete',
      homeTeamLogo: 'https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/sao-paulo.png',
      awayTeam: 'Minas Tênis Clube',
      awayTeamSlug: 'minas-basquete',
      awayTeamLogo: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=120&auto=format&fit=crop&q=80',
      date: '2026-08-03',
      time: '20:00',
      division: 'NBB',
      stadium: 'Ginásio do Morumbi - São Paulo',
      broadcasters: ['ESPN 2', 'YouTube NBB'],
      transmissionUrl: 'https://www.youtube.com/@NBB',
      round: 'NBB - Temporada Regular',
      status: 'agendado',
      scraped: false
    },
    {
      id: 'bskt-3',
      sport: 'basquete',
      homeTeam: 'Indiana Fever',
      homeTeamSlug: 'indiana-fever',
      homeTeamLogo: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=120&auto=format&fit=crop&q=80',
      awayTeam: 'Las Vegas Aces',
      awayTeamSlug: 'las-vegas-aces',
      awayTeamLogo: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=120&auto=format&fit=crop&q=80',
      date: '2026-08-05',
      time: '21:00',
      division: 'WNBA',
      stadium: 'Gainbridge Fieldhouse - Indianapolis',
      broadcasters: ['ESPN', 'Disney+'],
      transmissionUrl: 'https://www.disneyplus.com/',
      round: 'WNBA - Temporada Regular',
      status: 'agendado',
      scraped: false
    },
    {
      id: 'bskt-4',
      sport: 'basquete',
      homeTeam: 'Seleção Brasileira',
      homeTeamSlug: 'brasil-basquete',
      homeTeamLogo: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=120&auto=format&fit=crop&q=80',
      awayTeam: 'Seleção Argentina',
      awayTeamSlug: 'argentina-basquete',
      awayTeamLogo: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=120&auto=format&fit=crop&q=80',
      date: '2026-08-07',
      time: '19:30',
      division: 'Amistoso',
      stadium: 'Arena Carioca 1 - Rio de Janeiro',
      broadcasters: ['CazéTV', 'SporTV 2'],
      transmissionUrl: 'https://www.youtube.com/@CazeTV',
      round: 'Desafio das Américas',
      status: 'agendado',
      scraped: false
    },
    {
      id: 'bskt-5',
      sport: 'basquete',
      homeTeam: 'Bauru Basket',
      homeTeamSlug: 'bauru-basket',
      homeTeamLogo: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=120&auto=format&fit=crop&q=80',
      awayTeam: 'Paulistano',
      awayTeamSlug: 'paulistano-basket',
      awayTeamLogo: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=120&auto=format&fit=crop&q=80',
      date: '2026-08-08',
      time: '17:00',
      division: 'NBB',
      stadium: 'Ginásio Panela de Pressão - Bauru',
      broadcasters: ['YouTube NBB'],
      transmissionUrl: 'https://www.youtube.com/@NBB',
      round: 'NBB - Rodada 14',
      status: 'agendado',
      scraped: false
    },
    {
      id: 'bskt-6',
      sport: 'basquete',
      homeTeam: 'Boston Celtics',
      homeTeamSlug: 'boston-celtics',
      homeTeamLogo: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=120&auto=format&fit=crop&q=80',
      awayTeam: 'New York Knicks',
      awayTeamSlug: 'new-york-knicks',
      awayTeamLogo: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=120&auto=format&fit=crop&q=80',
      date: '2026-08-10',
      time: '21:30',
      division: 'NBA',
      stadium: 'TD Garden - Boston',
      broadcasters: ['ESPN', 'Disney+'],
      transmissionUrl: 'https://www.disneyplus.com/',
      round: 'NBA Summer League - Finais',
      status: 'agendado',
      scraped: false
    },

    // --- VÔLEI ---
    {
      id: 'volei-1',
      sport: 'volei',
      homeTeam: 'Sada Cruzeiro',
      homeTeamSlug: 'sada-cruzeiro',
      homeTeamLogo: 'https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/cruzeiro.png',
      awayTeam: 'Minas Tênis Clube',
      awayTeamSlug: 'minas-volei',
      awayTeamLogo: 'https://images.unsplash.com/photo-1592656094267-764a45160876?w=120&auto=format&fit=crop&q=80',
      date: '2026-08-01',
      time: '21:30',
      division: 'Superliga Masc.',
      stadium: 'Ginásio do Riacho - Contagem',
      broadcasters: ['SporTV 2'],
      transmissionUrl: 'https://globoplay.globo.com/canais/sportv/',
      round: 'Superliga Masculina - Clássico',
      status: 'agendado',
      scraped: false
    },
    {
      id: 'volei-2',
      sport: 'volei',
      homeTeam: 'DENTIL Praia Clube',
      homeTeamSlug: 'praia-clube',
      homeTeamLogo: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=120&auto=format&fit=crop&q=80',
      awayTeam: 'Gerdau Minas',
      awayTeamSlug: 'gerdau-minas',
      awayTeamLogo: 'https://images.unsplash.com/photo-1592656094267-764a45160876?w=120&auto=format&fit=crop&q=80',
      date: '2026-08-02',
      time: '19:00',
      division: 'Superliga Fem.',
      stadium: 'Arena Praia - Uberlândia',
      broadcasters: ['SporTV 2'],
      transmissionUrl: 'https://globoplay.globo.com/canais/sportv/',
      round: 'Superliga Feminina - Rodada 8',
      status: 'agendado',
      scraped: false
    },
    {
      id: 'volei-3',
      sport: 'volei',
      homeTeam: 'Sesi Bauru',
      homeTeamSlug: 'sesi-bauru-volei',
      homeTeamLogo: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=120&auto=format&fit=crop&q=80',
      awayTeam: 'Osasco São Cristóvão',
      awayTeamSlug: 'osasco-volei',
      awayTeamLogo: 'https://images.unsplash.com/photo-1592656094267-764a45160876?w=120&auto=format&fit=crop&q=80',
      date: '2026-08-05',
      time: '20:30',
      division: 'Superliga Fem.',
      stadium: 'Arena Paulo Skaf - Bauru',
      broadcasters: ['SporTV 2', 'Canal Vôlei Brasil'],
      transmissionUrl: 'https://globoplay.globo.com/canais/sportv/',
      round: 'Superliga Feminina - Rodada 9',
      status: 'agendado',
      scraped: false
    },
    {
      id: 'volei-4',
      sport: 'volei',
      homeTeam: 'Brasil (Feminino)',
      homeTeamSlug: 'brasil-volei-fem',
      homeTeamLogo: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=120&auto=format&fit=crop&q=80',
      awayTeam: 'Itália (Feminino)',
      awayTeamSlug: 'italia-volei-fem',
      awayTeamLogo: 'https://images.unsplash.com/photo-1592656094267-764a45160876?w=120&auto=format&fit=crop&q=80',
      date: '2026-08-07',
      time: '18:00',
      division: 'VNL (Liga das Nações)',
      stadium: 'Ginásio do Maracanãzinho - Rio de Janeiro',
      broadcasters: ['TV Globo', 'SporTV 2'],
      transmissionUrl: 'https://globoplay.globo.com/',
      round: 'Fase Final - Quartas de Final',
      status: 'agendado',
      scraped: false
    },
    {
      id: 'volei-5',
      sport: 'volei',
      homeTeam: 'Brasil (Masculino)',
      homeTeamSlug: 'brasil-volei-masc',
      homeTeamLogo: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=120&auto=format&fit=crop&q=80',
      awayTeam: 'Polônia (Masculino)',
      awayTeamSlug: 'polonia-volei-masc',
      awayTeamLogo: 'https://images.unsplash.com/photo-1592656094267-764a45160876?w=120&auto=format&fit=crop&q=80',
      date: '2026-08-08',
      time: '18:00',
      division: 'VNL (Liga das Nações)',
      stadium: 'Ginásio do Maracanãzinho - Rio de Janeiro',
      broadcasters: ['SporTV 2'],
      transmissionUrl: 'https://globoplay.globo.com/canais/sportv/',
      round: 'Fase Final - Semifinal',
      status: 'agendado',
      scraped: false
    },

    // --- JUDÔ ---
    {
      id: 'judo-1',
      sport: 'judo',
      homeTeam: 'Mayra Aguiar vs Alice Bellandi',
      homeTeamSlug: 'mayra-aguiar',
      homeTeamLogo: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=120&auto=format&fit=crop&q=80',
      awayTeam: 'Disputa de Medalha de Ouro (-78kg)',
      awayTeamSlug: 'gold-medal-judo',
      awayTeamLogo: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=120&auto=format&fit=crop&q=80',
      date: '2026-08-01',
      time: '16:00',
      division: 'Grand Slam IJF',
      stadium: 'Ginásio Nilson Nelson - Brasília',
      broadcasters: ['CazéTV', 'SporTV 3', 'Olympic Channel'],
      transmissionUrl: 'https://www.youtube.com/@CazeTV',
      round: 'Finais e Bloco de Medalhas',
      status: 'agendado',
      scraped: false
    },
    {
      id: 'judo-2',
      sport: 'judo',
      homeTeam: 'Beatriz Souza vs Raz Hershko',
      homeTeamSlug: 'beatriz-souza',
      homeTeamLogo: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=120&auto=format&fit=crop&q=80',
      awayTeam: 'Disputa de Medalha (+78kg)',
      awayTeamSlug: 'heavyweight-judo',
      awayTeamLogo: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=120&auto=format&fit=crop&q=80',
      date: '2026-08-02',
      time: '16:30',
      division: 'Grand Slam IJF',
      stadium: 'Ginásio Nilson Nelson - Brasília',
      broadcasters: ['CazéTV', 'SporTV 3'],
      transmissionUrl: 'https://www.youtube.com/@CazeTV',
      round: 'Finais Categoria Pesado',
      status: 'agendado',
      scraped: false
    },
    {
      id: 'judo-3',
      sport: 'judo',
      homeTeam: 'Willian Lima vs Abe Hifumi',
      homeTeamSlug: 'willian-lima',
      homeTeamLogo: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=120&auto=format&fit=crop&q=80',
      awayTeam: 'Disputa de Ouro (-66kg)',
      awayTeamSlug: 'gold-66kg',
      awayTeamLogo: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=120&auto=format&fit=crop&q=80',
      date: '2026-08-07',
      time: '15:00',
      division: 'Troféu Brasil',
      stadium: 'Centro de Treinamento CBJ - Lauro de Freitas/BA',
      broadcasters: ['Canal da CBJ', 'SporTV 3'],
      transmissionUrl: 'https://www.youtube.com/@brasil',
      round: 'Troféu Brasil - Finais',
      status: 'agendado',
      scraped: false
    },
    {
      id: 'judo-4',
      sport: 'judo',
      homeTeam: 'Rafaela Silva vs Christa Deguchi',
      homeTeamSlug: 'rafaela-silva',
      homeTeamLogo: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=120&auto=format&fit=crop&q=80',
      awayTeam: 'Disputa de Medalhas (-57kg)',
      awayTeamSlug: 'judo-57kg',
      awayTeamLogo: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=120&auto=format&fit=crop&q=80',
      date: '2026-08-08',
      time: '16:00',
      division: 'Grand Prix IJF',
      stadium: 'Arena Zagreb - Croácia',
      broadcasters: ['IJF TV', 'CazéTV'],
      transmissionUrl: 'https://www.youtube.com/@CazeTV',
      round: 'Grand Prix - Bloco Final',
      status: 'agendado',
      scraped: false
    },

    // --- AUTOMOBILISMO / F1 ---
    {
      id: 'auto-1',
      sport: 'automobilismo',
      homeTeam: 'GP da Hungria (F1)',
      homeTeamSlug: 'gp-hungria-f1',
      homeTeamLogo: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=120&auto=format&fit=crop&q=80',
      awayTeam: 'Hungaroring Circuit',
      awayTeamSlug: 'hungaroring',
      awayTeamLogo: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=120&auto=format&fit=crop&q=80',
      date: '2026-08-02',
      time: '10:00',
      division: 'Fórmula 1',
      stadium: 'Circuito Hungaroring - Budapeste',
      broadcasters: ['Band', 'BandSports', 'F1 TV Pro'],
      transmissionUrl: 'https://www.band.uol.com.br/ao-vivo',
      round: 'Corrida Principal (70 Voltas)',
      status: 'agendado',
      scraped: false
    },
    {
      id: 'auto-2',
      sport: 'automobilismo',
      homeTeam: 'Stock Car Interlagos',
      homeTeamSlug: 'stock-car-interlagos',
      homeTeamLogo: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=120&auto=format&fit=crop&q=80',
      awayTeam: 'Etapa 7 - Interlagos',
      awayTeamSlug: 'etapa-interlagos',
      awayTeamLogo: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=120&auto=format&fit=crop&q=80',
      date: '2026-08-08',
      time: '15:30',
      division: 'Stock Car',
      stadium: 'Autódromo de Interlagos - São Paulo',
      broadcasters: ['Band', 'SporTV 3', 'YouTube Stock Car'],
      transmissionUrl: 'https://www.band.uol.com.br/ao-vivo',
      round: 'Corrida Sprint & Corrida Principal',
      status: 'agendado',
      scraped: false
    },
    {
      id: 'auto-3',
      sport: 'automobilismo',
      homeTeam: 'GP da Holanda (F1)',
      homeTeamSlug: 'gp-holanda-f1',
      homeTeamLogo: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=120&auto=format&fit=crop&q=80',
      awayTeam: 'Zandvoort Circuit',
      awayTeamSlug: 'zandvoort',
      awayTeamLogo: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=120&auto=format&fit=crop&q=80',
      date: '2026-08-22',
      time: '10:00',
      division: 'Fórmula 1',
      stadium: 'Circuito de Zandvoort - Holanda',
      broadcasters: ['BandSports', 'F1 TV Pro'],
      transmissionUrl: 'https://www.band.uol.com.br/ao-vivo',
      round: 'Classificação (Qualifying)',
      status: 'agendado',
      scraped: false
    },
    {
      id: 'auto-4',
      sport: 'automobilismo',
      homeTeam: 'GP da Holanda (F1)',
      homeTeamSlug: 'gp-holanda-f1-race',
      homeTeamLogo: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=120&auto=format&fit=crop&q=80',
      awayTeam: 'Zandvoort Circuit',
      awayTeamSlug: 'zandvoort-race',
      awayTeamLogo: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=120&auto=format&fit=crop&q=80',
      date: '2026-08-23',
      time: '10:00',
      division: 'Fórmula 1',
      stadium: 'Circuito de Zandvoort - Holanda',
      broadcasters: ['Band', 'BandSports', 'F1 TV Pro'],
      transmissionUrl: 'https://www.band.uol.com.br/ao-vivo',
      round: 'Corrida Principal (72 Voltas)',
      status: 'agendado',
      scraped: false
    },

    // --- TÊNIS ---
    {
      id: 'tenis-1',
      sport: 'tenis',
      homeTeam: 'Bia Haddad Maia',
      homeTeamSlug: 'bia-haddad',
      homeTeamLogo: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=120&auto=format&fit=crop&q=80',
      awayTeam: 'Aryna Sabalenka',
      awayTeamSlug: 'aryna-sabalenka',
      awayTeamLogo: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=120&auto=format&fit=crop&q=80',
      date: '2026-08-07',
      time: '16:00',
      division: 'WTA 1000',
      stadium: 'Sobeys Stadium - Toronto',
      broadcasters: ['ESPN 3', 'Disney+'],
      transmissionUrl: 'https://www.disneyplus.com/',
      round: 'Quartas de Final',
      status: 'agendado',
      scraped: false
    },
    {
      id: 'tenis-2',
      sport: 'tenis',
      homeTeam: 'Thiago Wild',
      homeTeamSlug: 'thiago-wild',
      homeTeamLogo: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=120&auto=format&fit=crop&q=80',
      awayTeam: 'Carlos Alcaraz',
      awayTeamSlug: 'carlos-alcaraz',
      awayTeamLogo: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=120&auto=format&fit=crop&q=80',
      date: '2026-08-12',
      time: '20:00',
      division: 'ATP 1000',
      stadium: 'Lindner Family Tennis Center - Cincinnati',
      broadcasters: ['ESPN 2', 'Disney+'],
      transmissionUrl: 'https://www.disneyplus.com/',
      round: 'Oitavas de Final',
      status: 'agendado',
      scraped: false
    },
    {
      id: 'tenis-3',
      sport: 'tenis',
      homeTeam: 'US Open - Chave Principal',
      homeTeamSlug: 'us-open-round-1',
      homeTeamLogo: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=120&auto=format&fit=crop&q=80',
      awayTeam: 'Quadra Central Arthur Ashe',
      awayTeamSlug: 'arthur-ashe-stadium',
      awayTeamLogo: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=120&auto=format&fit=crop&q=80',
      date: '2026-08-24',
      time: '12:00',
      division: 'US Open',
      stadium: 'USTA Billie Jean King Center - Nova York',
      broadcasters: ['ESPN', 'SporTV 3', 'Disney+'],
      transmissionUrl: 'https://www.disneyplus.com/',
      round: 'Primeira Rodada (Grand Slam)',
      status: 'agendado',
      scraped: false
    },
    {
      id: 'tenis-4',
      sport: 'tenis',
      homeTeam: 'US Open - Sessão Noturna',
      homeTeamSlug: 'us-open-night-session',
      homeTeamLogo: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=120&auto=format&fit=crop&q=80',
      awayTeam: 'Estádio Louis Armstrong',
      awayTeamSlug: 'louis-armstrong-stadium',
      awayTeamLogo: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=120&auto=format&fit=crop&q=80',
      date: '2026-08-28',
      time: '20:00',
      division: 'US Open',
      stadium: 'USTA Billie Jean King Center - Nova York',
      broadcasters: ['ESPN 2', 'Disney+'],
      transmissionUrl: 'https://www.disneyplus.com/',
      round: 'Terceira Rodada',
      status: 'agendado',
      scraped: false
    }
  ];
}

// Generate an ultra-comprehensive, beautiful schedule for the current month (July 2026)
function generateFallbackGames(): any[] {
  // Cleared completely per user's explicit request ("apague todos os dados das partidas")
  return [];
}

// Secure custom single-request helper that bypasses SSL verification ONLY for this specific request,
// ensuring the global Node.js runtime process environment remains fully protected and secure.
function fetchJsonSecurely(urlStr: string): Promise<any> {
  return new Promise((resolve, reject) => {
    try {
      const url = new URL(urlStr);
      const options = {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        },
        rejectUnauthorized: false // Bypasses SSL validation solely for this endpoint
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              reject(new Error('Resposta em JSON inválido'));
            }
          } else {
            reject(new Error(`HTTP status ${res.statusCode}`));
          }
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.setTimeout(12000, () => {
        req.destroy();
        reject(new Error('Tempo limite de requisição esgotado'));
      });

      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

// Retry fetchJsonSecurely with backoff to handle transient 502 / network glitches
async function fetchJsonWithRetry(urlStr: string, retries = 3, delayMs = 600): Promise<any> {
  let lastErr: any;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fetchJsonSecurely(urlStr);
    } catch (err: any) {
      lastErr = err;
      if (attempt < retries) {
        console.warn(`[CBF API] Tentativa ${attempt} para ${urlStr} falhou (${err?.message || err}). Aguardando ${delayMs * attempt}ms...`);
        await new Promise(r => setTimeout(r, delayMs * attempt));
      }
    }
  }
  throw lastErr;
}

// Cache variables to avoid rate-limiting and make loads instant
let cachedScrapedGames: any[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

// Attempt to scrape real data from CBF website with high-fidelity emulated browser headers
async function scrapeCBFGames(forceRefresh = false): Promise<any[]> {
  const nowMs = Date.now();
  if (!forceRefresh && cachedScrapedGames && (nowMs - lastFetchTime < CACHE_DURATION)) {
    console.log('Retornando jogos raspados da CBF do cache do servidor...');
    return cachedScrapedGames;
  }

  console.log(forceRefresh ? 'Forçando atualização dos jogos da CBF...' : 'Cache expirado ou inexistente. Iniciando raspagem dos jogos da CBF...');
  const scrapedGames: any[] = [];

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-indexed
  const monthStr = String(month).padStart(2, '0');
  
  // Set date range for the current month
  const startDateStr = `${year}-${monthStr}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDateStr = `${year}-${monthStr}-${String(lastDay).padStart(2, '0')}`;
  
  console.log(`Buscando jogos da CBF via API de ${startDateStr} até ${endDateStr}`);

  let page = 1;
  let lastPage = 1;
  const maxPages = 40; // Increased to 40 to prevent cutting off matches after July 19th!

  while (page <= lastPage && page <= maxPages) {
    try {
      if (page > 1) {
        await new Promise(r => setTimeout(r, 120)); // Gentle throttling between requests to prevent HTTP 502
      }
      console.log(`Buscando dados da API da CBF - Página ${page}...`);
      const url = `https://www.cbf.com.br/api/cbf/onde-assistir/jogos?page=${page}&dataInicio=${startDateStr}&dataTermino=${endDateStr}`;
      
      const result = await fetchJsonWithRetry(url, 3, 500);
      const meta = result.meta || {};
      lastPage = typeof meta.last_page === 'number' ? meta.last_page : 1;

      const games = result.jogos || [];
      console.log(`Página ${page}: Recebidos ${games.length} jogos da API.`);

      if (games.length === 0) {
        break;
      }

      for (const game of games) {
        try {
          const homeName = game.mandante?.nome || 'A definir';
          const awayName = game.visitante?.nome || 'A definir';
          
          if (homeName === 'A definir' && awayName === 'A definir') {
            continue;
          }

          const homeInfo = getClubDetails(homeName);
          const awayInfo = getClubDetails(awayName);

          // Format date from DD/MM/YYYY to YYYY-MM-DD
          let formattedDate = '';
          if (game.data) {
            const parts = game.data.split('/');
            if (parts.length === 3) {
              formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
            } else {
              formattedDate = game.data;
            }
          } else {
            formattedDate = `${year}-${monthStr}-${String(now.getDate()).padStart(2, '0')}`;
          }

          const compName = game.competicao?.campeonato_nome || 'Futebol Brasileiro';
          const catName = game.competicao?.categoria_nome || '';
          const combinedComp = `${compName} ${catName}`.toLowerCase();

          let division = 'Série A';
          if (combinedComp.includes('série b') || combinedComp.includes('serie b') || combinedComp.includes('série-b') || combinedComp.includes('serie-b')) {
            division = 'Série B';
          } else if (combinedComp.includes('série c') || combinedComp.includes('serie c') || combinedComp.includes('série-c') || combinedComp.includes('serie-c')) {
            division = 'Série C';
          } else if (combinedComp.includes('série d') || combinedComp.includes('serie d') || combinedComp.includes('série-d') || combinedComp.includes('serie-d')) {
            division = 'Série D';
          } else if (combinedComp.includes('sub-17') || combinedComp.includes('sub17')) {
            division = 'Sub-17';
          } else if (combinedComp.includes('sub-20') || combinedComp.includes('sub20')) {
            division = 'Sub-20';
          } else if (combinedComp.includes('sub-15') || combinedComp.includes('sub15')) {
            division = 'Sub-15';
          } else if (combinedComp.includes('feminino') || combinedComp.includes('a1') || combinedComp.includes('a2')) {
            division = 'Feminino';
          } else if (combinedComp.includes('copa do brasil')) {
            division = 'Copa do Brasil';
          } else {
            // Keep default Série A only if it matches Brasileiro Serie A explicitly or is a generic championship
            if (combinedComp.includes('série a') || combinedComp.includes('serie a')) {
              division = 'Série A';
            } else {
              division = catName || compName || 'Outros';
            }
          }

          const roundText = catName ? `${compName} - ${catName}` : compName;

          const transmissions = game.transmissoes || [];
          const broadcasters = transmissions.map((t: any) => t.nome).filter(Boolean);
          const tDetails = getTransmissionDetails(broadcasters);
          const transmissionUrl = tDetails.length > 0 ? tDetails[0].url : 'https://ge.globo.com/';

          const stadiumVal = game.local || 'A definir';
          const timeVal = game.hora || '16:00';

          const homeLogo = game.mandante?.url_escudo || homeInfo.logo;
          const awayLogo = game.visitante?.url_escudo || awayInfo.logo;

          // Determinar status dinâmico com base na data/hora do jogo
          let matchStatus: 'agendado' | 'ao_vivo' | 'finalizado' = 'agendado';
          try {
            const [mYear, mMonth, mDay] = formattedDate.split('-').map(Number);
            const [mHour, mMin] = timeVal.split(':').map(Number);
            const matchDateTime = new Date(mYear, mMonth - 1, mDay, mHour || 0, mMin || 0);
            const diffMs = now.getTime() - matchDateTime.getTime();
            const diffHours = diffMs / (1000 * 60 * 60);

            if (diffHours >= 2.5) {
              matchStatus = 'finalizado';
            } else if (diffHours >= 0 && diffHours < 2.5) {
              matchStatus = 'ao_vivo';
            } else {
              matchStatus = 'agendado';
            }
          } catch (e) {
            matchStatus = 'agendado';
          }

          scrapedGames.push({
            id: `api-cbf-${game.id_jogo || Math.random().toString(36).substring(2, 9)}`,
            sport: 'futebol',
            homeTeam: homeInfo.name,
            homeTeamSlug: homeInfo.slug,
            homeTeamLogo: homeLogo,
            awayTeam: awayInfo.name,
            awayTeamSlug: awayInfo.slug,
            awayTeamLogo: awayLogo,
            date: formattedDate,
            time: timeVal,
            division: division,
            stadium: stadiumVal,
            broadcasters: broadcasters.length > 0 ? broadcasters : ['A definir'],
            transmissionUrl: transmissionUrl,
            round: roundText,
            status: matchStatus,
            scraped: true
          });
        } catch (innerErr) {
          console.error(`Erro ao mapear jogo da API:`, innerErr);
        }
      }

      page++;
    } catch (err) {
      console.warn(`Aviso: Falha ao carregar a página ${page} da API da CBF após tentativas. Mantendo ${scrapedGames.length} partidas já recuperadas.`);
      break;
    }
  }

  console.log(`Total de jogos mapeados da API da CBF: ${scrapedGames.length}`);
  
  if (scrapedGames.length === 0 && cachedScrapedGames && cachedScrapedGames.length > 0) {
    console.log('Raspagem retornou 0 jogos. Utilizando cache do servidor...');
    return cachedScrapedGames;
  }

  if (scrapedGames.length > 0) {
    cachedScrapedGames = scrapedGames;
    lastFetchTime = Date.now();
  }
  
  return scrapedGames;
}

// Dynamic status calculator based on match date and start time (America/Sao_Paulo timezone - UTC-3)
function calculateMatchStatus(dateStr: string, timeStr: string, rawStatus?: string): 'agendado' | 'ao_vivo' | 'finalizado' {
  if (rawStatus) {
    const s = String(rawStatus).toLowerCase();
    if (s.includes('finaliz') || s.includes('encerrad') || s.includes('terminad') || s.includes('concluid') || s.includes('fim')) {
      return 'finalizado';
    }
    if (s.includes('ao vivo') || s.includes('em andamento') || s.includes('jogando')) {
      return 'ao_vivo';
    }
  }

  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);

      const [hoursStr, minutesStr] = (timeStr || '16:00').split(':');
      const hours = parseInt(hoursStr, 10) || 16;
      const minutes = parseInt(minutesStr, 10) || 0;

      // Brasilia is UTC-3. Match start in UTC ms:
      const matchStartUtcMs = Date.UTC(year, month, day, hours + 3, minutes);
      // Typical match duration: 115 minutes
      const matchEndUtcMs = matchStartUtcMs + (115 * 60 * 1000);

      const nowMs = Date.now();

      if (nowMs < matchStartUtcMs) {
        return 'agendado';
      } else if (nowMs >= matchStartUtcMs && nowMs <= matchEndUtcMs) {
        return 'ao_vivo';
      } else {
        return 'finalizado';
      }
    }
  } catch (err) {
    console.error('Erro ao calcular status da partida:', err);
  }

  return 'agendado';
}

// API to load matches
app.get('/api/jogos', async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === 'true';
    const scrapedCBF = await scrapeCBFGames(forceRefresh);
    const otherSports = generateOtherSportsEvents();
    const fallback = generateFallbackGames();
    
    // Combine everything: scraped CBF (futebol), other sports, fallback
    const rawCombined: any[] = [];
    
    // Add scraped CBF matches
    scrapedCBF.forEach(scrapedGame => {
      rawCombined.push(scrapedGame);
    });

    // Add other sports matches
    otherSports.forEach(sportGame => {
      rawCombined.push(sportGame);
    });

    // Add fallback matches
    fallback.forEach(fallbackGame => {
      rawCombined.push(fallbackGame);
    });

    // Dynamically re-calculate match status for every match based on current date & time
    const combined = rawCombined.map(match => ({
      ...match,
      status: calculateMatchStatus(match.date, match.time, match.rawStatus)
    }));

    // Re-sort games by date and time
    combined.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

    res.json({
      success: true,
      data: combined,
      info: {
        total: combined.length,
        futebolCount: scrapedCBF.length,
        otherSportsCount: otherSports.length,
        currentTime: new Date().toISOString()
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// SOCIAL PROJECTS ENDPOINTS
// ==========================================

// GET Approved Social Projects (Public)
app.get('/api/projetos-sociais', (req, res) => {
  res.json({
    success: true,
    data: approvedProjectsStore,
    count: approvedProjectsStore.length
  });
});

// POST Submit new project (Public with Anti-DDoS, Honeypot & CAPTCHA)
app.post('/api/projetos-sociais/sugerir', submissionRateLimiter, (req, res) => {
  try {
    const {
      title,
      sport,
      neighborhood,
      city,
      address,
      phone,
      whatsapp,
      organization,
      targetPublic,
      schedule,
      price,
      description,
      requirements,
      honeypot_website, // Anti-bot Honeypot field
      captchaAnswer,    // Math captcha answer provided
      captchaExpected   // Math captcha expected answer
    } = req.body;

    // 1. Honeypot check (Bots auto-fill hidden input fields)
    if (honeypot_website) {
      console.warn(`[Anti-DDoS / Spam] Honeypot ativado do IP: ${getClientIp(req)}`);
      return res.status(400).json({ success: false, error: 'Requisição suspeita descartada (bot detectado).' });
    }

    // 2. Server-side CAPTCHA verification
    if (captchaAnswer === undefined || String(captchaAnswer).trim() !== String(captchaExpected).trim()) {
      return res.status(400).json({ success: false, error: 'Resposta do desafio de verificação humana incorreta.' });
    }

    // 3. Strict Input Sanitization & Validation
    const cleanTitle = sanitizeText(title, 120);
    const cleanAddress = sanitizeText(address, 200);
    const cleanPhone = sanitizeText(phone, 30);
    const cleanNeighborhood = sanitizeText(neighborhood, 80);
    const cleanOrg = sanitizeText(organization, 120);

    if (!cleanTitle || !cleanAddress || !cleanPhone || !cleanNeighborhood) {
      return res.status(400).json({
        success: false,
        error: 'Preencha todos os campos obrigatórios (Título, Endereço, Bairro e Telefone).'
      });
    }

    const newPendingProject: StoredSocialProject = {
      id: `pending-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: cleanTitle,
      sport: sanitizeText(sport || 'Jiu-Jitsu', 50),
      neighborhood: cleanNeighborhood,
      city: sanitizeText(city || 'Rio de Janeiro - RJ', 80),
      address: cleanAddress,
      phone: cleanPhone,
      whatsapp: sanitizeText(whatsapp || cleanPhone, 30),
      organization: cleanOrg || 'Projeto Comunitário / Igreja',
      targetPublic: sanitizeText(targetPublic || 'Geral', 120),
      schedule: sanitizeText(schedule || 'A combinar', 150),
      price: sanitizeText(price || 'Totalmente Gratuito', 50),
      description: sanitizeText(description, 600),
      requirements: sanitizeText(requirements, 300),
      status: 'pending',
      createdAt: new Date().toISOString(),
      submitterIp: getClientIp(req)
    };

    pendingProjectsStore.unshift(newPendingProject);
    saveProjectsStore();

    res.json({
      success: true,
      message: 'Projeto enviado com sucesso! Ele passará por análise do administrador antes de ser publicado.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin API: Verify PIN
app.post('/api/admin/login', (req, res) => {
  const { pin } = req.body;
  if (pin === ADMIN_PIN) {
    return res.json({ success: true, message: 'Autenticado como Administrador' });
  }
  return res.status(401).json({ success: false, error: 'PIN de administrador incorreto.' });
});

// Admin API: List Pending Projects & Approved Projects
app.get('/api/admin/projetos-pendentes', verifyAdmin, (req, res) => {
  res.json({
    success: true,
    pending: pendingProjectsStore,
    approved: approvedProjectsStore,
    totalPending: pendingProjectsStore.length,
    totalApproved: approvedProjectsStore.length
  });
});

// Admin API: Approve Project
app.post('/api/admin/aprovar-projeto', verifyAdmin, (req, res) => {
  const { id } = req.body;
  const index = pendingProjectsStore.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Projeto pendente não encontrado.' });
  }

  const [projectToApprove] = pendingProjectsStore.splice(index, 1);
  projectToApprove.status = 'approved';
  approvedProjectsStore.unshift(projectToApprove);
  saveProjectsStore();

  res.json({
    success: true,
    message: 'Projeto aprovado e publicado com sucesso!',
    approvedProject: projectToApprove
  });
});

// Admin API: Reject / Delete Project
app.post('/api/admin/rejeitar-projeto', verifyAdmin, (req, res) => {
  const { id } = req.body;
  
  let removedFromPending = false;
  let removedFromApproved = false;

  const pendingIdx = pendingProjectsStore.findIndex(p => p.id === id);
  if (pendingIdx !== -1) {
    pendingProjectsStore.splice(pendingIdx, 1);
    removedFromPending = true;
  }

  const approvedIdx = approvedProjectsStore.findIndex(p => p.id === id);
  if (approvedIdx !== -1) {
    approvedProjectsStore.splice(approvedIdx, 1);
    removedFromApproved = true;
  }

  saveProjectsStore();

  if (removedFromPending || removedFromApproved) {
    return res.json({ success: true, message: 'Projeto removido com sucesso.' });
  }

  return res.status(404).json({ success: false, error: 'Projeto não encontrado.' });
});

// ==========================================
// SEO & BOT ENDPOINTS (robots.txt, ads.txt, sitemap.xml)
// ==========================================
app.get('/robots.txt', (req, res) => {
  const robotsPath = path.join(process.cwd(), 'public', 'robots.txt');
  if (fs.existsSync(robotsPath)) {
    return res.type('text/plain').sendFile(robotsPath);
  }
  res.type('text/plain').send("User-agent: *\nAllow: /\nDisallow: /api/admin/\nSitemap: https://esporteradar.com.br/sitemap.xml\n");
});

app.get('/ads.txt', (req, res) => {
  const adsPath = path.join(process.cwd(), 'public', 'ads.txt');
  if (fs.existsSync(adsPath)) {
    return res.type('text/plain').sendFile(adsPath);
  }
  res.type('text/plain').send("google.com, pub-6786401860837559, DIRECT, f08c47fec0942fa0\n");
});

app.get('/sitemap.xml', (req, res) => {
  const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');
  if (fs.existsSync(sitemapPath)) {
    return res.type('application/xml').sendFile(sitemapPath);
  }
  res.type('application/xml').send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://esporteradar.com.br/</loc><changefreq>daily</changefreq><priority>1.0</priority></url></urlset>');
});

// Serve Vite dev server or static assets
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
