'use strict';


require('dotenv').config();



//global constants
const PORT = process.env.PORT || 3000 ;
const express = require('express');
const cors = require('cors');


//server definition
const app = express();
app.use(cors());

//server is doing this

app.get('/location', (request, response) => {
  response.send(searchData(request.query.data) );
})

app.use('*', (request, response) => {
  response.send('my name is pratiibh');
})

//functions

function ExplorerData(search_query, formatted_query, latitude, longitude){
  this.search_query = search_query;
  this.formatted_query = formatted_query;
  this.latitude = latitude;
  this.longitude = longitude;
}

function searchData(frontEndQuery) {
  const search_query = frontEndQuery;

  const grabData = require('./data/geo.json');
  const formatted_query = grabData.results[0].formatted_address;
  const latitude = grabData.results[0].geometry.location.lat;
  const longitude = grabData.results[0].geometry.location.lng;

  const responseDataObject = new ExplorerData(search_query, formatted_query, latitude, longitude);

  return responseDataObject;
}


// {
//     "search_query": "seattle",
//     "formatted_query": "Seattle, WA, USA",
//     "latitude": "47.606210",
//     "longitude": "-122.332071"
//   }



// server start
app.listen(PORT, () => {
  console.log(`app is up on PORT ${PORT}`)
})
