import {ChaoticShape} from '../utils/ChaoticShape.js';
import React, { useRef, useState, useEffect } from 'react';
import '../css/canvasoverlay.css';


const Particles = () => {
    const canvasRef = useRef(null);
    const [searchValue, setSearchValue] = useState('');

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        // Установка размеров canvas
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            ctx.fillStyle = '#0a0a16';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        };
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Массив хаотичных фигур
        const shapes = [];
        const mouse = { x: -1000, y: -1000, active: false };
        const allClosestPoints = [];

        

        // Рисуем соединения с курсором
        const drawConnections = () => {
            if (!mouse.active || allClosestPoints.length === 0) return;

            allClosestPoints.sort((a, b) => a.distance - b.distance);
            const closestCount = Math.min(15, Math.max(10, allClosestPoints.length));
            const pointsToConnect = allClosestPoints.slice(0, closestCount);

            ctx.beginPath();
            ctx.lineWidth = 0.8;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            pointsToConnect.forEach(item => {
                ctx.moveTo(mouse.x, mouse.y);
                ctx.lineTo(item.point.x, item.point.y);
            });
            ctx.stroke();

            if (pointsToConnect.length > 3) {
                ctx.beginPath();
                ctx.lineWidth = 1.1;
                ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
                pointsToConnect.slice(0, 4).forEach(item => {
                    ctx.moveTo(mouse.x, mouse.y);
                    ctx.lineTo(item.point.x, item.point.y);
                });
                ctx.stroke();
            }
        };

        // Создаём 18 фигур
        const initShapes = () => {
            for (let i = 0; i < 18; i++) {
                shapes.push(new ChaoticShape());
            }
        };

        // Анимация
        const animate = () => {
            ctx.fillStyle = '#0a0a16';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            allClosestPoints.length = 0;
            
            shapes.forEach(shape => {
                shape.update();
                shape.draw();
            });
            
            drawConnections();
            requestAnimationFrame(animate);
        };

        // Отслеживание мыши
        const handleMouseMove = (e) => {
            const rect = canvas.getBoundingClientRect();
           mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
            mouse.active = true;
        };

        const handleMouseLeave = () => {
            mouse.active = false;
        };

        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseleave', handleMouseLeave);

        // Инициализация и запуск
        initShapes();
        animate();

        // Cleanup
        return () => {
            window.removeEventListener('resize', resizeCanvas);
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchValue.trim()) {
            alert('Searching for: ' + searchValue);
            setSearchValue('');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch(e);
        }
    };

    return (
        <div>
             
            
            <div className="CanvasOverlayContainer">
                
                <span className="OverlayText">One two three four WHEEERE HAVE U BEEEN</span>
                
            </div>
            <canvas ref={canvasRef} id="shapesCanvas"></canvas>
            <div className="search-container">    
                <div className="search-input-wrapper">
                    <input 
                        type="text" 
                        className="search-input" 
                        placeholder="Search airports..."
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                    />
                    <button className="search-button" onClick={handleSearch}>
                        🔍
                    </button>
                </div>
            </div>

        </div>
    );
};

export default Particles;