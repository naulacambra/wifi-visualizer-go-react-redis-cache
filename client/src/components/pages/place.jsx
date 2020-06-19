import React, { Component } from "react";
import { OccupacyBandChart } from "../Charts/OccupacyBandChart";
import { OccupacyChannelChart } from "../Charts/OccupacyChannelChart";
import { ValuesChannelChart } from "../Charts/ValuesChannelChart";
import { ValuesChannelSpectogram } from "../Charts/ValuesChannelSpectogram";
import { Container, Row, Col, Jumbotron, Image, Form } from 'react-bootstrap';
import debounce from 'lodash.debounce';

export class Place extends Component {
  constructor(props) {
    super(props);
    this.state = {
      id: props.match.params.id,
      bandOccupancy: {
        threshold: 150,
        dbthreshold: 150
      },
      channelOccupancy: {
        threshold: 150,
        dbthreshold: 150
      },
      runchart: {
        threshold: 150,
        dbthreshold: 150,
        from: "17:00",
        to: "23:00",
        ratio: 30
      },
      spectogram: {
        threshold: 150,
        dbthreshold: 150,
        from: "17:00",
        to: "23:00",
        ratio: 30
      }
    }

    this.debouncedHandleThresholdChange = debounce(this.debouncedHandleThresholdChange.bind(this), 1000);
    this.handleThresholdChange = this.handleThresholdChange.bind(this);

    this.handleParamChange = this.handleParamChange.bind(this);
  }

  handleThresholdChange(e, chart) {
    e.persist();
    this.setState(state => ({
      [chart]: {
        ...state[chart],
        threshold: e.target.value
      }
    }));
    this.debouncedHandleThresholdChange(e, chart)
  }

  debouncedHandleThresholdChange(e, chart) {
    e.persist();
    this.setState(state => ({
      [chart]: {
        ...state[chart],
        dbthreshold: e.target.value
      }
    }));
  }

  handleParamChange(e, chart, param) {
    e.persist();
    this.setState(state => ({
      [chart]: {
        ...state[chart],
        [param]: e.target.value
      }
    }));
  }

  render() {
    const { id, bandOccupancy, channelOccupancy, runchart, spectogram } = this.state;
    return (
      <div>
        <Jumbotron fluid>
          <Container>
            <Row>
              <Col xs={4}>
                <div className="place-jumbotron-title">
                  <h1>Camp Nou</h1>
                  <h4>Sold-Out Stadium</h4>
                </div>
              </Col>
              <Col xs={8}>
                <Image src={'/images/places/' + id + '.jpg'} rounded />
              </Col>
            </Row>
          </Container>
        </Jumbotron>
        <Container fluid>
          <Row>
            <Col xs={10}>
              <OccupacyBandChart threshold={bandOccupancy.dbthreshold} />
            </Col>
            <Col xs={2}>
              <Col xs={12}>
                <Form>
                  <Form.Group controlId="bandOccupancyThreshold">
                    <Form.Label>Threshold [{bandOccupancy.threshold}]</Form.Label>
                    <Form.Control onChange={(e) => this.handleThresholdChange(e, 'bandOccupancy')} type="range" value={bandOccupancy.threshold} min="50" max="500" step="10" />
                  </Form.Group>
                </Form>
              </Col>
              <Col xs={12} className="text-center">
                {/* http://www.hostmath.com/ */}
                {/* \bar{\sigma}_b=\frac{(\sum_{c\epsilon b}\frac{\sum_{t=1}^T\sigma_{c, t}}{T})}{B} */}
                <Image className="img-fluid" src={'/images/formulas/band_occupacy.png'} rounded />
              </Col>
            </Col>
          </Row>
          <Row>
            <Col xs={10}>
              <OccupacyChannelChart threshold={channelOccupancy.dbthreshold} />
            </Col>
            <Col xs={2}>
              <Col xs={12}>
                <Form>
                  <Form.Group controlId="channelOccupancyThreshold">
                    <Form.Label>Threshold [{channelOccupancy.threshold}]</Form.Label>
                    <Form.Control onChange={(e) => this.handleThresholdChange(e, 'channelOccupancy')} type="range" value={channelOccupancy.threshold} min="50" max="500" step="10" />
                  </Form.Group>
                </Form>
              </Col>
              <Col xs={12} className="text-center">
                {/* \bar{\sigma}_c=\frac{\sum_{t=1}^T\sigma_{c, t}}{T} */}
                <Image className="img-fluid" src={'/images/formulas/channel_occupacy.png'} rounded />
              </Col>
            </Col>
          </Row>
          <Row>
            <Col xs={10}>
              <ValuesChannelChart threshold={runchart.dbthreshold} from={runchart.from} to={runchart.to} ratio={runchart.ratio} />
            </Col>
            <Col xs={2}>
              <Col xs={12}>
                <Form>
                  <Form.Group controlId="runchartThreshold">
                    <Form.Label>Threshold [{runchart.threshold}]</Form.Label>
                    <Form.Control onChange={(e) => this.handleThresholdChange(e, 'runchart')} type="range" value={runchart.threshold} min="50" max="500" step="10" />
                  </Form.Group>
                  <Row>
                    <Col xs={6}>
                      <Form.Group>
                        <Form.Label>From [{runchart.from}]</Form.Label>
                        <Form.Control onChange={(e) => this.handleParamChange(e, 'runchart', 'from')} type="time" value={runchart.from} min="17:20" max="20:00" step="600" />
                      </Form.Group>
                    </Col>
                    <Col xs={6}>
                      <Form.Group>
                        <Form.Label>To [{runchart.to}]</Form.Label>
                        <Form.Control onChange={(e) => this.handleParamChange(e, 'runchart', 'to')} type="time" value={runchart.to} min="17:30" max="20:00" step="600" />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Form.Group controlId="runchartRatio">
                    <Form.Label>Sliding window</Form.Label>
                    <Form.Control onChange={(e) => this.handleParamChange(e, 'runchart', 'ratio')} as="select" value={runchart.ratio}>
                      <option value="30">5 min</option>
                      <option value="60">10 min</option>
                      <option value="90">15 min</option>
                    </Form.Control>
                  </Form.Group>
                </Form>
              </Col>
              <Col xs={12}>
                <p>
                  Each value represents an average of 1000 values for each channel at one moment in time. The values, before being averaged, are being thresholded by the selected value.
                </p>
              </Col>
            </Col>
          </Row>
          <Row>
            <Col xs={10}>
              <ValuesChannelSpectogram threshold={spectogram.dbthreshold} from={spectogram.from} to={spectogram.to} ratio={spectogram.ratio} />
            </Col>
            <Col xs={2}>
              <Col xs={12}>
                <Form>
                  <Form.Group controlId="spectogramThreshold">
                    <Form.Label>Threshold [{spectogram.threshold}]</Form.Label>
                    <Form.Control onChange={(e) => this.handleThresholdChange(e, 'spectogram')} type="range" value={spectogram.threshold} min="50" max="500" step="10" />
                  </Form.Group>
                  <Row>
                    <Col xs={6}>
                      <Form.Group>
                        <Form.Label>From [{spectogram.from}]</Form.Label>
                        <Form.Control onChange={(e) => this.handleParamChange(e, 'spectogram', 'from')} type="time" value={spectogram.from} min="17:30" />
                      </Form.Group>
                    </Col>
                    <Col xs={6}>
                      <Form.Group>
                        <Form.Label>To [{spectogram.to}]</Form.Label>
                        <Form.Control onChange={(e) => this.handleParamChange(e, 'spectogram', 'to')} type="time" value={spectogram.to} />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Form.Group controlId="spectogramRatio">
                    <Form.Label>Sliding window</Form.Label>
                    <Form.Control onChange={(e) => this.handleParamChange(e, 'spectogram', 'ratio')} as="select" value={spectogram.ratio}>
                      <option value="30">5 min</option>
                      <option value="60">10 min</option>
                      <option value="90">15 min</option>
                    </Form.Control>
                  </Form.Group>
                </Form>
              </Col>
              <Col xs={12}>
                <p>
                  Each color represents an average of 1000 values for each channel at one moment in time. The values, before being averaged, are being thresholded by the selected value.
                  The displayed values are filtered by the timespan selected with the above buttons.
                </p>
              </Col>
            </Col>
          </Row>
        </Container>
      </div >
    )
  }
}