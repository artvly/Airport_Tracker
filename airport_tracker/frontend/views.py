from django.shortcuts import render
from django.core.paginator import Paginator
from flights.models import Airport  
from .forms import AirportSearchForm
from django.http import JsonResponse
import math

def index(request):
    return render(request, 'frontend/index.html')

def about(request):
    return render(request,'frontend/about.html')

def available_airports(request):
    airports_list = Airport.objects.all().order_by('name')
    
    form=AirportSearchForm(request.GET or None)

    paginator = Paginator(airports_list, 20)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    return render(request, 'frontend/airports_list.html', {
        'page_obj': page_obj,
        'total_airports': airports_list.count(),
        'form':form
    })

def get_airport_coordinates(request, icao_code):
    try:
        airport = Airport.objects.get(icao_code=icao_code.upper())
        return JsonResponse({
            'name': airport.name,
            'icao': airport.icao_code,
            'latitude': airport.latitude,
            'longitude': airport.longitude,
            'city': airport.city,
            'country': airport.country
        })
    except Airport.DoesNotExist:
        return JsonResponse({'error': 'Аэропорт не найден'}, status=404)

def airport_map_view(request):
    return render(request, 'frontend/map.html')

def search_results(request):
    # Обрабатывает отправку формы поиска
    form = AirportSearchForm(request.GET)
    
    if form.is_valid():
        query = form.cleaned_data['search'].strip()
        
        if query:
            airports = Airport.objects.filter(
                name__icontains=query
            ) | Airport.objects.filter(
                city__icontains=query
            ) | Airport.objects.filter(
                country__icontains=query.upper()
            ) | Airport.objects.filter(
                icao_code__icontains=query.upper()
            )
            airports = airports.distinct().order_by('name')
        else:
            airports = Airport.objects.all().order_by('name')
    else:
        airports = Airport.objects.all().order_by('name')
    
    paginator = Paginator(airports, 20)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    return render(request, 'frontend/search_results.html', {
        'form': form,
        'page_obj': page_obj,
        'query': query if 'query' in locals() else '',
        'total_results': airports.count()
    })

def autocomplete_airports(request):

    query = request.GET.get('q', '').strip()
    
    if len(query) < 2:
        return JsonResponse({'results': []})
    
    airports = Airport.objects.filter(
        name__icontains=query
    ) | Airport.objects.filter(
        city__icontains=query
    ) | Airport.objects.filter(
        country__icontains=query.upper()
    ) 
    
    airports = airports.distinct()[:10]
    
    results = []
    for airport in airports:
        results.append({
            'id': airport.icao_code,
            'text': f"{airport.name} ({airport.icao_code}) - {airport.city}, {airport.country}",
            'name': airport.name,
            'city': airport.city,
            'country': airport.country,  # Две буквы: "RU", "US" и т.д.
            'icao': airport.icao_code,
            'longitude':airport.longitude,
            'latitude':airport.latitude
        })
    

    return JsonResponse({'results': results})

def haversine_distance(lat1, lon1, lat2, lon2):
    # Вычисляет расстояние между двумя точками на Земле в км
    R = 6371  # радиус Земли в км
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = (math.sin(delta_lat/2)**2 + 
         math.cos(lat1_rad) * math.cos(lat2_rad) * 
         math.sin(delta_lon/2)**2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c

def airports_in_radius(request):
# Возвращает аэропорты в радиусе от заданной точки
    lat = float(request.GET.get('lat'))
    lon = float(request.GET.get('lon'))
    radius = float(request.GET.get('radius'))

    all_airports = Airport.objects.all()

    airports_in_radius = []
    for airport in all_airports:
        # Вычисляем расстояние
        distance = haversine_distance(lat, lon,airport.latitude, airport.longitude)
        
        if distance <= radius:
            airports_in_radius.append({
                'name': airport.name,
                'icao': airport.icao_code,
                'iata': airport.iata_code,
                'latitude': airport.latitude,
                'longitude': airport.longitude,
                'city': airport.city,
                'country': airport.country,
                'distance': round(distance, 2)
            })

    return JsonResponse({
        'success': True,
        'count': len(airports_in_radius),
        'airports': airports_in_radius
    })