from django.contrib.auth.forms import UserCreationForm
from django.http import HttpResponseRedirect
from django.shortcuts import render_to_response, render
from forms import UserProfileForm, UserForm
from .utils import render_to_json
import requests

def frontpage(request):
    return render_to_response('frontpage.html', {'user': request.user})

@render_to_json()
def getRoutePlannerJson(request):
    if request.method == "GET":
        routePlannerUrl = "http://api.reittiopas.fi/hsl/prod/?request=route&user=neverlate&pass=neverlate&format=json&from=2548196,6678528&to=2549062,6678638&callback=?"
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
    was_saved = False
    if request.user.is_authenticated():
        if request.method == 'POST':
            profile_form = UserProfileForm(request.POST, instance=request.user.userprofile)
            user_form = UserForm(request.POST, instance=request.user)
            if profile_form.is_valid() and user_form.is_valid():
                profile_form.save()
                user_form.save()
                was_saved = True
        else:
            profile_form = UserProfileForm(instance=request.user.userprofile)
            user_form = UserForm(instance=request.user)

    return render(request, 'profile.html',
                  {'authenticated': request.user.is_authenticated(),
                   'was_saved': was_saved,
                   'profile_form': profile_form,
                   'user_form': user_form})
