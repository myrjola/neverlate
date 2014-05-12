#from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.conf.urls import patterns, include, url
from django.contrib import admin
from views import LoginProviderRedirect, LoginProviderCallback

admin.autodiscover()

urlpatterns = patterns('',
                       # Examples:
                       # url(r'^$', 'neverlate.views.home', name='home'),
                       # url(r'^blog/', include('blog.urls')),

                       url(r'^admin/', include(admin.site.urls)),
                       url(r'^tasks/', include('djcelery.urls')),
                       url(r'^accounts/login/(?P<provider>(\w|-)+)/$', LoginProviderRedirect.as_view(),
                           name='allaccess-login'),
                       url(r'^accounts/callback/(?P<provider>(\w|-)+)/$', LoginProviderCallback.as_view(),
                           name='allaccess-callback'),
                       url(r'^$', 'neverlate.views.frontpage', ),
                       url(r'^appointments',
                           'neverlate.views.getAppointmentsForUser', ),
                       url(r'^aliases',
                           'neverlate.views.getLocationAliasesForUser', ),
                       url(r'^register/$', 'neverlate.views.register', name="Neverlate Registration"),
                       url(r'^profile/$', 'neverlate.views.profile', name="Neverlate Profile"),
                       url(r'^profile/status/', 'neverlate.views.reload_calendars_ajax_view', name="async status"),
                       # for ajax

                       url(r'^login/$', 'django.contrib.auth.views.login', name="Neverlate Login"),
                       url(r'^logout/$', 'django.contrib.auth.views.logout', {"next_page": "/"},
                           name="Neverlate Logout"),
                       url(r'^change_password/$', 'django.contrib.auth.views.password_change',
                           {"post_change_redirect": "neverlate.views.profile"}, name="Neverlate Password Change"),
)

#urlpatterns += staticfiles_urlpatterns()
