import React, { Component } from "react";

import { markerStyle } from "./markerStyles.js";

export default class Marker extends Component {
  //   static propTypes = {
  //     text: PropTypes.string
  //   };

  //   static defaultProps = {};

  render() {
    return <div style={markerStyle}>{this.props.text}</div>;
  }
}
