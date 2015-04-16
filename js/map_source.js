'use strict';

// Browserify require commands to import libraries
var L = require('../_includes/vendor/js/leaflet.js');
require('../_includes/vendor/js/leaflet-providers.js');
var leafletPiP = require('leaflet-pip');

$(document).ready(function() {

    function toProperCase(s)
    {
        return s.toLowerCase().replace(/^(.)|\s(.)/g,
            function($1) { return $1.toUpperCase(); });
    }

    function bindRestaurantPopup(feature, layer) {
        if (feature.properties && feature.properties.premise_name) {
            layer.bindPopup("<b>" + toProperCase(feature.properties.premise_name) + "</b><br>"
                + toProperCase(feature.properties.premise_address1) + "<br>"
                + "Opened " + parseYear(feature.properties.opening_date) +
            (feature.properties.closing_date ? ", closed " + parseYear(feature.properties.closing_date) : ""));
        }
    }

    function showRestaurantMarker(data, latlng) {
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

    function parseYear(str) {
        var yearRe = /\d{4}/;
        var years = str.match(yearRe);

        if (years && years.length == 1) {
            return years[0];
        }
        else {
            return null;
        }
    }

    // Filters out only restaurants which were active in year.
    function filterByYear(data, year) {

        var filteredFeatures = new Array();

        for (var i = 0; i < data.features.length; i++) {
            if ((data.features[i].properties.closing_date == "" || parseYear(data.features[i].properties.closing_date) >= year)
                && parseYear(data.features[i].properties.opening_date) <= year) {
                filteredFeatures.push(data.features[i]);
            }
        }

        return {"features": filteredFeatures };
    }

    function addRestaurants(data, year) {

        var filteredData = filterByYear(data, year);

        if (geoLayer) {
            map.removeLayer(geoLayer);
        }

        geoLayer = L.geoJson(filteredData, {
            pointToLayer: showRestaurantMarker,
            onEachFeature: bindRestaurantPopup,
            filter: checkPointInDurham
        });

        geoLayer.addTo(map);
    }

    function addRestaurantsCallback(data) {
        restaurantData = data;
        addRestaurants(data, 2000);
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

    function addDurham(data, year) {
        durhamLayer = L.geoJson(data);
        // durhamLayer.addTo(map);
        $.getJSON("js/durham_restaurants.geojson", addRestaurantsCallback);
        map.fitBounds(durhamLayer.getBounds());
        map.on('zoomend', resizeMarkers);
    }

    var restaurantIcon = new L.divIcon({ className: "restaurant-icon" });
    var restaurantData;
    var geoLayer;
    var map = L.map('map');
    var durhamLayer;

    var tiles = L.tileLayer.provider('Stamen.Watercolor');
    tiles.addTo(map);
    map.setView([35.9908385, -78.9005222], 15);

    $("#map").height(Math.max($(window).height() - $("header").height() - $("div.footer-copyright").height() - $(".map-header").height() - 3, 300));
    map.invalidateSize();

    $(window).resize(function() {
        $("#map").height(Math.max($(window).height() - $("header").height() - $("div.footer-copyright").height() - $(".map-header").height() - 3, 300));
        map.invalidateSize();
        return true;
    });

    $.getJSON("js/durham.geojson", addDurham);

    // Configure time slider buttons
    $(".time-slider li")
        .mouseover(function() { $(this).addClass("mouse-over"); })
        .mouseout(function() { $(this).removeClass("mouse-over"); })
        .click(function() {
            $(".time-slider li").removeClass("selected");
            $(this).addClass("selected");
            addRestaurants(restaurantData, $(this).attr('id').slice(-4)); });

    $("#year-2000").click();
});

