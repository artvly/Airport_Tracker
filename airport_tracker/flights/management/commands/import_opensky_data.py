from django.core.management.base import BaseCommand
from django.utils import timezone
from flights.models import Airport, Flight
from flights.management.opensky_service import OpenSkyService
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Импорт данных из OpenSky API'
    
    def add_arguments(self, parser):
        parser.add_argument('--airport', type=str, help='ICAO код аэропорта')
        parser.add_argument('--hours', type=int, default=24, help='Количество часов')
    
    def handle(self, *args, **options):
        opensky = OpenSkyService()
        
        airport_icao = options['airport']
        hours = options['hours']
        
        if airport_icao:
            # Импорт для конкретного аэропорта
            self.import_flights_for_airport(opensky, airport_icao, hours)
        else:
            # Импорт для всех аэропортов в БД
            airports = Airport.objects.all()[:10]  # Ограничим для теста
            for airport in airports:
                self.import_flights_for_airport(opensky, airport.icao_code, hours)
    
    def import_flights_for_airport(self, opensky, airport_icao, hours):
        """Импорт рейсов для конкретного аэропорта"""
        logger.info(f"Импорт рейсов для {airport_icao} за последние {hours} часов")
        
        try:
            data = opensky.get_flights_by_airport(airport_icao, hours)
            
            if not data or 'arrivals' not in data or 'departures' not in data:
                logger.warning(f"Нет данных для {airport_icao}")
                return
            
            airport, _ = Airport.objects.get_or_create(
                icao_code=airport_icao,
                defaults={
                    'name': f'Аэропорт {airport_icao}',
                    'city': 'Неизвестно',
                    'country': 'Неизвестно',
                    'latitude': 0,
                    'longitude': 0
                }
            )
            
            # Обрабатываем вылеты
            for flight_data in data.get('departures', []):
                self.create_or_update_flight(flight_data, airport, is_departure=True)
            
            # Обрабатываем прилеты
            for flight_data in data.get('arrivals', []):
                self.create_or_update_flight(flight_data, airport, is_departure=False)
            
            logger.info(f"Импорт завершен для {airport_icao}")
            
        except Exception as e:
            logger.error(f"Ошибка импорта для {airport_icao}: {e}")
    
    def create_or_update_flight(self, flight_data, airport, is_departure):
        """Создание или обновление записи о рейсе"""
        try:
            callsign = flight_data.get('callsign', '').strip()
            if not callsign:
                return
            
            # Получаем аэропорт назначения/отправления
            other_airport_icao = flight_data.get('estArrivalAirport' if is_departure else 'estDepartureAirport')
            
            if not other_airport_icao:
                return
            
            other_airport, _ = Airport.objects.get_or_create(
                icao_code=other_airport_icao,
                defaults={
                    'name': f'Аэропорт {other_airport_icao}',
                    'city': 'Неизвестно',
                    'country': 'Неизвестно',
                    'latitude': 0,
                    'longitude': 0
                }
            )
            
            # Создаем или обновляем рейс
            flight, created = Flight.objects.update_or_create(
                callsign=callsign,
                icao24=flight_data.get('icao24'),
                departure_airport=airport if is_departure else other_airport,
                arrival_airport=other_airport if is_departure else airport,
                defaults={
                    'first_seen': timezone.datetime.fromtimestamp(flight_data.get('firstSeen', 0)),
                    'last_seen': timezone.datetime.fromtimestamp(flight_data.get('lastSeen', 0)),
                    'duration_minutes': (flight_data.get('lastSeen', 0) - flight_data.get('firstSeen', 0)) // 60,
                    'opensky_data': flight_data
                }
            )
            
            if created:
                logger.debug(f"Создан рейс: {flight}")
            else:
                logger.debug(f"Обновлен рейс: {flight}")
                
        except Exception as e:
            logger.error(f"Ошибка создания рейса: {e}")