/* Rockin' V ribbing dial: Gentle / Family / Savage. Shared by every game on the phone (rv-heat-v1). */
var RVHeat = (function () {
  var K = 'rv-heat-v1', LEVELS = ['gentle', 'family', 'savage'];
  function get() { try { var v = localStorage.getItem(K); return LEVELS.indexOf(v) >= 0 ? v : 'savage'; } catch (e) { return 'savage'; } }
  function set(v) { if (LEVELS.indexOf(v) < 0) return; try { localStorage.setItem(K, v); } catch (e) {} }
  /* lines that name somebody at the table are Savage; everything else is Family (jabs) or Gentle (good news) */
  var NAMES = /\b(Stephen|Steven|Steve|Christine|Chris|Mom|Mother|Jeff|Shannon|Chad|Dad|Grandma|Grandpa)\b/i;
  var POSITIVE = { brag: 1, table: 1, big: 1, yahtzee: 1, bonus: 1, ybonus: 1, out: 1, deal: 1, pick: 1 };
  function heatOf(x, kind) {
    if (x.h) return x.h;
    if (NAMES.test(x.t || '')) return 's';
    return POSITIVE[kind] ? 'g' : 'f';
  }
  function allowed(level) { return level === 'gentle' ? { g: 1 } : level === 'family' ? { g: 1, f: 1 } : { g: 1, f: 1, s: 1 }; }
  function fill(t, who, winner) {
    return String(t).replace(/\{player\}/g, who || 'Somebody').replace(/\{winner\}/g, winner || who || 'Somebody');
  }
  /* original Rockin' V lines, nobody's property but ours */
  var EXTRA = {
    brag: [
      { t: '{player}. Write that one down. Oh wait, we did.', h: 'g' },
      { t: 'Somebody check {player} for loaded dice.', h: 'g' },
      { t: '{player} is making this look easy, which is rude.', h: 'g' },
      { t: 'That was a professional move, {player}. Call the papers.', h: 'g' },
      { t: '{player} came to play. The rest of you came to watch.', h: 'g' },
      { t: 'Smooth as a river rock, {player}.', h: 'g' },
      { t: '{player} just put the whole table on notice.', h: 'g' },
      { t: 'Frame it. {player} earned that one.', h: 'g' },
      { t: '{player} is on fire. Someone fetch a hose.', h: 'g' },
      { t: 'That is how it is done, {player}. Class dismissed.', h: 'g' },
      { t: '{player} would like everyone to notice. Everyone has noticed.', h: 'g' },
      { t: 'Bow down. {player} is having a night.', h: 'g' },
      { t: 'Hot hand alert. {player} is cooking.', h: 'g' },
      { t: '{player}, that was a thing of beauty.', h: 'g' },
      { t: 'Take a victory lap, {player}. A short one.', h: 'g' },
      { t: '{player} just did the math and the math said yes.', h: 'g' },
      { t: 'Big night for {player}. Small night for everyone else.', h: 'g' },
      { t: '{player} is playing chess. The rest of us brought checkers.', h: 'g' },
      { t: 'Somebody is going to brag about this one for a week. Hi, {player}.', h: 'g' },
      { t: 'Ranch champion material right there, {player}.', h: 'g' }
    ],
    table: [
      { t: 'Close game. Nobody breathe.', h: 'g' },
      { t: 'The table has gone quiet. That is never good.', h: 'g' },
      { t: 'Plot twist incoming. Probably.', h: 'g' },
      { t: 'Everybody is still in this. Allegedly.', h: 'g' },
      { t: 'The dice have opinions tonight.', h: 'g' },
      { t: 'Somebody refill the snacks. This could take a while.', h: 'g' },
      { t: 'Nothing personal. All of it is personal.', h: 'g' },
      { t: 'That round will be discussed at the next holiday.', h: 'g' },
      { t: 'Scorekeeper, stay sharp. People are watching.', h: 'g' },
      { t: 'Momentum has entered the room.', h: 'g' },
      { t: 'Tight at the top. Loose at the bottom.', h: 'g' },
      { t: 'And the crowd murmurs politely.', h: 'g' },
      { t: 'This is anyone’s game. Mostly.', h: 'g' },
      { t: 'Steady hands, everybody.', h: 'g' },
      { t: 'Well. That happened.', h: 'g' }
    ],
    normal: [
      { t: '{player}, that was a cry for help.', h: 'f' },
      { t: '{player} rolled that like it owed them money.', h: 'f' },
      { t: 'Bold strategy, {player}. Let’s see if it pays off. It won’t.', h: 'f' },
      { t: '{player} is building character tonight.', h: 'f' },
      { t: 'The dice saw {player} coming.', h: 'f' },
      { t: '{player}, the scoreboard would like a word.', h: 'f' },
      { t: 'Somebody get {player} a participation ribbon.', h: 'f' },
      { t: '{player} is playing the long game. Very long.', h: 'f' },
      { t: 'That was a choice, {player}.', h: 'f' },
      { t: '{player} is keeping everyone else humble by comparison. Backwards.', h: 'f' },
      { t: 'Deep breaths, {player}. It is only a game you are losing.', h: 'f' },
      { t: '{player}, your luck called. It is running late.', h: 'f' }
    ],
    fail: [
      { t: '{player}, the dice have filed a complaint.', h: 'f' },
      { t: 'Swing and a miss, {player}.', h: 'f' },
      { t: '{player} just donated that turn to charity.', h: 'f' },
      { t: 'Nothing to see here, {player}. Literally nothing.', h: 'f' },
      { t: 'That roll had potential, {player}. Had.', h: 'f' },
      { t: '{player}, shake them harder next time. Or softer. Something.', h: 'f' }
    ],
    end: [
      { t: 'It goes to {winner}, who will not let anyone forget it.', h: 'g' },
      { t: 'Rematch is mandatory. Congratulations, {winner}.', h: 'g' },
      { t: 'Final answer: {winner}. Everybody shake hands.', h: 'g' },
      { t: 'The record book has been notified. Nice work, {winner}.', h: 'g' },
      { t: 'Good game, everybody. Especially {winner}.', h: 'g' },
      { t: 'Somebody deal the next one. {winner} is insufferable now.', h: 'g' }
    ]
  };
  function merge(LINES) {
    var k; for (k in EXTRA) {
      var have = {}; (LINES[k] || []).forEach(function (x) { have[typeof x === 'string' ? x : x.t] = 1; });
      LINES[k] = (LINES[k] || []).concat(EXTRA[k].filter(function (x) { return !have[x.t]; }));
    }
    return LINES;
  }
  return { get: get, set: set, heatOf: heatOf, allowed: allowed, fill: fill, merge: merge, LEVELS: LEVELS, POSITIVE: POSITIVE };
})();
