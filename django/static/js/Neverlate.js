
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
            Neverlate.parseRoute($(this)[0], toJson[0][0][index]);
        });
    }
}

Neverlate.parseRoute = function(map_canvas, leg_data){
    //TODO what to parse from reittiopas?
    var route_data = null; // TODO: parse route_data from leg_data
    Neverlate.loadMap(map_canvas, route_data);
}

Neverlate.loadMap = function(map_canvas, route_data){
    console.log("drawed a map");
    var mapOptions = {
        center: new google.maps.LatLng(-34.397, 150.644),
        zoom: 8
    };
    var map = new google.maps.Map(map_canvas, mapOptions);
    // TODO: draw the route using route_data
}