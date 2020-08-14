var dv = (function(dv){
  "use strict";
  function timeExtents(d) {
    let m = d.REPLAY.match(/([0-9]{4})([0-9]{2})([0-9]{2})_([0-9]{2})([0-9]{2})([0-9]{2})_/);
    const startstr = `${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]}:${m[6]}+01:00`; // Always assumes UTC+1 from server timestamps I guess
    const start = new Date(startstr);
    m = d.DURATION.match(/([0-9]*) (seconds?|minutes?|hours?)/); // hahaha somebody kill me
    const delta = new Date(0);
    switch (m[2]) {
      case "second":
      case "seconds":
        delta.setSeconds(m[1]);
        break;
      case "minute":
      case "minutes":
        delta.setMinutes(m[1]);
        break;
      case "hour":
      case "hours":
        delta.setHours(m[1]);
        break;
    }
    const end = new Date(0);
    end.setTime(start.getTime() + delta.getTime());
    return [start,end];
  }
  dv.preprocess = function preprocess(data) {
    data.forEach((d,i) => {
      [d.start,d.end] = timeExtents(d);
      d.isSingle = d.TITLE.includes('Single');
      d.players = (d.TEAM1.length || 0) + (d.TEAM2.length || 0);
      d.spectators = (d.SPECS.length || 0);
      // damn this is mess
      d.clangame_players = d.isSingle ? 0 : d.players;
      d.sologame_players = d.isSingle ? d.players : 0;
      d.clangame_spectators = d.isSingle ? 0 : d.spectators;
      d.sologame_spectators = d.isSingle ? d.spectators : 0;
      d.size = d.players + d.spectators;
      d.id = i;
    });
    return data;
  };
  return dv;
})(dv || {});
