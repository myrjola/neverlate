
from django.contrib import admin
from models import UserProfile, ICalURL


class ICalURLInline(admin.TabularInline):
    model = ICalURL


class UserProfileAdmin(admin.ModelAdmin):
    inlines = [ICalURLInline]


admin.site.register(UserProfile, UserProfileAdmin)
