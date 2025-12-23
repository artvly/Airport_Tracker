from django.shortcuts import render

from rest_framework import viewsets
from .models import Flight
from .serializers import ItemSerializer

class ItemViewSet(viewsets.ModelViewSet):
    queryset = Flight.objects.all()
    serializer_class = ItemSerializer
# Create your views here.
