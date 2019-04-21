'use strict';
//push this//
// immediate import and configuration
require('dotenv').config();

// global constants
const PORT = process.env.PORT || 3000 ;
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const app = express();
app.use(cors());

//////yelp stuff///////




const pg = require('pg')

//postgres setup//
const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', error => console.error(error));
/////////////////////////////////paths//////////////////////////////////////////////////////////////////////////////
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
app.get('/yelp', yelper);
app.get('/weather', weatherData);
app.get('/movies', cinematicElements);

app.use('*', (request, response) => {
  response.send('Our server runs.');
})
//////Checker Functions///




// ==============================================
// Helper Functions
// ==============================================
function MovieMaker(rawMovieObj){
  this.title = rawMovieObj.title;
  this.overview = rawMovieObj.overview;
  this.average_votes = rawMovieObj.average_votes;
  this.total_votes = rawMovieObj.total_votes;
  this.image_url = rawMovieObj.image_url;
  this.popularity = rawMovieObj.popularity;
  this.released_on = rawMovieObj.released_on;
  this.created_at = rawMovieObj.created_at;
  this.location_id = rawMovieObj.request.query.data.id;
}
function YelpMaker(rawYelpObj){
  this.name = rawYelpObj.name;
  this.image_url = rawYelpObj.image_url;
  this.price = rawYelpObj.price;
  this.rating = rawYelpObj.rating;
  this.url = rawYelpObj.url;
  this.location_id = rawYelpObj.location_id;
  this.created_at = Date.now();
}
function DailyWeather(rawDayObj){
  this.forecast = rawDayObj.summary;
  this.time = new Date (rawDayObj.time * 1000).toString().slice(0, 15);
  this.created_at = Date.now();

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
////////////////////////////////////////////weather///////////////////////////////////////////
function weatherData(request,response){
  client.query('DELETE FROM weathers WHERE location_id=$1;',[request.query.data.id]);
  const url = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${request.query.data.latitude},${request.query.data.longitude}`
  client.query('SELECT * FROM weathers WHERE location_id=$1;',[request.query.data.id]).then(result =>{
    if(result.rows.length){
      if(Date.now() - result.rows[0].created_at > 15000){
        console.log('data too old')
        superagent.get(url).then(result => {
          response.send(result.body.daily.data.map((dayObj) => {
            new DailyWeather(dayObj)
            const weatherIt = result.body.daily.data;
            client.query('INSERT INTO weathers (forecast, time, created_at,location_id) VALUES ($1, $2, $3, $4);', [weatherIt.summary, weatherIt.time,Date.now(), request.query.data.id])
          }))})}
      else{
        response.send(result.rows)}
    } else{
      superagent.get(url).then(result => {
        response.send(result.body.daily.data.map((dayObj) => {
          new DailyWeather(dayObj)
          const weatherIt = result.body.daily.data;
          client.query('INSERT INTO weathers (forecast, time, created_at,location_id) VALUES ($1, $2, $3, $4);', [weatherIt.summary, weatherIt.time,Date.now(), request.query.data.id])
        }))})}})}

////////////////////////////////////////////yelp///////////////////////////////////////////

function yelper(request,response){
  const url = `https://api.yelp.com/v3/businesses/search?latitude=${request.query.data.latitude}&longitude=${request.query.data.longitude}`;

  client.query('SELECT * FROM yelp WHERE location_id=$1;',[request.query.data.id]).then(result =>{
    if(result.rows.length){
      response.send(result.rows)
    }else{
      superagent.get(url).then(result =>{
        response.send(JSON.parse(result.text).businesses.map((yelpObj)=>{
          new YelpMaker(yelpObj);
          const yelpIt = result.body.results;
          client.query('INSERT INTO yelp (name, image_url, price, rating, url, location_id) VALUES ($1,$2,$3,$4,$5)',[yelpIt.name, yelpIt.image_url,yelpIt.price,yelpIt.rating,yelpIt.url,request.query.data.id]);
        })).catch(console.error)
      }).catch(console.error)
    }
  }).catch(console.error)
}

//////////////////////////movies/////////////////////////////////////////////////

function cinematicElements(request,response){
  const url = `https://api.themoviedb.org/3/search/movie?api_key=${process.env.MOVIE_API_KEY}&query=${request.query.data.id}`;
  client.query('SELECT * FROM movies WHERE location_id=$1;',[request.query.data.id]).then(result =>{
    if(result.rows.length){
      response.send(result.rows)
    }else{
      superagent.get(url).then(result =>{
        response.send(result.body.data.map((movieObj)=>{
          new MovieMaker(movieObj);
          const movieIt =result.body.results;
          client.query('INSERT INTO movies (title, overview, average_votes, total_votes, image_url, popularity, released_on, created_at, location_id)',[movieIt.title, movieIt.overview, movieIt.average_votes,movieIt.total_votes, movieIt.image_url, movieIt.popularity, movieIt.released_on, movieIt.created_at, request.query.data.id])


        })).catch(console.error)



      }).catch(console.error)


    }




  }).catch(console.error)
}
