'use strict';
//push this//
// immediate import and configuration
require('dotenv').config();

// global constants
const PORT = process.env.PORT || 3000 ;
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
// server definition
const app = express();
app.use(cors());
//const pq = require('pg')//install npm

//postgres client setup//*
//const client = new pg.Client( process.env.DATABASE_URL);
//client.connect();
//client.on('error', error => console.error(error));
// what the server does
//the route
//request = data from query. example, from a front end query
//can test in localhost:3000/location to verify
app.get('/location', (request, response) => {
  const search_query = request.query.data
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=1600+Amphitheatre+Parkway,+Mountain+View,+CA&key=${process.env.GEOCODE_API_KEY}`
  const data = superagent.get(url).then(result => {
    const resultBody = result.body;
    const formatted_query = resultBody.results[0].formatted_address;
    const latitude = resultBody.results[0].geometry.location.lat;
    const longitude = resultBody.results[0].geometry.location.lng;
    const responseObject = { search_query, formatted_query, latitude, longitude};
    response.send(responseObject);
  })
.catch(console.log)
})

app.get('/weather', (request, response) =>{
  const frontEndQuery = request.query.data;
  const weatherJSON = require('./data/darksky.json');
  const dailyWeather = weatherJSON.daily;
  const dailyWeatherData = dailyWeather.data;
  let theDaily = dailyWeatherData.map(dayObj => {
    return new DailyWeather(dayObj); 
  })
  response.send(theDaily);
})

app.use('*', (request, response) => {
  response.send('Our server runs.');
})

// ==============================================
// Helper Functions
// ==============================================

function DailyWeather(rawDayObj){
  this.forecast = rawDayObj.summary;
  this.time = new Date (rawDayObj.time * 1000).toString().slice(0, 15);
}

//server start
app.listen(PORT, ()=> {
  console.log(`app is up on PORT ${PORT}`)
})
