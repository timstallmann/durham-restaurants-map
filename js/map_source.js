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

    function setRestaurantPopupDescription(feature, layer) {
        if (feature.properties && feature.properties.premise_name) {
            feature.properties.popup_text =
                "<b>" + toProperCase(feature.properties.premise_name) + "</b><br>"
                + toProperCase(feature.properties.premise_address1) + "<br>"
                + "Opened "
                + (parseYear(feature.properties.opening_date) < 1991 ? "before 1991" : parseYear(feature.properties.opening_date))
                + (feature.properties.closing_date ? ", closed " + parseYear(feature.properties.closing_date) : "");
        }
    }

    function showRestaurantPopup(e) {
        if (zoom >= 13) {
            var clickPoint = map.latLngToLayerPoint(e.latlng);
            var bounds = L.latLngBounds([map.layerPointToLatLng([clickPoint.x - 1, clickPoint.y - 1]),
                map.layerPointToLatLng([clickPoint.x + 1, clickPoint.y + 1])]);
            var popupText = "";
            map.eachLayer(function (layer) {
                if (layer.feature && layer.feature.geometry.type == "Point")
                    if (bounds.contains([layer.feature.geometry.coordinates[1], layer.feature.geometry.coordinates[0]]))
                        if (layer.feature.properties.popup_text) {
                            popupText += "<p>" + layer.feature.properties.popup_text + "</p>";
                        }
            });
            map.openPopup(popupText, e.latlng);
        }
        else {
            map.openPopup(e.layer.feature.properties.popup_text, [e.layer.feature.geometry.coordinates[1], e.layer.feature.geometry.coordinates[0]]);
        }
    }

    function showRestaurantMarker(data, latlng, year) {
        if (data.properties.closing_date == "") {
            if ((parseYear(data.properties.opening_date) <= year) && (parseYear(data.properties.opening_date) > year - 5)) {
                return L.marker(latlng, {icon: restaurantIconNew }).addTo(map);
            }
            else {
                return L.marker(latlng, {icon: restaurantIcon}).addTo(map);
            }
        }
        else if ((parseYear(data.properties.opening_date) <= year) && (parseYear(data.properties.opening_date) > year - 5)) {
            return L.marker(latlng, {icon: restaurantIconClosedNew }).addTo(map);
        }
        else {
            return L.marker(latlng, {icon: restaurantIconClosed }).addTo(map);
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
            pointToLayer: function(data, latlng) { return showRestaurantMarker(data, latlng, year); },
            onEachFeature: setRestaurantPopupDescription,
            filter: checkPointInDurham
        });

        geoLayer.addTo(map);
        geoLayer.on('click', showRestaurantPopup);

    }

    function addRestaurantsCallback(data) {
        restaurantData = data;
        addRestaurants(data, 2000);
    }

    // Scale marker size with map zoom
    function resizeMarkers(event) {
        zoom = map.getZoom();

        if (zoom <= 10) {
            document.body.className = "zoom-10";
        }
        else {
            document.body.className = "zoom-" + zoom;
        }

        $(".info.legend").html(getLegendHtml(year, zoom));
    }

    function addDurham(data, year) {
        durhamLayer = L.geoJson(data);
        // durhamLayer.addTo(map);
        $.getJSON("js/durham_restaurants.geojson", addRestaurantsCallback);
        map.fitBounds(durhamLayer.getBounds());
        map.on('zoomend', resizeMarkers);
    }

    function getLegendHtml(year, zoom) {
        var retHTML = "<b>Legend</b><ul>" +
            "<li><div class='restaurant-icon'></div> Still open today</li>" +
            "<li><div class='restaurant-icon restaurant-closed'></div> No longer open</li>";
        if (zoom >= 14) {
            retHTML +=
            "<li><div class='restaurant-icon restaurant-new'></div> Newly opened in " + year + "</li>";
        }
        retHTML += "</ul><i>Data source: <a href='http://data.dconc.gov/'>Durham Open Data</a>.</i>";
        return retHTML;
    }

    var restaurantIcon = new L.divIcon({ className: "restaurant-icon" });
    var restaurantIconClosed = new L.divIcon({ className: "restaurant-icon restaurant-closed" });
    var restaurantIconNew = new L.divIcon({ className: "restaurant-icon restaurant-new" });
    var restaurantIconClosedNew = new L.divIcon({ className: "restaurant-icon restaurant-closed restaurant-new" });

    var restaurantData;
    var geoLayer;
    var map = L.map('map', { minZoom: 8 });
    var durhamLayer;

    var year = 2000;
    var zoom = 10;

    var watercolorTiles = L.tileLayer.provider('Stamen.Watercolor');
    var labelTiles = L.tileLayer.provider('Stamen.TonerLabels');

    watercolorTiles.addTo(map);
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
            year = $(this).attr('id').slice(-4);
            addRestaurants(restaurantData, year);
            $(".info.legend").html(getLegendHtml(year, zoom));
        });

    // Configure options buttons
    $(".options li")
        .mouseover(function() { $(this).addClass("mouse-over"); })
        .mouseout(function() { $(this).removeClass("mouse-over"); })
        .click(function() {
            if ($(this).hasClass("selected")) {
                $(".options li").removeClass("selected");
                map.removeLayer(labelTiles);
            }
            else {
                $(this).addClass("selected");
                map.addLayer(labelTiles);
            }
        });

    // Add legend.
    var legend = L.control({position: 'bottomright'});

    legend.onAdd = function (map) {
        var div = L.DomUtil.create('div', 'info legend');
        div.innerHTML = getLegendHtml(year, zoom);
        return div;
    };

    legend.addTo(map);

    // Set map bounds
    map.setMaxBounds(map.getBounds().pad(25));
});

