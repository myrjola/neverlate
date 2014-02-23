from django.contrib.auth.forms import UserCreationForm
from django.http import HttpResponseRedirect
from django.shortcuts import render_to_response, render
import requests

from forms import UserProfileForm, UserForm, CalendarFormSet
from .utils import render_to_json
import requests
import json

api_creds = "&user=neverlate&pass=neverlate"

def frontpage(request):
    return render_to_response('frontpage.html', {'user': request.user})

def get_coords(point):
    print "point was " + point
    url = "http://api.reittiopas.fi/hsl/prod/?request=geocode&format=json&key="+point+api_creds
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
        routePlannerUrl = "http://api.reittiopas.fi/hsl/prod/?request=route&format=json&from="+coords1+"&to="+coords2+"&callback=?"+api_creds
        r = requests.get(routePlannerUrl);
        if(r.status_code == 200):
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
    if request.user.is_authenticated():
        if request.method == 'POST':
            profile_form = UserProfileForm(request.POST, instance=request.user.userprofile)
            user_form = UserForm(request.POST, instance=request.user)
            calendar_formset = CalendarFormSet(request.POST, instance=request.user.userprofile)

            if profile_form.is_valid() and user_form.is_valid() and calendar_formset.is_valid():
                profile_form.save()
                user_form.save()
                calendar_formset.save()
                was_saved = True
        else:
            profile_form = UserProfileForm(instance=request.user.userprofile)
            user_form = UserForm(instance=request.user)
            calendar_formset = CalendarFormSet(instance=request.user.userprofile)

    return render(request, 'profile.html',
                  {'authenticated': request.user.is_authenticated(),
                   'was_saved': was_saved,
                   'profile_form': profile_form,
                   'user_form': user_form,
                   'user_id' : request.user.id,
                   'calendar_formset': calendar_formset})
