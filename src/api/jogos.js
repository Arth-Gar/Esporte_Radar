// src/api/jogos.js (Vercel Serverless Function)
import https from 'https';

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
        rejectUnauthorized: false
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
      status: 'agendado'
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
      status: 'agendado'
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
      status: 'agendado'
    }
  ];
}

function getLibertadoresEvents() {
  return [
    {
      id: 'lib-csir-flu-ida',
      sport: 'futebol',
      homeTeam: 'Independiente Rivadavia',
      homeTeamLogo: 'https://gol-cdn.conmebol.com/icons/team/light/3x/id/158.png?version=2026040801',
      awayTeam: 'Fluminense',
      awayTeamLogo: 'https://conteudo.cbf.com.br/clubes/20014/escudo.jpg',
      date: '2026-08-18',
      time: '19:00',
      division: 'Libertadores',
      stadium: 'Estadio Malvinas Argentinas',
      broadcasters: ['ESPN', 'Disney+'],
      status: 'agendado'
    },
    {
      id: 'lib-tol-idv-ida',
      sport: 'futebol',
      homeTeam: 'Deportes Tolima',
      homeTeamLogo: 'https://images.fotmob.com/image_resources/logo/teamlogo/10111.png',
      awayTeam: 'Independiente del Valle',
      awayTeamLogo: 'https://images.fotmob.com/image_resources/logo/teamlogo/10089.png',
      date: '2026-08-18',
      time: '21:30',
      division: 'Libertadores',
      stadium: 'Estadio Manuel Murillo Toro',
      broadcasters: ['A confirmar'],
      status: 'agendado'
    },
    {
      id: 'lib-uc-est-ida',
      sport: 'futebol',
      homeTeam: 'Universidad Católica',
      homeTeamLogo: 'https://images.fotmob.com/image_resources/logo/teamlogo/10112.png',
      awayTeam: 'Estudiantes de La Plata',
      awayTeamLogo: 'https://images.fotmob.com/image_resources/logo/teamlogo/10091.png',
      date: '2026-08-18',
      time: '21:30',
      division: 'Libertadores',
      stadium: 'Claro Arena',
      broadcasters: ['A confirmar'],
      status: 'agendado'
    },
    {
      id: 'lib-flu-csir-volta',
      sport: 'futebol',
      homeTeam: 'Fluminense',
      homeTeamLogo: 'https://conteudo.cbf.com.br/clubes/20014/escudo.jpg',
      awayTeam: 'Independiente Rivadavia',
      awayTeamLogo: 'https://gol-cdn.conmebol.com/icons/team/light/3x/id/158.png?version=2026040801',
      date: '2026-08-25',
      time: '19:00',
      division: 'Libertadores',
      stadium: 'Maracanã - Rio de Janeiro (RJ)',
      broadcasters: ['ESPN', 'Disney+'],
      status: 'agendado'
    },
    {
      id: 'lib-idv-tol-volta',
      sport: 'futebol',
      homeTeam: 'Independiente del Valle',
      homeTeamLogo: 'https://images.fotmob.com/image_resources/logo/teamlogo/10089.png',
      awayTeam: 'Deportes Tolima',
      awayTeamLogo: 'https://images.fotmob.com/image_resources/logo/teamlogo/10111.png',
      date: '2026-08-25',
      time: '21:30',
      division: 'Libertadores',
      stadium: 'Estadio Banco Guayaquil - Quito (ECU)',
      broadcasters: ['A confirmar'],
      status: 'agendado'
    },
    {
      id: 'lib-est-uc-volta',
      sport: 'futebol',
      homeTeam: 'Estudiantes de La Plata',
      homeTeamLogo: 'https://images.fotmob.com/image_resources/logo/teamlogo/10091.png',
      awayTeam: 'Universidad Católica',
      awayTeamLogo: 'https://images.fotmob.com/image_resources/logo/teamlogo/10112.png',
      date: '2026-08-25',
      time: '21:30',
      division: 'Libertadores',
      stadium: 'Estadio Jorge Luis Hirschi - La Plata (ARG)',
      broadcasters: ['A confirmar'],
      status: 'agendado'
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
    const currentDay = now.getDate();
    const monthStr = String(month).padStart(2, '0');
    const startDateStr = `${year}-${monthStr}-01`;
    const lastDay = new Date(year, month, 0).getDate();

    // Se estiver nos últimos 5 dias do mês ou se foi explicitamente solicitado, adianta os jogos do próximo mês
    const isLast5DaysOfMonth = currentDay >= (lastDay - 4);
    const advanceNextMonth = req.query?.advanceNextMonth === 'true' || isLast5DaysOfMonth;

    let endDateStr = `${year}-${monthStr}-${String(lastDay).padStart(2, '0')}`;
    if (advanceNextMonth) {
      const nextMonthDate = new Date(year, month, 1);
      const nextYear = nextMonthDate.getFullYear();
      const nextMonth = nextMonthDate.getMonth() + 1;
      const nextMonthLastDay = new Date(nextYear, nextMonth, 0).getDate();
      const nextMonthStr = String(nextMonth).padStart(2, '0');
      endDateStr = `${nextYear}-${nextMonthStr}-${String(nextMonthLastDay).padStart(2, '0')}`;
    }

    let scrapedGames = [];
    let page = 1;
    let lastPage = 1;
    const maxPages = advanceNextMonth ? 40 : 25;

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

            const homeLogo = game.mandante?.url_escudo || game.equipe_mandante?.escudo || 'https://www.cbf.com.br/assets/img/cbf-logo.png';
            const awayLogo = game.visitante?.url_escudo || game.equipe_visitante?.escudo || 'https://www.cbf.com.br/assets/img/cbf-logo.png';

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
            } else if (combinedComp.includes('copa do brasil') || combinedComp.includes('copa betano') || combinedComp.includes('betano')) {
              division = 'Copa Betano';
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

            // Determinar status dinâmico com base na data/hora do jogo
            let matchStatus = 'agendado';
            try {
              const [mYear, mMonth, mDay] = formattedDate.split('-').map(Number);
              const [mHour, mMin] = matchTime.split(':').map(Number);
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
              status: matchStatus,
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

    // Adicionar jogos confirmados que não vieram no feed (ex: Flamengo x Mirassol - 4ª rodada adiada)
    const confirmedRescheduledMatches = [
      {
        id: 'cbf-adiado-fla-mir-20260902',
        sport: 'futebol',
        competition: 'Campeonato Brasileiro Série A',
        division: 'Série A',
        round: '4ª Rodada (Jogo Adiado)',
        homeTeam: 'Flamengo',
        homeTeamSlug: 'flamengo',
        homeTeamLogo: 'https://conteudo.cbf.com.br/clubes/20016/escudo.jpg',
        awayTeam: 'Mirassol',
        awayTeamSlug: 'mirassol',
        awayTeamLogo: 'https://conteudo.cbf.com.br/clubes/20385/escudo.jpg',
        date: '2026-09-02',
        time: '19:30',
        stadium: 'Estádio do Maracanã - Rio de Janeiro, RJ',
        broadcasters: ['Premiere'],
        transmissionDetails: [
          { label: 'Premiere', url: 'https://ge.globo.com/premiere/' }
        ],
        transmissionUrl: 'https://ge.globo.com/premiere/',
        status: 'agendado',
        scraped: true
      }
    ];

    for (const match of confirmedRescheduledMatches) {
      const alreadyExists = scrapedGames.some(g =>
        g.date === match.date &&
        ((g.homeTeam?.toLowerCase().includes('flamengo') && g.awayTeam?.toLowerCase().includes('mirassol')) ||
         (g.homeTeam?.toLowerCase().includes('mirassol') && g.awayTeam?.toLowerCase().includes('flamengo')))
      );
      if (!alreadyExists) {
        scrapedGames.push(match);
      }
    }

    const otherSports = getOtherSportsEvents();
    const libertadoresEvents = getLibertadoresEvents();
    const combinedData = [...scrapedGames, ...libertadoresEvents, ...otherSports];

    res.status(200).json({
      success: true,
      source: 'vercel-serverless',
      timestamp: new Date().toISOString(),
      info: {
        scrapedCount: scrapedGames.length,
        total: combinedData.length
      },
      data: combinedData
    });

  } catch (error) {
    console.error("Erro no proxy Serverless da CBF:", error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao conectar com a API da CBF'
    });
  }
}
