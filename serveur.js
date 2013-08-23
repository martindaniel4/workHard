var util = require('util');
var express  = require('express');
var config = require('./config');
var gcal = require('google-calendar');
var app = express();
var _ = require("underscore");
var moment = require('moment');

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
  app.use(express.static(__dirname + '/static'));
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
    res.redirect('/list');
  });

/*
  ===========================================================================
                               Google Calendar
  ===========================================================================
*/


app.get('/',function(req, res){

res.render('welcome.ejs');

});


app.get('/list',function(req, res){

if(!req.session.access_token) return res.redirect('/auth');
  
  var accessToken = req.session.access_token;
  var google_calendar = new gcal.GoogleCalendar(accessToken);
  
  google_calendar.calendarList.list({minAccessRole:'owner'},function(err, data) {
    if(err) return res.send(500,err);

    res.render('list.ejs', {list: data});

  });

});

app.get('/details/:id', function(req, res) {

  var accessToken = req.session.access_token;
  var google_calendar = new gcal.GoogleCalendar(accessToken);
  
  google_calendar.events.list(req.params.id,{maxResults:5000,sanitizeHtml: true, singleEvents: true, timeMax: moment().subtract('days',2).format()},function(err, events) {
    if(err) return res.send(500,err);

   events.items = events.items.filter(function(d) {return d.status != "cancelled";})


var tab = [],
    bad = [];

    events.items.forEach(function(d, i) {

      if (d.start.dateTime != undefined) {

      tab.push({

          date : moment(d.start.dateTime).format("YYYY-MM-DD"),
          id: d.id

              })

      } else {

        tab.push({
          date: d.start.date,
          id: d.id

        })

      }

              });



    var count = _.countBy(tab, function(d) 
          {
            return moment(d.date).format("YYYY-MM-DD");
          });

    var minYear = moment(_.min(tab, function(d) {return moment(d.date)}).date).format("YYYY"),
        maxYear = moment(_.max(tab, function(d) {return moment(d.date)}).date).format("YYYY"),
        minVolume = _.min(count, function(d) {return d;});
        maxVolume = _.max(count, function(d) {return d;});

    //var aout = events.items.filter(function(d) {return moment(d.start.dateTime).format("YYYY-MM-DD") !=   "2013-08-23";});

  res.render('details.ejs', {events: events, length: tab.length, id: req.params.id, count: JSON.stringify(count), minYear: JSON.stringify(minYear), maxYear: JSON.stringify(maxYear), maxVolume: JSON.stringify(maxVolume), minVolume: JSON.stringify(minVolume), tab: JSON.stringify(tab), bad: JSON.stringify(bad)});

  });

});