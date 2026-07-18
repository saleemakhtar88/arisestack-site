// ============================================================
//  AriseStack visitor counter — zero-dependency Node service
//  Runs on the VPS under PM2, behind Caddy at /api/visits
//  Counts unique visitors per day (IP+UA hash), stores JSON.
//  Start:  pm2 start counter.js --name arise-counter && pm2 save
// ============================================================
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = 8943;
const DATA = path.join(__dirname, 'visits.json');

let db = { total: 0, days: {} };
try { db = JSON.parse(fs.readFileSync(DATA, 'utf8')); } catch (e) {}

let dirty = false;
setInterval(function () {
  if (!dirty) return;
  dirty = false;
  fs.writeFile(DATA, JSON.stringify(db), function () {});
}, 5000);

function today() { return new Date().toISOString().slice(0, 10); }

function prune() {
  const keys = Object.keys(db.days).sort();
  while (keys.length > 30) delete db.days[keys.shift()];
}

const BOT = /bot|crawl|spider|slurp|curl|wget|monitor|pingdom|lighthouse|headless/i;

const server = http.createServer(function (req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json');

  if (req.url.split('?')[0] !== '/api/visits') { res.writeHead(404); return res.end('{}'); }

  if (req.method === 'POST') {
    const ua = req.headers['user-agent'] || '';
    if (!BOT.test(ua)) {
      const ip = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
      const hash = crypto.createHash('sha1').update(ip + '|' + ua).digest('hex').slice(0, 12);
      const day = today();
      if (!db.days[day]) { db.days[day] = { count: 0, seen: {} }; prune(); }
      if (!db.days[day].seen[hash]) {
        db.days[day].seen[hash] = 1;
        db.days[day].count++;
        db.total++;
        dirty = true;
      }
    }
  }

  const day = db.days[today()];
  res.writeHead(200);
  res.end(JSON.stringify({ total: db.total, today: day ? day.count : 0 }));
});

server.listen(PORT, '127.0.0.1', function () {
  console.log('arise-counter listening on 127.0.0.1:' + PORT);
});
