// Renders the real Curva app (Expo web export) at iPhone 6.9" size and captures App Store screenshots.
// Public screens use live Curva data. Signed-in screens use a sample fan account whose follows and
// shows are real upcoming events from Curva's live data. Every write request is blocked, so a run
// never records an install, a follow, analytics or anything else in production.
import { createServer } from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { chromium } from "playwright";

const API = "https://joincurva.com";
const DIST = process.argv[2] ?? "dist";
const OUT = process.argv[3] ?? "screenshots";
const PORT = 8137;
const SESSION_KEY = "curva.native.session.v1";

const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".ttf": "font/ttf", ".svg": "image/svg+xml", ".ico": "image/x-icon" };
const server = createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
  for (const file of [join(DIST, path), join(DIST, `${path}.html`), join(DIST, "index.html")]) {
    try { const body = await readFile(file); res.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream" }); res.end(body); return; } catch {}
  }
  res.writeHead(404); res.end();
}).listen(PORT);

const get = async (path) => { const r = await fetch(`${API}${path}`); if (!r.ok) throw new Error(`${path} ${r.status}`); return r.json(); };
const presales = (await get("/api/presales")).sales;
const suggestions = (await get("/api/follows/suggestions")).suggestions.map((s) => s.name);
const noah = await get("/api/performers/noah-kahan");

// Sample fan: follows Noah Kahan plus artists and teams with real sales coming up.
const followNames = [...new Set(["Noah Kahan", ...suggestions.slice(0, 5)])].slice(0, 6);
const follows = followNames.map((name, i) => ({ name, name_key: name.toLowerCase(), kind: "artist", created_at: new Date(Date.now() - (i + 1) * 86_400_000).toISOString() }));
const mySales = presales.filter((s) => followNames.includes(s.performer ?? s.title)).slice(0, 4).map((s) => ({ key: s.key, title: s.title, label: s.label, kind: s.kind, start: s.start, time: s.time, timeZone: s.timeZone, dates: s.dates.length, eventId: s.dates[0]?.id }));

const noahShow = noah.dates.find((d) => /east rutherford|new york|foxborough|philadelphia/i.test(d.city)) ?? noah.dates[0];
const soonSale = presales.find((s) => s.dates[0]) ;
const fanEvent = (d, state, i) => ({ id: `sample-${i}`, provider: "ticketmaster", provider_event_id: d.id, event_name: d.name, event_date: d.date, venue_name: d.venue, city: d.city, official_url: d.officialUrl ?? null, lifecycle_state: state, change_kind: null, previous_event_date: null, companions: i === 0 ? "Sam, Jordan" : null, meetup_note: i === 0 ? "Lot E, 5:30" : null, memory_note: null });
const myEvents = [noahShow && fanEvent(noahShow, "PURCHASE_CONFIRMED", 0), soonSale && fanEvent(soonSale.dates[0], "MARKED_GOING", 1)].filter(Boolean);
const user = { id: "sample-fan", email: "fan@example.com", displayName: "Alex" };

const authed = {
  "/api/follows": { follows },
  "/api/fan-events": { events: myEvents },
  "/api/presales/mine": { watching: follows.length, sales: mySales },
  "/api/presale-signups": { signups: [] },
  "/api/ticket-alerts": { alerts: [] },
  "/api/auth/session": { user },
  "/api/mobile/account": { user },
};

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 440, height: 956 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
  userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1",
  geolocation: { latitude: 40.7505, longitude: -73.9934 }, permissions: ["geolocation"], colorScheme: "dark", locale: "en-US", timezoneId: "America/New_York",
});
await context.route("**/*", async (route) => {
  const req = route.request();
  const url = new URL(req.url());
  if (url.host === `localhost:${PORT}`) return route.continue();
  if (url.origin !== API) return route.continue();
  if (req.method() !== "GET") return route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  if (authed[url.pathname]) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(authed[url.pathname]) });
  const r = await route.fetch();
  return route.fulfill({ response: r, headers: { ...r.headers(), "access-control-allow-origin": "*" } });
});

await mkdir(OUT, { recursive: true });
const errors = [];
const shoot = async (name, path, { signedIn = true, wait = 3500 } = {}) => {
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(`${name}: ${e.message}`));
  await page.addInitScript(([key, value]) => { try { if (value) localStorage.setItem(key, value); else localStorage.removeItem(key); } catch {} }, [SESSION_KEY, signedIn ? JSON.stringify({ token: "sample", user }) : ""]);
  await page.goto(`http://localhost:${PORT}${path}`, { waitUntil: "networkidle" }).catch(() => undefined);
  await page.waitForTimeout(wait);
  await page.screenshot({ path: join(OUT, `${name}.png`) });
  await page.close();
  console.log("captured", name, path);
};

const sale = mySales[0] ?? presales.find((s) => suggestions.slice(0, 20).includes(s.performer ?? s.title)) ?? presales[0];
await shoot("1-home", "/");
await shoot("2-sale", `/sale/${encodeURIComponent(sale.key)}?title=${encodeURIComponent(sale.title)}`);
await shoot("3-artist", "/presales/noah-kahan");
if (myEvents[0]) await shoot("4-show", `/show/${myEvents[0].id}?show=${encodeURIComponent(JSON.stringify(myEvents[0]))}`, { wait: 5000 });
await shoot("5-discover", "/discover");
await shoot("6-following", "/account");
await shoot("7-presales", "/presales");

await writeFile(join(OUT, "data.json"), JSON.stringify({ followNames, mySales, myEvents, errors }, null, 2));
console.log("page errors:", errors.length ? errors.join("\n") : "none");
await browser.close();
server.close();
