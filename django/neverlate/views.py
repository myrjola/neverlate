import json

from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from django.core.exceptions import SuspiciousOperation
from django.http import HttpResponseRedirect, HttpResponse
from django.shortcuts import render_to_response, render
from allaccess.views import OAuthRedirect, OAuthCallback
from allaccess.compat import get_user_model
import base64
import hashlib
from django.core import serializers
from django.utils.encoding import force_text, smart_bytes

from calparser.models import CalendarEntry

from forms import (UserForm, ICalURLForm,
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


@render_to_json()
def getAppointmentsForUser(request):
    if request.method == "GET" and request.user.is_authenticated():
        user = request.user
        appointments = CalendarEntry.get_all_appointments_for_user(user.pk)
        json = serializers.serialize("json", appointments)
        print json
        return json


@render_to_json()
def getLocationAliasesForUser(request):
    if request.method == "GET" and request.user.is_authenticated():
        aliases = LocationAlias.objects.filter(user=request.user.userprofile)
        json = serializers.serialize("json", aliases)
        return json


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
            user_form = UserForm(request.POST, instance=user)
            calendar_formset = CalendarFormSet(request.POST, instance=profile,
                                               prefix=calendar_prefix)
            locationalias_formset = LocationAliasFormSet(
                request.POST, instance=profile, prefix=locationalias_prefix)

            if user_form.is_valid():
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
            user_form = UserForm(instance=request.user)
            calendar_formset = CalendarFormSet(instance=profile,
                                               prefix=calendar_prefix)
            locationalias_formset = LocationAliasFormSet(
                instance=profile, prefix=locationalias_prefix)

    return render(request, 'profile.html',
                  {'authenticated': request.user.is_authenticated(),
                   'user_form': user_form,
                   'user_name': request.user.get_username(),
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


class LoginProviderRedirect(OAuthRedirect):
    def get_additional_parameters(self, provider):
        if provider.name == "facebook":
            return {'scope': 'basic_info,email,user_events,user_location'}
        else:
            return {}


class LoginProviderCallback(OAuthCallback):

    @staticmethod
    def generate_username(access):
        digest = hashlib.sha1(smart_bytes(access)).digest()
        return force_text(base64.urlsafe_b64encode(digest)).replace('=', '')

    def get_or_create_user(self, provider, access, info):

        username = info.get('username')
        if username is None:
            username = self.generate_username(access)
        else:
            max_length = User._meta.get_field('username').max_length
            username = username[0:max_length]

        if User.objects.filter(username=username).count() > 0:
            username = self.generate_username(access)

        email = info.get('email')

        user = get_user_model()
        kwargs = {
            user.USERNAME_FIELD: username,
            'email': email,
            'password': None
        }
        return User.objects.create_user(**kwargs)
