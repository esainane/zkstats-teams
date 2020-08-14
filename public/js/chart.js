var dv = (function(dv){
  "use strict";
  const med_width = 400;
  const [width, height] = [(window.innerWidth || document.documentElement.clientWidth ||
document.body.clientWidth) - 20 - med_width, (window.innerHeight|| document.documentElement.clientHeight||
document.body.clientHeight)];
  const bar_margins = {left: 60, right: 18, top: 0, bottom: 30};
  const epoch = d3.utcDay.offset(new Date(0), 3); // calendar week (utc) starts at sunday

  /*
  function checkSanity() {
    const ga = window.groups.dayOfWeekAll;
    const v = ga.value();
    let error = false;
    for (let i = 0; i < window.rawData.length; ++i) {
      const k = window.rawData[i].start;
      if ((curFilter[0] <= k && k < curFilter[1]) !== v.sanity[i]) {
        console.log('Record', i, 'incorrectly', v.sanity[i], v.sanity[i] ? 'included' : 'not included', 'in day of week groupall; check is', curFilter[0], '<=', k, '<', curFilter[1]);
        error = true;
      }
    }
    if (error) {
      throw new dc.InvalidStateException();
    }
  }*/

  function wrapKeyFilter(f) {
    return (dimension, filters) => {
      if (filters.length === 0) {
        dimension.filter(null);
      } else if (filters.length === 1 && filters[0].filterType === 'RangedFilter') {
        const curFilter = [filters[0][0], filters[0][1]];
        dimension.filterFunction(
          d => curFilter[0] <= f(d) && f(d) < curFilter[1]
        );
      } else {
        throw new dc.InvalidStateException();
      }
    };
  }
  function reduceByRoom(group) {
    return group.reduce(
      (p,v,nf) => ({clangame_players:p.clangame_players+v.clangame_players,
        sologame_players:p.sologame_players+v.sologame_players,
        clangame_spectators:p.clangame_spectators+v.clangame_spectators,
        sologame_spectators:p.sologame_spectators+v.sologame_spectators,
        count:p.count+1
      }),
      (p,v,nf) => ({
        clangame_players:p.clangame_players-v.clangame_players,
        sologame_players:p.sologame_players-v.sologame_players,
        clangame_spectators:p.clangame_spectators-v.clangame_spectators,
        sologame_spectators:p.sologame_spectators-v.sologame_spectators,
        count:p.count-1
      }),
      () => ({clangame_players:0,sologame_players:0,clangame_spectators:0,sologame_spectators:0,count:0})
    );
  }
  function reduceCommon(group) {
    return group.reduce(
      ({player_sum,spectator_sum,count,sanity},{players,spectators,id},nf) => ({
        player_sum:player_sum+players,
        spectator_sum:spectator_sum+spectators,
        count:count+1,
      }),
      ({player_sum,spectator_sum,count,sanity},{players,spectators,id},nf) => ({
        player_sum:player_sum-players,
        spectator_sum:spectator_sum-spectators,
        count:count-1,
      }),
      () => ({player_sum:0,spectator_sum:0,count:0})
    );
  }

  let charts = {};
  function addFilterInfo(dim) {
    d3.select('#' + dim + '-dvchart')
    .append("p")
      .attr("class", "filterinfo")
    .append("span")
      .attr("class", "reset")
      .attr("style", "display: none")
    .append('a')
      .attr('class', 'reset')
      .attr('style', 'display: none')
      .attr('href', '#')
      .text('Clear filter:')
      .on('click', d => {
        charts[dim].filterAll();
        dc.redrawAll();
      });
  }

  dv.setup_charts = function setup_charts(rawdata) {
    const data = crossfilter(rawdata);
    let dims = {}, groups = {};

    // leave hackable
    window.dims = dims;
    window.groups = groups;
    window.charts = charts;
    // XXX: Remove once stable

    /* Matchups aggregations and display */
    dims.matchtimes = data.dimension(d => [d.start, d.end]);
    groups.matchtimes = reduceByRoom(dims.matchtimes.group());

    d3.select('#vis').append('div').attr('class', 'main').append('div').attr('id','matchtimes-dvchart').append('strong').text('Match times');
    addFilterInfo('matchtimes');
    const timeScale = d3.scaleTime().domain([
      Math.min(...rawdata.map(d=>d.start)),
      Math.max(...rawdata.map(d=>d.end))
    ]);


    /* TODO: Let people have a nicer interface to decide whether to combine or oppose room sizes after working out how to actually stack them */
    let doStack = false;
    window.flipStack = () => {doStack=!doStack;dc.redrawAll();};

    charts.matchtimes = dv.VarBarChart('#matchtimes-dvchart')
      .margins(bar_margins)
      .height(height - 31)
      .width(width)
      .elasticY(true)
      .dimension(dims.matchtimes)
      .keyAccessor(d => d.key[0]) // start
      .endAccessor(d => d.key[1]) // end - start
      .filterHandler(wrapKeyFilter(d => d[0])) // filter by start
      .group(groups.matchtimes, 'Group Room Players', d => d.value.clangame_players)
      .stack(groups.matchtimes, 'Group Room Spectators', d => d.value.clangame_spectators)
      .stack(groups.matchtimes, 'Solo Room Players', d => doStack ? d.value.sologame_players : -d.value.sologame_players)
      .stack(groups.matchtimes, 'Solo Room Spectators', d => doStack ? d.value.sologame_spectators : -d.value.sologame_spectators)
      .hidableStacks(['Solo Room Spectators', 'Group Room Spectators'])
      .renderHorizontalGridLines(true)
      .renderVerticalGridLines(true)
      .x(timeScale)
      .legend(new dc.Legend().x(bar_margins.left + 10).y(height - 28 * 4 - 30).itemHeight(13).gap(5))
      .render()
      ;

    const side = d3.select('#vis').append('div').attr('class', 'med side vcol');
    side.append('strong').text('Average active players...');

    /* Time of day aggregations and display */
    side.append('div').attr('id','timeofday-dvchart').append('strong').text('...by time of day');
    addFilterInfo('timeofday');
    dims.timeOfDay = data.dimension(window.df = d => {
      const delta = d3.utcDay.count(epoch, d3.utcDay.floor(d.start));
      return d3.utcDay.offset(d.start,-delta);
    });
    groups.timeOfDay = reduceCommon(dims.timeOfDay.group(d3.utcHour.ceil));
    const day_scale = d3.scaleTime().domain([
      epoch,
      d3.utcDay.offset(epoch,1)
    ]);
    const tod_chart = dc.barChart('#timeofday-dvchart')
      .margins(bar_margins)
      .height((height - 93) / 2)
      .width(med_width - 10)
      .elasticY(true)
      .dimension(dims.timeOfDay)
      .keyAccessor(d => d.key)
      .group(groups.timeOfDay, 'Players', d =>  d.value.count > 1 ? d.value.player_sum / d.value.count : 0)
      .stack(groups.timeOfDay, 'Spectators', d => d.value.count > 1 ? d.value.spectator_sum / d.value.count : 0)
      .hidableStacks(['Spectators'])
      .renderHorizontalGridLines(true)
      .renderVerticalGridLines(true)
      .x(day_scale)
      .legend(new dc.Legend().x(bar_margins.left + 10).y(10).itemHeight(13).gap(5))
      .render()
      ;
    tod_chart.xAxis().tickArguments([8]);
    tod_chart.xAxis().tickFormat(d3.timeFormat("%I %p"));

    /* Day of week aggregations and display */
    side.append('div').attr('id','dayofweek-dvchart').append('strong').text('...by day of week');
    addFilterInfo('dayofday');
    dims.dayOfWeek = data.dimension(d => {
      const delta = d3.utcWeek.count(epoch, d3.utcWeek.floor(d.start));
      return d3.utcWeek.offset(d.start,-delta);
    });
    groups.dayOfWeek = reduceCommon(dims.dayOfWeek.group(d3.utcHour.round));
    groups.dayOfWeekAll = reduceCommon(dims.dayOfWeek.groupAll());
    const week_scale = d3.scaleTime().domain([
      epoch,
      d3.utcWeek.offset(epoch,1)
    ]);
    const dow_chart = dc.barChart('#dayofweek-dvchart')
      .margins(bar_margins)
      .height((height - 93) / 2)
      .width(med_width - 10)
      .elasticY(true)
      .dimension(dims.dayOfWeek)
      .keyAccessor(d => d.key)
      .group(groups.dayOfWeek, 'Players', d => d.value.count > 1 ? d.value.player_sum / d.value.count : 0)
      .stack(groups.dayOfWeek, 'Spectators', d => d.value.count > 1 ? d.value.spectator_sum / d.value.count : 0)
      .hidableStacks(['Spectators'])
      .renderHorizontalGridLines(true)
      .renderVerticalGridLines(true)
      .x(week_scale)
      .legend(new dc.Legend().x(bar_margins.left + 10).y(10).itemHeight(13).gap(5))
      .render()
      ;
    dow_chart.xAxis().tickArguments([7]);
    dow_chart.xAxis().tickFormat(d3.timeFormat("%a"));
    dc.renderAll();
  };
  return dv;
})(dv || {});
