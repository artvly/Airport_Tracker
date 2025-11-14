// CustomParticles.jsx
import React, { useEffect, useRef } from 'react';
import './CustomParticles.css';

const CustomParticles = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Установка размеров canvas
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Создание частиц
    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * 2 - 1;
        this.speedY = Math.random() * 2 - 1;
        this.color = `hsl(${Math.random() * 120 + 100}, 100%, 50%)`;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Отталкивание от мыши
        const dx = this.x - mouseRef.current.x;
        const dy = this.y - mouseRef.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 100) {
          this.speedX += dx / distance * 0.5;
          this.speedY += dy / distance * 0.5;
        }

        // Границы
        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
      }

      draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        
        // Рисуем шестиугольник
        const sides = 6;
        const radius = this.size;
        
        for (let i = 0; i < sides; i++) {
          const angle = (i * 2 * Math.PI) / sides;
          const x = this.x + radius * Math.cos(angle);
          const y = this.y + radius * Math.sin(angle);
          
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        
        ctx.closePath();
        ctx.fill();
      }
    }

    // Инициализация частиц
    const initParticles = () => {
      particlesRef.current = [];
      const numberOfParticles = (canvas.width * canvas.height) / 9000;
      
      for (let i = 0; i < numberOfParticles; i++) {
        particlesRef.current.push(new Particle());
      }
    };

    // Анимация
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Обновление и отрисовка частиц
      particlesRef.current.forEach((particle, index) => {
        particle.update();
        particle.draw();

        // Соединение линиями близких частиц
        for (let j = index + 1; j < particlesRef.current.length; j++) {
          const dx = particle.x - particlesRef.current[j].x;
          const dy = particle.y - particlesRef.current[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 100) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(0, 255, 0, ${0.2 * (1 - distance / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(particlesRef.current[j].x, particlesRef.current[j].y);
            ctx.stroke();
          }
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    // Обработчики мыши
    const handleMouseMove = (event) => {
      mouseRef.current.x = event.clientX;
      mouseRef.current.y = event.clientY;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    
    initParticles();
    animate();

    // Очистка
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <div className="custom-particles">
      <canvas ref={canvasRef} className="particles-canvas" />
      <div className="search-container">
        <input 
          type="text" 
          className="search-input" 
          placeholder="Введите запрос..."
        />
      </div>
    </div>
  );
};

export default CustomParticles;