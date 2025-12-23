from django.shortcuts import render
from django.core.paginator import Paginator
from flights.models import Airport  

# Create your views here.
def index(request):
    return render(request, 'frontend/index.html')

def about(request):
    return render(request,'frontend/about.html')

def available_airports(request):
    airports_list = Airport.objects.all().order_by('name')
    
    paginator = Paginator(airports_list, 20)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    return render(request, 'frontend/airports_list.html', {
        'page_obj': page_obj,
        'total_airports': airports_list.count()
    })