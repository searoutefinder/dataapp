/**
 * Created by HAJDUTAMAS on 2015.11.24..
 */
var app = angular.module("TheDataApp", []);

app.controller("mapCtrl", function($scope) {

    L.mapbox.accessToken = 'pk.eyJ1IjoidGhlZGF0YWFwcCIsImEiOiJjaWh5dzE5Zm0wM3hkdGdtMTB6bmxqcm14In0.KPb--m7HkkPtnxIeH4CXUA';
    
	/*Initialize the map and attach a base layer*/
    $scope.map = L.mapbox.map('dataapp-map', null, {
        dragging: true,
        touchZoom: true,
        scrollWheelZoom: true,
        doubleClickZoom: true
    }).setView([-33.865143, 151.209900], 10);

    var basemap = new L.TileLayer('http://{s}.tiles.mapbox.com/v3/btsdatavisualisation.map-s6wlfsu2/{z}/{x}/{y}.png').addTo($scope.map);

	$scope.tempLayer =  L.mapbox.featureLayer().addTo($scope.map);
	
	$scope.tempLayer.on("layeradd", function(e){
	    e.layer.bindLabel(e.layer.options.name);
	});
	
    $scope.lgaLayer = new L.TileLayer('http://52.32.79.80/tiles/tiles.py/lgas/{z}/{x}/{y}.png', {
            minZoom: 4,
            maxZoom: 18,
            continuousWorld: true
        });

    $scope.lgaGrid = new L.UtfGrid('http://52.32.79.80/tiles/tiles.py/lga_json/{z}/{x}/{y}.json?callback={cb}', {
	        resolution: 4,
		    maxZoom: 18
	    });
		
    $scope.lgaGrid.on('mousemove', function(e){
		    if(e.data == null){return false;}		
						
            var circle = L.circle(e.latlng, 500, {
					"name": e.data["LGA_NAME11"],
					"fillOpacity": 0, 
					"opacity": 0, 
					"weight": 0
				});			
			$scope.tempLayer.addLayer(circle);
        });	
		
    $scope.lgaGrid.on('mouseout', function(e){
        $scope.tempLayer.eachLayer(function(layer){
		    $scope.tempLayer.removeLayer(layer);
		});
	});	
		
    $scope.suburbLayer = new L.TileLayer('http://52.32.79.80/tiles/tiles.py/suburb/{z}/{x}/{y}.png', {
            minZoom: 4,
            maxZoom: 18,
            continuousWorld: true
        });	

    $scope.suburbGrid = new L.UtfGrid('http://52.32.79.80/tiles/tiles.py/suburb_json/{z}/{x}/{y}.json?callback={cb}', {
	        resolution: 4,
		    maxZoom: 18
	    });
		
    $scope.suburbGrid.on('mousemove', function(e){
		    if(e.data == null){return false;}		
						
            var circle = L.circle(e.latlng, 500, {
					"name": e.data["SSC_NAME"],
					"fillOpacity": 0, 
					"opacity": 0, 
					"weight": 0
				});			
			$scope.tempLayer.addLayer(circle);
        });	
		
    $scope.suburbGrid.on('mouseout', function(e){
        $scope.tempLayer.eachLayer(function(layer){
		    $scope.tempLayer.removeLayer(layer);
		});
	});	
	
    $scope.gccsaLayer = new L.TileLayer('http://52.32.79.80/tiles/tiles.py/gccsa/{z}/{x}/{y}.png', {
            minZoom: 4,
            maxZoom: 18,
            continuousWorld: true
        });	
	
    $scope.gccsaGrid = new L.UtfGrid('http://52.32.79.80/tiles/tiles.py/gccsa_json/{z}/{x}/{y}.json?callback={cb}', {
	        resolution: 4,
		    maxZoom: 18
	    });	
		
    $scope.gccsaGrid.on('mousemove', function(e){
		    if(e.data == null){return false;}		
						
            var circle = L.circle(e.latlng, 500, {
					"name": e.data["STE_NAME11"],
					"fillOpacity": 0, 
					"opacity": 0, 
					"weight": 0
				});			
			$scope.tempLayer.addLayer(circle);
        });	
		
    $scope.gccsaGrid.on('mouseout', function(e){
        $scope.tempLayer.eachLayer(function(layer){
		    $scope.tempLayer.removeLayer(layer);
		});
	});			
	
    $scope.firstLevel = null;

    var layerSwitch = L.Control.extend({
        options: {
            position: 'bottomright'
        },

        onAdd: function (map) {
            // create the control container with a particular class name
            var container = L.DomUtil.create('div', 'layer-control panel panel-default');

            $(container).append($('<div class="panel-heading">Layers</div><div class="panel-body"><select class="form-control" name="selectedLayer" id="selectedLayer"><option value="sub">Suburbs</option><option value="lga">Local Government Areas</option><option value="gccsa">Greater Capital City</option></select></div>'));

            function removeLayers(){
                $scope.map.removeLayer($scope.lgaLayer);
				$scope.map.removeLayer($scope.lgaGrid);
                $scope.map.removeLayer($scope.suburbLayer);
				$scope.map.removeLayer($scope.suburbGrid);
                $scope.map.removeLayer($scope.gccsaLayer);
				$scope.map.removeLayer($scope.gccsaGrid);
            }

            $(container).find("#selectedLayer").on("change", function(){
                switch($(this).val()){
                    case "lga":
                        removeLayers();
                        $scope.lgaLayer.addTo($scope.map);					
						$scope.map.addLayer($scope.lgaGrid);
                        break;
                    case "sub":
                        removeLayers();
                        $scope.suburbLayer.addTo($scope.map);
						$scope.map.addLayer($scope.suburbGrid);
                        break;
                    case "gccsa":
                        removeLayers();
                        $scope.gccsaLayer.addTo($scope.map);
						$scope.map.addLayer($scope.gccsaGrid);
                        break;
                }
            });

	       //Trigger an initial change
	       $(container).find("#selectedLayer").trigger("change");			
			
            return container;
        }
    });
    var layerSwitcher = new layerSwitch();
    $scope.map.addControl(layerSwitcher);

    /*Add autocomplete to the map*/

    var autocompleteControl = L.Control.extend({
        options: {
            position: 'bottomleft'
        },

        onAdd: function (map) {
            // create the control container with a particular class name
            var container = L.DomUtil.create('div', 'layer-control autocomplete-container');

            $(container).append($('<input type="text" class="form-control" placeholder="Enter your address" id="field-autocomplete"/>'));
            $(container).find("#field-autocomplete").on("focus", function(){
			    $(this).val('');
			});
            $scope.autoComplete = new google.maps.places.Autocomplete($(container).find("#field-autocomplete").get(0));

            $scope.autoComplete.addListener("place_changed", function(){
                var returnedPlace = this.getPlace();
                console.log([returnedPlace.geometry.location.lat(), returnedPlace.geometry.location.lng()]);

                $scope.map.setView([Number(returnedPlace.geometry.location.lat()), Number(returnedPlace.geometry.location.lng())]);
            });

            return container;
        }
    });

    var autoComplete = new autocompleteControl();
    $scope.map.addControl(autoComplete);
});