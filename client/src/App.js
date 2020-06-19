import React from "react";
import "typeface-roboto";
import { Home } from './components/pages/home';
import { Places } from './components/pages/places';
import { Place } from './components/pages/place';
import { Navbar, Nav, Form, FormControl, Button } from 'react-bootstrap';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";

import 'bootstrap/dist/css/bootstrap.min.css';
import './app.css'

function App() {
  return (
    <Router>
      <Navbar bg="light" expand="lg">
        <Navbar.Brand href="/">WIFI Visualizer</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="mr-auto">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/places" className="nav-link">Locations</Link>
            <Link to="/about" className="nav-link">About</Link>
          </Nav>
          <Form inline>
            <FormControl type="text" placeholder="Search" className="mr-sm-2" />
            <Button variant="outline-success">Search</Button>
          </Form>
        </Navbar.Collapse>
      </Navbar>
      <Switch>
        <Route path="/places/:id" component={Place} />
        <Route path="/places">
          <Places />
        </Route>
        <Route path="/">
          <Home />
        </Route>
      </Switch>
    </Router>
  );
}

export default App;
