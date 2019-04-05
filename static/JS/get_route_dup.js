var totalDriveTime = 0;
var totalLength = 0;

require([
    "esri/Map",
    "esri/views/MapView",
    "esri/Graphic",
    "esri/tasks/RouteTask",
    "esri/tasks/support/RouteParameters",
    "esri/tasks/support/FeatureSet",
    "esri/widgets/Home",
    "esri/widgets/Locate",
    "esri/widgets/Search",
    "esri/widgets/BasemapToggle",
    "esri/widgets/Sketch/SketchViewModel",
    "esri/layers/GraphicsLayer",
    "esri/layers/FeatureLayer",
    "dojo/domReady!"
], function (Map, MapView, Graphic, RouteTask, RouteParameters, FeatureSet, Home, Locate, Search, BasemapToggle,
             SketchViewModel, GraphicsLayer, FeatureLayer) {
    loadCSV();

    // GraphicsLayer to hold graphics created via sketch view model
    var tempGraphicsLayer = new GraphicsLayer(); //home
    var tempGraphicsLayer2 = new GraphicsLayer(); //dest

    var map = new Map({
        basemap: "streets-navigation-vector",
        layers: [tempGraphicsLayer, tempGraphicsLayer2]
    });

    var view = new MapView({
        container: "viewDiv",
        map: map,
        center: [-79.5, 43.77],
        zoom: 12
    });

    intializeFeatureLayer(map);

    var homeWidget = new Home({
        view: view
    });
    // adds the home widget to the top left corner of the MapView
    view.ui.add(homeWidget, "top-left");

    var locateWidget = new Locate({
        view: view,   // Attaches the Locate button to the view
        graphic: new Graphic({
            symbol: {type: "simple-marker"}  // overwrites the default symbol used for the
            // graphic placed at the location of the user when found
        })
    });
    view.ui.add(locateWidget, "top-left");

    var searchWidget = new Search({
        view: view
    });
    // Adds the search widget below other elements in
    // the top left corner of the view
    view.ui.add(searchWidget, {
        position: "top-left",
        index: 0
    });

    // Basemap events
    $("#selectBasemapPanel").on("change", function (e) {
        map.basemap = e.target.options[e.target.selectedIndex].dataset.vector;
    });


    // Create a new SketchViewModel and set
    // its required parameters
    var sketchVHomeM = new SketchViewModel({
        layer: tempGraphicsLayer,
        view: view,
        pointSymbol: { // symbol used for points
            type: "picture-marker",  // autocasts as new PictureMarkerSymbol()
            url: "static/Imgs/home-solid.png",
            width: "20px",
            height: "20px"
        }
    });

    var sketchVDestM = new SketchViewModel({
        layer: tempGraphicsLayer2,
        view: view,
        pointSymbol: { // symbol used for points
            type: "picture-marker",  // autocasts as new PictureMarkerSymbol()
            url: "static/Imgs/map-pin-solid.png",
            width: "10px",
            height: "20px"
        }
    });


    sketchVHomeM.on("draw-complete", function (evt) {
        tempGraphicsLayer.add(evt.graphic);
    });

    sketchVDestM.on("draw-complete", function (evt) {
        // add the graphic to the graphics layer
        tempGraphicsLayer2.add(evt.graphic);
    });


    // *************************************
    // activate the sketch to create a home point
    // *************************************
    var drawHomeButton = document.getElementById("homeButton");
    drawHomeButton.onclick = function () {
        // add the graphic to the graphics layer
        sketchVHomeM.create("point");
        document.getElementById("homeButton").disabled = true;
        view.on("click", function (event) {
            addGraphic("home", event.mapPoint);
            console.log("Home");
            /*if (view.graphics.length === 0) {
                addGraphic("home", event.mapPoint);
            } else if (view.graphics.length === 1) {
                addGraphic("home", event.mapPoint);
                // Call the route service
                getRoute();
            } else {
                view.graphics.removeAll();
                addGraphic("home", event.mapPoint);
            }*/
        });
    };


    // *************************************
    // activate the sketch to create a dest point
    // *************************************
    var drawDestButton = document.getElementById("destButton");
    drawDestButton.onclick = function () {
        sketchVDestM.create("point");
        document.getElementById("destButton").disabled = true;
        view.on("click", function (event) {
            addGraphic("destination", event.mapPoint);
            console.log("Destination");
            /*
            if (view.graphics.length === 0) {
                addGraphic("destination", event.mapPoint);
            } else if (view.graphics.length === 1) {
                addGraphic("destination", event.mapPoint);
                // Call the route service
                getRoute();
            } else {
                view.graphics.removeAll();
                addGraphic("destination", event.mapPoint);
            }*/
        });
    };

    document.getElementById("ResetBtn").onclick = function () {
        tempGraphicsLayer.removeAll();
        sketchVHomeM.reset();
        sketchVDestM.reset();
        document.getElementById("homeButton").disabled = false;
        document.getElementById("destButton").disabled = false;
        tempGraphicsLayer2.removeAll();
        view.graphics.removeAll();
        document.getElementById("drive-time").innerHTML = 0;
        document.getElementById("distance").innerHTML = 0;
    };


    // To allow access to the route service and prevent the user from signing in, do the Challenge step in the lab to set up a service proxy
    var routeTask = new RouteTask({
        url: "https://utility.arcgis.com/usrsvcs/appservices/TDWzWsvWrqyvJH5i/rest/services/World/Route/NAServer/Route_World/solve"
    });

    var btn = document.getElementById("share-route-Btn");

    btn.onclick = function () {
        if (confirm('Are you sure you want to share your route with other people for carpooling?')) {
            // Save it!
            gatherDataToAddInFeatureLayer();
        } else {
            // Do nothing!
        }
    };


    function addGraphic(name, point) {
        var graphic = new Graphic({
            geometry: point,
            attributes: {
                "name": name
            }
        });
        view.graphics.add(graphic);

        console.log(view.graphics.length);
        if(view.graphics.length === 2)
            getRoute();
    }


    function getRoute() {
        // Setup the route parameters
        var routeParams = new RouteParameters({
            stops: new FeatureSet(
                {
                    features: view.graphics.toArray()
                }
            ),
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
                totalDriveTime = result.directions.totalDriveTime;
                totalLength = result.directions.totalLength;
                var totalTime = result.directions.totalTime;
                // alert("Distance : "+totalLength+" miles\nEstimated Time : "+totalDriveTime+" minutes\n" + "Total time"+ totalTime);
                document.getElementById("drive-time").innerHTML = totalDriveTime.toFixed(1);
                document.getElementById("distance").innerHTML = totalLength.toFixed(2);
                showCostnCO2(selectedCar);
            });
        });
    }

    function intializeFeatureLayer() {

        featureLayer = new FeatureLayer({
            url: "https://services.arcgis.com/4TKcmj8FHh5Vtobt/arcgis/rest/services/Carpool_DataSheet/FeatureServer/0",
            outFields: ["*"],
            visible: true
        });

        map.add(featureLayer);
    }

    function addFeature(point, carYear, carMake, carModel, latitude, longitude, name, email) {

        console.log(point.x, point.y, carYear, carMake, carModel, latitude, longitude, name, email);

        const attributes = {};
        attributes["Car_Year"] = carYear;
        attributes["Car_Make"] = carMake;
        attributes["Car_Model"] = carModel;
        attributes["Pool_Count"] = 1;
        attributes["Latitude"] = latitude;
        attributes["Longitude"] = longitude;
        attributes["Name"] = name;
        attributes["Email"] = email;

        const addFeature =  new Graphic({
            geometry: point,
            attributes: attributes
        });

        featureLayer.applyEdits({
            addFeatures: [addFeature]
        }).then( function(result) {
            console.log("projected points: ", result);
        }).catch( function(error) {
            console.error("Error while adding feature: ", error);
        });
    }

    function gatherDataToAddInFeatureLayer() {

        var yearSelection = document.getElementById('vehicleYear');
        var year = yearSelection.options[yearSelection.selectedIndex].value;

        var makeSelection = document.getElementById('vehicleMake');
        var make = makeSelection.options[makeSelection.selectedIndex].value;

        var modelSelection = document.getElementById('vehicleModel');
        var model = modelSelection.options[modelSelection.selectedIndex].value;

        var point;
        var latitude;
        var longitude;

        view.graphics.forEach(function (graphic) {
            if(graphic.attributes["name"] == "destination") {
                point = graphic.geometry;
                console.log("Found Destination", point);
            }
            else if (graphic.attributes["name"] == "home") {
                latitude = graphic.geometry.x;
                longitude = graphic.geometry.y;
                console.log("Found Home", latitude, longitude);
            }
        })

        var name = document.getElementById(id = 'user_name');
        var email = document.getElementById(id = 'user_email');

        addFeature(point, year, make, model, latitude, longitude, name.value, email.value);
    }
});