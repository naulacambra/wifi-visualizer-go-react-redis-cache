import React, { Component } from "react";
import WifiService from "../Services/WifiService";
import {
    select,
    scaleLinear,
    scaleBand,
    axisBottom,
    axisLeft,
    range,
    interpolateSinebow,
    format
} from "d3";
import { Spinner } from 'react-bootstrap';

export class OccupacyChannelChart extends Component {
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
        const { threshold } = this.props;
        if (threshold !== prevProps.threshold) {
            this.loadData();
        }
    }

    componentWillUnmount() {
        WifiService.abort();
    }

    loadData() {
        // /band/:band/threshold/:threshold
        const { threshold } = this.props;

        this.setState(() => ({
            loading: 1
        }));

        WifiService.getChannelsOccupacy(threshold)
            .then(response => {
                this.setState(state => ({
                    data: response.data,
                    loading: state.loading - 1
                }), function () {
                    this.drawChart();
                });
            }).catch(() => {
                this.setState(state => ({
                    loading: state.loading - 1
                }));
            });
    }

    setupDraw() {
        const margin = { top: 40, right: 20, bottom: 60, left: 65 };

        const title = "Channel occupancy %";

        const svg = select('#occupacy-channel-chart')
            .attr('viewbox', '(0, 0, 960, 500)')
            .attr('width', '100%')
            .attr('height', 500);

        const svgBoundaries = svg.node().getBoundingClientRect();
        const width = svgBoundaries.width;
        const height = svgBoundaries.height;

        const xValue = d => d.Channel;
        const xAxisLabel = "Channel";

        const yValue = d => d.Occupacy;
        const yAxisLabel = "Occupancy";

        this.setState(() => ({
            selection: svg,
            width,
            height,
            margin,
            title,
            xAxisLabel,
            yAxisLabel,
            xValue,
            yValue
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
            yValue
        } = this.state;

        const innerWidth = width - margin.right - margin.left;
        const innerHeight = height - margin.top - margin.bottom;

        // horizontal axis
        // channels
        const xScale = scaleBand()
            .domain(range(1, 25))
            .range([0, innerWidth])
            .padding(0.1);

        // vertical axis
        // values
        const yScale = scaleLinear()
            .domain([1, 0])
            .range([0, innerHeight])
            .nice();

        const colorScale = scaleLinear()
            .domain([1, 24])
            .range([0, 1])

        const xAxis = axisBottom(xScale)
            .tickSize(-innerHeight)
            .tickPadding(15);

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

        const occFormat = format(".2f");

        const channels = g.merge(gEnter).selectAll('.rect-channel').data(data, d => xValue(d));
        const channelsEnter = channels.enter().append('rect')
            .attr('class', 'rect-channel')
            .attr('channel', d => xValue(d))
            .attr('stroke', d => interpolateSinebow(colorScale(xValue(d))))
            .attr('fill', d => interpolateSinebow(colorScale(xValue(d))))
            .attr('stroke-width', 2)
            .attr('stroke-linecap', 'round')
            .attr('width', d => xScale.bandwidth())
            .attr('y', d => innerHeight)
            .attr('height', 0);

        channelsEnter.merge(channels)
            .transition()
            .attr('x', d => xScale(xValue(d)))
            .attr('y', d => yScale(yValue(d)))
            .attr('height', d => innerHeight - yScale(yValue(d)));

        const channelTitles = channels.merge(channelsEnter).selectAll('.rect-channel-title').data(d => [d]);
        channelTitles.enter().append('title')
            .attr('class', 'rect-channel-title')
            .merge(channelTitles)
            .text(d => `Channel ${xValue(d)}\nOccupancy: ${occFormat(yValue(d))}%`);

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
                <svg id="occupacy-channel-chart"></svg>
            </section>
        );
    }
}
