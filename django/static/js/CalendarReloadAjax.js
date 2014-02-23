$(function () {
    function handle_error(xhr, textStatus, errorThrown) {
        clearInterval(interval_id);
        alert("Please report this error: " + errorThrown + xhr.status + xhr.responseText);
    }

    function show_status(data) {
        var obj = JSON.parse(data);
        if (obj.error) {
            $('#calendarUpdateStatus').html('<div class="alert alert-danger">' + obj.error + '</div>')
            clearInterval(interval_id);
        }
        else if (obj.status == "waiting") {
            $('#calendarUpdateStatusContent').append('.')
        }
        else if (obj.status == "solved") {
            $('#calendarUpdateStatus').html('<div class="alert alert-success">Calendars succesfully updated</div>')
            clearInterval(interval_id);
        }
        else {
            clearInterval(interval_id);
            alert(data);
        }
    }

    function check_status() {
        $.ajax({
            type: "POST",
            url: "/profile/status/",
            data: {csrfmiddlewaretoken: document.getElementsByName('csrfmiddlewaretoken')[0].value},
            success: show_status,
            error: handle_error
        });
    }
    var interval_id = setInterval(function(){ check_status(); }, 1000);
});
