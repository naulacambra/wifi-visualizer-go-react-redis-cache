import React from "react";
import { Container, Jumbotron, Col, Carousel, Row, Card, Button, Image } from 'react-bootstrap';
import { Link } from 'react-router-dom';

export function Home() {
  return (
    <div>
      <Jumbotron fluid>
        <Container>
          <Row>
            <Col xs={4}>
              <h1>WIFI 5G data viewer</h1>
              <p>
                Online tool to visualize 5G data
              </p>
            </Col>
            <Col xs={8}>
              <Carousel>
                <Carousel.Item>
                  <img
                    className="d-block w-100"
                    src={'images/charts/band_occupacy.png'}
                    alt="Band occupancy"
                  />
                  <Carousel.Caption>
                    <h3>Band occupancy</h3>
                    <p>See the occupancy of each band across all time</p>
                  </Carousel.Caption>
                </Carousel.Item>
                <Carousel.Item>
                  <img
                    className="d-block w-100"
                    src={'images/charts/channel_occupacy.png'}
                    alt="Channel occupancy"
                  />
                  <Carousel.Caption>
                    <h3>Channel occupancy</h3>
                    <p>See the occupancy of each channel across all time</p>
                  </Carousel.Caption>
                </Carousel.Item>
                <Carousel.Item>
                  <img
                    className="d-block w-100"
                    src={'images/charts/runchart.png'}
                    alt="Runchart"
                  />
                  <Carousel.Caption>
                    <h3>Runchart</h3>
                    <p>See the occupancy's evolution of each channel through all time</p>
                  </Carousel.Caption>
                </Carousel.Item>
                <Carousel.Item>
                  <img
                    className="d-block w-100"
                    src={'images/charts/spectogram.png'}
                    alt="Spectrogram"
                  />
                  <Carousel.Caption>
                    <h3>Spectrogram</h3>
                    <p>See the occupancy's evolution of each channel through all time</p>
                  </Carousel.Caption>
                </Carousel.Item>
              </Carousel>
            </Col>
          </Row>
        </Container>
      </Jumbotron>
      <Container className="home-container">
        <Row>
          <Col>
            <Card>
              <Card.Header as="h5">Different locations around the world</Card.Header>
              <Card.Body>
                <Card.Title>Different datasets have been gathered from Catalonia, US...</Card.Title>
                <Link to="/places" className="btn btn-primary">Check locations</Link>
              </Card.Body>
            </Card>
          </Col>
          <Col>
            <Carousel controls={false} indicators={false}>
              <Carousel.Item>
                <img
                  className="d-block w-100"
                  src={'images/places/fcb.jpg'}
                  alt="Camp nou"
                />
              </Carousel.Item>
              <Carousel.Item>
                <img
                  className="d-block w-100"
                  src={'images/places/rice.jpg'}
                  alt="Rice University"
                />
              </Carousel.Item>
            </Carousel>
          </Col>
        </Row>
        <Row>
          <Col>
            <Image src={'images/charts/runchart.png'} rounded className="img-fluid" />
            <Image src={'images/charts/spectogram.png'} rounded className="img-fluid" />
          </Col>
          <Col>
            <Card>
              <Card.Header as="h5">Several charts to observe the data</Card.Header>
              <Card.Body>
                <Card.Title>Bar charts, runcharts, spectrogram... All of them interactive charts to display the data as you want</Card.Title>
                <Link to="/places/fcb" className="btn btn-primary">Check charts</Link>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        <Row>
          <Col>
            <Card>
              <Card.Header as="h5">Wi-Fi Channel Bonding: an All-Channel System and Experimental Study from Urban Hotspots to a Sold-Out Stadium</Card.Header>
              <Card.Body>
                <Card.Title>All data have been measured and processed by Sergio Barrachina, author of this paper</Card.Title>
                <Button variant="primary">Check paper</Button>
              </Card.Body>
            </Card>
          </Col>
          <Col>
            <Image src={'images/paper.png'} rounded className="img-fluid" />
          </Col>
        </Row>
      </Container>
    </div>
  )
}