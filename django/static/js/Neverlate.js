
window.Neverlate = {
    templates: {},
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

Neverlate.loadRoutes = function(point1,point2) {
    $(document).ready(function () {
        console.log("loading data fron routeplanner");
        var url= "/routeplanner?point1="+point1+"&point2="+point2;
        $.getJSON(url, function(result){
            Neverlate.parseAllRoutes(result);
        });
    });
}

Neverlate.parseAllRoutes = function(data){
    console.log(JSON.parse(data));
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
        $(".map-canvas").each(function(index) {
            console.log("parsing route "+ toJson[index][0] + " with index " + index);
            Neverlate.parseRoute($(this)[0], toJson[index][0]);
        });
    }
}

Neverlate.parseRoute = function(map_canvas, leg_data){
    var route_data = leg_data; // TODO: parse route_data from leg_data
    console.log(" Preparing data for map loading " + route_data);
    Neverlate.loadMap(map_canvas, route_data);
}

Neverlate.loadMap = function(map_canvas, route_data){
    console.log("drawed a map");
    console.log(route_data);
    var mapOptions = {
        center: new google.maps.LatLng(60.188549397729, 24.833913340551),
        zoom: 8
    };
    var map = new google.maps.Map(map_canvas, mapOptions);
    var routeCoords = [];
    var locs = route_data.legs[0].locs
    for (var i = 0 ; i < locs.length; i++ ) {
        var coords = locs[i]["coord"];
        console.log("parsing legs in to a path");
        console.log(coords);
        routeCoords.push(new google.maps.LatLng(coords.y, coords.x));
    }
    console.log(routeCoords);
    var routePath = new google.maps.Polyline({
        path: routeCoords,
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 2
    });
    routePath.setMap(map);
}