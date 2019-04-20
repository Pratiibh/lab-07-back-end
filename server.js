'use strict';
//push this//
// immediate import and configuration
require('dotenv').config();

// global constants
const PORT = process.env.PORT || 3000 ;
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');//tallks to internet
const app = express();
app.use(cors());

const pg = require('pg')//talks to psql

//postgres setup//
const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', error => console.error(error));

app.get('/location', (request, response) => {
  const search_query = request.query.data;
  client.query('SELECT * FROM locations WHERE search_query=$1',[search_query])
    .then(result =>{
      if(result.rows.length){
        response.send(result.rows[0])
      }else{
        getGoogle(search_query,response);
      }
    })
})
app.get('/weather', weatherData)

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
function getGoogle(search_query,response){
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${search_query}&key=${process.env.GEOCODE_API_KEY}`;
  superagent.get(url).then(result => {
    const resultBody = result.body;

    const formatted_query = resultBody.results[0].formatted_address;
    const latitude = resultBody.results[0].geometry.location.lat;
    const longitude = resultBody.results[0].geometry.location.lng;
    const responseObject = { search_query, formatted_query, latitude, longitude};
    client.query(`INSERT INTO locations (search_query, formatted_query, latitude, longitude) VALUES($1, $2, $3, $4)`, [search_query,formatted_query, latitude , longitude]);
    response.send(responseObject);
  })}

//server start
app.listen(PORT, ()=> {
  console.log(`app is up on PORT ${PORT}`);
});

function weatherData(request,response){
  const url = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${request.query.data.latitude},${request.query.data.longitude}`
  
  superagent.get(url).then(result => {
    const weatherIt = result.body.daily.data[0]
    console.log(weatherIt.time, weatherIt.summary)
    // map over the results and make new weather objects
    response.send(result.body.daily.data.map(dayObj => new DailyWeather(dayObj)));
    client.query(`INSERT INTO weathers (forecast, time, location_id) VALUES ($1,$2,$3)`, [weatherIt.summary, weatherIt.time,1])
  })}




























/*app.get('/weather', (request, response) =>{
  const weather_query = request.query.data.formatted_query;
  console.log(weather_query, '8=======================================================)');
  
      console.log(result.rows[0])
      if(result.rows.length){
        response.send(result.rows[0])
      }else{
        console.log('catch')
      }
      //neoDailyWeather(weather_query,response);
    }).catch((error)=>{console.log('inside weather catch block')})
})*/
