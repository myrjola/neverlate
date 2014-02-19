
window.Neverlate = {
    templates: {}
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
    $("#content-placeholder").html(html);
}
$("#map-canvas").ready(function(){
        var mapOptions = {
          center: new google.maps.LatLng(-34.397, 150.644),
          zoom: 8
        };
        var map = new google.maps.Map(document.getElementById("map-canvas"),
            mapOptions);
});