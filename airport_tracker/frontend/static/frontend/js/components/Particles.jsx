// import {ChaoticShape} from '../utils/ChaoticShape.js';
import React, { useRef, useState, useEffect } from 'react';
import '../../css/bootstrap.css';
import '../../css/canvasoverlay.css';

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

        class ChaoticShape {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.angle = Math.random() * Math.PI * 2;
                this.speed = 0.02 + Math.random() * 0.04;
                this.pointCount = 6 + Math.floor(Math.random() * 5);
                this.baseRadius = 70 + Math.random() * 50;
                this.points = [];
                this.radii = [];
                this.angles = [];
                this.morphTimer = 0;
                this.morphSpeed = 0.0002 + Math.random() * 0.0003;
                this.baseAlpha = 0.09 + Math.random() * 0.07;
                this.currentAlpha = this.baseAlpha;
                this.width = 0.6 + Math.random() * 0.5;
                
                this.createChaoticShape();
            }

            createChaoticShape() {
                for (let i = 0; i < this.pointCount; i++) {
                    const baseAngle = (i / this.pointCount) * Math.PI * 2;
                    const angle = baseAngle + (Math.random() - 0.5) * 0.8;
                    const radius = this.baseRadius * (0.6 + Math.random() * 0.8);
                    
                    this.radii.push(radius);
                    this.angles.push(angle);
                    
                    this.points.push({
                        x: 0,
                        y: 0,
                        currentRadius: radius,
                        currentAngle: angle,
                        distanceToMouse: Infinity,
                        radiusSpeed: (Math.random() - 0.5) * 0.0008,
                        angleSpeed: (Math.random() - 0.5) * 0.0004
                    });
                }
                
                this.points.sort((a, b) => a.currentAngle - b.currentAngle);
                this.updatePointsPosition();
            }

            updatePointsPosition() {
                for (let i = 0; i < this.pointCount; i++) {
                    const point = this.points[i];
                    point.x = this.x + Math.cos(point.currentAngle) * point.currentRadius;
                    point.y = this.y + Math.sin(point.currentAngle) * point.currentRadius;
                }
            }

            update() {
                this.x += Math.cos(this.angle) * this.speed;
                this.y += Math.sin(this.angle) * this.speed;
                
                const margin = 80;
                if (this.x < margin || this.x > canvas.width - margin) {
                    this.angle = Math.PI - this.angle + (Math.random() - 0.5) * 0.08;
                    this.x = Math.max(margin, Math.min(canvas.width - margin, this.x));
                }
                if (this.y < margin || this.y > canvas.height - margin) {
                    this.angle = -this.angle + (Math.random() - 0.5) * 0.08;
                    this.y = Math.max(margin, Math.min(canvas.height - margin, this.y));
                }
                
                this.angle += (Math.random() - 0.5) * 0.0006;
                this.morphTimer += this.morphSpeed;
                
                for (let i = 0; i < this.pointCount; i++) {
                    const point = this.points[i];
                    
                    const radiusVariation = Math.sin(this.morphTimer * 0.15 + i * 1.5) * 0.15 +
                                          Math.cos(this.morphTimer * 0.25 + i * 2.0) * 0.1;
                    
                    const angleVariation = Math.sin(this.morphTimer * 0.12 + i * 1.2) * 0.15 +
                                         Math.cos(this.morphTimer * 0.2 + i * 1.6) * 0.1;
                    
                    const targetRadius = this.radii[i] * (0.85 + radiusVariation);
                    const targetAngle = this.angles[i] + angleVariation;
                    
                    point.currentRadius += (targetRadius - point.currentRadius) * 0.0015;
                    point.currentAngle += (targetAngle - point.currentAngle) * 0.0008;
                    point.currentRadius += point.radiusSpeed;
                    point.currentAngle += point.angleSpeed;
                    
                    if (Math.abs(point.radiusSpeed) > 0.002) point.radiusSpeed *= 0.97;
                    if (Math.abs(point.angleSpeed) > 0.001) point.angleSpeed *= 0.97;
                    
                    if (Math.random() < 0.0001) {
                        point.radiusSpeed = (Math.random() - 0.5) * 0.0015;
                    }
                    if (Math.random() < 0.0001) {
                        point.angleSpeed = (Math.random() - 0.5) * 0.0008;
                    }
                    
                    point.x = this.x + Math.cos(point.currentAngle) * point.currentRadius;
                    point.y = this.y + Math.sin(point.currentAngle) * point.currentRadius;
                    
                    if (mouse.active) {
                        point.distanceToMouse = Math.sqrt(
                            Math.pow(point.x - mouse.x, 2) + 
                            Math.pow(point.y - mouse.y, 2)
                        );
                        
                        if (point.distanceToMouse < 220) {
                            allClosestPoints.push({
                                point: point,
                                distance: point.distanceToMouse,
                                shape: this
                            });
                        }
                    } else {
                        point.distanceToMouse = Infinity;
                    }
                }

                const closePoints = this.points.filter(p => p.distanceToMouse < 220);
                if (closePoints.length > 0 && mouse.active) {
                    const avgDistance = closePoints.reduce((sum, p) => sum + p.distanceToMouse, 0) / closePoints.length;
                    const intensity = 1 - (avgDistance / 220);
                    this.currentAlpha = this.baseAlpha + intensity * 1.6;
                } else {
                    this.currentAlpha = this.baseAlpha;
                }
            }

            draw() {
                ctx.beginPath();
                ctx.lineWidth = this.width;
                ctx.strokeStyle = `rgba(255, 255, 255, ${this.currentAlpha})`;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';

                if (this.points.length > 0) {
                    ctx.moveTo(this.points[0].x, this.points[0].y);
                    
                    for (let i = 1; i < this.points.length; i++) {
                        ctx.lineTo(this.points[i].x, this.points[i].y);
                    }
                    
                    ctx.lineTo(this.points[0].x, this.points[0].y);
                    ctx.stroke();
                }
            }
        };


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
      const handle_about_btn=()=>{
        window.location.href='/about/';
    };

    return (
        <div>
            
            {/* <div className="CanvasOverlayContainer">
                <span className="OverlayText">One two three four WHEEERE HAVE U BEEEN</span>
            </div>  */}
        
            <div className="CanvasOverlayContainer">
                <button className="overlay-button" onClick={handle_about_btn}>О нас</button>
                <button className="overlay-button">Как пользоваться</button>
                <button className="overlay-button">Доступные аэропорты</button>
                <button className="overlay-button">В процессе</button>
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