import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

export interface ScrapedLibertadoresMatch {
  id: string;
  sport: 'futebol';
  competition: 'CONMEBOL Libertadores';
  division: 'Libertadores';
  round: string;
  homeTeam: string;
  homeTeamLogo?: string;
  awayTeam: string;
  awayTeamLogo?: string;
  date: string;
  time: string;
  stadium: string;
  broadcasters: string[];
  transmissionUrl: string;
  status: 'agendado' | 'ao_vivo' | 'finalizado';
  scraped: boolean;
}

/**
 * Scraper for CONMEBOL Libertadores using Playwright
 * Target: https://gol.conmebol.com/libertadores/pt-br & conmebol.com
 */
export async function scrapeLibertadoresMatches(): Promise<ScrapedLibertadoresMatch[]> {
  console.log('[Playwright Scraper] Iniciando extração da CONMEBOL Libertadores...');
  const matches: ScrapedLibertadoresMatch[] = [];

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 },
      locale: 'pt-BR'
    });

    const page = await context.newPage();

    // 1. Acessar portal oficial da CONMEBOL Libertadores
    const targetUrl = 'https://gol.conmebol.com/libertadores/pt-br';
    console.log(`[Playwright Scraper] Navegando para: ${targetUrl}`);
    
    await page.goto(targetUrl, { 
      waitUntil: 'domcontentloaded', 
      timeout: 25000 
    }).catch(e => console.log('[Playwright] Timeout parcial na página, continuando com DOM carregado...', e.message));

    // Aguardar seletores comuns de partidas ou hydration do Next.js
    await page.waitForTimeout(3000);

    // Tentar extrair dados hidratados via __NEXT_DATA__
    const nextData = await page.evaluate(() => {
      const el = document.getElementById('__NEXT_DATA__');
      if (el && el.textContent) {
        try {
          return JSON.parse(el.textContent);
        } catch {
          return null;
        }
      }
      return null;
    });

    if (nextData) {
      console.log('[Playwright Scraper] __NEXT_DATA__ detectado no portal CONMEBOL.');
      const rawMatches = nextData?.props?.pageProps?.matches || 
                         nextData?.props?.pageProps?.initialState?.matches || 
                         nextData?.props?.pageProps?.calendar?.matches || [];

      if (Array.isArray(rawMatches) && rawMatches.length > 0) {
        for (const m of rawMatches) {
          const home = m.homeTeam?.name || m.localTeam?.name || 'Clube Mandante';
          const away = m.awayTeam?.name || m.visitorTeam?.name || 'Clube Visitante';
          const dateStr = m.date ? m.date.split('T')[0] : '2026-08-20';
          const timeStr = m.time || (m.date && m.date.includes('T') ? m.date.split('T')[1].substring(0, 5) : '21:30');

          matches.push({
            id: `libertadores-pw-${m.id || Math.random().toString(36).substring(2, 9)}`,
            sport: 'futebol',
            competition: 'CONMEBOL Libertadores',
            division: 'Libertadores',
            round: m.round || m.phase || 'Oitavas de Final',
            homeTeam: home,
            homeTeamLogo: m.homeTeam?.logo || m.localTeam?.shield,
            awayTeam: away,
            awayTeamLogo: m.awayTeam?.logo || m.visitorTeam?.shield,
            date: dateStr,
            time: timeStr,
            stadium: m.stadium?.name || m.venue || 'Estádio Oficial CONMEBOL',
            broadcasters: m.broadcasters && m.broadcasters.length > 0 ? m.broadcasters : ['ESPN', 'Disney+', 'Paramount+', 'Globo'],
            transmissionUrl: targetUrl,
            status: 'agendado',
            scraped: true
          });
        }
      }
    }

    // Se a extração por JSON embutido for insuficiente, raspar elementos visuais do DOM
    if (matches.length === 0) {
      console.log('[Playwright Scraper] Extraindo partidas a partir dos elementos HTML do DOM...');
      const domMatches = await page.evaluate(() => {
        const results: any[] = [];
        // Selecionar cards de partidas da CONMEBOL
        const matchCards = document.querySelectorAll('[class*="match"], [class*="partido"], [class*="game-card"], [data-match-id]');
        
        matchCards.forEach((card, idx) => {
          const text = card.textContent || '';
          const teamElements = card.querySelectorAll('[class*="team"], [class*="club"], [class*="equipo"], h3, h4');
          const teams: string[] = [];
          
          teamElements.forEach(el => {
            const name = el.textContent?.trim();
            if (name && name.length > 2 && !teams.includes(name) && !name.includes(':')) {
              teams.push(name);
            }
          });

          if (teams.length >= 2) {
            results.push({
              id: `dom-${idx}`,
              homeTeam: teams[0],
              awayTeam: teams[1],
              rawText: text
            });
          }
        });

        return results;
      });

      console.log(`[Playwright Scraper] Encontrados ${domMatches.length} jogos no DOM.`);
    }

    await browser.close();
  } catch (error) {
    console.error('[Playwright Scraper] Erro durante execução do browser:', error);
    if (browser) {
      await browser.close().catch(() => {});
    }
  }

  return matches;
}

// Se executado diretamente via linha de comando (tsx scripts/scrapeLibertadoresPlaywright.ts)
if (process.argv[1]?.includes('scrapeLibertadoresPlaywright')) {
  scrapeLibertadoresMatches().then(res => {
    console.log(`Finalizado scraper Playwright: ${res.length} partidas extraídas.`);
    if (res.length > 0) {
      const outPath = path.join(process.cwd(), 'libertadores_scraped.json');
      fs.writeFileSync(outPath, JSON.stringify(res, null, 2), 'utf-8');
      console.log(`Salvo em ${outPath}`);
    }
  });
}
