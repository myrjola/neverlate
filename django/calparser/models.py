from django.db import models

from django.contrib.auth.models import User


class CalendarEntry(models.Model):
    """User specific calendar entry"""
    summary = models.CharField("summary", max_length=200)
    location = models.CharField("location", max_length=200)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    user = models.ForeignKey(User)

    def __str__(self):
        return "%s-%s: %s @ %s" % (self.start_time, self.end_time,
                                   self.summary, self.location)
