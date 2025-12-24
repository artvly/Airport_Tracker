"""
URL configuration for airport_tracker project.
The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path,include
from frontend import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('',views.index,name='home'), #home,main
    path('about/',views.about,name='about'), #о нас
    path('all_airports/', views.available_airports,name='available_airports'),#все доступные аэропорты
    path('all_airports/', include('frontend.urls') ),
    path('api/airport-autocomplete/', views.autocomplete_airports, name='airport_autocomplete'),
    path('api/airport/<str:icao_code>/', views.get_airport_coordinates, name='airport_coordinates'),
    path('api/airports-in-radius/', views.airports_in_radius, name='airports_in_radius') # API для получения аэропортов в радиусе
    # path('api/', include('flights.urls')) 
]
