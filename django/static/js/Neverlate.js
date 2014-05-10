
window.Neverlate = {
    templates: {},
    API_CREDS: "&user=neverlate&pass=neverlate",
    COORD_FORMAT: "&epsg_in=wgs84&epsg_out=wgs84",
    DETAIL_LEVEL: "&detail=full",
    CORS: "http://www.corsproxy.com/"
};

//Load handlebar templates
$(function () {
    $(document.createElement("div")).load(
        "/static/handlebars-templates.html",
        function () {
            $(this).find("script").each(function (i, e) {
                Neverlate.templates[e.id] = e.innerHTML;
            });
        }
    );
});

Handlebars.registerHelper('times', function(n, block) {
    var accum = '';
    for(var i = 0; i < n; ++i)
        accum += block.fn(i);
    return accum;
});

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

Neverlate.getRoute = function (point1coords, point2coords) {
    var N = Neverlate; // faster to type
    var queryOptions = N.API_CREDS +N.COORD_FORMAT+N.DETAIL_LEVEL;
    $.get(
            url = N.CORS+"api.reittiopas.fi/hsl/prod/?request=route&format=json&from="+point1coords+"&to="+point2coords+"&callback=?"+queryOptions,
            succes = function(response) {
            console.log("GOT ROUTE FRON REITTIOPAS");
            Neverlate.parseAllRoutes(response);
        });
    };

Neverlate.loadRoutes = function(point1,point2) {
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
                Neverlate.getRoute(point1json[0]["coords"],point2json[0]["coords"]);
            }
        });
        $.get(
            url = N.CORS + "api.reittiopas.fi/hsl/prod/?request=geocode&format=json&key=" + point2 + queryOptions,
                success = function (response) {
                    console.log("GOT RESPONSE FRON REITTIOPAS");
                    point2json = JSON.parse(response);
                    if (point1json != null) {// this in made in pieces because either call can finish first
                        Neverlate.getRoute(point1json[0]["coords"], point2json[0]["coords"]); // send only coordinates forward
                    }
        })
    })
}


Neverlate.loadAppointments = function() {
    //Neverlate.getCurrentGeolocation(); //test
    console.log("Loading user appointments");
    var url= "/appointments";
    return $.get(url);
}

Neverlate.parseAllRoutes = function(data){ // This is the "Main" method, called from html
    Neverlate.getCurrentGeolocation(); //Get user location from browser is possible
    console.log(Neverlate.loadAppointments());
    var toJson = JSON.parse(data);
    var source = Neverlate.templates.route_front;
    var template = Handlebars.compile(source);
    var html = template(toJson[0][0]);
    $("#content-placeholder").html(html);

    var s = document.createElement("script");
    s.type = "text/javascript";
    s.src  = "https://maps.googleapis.com/maps/api/js?key=AIzaSyAoHieetxNcdqJ4PDij87fi2KH8tOhMK2Y&sensor=true&callback=gmap_loaded";
    $("head").append(s);
    window.gmap_loaded = function(){
        // TODO: load a map only for the currently selected route
        $(".map-canvas").each(function(index) {
            Neverlate.loadMap($(this)[0], toJson[0][0]);
        });
    }
};

Neverlate.mapZoom = function(len) {
    if (len > 10000) {
        return 11;
    }
    else return 10;
}
Neverlate.loadMap = function(map_canvas, route_data){
    console.log("drawed a map");
    console.log(route_data);
    var mapOptions = {
        center: new google.maps.LatLng(60.188549397729, 24.833913340551),
        zoom: Neverlate.mapZoom(route_data["length"]) // todo change zoom level depending on the length of route
    };
    var map = new google.maps.Map(map_canvas, mapOptions);

    route_data["legs"].forEach(function (leg){
        Neverlate.drawLeg(leg, map);
    });

    Neverlate.drawStop(null, route_data["legs"][0], map); // the beginning
    for (var i = 0; i < route_data["legs"].length-1; ++i)
        Neverlate.drawStop(route_data["legs"][i], route_data["legs"][i+1], map); // the middle
    Neverlate.drawStop(route_data["legs"][route_data["legs"].length-1], null, map); // the end
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

var infowindow; // one Google Maps infoWindow instance
var infowindowtrigger; // the object that the infowindow is currently opened for (e.g. a marker)
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

Neverlate.drawNextTransfer = function(){
    $.get(
        url = 'appointments',
        success = function(response) {
            var appointments = JSON.parse(response);
            console.log(appointments)
            appointments = appointments.filter(function (appointment){
                return new Date() < new Date(appointment["fields"]["start_time"])
            })
            console.log(appointments)

            var from = appointments[0]["fields"]["location"];
            var to = appointments[1]["fields"]["location"];
            Neverlate.loadRoutes(from, to);
        });
};
