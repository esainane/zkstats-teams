var dv = (function(dv){
  "use strict";
  const {pluck,transition,utils} = dc;
  class VarBarChart extends dc.BarChart {
    _endAccessor() {
      return this._barWidth;
    }
    endAccessor(_) {
      if (!arguments.length) return this._endAccessor;
      this._endAccessor = _;
      return this;
    }
    xAxisMax () {
      // this only adds .w into consideration for the highest value
      const m = max(this._flattenStack(), d => d.x + d.w);
      return utils.add(m, this.xAxisPadding(), this.xAxisPaddingUnit());
    }
    _prepareValues(layer, layerIdx) {
      const valAccessor = layer.accessor || this.valueAccessor();
      layer.name = String(layer.name || layerIdx);
      const allValues = layer.group.all().map((d, i) => ({
          x: this.keyAccessor()(d, i),
          xe: this.endAccessor()(d, i), // the only addition to _prepareValues
          y: layer.hidden ? null : valAccessor(d, i),
          data: d,
          layer: layer.name,
          hidden: layer.hidden
      }));

      layer.domainValues = allValues.filter(l => this._domainFilter()(l));
      layer.values = this.evadeDomainFilter() ? allValues : layer.domainValues;
    }
    _renderBars(layer, layerIndex, data) {
      const bars = layer.selectAll('rect.bar')
        .data(data.values, pluck('x'));

      const enter = bars.enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('fill', pluck('data', this.getColor))
        .attr('x', d => this._barXPos(d))
        .attr('y', this.yAxisHeight())
        .attr('height', 0);

      const barsEnterUpdate = enter.merge(bars);

      if (this.renderTitle()) {
        enter.append('title').text(pluck('data', this.title(data.name)));
      }

      if (this.isOrdinal()) {
        barsEnterUpdate.on('click', d => this.onClick(d));
      }

      transition(barsEnterUpdate, this.transitionDuration(), this.transitionDelay())
        .attr('x', d => this._barXPos(d))
        .attr('y', d => {
          let y = this.y()(d.y + d.y0);

          if (d.y < 0) {
            y -= this._barHeight(d);
          }

          return utils.safeNumber(y);
        })
        .attr('width', d =>
          utils.safeNumber(Math.abs(this.x()(d.xe)-this.x()(d.x))) // change 1
        )
        .attr('height', d => this._barHeight(d))
        .attr('fill', pluck('data', this.getColor))
        .select('title').text(pluck('data', this.title(data.name)));

      transition(bars.exit(), this.transitionDuration(), this.transitionDelay())
        .attr('x', d => this.x()(d.x))
        .attr('width', d => utils.safeNumber(Math.abs(this.x()(d.xe)-this.x()(d.x))) * 0.9) // change 2
        .remove();
    }
  }
  dv.VarBarChart = function(a,b,c,d) { return new VarBarChart(a,b,c,d); };
  return dv;
})(dv || {});
