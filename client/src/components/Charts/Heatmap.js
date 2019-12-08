import React from "react";
import d3 from "d3";
import "./../../styles/Heatmap.css";

export default class Heatmap extends React.Component {
  constructor() {
    super();

    this.baseLimit = 20;
    this.limit = 100;
    this.baseSize = 25;
    this.itemWidth = Math.floor(this.baseSize / (this.limit / this.baseLimit));
    this.itemHeight = this.baseSize;
    this.calibrationSize = this.baseSize - 1;
    this.cellWidth = this.itemWidth - 1;
    this.cellHeight = this.itemHeight - 1;
    this.width = 800;
    this.height = 800;
    this.margin = {
      top: 40,
      right: 20,
      bottom: 20,
      left: 45
    };
    this.baseRange = [0, 500];

    //formats
    this.millisecondFormat = d3.time.format("%L");
    this.secondFormat = d3.time.format("%S");
    this.secondMillisecondFormat = d3.time.format("%M:%S");
    this.minuteFormat = d3.time.format("%M");
    this.hourFormat = d3.time.format("%H");
    this.dayFormat = d3.time.format("%j");
    this.timeFormat = d3.time.format("%Y-%m-%dT%X");
    this.monthDayFormat = d3.time.format("%d/%m");

    //data vars for rendering
    this.timeExtent = null;
    this.data = null;
    this.timeOffset = 0;
    this.colorCalibration = [
      "#F6FAAA",
      "#F1ECA4",
      "#ECDF9F",
      "#E8D299",
      "#E3C594",
      "#DEB88E",
      "#DAAB89",
      "#D59E83",
      "#D0917E",
      "#CC8478",
      "#C77673",
      "#C3696D",
      "#BE5C68",
      "#B94F62",
      "#B5425D",
      "#B03557",
      "#AB2852",
      "#A71B4C",
      "#A20E47",
      "#9E0142"
    ];
    this.channelValueExtent = {};

    //axises and scales
    this.axisWidth = 0;
    this.axisHeight = this.itemHeight * 24;
    this.xAxisScale = d3.time.scale();
    this.xAxis = d3.svg
      .axis()
      .orient("top") // Column label position
      .ticks(d3.time.minute, this.limit / this.baseLimit) // How often column label is rendered
      .tickFormat(this.secondMillisecondFormat); // How column label is rendered
    this.yAxisScale = d3.scale
      .linear()
      .range([0, this.axisHeight])
      .domain([0, 24]);
    this.yAxis = d3.svg
      .axis()
      .orient("left") // Row label position
      .ticks(23) // How many row labels will be rendered
      .tickFormat(d3.format("02d")) // How row label is rendered
      .scale(this.yAxisScale);
  }

  componentDidMount() {
    this.svg = d3.select('[d3-role="heatmap"]');
    this.heatmap = this.svg
      .attr("width", this.width)
      .attr("height", this.height)
      .append("g")
      .attr("width", this.width - this.margin.left - this.margin.right)
      .attr("height", this.height - this.margin.top - this.margin.bottom)
      .attr(
        "transform",
        "translate(" + this.margin.left + "," + this.margin.top + ")"
      );
    this.rect = null;

    d3.json(
      `http://localhost:8080/json/channels_${this.limit}_10000.json`,
      (err, data) => {
        data = data.data;
        data.forEach(valueObj => {
          valueObj["value"] = valueObj["Values"];
          valueObj["date"] = this.timeFormat.parse(
            valueObj["From"].replace("Z", "")
          );
          var channel = valueObj["Channel"]; // = minuteFormat(valueObj['date']);

          var channelData = (this.channelValueExtent[channel] =
            this.channelValueExtent[channel] || this.baseRange);
          var value = valueObj["value"][0];
          channelData[0] = d3.min([channelData[0], value]);
          channelData[1] = d3.max([channelData[1], value]);
        });

        // Compute the minimum and maximum value in an array.
        this.timeExtent = d3.extent(data, d => d.date.valueOf());

        // Compute width
        this.axisWidth = this.itemWidth * this.limit;

        // Render axises
        this.xAxis.scale(
          this.xAxisScale
            .range([0, this.axisWidth])
            .domain([this.timeExtent[0], this.timeExtent[1]])
        );
        this.svg
          .append("g")
          .attr(
            "transform",
            "translate(" + this.margin.left + "," + this.margin.top + ")"
          )
          .attr("class", "x axis")
          .call(this.xAxis)
          .append("text")
          .text("Timestamp")
          .attr("transform", "translate(" + (this.axisWidth - 50) + ",-20)");

        this.svg
          .append("g")
          .attr(
            "transform",
            "translate(" + this.margin.left + "," + this.margin.top + ")"
          )
          .attr("class", "y axis")
          .call(this.yAxis)
          .append("text")
          .text("Channel")
          .attr(
            "transform",
            "translate(-25," + this.axisHeight + ") rotate(-90)"
          );

        // Render heatmap rects
        this.timeOffset = this.timeExtent[0];
        var timeRange = d3.scale
          .quantize()
          .range(
            Array(this.limit)
              .fill()
              .map((_, i) => i)
          )
          .domain([this.timeExtent[0], this.timeExtent[1]]);

        this.rect = this.heatmap
          .selectAll("rect")
          .data(data)
          .enter()
          .append("rect")
          .attr("width", this.cellWidth)
          .attr("height", this.cellHeight)
          .attr("x", d => this.itemWidth * timeRange(d.date.valueOf()))
          .attr("y", d => (d.Channel - 1) * this.itemHeight)
          .attr("fill", "#ffffff");

        this.rect
          .filter(function(d) {
            return d.value["PM2.5"] > 0;
          })
          .append("title")
          .text(function(d) {
            return this.monthDayFormat(d.date) + " " + d.value["PM2.5"];
          });

        this.renderColor();
      }
    );
  }

  componentWillUnmount() {}

  initCalibration() {
    d3.select('[d3-role="calibration"] [d3-role="example"]')
      .select("svg")
      .selectAll("rect")
      .data(this.colorCalibration)
      .enter()
      .append("rect")
      .attr("width", this.calibrationSize)
      .attr("height", this.calibrationSize)
      .attr("x", (_, i) => i * this.baseSize)
      .attr("fill", d => d);

    //bind click event
    d3.selectAll('[d3-role="calibration"] [name="displayType"]').on(
      "click",
      function() {
        this.renderColor();
      }
    );
  }

  renderColor() {
    var renderByCount = document.getElementsByName("displayType")[0].checked;

    this.rect
      .filter(function(d) {
        return d.value[0] >= 0;
      })
      .transition()
      .delay(d => ((d.Channel.valueOf() - this.timeOffset) / 1000) * 15)
      .duration(500)
      .attrTween("fill", (d, i, a) => {
        //choose color dynamicly
        var colorIndex = d3.scale
          .quantize()
          .range(
            Array(this.colorCalibration.length)
              .fill()
              .map((_, i) => i)
          )
          .domain(
            renderByCount ? this.baseRange : this.channelValueExtent[d.Channel]
          );

        return d3.interpolate(a, this.colorCalibration[colorIndex(d.value[0])]);
      });
  }

  render() {
    return (
      <div className="days-hours-heatmap">
        {/* calibration and render type controller */}
        <div className="calibration" d3-role="calibration">
          <div className="group" d3-role="example">
            <svg width="500" height="17"></svg>
            <div d3-role="description" className="description">
              <label>Less</label>
              <label>More</label>
            </div>
          </div>
          <div d3-role="toggleDisplay" className="display-control">
            <div>
              <input type="radio" name="displayType" checked />
              <label>count</label>
            </div>
            <div>
              <input type="radio" name="displayType" />
              <label>channel</label>
            </div>
          </div>
        </div>
        {/* heatmap */}
        <svg d3-role="heatmap" className="heatmap"></svg>
      </div>
    );
  }
}
