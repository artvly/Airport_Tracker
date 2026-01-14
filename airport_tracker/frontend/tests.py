from django.test import TestCase, Client
from django.urls import reverse
from flights.models import Airport
import json

class BasicViewsTests(TestCase):
    
    def setUp(self):
        self.client = Client()
        self.airport = Airport.objects.create(
            name="Test Airport",
            icao_code="TEST",
            iata_code="TST",
            latitude=55.0,
            longitude=37.0,
            city="Moscow",
            country="RU"
        )
    
    def test_index_view(self):
        # Тест главной страницы
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'frontend/index.html')
    
    def test_about_view(self):
        # Тест страницы 'О нас'
        response = self.client.get('/about/')
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'frontend/about.html')
    
    def test_available_airports_view(self):
        # Тест страницы со списком аэропортов   
        response = self.client.get('/all_airports/')
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'frontend/airports_list.html')
    
    def test_get_airport_coordinates_success(self):
        # Тест получения координат аэропорта
        response = self.client.get('/api/airport/TEST/')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertEqual(data['icao'], 'TEST')
        self.assertEqual(data['name'], 'Test Airport')
    
    def test_get_airport_coordinates_not_found(self):
        # Тест получения координат несуществующего аэропорта
        response = self.client.get('/api/airport/XXXX/')
        self.assertEqual(response.status_code, 404)
        data = json.loads(response.content)
        self.assertIn('error', data)
    
    def test_autocomplete_airports(self):
        # Тест автодополнения
        response = self.client.get('/api/airport-autocomplete/?q=test')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertIn('results', data)
    
    def test_autocomplete_short_query(self):
        # Тест автодополнения с коротким запросом
        response = self.client.get('/api/airport-autocomplete/?q=t')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertEqual(data['results'], [])
    
    def test_airports_in_radius_success(self):
        # Тест поиска аэропортов в радиусе
        response = self.client.get('/api/airports-in-radius/?lat=55.0&lon=37.0&radius=100')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertTrue(data['success'])
        self.assertIn('airports', data)
    
    # def test_airports_in_radius_missing_params(self):
    #     """Тест поиска в радиусе без параметров"""
    #     response = self.client.get('/api/airports-in-radius/')
    #     # Должен быть 400 или 500, в зависимости от реализации
    #     self.assertIn(response.status_code, [400, 500])
    
    def test_get_flights_with_radius_success(self):
        # Тест получения рейсов в радиусе
        response = self.client.get('/api/flights-with-radius/?center_icao=TEST&radius=100')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertTrue(data['success'])
        self.assertIn('flights', data)
    
    def test_get_flights_with_radius_no_airport(self):
        # Тест получения рейсов без указания аэропорта
        response = self.client.get('/api/flights-with-radius/')
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.content)
        self.assertFalse(data['success'])
    
    def test_get_flights_with_radius_invalid_airport(self):
        # Тест получения рейсов с несуществующим аэропортом
        response = self.client.get('/api/flights-with-radius/?center_icao=XXXX&radius=100')
        self.assertEqual(response.status_code, 404)
        data = json.loads(response.content)
        self.assertFalse(data['success'])


class URLPatternsTests(TestCase):
    #   Тесты URL паттернов
    
    def test_url_names(self):
        # Проверка имен URL
        self.assertEqual(reverse('home'), '/')
        self.assertEqual(reverse('about'), '/about/')
        self.assertEqual(reverse('available_airports'), '/all_airports/')
    
    def test_all_urls_exist(self):
        # Проверка что все URL работают
        urls = [
            '/',
            '/about/',
            '/all_airports/',
            '/api/airport-autocomplete/?q=test',
        ]
        
        for url in urls:
            response = self.client.get(url)
            self.assertNotEqual(response.status_code, 404, f"URL {url} вернул 404")
    
    def test_api_urls_return_json(self):
        # Проверка что API URL возвращают JSON
        Airport.objects.create(
            name="Test",
            icao_code="TEST",
            latitude=55.0,
            longitude=37.0,
            city="Test",
            country="TS"
        )
        
        api_urls = [
            '/api/airport/TEST/',
            '/api/airports-in-radius/?lat=55&lon=37&radius=100',
            '/api/flights-with-radius/?center_icao=TEST&radius=100',
        ]
        
        for url in api_urls:
            response = self.client.get(url)
            self.assertEqual(response['Content-Type'], 'application/json')


class ViewsErrorsTests(TestCase):
    # Тесты обработки ошибок в views
    
    def test_get_flights_for_airport_no_icao(self):
        # Тест get_flights_for_airport без кода аэропорта
        from frontend import views
        
        from django.test import RequestFactory
        factory = RequestFactory()
        request = factory.get('/')
        
        response = views.get_flights_for_airport(request)
        data = json.loads(response.content)
        self.assertEqual(response.status_code, 400)
        self.assertFalse(data['success'])
        self.assertIn('Не указан код аэропорта', data['error'])
    
    def test_search_results_view(self):
        
        response = self.client.get('/search/?search=test')
        # Эта функция не подключена в urls.py, поэтому должен быть 404
        self.assertEqual(response.status_code, 404)
    
    def test_airport_map_view(self):
        # Тест airport_map_view (есть в views, но нет в urls)
        response = self.client.get('/airport-map/')
        # Не подключено в urls.py
        self.assertEqual(response.status_code, 404)


class ModelsRequiredTests(TestCase):
    # Тесты, требующие модели
    
    def test_haversine_distance(self):
        """Тест функции расчета расстояния"""
        from frontend.views import haversine_distance
        
        # Расстояние до самой себя
        distance = haversine_distance(55.0, 37.0, 55.0, 37.0)
        self.assertEqual(distance, 0)
        
        # Положительное расстояние
        distance = haversine_distance(55.0, 37.0, 56.0, 38.0)
        self.assertGreater(distance, 0)
    
    def test_generate_mock_flights(self):
        # Тест генерации тестовых рейсов
        from frontend.views import generate_mock_flights
        
        airports = [
            {'icao': 'TEST1', 'name': 'Airport 1'},
            {'icao': 'TEST2', 'name': 'Airport 2'},
        ]
        
        flights = generate_mock_flights('CENTER', airports, max_flights=2)
        
        self.assertLessEqual(len(flights), 2)
        for flight in flights:
            self.assertIn('callsign', flight)
            self.assertIn('type', flight)
            self.assertIn(flight['type'], ['departure', 'arrival'])