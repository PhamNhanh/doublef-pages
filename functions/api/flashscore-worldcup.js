export async function onRequest(context) {
  const { request, env } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json; charset=utf-8"
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const sourceUrl = env.FLASHSCORE_JSON_URL;

    if (!sourceUrl) {
      return new Response(JSON.stringify({
        ok: false,
        source: "pages-function",
        message: "Chưa cấu hình biến FLASHSCORE_JSON_URL trong Cloudflare Pages.",
        hint: "Vào Cloudflare Pages > doublef-pages > Settings > Environment variables để thêm FLASHSCORE_JSON_URL.",
        matches: [],
        players: []
      }, null, 2), {
        status: 200,
        headers: corsHeaders
      });
    }

    const upstream = await fetch(sourceUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 WorldCup2026Dashboard/1.0",
        "Accept": "application/json,text/plain,*/*"
      }
    });

    const text = await upstream.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = {
        raw: text
      };
    }

    return new Response(JSON.stringify(normalizeFlashscoreData(data), null, 2), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    return new Response(JSON.stringify({
      ok: false,
      source: "pages-function",
      error: String(error),
      matches: [],
      players: []
    }, null, 2), {
      status: 200,
      headers: corsHeaders
    });
  }
}

function normalizeFlashscoreData(data) {
  const rawMatches =
    data.matches ||
    data.events ||
    data.fixtures ||
    data.data ||
    [];

  const matches = Array.isArray(rawMatches)
    ? rawMatches.map((m, index) => normalizeMatch(m, index)).filter(Boolean)
    : [];

  const rawPlayers =
    data.players ||
    data.topScorers ||
    data.scorers ||
    [];

  const players = Array.isArray(rawPlayers)
    ? rawPlayers.map(normalizePlayer).filter(Boolean)
    : [];

  return {
    ok: true,
    source: "pages-function",
    updatedAt: new Date().toISOString(),
    matches,
    players
  };
}

function normalizeMatch(m, index) {
  const homeName =
    m.homeName ||
    m.home?.name ||
    m.homeTeam?.name ||
    m.home_team ||
    m.localteam?.name ||
    "";

  const awayName =
    m.awayName ||
    m.away?.name ||
    m.awayTeam?.name ||
    m.away_team ||
    m.visitorteam?.name ||
    "";

  if (!homeName && !awayName) return null;

  const homeScore =
    m.homeScore ??
    m.home?.score ??
    m.score?.home ??
    m.scores?.home ??
    "";

  const awayScore =
    m.awayScore ??
    m.away?.score ??
    m.score?.away ??
    m.scores?.away ??
    "";

  const statusText =
    m.statusText ||
    m.status ||
    m.stage ||
    m.time ||
    "";

  const completed =
    String(statusText).toLowerCase().includes("ft") ||
    String(statusText).toLowerCase().includes("finished") ||
    String(statusText).toLowerCase().includes("after");

  const live =
    String(statusText).toLowerCase().includes("live") ||
    String(statusText).includes("'") ||
    String(statusText).toLowerCase().includes("half");

  return {
    id: String(m.id || m.eventId || `fs-${index}`),
    date: m.date || m.startTime || m.timeStart || new Date().toISOString(),
    group: m.group || m.round || m.league || "World Cup 2026",
    status: completed ? "post" : live ? "in" : "pre",
    statusText,
    completed,
    displayClock: live ? statusText : "",
    home: {
      name: homeName,
      code: m.homeCode || m.home?.code || "",
      logo: m.homeLogo || m.home?.logo || "",
      score: homeScore
    },
    away: {
      name: awayName,
      code: m.awayCode || m.away?.code || "",
      logo: m.awayLogo || m.away?.logo || "",
      score: awayScore
    },
    events: m.events || m.incidents || []
  };
}

function normalizePlayer(p) {
  const name = p.name || p.playerName || p.player?.name || "";
  if (!name) return null;

  return {
    name,
    team: p.team || p.teamName || p.team?.name || "",
    code: p.code || p.teamCode || "",
    goals: Number(p.goals || p.goal || 0),
    assists: Number(p.assists || p.assist || 0)
  };
}
