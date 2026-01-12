from django.shortcuts import render
from django.core.paginator import Paginator
from flights.models import Airport,Flight  
from .forms import AirportSearchForm
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.cache import cache
import logging
import math

from rest_framework.decorators import api_view
from rest_framework.response import Response

logger = logging.getLogger(__name__)

@csrf_exempt
def index(request):
    return render(request, 'frontend/index.html')

@csrf_exempt
def about(request):
    return render(request,'frontend/about.html')

@csrf_exempt
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
    
    return render(request, { ##после request стояло 'frontend/search_results.html',
        'form': form,
        'page_obj': page_obj,
        'query': query if 'query' in locals() else '',
        'total_results': airports.count()
    })


#для автокомплита аэропортов
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

# Вычисляет расстояние между двумя точками на Земле в км
def haversine_distance(lat1, lon1, lat2, lon2):
    
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

# Возвращает аэропорты в радиусе от заданной точки
def airports_in_radius(request):

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

# API для получения рейсов для аэропорта
@api_view(['GET'])
def get_flights_for_airport(request):
    
    try:
        airport_icao = request.GET.get('icao')
        radius = float(request.GET.get('radius', 500))
        
        if not airport_icao:
            return JsonResponse({
                'success': False,
                'error': 'Не указан код аэропорта'
            }, status=400)
        
        # Получаем центральный аэропорт
        try:
            center_airport = Airport.objects.get(icao=airport_icao)
        except Airport.DoesNotExist:
            logger.info('апишка не раб')
            return JsonResponse({
                'success': False,
                'error': 'Аэропорт не найден'
            }, status=404)
        
        # Получаем аэропорты в радиусе
        airports_in_radius = airports_in_radius(
            center_airport.latitude,
            center_airport.longitude,
            radius
        )
        
        # Получаем рейсы из OpenSky
        opensky = OpenSkyService()
        opensky_data = opensky.get_flights_by_airport(airport_icao, hours=12)
        
        flights = []
        
        if opensky_data:
            # Фильтруем рейсы только к аэропортам в радиусе
            for flight_type in ['arrivals', 'departures']:
                for flight_data in opensky_data.get(flight_type, []):
                    other_airport_icao = flight_data.get(
                        'estArrivalAirport' if flight_type == 'departures' else 'estDepartureAirport'
                    )
                    
                    # Проверяем, есть ли этот аэропорт в радиусе
                    if other_airport_icao and any(
                        a['icao'] == other_airport_icao for a in airports_in_radius
                    ):
                        flights.append({
                            'callsign': flight_data.get('callsign', ''),
                            'type': 'departure' if flight_type == 'departures' else 'arrival',
                            'from_icao': center_airport.icao if flight_type == 'departures' else other_airport_icao,
                            'to_icao': other_airport_icao if flight_type == 'departures' else center_airport.icao,
                            'duration': flight_data.get('lastSeen', 0) - flight_data.get('firstSeen', 0),
                            'icao24': flight_data.get('icao24', '')
                        })
        else:
            logger.error('Пустой opensky-data!')
        
        return JsonResponse({
            'success': True,
            'airport': {
                'icao': center_airport.icao,
                'name': center_airport.name,
                'city': center_airport.city,
                'country': center_airport.country
            },
            'flights': flights,
            'total': len(flights)
        })
        
    except Exception as e:
        logger.error(f"Ошибка в get_flights_for_airport: {e}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


 # API для получения рейсов между центральным аэропортом и аэропортами в радиусе
@csrf_exempt
@api_view(['GET'])
def get_flights_with_radius(request):
   
    try:
        # Получаем параметры из запроса
        center_icao = request.GET.get('center_icao', '').upper()
        radius_km = float(request.GET.get('radius', 500))
        
        print(f"Запрос рейсов: center={center_icao}, radius={radius_km}km", flush=True)
        
        if not center_icao:
            return JsonResponse({
                'success': False,
                'error': 'Не указан центральный аэропорт'
            }, status=400)
        
        # 1. Находим центральный аэропорт
        try:
            center_airport = Airport.objects.get(icao_code=center_icao)
        except Airport.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': f'Аэропорт {center_icao} не найден'
            }, status=404)
         
        # 2. Находим все аэропорты в радиусе
        airports_in_radius_list = []
        
        all_airports = Airport.objects.exclude(icao_code=center_icao)
        # print(f"{len(all_airports)}", flush=True)
        for airport in all_airports:
            distance = haversine_distance(
                center_airport.latitude, 
                center_airport.longitude, 
                airport.latitude, 
                airport.longitude
            )
            if distance <= radius_km:
                # print(f"{airport.icao_code}", flush=True)
                airports_in_radius_list.append({
                    'icao': airport.icao_code,
                    'name': airport.name,
                    'latitude': airport.latitude,
                    'longitude': airport.longitude,
                    'city': airport.city,
                    'country': airport.country,
                    'distance_km': round(distance, 2)
                })
        print(f"Аэропорты в радиусе:{len(airports_in_radius_list)}", flush=True)
        # 3. Получаем рейсы из БД для центрального аэропорта
        flights_from_db = []
        
        # Рейсы ИЗ центрального аэропорта
        departure_flights = Flight.objects.filter(departure_airport__icao_code=center_icao).select_related('arrival_airport')
        print(f"Рейсы в из центрального аэропорта:{len(departure_flights)}", flush=True)
        
        for flight in departure_flights:
            # Проверяем, находится ли аэропорт назначения в радиусе
            dest_in_radius = any(
                a['icao'] == flight.arrival_airport.icao_code 
                for a in airports_in_radius_list
            )
            
            if dest_in_radius:
                flights_from_db.append({
                    'callsign': flight.callsign,
                    'type': 'departure',
                    'from_icao': center_icao,
                    'to_icao': flight.arrival_airport.icao_code,
                    'duration_min': flight.duration_minutes if hasattr(flight, 'duration_minutes') else 0,
                    'source': 'database'
                })
                print('добавляю в flights_from_db',flush=True)
        
        # Рейсы В центральный аэропорт
        arrival_flights = Flight.objects.filter(
            arrival_airport__icao_code=center_icao
        ).select_related('departure_airport')
        
        for flight in arrival_flights:
            # Проверяем, находится ли аэропорт отправления в радиусе
            origin_in_radius = any(
                a['icao'] == flight.departure_airport.icao_code 
                for a in airports_in_radius_list
            )
            
            if origin_in_radius:
                flights_from_db.append({
                    'callsign': flight.callsign,
                    'type': 'arrival',
                    'from_icao': flight.departure_airport.icao_code,
                    'to_icao': center_icao,
                    'duration_min': flight.duration_minutes if hasattr(flight, 'duration_minutes') else 0,
                    'source': 'database'
                })
        
        # 4. Если в БД нет рейсов, используем тестовые данные
        flights_data = []
        print(f"Найдено {len(flights_from_db)} рейсов из БД", flush=True)
        if flights_from_db:
            flights_data = flights_from_db
            logger.info(f"Найдено {len(flights_data)} рейсов из БД")
            print(f"Найдено {len(flights_data)} рейсов из БД", flush=True)
        else:
            print('ГЕНЕРИРУЮ!',flush=True)
            # Генерируем тестовые рейсы
            flights_data = generate_mock_flights(
                center_icao, 
                airports_in_radius_list,
                max_flights=min(30, len(airports_in_radius_list))
            )
            logger.info(f"Сгенерировано {len(flights_data)} тестовых рейсов")
        
        return JsonResponse({
            'success': True,
            'center_airport': {
                'icao': center_airport.icao_code,
                'name': center_airport.name,
                'city': center_airport.city,
                'country': center_airport.country,
                'latitude': center_airport.latitude,
                'longitude': center_airport.longitude
            },
            'airports_in_radius': airports_in_radius_list,
            'flights': flights_data,
            'statistics': {
                'total_flights': len(flights_data),
                'total_airports_in_radius': len(airports_in_radius_list),
                'departures': len([f for f in flights_data if f['type'] == 'departure']),
                'arrivals': len([f for f in flights_data if f['type'] == 'arrival'])
            }
        })
        
    except Exception as e:
        logger.error(f"Ошибка в get_flights_with_radius: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

# Генерация тестовых рейсов
def generate_mock_flights(center_icao, airports_in_radius, max_flights=5):
    flights = []
    airlines = ['SU', 'LH', 'AF', 'BA', 'AA', 'U6', 'S7']
    
    # Берем случайные аэропорты из радиуса
    import random
    airports_with_flights = random.sample(
        airports_in_radius, 
        min(max_flights, len(airports_in_radius))
    )
    
    for airport in airports_with_flights:
        # Случайно определяем тип рейса
        flight_type = random.choice(['departure', 'arrival'])
        
        flights.append({
            'callsign': f"{random.choice(airlines)}{random.randint(100, 9999)}",
            'type': flight_type,
            'from_icao': center_icao if flight_type == 'departure' else airport['icao'],
            'to_icao': airport['icao'] if flight_type == 'departure' else center_icao,
            'duration_min': random.randint(60, 360),
            'icao24': f"a{random.randint(100000, 999999):06x}",
            'source': 'mock'
        })
    
    return flights