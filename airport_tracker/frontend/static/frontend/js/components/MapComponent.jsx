import React, { useRef, useEffect } from 'react';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import { Feature } from 'ol';
import { Point } from 'ol/geom';
import { Style, Icon } from 'ol/style';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

const MapComponent = ({ airport }) => {
  const mapRef = useRef();
  const mapInstance = useRef(null);

  useEffect(() => {
    if (!mapInstance.current) {
      // Инициализация карты
      mapInstance.current = new Map({
        target: mapRef.current,
        layers: [
          new TileLayer({
            source: new OSM()
          })
        ],
        view: new View({
          center: fromLonLat([37.6173, 55.7558]), // Москва по умолчанию
          zoom: 10
        })
      });
    }

    // Если передан аэропорт - добавляем маркер
    if (airport && airport.latitude && airport.longitude) {
      addAirportMarker(airport);
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.setTarget(null);
      }
    };
  }, [airport]);

  const addAirportMarker = (airport) => {
    // Очищаем старые маркеры
    mapInstance.current.getLayers().forEach((layer, index) => {
      if (index > 0) mapInstance.current.removeLayer(layer);
    });

    const marker = new Feature({
      geometry: new Point(fromLonLat([airport.longitude, airport.latitude])),
      name: airport.name
    });

    marker.setStyle(new Style({
      image: new Icon({
        src: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
        scale: 0.1
      })
    }));

    const vectorLayer = new VectorLayer({
      source: new VectorSource({
        features: [marker]
      })
    });

    mapInstance.current.addLayer(vectorLayer);
    
    // Центрируем карту на аэропорте
    mapInstance.current.getView().animate({
      center: fromLonLat([airport.longitude, airport.latitude]),
      zoom: 12,
      duration: 1000
    });
  };

  return <div ref={mapRef} style={{ width: '100%', height: '600px' }} />;
};

export default MapComponent;