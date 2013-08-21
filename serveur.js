var util = require('util');
var express  = require('express');

var config = require('./config');
var gcal = require('google-calendar');
var app = express();

/*
  ===========================================================================
            Setup express + passportjs server for authentication
  ===========================================================================
*/

var app = express();
var passport = require('passport')
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

app.configure(function() {
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.session({ secret: 'keyboard cat' }));
  app.use(passport.initialize());
});
app.listen(8080);

passport.use(new GoogleStrategy({
    clientID: config.consumer_key,
    clientSecret: config.consumer_secret,
    callbackURL: "http://localhost:8080/auth/callback",
    scope: ['openid', 'email', 'https://www.googleapis.com/auth/calendar'] 
  },
  function(accessToken, refreshToken, profile, done) {
    profile.accessToken = accessToken;
    return done(null, profile);
  }
));

app.get('/auth',
  passport.authenticate('google', { session: false }));

app.get('/auth/callback', 
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  function(req, res) { 
    req.session.access_token = req.user.accessToken;
    res.redirect('/');
  });

/*
  ===========================================================================
                               Google Calendar
  ===========================================================================
*/

/*app.all('/', function(req, res){
  
  if(!req.session.access_token) return res.redirect('/auth');
  
  var accessToken = req.session.access_token;
  var google_calendar = new gcal.GoogleCalendar(accessToken);
  
  google_calendar.calendarList.list(function(err, data) {
    if(err) return res.send(500,err);

    console.log(data.items);

    return res.send(data);
  });
});*/

app.get('/list',function(req, res){

if(!req.session.access_token) return res.redirect('/auth');
  
  var accessToken = req.session.access_token;
  var google_calendar = new gcal.GoogleCalendar(accessToken);
  
  google_calendar.calendarList.list(function(err, data) {
    if(err) return res.send(500,err);

    res.render('list.ejs', {list: data});

  });

});