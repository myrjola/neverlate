import json

from django.contrib.auth.forms import UserCreationForm
from django.core.exceptions import SuspiciousOperation
from django.http import HttpResponseRedirect, HttpResponse
from django.shortcuts import render_to_response, render
from django.forms.models import formset_factory, BaseFormSet
import requests

from forms import UserProfileForm, UserForm, ICalURLForm
from tasks import reload_user_calendars
from models import UserProfile, ICalURL

from .utils import render_to_json
import requests
import json

API_CREDS = "&user=neverlate&pass=neverlate"
COORD_FORMAT = "&epsg_in=wgs84&epsg_out=wgs84"
DETAIL_LEVEL = "&detail=full"

def frontpage(request):
    return render_to_response('frontpage.html', {'user': request.user})

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
    was_saved = False
    task_id = None

    class RequiredFormSet(BaseFormSet):
        def __init__(self, *args, **kwargs):
            super(RequiredFormSet, self).__init__(*args, **kwargs)
            for form in self.forms:
                form.empty_permitted = False

    CalendarFormSet = formset_factory(ICalURLForm, max_num=10,
                                      formset=RequiredFormSet)

    if request.user.is_authenticated():
        if request.method == 'POST':
            profile_form = UserProfileForm(
                request.POST, instance=request.user.userprofile)
            user_form = UserForm(request.POST, instance=request.user)
            calendar_formset = CalendarFormSet(request.POST)

            if (profile_form.is_valid() and user_form.is_valid()):
                profile_form.save()
                user_form.save()

            if (calendar_formset.is_valid()):
                # Start async task if calendars changes
                ICalURL.objects.all().filter(
                    user=request.user.userprofile).delete()
                for form in calendar_formset.forms:
                    icalurl = form.save(commit=False)
                    icalurl.user = request.user.userprofile
                    icalurl.save()
                    print "saving icalurl with name", icalurl.name

                task_id = reload_user_calendars.delay(request.user).task_id
                request.session['task_id'] = task_id

                was_saved = True
        else:
            profile_form = UserProfileForm(instance=request.user.userprofile)
            user_form = UserForm(instance=request.user)
            # Populate calendar_formset
            icalurls = request.user.userprofile.icalurl_set.all()
            initial = [{'name': icalurl.name, 'url': icalurl.url} for icalurl in icalurls]

            calendar_formset = CalendarFormSet(initial=initial)

    return render(request, 'profile.html',
                  {'authenticated': request.user.is_authenticated(),
                   'was_saved': was_saved,
                   'profile_form': profile_form,
                   'user_form': user_form,
                   'user_id': request.user.id,
                   'task_id': task_id,
                   'calendar_formset': calendar_formset})


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
