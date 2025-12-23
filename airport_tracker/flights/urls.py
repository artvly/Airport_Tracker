from django.urls import path
from . import views

urlpatterns = [
    # path('', views.aircraft_map, name='map'),
    path('data/', views.aircraft_data, name='data'),
]   
