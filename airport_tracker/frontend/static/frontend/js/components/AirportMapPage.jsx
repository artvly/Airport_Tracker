import React, { useState, useEffect, useRef} from 'react';
import MapComponent from './MapComponent';

 
 const AirportMapPage = ({history}) => {
    const [searchValue, setSearchValue] = useState('');//значение с поисковика в данный момент времени
    const [suggestions, setSuggestions] = useState([]);
    const [selectedAirport, setSelectedAirport] = useState(null); // Только один!
    const [loading, setLoading] = useState(false);
    const suggestionsRef = useRef(null);
    const inputRef = useRef(null);

    // Функция для получения подсказок
    const fetchSuggestions = async (query) => {
        if (query.length < 2) {
            setSuggestions([]);
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(
                 `/api/airport-autocomplete/?q=${encodeURIComponent(query)}`
            );
            
            if (!response.ok) throw new Error('API error');
            
            const data = await response.json();
            setSuggestions(data.results || []);
        } catch (error) {
            console.error('Autocomplete error:', error);
            setSuggestions([]);
        } finally {
            setLoading(false);
        }
    };

    // Дебаунс для запросов
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchSuggestions(searchValue);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchValue]);

    // Клик вне подсказок - скрываем их
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (suggestionsRef.current && 
                !suggestionsRef.current.contains(event.target) &&
                inputRef.current && 
                !inputRef.current.contains(event.target)) {
                setSuggestions([]);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Выбор аэропорта из подсказок
    const handleSelectAirport = (airport) => {
        const airportWithCoords = {
            name: airport.name,
            icao: airport.icao,
            latitude: airport.latitude || 0,
            longitude: airport.longitude || 0,
            city: airport.city,
            country: airport.country
        };
        
        setSelectedAirport(airportWithCoords); // Заменяем, а не добавляем
        setSearchValue(airport.name); // Показываем название в поле
        setSuggestions([]);
    };

    // Очистка выбранного аэропорта
    const handleClearAirport = () => {
        setSelectedAirport(null);
        setSearchValue('');
    };

    // Обработка клавиш (ESC - скрыть подсказки, Enter - выбрать первую подсказку)
    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            setSuggestions([]);
        }
        if (e.key === 'Enter' && suggestions.length > 0) {
            handleSelectAirport(suggestions[0]);
        }
    };
    return (
         <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
                 <h1 onClick={()=>(history.push('/'))} 
                    style={{ color: '#ddd', marginBottom: '30px'}}>
                <img 
                    src="https://img.icons8.com/emoji/48/airplane-emoji.png" 
                    alt="Назад на главную"
                    onMouseOver={(e) => e.currentTarget.style.cursor = 'pointer'}/>
                Карта аэропортов</h1>
            {/* Поиск с автоподсказками */}
            <div style={{ position: 'relative', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ position: 'relative','flex':1}}>
                        <input ref={inputRef} type="text" 
                            placeholder={selectedAirport ? "Аэропорт выбран" : "Начните вводить название, город или код..."}
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            style={{...inputStyle, backgroundColor: selectedAirport ? '#e8f5e9' : 'white'}}
                            autoComplete="off"
                            disabled={selectedAirport}
                        />
                        
                        {/* Выпадающий список подсказок */}
                        {suggestions.length > 0 && (
                            <div ref={suggestionsRef} style={suggestionsStyle}>
                                {suggestions.map((airport, index) => (
                                    <div 
                                        key={`${airport.icao}-${index}`}
                                        onClick={() => handleSelectAirport(airport)}
                                        style={suggestionItemStyle}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f8ff'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}>
                                        <div style={{ fontWeight: 'bold' }}>
                                            {airport.name} 
                                            <span style={{ marginLeft: '10px', fontFamily: 'monospace', color: '#3498db'
                                            }}>
                                                {airport.icao}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '0.9em', color: '#7f8c8d' }}>
                                            📍 {airport.city}, {airport.country}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    {/* Кнопка очистки если аэропорт выбран */}
                    {selectedAirport ? (
                        <button 
                            onClick={handleClearAirport}
                            style={{
                                ...searchButtonStyle,
                                backgroundColor: '#e74c3c'
                            }}
                            title="Очистить">
                            ❌ Очистить
                        </button>
                    ) : (
                        <button 
                            onClick={() => {
                                if (searchValue.trim()) {
                                    fetchSuggestions(searchValue);
                                }
                            }}
                            style={searchButtonStyle}
                            disabled={loading}>
                            {loading ? '⏳' : '🔍'} Поиск
                        </button>
                    )}
                </div>
                
                {/* Подсказка под полем */}
                <div style={{ fontSize: '0.9em', color: '#7f8c8d', marginTop: '5px' }}>
                    {selectedAirport 
                        ? `Выбран: ${selectedAirport.name} (${selectedAirport.icao})`
                        : 'Примеры: "Moscow", "UUEE", "New York", "Heathrow"'
                    }
                </div>
            </div>

            {/* Информация о выбранном аэропорте */}
            {selectedAirport && (
                <div>
                    <h3 style={{ marginTop: 0, color: '#27ae60' }}>
                        ✓ Аэропорт выбран
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div>
                            <h4 style={{ marginBottom: '5px' }}>{selectedAirport.name}</h4>
                            <p style={{ margin: 0 }}>
                                <strong>Код ICAO:</strong> {selectedAirport.icao}
                            </p>
                            <p style={{ margin: 0 }}>
                                <strong>Местоположение:</strong> {selectedAirport.city}, {selectedAirport.country}
                            </p>
                        </div>
                        <div>
                            <p style={{ margin: 0 }}>
                                <strong>Широта:</strong> {selectedAirport.latitude.toFixed(4)}
                            </p>
                            <p style={{ margin: 0 }}>
                                <strong>Долгота:</strong> {selectedAirport.longitude.toFixed(4)}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Карта */}
            <div style={mapContainerStyle}> 
                <MapComponent airports={selectedAirport ? [selectedAirport] : []} />
            </div>

            {/* Инструкция
            <div style={instructionStyle}>
                <p style={{ margin: 0 }}>
                    <strong>💡 Как пользоваться:</strong> Введите название в поле выше → 
                    выберите аэропорт из подсказок → он появится на карте. 
                    Для выбора другого аэропорта нажмите "Очистить".
                </p>
            </div> */}
        </div>
    );
};

            

// Стили вынесены для читаемости


const inputStyle = {
    width: '100%',
    padding: '12px 15px',
    fontSize: '16px',
    border: '2px solid #3498db',
    borderRadius: '6px',
    outline: 'none',
    transition: 'border-color 0.3s',
    boxSizing: 'border-box'
};

const suggestionsStyle = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    border: '1px solid #ddd',
    borderRadius: '4px',
    maxHeight: '300px',
    overflowY: 'auto',
    zIndex: 1000,
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
};

const suggestionItemStyle = {
    padding: '10px',
    cursor: 'pointer',
    borderBottom: '1px solid #eee'
};

const searchButtonStyle = {
    padding: '12px 25px',
    fontSize: '16px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    whiteSpace: 'nowrap'
};

const selectedAirportsStyle = {
    padding: '15px',
    backgroundColor: '#ecf0f1',
    borderRadius: '6px',
    marginBottom: '20px'
};

const airportTagStyle = {
    padding: '8px 12px',
    backgroundColor: 'white',
    borderRadius: '20px',
    border: '1px solid #bdc3c7',
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px'
};

const removeButtonStyle = {
    background: 'none',
    border: 'none',
    color: '#e74c3c',
    cursor: 'pointer',
    fontSize: '18px',
    padding: '0 5px'
};

const mapContainerStyle = {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
};

const instructionStyle = {
    marginTop: '20px',
    marginBottom: '40px',
    padding: '15px',
    backgroundColor: '#fffde7',
    borderRadius: '6px',
    borderLeft: '4px solid #f1c40f'

};

export default AirportMapPage;