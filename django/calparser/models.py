from django.db import models

from django.contrib.auth.models import User

import datetime


class CalendarEntry(models.Model):
    """User specific calendar entry"""
    summary = models.CharField("summary", max_length=200)
    location = models.CharField("location", max_length=200)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    user = models.ForeignKey(User)

    def __unicode__(self):
        return "%s-%s: %s @ %s" % (self.start_time, self.end_time,
                                   self.summary, self.location)

    @staticmethod
    def get_next_appointment_for_user(user_pk):
        """Get the next three appointments for user with user.pk == user_pk"""
        return CalendarEntry.objects.order_by('start_time').filter(
            user__pk=user_pk, start_time__gte=datetime.datetime.now()
        ).all()[:3]
