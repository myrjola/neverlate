
from django.contrib import admin
from models import UserProfile, ICalURL, TooltipMessage


class ICalURLInline(admin.TabularInline):
    model = ICalURL


class UserProfileAdmin(admin.ModelAdmin):
    inlines = [ICalURLInline]


admin.site.register(UserProfile, UserProfileAdmin)
admin.site.register(TooltipMessage)