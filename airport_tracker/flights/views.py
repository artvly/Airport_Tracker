import asyncio
from python_opensky import OpenSky
from django.http import JsonResponse
from django.shortcuts import render

async def fetch_aircraft():# Асинхронная функция для получения данных
    
    async with OpenSky() as opensky:# Запрашиваем все самолеты над Европой
        states = await opensky.get_states()
        return states

# def aircraft_map(request): # Основная view - показывает карту
#     return render(request, 'flight_tracker/map.html')

def aircraft_data(request):# API endpoint - отдает данные в JSON
    
    try:
        states_data = asyncio.run(fetch_aircraft())
        # Преобразуем в простой список словарей
        aircraft_list = []
        for state in states_data.states[:20]:  # Берем первые 20 самолетов
            aircraft_list.append({
                'callsign': state.callsign.strip() if state.callsign else 'N/A',
                'icao24' : state.icao24
                # 'latitude': state.latitude,
                # 'longitude': state.longitude,
                # 'velocity': state.velocity,
                # 'altitude': state.geo_altitude,
            })
        
        return JsonResponse({'aircraft': aircraft_list})
    
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)