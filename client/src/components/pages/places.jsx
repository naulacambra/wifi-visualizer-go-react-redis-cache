import React, { Component } from "react";
import { Container, Row, Col } from 'react-bootstrap';
import GoogleMapReact from "google-map-react";
import mapOptions from "../../assets/maps_options.json";
import { MapMarker } from "../MapMarker";

export class Places extends Component {
  constructor(props) {
    super(props);
    this.state = {
      center: {
        lat: 41.38,
        lng: 2.12
      },
      zoom: 13,
      locations: [
        // Rice Village Apartments Apartment Houston 2410 Shakespeare St
        {
          text: "Rice Village Apartments",
          type: "Apartment",
          city: "Houston",
          address: "2410 Shakespeare St",
          lat: 29.714229583740234,
          lng: -95.4140396118164,
          link: "/places/coming-soon"
        },
        // Rice Networks laboratory Campus Houston 6100 Main St, Houston, Duncan Hall
        {
          text: "Rice Networks laboratory",
          type: "Apartment",
          city: "Houston",
          address: "6100 Main St, Houston, Duncan Hall",
          lat: 29.720129013061523,
          lng: -95.39883422851562,
          link: "/places/coming-soon"
        },
        // Technology for All Community center Houston 2220 Broadway St # B
        {
          text: "Technology for All",
          type: "Community center",
          city: "Houston",
          address: "2220 Broadway St # B",
          lat: 29.70783233642578,
          lng: -95.27803039550781,
          link: "/places/coming-soon"
        },
        // Flo Paris at Rice Village Café Houston 5407 Morningside Dr
        {
          text: "Flo Paris at Rice Village",
          type: "Café",
          city: "Houston",
          address: "5407 Morningside Dr",
          lat: 29.717344284057617,
          lng: -95.4149398803711,
          link: "/places/coming-soon"
        },
        // Rice Village parking lot Shopping mall Houston 2507 Amherst Spc #Dok
        {
          text: "Rice Village parking lot",
          type: "Shopping mall",
          city: "Houston",
          address: "2507 Amherst Spc #Dok",
          lat: 29.715858459472656,
          lng: -95.41654968261719,
          link: "/places/coming-soon"
        },
        // Apartament in Sagrera Apartment Barcelona c/Felip II 90
        {
          text: "Apartament in Sagrera",
          type: "Apartment",
          city: "Barcelona",
          address: "c/Felip II 90",
          lat: 41.41958999633789,
          lng: 2.187973737716675,
          link: "/places/coming-soon"
        },
        // Wireless Networking laboratory Campus Barcelona c/Roc Boronat 118
        {
          text: "Wireless Networking laboratory",
          type: "Campus",
          city: "Barcelona",
          address: "c/Roc Boronat 118",
          lat: 41.40289306640625,
          lng: 2.1943678855895996,
          link: "/places/coming-soon"
        },
        // 22@ area Office area Barcelona c/Llacuna 124
        {
          text: "22@ area",
          type: "Office area",
          city: "Barcelona",
          address: "c/Llacuna 124",
          lat: 41.40372848510742,
          lng: 2.1954846382141113,
          link: "/places/coming-soon"
        },
        // Hotel Gallery Hotel Barcelona c/Roselló 249
        {
          text: "Hotel Gallery",
          type: "Hotel",
          city: "Barcelona",
          address: "c/Roselló 249",
          lat: 41.395023345947266,
          lng: 2.1596014499664307,
          link: "/places/coming-soon"
        },
        // Sagrada Familia Tourist zone Barcelona Av. Gaudí 19
        {
          text: "Sagrada Familia",
          type: "Tourist zone",
          city: "Barcelona",
          address: "Av. Gaudí 19",
          lat: 41.4078254699707,
          lng: 2.1743903160095215,
          link: "/places/coming-soon"
        },
        // Camp Nou Stadium Barcelona c/d'Arístides Maillol 12
        {
          text: "Camp Nou",
          type: "Stadium",
          city: "Barcelona",
          address: "c/d'Arístides Maillol 12",
          lat: 41.37916564941406,
          lng: 2.1199049949645996,
          link: "/places/fcb"
        },
      ]
    };
  }

  render() {
    const { locations } = this.state;

    let markers = locations.map((l, i) => <MapMarker key={i} {...l} />);

    return (
      <Container fluid>
        <Row>
          <Col xs={6}>
            <Row className="map-container">
              <GoogleMapReact
                options={mapOptions}
                bootstrapURLKeys={{ key: process.env.REACT_APP_GOOGLE_MAPS_API_KEY }}
                defaultCenter={{ lat: 29.718638196063072, lng: -95.40853309631348 }}
                defaultZoom={15}
              >
                {markers}
              </GoogleMapReact>
            </Row>
          </Col>
          <Col xs={6}>
            <Row className="map-container">
              <GoogleMapReact
                options={mapOptions}
                bootstrapURLKeys={{ key: "AIzaSyAT0-rCleVv535HxMw6G75w3UzGtj27nNg" }}
                defaultCenter={{ lat: 41.395023345947266, lng: 2.1596014499664307 }}
                defaultZoom={13}
              >
                {markers}
              </GoogleMapReact>
            </Row>
          </Col>
        </Row>
      </Container >
    )
  }
}