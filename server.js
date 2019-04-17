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

app.get('/location', searchLocationData);

app.get('/weather', searchWeatherData);


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
    const firstSearch = result.body.results[0];

    const formatted_query = firstSearch.formatted_address;
    const geometry = firstSearch.geometry;
    const location = geometry.location;
    const latitude = location.lat;
    const longitude = location.lng;

    responseDataObject = new LocationData(search_query, formatted_query, latitude, longitude);
    response.send(responseDataObject);
  })
}

// This function will grab data from the darksky.json file //

function searchWeatherData(request, response) {
  
  superagent.get(`https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${request.query.data.latitude},${request.query.data.longitude}`).then(result => {
    console.log('result body latitude = ' + result.body.latitude)
    console.log('result body longitude = ' + result.body.longitude)
    console.log('request query latitude = ' + request.query.data.latitude)
    console.log('request query longitude = ' + request.query.data.longitude)
    if(result.body.latitude === request.query.data.latitude && result.body.longitude === request.query.data.longitude){
      let dailyData = result.body.daily.data;
    
  
      const test = dailyData.map(data => {
        let eachTime = new WeatherData(data.summary, (new Date(data.time * 1000).toString().slice(0, 15)));
        return eachTime;
      });
      return(test);
  
    }
  })

  const grabWeatherData = require('./data/darksky.json');

  // This will only trigger if the latitude and longitude that are grabbed from data are equal to the latitude and longitude of Lynnwood because that is all our front-end application will show right now
  console.log(request.query.data.latitude);
  
}

// server start
app.listen(PORT, () => {
  console.log(`app is up on PORT ${PORT}`)
})