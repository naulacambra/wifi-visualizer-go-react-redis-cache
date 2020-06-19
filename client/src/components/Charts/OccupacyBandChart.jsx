import React, { Component } from "react";
import WifiService from "../Services/WifiService";
import {
    select,
    scaleLinear,
    scaleBand,
    scaleOrdinal,
    axisBottom,
    axisLeft,
    range,
    schemeTableau10,
    format
} from "d3";
import { Spinner } from 'react-bootstrap';

export class OccupacyBandChart extends Component {
    constructor(props) {
        super(props);
        this.state = {
            data: [],
            loading: 0,
            bandNames: {
                1: "U-NII-1",
                2: "U-NII-2",
                3: "U-NII-2-C1",
                4: "U-NII-2-C2",
                5: "U-NII-2-C3",
                6: "U-NII-3",
            }
        };
    }

    /*
        U-NII-1: 1 (#36) a 4 (#48)
        U-NII-2: 5 (#52) a 8 (#64)
        U-NII-2-C1: 9 (#100) a 12 (#112)
        U-NII-2-C2: 13 (#116) a 16 (#128)
        U-NII-2-C3: 17 (#132) a 20 (#144)
        U-NII-3: 21 (#149) a 24 (#161)
     */

    componentDidMount() {
        this.loadData();
        this.setupDraw();
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
        const { threshold} = this.props;
        const bandRange = range(1, 7);

        this.setState(() => ({
            loading: bandRange.length
        }));

        bandRange
            .map(b => WifiService.getBandOccupacy(b, threshold))
            .forEach(p => p.then(response => {
                let { data } = this.state;
                let bandIdx = data.findIndex(d => d.band === response.band);
                if (bandIdx !== -1) {
                    data.splice(bandIdx, 1);
                }
                data.push({
                    band: response.band,
                    value: response.data
                });

                this.setState(state => ({
                    data: data,
                    loading: state.loading - 1
                }), function () {
                    this.drawChart();
                });
            }).catch(() => {
                this.setState(state => ({
                    loading: state.loading - 1
                }));
            }))
    }

    setupDraw() {
        const margin = { top: 40, right: 20, bottom: 60, left: 65 };

        const title = "Band occupancy %";

        const svg = select('#occupacy-band-chart')
            .attr('viewbox', '(0, 0, 960, 500)')
            .attr('width', '100%')
            .attr('height', 500);

        const svgBoundaries = svg.node().getBoundingClientRect();
        const width = svgBoundaries.width;
        const height = svgBoundaries.height;

        const xValue = d => d.band;
        const xAxisLabel = "Band";

        const yValue = d => d.value;
        const yAxisLabel = "[&sigma;] Occupancy";

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
            yValue,
            bandNames
        } = this.state;

        const innerWidth = width - margin.right - margin.left;
        const innerHeight = height - margin.top - margin.bottom;

        // horizontal axis
        // band
        const xScale = scaleBand()
            .domain(range(1, 7))
            .range([0, innerWidth])
            .padding(0.1);

        // vertical axis
        // values
        const yScale = scaleLinear()
            .domain([1, 0])
            .range([0, innerHeight])
            .nice();

        const colorScale = scaleOrdinal()
            .domain(range(1, 7))
            .range(schemeTableau10)

        const xAxis = axisBottom(xScale)
            .tickSize(-innerHeight)
            .tickFormat(d => bandNames[d])
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
            .html(yAxisLabel);

        const occFormat = format(".2f");

        const bands = g.merge(gEnter).selectAll('.rect-band').data(data, d => xValue(d));
        const bandsEnter = bands.enter().append('rect')
            .attr('class', 'rect-band')
            .attr('band', d => xValue(d))
            .attr('stroke', d => colorScale(xValue(d)))
            .attr('fill', d => colorScale(xValue(d)))
            .attr('stroke-width', 2)
            .attr('stroke-linecap', 'round')
            .attr('width', d => xScale.bandwidth())
            .attr('y', d => innerHeight)
            .attr('height', 0);

        bandsEnter.merge(bands)
            .transition()
            .attr('x', d => xScale(xValue(d)))
            .attr('y', d => yScale(yValue(d)))
            .attr('height', d => innerHeight - yScale(yValue(d)));

        const bandTitles = bands.merge(bandsEnter).selectAll('.rect-band-title').data(d => [d]);
        bandTitles.enter().append('title')
            .attr('class', 'rect-band-title')
            .merge(bandTitles)
            .text(d => `${bandNames[xValue(d)]}\nOccupancy: ${occFormat(yValue(d))}%\nChannels: [${((xValue(d) - 1) * 4) + 1}, ${((xValue(d) - 1) * 4) + 2}, ${((xValue(d) - 1) * 4) + 3}, ${((xValue(d) - 1) * 4) + 4}]`);

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
            .html(title);
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
                <svg id="occupacy-band-chart"></svg>
            </section>
        );
    }
}
