from django.db import models

# class Flight(models.Model):
#     name='sample'

class Airport(models.Model):
    icao_code = models.CharField(max_length=8, primary_key=True)  # UUEE, UUDD
    iata_code = models.CharField(max_length=3, blank=True)        # SVO, DME
    name = models.CharField(max_length=200)
    city = models.CharField(max_length=100)
    country = models.CharField(max_length=100)
    latitude = models.FloatField()
    longitude = models.FloatField()
    
    def __str__(self):
        return f"{self.icao_code} ({self.name})"