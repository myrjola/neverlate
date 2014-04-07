from __future__ import absolute_import

import urllib2

from datetime import datetime, timedelta
import pytz
from icalendar import Calendar, Event
from celery import shared_task
from dateutil.rrule import rrulestr

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
    eventlist = [component for component in calendar.walk('vevent')]

    now = datetime.now(pytz.utc)
    # Generate more events from recurrences
    recurrences = []
    for event in eventlist:
        rrules = None
        if 'rrule' in event:
            rrules = event['rrule']

        if rrules:
            duration = event[DTEND].dt - event[DTSTART].dt
            start = event[DTSTART].dt
            for recurrence_datetime in (rrulestr(
                    rrules.to_ical(), dtstart=start).between(
                        now, now + timedelta(days=7))):
                recurrence = Event()
                recurrence[SUMMARY] = event[SUMMARY]
                recurrence[LOCATION] = event[LOCATION]
                recurrence[STATUS] = 'CONFIRMED'
                recurrence.add('dtstart', recurrence_datetime)
                recurrence.add('dtend', recurrence_datetime + duration)
                recurrences.append(recurrence)

    eventlist += recurrences

    # Relevant events start from today to 7 days ahead
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
