var dv = (function(dv){
  "use strict";
  dv.init = async function init(config_loc) {
    let timeline_data = await d3.json(config_loc);
    timeline_data = dv.preprocess(timeline_data);
    dv.setup_charts(timeline_data);
  };
  return dv;
})(dv || {});
