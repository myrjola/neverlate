
from django.shortcuts import render_to_response, render

def hello(request):
    return render_to_response('index.html')