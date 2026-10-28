# Airport Tracker

Веб-приложение для отслеживания рейсов в радиусе выбранного аэропорта в режиме реального времени.
Пользователь находит аэропорт по названию или коду (автодополнение), выбирает радиус, и на карте
отображаются воздушные суда и аэропорты поблизости. Данные о рейсах берутся из
[OpenSky Network](https://opensky-network.org/), справочник аэропортов — из
[OurAirports](https://ourairports.com/data/).

## Стек
- **Backend:** Python 3.13, Django 5.2, Django REST Framework, drf-spectacular (Swagger)
- **База данных:** PostgreSQL
- **Frontend:** React 17, react-router, OpenLayers (карта), сборка через Webpack/Babel
- **Данные:** OpenSky Network API, CSV-справочник аэропортов

## Возможности
- Поиск аэропорта с автодополнением
- Карта с рейсами вокруг выбранного аэропорта и аэропортами в заданном радиусе
- Страница со списком доступных аэропортов
- REST API со Swagger-документацией (`/swagger/`)
- Загрузка справочника аэропортов из CSV одной командой

## Быстрый старт

### 1. Клонирование и окружение
```powershell
git clone https://github.com/artvly/Airport_Tracker.git
cd Airport_Tracker
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 2. Настройка `.env`
В папке `airport_tracker` (рядом с `manage.py`) скопируйте шаблон и заполните значения:
```powershell
cd airport_tracker
copy .env.example .env
```
Нужны `SECRET_KEY`, данные подключения к PostgreSQL (`DB_NAME`, `DB_USER`, `DB_PASSWORD`);
учётные данные OpenSky необязательны.

### 3. База данных
Создайте базу в PostgreSQL (имя должно совпадать с `DB_NAME`):
```powershell
psql -U postgres -c "CREATE DATABASE dj_db OWNER ваш_пользователь;"
python manage.py migrate
```

### 4. Загрузка аэропортов
Скачайте `airports.csv` с [OurAirports](https://ourairports.com/data/) и положите в `airport_tracker/data/`, затем:
```powershell
python manage.py import_airports
```
Загружаются аэропорты типов `medium_airport` и `large_airport`. Другой путь к файлу: `--file путь\к\airports.csv`.
Повторный запуск безопасен, дубликаты не создаются.

### 5. Запуск
```powershell
python manage.py runserver
```
Сайт: http://127.0.0.1:8000/ · документация API: http://127.0.0.1:8000/swagger/

## Сборка фронтенда
Готовый `bundle.js` лежит в репозитории, поэтому для запуска Node.js не нужен. Если вы меняете
React-код (`frontend/static/frontend/js`), пересоберите бандл:
```powershell
npm install
npm run build      # разовая сборка
npm run dev        # сборка с отслеживанием изменений
```

## API
| Метод | URL | Назначение |
|---|---|---|
| GET | `/api/airport-autocomplete/` | подсказки аэропортов при вводе |
| GET | `/api/airport/<icao>/` | координаты аэропорта по коду ICAO |
| GET | `/api/flights/` | рейсы выбранного аэропорта |
| GET | `/api/airports-in-radius/` | аэропорты в заданном радиусе |
| GET | `/api/flights-with-radius/` | рейсы в заданном радиусе |
| GET | `/api/data/` | текущие позиции воздушных судов |
| GET | `/schema/`, `/swagger/` | OpenAPI-схема и Swagger UI |

## Тесты
```powershell
python manage.py test
```
При запуске тестов автоматически используется SQLite в памяти, PostgreSQL не требуется.

## Структура проекта
```
airport_tracker/
  airport_tracker/   настройки Django, корневые urls
  flights/           модели Airport/Flight, API, команды импорта (import_airports, import_opensky_data)
  frontend/          страницы, шаблоны и React-приложение (static/frontend/js)
  manage.py, webpack.config.js, package.json
requirements.txt     зависимости Python
```

## Лицензия
См. файл [LICENSE](LICENSE).
