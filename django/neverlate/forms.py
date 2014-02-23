from django.forms import ModelForm
from django.forms.models import inlineformset_factory

from models import UserProfile, User, ICalURL


CalendarFormSet = inlineformset_factory(UserProfile, ICalURL)


class UserProfileForm(ModelForm):
    class Meta:
        model = UserProfile
        fields = ['home_adress']


class UserForm(ModelForm):
    class Meta:
        model = User
        fields = ['email']
