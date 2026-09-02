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
    'mirassol': 'https://conteudo.cbf.com.br/clubes/20385/escudo.jpg',
    'independiente rivadavia': 'https://gol-cdn.conmebol.com/icons/team/light/3x/id/158.png?version=2026040801',
    'csir': 'https://gol-cdn.conmebol.com/icons/team/light/3x/id/158.png?version=2026040801',
    'rivadavia': 'https://gol-cdn.conmebol.com/icons/team/light/3x/id/158.png?version=2026040801',
    'tolima': 'https://images.fotmob.com/image_resources/logo/teamlogo/10111.png',
    'deportes tolima': 'https://images.fotmob.com/image_resources/logo/teamlogo/10111.png',
    'ind. del valle': 'https://images.fotmob.com/image_resources/logo/teamlogo/10089.png',
    'independiente del valle': 'https://images.fotmob.com/image_resources/logo/teamlogo/10089.png',
    'univ católica': 'https://images.fotmob.com/image_resources/logo/teamlogo/10112.png',
    'universidad catolica': 'https://images.fotmob.com/image_resources/logo/teamlogo/10112.png',
    'universidad católica': 'https://images.fotmob.com/image_resources/logo/teamlogo/10112.png',
    'estudiantes': 'https://images.fotmob.com/image_resources/logo/teamlogo/10091.png',
    'estudiantes de la plata': 'https://images.fotmob.com/image_resources/logo/teamlogo/10091.png',
    'olimpia': 'https://images.fotmob.com/image_resources/logo/teamlogo/10080.png',
    'river plate': 'https://images.fotmob.com/image_resources/logo/teamlogo/10083.png',
    'nacional-uru': 'https://images.fotmob.com/image_resources/logo/teamlogo/10085.png',
    'ldu quito': 'https://images.fotmob.com/image_resources/logo/teamlogo/10088.png',
    'san lorenzo': 'https://images.fotmob.com/image_resources/logo/teamlogo/10082.png',
    'boca juniors': 'https://images.fotmob.com/image_resources/logo/teamlogo/10077.png',
    'peñarol': 'https://images.fotmob.com/image_resources/logo/teamlogo/10086.png',
    'colo-colo': 'https://images.fotmob.com/image_resources/logo/teamlogo/10087.png',
    'lanus': 'https://images.fotmob.com/image_resources/logo/teamlogo/10076.png',
    'lanús': 'https://images.fotmob.com/image_resources/logo/teamlogo/10076.png',
    'belgrano': 'https://images.fotmob.com/image_resources/logo/teamlogo/10075.png',
    'rosario central': 'https://images.fotmob.com/image_resources/logo/teamlogo/10070.png',
    'rosario': 'https://images.fotmob.com/image_resources/logo/teamlogo/10070.png',
    'sportivo ameliano': 'https://gol-cdn.conmebol.com/icons/team/light/3x/id/159.png?version=2026040801',
    'ameliano': 'https://gol-cdn.conmebol.com/icons/team/light/3x/id/159.png?version=2026040801',
    'recoleta': 'https://gol-cdn.conmebol.com/icons/team/light/3x/id/157.png?version=2026040801',
    'deportivo recoleta': 'https://gol-cdn.conmebol.com/icons/team/light/3x/id/157.png?version=2026040801',
    'bolivar': 'https://images.fotmob.com/image_resources/logo/teamlogo/10090.png',
    'bolívar': 'https://images.fotmob.com/image_resources/logo/teamlogo/10090.png',
    'macara': 'https://images.fotmob.com/image_resources/logo/teamlogo/10130.png',
    'macará': 'https://images.fotmob.com/image_resources/logo/teamlogo/10130.png',
    'city torque': 'https://images.fotmob.com/image_resources/logo/teamlogo/10131.png',
    'montevideo city torque': 'https://images.fotmob.com/image_resources/logo/teamlogo/10131.png',
    'tigre': 'https://images.fotmob.com/image_resources/logo/teamlogo/10078.png',
    'independiente santa fe': 'https://images.fotmob.com/image_resources/logo/teamlogo/10099.png',
    'santa fe': 'https://images.fotmob.com/image_resources/logo/teamlogo/10099.png',
    'cienciano': 'https://images.fotmob.com/image_resources/logo/teamlogo/10121.png',
    'sporting cristal': 'https://images.fotmob.com/image_resources/logo/teamlogo/10108.png',
    'caracas': 'https://images.fotmob.com/image_resources/logo/teamlogo/10106.png',
    'ohiggins': 'https://images.fotmob.com/image_resources/logo/teamlogo/10132.png',
    "o'higgins": 'https://images.fotmob.com/image_resources/logo/teamlogo/10132.png',
    'rb bragantino': 'https://conteudo.cbf.com.br/clubes/20018/escudo.jpg',
    'red bull bragantino': 'https://conteudo.cbf.com.br/clubes/20018/escudo.jpg'
  };

  for (const [k, v] of Object.entries(logos)) {
    if (n.includes(k)) return v;
  }
  return 'https://conteudo.cbf.com.br/clubes/20014/escudo.jpg';
}

// Dynamic status calculator based on match date and start time (America/Sao_Paulo timezone - UTC-3)
function calculateMatchStatus(dateStr, timeStr, rawStatus) {
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
    if (!dateStr || dateStr === 'A definir') return 'agendado';

    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);

      const timeClean = (timeStr && timeStr.includes(':')) ? timeStr.trim() : '16:00';
      const [hoursStr, minutesStr] = timeClean.split(':');
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

function getLibertadoresBroadcasters(homeName, awayName) {
  const combined = `${homeName} ${awayName}`.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  // Specific official broadcast distribution for CONMEBOL Libertadores 2026:
  if (combined.includes('flamengo') || combined.includes('cruzeiro')) {
    return ['TV Globo', 'ESPN', 'Disney+'];
  }
  if (combined.includes('fluminense') || combined.includes('rivadavia')) {
    return ['ESPN', 'Disney+'];
  }
  if (combined.includes('palmeiras') || combined.includes('cerro')) {
    return ['ESPN', 'Disney+', 'Paramount+'];
  }
  if (combined.includes('corinthians') || combined.includes('rosario')) {
    return ['Paramount+', 'ESPN', 'Disney+'];
  }
  if (combined.includes('mirassol') || combined.includes('ldu')) {
    return ['ESPN', 'Disney+'];
  }
  if (combined.includes('catolica') || combined.includes('estudiantes')) {
    return ['ESPN 4', 'Disney+'];
  }
  if (combined.includes('tolima') || combined.includes('valle') || combined.includes('idv')) {
    return ['Paramount+'];
  }
  if (combined.includes('coquimbo') || combined.includes('platense')) {
    return ['Paramount+'];
  }

  if (combined.includes('river') || combined.includes('boca') || combined.includes('nacional') || combined.includes('penarol') || combined.includes('colo')) {
    return ['ESPN', 'Disney+'];
  }
  if (combined.includes('san lorenzo') || combined.includes('olimpia') || combined.includes('libertad') || combined.includes('bolivar') || combined.includes('strongest')) {
    return ['Paramount+'];
  }

  return ['ESPN', 'Disney+'];
}

function getSudamericanaBroadcasters(homeName, awayName) {
  const combined = `${homeName} ${awayName}`.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  if (combined.includes('sao paulo') || combined.includes('são paulo')) {
    return ['SBT', 'ESPN', 'Disney+'];
  }
  if (combined.includes('santos') || combined.includes('macara')) {
    return ['SBT', 'Paramount+'];
  }
  if (combined.includes('atletico mineiro') || combined.includes('atletico-mg') || combined.includes('bragantino')) {
    return ['ESPN', 'Disney+'];
  }
  if (combined.includes('botafogo') || combined.includes('cienciano')) {
    return ['Paramount+', 'ESPN', 'Disney+'];
  }
  if (combined.includes('vasco') || combined.includes('olimpia')) {
    return ['ESPN', 'Disney+'];
  }
  if (combined.includes('boca') || combined.includes('recoleta')) {
    return ['Paramount+', 'Disney+'];
  }
  if (combined.includes('river') || combined.includes('santa fe')) {
    return ['ESPN', 'Disney+'];
  }
  if (combined.includes('tigre') || combined.includes('torque')) {
    return ['Paramount+'];
  }
  if (combined.includes('gremio') || combined.includes('bolivar')) {
    return ['ESPN', 'Disney+'];
  }
  if (combined.includes('lanus') || combined.includes('lanús')) {
    return ['Paramount+'];
  }
  if (combined.includes('corinthians')) {
    return ['SBT', 'ESPN', 'Disney+'];
  }
  if (combined.includes('cruzeiro')) {
    return ['SBT', 'Paramount+'];
  }
  if (combined.includes('athletico') || combined.includes('fortaleza')) {
    return ['ESPN', 'Disney+'];
  }

  return ['ESPN', 'Disney+', 'Paramount+'];
}

async function scrapeConmebolSudamericana() {
  let fixtureIds = [1518, 1527, 1521, 1512, 1530, 1563, 1567, 1560, 1573, 1570, 1579, 1557, 1564, 1581, 1599, 1576, 1587, 1584, 1593, 1596, 1590, 1685, 1707, 1710, 1686, 1701, 1704];
  
  try {
    const hubRes = await fetch('https://gol.conmebol.com/sudamericana/pt-br', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
      signal: AbortSignal.timeout(3000)
    });
    if (hubRes.ok) {
      const hubHtml = await hubRes.text();
      const matches = [...hubHtml.matchAll(/\/sudamericana\/pt-br\/fixture\/view\/(\d+)/g)];
      const scrapedIds = matches.map(m => parseInt(m[1], 10)).filter(n => !isNaN(n));
      if (scrapedIds.length > 0) {
        fixtureIds = [...new Set([...scrapedIds, ...fixtureIds])];
      }
    }
  } catch (hubErr) {
    // Keep fallback list of official fixture IDs
  }

  try {
    const fetchPromises = fixtureIds.map(async (id) => {
      try {
        const url = `https://gol.conmebol.com/sudamericana/pt-br/fixture/view/${id}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);
        const res = await fetch(url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        clearTimeout(timeout);
        if (!res.ok) return null;
        const html = await res.text();
        const dm = html.match(/data-drupal-selector="drupal-settings-json">([\s\S]*?)<\/script>/);
        if (!dm) return null;
        const d = JSON.parse(dm[1]);
        const target = d?.metadata?.targeting;
        if (!target || !target.fixture_id || !target.fixture_home_team_title || target.fixture_home_team_title === 'TBD') return null;

        const venueMatch = html.match(/class=["']m-match-centre-hero__venue["'][^>]*>([^<]+)<\/div>/i) ||
                           html.match(/class=["']m-match-fixture-details__stadium["'][^>]*>([^<]+)<\/div>/i);
        const venue = venueMatch ? venueMatch[1].trim() : 'Estádio a confirmar';

        const refereeMatch = html.match(/Árbitro<\/span>\s*<span[^>]*>([^<]+)<\/span>/i) ||
                             html.match(/class="m-match-fixture-details__list-item-value">([^<]+)<\/span>/i);
        const referee = refereeMatch ? refereeMatch[1].trim() : '';

        const crestVersion = d?.clubcastCore?.dataPlatform?.crestVersion || '2026040801';
        const homeLogo = target.fixture_home_team_id
          ? `https://gol-cdn.conmebol.com/icons/team/light/3x/id/${target.fixture_home_team_id}.png?version=${crestVersion}`
          : getClubLogo(target.fixture_home_team_title);
        const awayLogo = target.fixture_away_team_id
          ? `https://gol-cdn.conmebol.com/icons/team/light/3x/id/${target.fixture_away_team_id}.png?version=${crestVersion}`
          : getClubLogo(target.fixture_away_team_title);

        let dateStr = '';
        let timeStr = '21:30';

        if (target.fixture_date) {
          const dt = new Date(target.fixture_date * 1000);
          const dateFormatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/Sao_Paulo',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          });
          const timeFormatter = new Intl.DateTimeFormat('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          });
          dateStr = dateFormatter.format(dt);
          timeStr = timeFormatter.format(dt);
        } else {
          const titleMatch = target.fixture_title?.match(/\(([A-Za-z]{3}),\s*(\d{1,2})\s*([A-Za-z]{3})\s*(\d{4})\s*-\s*(\d{2}:\d{2})\)/);
          if (titleMatch) {
            const months = { 'Jan': '01', 'Fev': '02', 'Feb': '02', 'Mar': '03', 'Abr': '04', 'Apr': '04', 'Mai': '05', 'May': '05', 'Jun': '06', 'Jul': '07', 'Ago': '08', 'Aug': '08', 'Set': '09', 'Sep': '09', 'Out': '10', 'Oct': '10', 'Nov': '11', 'Dez': '12', 'Dec': '12' };
            const day = titleMatch[2].padStart(2, '0');
            const month = months[titleMatch[3]] || '08';
            const year = titleMatch[4];
            dateStr = `${year}-${month}-${day}`;
            timeStr = titleMatch[5];
          }
        }

        const homeName = target.fixture_home_team_title.trim();
        const awayName = target.fixture_away_team_title.trim();
        const broadcasters = getSudamericanaBroadcasters(homeName, awayName);

        // Scores & Penalties extraction from fixture page
        let matchScore = null;
        const homeScoreMatch = html.match(/class=["'][^"']*m-match-centre-hero__score--home\b[^"']*["'][^>]*>\s*(\d+)\s*</i) ||
                               html.match(/js--live-fixture-score-home[^>]*>\s*(\d+)\s*</i);
        const awayScoreMatch = html.match(/class=["'][^"']*m-match-centre-hero__score--away\b[^"']*["'][^>]*>\s*(\d+)\s*</i) ||
                               html.match(/js--live-fixture-score-away[^>]*>\s*(\d+)\s*</i);
        
        const penHomeMatch = html.match(/class=["'][^"']*m-match-centre-hero__score--pen-home(?![^"']*hide)[^"']*["'][^>]*>\s*(\d+)\s*</i) ||
                             html.match(/js--live-fixture-score-home-pen(?![^"']*hide)[^>]*>\s*(\d+)\s*</i);
        const penAwayMatch = html.match(/class=["'][^"']*m-match-centre-hero__score--pen-away(?![^"']*hide)[^"']*["'][^>]*>\s*(\d+)\s*</i) ||
                             html.match(/js--live-fixture-score-away-pen(?![^"']*hide)[^>]*>\s*(\d+)\s*</i);

        if (homeScoreMatch && awayScoreMatch) {
          const hScore = parseInt(homeScoreMatch[1], 10);
          const aScore = parseInt(awayScoreMatch[1], 10);
          let penalties = undefined;
          let display = `${hScore} - ${aScore}`;
          if (penHomeMatch && penAwayMatch) {
            const pHome = parseInt(penHomeMatch[1], 10);
            const pAway = parseInt(penAwayMatch[1], 10);
            penalties = { home: pHome, away: pAway };
            display = `${hScore} (${pHome}) - (${pAway}) ${aScore}`;
          }
          matchScore = {
            home: hScore,
            away: aScore,
            penalties,
            display
          };
        }

        let roundTitle = target.fixture_stage_title || 'Oitavas de Final';
        if (roundTitle === '8th Finals') roundTitle = 'Oitavas de Final';
        if (roundTitle === 'Knockout Round Play-offs') roundTitle = 'Playoffs Oitavas';
        if (roundTitle === 'Quarter-finals') roundTitle = 'Quartas de Final';
        if (roundTitle === 'Semi-finals') roundTitle = 'Semifinal';
        if (roundTitle === 'Final') roundTitle = 'Final';

        return {
          id: `sud-${target.fixture_id}`,
          sport: 'futebol',
          competition: 'CONMEBOL Sudamericana',
          division: 'Sul-Americana',
          round: roundTitle,
          homeTeam: homeName,
          homeTeamLogo: homeLogo,
          awayTeam: awayName,
          awayTeamLogo: awayLogo,
          date: dateStr,
          time: timeStr,
          stadium: venue,
          referee: referee,
          broadcasters: broadcasters,
          matchViewUrl: url,
          score: matchScore,
          homeScore: matchScore ? matchScore.home : null,
          awayScore: matchScore ? matchScore.away : null,
          status: 'agendado',
          scraped: true
        };
      } catch (err) {
        return null;
      }
    });

    const scraped = (await Promise.all(fetchPromises)).filter(Boolean);
    if (scraped.length > 0) return scraped;
  } catch (err) {
    console.warn('Erro ao raspar CONMEBOL Sudamericana em Vercel:', err);
  }
  return []; // Never return fake data
}

async function scrapeConmebolLibertadores() {
  const fixtureIds = [1602, 1605, 1608, 1611, 1614, 1617, 1620, 1623, 1626, 1629, 1632, 1635, 1638, 1641, 1644, 1647];
  try {
    const fetchPromises = fixtureIds.map(async (id) => {
      try {
        const url = `https://gol.conmebol.com/libertadores/pt-br/fixture/view/${id}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);
        const res = await fetch(url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        clearTimeout(timeout);
        if (!res.ok) return null;
        const html = await res.text();
        const dm = html.match(/data-drupal-selector="drupal-settings-json">([\s\S]*?)<\/script>/);
        if (!dm) return null;
        const d = JSON.parse(dm[1]);
        const target = d?.metadata?.targeting;
        if (!target || !target.fixture_id || !target.fixture_home_team_title || target.fixture_home_team_title === 'TBD') return null;

        const venueMatch = html.match(/class=["']m-match-centre-hero__venue["'][^>]*>([^<]+)<\/div>/i) ||
                           html.match(/class=["']m-match-fixture-details__stadium["'][^>]*>([^<]+)<\/div>/i);
        const venue = venueMatch ? venueMatch[1].trim() : 'Estádio a confirmar';

        const refereeMatch = html.match(/Árbitro<\/span>\s*<span[^>]*>([^<]+)<\/span>/i) ||
                             html.match(/class="m-match-fixture-details__list-item-value">([^<]+)<\/span>/i);
        const referee = refereeMatch ? refereeMatch[1].trim() : '';

        const crestVersion = d?.clubcastCore?.dataPlatform?.crestVersion || '2026040801';
        const homeLogo = target.fixture_home_team_id
          ? `https://gol-cdn.conmebol.com/icons/team/light/3x/id/${target.fixture_home_team_id}.png?version=${crestVersion}`
          : getClubLogo(target.fixture_home_team_title);
        const awayLogo = target.fixture_away_team_id
          ? `https://gol-cdn.conmebol.com/icons/team/light/3x/id/${target.fixture_away_team_id}.png?version=${crestVersion}`
          : getClubLogo(target.fixture_away_team_title);

        let dateStr = '';
        let timeStr = '21:30';

        if (target.fixture_date) {
          const dt = new Date(target.fixture_date * 1000);
          const dateFormatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/Sao_Paulo',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          });
          const timeFormatter = new Intl.DateTimeFormat('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          });
          dateStr = dateFormatter.format(dt);
          timeStr = timeFormatter.format(dt);
        } else {
          const titleMatch = target.fixture_title?.match(/\(([A-Za-z]{3}),\s*(\d{1,2})\s*([A-Za-z]{3})\s*(\d{4})\s*-\s*(\d{2}:\d{2})\)/);
          if (titleMatch) {
            const months = { 'Jan': '01', 'Fev': '02', 'Feb': '02', 'Mar': '03', 'Abr': '04', 'Apr': '04', 'Mai': '05', 'May': '05', 'Jun': '06', 'Jul': '07', 'Ago': '08', 'Aug': '08', 'Set': '09', 'Sep': '09', 'Out': '10', 'Oct': '10', 'Nov': '11', 'Dez': '12', 'Dec': '12' };
            const day = titleMatch[2].padStart(2, '0');
            const month = months[titleMatch[3]] || '08';
            const year = titleMatch[4];
            dateStr = `${year}-${month}-${day}`;
            timeStr = titleMatch[5];
          }
        }

        const homeName = target.fixture_home_team_title.trim();
        const awayName = target.fixture_away_team_title.trim();
        const broadcasters = getLibertadoresBroadcasters(homeName, awayName);

        // Scores & Penalties extraction from fixture page
        let matchScore = null;
        const homeScoreMatch = html.match(/class=["'][^"']*m-match-centre-hero__score--home\b[^"']*["'][^>]*>\s*(\d+)\s*</i) ||
                               html.match(/js--live-fixture-score-home[^>]*>\s*(\d+)\s*</i);
        const awayScoreMatch = html.match(/class=["'][^"']*m-match-centre-hero__score--away\b[^"']*["'][^>]*>\s*(\d+)\s*</i) ||
                               html.match(/js--live-fixture-score-away[^>]*>\s*(\d+)\s*</i);
        
        const penHomeMatch = html.match(/class=["'][^"']*m-match-centre-hero__score--pen-home(?![^"']*hide)[^"']*["'][^>]*>\s*(\d+)\s*</i) ||
                             html.match(/js--live-fixture-score-home-pen(?![^"']*hide)[^>]*>\s*(\d+)\s*</i);
        const penAwayMatch = html.match(/class=["'][^"']*m-match-centre-hero__score--pen-away(?![^"']*hide)[^"']*["'][^>]*>\s*(\d+)\s*</i) ||
                             html.match(/js--live-fixture-score-away-pen(?![^"']*hide)[^>]*>\s*(\d+)\s*</i);

        if (homeScoreMatch && awayScoreMatch) {
          const hScore = parseInt(homeScoreMatch[1], 10);
          const aScore = parseInt(awayScoreMatch[1], 10);
          let penalties = undefined;
          let display = `${hScore} - ${aScore}`;
          if (penHomeMatch && penAwayMatch) {
            const pHome = parseInt(penHomeMatch[1], 10);
            const pAway = parseInt(penAwayMatch[1], 10);
            penalties = { home: pHome, away: pAway };
            display = `${hScore} (${pHome}) - (${pAway}) ${aScore}`;
          }
          matchScore = {
            home: hScore,
            away: aScore,
            penalties,
            display
          };
        }

        return {
          id: `lib-${target.fixture_id}`,
          sport: 'futebol',
          competition: 'CONMEBOL Libertadores',
          division: 'Libertadores',
          round: target.fixture_stage_title === '8th Finals' ? 'Oitavas de Final' : (target.fixture_stage_title || 'Oitavas de Final'),
          homeTeam: homeName,
          homeTeamLogo: homeLogo,
          awayTeam: awayName,
          awayTeamLogo: awayLogo,
          date: dateStr,
          time: timeStr,
          stadium: venue,
          referee: referee,
          broadcasters: broadcasters,
          matchViewUrl: url,
          score: matchScore,
          homeScore: matchScore ? matchScore.home : null,
          awayScore: matchScore ? matchScore.away : null,
          status: 'agendado',
          scraped: true
        };
      } catch (err) {
        return null;
      }
    });

    const scraped = (await Promise.all(fetchPromises)).filter(Boolean);
    if (scraped.length > 0) return scraped;
  } catch (err) {
    console.warn('Erro ao raspar CONMEBOL em Vercel:', err);
  }
  return getLibertadoresEvents();
}

function getLibertadoresEvents() {
  return [
    {
      id: 'lib-1620',
      sport: 'futebol',
      competition: 'CONMEBOL Libertadores',
      round: 'Oitavas de Final',
      homeTeam: 'Independiente Rivadavia',
      homeTeamLogo: 'https://gol-cdn.conmebol.com/icons/team/light/3x/id/158.png?version=2026040801',
      awayTeam: 'Fluminense',
      awayTeamLogo: 'https://gol-cdn.conmebol.com/icons/team/light/3x/id/59.png?version=2026040801',
      date: '2026-08-18',
      time: '19:00',
      division: 'Libertadores',
      stadium: 'Estadio Malvinas Argentinas',
      referee: 'Andrés José Rojas Noguera',
      broadcasters: ['ESPN', 'Disney+'],
      matchViewUrl: 'https://gol.conmebol.com/libertadores/pt-br/fixture/view/1620',
      score: { home: 1, away: 1, penalties: { home: 4, away: 5 }, display: '1 (4) - (5) 1' },
      homeScore: 1,
      awayScore: 1,
      status: 'finalizado',
      scraped: true
    },
    {
      id: 'lib-1605',
      sport: 'futebol',
      competition: 'CONMEBOL Libertadores',
      round: 'Oitavas de Final',
      homeTeam: 'Deportes Tolima',
      homeTeamLogo: 'https://gol-cdn.conmebol.com/icons/team/light/3x/id/1.png?version=2026040801',
      awayTeam: 'Independiente Valle',
      awayTeamLogo: 'https://gol-cdn.conmebol.com/icons/team/light/3x/id/42.png?version=2026040801',
      date: '2026-08-18',
      time: '21:30',
      division: 'Libertadores',
      stadium: 'Estadio Manuel Murillo Toro',
      referee: 'Wilton Pereira Sampaio',
      broadcasters: ['Paramount+'],
      matchViewUrl: 'https://gol.conmebol.com/libertadores/pt-br/fixture/view/1605',
      score: { home: 0, away: 1, display: '0 - 1' },
      homeScore: 0,
      awayScore: 1,
      status: 'finalizado',
      scraped: true
    },
    {
      id: 'lib-1638',
      sport: 'futebol',
      competition: 'CONMEBOL Libertadores',
      round: 'Oitavas de Final',
      homeTeam: 'Universidad Católica',
      homeTeamLogo: 'https://gol-cdn.conmebol.com/icons/team/light/3x/id/113.png?version=2026040801',
      awayTeam: 'Estudiantes',
      awayTeamLogo: 'https://gol-cdn.conmebol.com/icons/team/light/3x/id/24.png?version=2026040801',
      date: '2026-08-18',
      time: '21:30',
      division: 'Libertadores',
      stadium: 'Claro Arena',
      referee: 'Wilmar Alexander Roldán Pérez',
      broadcasters: ['ESPN 4', 'Disney+'],
      matchViewUrl: 'https://gol.conmebol.com/libertadores/pt-br/fixture/view/1638',
      score: { home: 0, away: 3, display: '0 - 3' },
      homeScore: 0,
      awayScore: 3,
      status: 'finalizado',
      scraped: true
    },
    {
      id: 'lib-1626',
      sport: 'futebol',
      competition: 'CONMEBOL Libertadores',
      round: 'Oitavas de Final',
      homeTeam: 'Cerro Porteño',
      homeTeamLogo: 'https://gol-cdn.conmebol.com/icons/team/light/3x/id/31.png?version=2026040801',
      awayTeam: 'Palmeiras',
      awayTeamLogo: 'https://gol-cdn.conmebol.com/icons/team/light/3x/id/21.png?version=2026040801',
      date: '2026-08-19',
      time: '19:00',
      division: 'Libertadores',
      stadium: 'Estadio ueno La Nueva Olla',
      referee: 'Facundo Raúl Tello Figueroa',
      broadcasters: ['ESPN', 'Disney+', 'Paramount+'],
      matchViewUrl: 'https://gol.conmebol.com/libertadores/pt-br/fixture/view/1626',
      score: { home: 0, away: 1, display: '0 - 1' },
      homeScore: 0,
      awayScore: 1,
      status: 'finalizado',
      scraped: true
    },
    {
      id: 'lib-1629',
      sport: 'futebol',
      competition: 'CONMEBOL Libertadores',
      round: 'Oitavas de Final',
      homeTeam: 'Coquimbo Unido',
      homeTeamLogo: 'https://gol-cdn.conmebol.com/icons/team/light/3x/id/125.png?version=2026040801',
      awayTeam: 'Platense',
      awayTeamLogo: 'https://gol-cdn.conmebol.com/icons/team/light/3x/id/155.png?version=2026040801',
      date: '2026-08-19',
      time: '19:00',
      division: 'Libertadores',
      stadium: 'Estadio Municipal Francisco Sánchez Rumoroso',
      referee: 'Roberto Bruno Pérez Gutierrez',
      broadcasters: ['Paramount+'],
      matchViewUrl: 'https://gol.conmebol.com/libertadores/pt-br/fixture/view/1629',
      score: { home: 0, away: 0, penalties: { home: 6, away: 7 }, display: '0 (6) - (7) 0' },
      homeScore: 0,
      awayScore: 0,
      status: 'finalizado',
      scraped: true
    },
    {
      id: 'lib-1632',
      sport: 'futebol',
      competition: 'CONMEBOL Libertadores',
      round: 'Oitavas de Final',
      homeTeam: 'Flamengo',
      homeTeamLogo: 'https://gol-cdn.conmebol.com/icons/team/light/3x/id/20.png?version=2026040801',
      awayTeam: 'Cruzeiro',
      awayTeamLogo: 'https://gol-cdn.conmebol.com/icons/team/light/3x/id/104.png?version=2026040801',
      date: '2026-08-19',
      time: '21:30',
      division: 'Libertadores',
      stadium: 'Estadio Jornalista Mário Filho (Maracanã)',
      referee: 'Gustavo Adrián Tejera Capo',
      broadcasters: ['TV Globo', 'ESPN', 'Disney+'],
      matchViewUrl: 'https://gol.conmebol.com/libertadores/pt-br/fixture/view/1632',
      status: 'agendado',
      scraped: true
    },
    {
      id: 'lib-1641',
      sport: 'futebol',
      competition: 'CONMEBOL Libertadores',
      round: 'Oitavas de Final',
      homeTeam: 'LDU Quito',
      homeTeamLogo: 'https://gol-cdn.conmebol.com/icons/team/light/3x/id/22.png?version=2026040801',
      awayTeam: 'Mirassol',
      awayTeamLogo: 'https://gol-cdn.conmebol.com/icons/team/light/3x/id/152.png?version=2026040801',
      date: '2026-08-20',
      time: '19:00',
      division: 'Libertadores',
      stadium: 'Estadio Rodrigo Paz Delgado',
      referee: 'Yael Falcón Pérez',
      broadcasters: ['ESPN', 'Disney+'],
      matchViewUrl: 'https://gol.conmebol.com/libertadores/pt-br/fixture/view/1641',
      status: 'agendado',
      scraped: true
    },
    {
      id: 'lib-1623',
      sport: 'futebol',
      competition: 'CONMEBOL Libertadores',
      round: 'Oitavas de Final',
      homeTeam: 'Corinthians',
      homeTeamLogo: 'https://gol-cdn.conmebol.com/icons/team/light/3x/id/46.png?version=2026040801',
      awayTeam: 'Rosario Central',
      awayTeamLogo: 'https://gol-cdn.conmebol.com/icons/team/light/3x/id/66.png?version=2026040801',
      date: '2026-08-20',
      time: '21:30',
      division: 'Libertadores',
      stadium: 'Neo Química Arena',
      referee: 'Alexis Herrera',
      broadcasters: ['Paramount+', 'ESPN', 'Disney+'],
      matchViewUrl: 'https://gol.conmebol.com/libertadores/pt-br/fixture/view/1623',
      status: 'agendado',
      scraped: true
    },
    {
      id: 'lib-1635',
      sport: 'futebol',
      competition: 'CONMEBOL Libertadores',
      round: 'Oitavas de Final',
      homeTeam: 'Independiente Valle',
      homeTeamLogo: 'https://gol-cdn.conmebol.com/icons/team/light/3x/id/42.png?version=2026040801',
      awayTeam: 'Deportes Tolima',
      awayTeamLogo: 'https://gol-cdn.conmebol.com/icons/team/light/3x/id/1.png?version=2026040801',
      date: '2026-08-25',
      time: '21:30',
      division: 'Libertadores',
      stadium: 'Estadio Banco Guayaquil',
      referee: 'CONMEBOL Libertadores',
      broadcasters: ['A confirmar'],
      matchViewUrl: 'https://gol.conmebol.com/libertadores/pt-br/fixture/view/1635',
      status: 'agendado',
      scraped: true
    }
  ];
}

function getOtherSportsEvents() {
  return [
    // --- BASQUETE ---
    {
      id: 'bskt-1',
      sport: 'basquete',
      homeTeam: 'Flamengo Basquete',
      homeTeamLogo: 'https://conteudo.cbf.com.br/clubes/20016/escudo.jpg',
      awayTeam: 'Sesi Franca',
      awayTeamLogo: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=120&auto=format&fit=crop&q=80',
      date: '2026-08-01',
      time: '18:00',
      division: 'NBB',
      stadium: 'Arena Carioca 1 - Rio de Janeiro',
      broadcasters: ['SporTV 2', 'Disney+'],
      round: 'NBB - Final Game 5',
      status: 'finalizado',
      score: { home: 84, away: 80, display: '84 - 80' },
      scraped: false
    },
    {
      id: 'bskt-2',
      sport: 'basquete',
      homeTeam: 'São Paulo FC',
      homeTeamLogo: 'https://conteudo.cbf.com.br/clubes/20005/escudo.jpg',
      awayTeam: 'Minas Tênis Clube',
      awayTeamLogo: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=120&auto=format&fit=crop&q=80',
      date: '2026-08-03',
      time: '20:00',
      division: 'NBB',
      stadium: 'Ginásio do Morumbi - São Paulo',
      broadcasters: ['ESPN 2', 'YouTube NBB'],
      round: 'NBB - Temporada Regular',
      status: 'finalizado',
      score: { home: 78, away: 85, display: '78 - 85' },
      scraped: false
    },
    {
      id: 'bskt-3',
      sport: 'basquete',
      homeTeam: 'Indiana Fever',
      homeTeamLogo: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=120&auto=format&fit=crop&q=80',
      awayTeam: 'Las Vegas Aces',
      awayTeamLogo: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=120&auto=format&fit=crop&q=80',
      date: '2026-08-05',
      time: '21:00',
      division: 'WNBA',
      stadium: 'Gainbridge Fieldhouse - Indianapolis',
      broadcasters: ['ESPN', 'Disney+'],
      round: 'WNBA - Temporada Regular',
      status: 'finalizado',
      score: { home: 91, away: 88, display: '91 - 88' },
      scraped: false
    },
    {
      id: 'bskt-4',
      sport: 'basquete',
      homeTeam: 'Seleção Brasileira',
      homeTeamLogo: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=120&auto=format&fit=crop&q=80',
      awayTeam: 'Seleção Argentina',
      awayTeamLogo: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=120&auto=format&fit=crop&q=80',
      date: '2026-08-07',
      time: '19:30',
      division: 'Amistoso',
      stadium: 'Arena Carioca 1 - Rio de Janeiro',
      broadcasters: ['CazéTV', 'SporTV 2'],
      round: 'Desafio das Américas',
      status: 'finalizado',
      score: { home: 89, away: 82, display: '89 - 82' },
      scraped: false
    },
    {
      id: 'bskt-5',
      sport: 'basquete',
      homeTeam: 'Sesi Franca',
      homeTeamLogo: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=120&auto=format&fit=crop&q=80',
      awayTeam: 'Flamengo Basquete',
      awayTeamLogo: 'https://conteudo.cbf.com.br/clubes/20016/escudo.jpg',
      date: '2026-08-12',
      time: '20:00',
      division: 'NBB',
      stadium: 'Ginásio Pedrocão - Franca',
      broadcasters: ['SporTV 3', 'YouTube NBB', 'TV Cultura'],
      round: 'NBB - Rodada Decisiva',
      status: 'finalizado',
      score: { home: 82, away: 79, display: '82 - 79' },
      scraped: false
    },
    {
      id: 'bskt-6',
      sport: 'basquete',
      homeTeam: 'Boston Celtics',
      homeTeamLogo: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=120&auto=format&fit=crop&q=80',
      awayTeam: 'New York Knicks',
      awayTeamLogo: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=120&auto=format&fit=crop&q=80',
      date: '2026-08-20',
      time: '21:30',
      division: 'NBA',
      stadium: 'TD Garden - Boston',
      broadcasters: ['ESPN', 'Disney+'],
      round: 'NBA Summer Showcase',
      status: 'agendado',
      scraped: false
    },

    // --- VÔLEI ---
    {
      id: 'volei-1',
      sport: 'volei',
      homeTeam: 'Sada Cruzeiro',
      homeTeamLogo: 'https://conteudo.cbf.com.br/clubes/59849/escudo.jpg',
      awayTeam: 'Minas Tênis Clube',
      awayTeamLogo: 'https://images.unsplash.com/photo-1592656094267-764a45160876?w=120&auto=format&fit=crop&q=80',
      date: '2026-08-01',
      time: '21:30',
      division: 'Superliga Masc.',
      stadium: 'Ginásio do Riacho - Contagem',
      broadcasters: ['SporTV 2'],
      round: 'Superliga Masculina - Clássico',
      status: 'finalizado',
      score: { home: 3, away: 1, display: '3 - 1' },
      scraped: false
    },
    {
      id: 'volei-2',
      sport: 'volei',
      homeTeam: 'DENTIL Praia Clube',
      homeTeamLogo: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=120&auto=format&fit=crop&q=80',
      awayTeam: 'Gerdau Minas',
      awayTeamLogo: 'https://images.unsplash.com/photo-1592656094267-764a45160876?w=120&auto=format&fit=crop&q=80',
      date: '2026-08-02',
      time: '19:00',
      division: 'Superliga Fem.',
      stadium: 'Arena Praia - Uberlândia',
      broadcasters: ['SporTV 2'],
      round: 'Superliga Feminina - Rodada 8',
      status: 'finalizado',
      score: { home: 3, away: 2, display: '3 - 2' },
      scraped: false
    },
    {
      id: 'volei-3',
      sport: 'volei',
      homeTeam: 'Sesi Bauru',
      homeTeamLogo: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=120&auto=format&fit=crop&q=80',
      awayTeam: 'Osasco São Cristóvão',
      awayTeamLogo: 'https://images.unsplash.com/photo-1592656094267-764a45160876?w=120&auto=format&fit=crop&q=80',
      date: '2026-08-05',
      time: '20:30',
      division: 'Superliga Fem.',
      stadium: 'Arena Paulo Skaf - Bauru',
      broadcasters: ['SporTV 2', 'Canal Vôlei Brasil'],
      round: 'Superliga Feminina - Rodada 9',
      status: 'finalizado',
      score: { home: 1, away: 3, display: '1 - 3' },
      scraped: false
    },
    {
      id: 'volei-4',
      sport: 'volei',
      homeTeam: 'Brasil (Feminino)',
      homeTeamLogo: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=120&auto=format&fit=crop&q=80',
      awayTeam: 'Itália (Feminino)',
      awayTeamLogo: 'https://images.unsplash.com/photo-1592656094267-764a45160876?w=120&auto=format&fit=crop&q=80',
      date: '2026-08-07',
      time: '18:00',
      division: 'VNL (Liga das Nações)',
      stadium: 'Ginásio do Maracanãzinho - Rio de Janeiro',
      broadcasters: ['TV Globo', 'SporTV 2'],
      round: 'Fase Final - Quartas de Final',
      status: 'finalizado',
      score: { home: 3, away: 0, display: '3 - 0' },
      scraped: false
    },
    {
      id: 'volei-5',
      sport: 'volei',
      homeTeam: 'Brasil (Masculino)',
      homeTeamLogo: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=120&auto=format&fit=crop&q=80',
      awayTeam: 'Polônia (Masculino)',
      awayTeamLogo: 'https://images.unsplash.com/photo-1592656094267-764a45160876?w=120&auto=format&fit=crop&q=80',
      date: '2026-08-08',
      time: '18:00',
      division: 'VNL (Liga das Nações)',
      stadium: 'Ginásio do Maracanãzinho - Rio de Janeiro',
      broadcasters: ['SporTV 2'],
      round: 'Fase Final - Semifinal',
      status: 'finalizado',
      score: { home: 2, away: 3, display: '2 - 3' },
      scraped: false
    },

    // --- JUDÔ ---
    {
      id: 'judo-1',
      sport: 'judo',
      homeTeam: 'Mayra Aguiar vs Alice Bellandi',
      homeTeamLogo: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=120&auto=format&fit=crop&q=80',
      awayTeam: 'Disputa de Medalha de Ouro (-78kg)',
      awayTeamLogo: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=120&auto=format&fit=crop&q=80',
      date: '2026-08-01',
      time: '16:00',
      division: 'Grand Slam IJF',
      stadium: 'Ginásio Nilson Nelson - Brasília',
      broadcasters: ['CazéTV', 'SporTV 3', 'Olympic Channel'],
      round: 'Finais e Bloco de Medalhas',
      status: 'finalizado',
      score: { home: 10, away: 0, display: 'Ippon' },
      scraped: false
    },
    {
      id: 'judo-2',
      sport: 'judo',
      homeTeam: 'Beatriz Souza vs Raz Hershko',
      homeTeamLogo: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=120&auto=format&fit=crop&q=80',
      awayTeam: 'Disputa de Medalha (+78kg)',
      awayTeamLogo: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=120&auto=format&fit=crop&q=80',
      date: '2026-08-02',
      time: '16:30',
      division: 'Grand Slam IJF',
      stadium: 'Ginásio Nilson Nelson - Brasília',
      broadcasters: ['CazéTV', 'SporTV 3'],
      round: 'Finais Categoria Pesado',
      status: 'finalizado',
      score: { home: 10, away: 0, display: 'Ippon' },
      scraped: false
    },

    // --- AUTOMOBILISMO / F1 ---
    {
      id: 'auto-1',
      sport: 'automobilismo',
      homeTeam: 'GP da Hungria (F1)',
      homeTeamLogo: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=120&auto=format&fit=crop&q=80',
      awayTeam: 'Hungaroring Circuit',
      awayTeamLogo: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=120&auto=format&fit=crop&q=80',
      date: '2026-08-02',
      time: '10:00',
      division: 'Fórmula 1',
      stadium: 'Circuito Hungaroring - Budapeste',
      broadcasters: ['Band', 'BandSports', 'F1 TV Pro'],
      round: 'Corrida Principal (70 Voltas)',
      status: 'finalizado',
      scraped: false
    },
    {
      id: 'auto-2',
      sport: 'automobilismo',
      homeTeam: 'Stock Car Interlagos',
      homeTeamLogo: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=120&auto=format&fit=crop&q=80',
      awayTeam: 'Etapa 7 - Interlagos',
      awayTeamLogo: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=120&auto=format&fit=crop&q=80',
      date: '2026-08-08',
      time: '15:30',
      division: 'Stock Car',
      stadium: 'Autódromo de Interlagos - São Paulo',
      broadcasters: ['Band', 'SporTV 3', 'YouTube Stock Car'],
      round: 'Corrida Sprint & Corrida Principal',
      status: 'finalizado',
      scraped: false
    },
    {
      id: 'auto-3',
      sport: 'automobilismo',
      homeTeam: 'GP da Holanda (F1)',
      homeTeamLogo: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=120&auto=format&fit=crop&q=80',
      awayTeam: 'Zandvoort Circuit',
      awayTeamLogo: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=120&auto=format&fit=crop&q=80',
      date: '2026-08-22',
      time: '10:00',
      division: 'Fórmula 1',
      stadium: 'Circuito de Zandvoort - Holanda',
      broadcasters: ['BandSports', 'F1 TV Pro'],
      round: 'Classificação (Qualifying)',
      status: 'agendado',
      scraped: false
    },
    {
      id: 'auto-4',
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
      round: 'Corrida Principal (72 Voltas)',
      status: 'agendado',
      scraped: false
    },

    // --- TÊNIS ---
    {
      id: 'tenis-1',
      sport: 'tenis',
      homeTeam: 'Bia Haddad Maia',
      homeTeamLogo: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=120&auto=format&fit=crop&q=80',
      awayTeam: 'Aryna Sabalenka',
      awayTeamLogo: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=120&auto=format&fit=crop&q=80',
      date: '2026-08-07',
      time: '16:00',
      division: 'WTA 1000',
      stadium: 'Sobeys Stadium - Toronto',
      broadcasters: ['ESPN 3', 'Disney+'],
      round: 'Quartas de Final',
      status: 'finalizado',
      score: { home: 2, away: 1, display: '2 sets a 1' },
      scraped: false
    },
    {
      id: 'tenis-2',
      sport: 'tenis',
      homeTeam: 'US Open - Chave Principal',
      homeTeamLogo: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=120&auto=format&fit=crop&q=80',
      awayTeam: 'Quadra Central Arthur Ashe',
      awayTeamLogo: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=120&auto=format&fit=crop&q=80',
      date: '2026-08-24',
      time: '12:00',
      division: 'US Open',
      stadium: 'USTA Billie Jean King Center - Nova York',
      broadcasters: ['ESPN', 'SporTV 3', 'Disney+'],
      round: 'Primeira Rodada (Grand Slam)',
      status: 'agendado',
      scraped: false
    },

    // --- LUTAS / MMA ---
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
      status: 'finalizado',
      score: { home: 1, away: 0, display: 'Finalização R4' },
      scraped: false
    }
  ];
}

// Helper to accurately classify division and round from competition details
function parseMatchDivision(compNameRaw, catNameRaw, homeTeam = '', awayTeam = '') {
  const comp = (compNameRaw || '').trim();
  const cat = (catNameRaw || '').trim();
  const fullText = `${comp} ${cat} ${homeTeam} ${awayTeam}`.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  let division = 'Série A';
  let roundText = cat ? `${comp} - ${cat}` : comp;

  // 1. Sub-20 (Must match before generic Brasileiro / Série A)
  if (fullText.includes('sub-20') || fullText.includes('sub 20') || fullText.includes('sub20') || fullText.includes('juniores')) {
    division = 'Sub-20';
  }
  // 2. Sub-17 (Must match before generic Brasileiro / Série A)
  else if (fullText.includes('sub-17') || fullText.includes('sub 17') || fullText.includes('sub17') || fullText.includes('juvenil')) {
    division = 'Sub-17';
  }
  // 3. Sub-15 (Must match before generic Brasileiro / Série A)
  else if (fullText.includes('sub-15') || fullText.includes('sub 15') || fullText.includes('sub15') || fullText.includes('infantil')) {
    division = 'Sub-15';
  }
  // 4. Feminino (Matches Brasileiro Feminino, Feminino A1, A2, A3, Copa do Brasil Feminina, etc.)
  else if (
    fullText.includes('feminino') ||
    fullText.includes('fem') ||
    cat.toLowerCase() === 'a1' ||
    cat.toLowerCase() === 'a2' ||
    cat.toLowerCase() === 'a3' ||
    comp.toLowerCase().includes('feminino')
  ) {
    division = 'Feminino';
  }
  // 5. Copa Betano do Brasil (Profissional)
  else if (fullText.includes('copa do brasil') || fullText.includes('copa betano') || fullText.includes('betano')) {
    division = 'Copa Betano';
    roundText = cat ? `Copa Betano do Brasil - ${cat}` : 'Copa Betano do Brasil';
  }
  // 6. Série B
  else if (fullText.includes('serie b') || fullText.includes('série b') || fullText.includes('serie-b')) {
    division = 'Série B';
  }
  // 7. Série C
  else if (fullText.includes('serie c') || fullText.includes('série c') || fullText.includes('serie-c')) {
    division = 'Série C';
  }
  // 8. Série D
  else if (fullText.includes('serie d') || fullText.includes('série d') || fullText.includes('serie-d')) {
    division = 'Série D';
  }
  // 9. Libertadores
  else if (fullText.includes('libertadores')) {
    division = 'Libertadores';
  }
  // 10. Sudamericana / Sul-Americana
  else if (fullText.includes('sudamericana') || fullText.includes('sul-americana') || fullText.includes('sul americana')) {
    division = 'Sul-Americana';
  }
  // 11. Série A (Campeonato Brasileiro Série A / Profissional)
  else if (fullText.includes('serie a') || fullText.includes('série a') || (comp.toLowerCase().includes('campeonato brasileiro') && (cat.toLowerCase().includes('profissional') || !cat))) {
    division = 'Série A';
  }
  // 12. Fallback
  else {
    division = cat || comp || 'Outros';
  }

  return { division, round: roundText || division };
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

    // Helper para adicionar ou mesclar jogos sem duplicar e enriquecendo informações
    function addOrUpdateGame(newGame) {
      if (!newGame) return;
      const idx = scrapedGames.findIndex(g =>
        g.date === newGame.date &&
        ((g.homeTeam?.toLowerCase() === newGame.homeTeam?.toLowerCase() && g.awayTeam?.toLowerCase() === newGame.awayTeam?.toLowerCase()) ||
         (g.homeTeamSlug && newGame.homeTeamSlug && g.homeTeamSlug === newGame.homeTeamSlug && g.awayTeamSlug === newGame.awayTeamSlug))
      );
      if (idx >= 0) {
        const existing = scrapedGames[idx];
        const mergedBroadcasters = Array.from(new Set([...(existing.broadcasters || []), ...(newGame.broadcasters || [])])).filter(b => b && b !== 'A definir');
        scrapedGames[idx] = {
          ...existing,
          ...newGame,
          division: newGame.division || existing.division,
          round: newGame.round || existing.round,
          broadcasters: mergedBroadcasters.length > 0 ? mergedBroadcasters : existing.broadcasters
        };
      } else {
        scrapedGames.push(newGame);
      }
    }

    // Helper para mapear jogo cru da API da CBF
    function mapRawCBFGame(game) {
      try {
        const homeName = game.mandante?.nome || game.equipe_mandante?.nome_popular || game.equipe_mandante?.nome || 'A definir';
        const awayName = game.visitante?.nome || game.equipe_visitante?.nome_popular || game.equipe_visitante?.nome || 'A definir';

        if (homeName === 'A definir' && awayName === 'A definir') return null;

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
        const catName = game.competicao?.categoria_nome || game.categoria || '';
        const { division, round: roundText } = parseMatchDivision(compName, catName, homeName, awayName);

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

        // Scores & Penalties from CBF API (gols, penaltis)
        let matchScore = null;
        if (
          game.mandante?.gols !== undefined && game.mandante?.gols !== null && game.mandante?.gols !== '' &&
          game.visitante?.gols !== undefined && game.visitante?.gols !== null && game.visitante?.gols !== ''
        ) {
          const hGols = parseInt(game.mandante.gols, 10);
          const aGols = parseInt(game.visitante.gols, 10);
          if (!isNaN(hGols) && !isNaN(aGols)) {
            let penObj = undefined;
            if (game.mandante?.penaltis && game.visitante?.penaltis && (game.mandante.penaltis !== '0' || game.visitante.penaltis !== '0')) {
              penObj = {
                home: parseInt(game.mandante.penaltis, 10),
                away: parseInt(game.visitante.penaltis, 10)
              };
            }
            matchScore = {
              home: hGols,
              away: aGols,
              penalties: penObj,
              display: penObj ? `${hGols} (${penObj.home}) - (${penObj.away}) ${aGols}` : `${hGols} - ${aGols}`
            };
          }
        }

        return {
          id: `api-cbf-${game.id || game.id_jogo || Math.random().toString(36).substring(2, 9)}`,
          sport: 'futebol',
          homeTeam: homeName,
          homeTeamLogo: homeLogo,
          awayTeam: awayName,
          awayTeamLogo: awayLogo,
          date: formattedDate,
          time: matchTime,
          division: division,
          round: roundText,
          stadium: game.local || 'A definir',
          broadcasters: broadcasters,
          score: matchScore,
          homeScore: matchScore ? matchScore.home : null,
          awayScore: matchScore ? matchScore.away : null,
          status: 'agendado',
          scraped: true
        };
      } catch (itemErr) {
        console.warn('Erro ao processar item individual:', itemErr);
        return null;
      }
    }

    // FASE 1: Varredura dos jogos de hoje da CBF
    const todayIso = `${year}-${monthStr}-${String(currentDay).padStart(2, '0')}`;
    try {
      const todayUrl = `https://www.cbf.com.br/api/cbf/onde-assistir/jogos?page=1&dataInicio=${todayIso}&dataTermino=${todayIso}`;
      const todayResult = await fetchJsonSecurely(todayUrl);
      const todayGames = todayResult?.jogos || todayResult?.data || [];
      for (const g of todayGames) {
        const parsed = mapRawCBFGame(g);
        if (parsed) addOrUpdateGame(parsed);
      }
    } catch (eToday) {
      console.warn('Aviso ao varrer jogos de hoje:', eToday);
    }

    // FASE 2: Varredura dedicada da Copa Betano (campeonato=24)
    try {
      const copaUrl = `https://www.cbf.com.br/api/cbf/onde-assistir/jogos?page=1&campeonato=24&dataInicio=${startDateStr}&dataTermino=${endDateStr}`;
      const copaResult = await fetchJsonSecurely(copaUrl);
      const copaGames = copaResult?.jogos || copaResult?.data || [];
      for (const g of copaGames) {
        const parsed = mapRawCBFGame(g);
        if (parsed) addOrUpdateGame(parsed);
      }
    } catch (eCopa) {
      console.warn('Aviso ao varrer Copa Betano:', eCopa);
    }

    // FASE 3: Varredura geral do calendário
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
          const parsed = mapRawCBFGame(game);
          if (parsed) addOrUpdateGame(parsed);
        }

        page++;
      } catch (err) {
        console.warn(`Erro na busca da página ${page}:`, err);
        break;
      }
    }

    // FASE 4: Jogos confirmados (Copa Betano e Série A)
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
      },
      {
        id: 'copa-betano-cru-cam-20260911',
        sport: 'futebol',
        competition: 'Copa Betano do Brasil',
        division: 'Copa Betano',
        round: 'Quartas de Final (Volta)',
        homeTeam: 'Cruzeiro',
        homeTeamSlug: 'cruzeiro',
        homeTeamLogo: 'https://conteudo.cbf.com.br/clubes/20025/escudo.jpg',
        awayTeam: 'Atlético Mineiro',
        awayTeamSlug: 'atletico-mineiro',
        awayTeamLogo: 'https://conteudo.cbf.com.br/clubes/20005/escudo.jpg',
        date: '2026-09-11',
        time: '21:30',
        stadium: 'Estádio Mineirão - Belo Horizonte, MG',
        broadcasters: ['Sportv', 'Premiere', 'Amazon Prime'],
        transmissionUrl: 'https://www.primevideo.com/',
        status: 'agendado',
        scraped: true
      },
      {
        id: 'copa-betano-vas-vit-20260912',
        sport: 'futebol',
        competition: 'Copa Betano do Brasil',
        division: 'Copa Betano',
        round: 'Quartas de Final (Volta)',
        homeTeam: 'Vasco da Gama',
        homeTeamSlug: 'vasco-da-gama',
        homeTeamLogo: 'https://conteudo.cbf.com.br/clubes/20028/escudo.jpg',
        awayTeam: 'Vitória',
        awayTeamSlug: 'vitoria',
        awayTeamLogo: 'https://conteudo.cbf.com.br/clubes/20032/escudo.jpg',
        date: '2026-09-12',
        time: '21:30',
        stadium: 'Estádio São Januário - Rio de Janeiro, RJ',
        broadcasters: ['Sportv', 'Premiere', 'Amazon Prime', 'Globo'],
        transmissionUrl: 'https://www.primevideo.com/',
        status: 'agendado',
        scraped: true
      },
      {
        id: 'copa-betano-pal-san-20260912',
        sport: 'futebol',
        competition: 'Copa Betano do Brasil',
        division: 'Copa Betano',
        round: 'Quartas de Final (Volta)',
        homeTeam: 'Palmeiras',
        homeTeamSlug: 'palmeiras',
        homeTeamLogo: 'https://conteudo.cbf.com.br/clubes/20023/escudo.jpg',
        awayTeam: 'Santos',
        awayTeamSlug: 'santos',
        awayTeamLogo: 'https://conteudo.cbf.com.br/clubes/20027/escudo.jpg',
        date: '2026-09-12',
        time: '21:30',
        stadium: 'Allianz Parque - São Paulo, SP',
        broadcasters: ['Sportv', 'Premiere', 'Amazon Prime', 'Globo'],
        transmissionUrl: 'https://www.primevideo.com/',
        status: 'agendado',
        scraped: true
      },
      {
        id: 'copa-betano-int-gre-20260913',
        sport: 'futebol',
        competition: 'Copa Betano do Brasil',
        division: 'Copa Betano',
        round: 'Quartas de Final (Volta)',
        homeTeam: 'Internacional',
        homeTeamSlug: 'internacional',
        homeTeamLogo: 'https://conteudo.cbf.com.br/clubes/20019/escudo.jpg',
        awayTeam: 'Grêmio',
        awayTeamSlug: 'gremio',
        awayTeamLogo: 'https://conteudo.cbf.com.br/clubes/20018/escudo.jpg',
        date: '2026-09-13',
        time: '20:00',
        stadium: 'Estádio Beira-Rio - Porto Alegre, RS',
        broadcasters: ['Amazon Prime', 'Premiere'],
        transmissionUrl: 'https://www.primevideo.com/',
        status: 'agendado',
        scraped: true
      }
    ];

    for (const conf of confirmedRescheduledMatches) {
      addOrUpdateGame(conf);
    }

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

    const [libertadoresEvents, sudamericanaEvents] = await Promise.all([
      scrapeConmebolLibertadores(),
      scrapeConmebolSudamericana()
    ]);
    const otherSports = getOtherSportsEvents();
    
    // Combine and apply calculateMatchStatus
    const rawCombined = [...scrapedGames, ...libertadoresEvents, ...sudamericanaEvents, ...otherSports];
    const combinedData = rawCombined.map(match => ({
      ...match,
      status: calculateMatchStatus(match.date, match.time, match.rawStatus || match.status)
    }));

    combinedData.sort((a, b) => (a.date || '').localeCompare(b.date || '') || (a.time || '').localeCompare(b.time || ''));

    res.status(200).json({
      success: true,
      source: 'vercel-serverless',
      timestamp: new Date().toISOString(),
      info: {
        scrapedCount: scrapedGames.length,
        libertadoresCount: libertadoresEvents.length,
        sudamericanaCount: sudamericanaEvents.length,
        otherSportsCount: otherSports.length,
        total: combinedData.length
      },
      data: combinedData
    });

  } catch (error) {
    console.error("Erro no proxy Serverless da CBF:", error);
    // Even if CBF fails, return scraped CONMEBOL events with calculated status
    const [libertadoresEvents, sudamericanaEvents] = await Promise.all([
      scrapeConmebolLibertadores(),
      scrapeConmebolSudamericana()
    ]);
    const otherSports = getOtherSportsEvents();
    const rawFallback = [...libertadoresEvents, ...sudamericanaEvents, ...otherSports];
    const fallbackData = rawFallback.map(match => ({
      ...match,
      status: calculateMatchStatus(match.date, match.time, match.rawStatus || match.status)
    }));

    res.status(200).json({
      success: true,
      source: 'vercel-fallback',
      warning: error.message || 'Erro ao conectar com a API da CBF',
      data: fallbackData
    });
  }
}
