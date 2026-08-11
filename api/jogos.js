// api/jogos.js (Vercel Serverless Function na raiz /api)
export default async function handler(req, res) {
  // Configurar cabeçalhos CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Tratar requisição prévia do navegador (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 10);

    const formatDate = (date) => date.toISOString().split('T')[0];
    const dataInicio = formatDate(today);
    const dataTermino = formatDate(nextWeek);

    let allMappedGames = [];
    let page = 1;
    let lastPage = 1;
    const maxPages = 5;

    while (page <= lastPage && page <= maxPages) {
      try {
        const cbfUrl = `https://www.cbf.com.br/api/cbf/onde-assistir/jogos?page=${page}&dataInicio=${dataInicio}&dataTermino=${dataTermino}`;
        const response = await fetch(cbfUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            'Referer': 'https://www.cbf.com.br/'
          }
        });

        if (!response.ok) break;

        const data = await response.json();
        const meta = data.meta || {};
        lastPage = typeof meta.last_page === 'number' ? meta.last_page : 1;

        const items = data.data || [];
        for (const item of items) {
          const homeName = item.equipe_mandante?.nome_popular || item.equipe_mandante?.nome || 'Time Casa';
          const awayName = item.equipe_visitante?.nome_popular || item.equipe_visitante?.nome || 'Time Fora';
          const homeLogo = item.equipe_mandante?.escudo || 'https://www.cbf.com.br/assets/img/cbf-logo.png';
          const awayLogo = item.equipe_visitante?.escudo || 'https://www.cbf.com.br/assets/img/cbf-logo.png';

          const rawDate = item.data_realizacao || item.data || '';
          const rawTime = item.hora_realizacao || item.hora || '16:00';
          const matchTime = rawTime.length >= 5 ? rawTime.substring(0, 5) : rawTime;

          const broadcasters = [];
          if (Array.isArray(item.transmissoes)) {
            item.transmissoes.forEach((t) => {
              const name = t.veiculo || t.nome || t.transmissao;
              if (name && !broadcasters.includes(name)) {
                broadcasters.push(name);
              }
            });
          }
          if (broadcasters.length === 0) broadcasters.push('CBF TV');

          const divisionName = item.campeonato?.nome || item.competicao || 'Brasileirão';

          let status = 'agendado';
          if (item.status === 'encerrado' || item.finalizado) {
            status = 'finalizado';
          } else if (item.status === 'em_andamento' || item.ao_vivo) {
            status = 'ao_vivo';
          }

          allMappedGames.push({
            id: `cbf-api-${item.id || Math.random().toString(36).substr(2, 9)}`,
            date: rawDate,
            time: matchTime,
            homeTeam: homeName,
            homeTeamLogo: homeLogo,
            awayTeam: awayName,
            awayTeamLogo: awayLogo,
            division: divisionName,
            broadcasters,
            status,
            cbfLink: item.link || 'https://www.cbf.com.br'
          });
        }

        page++;
      } catch (err) {
        console.warn(`Erro na página ${page} do Vercel Serverless:`, err);
        break;
      }
    }

    res.status(200).json({
      success: true,
      source: 'vercel-serverless',
      timestamp: new Date().toISOString(),
      info: {
        scrapedCount: allMappedGames.length
      },
      data: allMappedGames
    });

  } catch (error) {
    console.error("Erro no proxy Serverless da CBF:", error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao conectar com a API da CBF'
    });
  }
}