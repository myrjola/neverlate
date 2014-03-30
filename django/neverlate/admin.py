
from django.contrib import admin
from models import UserProfile, ICalURL, TooltipMessage, LocationAlias


class ICalURLInline(admin.TabularInline):
    model = ICalURL


class LocationAliasInline(admin.TabularInline):
    model = LocationAlias


class UserProfileAdmin(admin.ModelAdmin):
    inlines = [ICalURLInline, LocationAliasInline]


admin.site.register(UserProfile, UserProfileAdmin)
admin.site.register(TooltipMessage)
