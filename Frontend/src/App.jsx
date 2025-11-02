import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Routes, Route } from 'react-router-dom'; 
import RestaurantView from './restaurantview.jsx';

// CODIGO PARA DETECTAR DISPOSITIVO MOVIL
const useIsMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < breakpoint);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return isMobile;
};

// CODIGO PARA EL NAVBAR
function Navbar() {
  const isMobile = useIsMobile(); 
  const [menuOpen, setMenuOpen] = useState(false); 

  const handleLinkClick = () => {
    if (isMobile) {
      setMenuOpen(false);
    }
  };

  if (isMobile) {
    return (
      <nav className="navbar mobile-navbar">
        <a href="#inicio" className="navbar-logo">ENTREMESA</a> 
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? '✕' : '☰'} 
        </button>
        <ul className={`navbar-links mobile-menu ${menuOpen ? 'open' : ''}`}>
          <li><a href="#inicio" onClick={handleLinkClick}>Inicio</a></li>
          <li><a href="#acerca" onClick={handleLinkClick}>Acerca de</a></li>
          <li><a href="#restaurantes" onClick={handleLinkClick}>Restaurantes</a></li>
        </ul>
      </nav>
    );
  }

  return (
    <nav className="navbar">
      <a href="#inicio" className="navbar-logo">ENTREMESA</a> 
      <ul className="navbar-links">
        <li><a href="#inicio">Inicio</a></li>
        <li><a href="#acerca">Acerca de</a></li>
        <li><a href="#restaurantes">Restaurantes</a></li>
      </ul>
    </nav>
  );
}

// CODIGO INDEX O EL INICIO DE LA OPAGINA ENTREMESA 
function Home() {
  const [showScanner, setShowScanner] = useState(false);

  const handleScanSuccess = (decodedText, decodedResult) => {
    console.log(`Scan result: ${decodedText}`, decodedResult);
    alert(`Código escaneado: ${decodedText}`);
    setShowScanner(false);
  };

  return (
    <section id="inicio" className="hero-section">
      <div className="hero-content">
        <h1 className="hero-logo">ENTREMESA</h1>
        <h2 className="hero-tagline">¡Tu comida a un toque de distancia!</h2>
        <p className="hero-subtitle">
          Sin demoras. Estamos listos cuando tú lo desees.
        </p>
        <button 
          className="hero-cta-button"
          onClick={() => setShowScanner(true)}
        >
          Escanear QR
        </button>
      </div>

      {showScanner && (
        <QrScanner
          onScanSuccess={handleScanSuccess}
          onClose={() => setShowScanner(false)}
        />
      )}
    </section>
  );
}

// CODIGO PARA EL ESCANER DEL QR
function QrScanner({ onClose, onScanSuccess }) {
  const scannerRef = useRef(null);

  useEffect(() => {
    if (scannerRef.current) {
      return;
    }

    const scannerId = "qr-reader"; 
    const html5QrCode = new Html5Qrcode(scannerId);
    scannerRef.current = html5QrCode;
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    html5QrCode.start(
      { facingMode: "environment" },
      config,
      onScanSuccess, 
      (errorMessage) => { 
      }
    ).catch((err) => {
      console.error("No se pudo iniciar la cámara.", err);
      alert("Error: No se pudo iniciar la cámara. Asegúrate de estar en HTTPS y dar permisos.");
      onClose();
    });

    return () => {
      setTimeout(() => {
        if (scannerRef.current) {
          scannerRef.current.stop().then(() => {
            console.log("Scanner detenido.");
            scannerRef.current = null;
          }).catch((err) => {
            console.error("Error al detener el scanner.", err);
          });
        }
      }, 100); 
    };
  }, [onClose, onScanSuccess]); 

  return (
    <div className="qr-scanner-overlay">
      <div className="qr-scanner-modal">
        <div id="qr-reader"></div>
        <button className="qr-close-btn" onClick={onClose}>
          Cancelar
        </button>
      </div>
    </div>
  );
}


// COMPONENTE CON ANIMACIÓN 
function AnimatedSection({ id, children }) {
  const ref = useRef(null); 

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: 0.1, 
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []); 

  return (
    <section id={id} className="page-section" ref={ref}>
      {children}
    </section>
  );
}

// PÁGINA ACERCA DE
function Acerca() {
  return (
    <AnimatedSection id="acerca">
      <h2>Acerca de Entremesa</h2>
    </AnimatedSection>
  );
}

// PÁGINA RESTAURANTES
function Restaurantes() {
  return (
    <AnimatedSection id="restaurantes">
      <h2>Nuestros Restaurantes</h2>
    </AnimatedSection>
  );
}

// COMPONENTE FOOTER
function Footer() {
  return (
    <footer className="site-footer">
      <p>© 2025 Entremesa. Todos los derechos reservados.</p>
    </footer>
  );
}

// COMPONENTE PRINCIPAL App
function App() {
  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={
          <>
            <Navbar />
            <main>
                <Home />
                <Acerca />
                <Restaurantes />
            </main>
            <Footer />
          </>
        } />
        
        <Route path="/mesa/:idMesa" element={<RestaurantView />} /> 
      </Routes>
    </div>
  );
}

export default App;