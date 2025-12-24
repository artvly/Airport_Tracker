from django.db import models
from django.utils import timezone


class Airport(models.Model):
    icao_code = models.CharField(max_length=8, primary_key=True)  # UUEE, UUDD
    iata_code = models.CharField(max_length=3, blank=True)        # SVO, DME
    name = models.CharField(max_length=200)
    city = models.CharField(max_length=100)
    country = models.CharField(max_length=100)
    latitude = models.FloatField()
    longitude = models.FloatField()
    class Meta:
        db_table = 'airports'
        ordering = ['name']
    def __str__(self):
        return f"{self.icao_code} ({self.name})"


class Flight(models.Model):
    # Основные данные рейса
    callsign = models.CharField(max_length=10, db_index=True)
    icao24 = models.CharField(max_length=6, blank=True, null=True)  # Код самолета
    
    # Аэропорты
    departure_airport = models.ForeignKey(
        Airport, 
        on_delete=models.CASCADE,
        related_name='departures',
        null=True,
        blank=True
    )
    arrival_airport = models.ForeignKey(
        Airport,
        on_delete=models.CASCADE,
        related_name='arrivals',
        null=True,
        blank=True
    )
     # Временные метки
    first_seen = models.DateTimeField(null=True, blank=True)
    last_seen = models.DateTimeField(null=True, blank=True)
    
    # Дополнительная информация
    duration_minutes = models.IntegerField(default=0)
    distance_km = models.FloatField(default=0)
    
    # Дата обновления
    last_updated = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Кэширование данных OpenSky
    opensky_data = models.JSONField(default=dict, blank=True)

    
    class Meta:
        db_table = 'flights'
        indexes = [
            models.Index(fields=['callsign']),
            models.Index(fields=['departure_airport', 'arrival_airport']),
            models.Index(fields=['last_updated']),
        ]
        ordering = ['-last_seen']
    
    def __str__(self):
        return f"{self.callsign}: {self.departure_airport} -> {self.arrival_airport}"