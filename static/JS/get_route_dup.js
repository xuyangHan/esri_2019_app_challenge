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
    "esri/geometry/Circle",
    "esri/geometry/geometryEngine",
    "dojo/domReady!"
], function (Map, MapView, Graphic, RouteTask, RouteParameters, FeatureSet, Home, Locate, Search, BasemapToggle,
             SketchViewModel, GraphicsLayer, FeatureLayer, Circle, geometryEngine) {
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

    var featureLayer = new FeatureLayer({
            url: "https://services.arcgis.com/4TKcmj8FHh5Vtobt/arcgis/rest/services/Carpool_DataSheet/FeatureServer/0",
            outFields: ["*"],
            visible: true
        });

    map.add(featureLayer);

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
        var handler = view.on("click", function (event) {
            handler.remove();
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
        var handler = view.on("click", function (event) {
            handler.remove();
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
        var zeroValue = 0;
        document.getElementById("drive-time").innerHTML = zeroValue;
        document.getElementById("distance").innerHTML = zeroValue;
        document.getElementById("co2-emission").innerHTML = zeroValue.toFixed(1);
        document.getElementById("cost").innerHTML = zeroValue.toFixed(2);
    };

    // To allow access to the route service and prevent the user from signing in, do the Challenge step in the lab to set up a service proxy
    var routeTask = new RouteTask({
        url: "https://utility.arcgis.com/usrsvcs/appservices/TDWzWsvWrqyvJH5i/rest/services/World/Route/NAServer/Route_World/solve"
    });

    document.getElementById("share-route-Btn").onclick = function () {
        if (confirm('Are you sure you want to share your route with other people for carpooling?')) {
            // Save it!
            gatherDataToAddInFeatureLayer();
        } else {
            // Do nothing!
        }
    };
    document.getElementById("find-carpool-btn").onclick = function () {
        findCarPoolArroundMe();
    };

    //var distanceSlider = document.getElementById("distance");
    //var distanceValue = document.getElementById("distance-value");
    //distanceSlider.addEventListener("input", function() {
    //      distanceValue.innerText = distanceSlider.value;
    //});

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

    function addFeature(point, carYear, carMake, carModel, latitude, longitude, name, email) {
        //console.log(point.x, point.y, carYear, carMake, carModel, latitude, longitude, name, email);
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
        });

        var name = document.getElementById(id = 'user_name');
        var email = document.getElementById(id = 'user_email');

        addFeature(point, year, make, model, latitude, longitude, name.value, email.value);
    }

    function queryFeatureLayer(graphicGeometryHome){
        /*
        // query all features from the featureLayer layer
        view
          .when(function() {
            return featureLayer.when(function() {
              var query = featureLayer.createQuery();
              return featureLayer.queryFeatures(query);
            });
          })
          .then(getValues)
          .then(addToSelect)
          .then(createBuffer);

        // return an array of all the values in the
        // STATUS2 field of the wells layer
        function getValues(response) {
          var features = response.features;
          var values = features.map(function(feature) {
            return feature.attributes.Latitude;
          });
          return values;
        }*/

        function queryForFeatureGeometries() {
          var featureQuery = featureLayer.createQuery();

          return featureLayer.queryFeatures(featureQuery).then(function(response) {
            var featuresGeometry = response.features.map(function(feature) {
                var mapPoint = new MapPoint(feature.attributes.Latitude, feature.attributes.Longitude);
                return mapPoint;
            });

            return featuresGeometry;
          });
        }



        /*var query = featureLayer.createQuery();
        query.geometry = graphicGeometryHome;
        query.spatialRelationship = "intersects";
        return featureLayer.queryFeatures(query);*/
    }

    function findCarPoolArroundMe() {
        var homeBufferDist = 1000;//parseInt(distanceSlider.value);
        //console.log(homeBufferDist);
        //var isMiles = true;

        var graphicGeometryHome;
        var graphicGeometryDest;
        view.graphics.forEach(function (graphic) {
            if(graphic.attributes["name"] == "destination") {
                graphicGeometryDest = graphic.geometry;
                //console.log("Found Destination");
            }
            else if (graphic.attributes["name"] == "home") {
                graphicGeometryHome = graphic.geometry;
                //console.log("Found Home");
            }
        })

        /*var point = {
          type: "point", // autocasts as new Point()
          longitude: -49.97,
          latitude: 41.73
        };*/

        /*var markerSymbol = {
          type: "simple-marker", // autocasts as new SimpleMarkerSymbol()
          color: [226, 119, 40],
          outline: {
            // autocasts as new SimpleLineSymbol()
            color: [255, 255, 255],
            width: 2
          }
        };
        //var point = new Point([-77.036744, 38.897731]);
        var pointGraphic = new Graphic({
            geometry: graphicGeometryHome,
            symbol: markerSymbol
        });
        view.graphics.add(pointGraphic);*/

        /*
        var circle = new Circle([,], {
            radius: bufferDistance,
            //radiusUnit: isMiles ? esri.Units.MILES : esri.Units.km,
            geodesic: true
        });

        var circleSymbol = {
            type: "simplefillsymbol", // autocasts as new SimpleMarkerSymbol()
            color: [226, 119, 40],
            style: 'STYLE_CIRCLE',
            outline: {
                // autocasts as new SimpleLineSymbol()
                color: [255, 255, 255],
                width: 2
            }
        };

        var circleGraphic = new Graphic(circle, circleSymbol);
        view.graphics.add(circleGraphic);
        */


        var sourceBuffers = geometryEngine.geodesicBuffer(
            graphicGeometryHome,
            homeBufferDist,
            "meters",
            true
        );

        var bufferGraphic = new Graphic({
            geometry: sourceBuffers, // TODO to be filled
            symbol: {
              type: "simple-fill", // autocasts as new SimpleFillSymbol()
              outline: {
                width: 1.5,
                color: [255, 128, 0, 0.5]
              },
              style: "none"
            }
        });
        //view.graphics.removeAll();
        view.graphics.add(bufferGraphic);

        var featureQuery = featureLayer.createQuery();
        featureQuery.geometry = bufferGraphic.geometry;
        featureLayer.queryFeatures(featureQuery).then(selectInBuffer);
    }

    function selectInBuffer(response){
      var feature;
      var features = response.features;
      var inBuffer = [];
      console.log(features);
      //filter out features that are not actually in buffer, since we got all points in the buffer's bounding box
      for (var i = 0; i < features.length; i++) {
        feature = features[i];
        if(circle.contains(feature.geometry)){
          inBuffer.push(feature.attributes[featureLayer.objectIdField]);
        }
      }
      console.log("In Buffer" , inBuffer.length);
      var query = new Query();
      query.objectIds = inBuffer;
      //use a fast objectIds selection query (should not need to go to the server)
      featureLayer.selectFeatures(query, FeatureLayer.SELECTION_NEW, function(results){
        results.forEach(function (result) {
            console.log(result.attributes.Car_Make);
        })
      });
    }
});