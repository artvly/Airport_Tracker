// src/components/AirportMapPage.jsx
import React from 'react';

const AirportMapPage = () => {
    console.log('✅ AirportMapPage загружен!');
    
    return (
        <div style={{
            padding: '40px',
            textAlign: 'center',
            backgroundColor: '#f0f8ff',
            minHeight: '100vh'
        }}>
            <h1 style={{ color: '#007bff' }}>🗺️ Страница карты аэропортов</h1>
            <p>Сюда будем добавлять карту OpenLayers и поиск</p>
            
            <div style={{
                marginTop: '30px',
                padding: '20px',
                backgroundColor: 'white',
                borderRadius: '10px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
                <h3>Что будет здесь:</h3>
                <ul style={{ textAlign: 'left', display: 'inline-block' }}>
                    <li>Карта OpenLayers</li>
                    <li>Поиск аэропортов</li>
                    <li>Маркеры на карте</li>
                </ul>
            </div>
        </div>
    );
};

export default AirportMapPage;