

Ext.define('MyPath.mappanel',{
	extend:'GeoExt.panel.Map',
	alias:'Widget.mappanel',	
	title: "Philippine Geoportal - Tourism",   			
	layout:'border',	
	region:'center',
	width:100,
	height:100,
	selLayer:'',		
	execUrl:function(url, callback){
		Ext.Ajax.request({
				url:url,
				success: function(response){
					var obj = Ext.decode(response.responseText);					
					callback(obj)		
				}			
			});	
	
	},
	gCode:function(addr, callback){	  
				var geocoder = new google.maps.Geocoder();					
				geocoder.geocode({ 'address': addr }, function (results, status) {					
					if (status == google.maps.GeocoderStatus.OK) {		
						var xx=results[0].geometry.location.lng();			
						var yy=results[0].geometry.location.lat();		
						SourceDest={a:xx, b:yy};							
					}else{
						console.log("Geocoding failed: " + status); 
						Ext.Msg.alert("Geocoding failed", "Please enter location")
					}				
					callback(SourceDest);	
				})		
			},
	
	buildItems:function(){
		return[			
			{	
				xtype:'radiofield',
				boxLabel:'Use current location',
				name:'rb',				
				itemId:'rbt1',								
				checked: true,		
				inputValue:'1',	
				handler:function(){					
					var me=this.up();		
					me.getComponent('btnGo').setDisabled(this.checked);
					me.getComponent('Search').setDisabled(this.checked);						
				}		
			},			
			{
				xtype:'radiofield',
				boxLabel:'Location Search',	
				name:'rb',					
				itemId:'rbt2',								
				checked: false,		
				inputValue:'2',	
			},
			{
				xtype:'textfield',
				itemId:'Search',
				width:200,
				emptyText:'Search',
				disabled:true,
					
            },{
				xtype:'button',
				text:'Go',
				itemId:'btnGo',
				disabled:true,
				handler:function(){				
						
					var me=this.up();				
					var findThis = (me.getComponent('Search').getValue());					
					var me=this.up().up();					
					if  (me.map.getLayersByName('My Location').length > 0) {				
						me.map.getLayersByName('My Location')[0].destroy();					
					};	 				
					
					me.gCode(findThis, function(coord){					
						if  (me.map.getLayersByName('Gcode').length > 0) {				
							me.map.getLayersByName('Gcode')[0].destroy();					
						};		 				
						var currLoc = new OpenLayers.Geometry.Point(coord.a,coord.b).transform('EPSG:4326','EPSG:900913');
						var Location = new OpenLayers.Layer.Vector(	'Gcode', {
								 styleMap: new OpenLayers.StyleMap({'default':{										
										externalGraphic: "/app/chooser/icons/marker.png",				
										graphicYOffset: -25,
										graphicHeight: 35,
										graphicTitle: findThis
								}}), 	
								displayInLayerSwitcher: false,		
							});							
						Location.addFeatures([new OpenLayers.Feature.Vector(currLoc)]);						
						me.map.addLayer(Location);						
						me.map.zoomToExtent(Location.getDataExtent());			 		
					})						
				}			
			},{			
				xtype:'button',
				text:'Max Extent',
				handler:function(){
					var me=this.up().up();				
					me.map.zoomToMaxExtent();		
					
				}		
			
			}
		]	
	},
	
	
	
	initComponent:function(){		
	
		var popup, me=this 			
		map = new OpenLayers.Map(				
				{ 
				controls: [
					new OpenLayers.Control.Navigation(),					
					new OpenLayers.Control.Zoom(),
					new OpenLayers.Control.MousePosition(),				
				],
				
				fallThrough: true,							
				projection: 'EPSG:900913'
				
		});		
		        
       var pgp_basemap_cache = new OpenLayers.Layer.NAMRIA(
				'NAMRIA Basemap',
				'http://202.90.149.252/ArcGIS/rest/services/Basemap/PGS_Basemap/MapServer',
				{
					isBaseLayer: true,
					displayInLayerSwitcher: false,				
				}
		);
			
		map.addLayers([pgp_basemap_cache]);		
		map.zoomToMaxExtent()		
		//console.log(map.maxExtent.transform('EPSG:900913','EPSG:4326'))
		
		
			//
			
		 	
			var bounds = new google.maps.LatLngBounds(
			    new google.maps.LatLng(-1.9551875704852737,106.82006796874998), 
			    new google.maps.LatLng(23.704893827362255,141.97631796874998)		
				
			); 
			
			var request = {
				bounds:bounds,
				//location:pyrmont,
				query:'hotels',								
				//radius: '50000',				
				//keyword:'hotel', 
				
		
			};
				
			
			var service = new google.maps.places.PlacesService(map.div);
			
			service.textSearch(request, function callback(results, status, pagination){						
					
					 if (status == google.maps.places.PlacesServiceStatus.OK) {																		
						//me.createMarker(results);						
					 }
					
					console.log(results)
				    if(pagination.hasNextPage) {
						pagination.nextPage();								
					} 					  
					
					console.log(results);					
			});	
		
		//
		
		map.events.register('click', map, function(e){			
			if (map.layers.length > 1) {
				if  (map.layers.length>2) {
					var mapIndex=map.layers.length-2
				}else{
					mapIndex=1				
				}					
				
				var topLayer = map.layers[mapIndex].params.LAYERS									
				var url = "http://localhost:3000/geoserver.namria.gov.ph/geoserver/geoportal/wms" 
						  + "?REQUEST=GetFeatureInfo"
						  + "&EXCEPTIONS=application/vnd.ogc.se_xml"
						  + "&SERVICE=WMS&VERSION=1.1.1"
						  + "&BBOX=" + map.getExtent().toBBOX()
						  + "&X=" + e.xy.x
						  + "&Y=" + e.xy.y
						  + "&INFO_FORMAT=application/json"					  
						  + "&QUERY_LAYERS=" + topLayer
						  + "&LAYERS=" + topLayer
						  + "&FEATURE_COUNT=10"
						  + "&SRS=EPSG:900913"
						  + "&STYLES="
						  + "&WIDTH=" + map.size.w
						  + "&HEIGHT=" + map.size.h;
				
						me.execUrl(url, function(callback){		
								console.log(callback);	
								if (callback.features.length > 0){							
									var pos =  e.xy									
									if (popup) {
										popup.close();
									}
									popup = Ext.create('GeoExt.window.Popup', {
										title: "Feature Information",
										location: pos,
										map:map,	
										width: 300,	
										height:150,							
										items: {
											xtype:'propertygrid',
											source:callback.features[0].properties,
											hideHeaders: false,
											sortableColumns: false
										},
										autoScroll: true
									})
									popup.show();
								}	
									
						})	
					
			}
		});  
		
		Ext.apply(this, {
			map:map,
			dockedItems: [
				{ xtype: 'toolbar',
				  dock: 'top',
				  items: this.buildItems(),
				}
			]			
		});		
		this.callParent();   
    }	
	
	
});


