
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
};

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
        // TODO: load a map only for the currently selected route
        $(".map-canvas").each(function(index) {
            console.log("parsing route "+ toJson[0][0] + " with index " + 0);
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

Neverlate.loadMap = function(map_canvas, route_data){
    console.log("drawed a map");
    console.log(route_data);
    var mapOptions = {
        center: new google.maps.LatLng(60.188549397729, 24.833913340551),
        zoom: 8
    };
    var map = new google.maps.Map(map_canvas, mapOptions);
    console.log("route data is ");
    console.log(route_data);
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