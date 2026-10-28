import csv
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from flights.models import Airport

# Типы аэропортов из справочника OurAirports, которые загружаем
AIRPORT_TYPES = {'medium_airport', 'large_airport'}


class Command(BaseCommand):
    help = 'Импорт аэропортов из CSV (справочник OurAirports) в таблицу airports'

    def add_arguments(self, parser):
        parser.add_argument(
            '--file',
            type=str,
            default=str(Path(settings.BASE_DIR) / 'data' / 'airports.csv'),
            help='Путь к airports.csv (по умолчанию <папка с manage.py>/data/airports.csv)',
        )

    def handle(self, *args, **options):
        path = Path(options['file'])
        if not path.is_file():
            raise CommandError(f'Файл не найден: {path}')

        created = existing = 0
        with open(path, 'r', encoding='utf-8', newline='') as f:
            for row in csv.DictReader(f):
                if row['type'] not in AIRPORT_TYPES:
                    continue
                _, is_new = Airport.objects.get_or_create(
                    icao_code=row['ident'],
                    defaults={
                        'name': row['name'],
                        'iata_code': row['iata_code'] or '',
                        'city': row['municipality'],
                        'country': row['iso_country'],
                        'latitude': float(row['latitude_deg']),
                        'longitude': float(row['longitude_deg']),
                    },
                )
                if is_new:
                    created += 1
                else:
                    existing += 1
                if (created + existing) % 500 == 0:
                    self.stdout.write(f'Обработано {created + existing} аэропортов...')

        self.stdout.write(self.style.SUCCESS(
            f'Готово: добавлено {created}, уже было {existing}'
        ))
