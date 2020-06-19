import React, { Component } from "react";
import { Button } from "react-bootstrap";
import { Link } from "react-router-dom";

export class MapMarker extends Component {
    constructor(props) {
        super(props);
        this.state = {
            open: false
        }

        this.handleInfoButtonClick = this.handleInfoButtonClick.bind(this);
    }

    handleInfoButtonClick() {
        this.setState(state => ({
            open: !state.open
        }));
    }

    render() {
        const { text, city, type, address, link } = this.props;
        const { open } = this.state;

        let info;
        if (open) {
            info = <div className="map-info">
                <span>{type}</span>
                <span>{city}</span>
                <span>{address}</span>
                <Link to={link} className="map-info-lnk btn btn-outline-primary btn-sm" onClick={this.handleInfoButtonClick}>→</Link>
            </div>
        }

        return (
            <div className="map-marker">
                {text}
                <Button className="map-info-btn" onClick={this.handleInfoButtonClick} variant="outline-primary" size="sm">{!open ? '+' : '-'}</Button>
                {info}
            </div>
        );
    }

}