require([
    "esri/Map",
    "esri/views/MapView",
    "esri/Graphic",
    "esri/tasks/RouteTask",
    "esri/tasks/support/RouteParameters",
    "esri/tasks/support/FeatureSet",
], function (Map, MapView, Graphic, RouteTask, RouteParameters, FeatureSet) {

    var map = new Map({
        basemap: "streets-navigation-vector"
    });

    var view = new MapView({
        container: "viewDiv",
        map: map,
        center: [-118.71511, 34.09042],
        zoom: 10
    });

    // To allow access to the route service and prevent the user from signing in, do the Challenge step in the lab to set up a service proxy

    var routeTask = new RouteTask({
        url: "https://route.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World"
    });

    loadCSV();

    view.on("click", function (event) {
        if (view.graphics.length === 0) {
            addGraphic("start", event.mapPoint);
        } else if (view.graphics.length === 1) {
            addGraphic("finish", event.mapPoint);
            // Call the route service
            getRoute();
        } else {
            view.graphics.removeAll();
            addGraphic("start", event.mapPoint);
        }
    });

    function addGraphic(type, point) {
        var graphic = new Graphic({
            symbol: {
                type: "simple-marker",
                color: (type === "start") ? "white" : "black",
                size: "8px"
            },
            geometry: point
        });
        view.graphics.add(graphic);
    }

    function getRoute() {
        // Setup the route parameters
        var routeParams = new RouteParameters({
            stops: new FeatureSet({
                features: view.graphics.toArray()
            }),
            returnDirections: true
        });
        // Get the route
        routeTask.solve(routeParams).then(function (data) {
            data.routeResults.forEach(function (result) {
                result.route.symbol = {
                    type: "simple-line",
                    color: [5, 150, 255],
                    width: 3
                };
                view.graphics.add(result.route);

                var totalDriveTime = result.directions.totalDriveTime;
                var totalLength = result.directions.totalLength;
                var totalTime = result.directions.totalTime;
                //alert("Distance : "+totalLength+" miles\nEstimated Time : "+totalDriveTime+" minutes" + "Total time"+ totalTime);
            });
        });
    }
});

function loadCSV() {
    d3.csv("static/CSV/2019ratings.csv", function(error, data) {

        // returns whole column
        //var yearData = data.map(function(d) { return d.YEAR });
        //var makeData = data.map(function(d) { return d.MAKE });
        //var modelData = data.map(function(d) { return d.MODEL });


        updateCarYearSelection(data);
        var filteredData = updateCarMakeSelection(data, false);
        filteredData = updateCarModelSelection(filteredData, false);

        // TODO update view here
    });
    /*
    d3.csv("/static/CSV/2019ratings.csv", function(d) {
        return {
            //city : d.city,
            //             //state : d.state,
            //             //population : +d.population,
            //             //land_area : +d["land area"]
            model_year : d['Year']
        };
    }).then(function(data) {
        //data.forEach(function(d) {
        //    d.population = +d.population;
        //    d["land area"] = +d["land area"];
        //});
        //data.unique

        alert(data[0].model_year);
        /*
        d3.select("#selectedVehicle").selectAll("option")
            .data(d3.map(data, function(d){return d.model_year;}).keys())
            .enter()
            .append("option")
            .text(function(d){return d;})
            .attr("value",function(d){return d;});

    });*/
}

function updateCarSelection(year, make, model) {


}

function updateCarYearSelection(data) {

    var yearKeys = d3.map(data, function(d) { return d.YEAR; }).keys();
    console.log("Year Keys: " + yearKeys);

    d3.select("#vehicleYear").selectAll("option").data(yearKeys).enter().append("option")
      .text(String).attr("value", String);
    d3.select("#vehicleYear").on("change", function () {
        document.getElementById('selectedYear').innerHTML = this.value;
        updateCarMakeSelection(data);
    });
}

function updateCarMakeSelection(data, isUpdate = true) {

    var filteredData = carYearDataFilter(data);
    var makeKeys = d3.map(filteredData, function(d) { return d.MAKE; }).keys();
    console.log("Make Keys: " + makeKeys);

    if(isUpdate) {
        d3.select("#vehicleMake").selectAll("option").data(makeKeys).attr("value", String).text(String)
            .enter().append("option").attr("value", String).text(String).transition().duration(1);
        d3.select("#vehicleMake").selectAll("option").data(makeKeys).exit().remove();

        updateCarModelSelection(data);
    }
    else {
        d3.select("#vehicleMake").selectAll("option").data(makeKeys).enter().append("option")
            .attr("value", String).text(String);
    }

    d3.select("#vehicleMake").on("change", function () {
        document.getElementById('selectedMake').innerHTML = this.value;
        updateCarModelSelection(data);
    });

    return filteredData;
}

function updateCarModelSelection(data, isUpdate = true) {

    var filteredData = carMakeDataFilter(data);
    var modelKeys = d3.map(filteredData, function(d) { return d.MODEL; }).keys();
    console.log("Model Keys: " + modelKeys);

    if(isUpdate) {
        d3.select("#vehicleModel").selectAll("option").data(modelKeys).attr("value", String).text(String)
            .enter().append("option").attr("value", String).text(String).transition().duration(1);
        d3.select("#vehicleModel").selectAll("option").data(modelKeys).exit().remove();

        // TODO update view here
    }
    else {
        d3.select("#vehicleModel").selectAll("option").data(modelKeys).enter().append("option")
            .attr("value", String).text(String);
    }

    d3.select("#vehicleModel").on('change', function () {
        document.getElementById('selectedModel').textContent = this.value;

        // TODO update view here
    });

    return filteredData;
}

function carYearDataFilter(data) {
    var yearSelection = document.getElementById('vehicleYear');
    var year = yearSelection.options[yearSelection.selectedIndex].value;

    data = data.filter(function(d) { return d.YEAR  == year;});
    return data;
}

function carMakeDataFilter(data) {
    var makeSelection = document.getElementById('vehicleMake');
    var make = makeSelection.options[makeSelection.selectedIndex].value;

    data = data.filter(function(d) { return d.MAKE  == make;});
    return data;
}

function carModelDataFilter(data) {
    var modelSelection = document.getElementById('vehicleModel');
    var model = modelSelection.options[modelSelection.selectedIndex].value;

    data = data.filter(function(d) { return d.MODEL  == model;});
    return data;
}