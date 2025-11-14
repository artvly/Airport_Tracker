const { useState, useEffect, useRef } = React;

function GridParticles() {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 4 + 2;
        this.speedX = Math.random() * 2 - 1;
        this.speedY = Math.random() * 2 - 1;
        this.color = `hsl(${Math.random() * 120 + 100}, 100%, 50%)`;
        this.originalSize = this.size;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        const dx = this.x - mouseRef.current.x;
        const dy = this.y - mouseRef.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 150) {
          const force = (150 - distance) / 150;
          this.speedX += (dx / distance) * force * 0.8;
          this.speedY += (dy / distance) * force * 0.8;
          this.size = this.originalSize * (1 + force * 2);
        } else {
          this.size = this.originalSize;
        }

        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;

        this.speedX *= 0.99;
        this.speedY *= 0.99;
      }

      draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        
        const sides = 6;
        const radius = this.size;
        
        for (let i = 0; i < sides; i++) {
          const angle = (i * 2 * Math.PI) / sides - Math.PI / 6;
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

    const initParticles = () => {
      particlesRef.current = [];
      const numberOfParticles = Math.min(80, Math.floor((canvas.width * canvas.height) / 10000));
      
      for (let i = 0; i < numberOfParticles; i++) {
        particlesRef.current.push(new Particle());
      }
    };

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      particlesRef.current.forEach((particle, index) => {
        particle.update();
        particle.draw();

        for (let j = index + 1; j < particlesRef.current.length; j++) {
          const dx = particle.x - particlesRef.current[j].x;
          const dy = particle.y - particlesRef.current[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(0, 255, 0, ${0.3 * (1 - distance / 120)})`;
            ctx.lineWidth = 0.8;
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(particlesRef.current[j].x, particlesRef.current[j].y);
            ctx.stroke();
          }
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    const handleMouseMove = (event) => {
      mouseRef.current.x = event.clientX;
      mouseRef.current.y = event.clientY;
    };

    const handleMouseLeave = () => {
      mouseRef.current.x = -1000;
      mouseRef.current.y = -1000;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    
    initParticles();
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const styles = {
    container: {
      position: 'relative',
      width: '100vw',
      height: '100vh',
      background: '#000',
      overflow: 'hidden',
      margin: 0,
      padding: 0
    },
    canvas: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      display: 'block'
    },
    searchContainer: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 100
    },
    searchInput: {
      padding: '18px 30px',
      fontSize: '20px',
      border: '2px solid rgba(0, 255, 0, 0.3)',
      borderRadius: '35px',
      width: '450px',
      background: 'rgba(0, 0, 0, 0.7)',
      color: '#00ff00',
      backdropFilter: 'blur(15px)',
      boxShadow: '0 10px 30px rgba(0, 255, 0, 0.1)',
      transition: 'all 0.3s ease',
      outline: 'none',
      fontFamily: 'Arial, sans-serif'
    }
  };

  return (
    <div style={styles.container}>
      <canvas 
        ref={canvasRef} 
        style={styles.canvas}
      />
      <div style={styles.searchContainer}>
        <input 
          type="text" 
          style={styles.searchInput} 
          placeholder="Введите запрос..."
          onFocus={(e) => {
            e.target.style.transform = 'scale(1.05)';
            e.target.style.borderColor = '#00ff00';
            e.target.style.boxShadow = '0 15px 40px rgba(0, 255, 0, 0.3)';
          }}
          onBlur={(e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.borderColor = 'rgba(0, 255, 0, 0.3)';
            e.target.style.boxShadow = '0 10px 30px rgba(0, 255, 0, 0.1)';
          }}
        />
      </div>
    </div>
  );
}

// Используем старый метод рендеринга для совместимости
ReactDOM.render(<GridParticles />, document.getElementById('root'));