
from django.shortcuts import render_to_response, render

def frontpage(request):
    return render_to_response('base.html', {'user': request.user})