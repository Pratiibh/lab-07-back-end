'use strict';


require('dotenv').config();



//global constants
const PORT = process.env.PORT || 3000 ;
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');

let responseDataObject = {};


//server definition
const app = express();
app.use(cors());

//server is doing this

app.get('/location', searchLocationData)

// superagent.get(`https://maps.googleapis.com/maps/api/geocode/json?address=$%7BfrontEndQuery%7D&key=$%7Bprocess.env.GEOCODE_API_KEY%7D%60`)

// Feature 3 of Lab06 implemented
// if(request.query.data !== 'lynnwood'){
//   response.status(500).send('The location you have given does not exist!')
// }

// response.send(searchLocationData(request.query.data) );

// })

app.get('/weather', (request, response) => {
  response.send(searchWeatherData() );
})


// Constructor Functions
function LocationData(search_query, formatted_query, latitude, longitude){
  this.search_query = search_query;
  this.formatted_query = formatted_query;
  this.latitude = latitude;
  this.longitude = longitude;
}

function WeatherData(summary, time){
  this.forecast = summary;
  this.time = time;
}

//functions

function searchLocationData(request, response) {
  const search_query = request.query.data;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${search_query}&key=${process.env.GEOCODE_API_KEY}`;


  superagent.get(url).then(result => {
    console.log(result.body.results[0]);
    const firstSearch = result.body.results[0];

    const formatted_query = firstSearch.formatted_address;
    const geometry = firstSearch.geometry;
    const location = geometry.location;
    const latitude = location.lat;
    const longitude = location.lng;

    // const grabLocationData = require('./data/geo.json');
    // const formatted_query = grabLocationData.results[0].formatted_address;
    // const latitude = grabLocationData.results[0].geometry.location.lat;
    // const longitude = grabLocationData.results[0].geometry.location.lng;

    responseDataObject = new LocationData(search_query, formatted_query, latitude, longitude);
    response.send(responseDataObject);
  })
}

// This function will grab data from the darksky.json file

function searchWeatherData() {
  const grabWeatherData = require('./data/darksky.json');
  console.log('From Weather Data: ' + grabWeatherData.longitude);
  console.log('From object: ' + responseDataObject.longitude);

  // This will only trigger if the latitude and longitude that are grabbed from data are equal to the latitude and longitude of Lynnwood because that is all our front-end application will show right now
  if(grabWeatherData.latitude === responseDataObject.latitude && grabWeatherData.longitude === responseDataObject.longitude){
    let dailyData = grabWeatherData.daily.data;

    const test = dailyData.map(data => {
      let eachTime = new WeatherData(data.summary, (new Date(data.time * 1000).toString().slice(0, 15)));
      return eachTime;
    });
    return test;

  }
}



// server start
app.listen(PORT, () => {
  console.log(`app is up on PORT ${PORT}`)
})