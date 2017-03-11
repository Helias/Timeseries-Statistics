var app = angular.module('app', [ 'ui.router', 'ui.bootstrap' ]);

app.run(function($rootScope){
  $rootScope.adaptChart = function(data, legend) {

    var src = "";

    if (legend != "Forecast-Values")
      src = data + "&chf=c,s,2b3e50|bg,s,2b3e50&chco=ff0000,0ce3ac&chdl=" + legend + "|Dati&chdls=0ce3ac,20&chxs=0N*,3498db";
    else
      src = data + "&chf=c,s,2b3e50|bg,s,2b3e50&chco=ff0000,0ce3ac,0000ff&chdl=" + legend + "|Dati|Forecast-Values-Start&chdls=0ce3ac,20&chxs=0N*,3498db";

    if (legend == "Noise")
      src = src.replace("|Dati", "");

    return src.replace("800x200", "1000x300");
  }

});

app.controller('homeController', function ($scope, $http) {

  var stats = [];

  var stats = [];
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      stats = JSON.parse(this.responseText);
        google.charts.load('current', {'packages':['corechart']});
        google.charts.setOnLoadCallback(drawChart);
    }
  };
  xhttp.open("GET", "status.json", false);
  xhttp.send();

  function drawChart() {

    // remove Saturday
    var date, dateFormat;
    for (var i = 1; i < stats.length; i++) {
      date = stats[i][0].replace("/17", "/2017");
      dateFormat = new Date(date.split('/')[2] + "-" + date.split('/')[1] + "-" + date.split('/')[0]);
      if (dateFormat.getDay() == 6)
      stats.splice(i, 1);
    }

    var data = google.visualization.arrayToDataTable(stats);

    var options = {
      title: 'AzerothShard statistics',
      curveType: 'function',
      titleTextStyle: { color: '#FFF' },
      legend: { position: 'bottom', textStyle:{color: '#f39c12'} },
      colors: ['#0ce3ac'],
        backgroundColor: "#2b3e50",
      hAxis: {
        textStyle:{color: '#3498db'}
      },
      vAxis: {
        textStyle:{color: '#0ce3ac'}
      }
    };

    var chart = new google.visualization.LineChart(document.getElementById('lineChart'));
    chart.draw(data, options);
  }

});

app.controller('statsController', function ($scope, $rootScope, $http, $stateParams, $sce) {

  $scope.getData = function() {
    $http({
      method: 'GET',
      url: 'partials/' + $stateParams.stats + '.json'
    }).then(function(response) {
      var data = response.data;
      $scope.title = data.title;
      $scope.description = $sce.trustAsHtml(data.description);
      $scope.legend = data.legend;

      $http({
          method: 'POST',
          url: "/" + $stateParams.stats,
          headers: {"Content-Type": "application/json"},
          data: { period: 10 } // not used
      }).then(function (response) {
        $scope.statsSrc = $rootScope.adaptChart(response.data, $scope.legend);
      });

    });
  };
  $scope.getData();

  $scope.statsSrc = "";

  $http({
    method: 'GET',
    url: '/details'
  }).then(function(response) {
    $scope.details = "<br><br>";
    var data = response.data;
    for (i in data)
      $scope.details += '<h3><span class="text-warning">' + i + ':</span> <span class="text-success">' + data[i] + '</h3>';
    $scope.details = $sce.trustAsHtml($scope.details);
  });

});
