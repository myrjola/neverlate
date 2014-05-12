from django.forms import ModelForm
from django.forms.models import BaseInlineFormSet, inlineformset_factory

from models import UserProfile, User, ICalURL, LocationAlias


class UserForm(ModelForm):
    class Meta:
        model = User
        fields = ['email']


class ICalURLForm(ModelForm):
    class Meta:
        model = ICalURL
        exclude = ('user',)


class LocationAliasForm(ModelForm):
    class Meta:
        model = LocationAlias
        exclude = ('user',)


def get_calendar_formset(form, formset=BaseInlineFormSet, **kwargs):
    return inlineformset_factory(UserProfile, ICalURL, form, formset, **kwargs)


def get_locationalias_formset(form, formset=BaseInlineFormSet, **kwargs):
    return inlineformset_factory(UserProfile,
                                 LocationAlias, form, formset, **kwargs)
