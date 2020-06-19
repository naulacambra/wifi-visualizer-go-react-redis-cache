import React, { Component } from "react";
import WifiService from "../Services/WifiService";
import {
    select,
    scaleLinear,
    scaleTime,
    scaleOrdinal,
    axisBottom,
    axisLeft,
    range,
    schemeCategory10,
    min,
    extent,
    max,
    line,
    nest,
    timeFormat,
    timeMinute,
    format
} from "d3";
import { Spinner } from 'react-bootstrap'

function setDate(date, d, h, m) {
    date = new Date(date);
    date.setHours(date.getHours() + h);
    return date;
}

function dateBetween(date, sh, sm, fh, fm) {
    let s = parseInt(sh) * 60 + parseInt(sm);
    let f = parseInt(fh) * 60 + parseInt(fm);
    let t = date.getHours() * 60 + date.getMinutes();
    return t >= s && t <= f;
}

export class ValuesChannelChart extends Component {
    constructor(props) {
        super(props);
        this.state = {
            data: [],
            loading: 0,
            selectedChannels: []
        };

        this.handleChannelChange = this.handleChannelChange.bind(this);
    }

    componentDidMount() {
        this.setupDraw();
        this.loadData();
    }

    componentDidUpdate(prevProps) {
        const { threshold, from, to, ratio } = this.props;
        if (threshold !== prevProps.threshold || ratio !== prevProps.ratio) {
            this.loadData();
        }
        if (from !== prevProps.from || to !== prevProps.to) {
            this.filterData();
        }
    }

    componentWillUnmount() {
        WifiService.abort();
    }

    handleChannelChange(d) {
        const { selectedChannels } = this.state;
        if (selectedChannels.includes(d)) {
            selectedChannels.splice(selectedChannels.findIndex(i => i === d), 1)
        } else {
            selectedChannels.push(d);
        }
        this.setState(() => ({
            selectedChannels: selectedChannels
        }), function () {
            this.filterData()
        })
    }

    loadData() {
        // /band/:band/threshold/:threshold/ratio/:ratio
        const { threshold, ratio } = this.props;

        this.setState(() => ({
            loading: 1
        }));

        WifiService.getChannelsValues(threshold, ratio)
            .then(response => {
                var parsed = response.data.map(d => ({
                    ...d,
                    From: setDate(d.From, 0, -2),
                    visibility: 'visible'
                }));

                this.setState(state => ({
                    data: parsed,
                    loading: state.loading - 1
                }), function () {
                    this.filterData();
                });
            }).catch(() => {
                this.setState(state => ({
                    loading: state.loading - 1
                }));
            });
    }

    filterData() {
        const { data, selectedChannels } = this.state;
        const { from, to } = this.props;
        let fData = [];

        let check = d =>
            selectedChannels.includes(d.Channel) && dateBetween(d.From, ...from.split(":"), ...to.split(":"))
                ? 'visible'
                : 'hidden';

        if (selectedChannels.length > 0) {
            fData = data.map(d => ({
                ...d,
                visibility: check(d)
            }));
        } else {
            fData = data.map(d => ({
                ...d,
                visibility: dateBetween(d.From, ...from.split(":"), ...to.split(":")) ? 'visible' : 'hidden'
            }));
        }

        this.setState(() => ({
            data: fData
        }), function () {
            this.drawChart();
        });
    }

    setupDraw() {
        const margin = { top: 40, right: 110, bottom: 60, left: 65 };

        const title = "Runchart";

        const svg = select('#value-channel-chart')
            .attr('viewbox', '(0, 0, 960, 500)')
            .attr('width', '100%')
            .attr('height', 500);

        const svgBoundaries = svg.node().getBoundingClientRect();
        const width = svgBoundaries.width;
        const height = svgBoundaries.height;

        const xValue = d => d.From;
        const xAxisLabel = "Time";

        const yValue = d => d.Averaged;
        const yAxisLabel = "Value";

        const cValue = d => d.Channel;

        this.setState(() => ({
            selection: svg,
            width,
            height,
            margin,
            title,
            xAxisLabel,
            yAxisLabel,
            xValue,
            yValue,
            cValue,
        }), function () {
            this.drawChart();
        });
    }

    drawChart() {
        const {
            data,
            selection,
            width,
            height,
            margin,
            title,
            xAxisLabel,
            yAxisLabel,
            xValue,
            yValue,
            cValue,
            selectedChannels
        } = this.state;

        const innerWidth = width - margin.right - margin.left;
        const innerHeight = height - margin.top - margin.bottom;

        // horizontal axis
        // channels
        const xScale = scaleTime()
            .domain(extent(data.filter(d => d.visibility === 'visible'), xValue))
            .range([0, innerWidth]);

        // vertical axis
        // values
        const yScale = scaleLinear()
            .domain([min(data, d => yValue(d)), max(data, d => yValue(d))])
            .range([innerHeight, 0])
            .nice();

        const colorScale = scaleOrdinal()
            .domain(range(1, 25))
            .range(schemeCategory10)

        const xAxis = axisBottom(xScale)
            .tickSize(-innerHeight)
            .tickPadding(15)
            .tickFormat(timeFormat("%H:%M"))
            .ticks(timeMinute.every(15));

        const yAxis = axisLeft(yScale)
            .tickSize(-innerWidth)
            .tickPadding(10);

        const g = selection.selectAll('.container').data([null]);
        const gEnter = g.enter().append('g')
            .attr('class', 'container');
        gEnter.merge(g)
            .attr('transform', `translate(${margin.left}, ${margin.top})`);

        const xAxisG = g.select('.x-axis');
        const xAxisGEnter = gEnter
            .append('g')
            .attr('class', 'x-axis');
        xAxisG
            .merge(xAxisGEnter)
            .call(xAxis)
            .attr('transform', `translate(0, ${innerHeight})`)
            .selectAll('domain').remove();

        // const xAxisLabelText = 
        xAxisGEnter.append('text')
            .attr('class', 'axis-label')
            .attr('y', 40)
            .attr('font-size', 20)
            .attr('fill', 'black')
            .attr('text-anchor', 'middle')
            .merge(xAxisG.select('.axis-label'))
            .attr('x', innerWidth / 2)
            .text(xAxisLabel);

        const yAxisG = g.select('.y-axis');
        const yAxisGEnter = gEnter
            .append('g')
            .attr('class', 'y-axis');
        yAxisG.merge(yAxisGEnter)
            .call(yAxis)
            .selectAll('domain').remove();

        // const yAxisLabelText = 
        yAxisGEnter.append('text')
            .attr('class', 'axis-label')
            .attr('y', -35)
            .attr('fill', 'black')
            .attr('transform', 'rotate(-90)')
            .attr('text-anchor', 'middle')
            .attr('font-size', 20)
            .merge(yAxisG.select('.axis-label'))
            .attr('x', -innerHeight / 2)
            .text(yAxisLabel);

        const channelsG = g.select('.channels');
        const channelsGEnter = gEnter
            .append('g')
            .attr('class', 'channels');

        const channelsValues = channelsG.merge(channelsGEnter).selectAll('.channel-value-circle').data(data);
        const channelsValuesEnter = channelsValues.enter().append('circle')
            .attr('class', 'channel-value-circle')
            .attr('stroke', d => 'none')
            .attr('fill', d => colorScale(cValue(d)))
            .attr('r', 5)
            .attr('opacity', 1);

        channelsValuesEnter.merge(channelsValues)
            .attr('cx', d => xScale(xValue(d)))
            .attr('cy', d => yScale(yValue(d)))
            .transition()
            .attr('opacity', d => d.visibility === 'visible' ? 1 : 0);

        const occFormat = format(".2f");
        const fromFormat = timeFormat("%H:%M:%S");

        const channelTitles = channelsValues.merge(channelsValuesEnter).selectAll('.circle-channel-title').data(d => [d]);
        channelTitles.enter().append('title')
            .attr('class', 'circle-channel-title')
            .merge(channelTitles)
            .text(d => `Channel ${cValue(d)}\nOccupancy: ${occFormat(yValue(d))}%\nTimestamp: ${fromFormat(xValue(d))}`);

        channelsValues.exit().remove();

        const lineData = nest()
            .key(d => cValue(d))
            .entries(data);

        const lineGenerator = line()
            .x(d => xScale(xValue(d)))
            .y(d => yScale(yValue(d)));

        const channelsLines = channelsG.merge(channelsGEnter).selectAll('.channel-value-line').data(lineData);
        channelsLines.enter().append('path')
            .attr('class', 'channel-value-line')
            .attr('stroke', d => colorScale(d.key))
            .attr('fill', 'none')
            .attr('opacity', 1)
            .merge(channelsLines)
            .transition()
            .attr('opacity', d => d.values.some(d => d.visibility === 'visible') ? 1 : 0)
            .attr('d', d => lineGenerator(d.values));

        channelsLines.exit().remove();

        const legendsG = g.select('.legends');
        const legendsGEnter = gEnter
            .append('g')
            .attr('class', 'legends')
            .attr('transform', `translate(${innerWidth + 20}, -${margin.top})`);

        const legends = legendsG.merge(legendsGEnter).selectAll('.legend-group').data(range(1, 25));
        const legendsEnter = legends.enter().append('g')
            .attr('transform', d => `translate(0, ${d * 20})`)
            .on('click', this.handleChannelChange);

        // const legendsUpdate = 
        legendsEnter
            .merge(legends)
            .attr('class', d => `legend-group ${selectedChannels.includes(d) ? 'active' : ''}`);

        legendsEnter.append('circle')
            .attr('fill', d => colorScale(d))
            .attr('cy', 0)
            .attr('cx', 0)
            .attr('r', 5);

        legendsEnter.append('text')
            .text(d => `Channel ${d}`)
            .attr('transform', 'translate(10, 5)');

        const titleG = g.select('.title-group');
        const titleGEnter = gEnter
            .append('g')
            .attr('class', 'title-group');
        titleG
            .merge(titleGEnter)
            .attr('transform', `translate(${innerWidth / 2}, -10)`)

        // const titleText = 
        titleGEnter.append('text')
            .attr('class', 'chart-title')
            .attr('y', 0)
            .attr('font-size', 30)
            .attr('fill', 'black')
            .attr('text-anchor', 'middle')
            .merge(titleG.select('.chart-title'))
            .text(title);
    }

    render() {
        const { loading } = this.state;

        let loader;
        if (loading > 0) {
            loader = <div className="loader">
                <Spinner animation="border" />
            </div>;
        }

        return (
            <section>
                {loader}
                <svg id="value-channel-chart"></svg>
            </section>
        );
    }
}
