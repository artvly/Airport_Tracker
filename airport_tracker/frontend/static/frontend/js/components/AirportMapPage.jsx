import React, { useState } from 'react';
import MapComponent from './MapComponent';

const AirportMapPage = ({history}) => {
    const [searchValue, setSearchValue] = useState('');
    const [airports, setAirports] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async () => {
        if (!searchValue.trim()) return;
        
        setLoading(true);
        
        try {
            // Запрос к Django API для поиска аэропортов
            const response = await fetch(
                `/api/airport-autocomplete/?q=${encodeURIComponent(searchValue)}`
            );
            
            if (!response.ok) throw new Error('API error');
            
            const data = await response.json();
            
            // Преобразуем данные для карты
            const mappedAirports = data.results.map(item => ({
                name: item.name,
                icao: item.icao,
                latitude: item.latitude || null,
                longitude: item.longitude || null,
                city: item.city,
                country: item.country
            }));
            
            setAirports(mappedAirports.filter(a => a.latitude && a.longitude));
            
        } catch (error) {
            console.error('Search error:', error);
            alert('Ошибка поиска аэропортов');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
                 <h1 onClick={()=>(history.push('/'))} 
                    style={{ color: '#ddd', marginBottom: '30px'}}>
                <img 
                    src="https://img.icons8.com/emoji/48/airplane-emoji.png" 
                    alt="Назад на главную"
                    onMouseOver={(e) => e.currentTarget.style.cursor = 'pointer'}
                    
                />
                Карта аэропортов
            </h1>
            
            {/* Поисковая строка */}
            <div style={{
                display: 'flex',
                gap: '10px',
                marginBottom: '20px',
                alignItems: 'center'
            }}>
                <input 
                    type="text" 
                    placeholder="Введите название, город или код аэропорта..."
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    onClick={(e) => e.key === 'Enter' && handleSearch()}
                    style={{
                        flex: 1,
                        padding: '12px 15px',
                        fontSize: '16px',
                        border: '2px solid #3498db',
                        borderRadius: '6px',
                        outline: 'none',
                        transition: 'border-color 0.3s'
                    }}
                />
                <button 
                    onClick={handleSearch}
                    disabled={loading}
                >
                    {loading ? '⏳' : '🔍'} 
                </button>
            </div>

            {/* Результаты поиска */}
            {airports.length > 0 && (
                <div style={{
                    padding: '15px',
                    backgroundColor: '#ecf0f1',
                    borderRadius: '6px',
                    marginBottom: '20px'
                }}>
                    <h3 style={{ marginTop: 0 }}>
                        Найдено аэропортов: {airports.length}
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {airports.map((airport, index) => (
                            <div 
                                key={index}
                                style={{
                                    padding: '8px 12px',
                                    backgroundColor: 'white',
                                    borderRadius: '4px',
                                    border: '1px solid #bdc3c7'
                                }}
                            >
                                <strong>{airport.name}</strong> ({airport.icao})
                                <div style={{ fontSize: '0.9em', color: '#7f8c8d' }}>
                                    {airport.city}, {airport.country}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Карта */}
            <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '10px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
                <h3 style={{ marginTop: 0, color: '#34495e' }}>
                    {airports.length > 0 
                        ? `Аэропорты на карте (${airports.length})`
                        : 'Карта аэропортов мира'
                    }
                </h3>
                <MapComponent airports={airports} />
            </div>

            
        </div>
    );
};

export default AirportMapPage;