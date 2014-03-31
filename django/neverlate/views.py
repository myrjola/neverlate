import json

from django.contrib.auth.forms import UserCreationForm
from django.core.exceptions import SuspiciousOperation
from django.http import HttpResponseRedirect, HttpResponse
from django.shortcuts import render_to_response, render
from django.forms.models import formset_factory, BaseFormSet
import requests

from calparser.models import CalendarEntry

from forms import (UserProfileForm, UserForm, ICalURLForm,
                   LocationAliasForm, get_calendar_formset,
                   get_locationalias_formset)
from tasks import reload_user_calendars
from models import UserProfile, ICalURL, LocationAlias

from .utils import render_to_json
import requests
import json

API_CREDS = "&user=neverlate&pass=neverlate"
COORD_FORMAT = "&epsg_in=wgs84&epsg_out=wgs84"
DETAIL_LEVEL = "&detail=full"

def frontpage(request):
    user = request.user
    next_appointments = CalendarEntry.get_next_appointment_for_user(user.pk)
    print "Next appointments: ", next_appointments
    return render_to_response('frontpage.html',
                              {
                                  'user': request.user,
                                  'next_appointments': next_appointments
                              })

def get_coords(point):
    url = "http://api.reittiopas.fi/hsl/prod/?request=geocode&format=json&key="+point+API_CREDS+COORD_FORMAT
    r = requests.get(url)
    print r.text
    geocode = json.loads(r.text)
    print geocode[0]["coords"]
    return geocode[0]["coords"]

@render_to_json()
def getRoutePlannerJson(request):
    if request.method == "GET":
        point1 = request.GET.get("point1", "")
        point2 = request.GET.get("point2", "")
        coords1 = get_coords(point1)
        coords2 = get_coords(point2)
        routePlannerUrl = "http://api.reittiopas.fi/hsl/prod/?request=route&format=json&from="+coords1+"&to="+coords2+"&callback=?"+API_CREDS+COORD_FORMAT+DETAIL_LEVEL
        r = requests.get(routePlannerUrl);
        if (r.status_code == 200):
            return r.text


def register(request):
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            form.save()
            return HttpResponseRedirect("/")
    else:
        form = UserCreationForm()

    return render(request, "register.html", {'form': form})


def profile(request):
    profile_form = None
    user_form = None
    calendar_formset = None
    locationalias_formset = None
    was_saved = False
    task_id = None

    CalendarFormSet = get_calendar_formset(ICalURLForm,
                                           extra=1, can_delete=True)
    LocationAliasFormSet = get_locationalias_formset(ICalURLForm,
                                                     extra=1, can_delete=True)

    if request.user.is_authenticated():
        user = request.user
        profile = request.user.userprofile
        calendar_prefix = 'calendar'
        locationalias_prefix = 'locationalias'
        if request.method == 'POST':
            profile_form = UserProfileForm(
                request.POST, instance=profile)
            user_form = UserForm(request.POST, instance=user)
            calendar_formset = CalendarFormSet(request.POST, instance=profile,
                                               prefix=calendar_prefix)
            locationalias_formset = LocationAliasFormSet(
                request.POST, instance=profile, prefix=locationalias_prefix)

            if (profile_form.is_valid() and user_form.is_valid()):
                profile_form.save()
                user_form.save()
                was_saved = True

            if (calendar_formset.is_valid() and locationalias_formset.is_valid()):
                calendar_formset.save()
                task_id = reload_user_calendars.delay(request.user).task_id
                request.session['task_id'] = task_id
                locationalias_formset.save()
                was_saved = True
                calendar_formset = CalendarFormSet(instance=profile,
                                                   prefix=calendar_prefix)
                locationalias_formset = LocationAliasFormSet(
                    instance=profile, prefix=locationalias_prefix)

        else:
            profile_form = UserProfileForm(instance=request.user.userprofile)
            user_form = UserForm(instance=request.user)
            calendar_formset = CalendarFormSet(instance=profile,
                                               prefix=calendar_prefix)
            locationalias_formset = LocationAliasFormSet(
                instance=profile, prefix=locationalias_prefix)

    return render(request, 'profile.html',
                  {'authenticated': request.user.is_authenticated(),
                   'was_saved': was_saved,
                   'profile_form': profile_form,
                   'user_form': user_form,
                   'user_id': request.user.id,
                   'task_id': task_id,
                   'calendar_formset': calendar_formset,
                   'locationalias_formset': locationalias_formset})


def reload_calendars_ajax_view(request):
    if not request.is_ajax():
        raise SuspiciousOperation("No access.")
    try:
        result = reload_user_calendars.AsyncResult(request.session['task_id'])
    except KeyError:
        ret = {'error': 'No background task found'}
        return HttpResponse(json.dumps(ret))
    try:
        if result.failed():
            ret = {'error': 'Failed reloading calendars.' +
                   ' Please check that you gave the correct URLs'}
        elif result.ready():
            ret = {'status': 'solved'}
        else:
            ret = {'status': 'waiting'}
    except AttributeError:
        ret = {'error': 'Cannot find async task.'}
        return HttpResponse(json.dumps(ret))
    return HttpResponse(json.dumps(ret))
