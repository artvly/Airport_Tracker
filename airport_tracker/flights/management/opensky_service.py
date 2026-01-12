import requests
import json
import time
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
from django.utils import timezone
from django.core.cache import cache
import logging


logger = logging.getLogger(__name__)
load_dotenv()

class OpenSkyService:
    BASE_URL = "https://opensky-network.org/api"

    def __init__(self, username=os.getenv('OpenSky_username'), password=os.getenv('OpenSky_password')):
        # Для публичного API не нужны учетные данные
        self.username = username
        self.password = password
        self.session = requests.Session()
    
    def get_flights_by_airport(self, airport_icao, hours=24):
        # Получить исторические рейсы аэропорта
        print(f"Получаем исторические рейсы для {airport_icao} за {hours} часов", flush=True)
        
        try:
            import time
            end_time = int(time.time())
            start_time = end_time - (hours * 3600)
            
            url = f"{self.BASE_URL}/flights/airport"
            params = {
                'airport': airport_icao,  # Используем icao кода аэропорта
                'begin': start_time,
                'end': end_time
            }
            
            print(f"Параметры запроса: {params}", flush=True)
            
            # Используем авторизацию
            auth = (self.username, self.password)
            
            response = self.session.get(url, params=params, auth=auth, timeout=30)
            print(f"Статус ответа: {response.status_code}", flush=True)
            
            if response.status_code == 200:
                data = response.json()
                print(f"Получено {len(data)} рейсов", flush=True)
                print(f"Пример рейса: {data[0] if data else 'Нет данных'}", flush=True)
                
                # OpenSky возвращает массив рейсов
                # Разделим на вылеты и прилеты по полю 'estDepartureAirport'
                departures = [f for f in data if f.get('estDepartureAirport') == airport_icao]
                arrivals = [f for f in data if f.get('estArrivalAirport') == airport_icao]
                
                return {
                    'departures': departures,
                    'arrivals': arrivals
                }
            else:
                print(f"Ошибка API: {response.status_code} - {response.text}", flush=True)
                return None
                
        except Exception as e:
            print(f"Ошибка: {e}", flush=True)
            import traceback
            traceback.print_exc()
            return  None