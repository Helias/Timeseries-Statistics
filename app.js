const bodyParser = require('body-parser');
const express = require('express');
const fs = require('fs');
var timeseries = require("timeseries-analysis");
var request = require("request")

var stats = [];

var url = "http://188.213.170.165/helias/azth/status.json";
request({
    url: url,
    json: true
}, function (error, response, body) {

    if (!error && response.statusCode === 200) {
        body.shift();
        stats = body;
    }
})

// remove Saturday
var date, dateFormat;
for (var i = 1; i < stats.length; i++) {
  date = stats[i][0].replace("/17", "/2017");
  dateFormat = new Date(date.split('/')[2] + "-" + date.split('/')[1] + "-" + date.split('/')[0]);
  if (dateFormat.getDay() == 6)
    stats.splice(i, 1);
}

var app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

app.get('/', function(req, res) {
  res.sendFile("public/index.html", {root: __dirname});
});

app.get('/data', function(req, res) {
  res.send(stats);
});


app.get('/details', function(req, res) {
  var t = new timeseries.main(stats);
  var details = {};
  details["Mean"] = t.mean();
  details["Standard Deviation"] = t.stdev();
  details["Min"] = t.min();
  details["Max"] = t.max();
  res.send(details);
});

app.post('/ma', function(req, res) {
  var t = new timeseries.main(stats);
  var movingAverage = t.ma().chart({ main: true });
  res.send(movingAverage);
});

app.post('/lwma', function(req, res) {
  var t = new timeseries.main(stats);
  var linearWeightedMA = t.lwma().chart({ main: true });
  res.send(linearWeightedMA);
});

app.post('/trend', function(req, res) {
  var t = new timeseries.main(stats);
  var trend = t.dsp_itrend({
    alpha: 0.5
  }).chart({ main: true });
  res.send(trend);
});

app.post('/smoothing', function(req, res) {
  var t = new timeseries.main(stats);
  var smooth =  t.smoother({
      period: 5
  }).chart({ main: true });

  res.send(smooth);
});

app.post('/noise', function(req, res) {
  var t = new timeseries.main(stats);
  var noise = t.smoother({period:10}).noiseData().smoother({period:5}).chart();
  res.send(noise);
});

app.post('/forecast', function(req, res) {
  var t = new timeseries.main(stats);
  t.smoother({ period:5 }).save('smoothed');
  var bestSettings = t.regression_forecast_optimize();
  var forecast = t.sliding_regression_forecast({
      sample:		bestSettings.sample,
      degree: 	bestSettings.degree,
      method: 	bestSettings.method
  }).chart({main:false}) + "&chm=s,0000ff,0," + bestSettings.sample + ",8.0";
  res.send(forecast);
});

app.listen(8081);
