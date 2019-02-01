/**
 * The polar row chart implementation is usually used to visualize a progressive ratio.  The polar row chart
 * uses group array data to plot the circular rows.
 *
 * Examples:
 * - {@link http://dc-js.github.com/dc.js/ Nasdaq 100 Index}
 * @class polarChart
 * @memberof dc
 * @mixes dc.colorMixin
 * @mixes dc.baseMixin
 * @example
 * // create a polar row chart under #chart-container1 element using the default global chart group
 * var chart1 = dc.polarRowChart('#chart-container1');
 * // create a polar row chart under #chart-container2 element using chart group A
 * var chart2 = dc.polarRowChart('#chart-container2', 'chartGroupA');
 * @param {String|node|d3.selection} parent - Any valid
 * {@link https://github.com/d3/d3-selection/blob/master/README.md#select d3 single selector} specifying
 * a dom block element such as a div; or a dom element or d3 selection.
 * @param {String} [chartGroup] - The name of the chart group this chart instance should be placed in.
 * Interaction with a chart will only trigger events and redraws within the chart's group.
 * @returns {dc.polarRowChart}
 */
dc.polarRowChart = function (parent, chartGroup) {
    var _coreCssClass = 'polar-core';
    var _coreKeyCssClass = 'polar-core-key';
    var _coreValueCssClass = 'polar-core-value';
    var _polarRowCssClass = 'polar-row';
    var _percentCssClass = 'polar-percent';
    var _labelCssClass = 'polar-label';
    var _coreGroupCssClass = 'polar-core-group';
    var _rowGroupCssClass = 'polar-row-group';
    var _percentGroupCssClass = 'polar-percent-group';
    var _labelGroupCssClass = 'polar-label-group';
    var _emptyCssClass = 'empty-chart';

    var _radius,
        _givenRadius, // specified radius, if any
        _coreSize = 0.4,
        _rowMinBorder = 12,
        _externalRadiusPadding = 0;

    var _gap = 0.02,
        _maxAngle = 0.0 * 2 * Math.PI;

    var _polarRowData,
        _domainValue,
        _rowCount,
        _arcWidth,
        _cornerSize;

    var _g;
    var _cx;
    var _cy;
    var _chart = dc.colorMixin(dc.baseMixin({}));

    _chart.renderLabel(true);

    _chart.transitionDuration(350);
    _chart.transitionDelay(0);

    _chart.colorAccessor(function (d, i) { return i + 1; });

    _chart._doRender = function () {
        _chart.resetSvg();

        _g = _chart.svg()
            .append('g')
            .attr('transform', 'translate(' + _chart.cx() + ',' + _chart.cy() + ')');

        _g.append('g').attr('class', _coreGroupCssClass);
        _g.append('g').attr('class', _rowGroupCssClass);
        _g.append('g').attr('class', _percentGroupCssClass);
        _g.append('g').attr('class', _labelGroupCssClass);

        drawChart();

        return _chart;
    };

    function drawChart() {
        // set radius from chart size if none given, or if given radius is too large
        var maxRadius = d3.min([_chart.width(), _chart.height()]) / 2;
        _radius = _givenRadius && _givenRadius < maxRadius ? _givenRadius : maxRadius;

        _rowCount = 0;
        _chartData = _chart.data();
        _polarRowData = [];
        if (_chartData[0]) {
            _chartData[0].value.forEach(function (d) {
                if (_rowCount == 0) {
                    _domainValue = d.value;
                } else {
                    _polarRowData.push(d);
                }

                _rowCount++;
            });
            _arcWidth = (1 - _coreSize) / (_rowCount - 1);
            _cornerSize = _radius * _arcWidth / 2;

            // if we have data...
            if (_domainValue) {
                _g.classed(_emptyCssClass, false);
            } else {
                // otherwise we'd be getting NaNs, so override
                // note: abuse others for its ignoring the value accessor
                _g.classed(_emptyCssClass, true);
            }

            if (_g) {
                var core = _g.select('g.' + _coreGroupCssClass)
                    .selectAll('circle.' + _coreCssClass)
                    .data(_chartData);

                var coreKey = _g.select('g.' + _coreGroupCssClass)
                    .selectAll('text.' + _coreKeyCssClass)
                    .data(_chartData);

                var coreValue = _g.select('g.' + _coreGroupCssClass)
                    .selectAll('text.' + _coreValueCssClass)
                    .data(_chartData);

                var rows = _g.select('g.' + _rowGroupCssClass)
                    .selectAll('g.' + _polarRowCssClass)
                    .data(_polarRowData);

                var percents = _g.select('g.' + _percentGroupCssClass)
                    .selectAll('text.' + _percentCssClass)
                    .data(_polarRowData);

                var labels = _g.select('g.' + _labelGroupCssClass)
                    .selectAll('text.' + _labelCssClass)
                    .data(_polarRowData);

                removeElements(core, coreKey, coreValue, rows, percents, labels);

                createElements(core, coreKey, coreValue, rows, percents, labels);

                updateElements();

                dc.transition(_g, _chart.transitionDuration(), _chart.transitionDelay())
                    .attr('transform', 'translate(' + _chart.cx() + ',' + _chart.cy() + ')');
            }
        }
    }

    function createElements(core, coreKey, coreValue, rows, percents, labels) {
        // create core
        core
            .enter()
            .append("circle")
            .attr('class', function (d, i) {
                return _coreCssClass + ' _' + i;
            })
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("r", _coreSize * _radius)
            .attr("fill", _chart.getColor(0));

        coreKey
            .enter()
            .append("text")
            .attr('class', function (d, i) {
                return _coreKeyCssClass + ' _' + i;
            })
            // .attr("dominant-baseline", "text-after-edge")
            .attr("dy", "-0.4em")
            .attr("text-anchor", "middle")
            .attr("fill", "white");

        coreValue
            .enter()
            .append("text")
            .attr('class', function (d, i) {
                return _coreValueCssClass + ' _' + i;
            })
            // .attr("dominant-baseline", "text-before-edge")
            .attr("dy", "0.8em")
            .attr("text-anchor", "middle")
            .attr("fill", "white");

        // create RowNodes
        var RowNodes = rows
            .enter()
            .append('g')
            .attr('class', function (d, i) {
                return _polarRowCssClass + ' _' + i;
            });

        // create row path
        RowNodes.append('path')
            .attr('id', function (d, i) { return 'rowPath' + i })
            .attr('fill', fill)
            .on('click', onClick);

        // create titles
        if (_chart.renderTitle()) {
            RowNodes.append('title');
        }

        // create percents
        if (_chart.renderLabel()) {
            percents
                .enter()
                .append('text')
                .attr('class', function (d, i) {
                    return _polarRowCssClass + ' ' + _percentCssClass + ' _' + i;
                })
                .attr("x", _rowMinBorder - (_radius * _gap))
                .attr("y", function (d, i) { return -getRadius(i + 0.5) - (_radius * _gap / 2); })
                // .attr("dominant-baseline", "central")
                .attr("dy", "0.4em")
                .attr("fill", "white")
                .attr("text-anchor", "end");
        }

        // create labels
        if (_chart.renderLabel()) {
            labels
                .enter()
                .append('text')
                .attr('class', function (d, i) {
                    return _polarRowCssClass + ' ' + _labelCssClass + ' _' + i;
                })
                .attr("x", _rowMinBorder + (_radius * _gap))
                .attr("y", function (d, i) { return -getRadius(i + 0.5) - (_radius * _gap / 2); })
                // .attr("dominant-baseline", "central")
                .attr("dy", "0.4em")
                .attr("fill", fill)
                .on('click', onClick)
                .on('mouseover', function (d, i) {
                    highlightRow(i, true);
                })
                .on('mouseout', function (d, i) {
                    highlightRow(i, false);
                });
        }
    }

    function getRadius(ratio) {
        return (1 - (ratio * _arcWidth)) * _radius;
    }

    function getBorderAngle(d, i) {
        return Math.asin(_rowMinBorder / getRadius(i + 0.5));
    }

    function highlightRow(i, whether) {
        _chart.select('g.' + _polarRowCssClass + '._' + i)
            .classed('highlight', whether);
    }

    function updateElements() {
        updateCore();
        updateRowPaths(_polarRowData);
        updateTitles(_polarRowData);
        updatePercents(_polarRowData);
        updateLabels(_polarRowData);
    }

    function updateCore() {
        _g.selectAll('text.' + _coreKeyCssClass)
            .data(_chartData)
            .text(function (d) {
                return d.value[0].key;
            });

        _g.selectAll('text.' + _coreValueCssClass)
            .data(_chartData)
            .text(function (d) {
                return d3.format(",d")(d.value[0].value);
            });
    }

    function updateRowPaths() {
        var rowPaths = _g.selectAll('g.' + _polarRowCssClass)
            .data(_polarRowData)
            .select('path')
            .attr('d', function (d, i) {
                return safeRow(d, i, buildRows());
            });

        var transition = dc.transition(rowPaths, _chart.transitionDuration(), _chart.transitionDelay());
        if (transition.attrTween) {
            transition.attrTween('d', function (d, i) {
                var current = this._current;
                if (!current) {
                    current = 0;
                }
                var intep = d3.interpolate({ order: d.order, value: (current * _domainValue) }, d);
                this._current = d.value / _domainValue;
                return function (t) {
                    return safeRow(intep(t), i, buildRows());
                };
            });
        }
        transition.attr('fill', fill);
    }

    function updateTitles() {
        if (_chart.renderTitle()) {
            _g.selectAll('g.' + _polarRowCssClass)
                .data(_polarRowData)
                .select('title')
                .text(function (d) {
                    return _chart.title()(d);
                });
        }
    }

    function updatePercents() {
        if (_chart.renderLabel()) {
            _g.selectAll('text.' + _percentCssClass)
                .data(_polarRowData)
                .text(function (d) { return d3.format(".0%")(d.value / _domainValue); });
        }
    }

    function updateLabels() {
        if (_chart.renderLabel()) {
            _g.selectAll('text.' + _labelCssClass)
                .data(_polarRowData)
                .text(function (d) { return _chart.label()(d); });
        }
    }

    function removeElements(core, coreKey, coreValue, rows, percents, labels) {
        core.exit().remove();
        coreKey.exit().remove();
        coreValue.exit().remove();
        rows.exit().remove();
        percents.exit().remove();
        labels.exit().remove();
    }

    /**
     * Get or set the external radius padding of the polar chart. This will force the radius of the
     * polar chart to become smaller or larger depending on the value.
     * @method externalRadiusPadding
     * @memberof dc.polarChart
     * @instance
     * @param {Number} [externalRadiusPadding=0]
     * @returns {Number|dc.polarChart}
     */
    _chart.externalRadiusPadding = function (externalRadiusPadding) {
        if (!arguments.length) {
            return _externalRadiusPadding;
        }
        _externalRadiusPadding = externalRadiusPadding;
        return _chart;
    };

    /**
     * Get or set the core size ratio of the polar chart.
     * @method coreSize
     * @memberof dc.polarChart
     * @instance
     * @param {Number} [corSize=0.4]
     * @returns {Number|dc.polarChart}
     */
    _chart.coreSize = function (coreSize) {
        if (!arguments.length) {
            return _coreSize;
        }
        _coreSize = coreSize;
        return _chart;
    };

    /**
     * Get or set the outer radius. If the radius is not set, it will be half of the minimum of the
     * chart width and height.
     * @method radius
     * @memberof dc.polarChart
     * @instance
     * @param {Number} [radius]
     * @returns {Number|dc.polarChart}
     */
    _chart.radius = function (radius) {
        if (!arguments.length) {
            return _givenRadius;
        }
        _givenRadius = radius;
        return _chart;
    };

    /**
     * Get or set center x coordinate position. Default is center of svg.
     * @method cx
     * @memberof dc.polarChart
     * @instance
     * @param {Number} [cx]
     * @returns {Number|dc.polarChart}
     */
    _chart.cx = function (cx) {
        if (!arguments.length) {
            return (_cx || _chart.width() / 2);
        }
        _cx = cx;
        return _chart;
    };

    /**
     * Get or set center y coordinate position. Default is center of svg.
     * @method cy
     * @memberof dc.polarChart
     * @instance
     * @param {Number} [cy]
     * @returns {Number|dc.polarChart}
     */
    _chart.cy = function (cy) {
        if (!arguments.length) {
            return (_cy || _chart.height() / 2);
        }
        _cy = cy;
        return _chart;
    };

    function buildRows() {
        return d3.arc()
            .startAngle(function (d, i) {
                var minAngle = 2 * Math.PI - getBorderAngle(d, i);
                var deltaAngle = minAngle - _maxAngle;
                return minAngle - (deltaAngle * d.value / _domainValue);
            })
            .endAngle(function (d, i) { return 2 * Math.PI + getBorderAngle(d, i); })
            .innerRadius(function (d, i) { return getRadius(i + 1) + (_radius * _gap); })
            .outerRadius(function (d, i) { return getRadius(i); })
            .cornerRadius(_cornerSize);
    }

    _chart._doRedraw = function () {
        drawChart();
        return _chart;
    };

    function fill(d, i) {
        return _chart.getColor(d, i);
    }

    function onClick(d, i) {
        if (_g.attr('class') !== _emptyCssClass) {
            _chart.onClick(d, i);
        }
    }

    function safeRow(d, i, row) {
        var path = row(d, i);
        if (path.indexOf('NaN') >= 0) {
            path = 'M0,0';
        }
        return path;
    }

    _chart.legendables = function () {
        return _chart.data().map(function (d, i) {
            var legendable = { name: d.key, data: d.value, others: d.others, chart: _chart };
            legendable.color = _chart.getColor(d, i);
            return legendable;
        });
    };

    _chart.legendHighlight = function (d) {
        highlightRowFromLegendable(d, true);
    };

    _chart.legendReset = function (d) {
        highlightRowFromLegendable(d, false);
    };

    _chart.legendToggle = function (d) {
        _chart.onClick({ key: d.name, others: d.others });
    };

    function highlightRowFromLegendable(legendable, highlighted) {
        _chart.selectAll('g.polar-slice').each(function (d) {
            if (legendable.name === d.data.key) {
                d3.select(this).classed('highlight', highlighted);
            }
        });
    }

    return _chart.anchor(parent, chartGroup);
};