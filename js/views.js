var TdaApplicationView = Backbone.View.extend({
	initialize: function(options){
	    var parent = this;
		parent.eventBus = _.extend({}, Backbone.Events);
		parent.render();
	},
	render: function(){
	    var parent = this;
		parent.subViews = {
		    "header": new TdaHeaderView({"eventBus": parent.eventBus}),
            "main": new TdaMainView({"eventBus": parent.eventBus})
		};
	}
});

var TdaHeaderView = Backbone.View.extend({
    el: "#dataapp-header-bar",
	template: _.template($("#tpl_tda_header").html()),
	initialize: function(options){
	    var parent = this;
		parent.eventBus = options.eventBus;
		parent.render();
	},
	render: function(){
	    var parent = this;
		parent.$el.html(parent.template());
	}
});

var TdaLoaderView = Backbone.View.extend({
    el: "#dataapp-loader",
	template: _.template($("#tpl_tda_loader").html()),
	initialize: function(options){
	    var parent = this;
		parent.eventBus = options.eventBus;
		parent.render();
	},
	render: function(){
	    var parent = this;
		parent.$el.html(parent.template());
		return parent.$el;
	}
});

var TdaMapView = Backbone.View.extend({
    el: "#dataapp-map",
	initialize: function(options){
	    var parent = this;
		parent.eventBus = options.eventBus;
		parent.selectedLayerType = "target";
		parent.selectedLayer = "lga";
		parent.areaSelectionMode = "manual";
		parent.radiusAmount = 3218;

        parent.eventBus.on("activeLayerChange", parent.activeLayerChange, parent);
		parent.eventBus.on("clearTargetLayer", parent.clearTargetLayer, parent);
		parent.eventBus.on("clearComparisonLayer", parent.clearComparisonLayer, parent);
		parent.eventBus.on("toggleAreaSelectionMode", parent.toggleAreaSelectionMode, parent);
		parent.eventBus.on("setRadiusValue", parent.setRadiusValue, parent);
		parent.eventBus.on("setSelectedLayer", parent.setSelectedLayer, parent);
		
        L.mapbox.accessToken = 'pk.eyJ1IjoidGhlZGF0YWFwcCIsImEiOiJjaWh5dzE5Zm0wM3hkdGdtMTB6bmxqcm14In0.KPb--m7HkkPtnxIeH4CXUA';		
		
        parent.map = L.mapbox.map(parent.$el.prop("id"), null, {
            dragging: true,
            touchZoom: true,
            scrollWheelZoom: true,
            doubleClickZoom: true,
        }).setView([-33.865143, 151.209900], 10);

		L.easyButton( 'fa-map', function(){
			parent.controlsModal.showModal();
		}, "", "btn-map-mapcontrols").addTo(parent.map);

		$("#btn-map-mapcontrols").data({"toggle": "tooltip", "placement": "right", "title": "Map Options"});
		$("#btn-map-mapcontrols").tooltip("show");

        var basemap = new L.TileLayer('http://{s}.tiles.mapbox.com/v3/btsdatavisualisation.map-s6wlfsu2/{z}/{x}/{y}.png').addTo(parent.map);	
		
		/*Temporary label anchor for the map label that appears when hovered over the polygons*/
		parent.tempLabelAnchor = null;
		
		/*Define layers and grids*/
		parent.tempLayer =  L.mapbox.featureLayer().addTo(parent.map);
		parent.radiusSelectionLayer = L.mapbox.featureLayer().addTo(parent.map);
		
		/*Target- and Comparison area layers on the map*/
		parent.comparisonAreaLayer = L.mapbox.featureLayer().addTo(parent.map);
		parent.targetAreaLayer = L.mapbox.featureLayer().addTo(parent.map);
		
		/*Define base layers and utf grids*/
		parent.layers = {
		    "lga": new L.TileLayer('http://52.32.79.80/tiles/tiles.py/lga_900913/{z}/{x}/{y}.png', {minZoom: 4,maxZoom: 18,continuousWorld: true}),
			"gccsa": new L.TileLayer('http://52.32.79.80/tiles/tiles.py/gccsa_900913/{z}/{x}/{y}.png', {minZoom: 4,maxZoom: 18,continuousWorld: true}),
			"suburb": new L.TileLayer('http://52.32.79.80/tiles/tiles.py/suburb_900913/{z}/{x}/{y}.png', {minZoom: 4,maxZoom: 18,continuousWorld: true})
		};
		parent.grids = {
		    "lga": new L.UtfGrid('http://52.32.79.80/tiles/tiles.py/lga_900913_json/{z}/{x}/{y}.json?callback={cb}', {resolution: 4,maxZoom: 18}),
			"gccsa": new L.UtfGrid('http://52.32.79.80/tiles/tiles.py/gccsa_900913_json/{z}/{x}/{y}.json?callback={cb}', {resolution: 4,maxZoom: 18}),
			"suburb": new L.UtfGrid('http://52.32.79.80/tiles/tiles.py/suburb_900913_json/{z}/{x}/{y}.json?callback={cb}', {resolution: 4,maxZoom: 18})
		};
		
		/*Define events for layers and grids*/
	    parent.tempLayer.on("layeradd", function(e){	        
			/*Showing labels while the mouse hovers over the actual polygonal area*/
			e.layer.bindLabel(e.layer.options.name, {"zoomAnimation": false, "noHide": true, "offset": [15,-15]});
			e.layer.showLabel();
	    });
		parent.tempLayer.on("layerremove", function(e){
		    /*Hiding labels before showing another one as the user moves the mouse pointer*/
			e.layer.unbindLabel();
		});
		
		$.each(parent.grids, function(key, value){
		    var name;
			switch(key){
			    case "lga":
				    name = "lga_name";
				break;
				case "gccsa":
				    name = "gccsa_name";
				break;
				case "suburb":
				    name = "suburb_name";
				break;
			}

			parent.grids[key].on('click', function(e){
				/*Condition if the area selection mode is either manual or radius*/
				if(parent.areaSelectionMode == "manual"){
					
					if(!e.data){return false;}
					
					if(e.data.hasOwnProperty("lga_name")){
						e.data.name = e.data[name];
						parent.addSelectedLga(e);
					}
					else if(e.data.hasOwnProperty("gccsa_name")){
						e.data.name = e.data[name];
						parent.addSelectedGccsa(e);
					}
					else if(e.data.hasOwnProperty("suburb_name")){
						e.data.name = e.data[name];
						parent.addSelectedSuburb(e);
					}
                }
                else if(parent.areaSelectionMode == "radius")
				{
				    parent.addAreasWithinRadius(e);
				}
			});
			
            parent.grids[key].on('mousemove', function(e){
				if(!e.data){return false;}		
				parent.tempLabelAnchor = L.marker(e.latlng, {"opacity": 0, "name": e.data[name]});
			    parent.tempLayer.clearLayers();
				parent.tempLayer.addLayer(parent.tempLabelAnchor);
            });	

            parent.grids[key].on('mouseout', function(){		
			    parent.tempLayer.clearLayers();
            });				
		});
	
		parent.render();
	},
	render: function(){
	    var parent = this;

		parent.controlsModal = new TdaControlsModal({"eventBus": parent.eventBus, "parentView": parent, "selectedLayerType": parent.selectedLayerType});

		/*Display LGA layer on startup*/
        parent.layers.lga.addTo(parent.map);					
	    parent.map.addLayer(parent.grids.lga);			
	},
	addAreasWithinRadius: function(e){
	    var parent = this;
		
		parent.eventBus.trigger("switchLoaderOn", "Adding areas within selected radius");

		switch(parent.selectedLayer){
			case "lga":
				/*Add LGAs if LGA is the selected area type*/
				$.get("radius/layer=lga&geocode=" + e.latlng.lat + "," + e.latlng.lng + "&radius=" + parent.radiusAmount, function(data){

					switch(parent.selectedLayerType){
						case "comparison":
							var alreadySelectedFeatures = parent.comparisonAreaLayer.getGeoJSON();
							var properties = {"fill": "#2dbd39", "fill-opacity": 0.5, "stroke-width": 0.5, "stroke": "#000000","areatype": "lga", "arealayer": "comparison"};
							break;
						case "target":
							var alreadySelectedFeatures = parent.targetAreaLayer.getGeoJSON();
							var properties = {"fill": "#FF0000", "fill-opacity": 0.5, "stroke-width": 0.5, "stroke": "#000000", "areatype": "lga", "arealayer": "target"};
							break;
					}

					if(data.length>0){

						switch(parent.selectedLayerType){
							case "comparison":

								if(Object.prototype.toString.call(alreadySelectedFeatures) === '[object Array]'){

									//Determine if there are any items in alreadySelectedFeatures array, then collect their gids in an array to filter the incoming items
									var presentIDs = [];
									$.each(alreadySelectedFeatures, function(index, item){
										presentIDs.push(item.properties.gid);
									});

									for(i=0;i<data.length;i++){
										if(presentIDs.indexOf(parseInt(data[i]["gid"]))==-1) {
											properties = $.extend({}, properties, {"gid": data[i]["gid"], "code": data[i]["code"]});
											alreadySelectedFeatures.push({
												"type": "Feature",
												"properties": properties,
												"geometry": JSON.parse(data[i]['geom'])
											});
											parent.eventBus.trigger("addComparisonArea", new Area({
												"gid": data[i]["gid"],
												"code": data[i]["code"],
												"name": data[i]["name"],
												"areatype": "lga",
												"arealayer": "comparison"
											}));
										}
									}
								}
								else
								{
									alreadySelectedFeatures = [];
									for(i=0;i<data.length;i++){
										properties = $.extend({}, properties, {"gid": data[i]["gid"], "code": data[i]["code"]});
										alreadySelectedFeatures.push({"type": "Feature", "properties": properties,"geometry": JSON.parse(data[i]['geom'])});
										parent.eventBus.trigger("addComparisonArea", new Area({"code": data[i]["code"], "gid": data[i]["gid"], "name": data[i]["name"], "areatype": "lga", "arealayer": "comparison"}));
									}
								}

								parent.comparisonAreaLayer.setGeoJSON(alreadySelectedFeatures);
								parent.addClickEventToComparisonLayer();
								break;
							case "target":

								if(Object.prototype.toString.call(alreadySelectedFeatures) === '[object Array]'){

									//Determine if there are any items in alreadySelectedFeatures array, then collect their gids in an array to filter the incoming items
									var presentIDs = [];
									$.each(alreadySelectedFeatures, function(index, item){
										presentIDs.push(item.properties.gid);
									});

									for(i=0;i<data.length;i++){
										if(presentIDs.indexOf(parseInt(data[i]["gid"]))==-1) {
											properties = $.extend({}, properties, {"gid": data[i]["gid"], "code": data[i]["code"]});
											alreadySelectedFeatures.push({
												"type": "Feature",
												"properties": properties,
												"geometry": JSON.parse(data[i]['geom'])
											});
											parent.eventBus.trigger("addTargetArea", new Area({
												"gid": data[i]["gid"],
												"code": data[i]["code"],
												"name": data[i]["name"],
												"areatype": "lga",
												"arealayer": "target"
											}));
										}
									}
								}
								else
								{
									alreadySelectedFeatures = [];
									for(i=0;i<data.length;i++){
										properties = $.extend({}, properties, {"gid": data[i]["gid"], "code": data[i]["code"]});
										alreadySelectedFeatures.push({"type": "Feature", "properties": properties,"geometry": JSON.parse(data[i]['geom'])});
										parent.eventBus.trigger("addTargetArea", new Area({"code": data[i]["code"],"gid": data[i]["gid"], "name": data[i]["name"],"areatype": "lga", "arealayer": "target"}));
									}
								}

								parent.targetAreaLayer.setGeoJSON(alreadySelectedFeatures);
								parent.addClickEventToTargetLayer();
								break;
						}
					}
					parent.eventBus.trigger("switchLoaderOff");
				});
				break;
			case "gccsa":
				$.get("radius/layer=gccsa&geocode=" + e.latlng.lat + "," + e.latlng.lng + "&radius=" + parent.radiusAmount, function(data){

					switch(parent.selectedLayerType){
						case "comparison":
							var alreadySelectedFeatures = parent.comparisonAreaLayer.getGeoJSON();
							var properties = {"fill": "#2dbd39", "fill-opacity": 0.5, "stroke-width": 0.5, "stroke": "#000000","areatype": "gccsa", "arealayer": "comparison"};
							break;
						case "target":
							var alreadySelectedFeatures = parent.targetAreaLayer.getGeoJSON();
							var properties = {"fill": "#FF0000", "fill-opacity": 0.5, "stroke-width": 0.5, "stroke": "#000000", "areatype": "gccsa", "arealayer": "target"};
							break;
					}

					if(data.length>0){

						switch(parent.selectedLayerType){
							case "comparison":

								if(Object.prototype.toString.call(alreadySelectedFeatures) === '[object Array]'){

									var presentIDs = [];
									$.each(alreadySelectedFeatures, function(index, item){
										presentIDs.push(item.properties.gid);
									});

									for(i=0;i<data.length;i++){
										if(presentIDs.indexOf(parseInt(data[i]["gid"]))==-1) {
											properties = $.extend({}, properties, {"gid": data[i]["gid"], "code": data[i]["code"]});
											alreadySelectedFeatures.push({
												"type": "Feature",
												"properties": properties,
												"geometry": JSON.parse(data[i]['geom'])
											});
											parent.eventBus.trigger("addComparisonArea", new Area({
												"gid": data[i]["gid"],
												"code": data[i]["code"],
												"name": data[i]["name"],
												"areatype": "gccsa",
												"arealayer": "comparison"
											}));
										}
									}
								}
								else
								{
									alreadySelectedFeatures = [];
									for(i=0;i<data.length;i++){
										properties = $.extend({}, properties, {"gid": data[i]["gid"], "code": data[i]["code"]});
										alreadySelectedFeatures.push({"type": "Feature", "properties": properties,"geometry": JSON.parse(data[i]['geom'])});
										parent.eventBus.trigger("addComparisonArea", new Area({"code": data[i]["code"], "gid": data[i]["gid"], "name": data[i]["name"], "areatype": "gccsa", "arealayer": "comparison"}));
									}
								}

								parent.comparisonAreaLayer.setGeoJSON(alreadySelectedFeatures);
								parent.addClickEventToComparisonLayer();
								break;
							case "target":

								if(Object.prototype.toString.call(alreadySelectedFeatures) === '[object Array]'){

									var presentIDs = [];
									$.each(alreadySelectedFeatures, function(index, item){
										presentIDs.push(item.properties.gid);
									});

									for(i=0;i<data.length;i++){
										if(presentIDs.indexOf(parseInt(data[i]["gid"]))==-1) {
											properties = $.extend({}, properties, {"gid": data[i]["gid"], "code": data[i]["code"]});
											alreadySelectedFeatures.push({
												"type": "Feature",
												"properties": properties,
												"geometry": JSON.parse(data[i]['geom'])
											});
											parent.eventBus.trigger("addTargetArea", new Area({
												"gid": data[i]["gid"],
												"code": data[i]["code"],
												"name": data[i]["name"],
												"areatype": "gccsa",
												"arealayer": "target"
											}));
										}
									}
								}
								else
								{
									alreadySelectedFeatures = [];
									for(i=0;i<data.length;i++){
										properties = $.extend({}, properties, {"gid": data[i]["gid"], "code": data[i]["code"]});
										alreadySelectedFeatures.push({"type": "Feature", "properties": properties,"geometry": JSON.parse(data[i]['geom'])});
										parent.eventBus.trigger("addTargetArea", new Area({"code": data[i]["code"],"gid": data[i]["gid"], "name": data[i]["name"],"areatype": "gccsa", "arealayer": "target"}));
									}
								}

								parent.targetAreaLayer.setGeoJSON(alreadySelectedFeatures);
								parent.addClickEventToTargetLayer();
								break;
						}
					}
					parent.eventBus.trigger("switchLoaderOff");
				});
				break;
			case "sub":
				$.get("radius/layer=sub&geocode=" + e.latlng.lat + "," + e.latlng.lng + "&radius=" + parent.radiusAmount, function(data){
					console.log(data);
					switch(parent.selectedLayerType){
						case "comparison":
							var alreadySelectedFeatures = parent.comparisonAreaLayer.getGeoJSON();
							var properties = {"fill": "#2dbd39", "fill-opacity": 0.5, "stroke-width": 0.5, "stroke": "#000000","areatype": "sub", "arealayer": "comparison"};
							break;
						case "target":
							var alreadySelectedFeatures = parent.targetAreaLayer.getGeoJSON();
							var properties = {"fill": "#FF0000", "fill-opacity": 0.5, "stroke-width": 0.5, "stroke": "#000000", "areatype": "sub", "arealayer": "target"};
							break;
					}

					if(data.length>0){

						switch(parent.selectedLayerType){
							case "comparison":

								if(Object.prototype.toString.call(alreadySelectedFeatures) === '[object Array]'){

									//Determine if there are any items in alreadySelectedFeatures array, then collect their gids in an array to filter the incoming items
									var presentIDs = [];
									$.each(alreadySelectedFeatures, function(index, item){
                                        presentIDs.push(item.properties.gid);
									});

									for(i=0;i<data.length;i++){
										if(presentIDs.indexOf(parseInt(data[i]["gid"]))==-1){
											properties = $.extend({}, properties, {"gid": data[i]["gid"], "code": data[i]["code"]});
											alreadySelectedFeatures.push({"type": "Feature", "properties": properties,"geometry": JSON.parse(data[i]['geom'])});
											parent.eventBus.trigger("addComparisonArea", new Area({"code": data[i]["code"], "gid": data[i]["gid"], "name": data[i]["name"],"areatype": "sub", "arealayer": "comparison"}));
										}
									}
								}
								else
								{
									alreadySelectedFeatures = [];
									for(i=0;i<data.length;i++){
										properties = $.extend({}, properties, {"gid": data[i]["gid"], "code": data[i]["code"]});
										alreadySelectedFeatures.push({"type": "Feature", "properties": properties,"geometry": JSON.parse(data[i]['geom'])});
										parent.eventBus.trigger("addComparisonArea", new Area({"code": data[i]["code"],"gid": data[i]["gid"], "name": data[i]["name"],"areatype": "sub", "arealayer": "comparison"}));
									}
								}

								parent.comparisonAreaLayer.setGeoJSON(alreadySelectedFeatures);
								console.log(parent.comparisonAreaLayer.getGeoJSON());
								parent.addClickEventToComparisonLayer();
								break;
							case "target":

								if(Object.prototype.toString.call(alreadySelectedFeatures) === '[object Array]'){

									//Determine if there are any items in alreadySelectedFeatures array, then collect their gids in an array to filter the incoming items
									var presentIDs = [];
									$.each(alreadySelectedFeatures, function(index, item){
										presentIDs.push(item.properties.gid);
									});

									for(i=0;i<data.length;i++){
										if(presentIDs.indexOf(parseInt(data[i]["gid"]))==-1) {
											properties = $.extend({}, properties, {"gid": data[i]["gid"], "code": data[i]["code"]});
											alreadySelectedFeatures.push({
												"type": "Feature",
												"properties": properties,
												"geometry": JSON.parse(data[i]['geom'])
											});
											parent.eventBus.trigger("addTargetArea", new Area({
												"gid": data[i]["gid"],
												"code": data[i]["code"],
												"name": data[i]["name"],
												"areatype": "sub",
												"arealayer": "target"
											}));
										}
									}
								}
								else
								{
									alreadySelectedFeatures = [];
									for(i=0;i<data.length;i++){
										properties = $.extend({}, properties, {"gid": data[i]["gid"], "code": data[i]["code"]});
										alreadySelectedFeatures.push({"type": "Feature", "properties": properties,"geometry": JSON.parse(data[i]['geom'])});
										parent.eventBus.trigger("addTargetArea", new Area({"code": data[i]["code"], "gid": data[i]["gid"], "name": data[i]["name"],"areatype": "sub", "arealayer": "target"}));
									}
								}

								parent.targetAreaLayer.setGeoJSON(alreadySelectedFeatures);
								parent.addClickEventToTargetLayer();
								break;
						}
					}
					parent.eventBus.trigger("switchLoaderOff");
				});
				break;
		}
	},
	detectIfDuplicate: function(code, features){
	    var codes = [];
		for(i=0;i<features.length;i++){
		    codes.push(features[i]["properties"]["code"]);
		}
		if(codes.indexOf(code) > -1){
		    return true;
		}
		else
		{
		    return false;
		}
	},	
	addSelectedLga: function(e){
		var parent = this;				
		
		/*Switching the loader animation on*/
		parent.eventBus.trigger("switchLoaderOn", "Adding LGA to the " + parent.selectedLayerType.charAt(0).toUpperCase() + parent.selectedLayerType.slice(1) + " areas list");
						
		$.get("lga/" + e.data.gid, function(data){									

			switch(parent.selectedLayerType){
				case "comparison":
					var alreadySelectedFeatures = parent.comparisonAreaLayer.getGeoJSON();
					var properties = {
					    "fill": "#2dbd39", 
						"fill-opacity": 0.5,
						"stroke-width": 0.5, 
						"stroke": "#000000",
						"areatype": "lga", 
						"arealayer": "comparison", 
						"code": data[0]["code"], 
						"gid": data[0]['gid']
				    };
				break;
				case "target":
					var alreadySelectedFeatures = parent.targetAreaLayer.getGeoJSON();
					var properties = {
					    "fill": "#FF0000", 
						"fill-opacity": 0.5, 
						"stroke-width": 0.5, 
						"stroke": "#000000", 
						"areatype": "lga", 
						"arealayer": "target", 
						"code": data[0]["code"],  
						"gid": data[0]['gid']
					};
				break;
			}													

			if(Object.prototype.toString.call(alreadySelectedFeatures) === '[object Array]'){
				if(!parent.detectIfDuplicate(properties.code, alreadySelectedFeatures)){
				    alreadySelectedFeatures.push({"type": "Feature", "properties": properties,"geometry": JSON.parse(data[0]['geom'])});
				}
                else
				{
				    console.log("The same area cannot be added twice.");
					parent.eventBus.trigger("switchLoaderOff");
					return;
				}
			}
			else
			{
				alreadySelectedFeatures = [];
				alreadySelectedFeatures.push({"type": "Feature", "properties": properties,"geometry": JSON.parse(data[0]['geom'])});								
			}
							
			switch(parent.selectedLayerType){
				case "comparison":
					parent.comparisonAreaLayer.setGeoJSON(alreadySelectedFeatures);

					//Remove and add click events to all items in the feature class
					parent.addClickEventToComparisonLayer();
					parent.eventBus.trigger("comparisonAreaAdd", new Area({"gid": data[0]["gid"], "name": data[0]["lga_name11"], "areatype": "lga", "arealayer": "comparison", "code": data[0]["code"]}));
				break;
				case "target":
					parent.targetAreaLayer.setGeoJSON(alreadySelectedFeatures);

					//Remove and add click events to all items in the feature class
					parent.addClickEventToTargetLayer();
					parent.eventBus.trigger("targetAreaAdd", new Area({"gid": data[0]["gid"], "name": data[0]["lga_name11"], "areatype": "lga", "arealayer": "target", "code": data[0]["code"]}));
				break;
			}							
			
			parent.eventBus.trigger("switchLoaderOff");
		});	
	},
	addSelectedGccsa: function(e){
		var parent = this;
		
		parent.eventBus.trigger("switchLoaderOn", "Adding GCCSA to the " + parent.selectedLayerType.charAt(0).toUpperCase() + parent.selectedLayerType.slice(1) + " areas list");
						
						$.get("gccsa/" + e.data.gid, function(data){

							switch(parent.selectedLayerType){
								case "comparison":
									var alreadySelectedFeatures = parent.comparisonAreaLayer.getGeoJSON();
									var properties = {"fill": "#2dbd39", "fill-opacity": 0.5, "stroke-width": 0.5, "stroke": "#000000", "areatype": "gccsa", "arealayer": "comparison", "gid": data[0]['gid'], "code": data[0]["code"]};
								break;
								case "target":
								    var alreadySelectedFeatures = parent.targetAreaLayer.getGeoJSON();
									var properties = {"fill": "#FF0000", "fill-opacity": 0.5, "stroke-width": 0.5, "stroke": "#000000", "areatype": "gccsa", "arealayer": "target", "gid": data[0]['gid'], "code": data[0]["code"]};
								break;
							}							
							
							if(Object.prototype.toString.call(alreadySelectedFeatures) === '[object Array]'){
							    if(!parent.detectIfDuplicate(properties.code, alreadySelectedFeatures)){
				                    alreadySelectedFeatures.push({"type": "Feature", "properties": properties,"geometry": JSON.parse(data[0]['geom'])});
				                }
                                else
				                {
				                    console.log("The same area cannot be added twice.");
					                parent.eventBus.trigger("switchLoaderOff");
					                return;
				                }
							}
							else
							{
							    alreadySelectedFeatures = [];
								alreadySelectedFeatures.push({"type": "Feature", "properties": properties,"geometry": JSON.parse(data[0]['geom'])});
							}
							
							switch(parent.selectedLayerType){
							    case "comparison":
								    parent.comparisonAreaLayer.setGeoJSON(alreadySelectedFeatures);
									//Remove and add click events to all items in the feature class
									parent.addClickEventToComparisonLayer();
									parent.eventBus.trigger("comparisonAreaAdd", new Area({"gid": data[0]["gid"], "name": data[0]["gcc_name11"], "areatype": "gccsa", "arealayer": "comparison", "code": data[0]["code"]}));
								break;
								case "target":
								    parent.targetAreaLayer.setGeoJSON(alreadySelectedFeatures);
									//Remove and add click events to all items in the feature class
									parent.addClickEventToTargetLayer();
									parent.eventBus.trigger("targetAreaAdd", new Area({"gid": data[0]["gid"], "name": data[0]["gcc_name11"], "areatype": "gccsa", "arealayer": "target", "code": data[0]["code"] }));
								break;
							}	
							
							parent.eventBus.trigger("switchLoaderOff");
						});	
	},
	addSelectedSuburb: function(e){
		var parent = this;			    
		
		parent.eventBus.trigger("switchLoaderOn", "Adding SUBURB to the " + parent.selectedLayerType.charAt(0).toUpperCase() + parent.selectedLayerType.slice(1) + " areas list");
						
		$.get("suburb/" + e.data.gid, function(data){
							
			switch(parent.selectedLayerType){
				case "comparison":
					var alreadySelectedFeatures = parent.comparisonAreaLayer.getGeoJSON();
					var properties = {"fill": "#2dbd39", "fill-opacity": 0.5, "stroke-width": 0.5, "stroke": "#000000", "gid": data[0]['gid'], "areatype": "suburb", "arealayer": "comparison", "code": data[0]["code"]};
				break;
				case "target":
					var alreadySelectedFeatures = parent.targetAreaLayer.getGeoJSON();
					var properties = {"fill": "#FF0000", "fill-opacity": 0.5,"stroke-width": 0.5, "stroke": "#000000", "gid": data[0]['gid'], "areatype": "suburb", "arealayer": "target", "code": data[0]["code"]};
				break;
			}	
							
			if(Object.prototype.toString.call(alreadySelectedFeatures) === '[object Array]'){
				if(!parent.detectIfDuplicate(properties.code, alreadySelectedFeatures)){
				    alreadySelectedFeatures.push({"type": "Feature", "properties": properties,"geometry": JSON.parse(data[0]['geom'])});
				}
                else
				{
				    console.log("The same area cannot be added twice.");
					parent.eventBus.trigger("switchLoaderOff");
					return;
				}
			}
			else
			{
			    alreadySelectedFeatures = [];
				alreadySelectedFeatures.push({"type": "Feature", "properties": properties ,"geometry": JSON.parse(data[0]['geom'])});
			}
							
			switch(parent.selectedLayerType){
			    case "comparison":
					parent.comparisonAreaLayer.setGeoJSON(alreadySelectedFeatures);
					//Remove and add click events to all items in the feature class
					parent.addClickEventToComparisonLayer();
					parent.eventBus.trigger("comparisonAreaAdd", new Area({"gid": data[0]["gid"], "name": data[0]["ssc_name"], "areatype": "suburb", "arealayer": "comparison", "code": data[0]["code"]}));
				break;
				case "target":
					parent.targetAreaLayer.setGeoJSON(alreadySelectedFeatures);
					//Remove and add click events to all items in the feature class
					parent.addClickEventToTargetLayer();
					parent.eventBus.trigger("targetAreaAdd", new Area({"gid": data[0]["gid"], "name": data[0]["ssc_name"], "areatype": "suburb", "arealayer": "target", "code": data[0]["code"]}));
				break;
			}	
							
			parent.eventBus.trigger("switchLoaderOff");
		});		
	},
	deleteSelectedArea: function(e){
		var parent = this;
		var areaGID = e.target.feature.properties.gid;
		var areaLayer = e.target.feature.properties.arealayer;
		var areaType = e.target.feature.properties.areatype;

		if(areaLayer == "comparison"){
			parent.comparisonAreaLayer.eachLayer(function(layer){
				if(layer.feature.properties.gid == areaGID) {
					parent.map.removeLayer(layer);
					console.log("Selected " + areaLayer + " area [" + areaType + "] successfully removed from the map");
				}
			});
			/*Delete the LGA item from the comparisonLayer feature class*/
			parent.deleteItemFromComparisonLayer(e);
		}
		else if(areaLayer = "target"){
			parent.targetAreaLayer.eachLayer(function(layer){

				if(layer.feature.properties.gid == areaGID) {
					parent.map.removeLayer(layer);
					console.log("Selected " + areaLayer + " area successfully removed from the map");
				}
			});
			/*Delete the LGA item from the comparisonLayer feature class*/
			parent.deleteItemFromTargetLayer(e);

		}
	},
	activeLayerChange: function(type){
	    var parent = this;
		switch(type){
		    case "target":
			    parent.selectedLayerType = type;
			break;
			case "comparison":
			    parent.selectedLayerType = type;
			break;
			default:
			    parent.selectedLayerType = "target";
		}
	},
	clearTargetLayer: function(){
		var parent = this;
		if (parent.targetAreaLayer instanceof L.mapbox.FeatureLayer) {                                           
			parent.targetAreaLayer.clearLayers();
			parent.targetAreaLayer = L.mapbox.featureLayer().addTo(parent.map);											
        } else {
            parent.targetAreaLayer = L.mapbox.featureLayer().addTo(parent.map);									
        }		
	},
	clearComparisonLayer: function(){
		var parent = this;
		if (parent.comparisonAreaLayer instanceof L.mapbox.FeatureLayer) {                                           
			parent.comparisonAreaLayer.clearLayers();
			parent.comparisonAreaLayer = L.mapbox.featureLayer().addTo(parent.map);											
        } else {
            parent.comparisonAreaLayer = L.mapbox.featureLayer().addTo(parent.map);									
        }		
	},	
    deleteItemFromComparisonLayer: function(e){
        var parent = this;
		var geojson = parent.comparisonAreaLayer.getGeoJSON();
		var newGeojson = [];
		$.each(geojson, function(index, item){
			if(item.properties.gid != e.target.feature.properties.gid) {
			    newGeojson.push(item);
			}
		});
		parent.comparisonAreaLayer.setGeoJSON(newGeojson);
		parent.addClickEventToComparisonLayer();

		/*Remove area from dropdown list*/
		parent.eventBus.trigger("removeComparisonArea", e.target.feature.properties.gid);
	},
	deleteItemFromTargetLayer: function(e){
		var parent = this;
		var geojson = parent.targetAreaLayer.getGeoJSON();
		var newGeojson = [];
		$.each(geojson, function(index, item){
			if(item.properties.gid != e.target.feature.properties.gid) {
				newGeojson.push(item);
			}
		});
		parent.targetAreaLayer.setGeoJSON(newGeojson);
		parent.addClickEventToTargetLayer();

		/*Remove area from dropdown list*/
		parent.eventBus.trigger("removeTargetArea", e.target.feature.properties.gid);
	},
	addClickEventToComparisonLayer: function(){
		var parent = this;
		parent.comparisonAreaLayer.eachLayer(function(layer){
			layer.clearAllEventListeners();
			layer.on("click", function(e) {
				parent.deleteSelectedArea(e);
			});
		});
	},
	addClickEventToTargetLayer: function(category){
		var parent = this;
		parent.targetAreaLayer.eachLayer(function(layer){
			layer.clearAllEventListeners();
			layer.on("click", function(e) {
				parent.deleteSelectedArea(e);
			});
		});
	},
	toggleAreaSelectionMode: function(){
	    var parent = this;
		if(parent.areaSelectionMode == "manual"){
		    parent.areaSelectionMode = "radius";		
			return false;
		}
		if(parent.areaSelectionMode == "radius"){
		    parent.areaSelectionMode = "manual";
			return false;
		}		
	},
    setRadiusValue: function(radius){
	    var parent = this;
		parent.radiusAmount = parseInt(radius);
	},
	setSelectedLayer: function(layername) {
        var parent = this;
		parent.selectedLayer = layername;
	}
});

var TdaLayerSwitchModal = Backbone.View.extend({
	el: "body",
	template: _.template($("#tpl_tda_layerswitch_modal").html()),
	initialize: function(options){
	    var parent = this;
		parent.eventBus = options.eventBus;
		parent.callback = options.callback;
		parent.render();
	},
	render: function(){
	    var parent = this;
		parent.$el.append(parent.template());
		return parent;
	},
	showModal: function(callback){
	    var parent = this;
		parent.callback = callback;
		parent.$el.find("#layerSwitchModal").modal("show");
	},
	doCallback: function(callback){
	    var parent = this;
		parent.callback();
		parent.$el.find("#layerSwitchModal").modal('toggle');
	},
	events:{
	    "click #btn_layerchange_yes": "doCallback"
	}
});

var TdaControlsModal = Backbone.View.extend({
	el: "body",
	template: _.template($("#tpl_control_modal").html()),
	initialize: function(options){
		var parent = this;
		parent.eventBus = options.eventBus;
		parent.parentView = options.parentView;
		parent.selectedLayerType = options.selectedLayerType;
		parent.initialLoad = true;
		parent.layerSwitchModal = new TdaLayerSwitchModal({"eventBus": parent.eventBus});

		parent.render();
	},
	render: function(){
		var parent = this;
		parent.$el.append(parent.template({"layerType": parent.selectedLayerType}));
		return parent;
	},
	attachModalEvents: function(){
	        var parent = this;
	
			//Wire selected group change event target vs. comparison
			parent.$el.find("#selectedGroup").on("change", function(){
				parent.eventBus.trigger("activeLayerChange", $(this).val());
			});

			parent.$el.find("#selectedLayer").on("change", function(e){

				//Transfer the results of the layer selection as string to the main map view
				parent.eventBus.trigger("setSelectedLayer", $(this).val());

				switch($(this).val()){
					case "lga":
						parent.$el.find("#mapControlsModal").modal('hide');
						parent.layerSwitchModal.showModal(function(){
							switch(parent.parentView.selectedLayerType){
								case "target":
									parent.eventBus.trigger("clearTargetLayer");
									parent.eventBus.trigger("removeTargetAreas");

									break;
								case "comparison":
									parent.eventBus.trigger("clearComparisonLayer");
									parent.eventBus.trigger("removeComparisonAreas");
									break;
							}

							parent.removeLayers();
							parent.parentView.layers.lga.addTo(parent.parentView.map);
							parent.parentView.map.addLayer(parent.parentView.grids.lga);
						});
						break;
					case "sub":
						parent.$el.find("#mapControlsModal").modal('hide');
						parent.layerSwitchModal.showModal(function(){
							switch(parent.parentView.selectedLayerType){
								case "target":
									parent.eventBus.trigger("clearTargetLayer");
									parent.eventBus.trigger("removeTargetAreas");

									break;
								case "comparison":
									parent.eventBus.trigger("clearComparisonLayer");
									parent.eventBus.trigger("removeComparisonAreas");
									break;
							}

							parent.removeLayers();
							parent.parentView.layers.suburb.addTo(parent.parentView.map);
							parent.parentView.map.addLayer(parent.parentView.grids.suburb);
						});
						break;
					case "gccsa":
						parent.$el.find("#mapControlsModal").modal('hide');
						parent.layerSwitchModal.showModal(function(){
							switch(parent.parentView.selectedLayerType){
								case "target":
									parent.eventBus.trigger("clearTargetLayer");
									break;
								case "comparison":
									parent.eventBus.trigger("clearComparisonLayer");
									break;
							}

							parent.removeLayers();
							parent.parentView.layers.gccsa.addTo(parent.parentView.map);
							parent.parentView.map.addLayer(parent.parentView.grids.gccsa);
						});
						break;
				}
			});

			parent.$el.find("#btn-radiusmode-toggle").on("click", function(){
				var $i = $(this).find("i");
				$i.toggleClass("fa-toggle-off fa-toggle-on");
				
				if($i.hasClass("fa-toggle-off")){
					//Switch radius mode on
					parent.eventBus.trigger("toggleAreaSelectionMode");
				}
				else if($i.hasClass("fa-toggle-on")){
					//Switch radius mode off
					parent.eventBus.trigger("toggleAreaSelectionMode");
				}
			});

			parent.$el.find("#selectedRadius").on("change", function(e){
				parent.eventBus.trigger("setRadiusValue", $(this).val());
			});

			//The autocomplete part
			parent.$el.find("#field-autocomplete").on("focus", function(){
				$(this).val('');
			});

			parent.autoCompleteField = new google.maps.places.Autocomplete(parent.$el.find("#field-autocomplete").get(0));

			parent.autoCompleteField.addListener("place_changed", function(){
				var returnedPlace = this.getPlace();

				parent.parentView.map.setView([Number(returnedPlace.geometry.location.lat()), Number(returnedPlace.geometry.location.lng())]);
			});
	
	},
	showModal: function(){
		var parent = this;
		parent.$el.find("#mapControlsModal").modal("show");
	},
	removeLayers: function(){
        var parent = this;
		parent.parentView.map.removeLayer(parent.parentView.layers.lga);
		parent.parentView.map.removeLayer(parent.parentView.grids.lga);
		parent.parentView.map.removeLayer(parent.parentView.layers.suburb);
		parent.parentView.map.removeLayer(parent.parentView.grids.suburb);
		parent.parentView.map.removeLayer(parent.parentView.layers.gccsa);
		parent.parentView.map.removeLayer(parent.parentView.grids.gccsa);
	},
	events: {
        "shown.bs.modal #mapControlsModal":"attachModalEvents"
	}
});

var TdaResultsView = Backbone.View.extend({
    el: "#accordion",
	template: _.template($("#tpl_tda_collapsible_results").html()),
	initialize: function(options){
	    var parent = this;
		parent.eventBus = options.eventBus;	
		return parent;
	},
	render: function(data){
	    var parent = this;
		parent.$el.html(parent.template({"comparison": data.comparison, "target": data.target}));
	},
	events: {
	
	}
});

var TdaMainView = Backbone.View.extend({
    el: "#dataapp-main",
	template: _.template($("#tpl_tda_main").html()),
	initialize: function(options){
	    var parent = this;
		parent.eventBus = options.eventBus;	
		parent.eventBus.on("switchLoaderOn", parent.loaderOn, parent);
		parent.eventBus.on("switchLoaderOff", parent.loaderOff, parent);
        parent.eventBus.on("resultsReceived", parent.renderResults, parent);		
		parent.render();
	},
	render: function(){
	    var parent = this;		
		parent.$el.html(parent.template());
		parent.views = {
		    "map": new TdaMapView({"eventBus": parent.eventBus}),
			"loader": new TdaLoaderView({"eventBus": parent.eventBus}),
			"controlbar": new TdaControlBarView({"eventBus": parent.eventBus}),
			"resultsbar": new TdaResultsView({"eventBus": parent.eventBus})
		};			
		
		return parent.$el;
	},
	loaderOn: function(text){
	    var parent = this;
		parent.views.loader.$el.find("#loader-text").html(text);
		parent.views.loader.$el.show();
	},
	loaderOff: function(){
	    var parent = this;
		parent.views.loader.$el.hide();
	},
	renderResults: function(data){
	    console.log(data);
		var parent = this;
		parent.views.resultsbar.render(data);
	}
});

var TdaControlBarView = Backbone.View.extend({
    el: "#dataapp-control-bar",
	template: _.template($("#tpl_tda_controlbar").html()),
	initialize: function(options){
	    var parent = this;
		parent.eventBus = options.eventBus;
		parent.targetAreasList = new AreaList();
		parent.comparisonAreasList = new AreaList();		
		parent.targetAreasList.on("change", parent.refreshCompArCount, parent);
		parent.comparisonAreasList.on("change", parent.refreshTargArCount, parent);
		parent.views = {
		    "targetList": new TdaTargetAreaListModal({"eventBus": parent.eventBus, "targetAreasList": parent.targetAreasList}),
			"comparisonList": new TdaComparisonAreaListModal({"eventBus": parent.eventBus, "comparisonAreasList": parent.comparisonAreasList})
		};
		parent.eventBus.on("comparisonAreaAdd", parent.addComparisonArea, parent);	
		parent.eventBus.on("removeComparisonArea", parent.removeComparisonArea, parent);
		parent.eventBus.on("targetAreaAdd", parent.addTargetArea, parent);	
		parent.eventBus.on("removeTargetArea", parent.removeTargetArea, parent);
		parent.compCt = 0;
		parent.targCt = 0;
		parent.render();
	},
	render: function(){
	    var parent = this;
		console.log("Rendering control bar", [parent.compCt, parent.targCt]);
		parent.$el.html(parent.template({"compCt": parent.compCt, "targCt": parent.targCt}));
		return parent.$el;
	},
	addComparisonArea: function(area){
		var parent = this;
		parent.comparisonAreasList.add(area);
        parent.refreshCompArCount();
	},	
	removeComparisonArea: function(gid){
        var parent = this;
		parent.comparisonAreasList.each(function(area) {
			if (typeof area != "undefined") {
			    if (area.get("gid") == gid) {
					parent.comparisonAreasList.remove(area);
					refreshCompArCount();
			    }
		    }
		});
	},	
	addTargetArea: function(area){
		var parent = this;
		parent.targetAreasList.add(area);
		parent.refreshTargArCount();
	},
	removeTargetArea: function(gid){
		var parent = this;
		parent.targetAreasList.each(function(area) {
			if (typeof area != "undefined") {
				if (area.get("gid") == gid) {
					parent.targetAreasList.remove(area);
					parent.refreshTargArCount();
				}
			}
		});
	},
	openComparisonList: function(){
	    var parent = this;
        parent.views.comparisonList.showModal();
	},
	openTargetList: function(){
	    var parent = this;    
		parent.views.targetList.showModal();
	},
	refreshCompArCount: function() {
        var parent = this;
		parent.compCt = parent.comparisonAreasList.length;
		parent.render();
		parent.prepareAndSendAreaCodes();
	},
	refreshTargArCount: function(){
        var parent = this;
		parent.targCt = parent.targetAreasList.length;
		parent.render();
		
		parent.prepareAndSendAreaCodes();
	},
	clearAllComparisonAreas: function(){
        var parent = this;
		parent.eventBus.trigger("removeComparisonAreas");
		parent.eventBus.trigger("clearComparisonLayer");
	},
	clearAllTargetAreas: function(){
        var parent = this;
		parent.eventBus.trigger("removeTargetAreas");
		parent.eventBus.trigger("clearTargetLayer");
	},
	prepareAndSendAreaCodes: function(){
		var parent = this;
		var targetAreaCodes = []; 
		var comparisonAreaCodes = [];
		
		parent.targetAreasList.each(function(targetArea){
		    targetAreaCodes.push({"type": targetArea.get("areatype"), "code": targetArea.get("code")});
		});
		parent.comparisonAreasList.each(function(comparisonArea){
		    comparisonAreaCodes.push({"type": comparisonArea.get("areatype"), "code": comparisonArea.get("code")});
		});		
		
		if(parent.targetAreasList.length > 0 && parent.comparisonAreasList.length > 0){			
			$.get("aggregate/" + encodeURIComponent(JSON.stringify(comparisonAreaCodes)) + "/" + encodeURIComponent(JSON.stringify(targetAreaCodes)), function(data){
				if(data.hasOwnProperty("stats")){
				    parent.eventBus.trigger("resultsReceived",data.stats);
				}	
			});
		}			
	},
	events: {
	    "click #btn-toggle-target": "openTargetList",
		"click #btn-toggle-comparison": "openComparisonList",
		"click #btn_comparison_clearall": "clearAllComparisonAreas",
		"click #btn_target_clearall": "clearAllTargetAreas"
	}
});

var TdaComparisonListView = Backbone.View.extend({
	template: _.template($("#tpl_comparison_list").html()),
	initialize: function(options){
	    var parent = this;
		parent.eventBus = options.eventBus;
        parent.comparisonAreasList = options.comparisonAreasList;	
		parent.render();
	},	
	render: function(){
	    var parent = this;
		parent.$el.html(parent.template({"areas": parent.comparisonAreasList.toJSON()}));
		return parent;
	},
	events: {}
});

var TdaComparisonAreaListModal = Backbone.View.extend({
    el: "body",
	template: _.template($("#tpl_comparison_list_modal").html()),
	initialize: function(options){
	    var parent = this;
		parent.eventBus = options.eventBus;
		parent.comparisonAreasList = options.comparisonAreasList;
		parent.listview = new TdaComparisonListView({"eventBus": parent.eventBus, "comparisonAreasList": parent.comparisonAreasList});
		parent.eventBus.on("removeComparisonArea", parent.removeArea, parent);
		parent.eventBus.on("removeComparisonAreas", parent.removeAreas, parent);		
		parent.render();
	},
	render: function(){
	    var parent = this;
		parent.$el.append(parent.template());		
		return parent;
	},
    removeAreas: function(){
	    var parent = this;
		parent.comparisonAreasList.reset();
    },		
	showModal: function(){
		var parent = this;
		parent.$el.find("#comparisonListModal").modal("show");
	},	
	updateDisplayedContent: function(){
		var parent = this;
		parent.$el.find("#tda_comparison_list").html(parent.listview.render().$el);
	},	
	events: {
	    "shown.bs.modal #comparisonListModal":"updateDisplayedContent"
	}
});

var TdaTargetListView = Backbone.View.extend({
    //el: "#tda_target_list",
	template: _.template($("#tpl_target_list").html()),
	initialize: function(options){
	    var parent = this;
		parent.eventBus = options.eventBus;
        parent.targetAreasList = options.targetAreasList;		
		parent.render();
	},
	render: function(){
	    var parent = this;
		parent.$el.html(parent.template({"areas": parent.targetAreasList.toJSON()}));
		return parent;
	},
	events: {}
});

var TdaTargetAreaListModal = Backbone.View.extend({
    el: "body",
	template: _.template($("#tpl_target_list_modal").html()),
	initialize: function(options){
	    var parent = this;
		parent.eventBus = options.eventBus;
		parent.targetAreasList = options.targetAreasList;
        parent.listview = new TdaTargetListView({"eventBus": parent.eventBus, "targetAreasList": parent.targetAreasList});						
		parent.render();
	},
	render: function(){
	    var parent = this;
		parent.$el.append(parent.template());
		return parent;
	},
	removeAreas: function(){
		var parent = this;
		parent.targetAreasList.reset();
	},	
	showModal: function(){
		var parent = this;
		parent.$el.find("#targetListModal").modal("show");
	},	
	updateDisplayedContent: function(){
	    //alert("Target");
		var parent = this;
		parent.$el.find("#tda_target_list").html(parent.listview.render().$el);
	},
	events: {
	    "shown.bs.modal #targetListModal":"updateDisplayedContent"
	}
});