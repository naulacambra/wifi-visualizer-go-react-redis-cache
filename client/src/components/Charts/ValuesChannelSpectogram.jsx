import React, { Component } from "react";
import WifiService from "../Services/WifiService";
import {
    select,
    axisBottom,
    axisLeft,
    range,
    extent,
    scaleTime,
    scaleBand,
    interpolatePlasma,
    timeFormat,
    timeMinute
} from "d3";
import { Spinner } from "react-bootstrap";

function dateBetween(date, sh, sm, fh, fm) {
    let s = parseInt(sh) * 60 + parseInt(sm);
    let f = parseInt(fh) * 60 + parseInt(fm);
    let t = date.getHours() * 60 + date.getMinutes();
    return t >= s && t <= f;
}

function setDate(date, d, h, m) {
    date = new Date(date);
    date.setHours(date.getHours() + h);
    return date;
}

export class ValuesChannelSpectogram extends Component {
    constructor(props) {
        super(props);
        this.state = {
            data: [],
            loading: 0,
        };
    }

    componentDidMount() {
        this.setupDraw();
        this.loadData();
    }

    componentDidUpdate(prevProps) {
        const { threshold, ratio, from, to } = this.props;
        if (threshold !== prevProps.threshold || ratio !== prevProps.ratio) {
            this.loadData();
        } else if (from !== prevProps.from || to !== prevProps.to) {
            this.filterData();
        }
    }

    componentWillUnmount() {
        WifiService.abort();
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
                    From: setDate(d.From, 0, -2, 0),
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
        const { data } = this.state;
        const { from, to } = this.props;
        let fData = [];

        fData = data.map(d => ({
            ...d,
            visibility: dateBetween(d.From, ...from.split(":"), ...to.split(":")) ? 'visible' : 'hidden'
        }));

        this.setState(() => ({
            data: fData
        }), function () {
            this.drawChart();
        });
    }

    setupDraw() {
        const margin = { top: 40, right: 20, bottom: 60, left: 65 };

        const title = "Channel occupancy spectrogram";

        const svg = select('#value-channel-spectrogram')
            .attr('viewbox', '(0, 0, 960, 500)')
            .attr('width', '100%')
            .attr('height', 500);

        const svgBoundaries = svg.node().getBoundingClientRect();
        const width = svgBoundaries.width;
        const height = svgBoundaries.height;

        const xValue = d => d.From;
        const xAxisLabel = "Time";

        const yValue = d => d.Channel;
        const yAxisLabel = "Channel";

        const cValue = d => d.Averaged;

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
            cValue
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
            cValue
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
        const yScale = scaleBand()
            .domain(range(1, 25))
            .range([0, innerHeight]);

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

        const w = Math.ceil(innerWidth / (data.filter(d => d.visibility === 'visible').length / 24));

        const channelsG = g.select('.channels');
        const channelsGEnter = gEnter
            .append('g')
            .attr('class', 'channels')

        const channels = channelsG.merge(channelsGEnter).selectAll('.channel-value').data(data, d => d.Channel + d.From);
        channels.enter().append('rect')
            .attr('class', 'channel-value')
            .attr('value', d => cValue(d))
            .attr('stroke', d => 'none')
            .attr('fill', d => interpolatePlasma(cValue(d)))
            .attr('height', 0)
            .attr('y', 0)
            .attr('x', 0)
            .merge(channels)
            .transition()
            .attr('visibility', d => d.visibility)
            .attr('width', w)
            .attr('height', d => yScale.bandwidth())
            .attr('x', d => xScale(xValue(d)))
            .attr('y', d => yScale(yValue(d)));

        channels.exit().remove();

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
                <svg id="value-channel-spectrogram"></svg>
            </section>
        );
    }
}
