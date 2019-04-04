require([
    "esri/Map",
    "esri/views/MapView",
    "esri/Graphic",
    "esri/tasks/RouteTask",
    "esri/tasks/support/RouteParameters",
    "esri/tasks/support/FeatureSet",
    "esri/widgets/Home",
    "esri/widgets/Locate",
    "esri/widgets/Search"
], function (Map, MapView, Graphic, RouteTask, RouteParameters, FeatureSet, Home, Locate, Search) {

    var map = new Map({
        basemap: "streets-navigation-vector"
    });

    var view = new MapView({
        container: "viewDiv",
        map: map,
        center: [-79.5, 43.77],
        zoom: 12
    });

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


    // To allow access to the route service and prevent the user from signing in, do the Challenge step in the lab to set up a service proxy
    var routeTask = new RouteTask({
        url: "https://route.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World"
    });

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