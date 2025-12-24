// MapComponent.jsx
import React, { useEffect, useRef } from 'react';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat,toLonLat } from 'ol/proj';
import { Feature } from 'ol';
import { Point, LineString, Circle as CircleGeometry } from 'ol/geom';
import { Style, Icon, Stroke, Fill, Circle as CircleStyle } from 'ol/style';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

const MapComponent = ({ airports = [], centerAirport = null, radius = 500, flights = [] }) => {
    const mapRef = useRef();
    const mapInstance = useRef(null);
    const airportsLayer = useRef(null);
    const flightsLayer = useRef(null);
    const radiusLayer = useRef(null);

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

            mapInstance.current.addLayer(airportsLayer.current);
            mapInstance.current.addLayer(flightsLayer.current);
            mapInstance.current.addLayer(radiusLayer.current);
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

        // Добавляем аэропорты
        // airports.forEach(airport => {
        //     if (airport.latitude && airport.longitude) {
        //         const isCenter = centerAirport && airport.icao === centerAirport.icao;
                
        //         const marker = new Feature({
        //             geometry: new Point(
        //                 fromLonLat([airport.longitude, airport.latitude])
        //             ),
        //             name: airport.name,
        //             icao: airport.icao,
        //             isCenter: isCenter
        //         });

        //         // Стиль для центрального аэропорта и обычных
        //         const style = new Style({
        //             image: new CircleStyle({
        //                 radius: isCenter ? 10 : 6,
        //                 fill: new Fill({
        //                     color: isCenter ? '#e74c3c' : '#3498db'
        //                 }),
        //                 stroke: new Stroke({
        //                     color: isCenter ? '#c0392b' : '#2980b9',
        //                     width: isCenter ? 3 : 2
        //                 })
        //             }),
        //             text: new Style({
        //                 text: airport.icao,
        //                 font: 'bold 12px Arial',
        //                 fill: new Fill({
        //                     color: isCenter ? '#c0392b' : '#2c3e50'
        //                 }),
        //                 offsetY: isCenter ? -15 : -12,
        //                 stroke: new Stroke({
        //                     color: 'white',
        //                     width: 3
        //                 })
        //             })
        //         });

        //         marker.setStyle(style);
        //         airportsLayer.current.getSource().addFeature(marker);
        //     }
        // });

        // Добавляем линии рейсов
        // flights.forEach(flight => {
        //     const sourceAirport = airports.find(a => a.icao === flight.source);
        //     const destAirport = airports.find(a => a.icao === flight.destination);
            
        //     if (sourceAirport && destAirport) {
        //         const line = new Feature({
        //             geometry: new LineString([
        //                 fromLonLat([sourceAirport.longitude, sourceAirport.latitude]),
        //                 fromLonLat([destAirport.longitude, destAirport.latitude])
        //             ]),
        //             flightInfo: flight
        //         });

        //         flightsLayer.current.getSource().addFeature(line);
        //     }
        // });

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
            }} 
        >

                
        </div>
    );
};



export default MapComponent;