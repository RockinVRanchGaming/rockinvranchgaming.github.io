/* Rockin' V Record Book - shared data layer (rv-records-v1). ES5 on purpose; old phones play too. */
var RVBook = (function () {
  var K = 'rv-records-v1', KO = 'rv-owner-v1', KR = 'rv-roster-v1';
  function load(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function store(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
  function norm(n) { return String(n || '').trim().replace(/\s+/g, ' ').slice(0, 20); }
  function key(n) { return norm(n).toLowerCase(); }

  function db() {
    var d = load(K);
    if (!d || d.v !== 1 || !d.players || !Array.isArray(d.games)) d = { v: 1, players: {}, games: [] };
    return d;
  }
  function save(d) { return store(K, d); }

  /* owner: the person whose phone this is */
  function owner() { var o = load(KO); return o && o.name ? o : null; }
  function setOwner(name) {
    name = norm(name); if (!name) return null;
    var d = db(), o = owner(), pid = o ? o.pid : null;
    if (pid && d.players[pid]) { rename(pid, name, d); } else { pid = ensurePlayer(d, name); save(d); }
    var no = { pid: pid, name: name }; store(KO, no); return no;
  }

  /* players */
  function findPid(d, name) {
    var k = key(name), id; if (!k) return null;
    for (id in d.players) { var p = d.players[id]; if (key(p.name) === k) return id; if (p.aliases && p.aliases.some(function (a) { return key(a) === k; })) return id; }
    return null;
  }
  function ensurePlayer(d, name) {
    var pid = findPid(d, name); if (pid) return pid;
    pid = 'p' + uid(); d.players[pid] = { name: norm(name), aliases: [], created: new Date().toISOString() }; return pid;
  }
  function rename(pid, name, d0) {
    var d = d0 || db(), p = d.players[pid]; name = norm(name); if (!p || !name) return false;
    if (key(p.name) !== key(name) && p.aliases.indexOf(p.name) < 0) p.aliases.push(p.name);
    p.name = name; if (!d0) save(d);
    var o = owner(); if (o && o.pid === pid) store(KO, { pid: pid, name: name });
    return true;
  }
  function merge(keep, drop) {
    var d = db(), a = d.players[keep], b = d.players[drop]; if (!a || !b || keep === drop) return false;
    a.aliases = (a.aliases || []).concat([b.name], b.aliases || []).filter(function (x, i, arr) { return key(x) !== key(a.name) && arr.indexOf(x) === i; });
    d.games.forEach(function (g) { g.players.forEach(function (pl) { if (pl.pid === drop) pl.pid = keep; }); });
    delete d.players[drop];
    var o = owner(); if (o && o.pid === drop) store(KO, { pid: keep, name: a.name });
    return save(d);
  }
  function removePlayer(pid) {
    var d = db(); if (!d.players[pid]) return false;
    var used = d.games.some(function (g) { return g.players.some(function (pl) { return pl.pid === pid; }); });
    if (used) return false; delete d.players[pid]; return save(d);
  }

  /* games */
  function decideWinners(players, lowWins) {
    var best = null; players.forEach(function (p) { if (typeof p.score !== 'number') return; if (best === null || (lowWins ? p.score < best : p.score > best)) best = p.score; });
    players.forEach(function (p) { p.won = (best !== null && p.score === best); });
  }
  function addGame(rec) {
    /* rec: { id?, game:'qwixx', title:'Qwixx', lowWins?:bool, at?:ISO, players:[{name, score}], meta?:{} } */
    var d = db(), id = rec.id || ('g' + uid());
    var i; for (i = 0; i < d.games.length; i++) if (d.games[i].id === id) return d.games[i];
    var players = (rec.players || []).filter(function (p) { return p && norm(p.name); }).map(function (p) {
      return { pid: ensurePlayer(d, p.name), name: norm(p.name), score: (typeof p.score === 'number' && isFinite(p.score)) ? p.score : null };
    });
    if (!players.length) return null;
    decideWinners(players, !!rec.lowWins);
    var g = { id: id, game: String(rec.game || 'game'), title: String(rec.title || rec.game || 'Game'), lowWins: !!rec.lowWins, at: rec.at || new Date().toISOString(), players: players, meta: rec.meta || {} };
    d.games.push(g); if (d.games.length > 5000) d.games = d.games.slice(-5000);
    save(d); return g;
  }
  function updateGame(id, patch) {
    var d = db(), g = null, i; for (i = 0; i < d.games.length; i++) if (d.games[i].id === id) g = d.games[i];
    if (!g) return null;
    if (patch.players) {
      g.players = patch.players.filter(function (p) { return p && norm(p.name); }).map(function (p) {
        return { pid: ensurePlayer(d, p.name), name: norm(p.name), score: (typeof p.score === 'number' && isFinite(p.score)) ? p.score : null };
      });
    }
    if (patch.at) g.at = patch.at; if (patch.meta) g.meta = patch.meta;
    decideWinners(g.players, g.lowWins); save(d); return g;
  }
  function removeGame(id) { var d = db(), n = d.games.length; d.games = d.games.filter(function (g) { return g.id !== id; }); if (d.games.length === n) return false; return save(d); }
  function games() { return db().games.slice().sort(function (a, b) { return a.at < b.at ? 1 : -1; }); }
  function players() { var d = db(), out = [], id; for (id in d.players) out.push({ pid: id, name: d.players[id].name, aliases: d.players[id].aliases || [] }); return out; }
  function nameOf(pid) { var d = db(); return d.players[pid] ? d.players[pid].name : '?'; }

  /* stats */
  function stats(pid, gameFilter) {
    var s = { games: 0, wins: 0, best: null, worst: null, total: 0, scored: 0, streak: 0, bestStreak: 0, last: null, byGame: {} };
    var gs = db().games.slice().sort(function (a, b) { return a.at < b.at ? -1 : 1; });
    gs.forEach(function (g) {
      if (gameFilter && g.game !== gameFilter) return;
      var me = null; g.players.forEach(function (p) { if (p.pid === pid) me = p; }); if (!me) return;
      s.games++; s.last = g.at;
      var bg = s.byGame[g.game] || (s.byGame[g.game] = { title: g.title, games: 0, wins: 0, best: null, lowWins: g.lowWins });
      bg.games++;
      if (me.won && g.players.length > 1) { s.wins++; bg.wins++; s.streak++; if (s.streak > s.bestStreak) s.bestStreak = s.streak; } else if (g.players.length > 1) s.streak = 0;
      if (typeof me.score === 'number') {
        s.total += me.score; s.scored++;
        if (s.best === null || (g.lowWins ? me.score < s.best : me.score > s.best)) s.best = me.score;
        if (s.worst === null || (g.lowWins ? me.score > s.worst : me.score < s.worst)) s.worst = me.score;
        if (bg.best === null || (g.lowWins ? me.score < bg.best : me.score > bg.best)) bg.best = me.score;
      }
    });
    s.avg = s.scored ? Math.round(s.total / s.scored * 10) / 10 : null;
    s.winPct = s.games ? Math.round(s.wins / s.games * 100) : 0;
    return s;
  }
  function headToHead(a, b) {
    var r = { games: 0, aWins: 0, bWins: 0, ties: 0 };
    db().games.forEach(function (g) {
      var pa = null, pb = null; g.players.forEach(function (p) { if (p.pid === a) pa = p; if (p.pid === b) pb = p; });
      if (!pa || !pb || typeof pa.score !== 'number' || typeof pb.score !== 'number') return;
      r.games++; if (pa.score === pb.score) r.ties++; else if ((pa.score > pb.score) !== g.lowWins) r.aWins++; else r.bWins++;
    });
    return r;
  }

  /* suggestions: who you usually play with */
  function suggest(limit) {
    var score = {}, names = {}, now = Date.now(), d = db(), o = owner();
    d.games.forEach(function (g) {
      var age = (now - Date.parse(g.at)) / 864e5, w = 1 + 30 / (1 + age);
      g.players.forEach(function (p) { if (o && p.pid === o.pid) return; score[p.pid] = (score[p.pid] || 0) + w; names[p.pid] = nameOf(p.pid); });
    });
    var roster = load(KR); if (Array.isArray(roster)) roster.forEach(function (n) { var pid = findPid(d, n); if (pid) { if (o && pid === o.pid) return; score[pid] = (score[pid] || 0) + 0.5; names[pid] = nameOf(pid); } else if (norm(n) && (!o || key(n) !== key(o.name))) { score['raw:' + key(n)] = 0.4; names['raw:' + key(n)] = norm(n); } });
    var out = Object.keys(score).sort(function (x, y) { return score[y] - score[x]; }).map(function (k) { return names[k]; });
    return out.slice(0, limit || 8);
  }
  function lastTable(game) {
    var gs = games(), i; for (i = 0; i < gs.length; i++) if (!game || gs[i].game === game) return gs[i].players.map(function (p) { return nameOf(p.pid); });
    return null;
  }

  /* export */
  function csv() {
    var rows = [['Date', 'Game', 'Player', 'Score', 'Won', 'Players in game', 'Game id']];
    games().forEach(function (g) { g.players.forEach(function (p) { rows.push([g.at.slice(0, 10), g.title, nameOf(p.pid), p.score === null ? '' : p.score, p.won && g.players.length > 1 ? 'yes' : '', g.players.length, g.id]); }); });
    return rows.map(function (r) { return r.map(function (c) { c = String(c); return /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(','); }).join('\r\n');
  }
  function exportJSON() { return JSON.stringify({ book: db(), owner: owner(), exported: new Date().toISOString() }); }
  function importJSON(txt) {
    var o; try { o = JSON.parse(txt); } catch (e) { return { ok: false, err: 'Not a record book file.' }; }
    var src = o && o.book && Array.isArray(o.book.games) ? o.book : null; if (!src) return { ok: false, err: 'Not a record book file.' };
    var added = 0; src.games.forEach(function (g) {
      var before = db().games.length;
      addGame({ id: g.id, game: g.game, title: g.title, lowWins: g.lowWins, at: g.at, meta: g.meta, players: g.players.map(function (p) { return { name: (src.players[p.pid] || {}).name || p.name, score: p.score }; }) });
      if (db().games.length > before) added++;
    });
    return { ok: true, added: added, skipped: src.games.length - added };
  }

  function count() { return db().games.length; }
  function seenToast() { return !!load('rv-book-toast-v1'); } function markToast() { store('rv-book-toast-v1', 1); }

  return { K: K, owner: owner, setOwner: setOwner, addGame: addGame, updateGame: updateGame, removeGame: removeGame, games: games, players: players, nameOf: nameOf,
    rename: rename, merge: merge, removePlayer: removePlayer, stats: stats, headToHead: headToHead, suggest: suggest, lastTable: lastTable, csv: csv, exportJSON: exportJSON, importJSON: importJSON, count: count, seenToast: seenToast, markToast: markToast, norm: norm };
})();
