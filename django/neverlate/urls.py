from django.conf.urls import patterns, include, url

from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'neverlate.views.home', name='home'),
    # url(r'^blog/', include('blog.urls')),

    url(r'^admin/', include(admin.site.urls)),
    url(r'^$', 'neverlate.views.frontpage', ),
    url(r'^register/$', 'neverlate.views.register', name="Neverlate Registration"),
    url(r'^profile/$', 'neverlate.views.profile', name="Neverlate Profile"),
    url(r'^login/$', 'django.contrib.auth.views.login', name="Neverlate Login"),
    url(r'^logout/$', 'django.contrib.auth.views.logout', {"next_page": "/"}, name="Neverlate Logout"),
)
