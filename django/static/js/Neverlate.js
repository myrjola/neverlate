/*global $, Modernizr, google */

String.prototype.repeat = function(num) {
    return new Array(num+1).join(this);
};

/* Maps map-canvas divs to google map objects */
var canvas_to_map = {};

/* The next appointments as a list */
var appointments = [];

/* Maps jumboroute divs to route data */
var jumboroute_to_route = {};

/* One Google Maps infoWindow instance for showing info on route stops */
var infowindow;

/* The object that the infowindow is currently opened for (e.g. a marker) */
var infowindowtrigger;

var Neverlate = {
    templates: {},
    API_CREDS: "&user=neverlate&pass=neverlate",
    COORD_FORMAT: "&epsg_in=wgs84&epsg_out=wgs84",
    DETAIL_LEVEL: "&detail=full",
    CORS: "http://www.corsproxy.com/"
};

/*
 * Generates a unique hash for an arbitrary object
*/
function hash(value) {
    return (typeof value) + ' ' + (value instanceof Object ?
        (value.__hash || (value.__hash = ++arguments.callee.current)) :
        value.toString());
}
hash.current = 0;

Neverlate.getCurrentGeolocation = function() {
    function printCoords(location) {
        Neverlate.userCoords = location.coords;
    }
    if (Modernizr.geolocation) {
    navigator.geolocation.getCurrentPosition(printCoords);
  } else {
    console.log("no geolocation support");
  }
};

/*
 * Initializes the dashboard page
*/
Neverlate.initialize = function() {
    Neverlate.getCurrentGeolocation(); //Get user location from browser is possible
    console.log(Neverlate.loadAppointments());

    var s = document.createElement("script");
    s.type = "text/javascript";
    s.src  = "https://maps.googleapis.com/maps/api/js?key=AIzaSyAoHieetxNcdqJ4PDij87fi2KH8tOhMK2Y&sensor=true&callback=gmap_loaded";
    $("head").append(s);
    window.gmap_loaded = function(){
        $(".map-canvas").each(function() {
            Neverlate.createMap($(this)[0]);
        });

        Neverlate.updateDashboardState();
    };
};

Neverlate.loadAppointments = function() {
    //Neverlate.getCurrentGeolocation(); //test
    console.log("Loading user appointments");
    var url= "/appointments";
    return $.get(url);
}

/*
 * Create a map, but don't do anything else with it yet.
*/
Neverlate.createMap = function(map_canvas) {
    console.log("drawed a map");
    var mapOptions = { // just some initial values until real data is available
        center: new google.maps.LatLng(60.188549397729, 24.833913340551),
        zoom: Neverlate.mapZoom(10)
    };
    canvas_to_map[hash(map_canvas)] = new google.maps.Map(map_canvas, mapOptions);; // store the map for later access
}

/*
 * Finds the coordinates for the given addresses using Reittiopas API
 * and calls loadRouteByCoordinate to get the actual route data and display it to the user.
*/
Neverlate.loadRouteByAddress = function(point1, point2, jumboroute, arrival, appointmentIndex) {
    var point1json = null;
    var point2json = null;

    $(document).ready(function () {
        var N = Neverlate; // faste to type
        var queryOptions = N.API_CREDS +N.COORD_FORMAT+N.DETAIL_LEVEL;
        console.log("loading geocode")
        $.get(
            url = N.CORS+"api.reittiopas.fi/hsl/prod/?request=geocode&format=json&key="+point1+queryOptions,
            succes = function(response) {
            console.log("GOT RESPONSE FRON REITTIOPAS");
            point1json = JSON.parse(response);
            if (point2json != null) { // this in made in pieces because either call can finish first
                Neverlate.loadRouteByCoordinate(point1json[0]["coords"],point2json[0]["coords"],
                  jumboroute, arrival, appointmentIndex);
            }
        });
        $.get(
            url = N.CORS + "api.reittiopas.fi/hsl/prod/?request=geocode&format=json&key=" + point2 + queryOptions,
                success = function (response) {
                    console.log("GOT RESPONSE FRON REITTIOPAS");
                    point2json = JSON.parse(response);
                    if (point1json != null) {// this in made in pieces because either call can finish first
                        Neverlate.loadRouteByCoordinate(point1json[0]["coords"], point2json[0]["coords"],
                          jumboroute, arrival, appointmentIndex);
                    };
        });
    });
};

Neverlate.zeroPad = function(number, zeros){
    return ('0'.repeat(zeros)+number.toString()).slice(-zeros);
};

/*
 * Fetches a route from Reittiopas.
 * Stores the route data for later use and display it to the user.
*/
Neverlate.loadRouteByCoordinate = function (point1coords, point2coords, jumboroute, arrival, appointmentIndex) {
    var N = Neverlate; // faster to type
    var queryOptions = N.API_CREDS +N.COORD_FORMAT+N.DETAIL_LEVEL;

    var arrivalOptions = "";
    if (arrival) {
        var date = N.zeroPad(arrival.getYear(), 4)+N.zeroPad(arrival.getMonth(),2)+N.zeroPad(arrival.getDate(),2);
        var time = N.zeroPad(arrival.getHours(), 2) + N.zeroPad(arrival.getMinutes(), 2);
        arrivalOptions = "&time=" + time + + "&date=" + date + "&timetype=arrival";
    }

    $.get(
        url = N.CORS+"api.reittiopas.fi/hsl/prod/?request=route&format=json&from="
          +point1coords+"&to="+point2coords+"&callback=?"+queryOptions+arrivalOptions,
        succes = function(response) {
        console.log("GOT ROUTE FRON REITTIOPAS");
        var routes = JSON.parse(response)[0];
        jumboroute_to_route[hash(jumboroute)] = routes; // store the route for later access
        Neverlate.showRoute(routes[0], jumboroute, appointmentIndex); // TODO: choose which of the route options to show
    });
};

/*
 * Shows the given route option to the user
 */
Neverlate.showRoute = function(data, jumboroute, appointmentIndex){
    var map = canvas_to_map[hash($(jumboroute).find(".map-canvas")[0])];
    Neverlate.loadMap(map, data);
    if (typeof(appointmentIndex) != "undefined") {
        Neverlate.updateRoutePanel(jumboroute, appointments[appointmentIndex].fields, data);
    }
};

/*
 * Updates the given jumboroute div to show the route option at the given index.
 * The index can be in the range [0,2] or [0,4] depending on how many routes
 * were fetched from Reittiopas.
 */
Neverlate.updateRoute = function(jumboroute, routeIndex) {
    var route = jumboroute_to_route[hash(jumboroute)][routeIndex];
    Neverlate.showRoute(route, jumboroute);
}

Neverlate.calculateMiddleCoord = function(legs) {
    var startPoint = legs[0].locs[0].coord;
    var endPoint = legs[legs.length-1].locs[legs[legs.length-1].locs.length-1].coord ;
    var middlePoint = {};
    middlePoint.lat = (startPoint.y + endPoint.y)/2;
    middlePoint.lng = (startPoint.x + endPoint.x)/2;
    return middlePoint;
};

Neverlate.mapZoom = function(len) {
    var w = window.innerWidth
    var windowSizeOffset = 0; //used to change zoom level in mobile browsers;
    if (window.innerWidth <700) {
        windowSizeOffset = -1;
        console.log("offset was "+ windowSizeOffset);
    }
    if (window.innerWidth >1300) {
        windowSizeOffset = +1;
        console.log("offset was "+ windowSizeOffset);
    }
    if (len < 4000){
        return 15 + windowSizeOffset;
    }
    else if (len < 6000){
        return 14 + windowSizeOffset;
    }
    else if (len < 1000){
        return 13 + windowSizeOffset;
    }
    else if (len >= 10000) {
        return 12 + windowSizeOffset;
    }
}

/*
 * Display a route on an already existing map.
*/
Neverlate.loadMap = function(map, route_data){
    console.log(route_data);

    route_data["legs"].forEach(function (leg){
        Neverlate.drawLeg(leg, map);
    });

    Neverlate.drawStop(null, route_data["legs"][0], map); // the beginning
    for (var i = 0; i < route_data["legs"].length-1; ++i)
        Neverlate.drawStop(route_data["legs"][i], route_data["legs"][i+1], map); // the middle
    Neverlate.drawStop(route_data["legs"][route_data["legs"].length-1], null, map); // the end

    // TODO: zoom and position the map correctly
    var middlePoint = Neverlate.calculateMiddleCoord(route_data["legs"]); // coord-object with lat and lng is returned
    map.setCenter(new google.maps.LatLng( middlePoint.lat, middlePoint.lng)); // center map to the route
    map.setZoom(Neverlate.mapZoom(route_data["length"])); // change zoom level depending on the length of route
};

Neverlate.drawLeg = function(leg, map){
    var locs=[];
    leg.shape.forEach(function (loc){ //locs for stops, shape for drawable route
           locs.push(loc);
    });
    var routeCoords = Neverlate.parseShape(locs);
    console.log(routeCoords);
    var routePath = new google.maps.Polyline({
        path: routeCoords,
        geodesic: true,
        strokeColor: Neverlate.getLegColor(leg.type),
        strokeOpacity: 0.8,
        strokeWeight: 6
    });
    routePath.setMap(map);
};

Neverlate.drawStop = function(precedingLeg, followingLeg, map){
    var loc;
    var icon;
    if (followingLeg != null) {
        loc = new google.maps.LatLng(followingLeg.locs[0].coord.y, followingLeg.locs[0].coord.x);
        icon = Neverlate.getLegIcon(followingLeg.type);
    } else { // this is the end
        loc = new google.maps.LatLng(precedingLeg.locs[precedingLeg.locs.length-1].coord.y, precedingLeg.locs[precedingLeg.locs.length-1].coord.x);
        icon = Neverlate.getEndIcon();
    }

    var marker = new google.maps.Marker({
        position: loc,
        map: map,
        icon: icon
    });
    Neverlate.addInfoWindow(marker, Neverlate.formatStopInfo(precedingLeg, followingLeg), map);
};

Neverlate.getLegColor = function(type) {
    switch(type) {
        case 'walk':
            return '#1E74FC';
        case '1':case '3':case '4':case '5':case '8':case '21':case '22':case '23':case '24':case '25':case '36':case '39': // bus
            return '#193695';
        case '2': // tram
            return '#00AC67';
        case '6': // metro
            return '#FB6500';
        case '7': // ferry
            return '#00AEE7';
        case '12': // commuter train
            return '#2CBE2C';
        default: // unknown
            return '#000000'
    }
};
Neverlate.getLegIcon = function(type) {
    var name;
    switch(type) {
        case 'walk':
            name = 'walk.png';
            break;
        case '1':case '3':case '4':case '5':case '8':case '21':case '22':case '23':case '24':case '25':case '36':case '39':
            name = 'bus.png';
            break;
        case '2':
            name = 'tram.png';
            break;
        case '6':
            name = 'metro.png';
            break;
        case '7':
            name = 'ferry.png';
            break;
        case '12':
            name = 'train.png';
            break;
    }
    return 'static/images/' + name;
};
Neverlate.getEndIcon = function() {
    return 'static/images/end.png';
};
Neverlate.parseShape = function(shapes){
    var shapeCoords=[];
    shapes.forEach(function(shape){
        shapeCoords.push(new google.maps.LatLng(shape.y, shape.x));
    });
    return shapeCoords;
};

Neverlate.formatStopInfo = function(precedingLeg, followingLeg) {
    var result = '';
    if (precedingLeg != null) { // this is not the beginning
        var lastloc = Neverlate.lastLoc(precedingLeg);
        result += 'Arrival to ' + lastloc.name + ' at '
        result += Neverlate.formatReittiopasTime(lastloc.arrTime) + '<br>';
    }
    if (followingLeg != null) { // this is not the end
        if (followingLeg.type == 'walk') {
            result += 'Leave towards ' +
                Neverlate.lastLoc(followingLeg).name
                + ' at ';
        } else {
            result += followingLeg.code.slice(1, 6).trim() + ' leaves at ';
        }
        result += Neverlate.formatReittiopasTime(followingLeg.locs[0].depTime) + '<br>';
    }
    return result;
}

/* returns the last location in the leg that includes location name */
Neverlate.lastLoc = function(leg) {
    for (var i = leg.locs.length-1; i >= 0; --i) {
        if (leg.locs[i].name != null) {
            return leg.locs[i];
        }
    }
}

Neverlate.formatReittiopasTime = function(time) {
    // extract HH:MM
    return time.toString().slice(8, 10) + ':' + time.toString().slice(10, 12);
}

Neverlate.addInfoWindow = function(trigger, content, map){
    if (!infowindow) infowindow = new google.maps.InfoWindow();
    google.maps.event.addListener(trigger, 'click', function() {
        infowindow.close();
        // if the same marker was clicked again, just close the window
        if (infowindowtrigger === trigger) {
            infowindowtrigger = null;
        } else {
            infowindowtrigger = trigger;
            infowindow.setContent('<span class="infowindow">' + content + '</span>');
            infowindow.open(map, trigger);
        }
    });
};

Neverlate.updateDashboardState = function(){
    $.get(
        url = 'appointments',
        success = function(response) {
            appointments = JSON.parse(response);
            // Filter old appointments
            appointments = appointments.filter(function (appointment){
                return new Date() < new Date(appointment.fields.start_time);
            });

            $(".jumboroute").each(function(i) { // for each appointment to be shown
                var appointment = appointments[i].fields;
                from = Neverlate.getCurrentGeolocation();
                if (i != 0) {
                    var from = appointments[i-1].fields.location;
                }
                var to = appointment.location;

                Neverlate.loadRouteByAddress(from, to, $(this)[0], new Date(appointment.start_time), i);
            });
        });
};

Neverlate.updateRoutePanel = function(jumbotron, appointment, route){
    var panel = $('.panel', jumbotron);
    var legs = route.legs;
    panel.find('a').html("Depart " + Neverlate.formatReittiopasTime(legs[0].locs[0].depTime) +
                         " for " + appointment.summary + " at " + appointment.location);
    var locationsWithName = legs[0].locs.filter(function( location ) {
      return location.name;
    });
    panel.find('#fromLabel').html(locationsWithName[0].name);
    panel.find('#toLabel').html(appointment.location);
    var arrival = Neverlate.formatReittiopasTime(Neverlate.lastLoc(legs[legs.length-1]).arrTime);
    panel.find('#arrivalLabel').html(arrival);
};
