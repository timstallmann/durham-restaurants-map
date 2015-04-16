'use strict';

// Browserify require commands to import libraries
var L = require('../_includes/vendor/js/leaflet.js');
require('../_includes/vendor/js/leaflet-providers.js');
require('../_includes/vendor/js/leaflet.markercluster.js');
var leafletPiP = require('leaflet-pip');

$(document).ready(function() {

    function toProperCase(s)
    {
        return s.toLowerCase().replace(/^(.)|\s(.)/g,
            function($1) { return $1.toUpperCase(); });
    }

    function bindRestaurantPopup(feature, layer) {
        if (feature.properties && feature.properties.premise_name) {
            layer.bindPopup(toProperCase(feature.properties.premise_name) + "<br>" + toProperCase(feature.properties.premise_address1));
        }
    }

    function showRestaurantMarker(data, latlng) {
        var restaurantIcon = new L.divIcon({ className: "restaurant-icon" });
        return L.marker(latlng, { icon: restaurantIcon }).addTo(map);
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

        var geoLayer = L.geoJson(data, {
            pointToLayer: showRestaurantMarker,
            onEachFeature: bindRestaurantPopup,
            filter: checkPointInDurham
        });

        geoLayer.addTo(map);
    }

    // Scale marker size with map zoom
    function resizeMarkers(event) {
        var curZoom = map.getZoom();

        if (curZoom <= 10) {
            document.body.className = "zoom-10";
        }
        else {
            document.body.className = "zoom-" + curZoom;
        }

    }

    function addDurham(data) {
        durhamLayer = L.geoJson(data);
        // durhamLayer.addTo(map);
        $.getJSON("js/inactive_restaurants_durham.geojson", addRestaurants);
        map.fitBounds(durhamLayer.getBounds());
        map.on('zoomend', resizeMarkers);
    }

    var map = L.map('map');
    L.Icon.Default.imagePath = "images";
    var durhamLayer;
    var tiles = L.tileLayer.provider('Stamen.Watercolor');
    tiles.addTo(map);
    map.setView([35.9908385, -78.9005222], 15);

    $("#map").height(Math.max($(window).height() - $("header").height() - $("div.footer-copyright").height() - $(".post-title").height(), 300));
    map.invalidateSize();

    $(window).resize(function() {
        $("#map").height(Math.max($(window).height() - $("header").height() - $("div.footer-copyright").height() - $(".post-title").height(), 300));
        map.invalidateSize();
        return true;
    });

    $.getJSON("js/durham.geojson", addDurham);
});

