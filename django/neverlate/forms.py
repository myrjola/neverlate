from django.forms import ModelForm
from models import UserProfile, User


class UserProfileForm(ModelForm):
    class Meta:
        model = UserProfile
        fields = ['home_adress']


class UserForm(ModelForm):
    class Meta:
        model = User
        fields = ['email']
