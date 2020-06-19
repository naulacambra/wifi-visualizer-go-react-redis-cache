# WI-FI 5GHz DATA VISUALIZER

## Abstract
This project presents a visualization tool to see displayed a dataset of measured energy of all 24 basic channels of Wi-Fi. 

## Goals
The goals of this project are to: 
- (i) create an architecture capable of manage a huge volume of data within a reasonable time, 
- (ii) processing and displaying it, and 
- (iii) to create a visualization tool with enough degrees of freedom that the user feels that he is able to visualize the data as he wants to.

## Solution stack
* Back end
    - **Go lang**: Go is an open source programming language created by Google, statically type and compiled. It has been used as a server program language. [Go Lang](https://golang.org/)
        - **Gin-Gonic**: Gin is a web framework written in Go (Golang). It features a API with high performance. [Ingo](https://github.com/gin-gonic/gin)
    - **Redis Cache**: Redis is an in-memory data structure store, used as cache, database or message broker. In this project, Redis has beens used as a cache, between the server and the database. [Info](https://redis.io/)
    - **Mongo**: MongoDB is a cross-platform document-oriented NoSQL database program. In this project has been the preferred database technology. [Info](https://www.mongodb.com/)
* Front end
    - **React**: ReactJS is a JavaScript framework component-based to build user interfaces. [Info](https://www.mongodb.com/)
    - **D3**: D3.js is a JavaScript library for manipulating documents based on data. D3 helps you bring data to life using HTML, SVG, and CSS. [Info](https://d3js.org/)

## Run
To execut this project, Go must be installed

[Install Go](https://golang.org/doc/install)

To run the server...
``` cli
> cd path-to-project/
> go run ./main.go
```

To run the client, first you must install the NPM dependencies
```cli
> cd path-to-project/client/
> npm i
```

After that, to run the client...
``` cli
> cd path-to-project/client/
> npm start
```

## Project Link
[TFG Arnau Lacambra](tfg.naulacambra.com)