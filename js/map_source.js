'use strict';

// Browserify require commands to import libraries
var L = require('../_includes/vendor/js/leaflet.js');
require('../_includes/vendor/js/leaflet-providers.js');
var $ = require('../_includes/vendor/js/jquery.js');
require('../_includes/vendor/js/leaflet.markercluster.js');
var leafletPiP = require('leaflet-pip');

$(document).ready(function() {

function toProperCase(s)
{
    return s.toLowerCase().replace(/^(.)|\s(.)/g,
        function($1) { return $1.toUpperCase(); });
}

function onEachFeature(feature, layer) {
    if (feature.properties && feature.properties.premise_name) {
        layer.bindPopup(toProperCase(feature.properties.premise_name) + "<br>" + toProperCase(feature.properties.premise_address1));
    }
}

function checkPointInDurham(point) {
    var match = leafletPiP.pointInLayer(point.geometry.coordinates, durhamLayer, true);
    if (match.length > 0) {
        return true;
    }
    else {
        return false;
    }
}

function addRestaurants(data) {
    var markers = new L.MarkerClusterGroup({
        showCoverageOnHover: false,
        disableClusteringAtZoom: 15,
        maxClusterRadius: 40,
        singleMarkerMode: true
    });

    var geoLayer = L.geoJson(data, {
        onEachFeature: onEachFeature,
        filter: checkPointInDurham
    })
    markers.addLayer(geoLayer);
    markers.addTo(map);
}

function addDurham(data) {
    durhamLayer = L.geoJson(data);
    // durhamLayer.addTo(map);
    $.getJSON("js/inactive_restaurants_durham.geojson", addRestaurants);
    map.fitBounds(durhamLayer.getBounds());
}


    var map = L.map('map');
    L.Icon.Default.imagePath = "images";
    var durhamLayer;
    var tiles = L.tileLayer.provider('Stamen.Watercolor');
    tiles.addTo(map);
    map.setView([35.9908385, -78.9005222], 15);

    $.getJSON("js/durham.geojson", addDurham);
});