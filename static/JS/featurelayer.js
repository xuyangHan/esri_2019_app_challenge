require([
    "esri/Map",
    "esri/views/MapView",
    "esri/Graphic",
    "esri/tasks/RouteTask",
    "esri/tasks/support/RouteParameters",
    "esri/tasks/support/FeatureSet",
    "esri/layers/FeatureLayer",
    "esri/layers/GraphicsLayer",
    "esri/widgets/FeatureForm",
    "dojo/domReady!"
], function (Map, MapView, Graphic, RouteTask, RouteParameters, FeatureSet, FeatureLayer, GraphicsLayer, FeatureForm) {

     var map = new Map({
        basemap: "streets-navigation-vector"
    });

    var view = new MapView({
        container: "viewDiv",
        map: map,
        //center: [-118.71511, 34.09042],
        center: [-79.5, 43.77],
        /*extent: {
            // autocasts as new Extent()
            xmin: -9177811,
            ymin: 4247000,
            xmax: -9176791,
            ymax: 4247784,
            spatialReference: 102100
          },*/
        zoom: 12
    });

    //var resultsLayer = new GraphicsLayer();

    //var featureLayer = new FeatureLayer("https://services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/Landscape_Trees/FeatureServer/0");
    const featureLayer = new FeatureLayer({
        url: "https://services.arcgis.com/4TKcmj8FHh5Vtobt/arcgis/rest/services/Carpool_DataSheet/FeatureServer/0",
        outFields: ["*"],
        visible: true
        //id: ""
    });

    map.add(featureLayer);

    /*
    let editFeature;

    const featureForm = new FeatureForm({
          container: "formDiv",
          layer: featureLayer,
          fieldConfig: [
            {
              name: "Home_City",
              label: "Home City"
            },
            {
              name: "Home_Neighbourhood",
              label: "Home Neighbourhood"
            }
          ]
        });

    featureForm.on("submit", function() {
          if (editFeature) {

            const updated = featureForm.getValues();


            Object.keys(updated).forEach(function(name) {
              editFeature.attributes[name] = updated[name];
            });

            const edits = {
              updateFeatures: [editFeature]
            };
            applyEditsToIncidents(edits);
            //document.getElementById("viewDiv").style.cursor = "auto";
          }
        });

    // Call FeatureLayer.applyEdits() with specified params.
    function applyEditsToIncidents(params) {
          // unselectFeature();
          featureLayer
            .applyEdits(params)
            .then(function(editsResult) {
              // Get the objectId of the newly added feature.
              // Call selectFeature function to highlight the new feature.
              if (
                editsResult.addFeatureResults.length > 0 ||
                editsResult.updateFeatureResults.length > 0
              ) {
                unselectFeature();
                let objectId;
                if (editsResult.addFeatureResults.length > 0) {
                  objectId = editsResult.addFeatureResults[0].objectId;
                } else {
                  featureForm.feature = null;
                  objectId = editsResult.updateFeatureResults[0].objectId;
                }
                selectFeature(objectId);
                if (addFeatureDiv.style.display === "block") {
                  toggleEditingDivs("none", "block");
                }
              }
              // show FeatureTemplates if user deleted a feature
              else if (editsResult.deleteFeatureResults.length > 0) {
                toggleEditingDivs("block", "none");
              }
            })
            .catch(function(error) {
              console.log("===============================================");
              console.error(
                "[ applyEdits ] FAILURE: ",
                error.code,
                error.name,
                error.message
              );
              console.log("error = ", error);
            });
        }*/

    const handler = view.on("click", function(event) {
        //handler.remove();
        //event.stopPropagation();

        if (event.mapPoint) {
            var point = event.mapPoint.clone();
            point.z = undefined;
            point.hasZ = false;
            var lat = 43.77;
            var lng = -79.5;

            addFeature(point, "2010", "Honda", "Civic", lat, lng, "XYZ", "abc@me.com", featureLayer)
        }
        else {
            console.error("event.mapPoint is not defined");
        }
    });

    function addFeature(point, carYear, carMake, carModel, latitude, longitude, name, email, featureLayer) {
      const attributes = {};
      attributes["Car_Year"] = carYear;
      attributes["Car_Make"] = carMake;
      attributes["Car_Model"] = carModel;
      attributes["Pool_Count"] = 1;
      attributes["Latitude"] = latitude;
      attributes["Longitude"] = longitude;
      attributes["Name"] = name;
      attributes["Email"] = email;

      // Date.now() returns number of milliseconds elapsed
      // since 1 January 1970 00:00:00 UTC.
      //attributes["Report_Date"] = Date.now();

      const addFeature =  new Graphic({
        geometry: point,
        attributes: attributes
      });

      //const deleteFeature = {
      // objectId: [467]
      //};

      featureLayer.applyEdits({
        addFeatures: [addFeature]
        //deleteFeatures: [deleteFeature]
      }).then(function(result){
          console.log("projected points: ", result);
      }).catch( function(error) {
          console.error("Error while adding feature: ", error);
      });
    }

    var distanceSlider = document.getElementById("distance");
    var distanceValue = document.getElementById("distance-value");

    distanceSlider.addEventListener("input", function() {
          distanceValue.innerText = distanceSlider.value;
    });

    /*
    function createBuffer(wellPoints) {
      var bufferDistance = parseInt(distanceSlider.value);
      var wellBuffers = geometryEngine.geodesicBuffer(
        wellPoints,
        [bufferDistance],
        "meters",
        true
      );
      wellBuffer = wellBuffers[0];

      // add the buffer to the view as a graphic
      var bufferGraphic = new Graphic({
        geometry: wellBuffer,
        symbol: {
          type: "simple-fill", // autocasts as new SimpleFillSymbol()
          outline: {
            width: 1.5,
            color: [255, 128, 0, 0.5]
          },
          style: "none"
        }
      });
      view.graphics.removeAll();
      view.graphics.add(bufferGraphic);
    }*/
});