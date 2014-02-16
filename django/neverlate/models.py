from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save


class UserProfile(models.Model):
    user = models.OneToOneField(User)
    #other fields here
    home_adress = models.CharField("home address", max_length=200)

    def __str__(self):
        return "%s's profile" % self.user


class ICalURL(models.Model):
    user = models.ForeignKey(UserProfile)
    name = models.CharField(max_length=50)
    url = models.CharField(max_length=400)

    def __str__(self):
        return "%s: %s" % (self.name, self.url)


def create_user_profile(sender, instance, created, **kwargs):
    if created:
        profile, created = UserProfile.objects.get_or_create(user=instance)


post_save.connect(create_user_profile, sender=User)
