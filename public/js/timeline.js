var dv = (function(dv){
  "use strict";
  const [width, height] = [1000, 500];
  let maxEnd = 0;
  let maxEndD;
  function timeExtents(d) {
    let m = d.REPLAY.match(/([0-9]{4})([0-9]{2})([0-9]{2})_([0-9]{2})([0-9]{2})([0-9]{2})_/)
    const startstr = `${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]}:${m[6]}+01:00`; // Always assumes UTC+1 from server timestamps I guess
    const start = new Date(startstr)
    m = d.DURATION.match(/([0-9]*) (seconds?|minutes?|hours?)/) // hahaha somebody kill me
    const delta = new Date(0);
    switch (m[2]) {
        case "second":
        case "seconds":
            delta.setSeconds(m[1])
            break;
        case "minute":
        case "minutes":
            delta.setMinutes(m[1])
            break;
        case "hour":
        case "hours":
            delta.setHours(m[1])
            break;
    }
    const end = new Date(0);
    end.setTime(start.getTime() + delta.getTime());
    if (end == 0 || end > maxEnd) { maxEndD = d; maxEnd = end; }
    return [start,end];
  }
  dv.init = async function init(configloc) {
    let timelineData = await d3.json(configloc);
    timelineData.forEach(d => [d.start,d.end] = timeExtents(d));
    console.log(maxEndD);
    const xAxis = d3.scaleTime().domain([
      Math.min(...timelineData.map(d=>d.start)),
      Math.max(...timelineData.map(d=>d.end))
    ]).range([10, width - 10]);
    const yAxis = d3.scaleLinear().domain([
      0,
      // herp // Math.min(...timelineData.map(d=>d.TEAM1.length+d.TEAM2.length+d.SPECS.length)),
      Math.max(...timelineData.map(d=>d.TEAM1.length+d.TEAM2.length+d.SPECS.length))
    ]).range([0, height / 2]);
    const svg = d3.select('#vis').append('svg')
      .attr('viewBox', [0, 0, width, height]);
    const g = svg.selectAll('g')
      .data(timelineData)
      .join('g')
        .each(d=>{
          d.isSingle = d.TITLE.includes('Single');
          d.x = xAxis(d.start);
          d.w = xAxis(d.end)-xAxis(d.start);
          d.ph = yAxis(d.TEAM1.length + d.TEAM2.length);
          d.sh = yAxis(d.SPECS.length);
        })
        .attr('transform', `translate(0,${height/2})`)
        .attr('class', d => d.isSingle ? 'singlebalance' : 'clanbalance');
    console.log(xAxis.domain(),xAxis.range());
    console.log(yAxis.domain(),yAxis.range());
    const players = g.append('rect')
      .attr('class', 'players')
        .attr('x', d => d.x)
        .attr('y', d => d.isSingle ? 0 : -d.ph)
        .attr('width', d => d.w)
        .attr('height', d => d.ph);
    const specs = g.append('rect')
      .attr('class', 'specs')
        .attr('x', d => d.x)
        .attr('y', d => d.isSingle ? d.ph : -d.ph-d.sh)
        .attr('width', d => d.w)
        .attr('height', d => d.sh);
  }
  return dv;
})(dv || {})
