import React, { useState, useEffect, useRef} from 'react';
import MapComponent from './MapComponent';

 
const AirportMapPage = ({history}) => {
const [searchValue, setSearchValue] = useState('');//значение с поисковика в данный момент времени
const [suggestions, setSuggestions] = useState([]);
const [selectedAirport, setSelectedAirport] = useState(null); // Только один!
const [loading, setLoading] = useState(false);
const [radius, setRadius] = useState(100);

const [airportsInRadius, setAirportsInRadius] = useState([]);
const [loadingAirports, setLoadingAirports] = useState(false);

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
        
        if (!response.ok) throw new Error('API1 error');
        
        const data = await response.json();
        setSuggestions(data.results || []);
    } catch (error) {
        console.error('Autocomplete error:', error);
        setSuggestions([]);
    } finally {
        setLoading(false);
    }
};
// Функция для получения аэропортов в радиусе
const fetchAirportsInRadius = async () => {
    if (!selectedAirport) return;
    
    setLoadingAirports(true);
    try {
        const response = await fetch(
            `/api/airports-in-radius/?lat=${selectedAirport.latitude}&lon=${selectedAirport.longitude}&radius=${radius}`
        );
        
        if (!response.ok) throw new Error('API2 error');
        
        const data = await response.json();
        setAirportsInRadius(data.airports || []);
        
    } catch (error) {
        console.error('Error fetching airports in radius:', error);
        setAirportsInRadius([]);
    } finally {
        setLoadingAirports(false);
    }
};
//при изменении радиуса или аэропорта все расстояния пересчитываем
useEffect(() => {
    if (selectedAirport && radius > 0) {
        fetchAirportsInRadius();
    }
}, [selectedAirport, radius]);

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


//изменение радиуса 
const handleRadiusChange = (e) => {
    setRadius(parseInt(e.target.value));
};
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
                style={{ color: '#ddd', marginTop: '60px'}}> {/**/}
            <img src="https://img.icons8.com/emoji/48/airplane-emoji.png" alt="Назад на главную"
                onMouseOver={(e) => e.currentTarget.style.cursor = 'pointer'}/>
                Карта аэропортов</h1>


            {/* Поиск с автоподсказками */}
            <div style={{ position: 'relative', marginBottom: '20px' }} > {/*2*/}
                <div style={{ display: 'flex' }}>
                    <div style={{ position: 'relative',width:'100%'}}>
                        <input ref={inputRef} type="text" 
                            placeholder={selectedAirport ? "Аэропорт выбран" : "Начните вводить название, город или код..."}
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            style={{...inputStyle, backgroundColor: selectedAirport ? '#e8f5e9' : 'white'}}
                            autoComplete="off"
                            disabled={selectedAirport}/>
                        

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
                                        <div style={{ fontWeight: 'bold' ,color:'#3498db'}}>
                                            {airport.name} 
                                            <span style={{ marginLeft: '10px', fontFamily: 'monospace', color: '#004878ff'
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
                            style={{...searchButtonStyle,backgroundColor: '#e74c3c'}}
                            title="Очистить">
                            ❌ Очистить
                        </button>
                    ) : (
                        <button 
                            onClick={() => {
                                if (searchValue.trim()) {fetchSuggestions(searchValue);}
                            }}
                            style={searchButtonStyle}
                            disabled={loading}>
                            {loading ? '⏳' : '🔍'} Поиск
                        </button>
                    )}
                </div>
                

                {/* Подсказка под полем */}
                <div style={{ fontSize: '0.9em', color: '#3498db', marginTop: '5px' }}>
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
                    ✓ Аэропорт выбран</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div>
                        <h4 style={{ marginBottom: '5px' }}>{selectedAirport.name}</h4>
                        <p style={{ margin: 0 }}><strong>Код ICAO:</strong> {selectedAirport.icao}</p>
                        <p style={{ margin: 0 }}><strong>Местоположение:</strong> {selectedAirport.city}, {selectedAirport.country}</p>
                    </div>
                    <div>
                        <p style={{ margin: 0 }}><strong>Широта:</strong> {selectedAirport.latitude.toFixed(4)}</p>
                        <p style={{ margin: 0 }}><strong>Долгота:</strong> {selectedAirport.longitude.toFixed(4)}</p>
                    </div>
                </div>
            </div>
        )}
        <div style={{ color: '#2ecc71', fontWeight: 'bold' }}>
                 Найдено: {airportsInRadius.length} аэропортов
        </div>


        {/* Карта */}
        <div style={{ display: 'flex', alignItems: 'center', marginTop: '20px' }}> 
        {/* Карта занимает большую часть */}
            <div style={{ flex: 1 }}>
                <MapComponent 
                    airports={selectedAirport ? [selectedAirport, ...airportsInRadius] : []}
                    radius={radius} // ← передаем значение радиуса
                    centerAirport={selectedAirport} // ← опционально, для будущих улучшений
                 />
            </div>


            {/* Вертикальный ползунок справа от карты */}
            {selectedAirport && (
                <div style={sliderContainerStyle}>
                    <div style={{ textAlign: 'center', marginBottom: '10px', fontWeight: 'bold' ,color:'#3498db'}}>
                        Радиус: {radius} км
                    </div>
                    <input
                        type="range"
                        min="50"
                        max="2000"
                        step="50"
                        value={radius}
                        onChange={handleRadiusChange}
                        style={verticalSliderStyle}
                        />
                    <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center',
                        marginTop: '10px',
                        fontSize: '0.8em',
                        color: '#666'}}>
                        <span>2000 км</span>
                        <span>↓</span>
                        <span>1000 км</span>
                        <span>↓</span>
                        <span>50 км</span>
                    </div>
                </div>
            )}
        </div>
        
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



const sliderContainerStyle = {
    marginLeft: '20px',
    padding: '20px',
    backgroundColor: '#f5f7fa',
    borderRadius: '10px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    height: '550px', // Примерно такая же высота как у карты
    justifyContent: 'center'
};

const verticalSliderStyle = {
    // WebkitAppearance: 'none',
    width: '100px',
    height: '300px',
    background: 'linear-gradient(to bottom, #2ecc71, #f1c40f, #e74c3c)',
    outline: 'none',
    borderRadius: '10px',
    WritingMode: 'vertical-lr',
    transform: 'rotate(-90deg)', // Чтобы движение вверх было увеличением
    cursor: 'pointer',
    
    // Стиль для бегунка
    // '&::WebkitSliderThumb': {
    //     WebkitAppearance: 'none',
    //     width: '30px',
    //     height: '30px',
    //     background: '#3498db',
    //     borderRadius: '50%',
    //     border: '2px solid white',
    //     boxShadow: '0 0 5px rgba(0,0,0,0.3)',
    //     cursor: 'pointer'
    // },
    // '&::MozRangeThumb': {
    //     width: '30px',
    //     height: '30px',
    //     background: '#3498db',
    //     borderRadius: '50%',
    //     border: '2px solid white',
    //     boxShadow: '0 0 5px rgba(0,0,0,0.3)',
    //     cursor: 'pointer'
    // }
};





export default AirportMapPage;