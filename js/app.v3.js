(function () {
  //UI configuration
  var
    baseLimit = 20,
    limit = 100,
    baseSize = 25,
    itemWidth = Math.floor(baseSize / (limit / baseLimit)),
    itemHeight = baseSize,
    calibrationSize = baseSize - 1,
    cellWidth = itemWidth - 1,
    cellHeight = itemHeight - 1,
    width = 800,
    height = 800,
    margin = {
      top: 40,
      right: 20,
      bottom: 20,
      left: 45
    },
    baseRange = [0, 500];

  //formats
  var millisecondFormat = d3.time.format('%L'),
    secondFormat = d3.time.format('%S'),
    secondMillisecondFormat = d3.time.format('%M:%S'),
    minuteFormat = d3.time.format('%M'),
    hourFormat = d3.time.format('%H'),
    dayFormat = d3.time.format('%j'),
    timeFormat = d3.time.format('%Y-%m-%dT%X'),
    monthDayFormat = d3.time.format('%d/%m');

  //data vars for rendering
  var timeExtent = null,
    data = null,
    timeOffset = 0,
    colorCalibration = ['#F6FAAA', '#F1ECA4', '#ECDF9F', '#E8D299', '#E3C594', '#DEB88E', '#DAAB89', '#D59E83', '#D0917E', '#CC8478', '#C77673', '#C3696D', '#BE5C68', '#B94F62', '#B5425D', '#B03557', '#AB2852', '#A71B4C', '#A20E47', '#9E0142'],
    channelValueExtent = {};

  //axises and scales
  var axisWidth = 0,
    axisHeight = itemHeight * 24,
    xAxisScale = d3.time.scale(),
    xAxis = d3.svg.axis()
    .orient('top') // Column label position
    .ticks(d3.time.minute, limit/baseLimit) // How often column label is rendered
    .tickFormat(secondMillisecondFormat), // How column label is rendered
    yAxisScale = d3.scale.linear()
    .range([0, axisHeight])
    .domain([0, 24]),
    yAxis = d3.svg.axis()
    .orient('left') // Row label position
    .ticks(23) // How many row labels will be rendered
    .tickFormat(d3.format('02d')) // How row label is rendered
    .scale(yAxisScale);

  initCalibration();

  var svg = d3.select('[role="heatmap"]');
  var heatmap = svg
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('width', width - margin.left - margin.right)
    .attr('height', height - margin.top - margin.bottom)
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
  var rect = null;

  d3.json(`rows/${limit}/values/100000`, function (err, data) {
    data = data.data;
    data.forEach(function (valueObj) {
      valueObj['value'] = valueObj['Values'];
      valueObj['date'] = timeFormat.parse(valueObj['From'].replace('Z', ''));
      var channel = valueObj['Channel']; // = minuteFormat(valueObj['date']);

      var channelData = channelValueExtent[channel] = (channelValueExtent[channel] || baseRange);
      var value = valueObj['value'][0];
      channelData[0] = d3.min([channelData[0], value]);
      channelData[1] = d3.max([channelData[1], value]);
    });

    // Compute the minimum and maximum value in an array.
    timeExtent = d3.extent(data, function (d) {
      return d.date.valueOf();
    })

    // Compute width
    axisWidth = itemWidth * limit;

    // Render axises
    xAxis.scale(xAxisScale.range([0, axisWidth]).domain([timeExtent[0], timeExtent[1]]));
    svg.append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
      .attr('class', 'x axis')
      .call(xAxis)
      .append('text')
      .text('Timestamp')
      .attr('transform', 'translate(' + (axisWidth - 50) + ',-20)');

    svg.append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
      .attr('class', 'y axis')
      .call(yAxis)
      .append('text')
      .text('Channel')
      .attr('transform', 'translate(-25,' + axisHeight + ') rotate(-90)');

    // Render heatmap rects
    timeOffset = timeExtent[0];
    var timeRange = d3.scale.quantize()
      .range(Array(limit).fill().map((_, i) => i))
      .domain([timeExtent[0], timeExtent[1]]);

    rect = heatmap.selectAll('rect')
      .data(data)
      .enter().append('rect')
      .attr('width', cellWidth)
      .attr('height', cellHeight)
      .attr('x', function (d) {
        return itemWidth * timeRange(d.date.valueOf());
      })
      .attr('y', function (d) {
        return (d.Channel - 1) * itemHeight;
      })
      .attr('fill', '#ffffff');

    rect.filter(function (d) {
        return d.value['PM2.5'] > 0;
      })
      .append('title')
      .text(function (d) {
        return monthDayFormat(d.date) + ' ' + d.value['PM2.5'];
      });

    renderColor();
  });

  function initCalibration() {
    d3.select('[role="calibration"] [role="example"]').select('svg')
      .selectAll('rect').data(colorCalibration).enter()
      .append('rect')
      .attr('width', calibrationSize)
      .attr('height', calibrationSize)
      .attr('x', function (d, i) {
        return i * baseSize;
      })
      .attr('fill', function (d) {
        return d;
      });

    //bind click event
    d3.selectAll('[role="calibration"] [name="displayType"]').on('click', function () {
      renderColor();
    });
  }

  function renderColor() {
    var renderByCount = document.getElementsByName('displayType')[0].checked;

    rect
      .filter(function (d) {
        return (d.value[0] >= 0);
      })
      .transition()
      .delay(function (d) {
        return (d.Channel.valueOf() - timeOffset) / 1000 * 15;
      })
      .duration(500)
      .attrTween('fill', function (d, i, a) {
        //choose color dynamicly      
        var colorIndex = d3.scale.quantize()
          .range(Array(colorCalibration.length).fill().map((_, i) => i))
          .domain((renderByCount ? baseRange : channelValueExtent[d.Channel]));

        return d3.interpolate(a, colorCalibration[colorIndex(d.value[0])]);
      });
  }

  //extend frame height in `http://bl.ocks.org/`
  d3.select(self.frameElement).style("height", "600px");
})();