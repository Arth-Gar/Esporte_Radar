// api/jogos.js (Vercel Serverless Function na raiz /api)
import https from 'https';

// Função para buscar JSON de forma segura contornando validação estrita de SSL da CBF
function fetchJsonSecurely(urlStr) {
  return new Promise((resolve, reject) => {
    try {
      const url = new URL(urlStr);
      const options = {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Referer': 'https://www.cbf.com.br/'
        },
        rejectUnauthorized: false // Bypasses SSL certificate errors for CBF site
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              reject(new Error('JSON inválido retornado pela CBF'));
            }
          } else {
            reject(new Error(`HTTP status ${res.statusCode}`));
          }
        });
      });

      req.on('error', (err) => reject(err));
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Timeout de conexão com a CBF'));
      });
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

function getClubLogo(name) {
  const n = (name || '').toLowerCase().trim();
  const logos = {
    'flamengo': 'https://conteudo.cbf.com.br/clubes/20016/escudo.jpg',
    'fluminense': 'https://conteudo.cbf.com.br/clubes/20014/escudo.jpg',
    'botafogo': 'https://conteudo.cbf.com.br/clubes/20011/escudo.jpg',
    'vasco': 'https://conteudo.cbf.com.br/clubes/20019/escudo.jpg',
    'palmeiras': 'https://conteudo.cbf.com.br/clubes/20005/escudo.jpg',
    'são paulo': 'https://conteudo.cbf.com.br/clubes/20002/escudo.jpg',
    'corinthians': 'https://conteudo.cbf.com.br/clubes/20001/escudo.jpg',
    'santos': 'https://conteudo.cbf.com.br/clubes/20003/escudo.jpg',
    'atlético-mg': 'https://conteudo.cbf.com.br/clubes/20007/escudo.jpg',
    'atletico mineiro': 'https://conteudo.cbf.com.br/clubes/20007/escudo.jpg',
    'cruzeiro': 'https://conteudo.cbf.com.br/clubes/20008/escudo.jpg',
    'grêmio': 'https://conteudo.cbf.com.br/clubes/20009/escudo.jpg',
    'internacional': 'https://conteudo.cbf.com.br/clubes/20010/escudo.jpg',
    'independiente rivadavia': 'https://images.fotmob.com/image_resources/logo/teamlogo/10077.png',
    'olimpia': 'https://images.fotmob.com/image_resources/logo/teamlogo/10080.png',
    'river plate': 'https://images.fotmob.com/image_resources/logo/teamlogo/10083.png',
    'nacional-uru': 'https://images.fotmob.com/image_resources/logo/teamlogo/10085.png',
    'ldu quito': 'https://images.fotmob.com/image_resources/logo/teamlogo/10088.png',
    'san lorenzo': 'https://images.fotmob.com/image_resources/logo/teamlogo/10082.png',
    'boca juniors': 'https://images.fotmob.com/image_resources/logo/teamlogo/10084.png',
    'peñarol': 'https://images.fotmob.com/image_resources/logo/teamlogo/10086.png',
    'colo-colo': 'https://images.fotmob.com/image_resources/logo/teamlogo/10087.png'
  };

  for (const [k, v] of Object.entries(logos)) {
    if (n.includes(k)) return v;
  }
  return 'https://conteudo.cbf.com.br/clubes/20014/escudo.jpg';
}

function getLibertadoresEvents() {
  return [
    {
      id: 'lib-flu-csir',
      sport: 'futebol',
      competition: 'CONMEBOL Libertadores',
      round: 'Oitavas de Final - Ida',
      homeTeam: 'Fluminense',
      homeTeamLogo: getClubLogo('Fluminense'),
      awayTeam: 'Independiente Rivadavia',
      awayTeamLogo: getClubLogo('Independiente Rivadavia'),
      date: '2026-08-18',
      time: '19:00',
      division: 'Libertadores',
      stadium: 'Maracanã - Rio de Janeiro (RJ)',
      broadcasters: ['Paramount+', 'ESPN 4', 'Disney+'],
      status: 'agendado',
      scraped: false
    },
    {
      id: 'lib-1',
      sport: 'futebol',
      competition: 'CONMEBOL Libertadores',
      round: 'Oitavas de Final - Ida',
      homeTeam: 'Flamengo',
      homeTeamLogo: getClubLogo('Flamengo'),
      awayTeam: 'Olimpia',
      awayTeamLogo: getClubLogo('Olimpia'),
      date: '2026-08-18',
      time: '21:30',
      division: 'Libertadores',
      stadium: 'Maracanã - Rio de Janeiro (RJ)',
      broadcasters: ['TV Globo', 'ESPN', 'Disney+', 'Paramount+'],
      status: 'agendado',
      scraped: false
    },
    {
      id: 'lib-2',
      sport: 'futebol',
      competition: 'CONMEBOL Libertadores',
      round: 'Oitavas de Final - Ida',
      homeTeam: 'River Plate',
      homeTeamLogo: getClubLogo('River Plate'),
      awayTeam: 'Palmeiras',
      awayTeamLogo: getClubLogo('Palmeiras'),
      date: '2026-08-19',
      time: '21:30',
      division: 'Libertadores',
      stadium: 'Monumental de Núñez - Buenos Aires (ARG)',
      broadcasters: ['ESPN', 'Disney+', 'Paramount+'],
      status: 'agendado',
      scraped: false
    },
    {
      id: 'lib-3',
      sport: 'futebol',
      competition: 'CONMEBOL Libertadores',
      round: 'Oitavas de Final - Ida',
      homeTeam: 'Botafogo',
      homeTeamLogo: getClubLogo('Botafogo'),
      awayTeam: 'Nacional-URU',
      awayTeamLogo: getClubLogo('Nacional-URU'),
      date: '2026-08-20',
      time: '19:00',
      division: 'Libertadores',
      stadium: 'Nilton Santos (Engenhão) - Rio de Janeiro (RJ)',
      broadcasters: ['Paramount+', 'ESPN', 'Disney+'],
      status: 'agendado',
      scraped: false
    },
    {
      id: 'lib-4',
      sport: 'futebol',
      competition: 'CONMEBOL Libertadores',
      round: 'Oitavas de Final - Ida',
      homeTeam: 'São Paulo',
      homeTeamLogo: getClubLogo('São Paulo'),
      awayTeam: 'LDU Quito',
      awayTeamLogo: getClubLogo('LDU Quito'),
      date: '2026-08-20',
      time: '21:30',
      division: 'Libertadores',
      stadium: 'MorumBIS - São Paulo (SP)',
      broadcasters: ['TV Globo', 'ESPN', 'Disney+'],
      status: 'agendado',
      scraped: false
    },
    {
      id: 'lib-5',
      sport: 'futebol',
      competition: 'CONMEBOL Libertadores',
      round: 'Oitavas de Final - Volta',
      homeTeam: 'Palmeiras',
      homeTeamLogo: getClubLogo('Palmeiras'),
      awayTeam: 'River Plate',
      awayTeamLogo: getClubLogo('River Plate'),
      date: '2026-08-26',
      time: '21:30',
      division: 'Libertadores',
      stadium: 'Allianz Parque - São Paulo (SP)',
      broadcasters: ['TV Globo', 'ESPN', 'Disney+', 'Paramount+'],
      status: 'agendado',
      scraped: false
    },
    {
      id: 'lib-6',
      sport: 'futebol',
      competition: 'CONMEBOL Libertadores',
      round: 'Oitavas de Final - Volta',
      homeTeam: 'Olimpia',
      homeTeamLogo: getClubLogo('Olimpia'),
      awayTeam: 'Flamengo',
      awayTeamLogo: getClubLogo('Flamengo'),
      date: '2026-08-27',
      time: '21:30',
      division: 'Libertadores',
      stadium: 'Defensores del Chaco - Assunção (PAR)',
      broadcasters: ['ESPN', 'Disney+', 'Paramount+'],
      status: 'agendado',
      scraped: false
    },
    {
      id: 'lib-7',
      sport: 'futebol',
      competition: 'CONMEBOL Libertadores',
      round: 'Oitavas de Final - Volta',
      homeTeam: 'Atlético-MG',
      homeTeamLogo: getClubLogo('Atlético-MG'),
      awayTeam: 'San Lorenzo',
      awayTeamLogo: getClubLogo('San Lorenzo'),
      date: '2026-08-27',
      time: '19:00',
      division: 'Libertadores',
      stadium: 'Arena MRV - Belo Horizonte (MG)',
      broadcasters: ['Paramount+', 'Disney+'],
      status: 'agendado',
      scraped: false
    }
  ];
}

function getOtherSportsEvents() {
  return [
    {
      id: 'bskt-1',
      sport: 'basquete',
      homeTeam: 'Sesi Franca',
      homeTeamLogo: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=120&auto=format&fit=crop&q=80',
      awayTeam: 'Flamengo Basquete',
      awayTeamLogo: 'https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/flamengo.png',
      date: '2026-08-12',
      time: '20:00',
      division: 'NBB',
      stadium: 'Ginásio Pedrocão - Franca',
      broadcasters: ['SporTV 3', 'YouTube NBB', 'TV Cultura'],
      status: 'agendado',
      scraped: false
    },
    {
      id: 'volei-1',
      sport: 'volei',
      homeTeam: 'Sada Cruzeiro',
      homeTeamLogo: 'https://conteudo.imguol.com.br/c/esporte/futebol/brasileirao2020/cruzeiro.png',
      awayTeam: 'Minas Tênis Clube',
      awayTeamLogo: 'https://images.unsplash.com/photo-1592656094267-764a45160876?w=120&auto=format&fit=crop&q=80',
      date: '2026-08-13',
      time: '21:30',
      division: 'Superliga Masc.',
      stadium: 'Ginásio do Riacho - Contagem',
      broadcasters: ['SporTV 2'],
      status: 'agendado',
      scraped: false
    },
    {
      id: 'auto-1',
      sport: 'automobilismo',
      homeTeam: 'GP da Holanda (F1)',
      homeTeamLogo: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=120&auto=format&fit=crop&q=80',
      awayTeam: 'Zandvoort Circuit',
      awayTeamLogo: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=120&auto=format&fit=crop&q=80',
      date: '2026-08-23',
      time: '10:00',
      division: 'Fórmula 1',
      stadium: 'Circuito de Zandvoort - Holanda',
      broadcasters: ['Band', 'BandSports', 'F1 TV Pro'],
      status: 'agendado',
      scraped: false
    },
    {
      id: 'mma-1',
      sport: 'lutas',
      homeTeam: 'UFC 305: Du Plessis vs. Adesanya',
      homeTeamLogo: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=120&auto=format&fit=crop&q=80',
      awayTeam: 'Disputa de Cinturão Peso Médio',
      awayTeamLogo: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=120&auto=format&fit=crop&q=80',
      date: '2026-08-17',
      time: '23:00',
      division: 'UFC',
      stadium: 'RAC Arena - Perth (Austrália)',
      broadcasters: ['UFC Fight Pass', 'Band (Card Preliminar)'],
      status: 'agendado',
      scraped: false
    }
  ];
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const monthStr = String(month).padStart(2, '0');
    const startDateStr = `${year}-${monthStr}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDateStr = `${year}-${monthStr}-${String(lastDay).padStart(2, '0')}`;

    let scrapedGames = [];
    let page = 1;
    let lastPage = 1;
    const maxPages = 15;

    while (page <= lastPage && page <= maxPages) {
      try {
        const cbfUrl = `https://www.cbf.com.br/api/cbf/onde-assistir/jogos?page=${page}&dataInicio=${startDateStr}&dataTermino=${endDateStr}`;
        const result = await fetchJsonSecurely(cbfUrl);

        const meta = result.meta || {};
        lastPage = typeof meta.last_page === 'number' ? meta.last_page : 1;

        const games = result.jogos || result.data || [];
        if (games.length === 0) break;

        for (const game of games) {
          try {
            const homeName = game.mandante?.nome || game.equipe_mandante?.nome_popular || game.equipe_mandante?.nome || 'A definir';
            const awayName = game.visitante?.nome || game.equipe_visitante?.nome_popular || game.equipe_visitante?.nome || 'A definir';

            if (homeName === 'A definir' && awayName === 'A definir') continue;

            const homeLogo = game.mandante?.url_escudo || game.equipe_mandante?.escudo || getClubLogo(homeName);
            const awayLogo = game.visitante?.url_escudo || game.equipe_visitante?.escudo || getClubLogo(awayName);

            let formattedDate = game.data_realizacao || game.data || '';
            if (formattedDate.includes('/')) {
              const parts = formattedDate.split('/');
              if (parts.length === 3) {
                formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
              }
            }
            if (!formattedDate) {
              formattedDate = `${year}-${monthStr}-${String(now.getDate()).padStart(2, '0')}`;
            }

            const timeVal = game.hora || game.hora_realizacao || '16:00';
            const matchTime = timeVal.length >= 5 ? timeVal.substring(0, 5) : timeVal;

            const compName = game.competicao?.campeonato_nome || game.campeonato?.nome || game.competicao || 'Futebol Brasileiro';
            const catName = game.competicao?.categoria_nome || '';
            const combinedComp = `${compName} ${catName}`.toLowerCase();

            let division = 'Série A';
            if (combinedComp.includes('série b') || combinedComp.includes('serie b')) {
              division = 'Série B';
            } else if (combinedComp.includes('série c') || combinedComp.includes('serie c')) {
              division = 'Série C';
            } else if (combinedComp.includes('série d') || combinedComp.includes('serie d')) {
              division = 'Série D';
            } else if (combinedComp.includes('copa do brasil')) {
              division = 'Copa do Brasil';
            } else if (combinedComp.includes('feminino')) {
              division = 'Feminino';
            }

            const transmissions = game.transmissoes || [];
            const broadcasters = [];
            if (Array.isArray(transmissions)) {
              transmissions.forEach((t) => {
                const bName = typeof t === 'string' ? t : (t.nome || t.veiculo || t.transmissao);
                if (bName && !broadcasters.includes(bName)) {
                  broadcasters.push(bName);
                }
              });
            }
            if (broadcasters.length === 0) broadcasters.push('CBF TV');

            scrapedGames.push({
              id: `api-cbf-${game.id || game.id_jogo || Math.random().toString(36).substring(2, 9)}`,
              sport: 'futebol',
              homeTeam: homeName,
              homeTeamLogo: homeLogo,
              awayTeam: awayName,
              awayTeamLogo: awayLogo,
              date: formattedDate,
              time: matchTime,
              division: division,
              stadium: game.local || 'A definir',
              broadcasters: broadcasters,
              status: 'agendado',
              scraped: true
            });
          } catch (itemErr) {
            console.warn('Erro ao processar item individual:', itemErr);
          }
        }

        page++;
      } catch (err) {
        console.warn(`Erro na busca da página ${page}:`, err);
        break;
      }
    }

    const libertadoresEvents = getLibertadoresEvents();
    const otherSports = getOtherSportsEvents();
    
    // Combine and sort
    const combinedData = [...scrapedGames, ...libertadoresEvents, ...otherSports];
    combinedData.sort((a, b) => (a.date || '').localeCompare(b.date || '') || (a.time || '').localeCompare(b.time || ''));

    res.status(200).json({
      success: true,
      source: 'vercel-serverless',
      timestamp: new Date().toISOString(),
      info: {
        scrapedCount: scrapedGames.length,
        libertadoresCount: libertadoresEvents.length,
        otherSportsCount: otherSports.length,
        total: combinedData.length
      },
      data: combinedData
    });

  } catch (error) {
    console.error("Erro no proxy Serverless da CBF:", error);
    // Even if CBF fails, return curated events
    const libertadoresEvents = getLibertadoresEvents();
    const otherSports = getOtherSportsEvents();
    const fallbackData = [...libertadoresEvents, ...otherSports];

    res.status(200).json({
      success: true,
      source: 'vercel-fallback',
      warning: error.message || 'Erro ao conectar com a API da CBF',
      data: fallbackData
    });
  }
}
