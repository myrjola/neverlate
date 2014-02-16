from __future__ import absolute_import

import urllib2

from datetime import datetime, timedelta
import pytz
from icalendar import Calendar
from celery import shared_task

from calparser.models import CalendarEntry

DTSTART = 'DTSTART'
DTEND = 'DTEND'
SUMMARY = 'SUMMARY'
LOCATION = 'LOCATION'
STATUS = 'STATUS'

@shared_task
def parse_ical_from_url(url, user):
    """Parses user's ical file from given URL

    Creates CalendarEntry-instances for each relevant VEVENT
    and attaches them to the given user
    """
    response = urllib2.urlopen(url)
    calendar = Calendar.from_ical(response.read())
    eventlist = [component for component in calendar.walk()
                 if component.name == 'VEVENT']
    # Relevant events start from today to 7 days ahead
    now = datetime.now(pytz.utc)
    relevanteventlist = [event for event in eventlist
                         if (type(event[DTSTART].dt) is datetime and
                             event[DTSTART].dt > now and
                             event[DTSTART].dt < now + timedelta(days=7) and
                             event[STATUS] == 'CONFIRMED')]

    # Persist events to database
    for event in relevanteventlist:
        entry = create_calendarentry_from_ical_event(event)
        entry.user = user
        entry.save()


def create_calendarentry_from_ical_event(event):
    """Creates CalendarEntry from icalendar.Event"""
    summary = event[SUMMARY].to_ical()
    location = event[LOCATION].to_ical()
    start_time = event[DTSTART].dt
    end_time = event[DTEND].dt
    return CalendarEntry(summary=summary, location=location,
                         start_time=start_time, end_time=end_time)
