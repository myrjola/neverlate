
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
Neverlate.getRoute = function (point1coords, point2coords) {
    var N = Neverlate; // faste to type
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
    console.log("Loading user appointments");
    var url= "/appointments";
    return $.get(url);
}

Neverlate.parseAllRoutes = function(data){
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
    route_data["legs"].forEach(function (leg,index){
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
    });

};
Neverlate.parseStops = function(locs){
    var routeCoords=[];
    for (var i = 0 ; i < locs.length; i++ ) {
        var coords = locs[i]["coord"];
        routeCoords.push(new google.maps.LatLng(coords.y, coords.x));
    }
    return routeCoords;
};
Neverlate.parseShape = function(shapes){
    var shapeCoords=[];
    shapes.forEach(function(shape){
        shapeCoords.push(new google.maps.LatLng(shape.y, shape.x));
    });
    return shapeCoords;
};
