import requests
import json
from datetime import datetime, timedelta
from django.utils import timezone
from django.core.cache import cache
import logging

logger = logging.getLogger(__name__)

class OpenSkyService:
    BASE_URL = "https://opensky-network.org/api"
    
    def __init__(self, username=None, password=None):
        # Для публичного API не нужны учетные данные
        self.username = username
        self.password = password
        self.session = requests.Session()
    
    def get_flights_by_airport(self, airport_icao, hours=24):
        # Получить рейсы для аэропорта за последние N часов
        cache_key = f"opensky_flights_{airport_icao}_{hours}"
        cached_data = cache.get(cache_key)
        
        if cached_data:
            print(f"Используем кэшированные данные для {airport_icao}",flush=True)
            return cached_data
        
        try:
            # Получаем рейсы за последние N часов
            print(f"Получаем рейсы за последние N часов {airport_icao}",flush=True)
            end_time = int(timezone.now().timestamp())
            start_time = end_time - (hours * 3600)
            
            url = f"{self.BASE_URL}/flights/airport"
            params = {
                'icao': airport_icao,
                'begin': start_time,
                'end': end_time
            }
            
            if self.username and self.password:
                auth = (self.username, self.password)
            else:
                auth = None
            
            print(f"Запрашиваем данные OpenSky для {airport_icao}",flush=True)
            response = self.session.get(url, params=params, auth=auth, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                # Кэшируем на 5 минут
                cache.set(cache_key, data, 300)
                return data
            else:
                logger.error(f"Ошибка OpenSky API: {response.status_code}")
                return None
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Ошибка подключения к OpenSky: {e}")
            return None
    
    def get_all_flights(self, bbox=None):
        # Получить все активные рейсы в определенной области
        try:
            url = f"{self.BASE_URL}/states/all"
            
            if bbox:
                # bbox = [min_lon, min_lat, max_lon, max_lat]
                params = {
                    'lamin': bbox[1],
                    'lamax': bbox[3],
                    'lomin': bbox[0],
                    'lomax': bbox[2]
                }
                response = self.session.get(url, params=params, timeout=10)
            else:
                response = self.session.get(url, timeout=10)
            
            if response.status_code == 200:
                return response.json()
            return None
            
        except Exception as e:
            logger.error(f"Ошибка получения всех рейсов: {e}")
            return None
    
    def get_airport_info(self, airport_icao):
        # Получить информацию об аэропорте
        cache_key = f"opensky_airport_{airport_icao}"
        cached_data = cache.get(cache_key)
        
        if cached_data:
            return cached_data
        
        try:
            # OpenSky не имеет прямого API для информации об аэропортах
            # Используем наш локальный кэш
            return None
            
        except Exception as e:
            logger.error(f"Ошибка получения информации об аэропорте: {e}")
            return None