from __future__ import absolute_import

from celery import shared_task

from calparser.tasks import parse_ical_from_url
from calparser.models import CalendarEntry
from django.contrib.auth.models import User


@shared_task
def reload_all_user_calendars():
    """Reload calendars for all users using Celery"""
    for user in User.objects.all():
        reload_user_calendars.delay(user)


@shared_task
def reload_user_calendars(user):
    """Delete all CalendarEntries for user and reload each calendar"""
    CalendarEntry.objects.all().filter(user=user).delete()
    for url in [str(icalurl.url) for icalurl
                in user.userprofile.icalurl_set.all()]:
        parse_ical_from_url(url, user)
