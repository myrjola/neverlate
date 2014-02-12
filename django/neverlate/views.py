from django.contrib.auth.forms import UserCreationForm
from django.http import HttpResponseRedirect
from django.shortcuts import render_to_response, render
from forms import UserProfileForm, UserForm

def frontpage(request):
    return render_to_response('base.html', {'user': request.user})

def register(request):
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            form.save()
            return HttpResponseRedirect("/")
    else:
        form = UserCreationForm()

    return render(request, "register.html", {'form': form})

def profile(request):
    profile_form = None
    user_form = None
    if request.user.is_authenticated():
        if request.method == 'POST':
            profile_form = UserProfileForm(request.POST, instance=request.user.userprofile)
            user_form = UserForm(request.POST, instance=request.user)
            if profile_form.is_valid() and user_form.is_valid():
                profile_form.save()
                user_form.save()
        else:
            profile_form = UserProfileForm(instance=request.user.userprofile)
            user_form = UserForm(instance=request.user)

    return render(request, 'profile.html',
                  {'authenticated': request.user.is_authenticated(),
                   'profile_form': profile_form,
                   'user_form': user_form})
