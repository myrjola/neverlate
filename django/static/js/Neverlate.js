
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

Neverlate.loadRoutes = function() {
    $(document).ready(function () {
        console.log("loading data fron routeplanner");
        var url= "/routeplanner";
        $.getJSON(url, function(result){
            Neverlate.parseRoute(result);
        });

    });
}
Neverlate.parseRoute = function(data){
    console.log(JSON.parse(data));
    //TODO what to parse from reittiopas?
    var toJson = JSON.parse(data);
    var source = Neverlate.templates.route_front;
    var template = Handlebars.compile(source);
    var html = template(toJson[0][0]);
    var coordinates = []; // TODO: put route data for maps here (1 entry for each leg)
    $("#content-placeholder").html(html);
    Neverlate.loadMaps(coordinates);
}


Neverlate.loadMaps = function(coordinates){ //TODO give coordinates from parsed data
    var s = document.createElement("script");
    s.type = "text/javascript";
    s.src  = "https://maps.googleapis.com/maps/api/js?key=AIzaSyAoHieetxNcdqJ4PDij87fi2KH8tOhMK2Y&sensor=true&callback=gmap_draw";
    $("head").append(s);
    window.gmap_draw = function(){
        $(".map-canvas").each(function(index) {
            // TODO: use coordinates[index] to display to route on the map and center it
            console.log("drawed a map");
            var mapOptions = {
                center: new google.maps.LatLng(-34.397, 150.644),
                zoom: 8
            };
            var map = new google.maps.Map($(this)[0], mapOptions);
        });
    }
}