import React,{ useEffect, useRef } from 'react';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat,toLonLat } from 'ol/proj';
import { Feature } from 'ol';
import { Point, LineString, Circle as CircleGeometry } from 'ol/geom';
import { Style, Icon, Stroke, Fill, Circle as CircleStyle } from 'ol/style';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

const MapComponent = ({ airports = [], centerAirport = null, radius = 50, flights = [] }) => {
   
    const mapRef = useRef();
    const mapInstance = useRef(null);
    const airportsLayer = useRef(null);
    const flightsLayer = useRef(null);
    const radiusLayer = useRef(null);
    const markerLayer = useRef(null);

    // Функция для расчета координат круга радиуса
    const createRadiusCircle = (centerLonLat, radiusKm) => {
        const center = fromLonLat(centerLonLat);
        const earthRadius = 6371; // Радиус Земли в км
        const angularDistance = radiusKm / earthRadius;
        
        const circlePoints = [];
        for (let i = 0; i <= 360; i += 10) {
            const bearing = (i * Math.PI) / 180;
            const lat1 = (centerLonLat[1] * Math.PI) / 180;
            const lon1 = (centerLonLat[0] * Math.PI) / 180;
            
            const lat2 = Math.asin(
                Math.sin(lat1) * Math.cos(angularDistance) +
                Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearing)
            );
            
            const lon2 = lon1 + Math.atan2(
                Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat1),
                Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2)
            );
            
            const pointLonLat = [
                (lon2 * 180) / Math.PI,
                (lat2 * 180) / Math.PI
            ];
            
            circlePoints.push(fromLonLat(pointLonLat));
        }
        
        return new CircleGeometry(center, radiusKm * 1000); // OpenLayers использует метры
    };


    useEffect(() => {
        // Инициализация карты
        
        if (!mapInstance.current) {
            console.log('🗺️ Инициализируем карту OpenLayers');
            
            mapInstance.current = new Map({
                target: mapRef.current,
                layers: [
                    new TileLayer({
                        source: new OSM()
                    })
                ],
                view: new View({
                    center: fromLonLat([37.6173, 55.7558]), // Москва по умолчанию
                    zoom: 5
                })
            });

            // Создаем слои
            airportsLayer.current = new VectorLayer({
                source: new VectorSource()
            });
            
            flightsLayer.current = new VectorLayer({
                source: new VectorSource(),
                style: new Style({
                    stroke: new Stroke({
                        color: '#3498db',
                        width: 2,
                        lineDash: [5, 5]
                    })
                })
            });
            
            radiusLayer.current = new VectorLayer({
                source: new VectorSource(),
                style: new Style({
                    stroke: new Stroke({
                        color: 'rgba(231, 76, 60, 0.6)',
                        width: 2
                    }),
                    fill: new Fill({
                        color: 'rgba(231, 76, 60, 0.1)'
                    })
                })
            });

            markerLayer.current = new VectorLayer({
                source: new VectorSource()
            });

            mapInstance.current.addLayer(markerLayer.current);
            mapInstance.current.addLayer(airportsLayer.current);
            mapInstance.current.addLayer(flightsLayer.current);
            mapInstance.current.addLayer(radiusLayer.current);
        }
        // Очищаем старые маркеры
        if (markerLayer.current) {
            markerLayer.current.getSource().clear();
        }
        // Очищаем старые данные
        airportsLayer.current.getSource().clear();
        flightsLayer.current.getSource().clear();
        radiusLayer.current.getSource().clear();

        // Добавляем круг радиуса
        if (centerAirport && radius > 0) {
            const centerLonLat = [centerAirport.longitude, centerAirport.latitude];
            const radiusCircle = createRadiusCircle(centerLonLat, radius);
            
            const radiusFeature = new Feature({
                geometry: radiusCircle
            });
            
            radiusLayer.current.getSource().addFeature(radiusFeature);
        }

        // Добавляем маркер для центрального аэропорта (если он есть)
        if (centerAirport && centerAirport.latitude && centerAirport.longitude) {
           
            const centerMarker = new Feature({
                geometry: new Point(
                    fromLonLat([centerAirport.longitude, centerAirport.latitude])
                ),
                name: centerAirport.name
            });

            // Стиль для центрального аэропорта (красный)
            centerMarker.setStyle(new Style({
                image: new Icon({
                    src: 'https://cdn-icons-png.flaticon.com/512/684/684908.png', // или другая иконка
                    scale: 0.1, // чуть больше обычных
                    anchor: [0.5, 1],
                    anchorXUnits: 'fraction',
                    anchorYUnits: 'fraction'
                })
            }));

            markerLayer.current.getSource().addFeature(centerMarker);
        }
        // Создаем маркеры для всех аэропортов
        airports.forEach(airport => {
            if (airport.latitude && airport.longitude) {
                const isCenter = centerAirport && airport.icao === centerAirport.icao;
                
                const marker = new Feature({
                    geometry: new Point(
                        fromLonLat([airport.longitude, airport.latitude])
                    ),
                    name: airport.name,
                    isCenter: isCenter
                });

                // Разный стиль для центрального и обычных аэропортов
                const style = new Style({
                    image: new CircleStyle({
                        radius: isCenter ? 10 : 6,
                        fill: new Fill({
                            color: isCenter ? 'rgba(231, 76, 60, 0.8)' : 'rgba(52, 152, 219, 0.6)'
                        }),
                        stroke: new Stroke({
                            color: isCenter ? 'rgba(192, 57, 43, 1)' : 'rgba(41, 128, 185, 1)',
                            width: isCenter ? 3 : 2
                        })
                    })
                });

                marker.setStyle(style);
                markerLayer.current.getSource().addFeature(marker);
            }
        });

        if (centerAirport && flights.length > 0) {
    console.log(`Рисуем ${flights.length} линий рейсов`);
    
    const centerCoords = fromLonLat([
        centerAirport.longitude, 
        centerAirport.latitude
    ]);
    
    // Создаем Map для быстрого поиска аэропортов по ICAO
    const airportMap = {};
    airports.forEach(airport => {
        airportMap[airport.icao] = airport;
    });
    
    flights.forEach((flight, index) => {
        try {
            // Определяем аэропорты для этой линии
            let fromAirport, toAirport;
            
            if (flight.from_icao === centerAirport.icao) {
                // Рейс ИЗ центрального аэропорта
                fromAirport = centerAirport;
                toAirport = airportMap[flight.to_icao];
            } else if (flight.to_icao === centerAirport.icao) {
                // Рейс В центральный аэропорт
                fromAirport = airportMap[flight.from_icao];
                toAirport = centerAirport;
            } else {
                // Пропускаем рейсы, не связанные с центральным аэропортом
                return;
            }
            
            if (!fromAirport || !toAirport) {
                console.warn(`Не найден аэропорт для рейса ${flight.callsign}`);
                return;
            }
            
            const fromCoords = fromLonLat([fromAirport.longitude, fromAirport.latitude]);
            const toCoords = fromLonLat([toAirport.longitude, toAirport.latitude]);
            
            // Создаем кривую линию (простая версия без сложных вычислений)
            const createCurvedLine = (start, end) => {
                const points = [];
                const steps = 20;
                
                const dx = end[0] - start[0];
                const dy = end[1] - start[1];
                const midX = (start[0] + end[0]) / 2;
                const midY = (start[1] + end[1]) / 2;
                
                // Создаем небольшой изгиб
                const controlX = midX + dy * 0.2;
                const controlY = midY - dx * 0.2;
                
                // Квадратичная кривая Безье
                for (let i = 0; i <= steps; i++) {
                    const t = i / steps;
                    
                    const x = (1 - t) * (1 - t) * start[0] + 
                              2 * (1 - t) * t * controlX + 
                              t * t * end[0];
                    
                    const y = (1 - t) * (1 - t) * start[1] + 
                              2 * (1 - t) * t * controlY + 
                              t * t * end[1];
                    
                    points.push([x, y]);
                }
                
                return points;
            };
            
            const curvePoints = createCurvedLine(fromCoords, toCoords);
            
            const flightLine = new Feature({
                geometry: new LineString(curvePoints),
                flightData: {
                    callsign: flight.callsign,
                    from: flight.from_icao,
                    to: flight.to_icao,
                    type: flight.type
                }
            });
            
            // Определяем цвет линии
            const getLineColor = () => {
                if (flight.type === 'departure') return 'rgba(199, 54, 37, 0.7)'; // Красный для вылетов
                if (flight.type === 'arrival') return 'rgba(29, 188, 95, 0.7)'; // Зеленый для прилетов
                return 'rgba(52, 152, 219, 0.7)'; // По умолчанию - синий
            };
            
            // Стиль для линии рейса
            flightLine.setStyle(new Style({
                stroke: new Stroke({
                    color: getLineColor(),
                    width: 2,
                    // lineDash: [5, 5],
                    lineCap: 'round'
                })
            }));
            
            flightsLayer.current.getSource().addFeature(flightLine);
            
        } catch (error) {
            console.error(`Ошибка при создании линии для рейса:`, error);
        }
    });
}

        // Центрируем карту на центральном аэропорте
        if (centerAirport) {
            const zoomLevel = radius > 1000 ? 5 : radius > 500 ? 6 : radius > 200 ? 7 : 8;
            
            mapInstance.current.getView().animate({
                center: fromLonLat([centerAirport.longitude, centerAirport.latitude]),
                zoom: zoomLevel,
                duration: 1000
            });
        } else if (airports.length > 0) {
            // Если нет центра, центрируем на первом аэропорте
            const airport = airports[0];
            mapInstance.current.getView().animate({
                center: fromLonLat([airport.longitude, airport.latitude]),
                zoom: 10,
                duration: 1000
            });
        }

    }, [airports, centerAirport, radius, flights]);

    // Обработчик клика по карте
    const handleMapClick = (event) => {
        if (mapInstance.current && event.target === mapRef.current) {
            const coordinate = mapInstance.current.getEventCoordinate(event);
            const lonLat = toLonLat(coordinate);
            console.log('Клик по карте:', lonLat);
        }
    };

    return (
        <div 
            ref={mapRef} 
            onClick={handleMapClick}
            style={{ 
                width: '100%', 
                height: '600px', 
                border: '2px solid #007bff',
                borderRadius: '8px',
                marginTop: '20px',
                position: 'relative',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                cursor: 'pointer'
            }}>

                
        </div>
    );
};



export default MapComponent;