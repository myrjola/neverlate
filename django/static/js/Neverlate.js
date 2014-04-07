
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
        // TODO: load a map only for the currently selected route
        $(".map-canvas").each(function(index) {
            console.log("parsing route "+ toJson[0][0] + " with index " + 0);
            Neverlate.loadMap($(this)[0], toJson[0][0]);
        });
    }
}

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
        var route_colors = ['#FF0000', '#00FF00', '#0000FF']
        var locs=[];
        leg.shape.forEach(function (loc){ //locs for stops, shape for drawable route
           locs.push(loc);
        });
        var routeCoords = Neverlate.parseShape(locs);
        console.log(routeCoords);
        var routePath = new google.maps.Polyline({
            path: routeCoords,
            geodesic: true,
            strokeColor: route_colors[index % route_colors.length],
            strokeOpacity: 0.8,
            strokeWeight: 6
        });
        routePath.setMap(map);
    });

}
Neverlate.parseStops = function(locs){
    var routeCoords=[];
    for (var i = 0 ; i < locs.length; i++ ) {
        var coords = locs[i]["coord"];
        routeCoords.push(new google.maps.LatLng(coords.y, coords.x));
    }
    return routeCoords;
}
Neverlate.parseShape = function(shapes){
    var shapeCoords=[];
    shapes.forEach(function(shape){
        shapeCoords.push(new google.maps.LatLng(shape.y, shape.x));
    })
    return shapeCoords;
}