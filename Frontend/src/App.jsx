import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Routes, Route, Link, useLocation } from 'react-router-dom'; 
import RestaurantView from './restaurantview.jsx';
import RegistrarRestaurante from './modulos/formularios/registrarRestaurante.jsx';
import Login from './modulos/formularios/login.jsx';
import RegistroExito from './modulos/RegistroExito.jsx';
import { AuthProvider } from './context/AuthContext';
import GerenteDashboard from './modulos/vistaGerente/GerenteDashboard.jsx';
import MeseroView from './modulos/Vista mesero/vista_mesero.jsx';
import CocinaView from './modulos/vista cocinero/vista_cocina.jsx';
import MenuComensal from './modulos/comensal/MenuComensal.jsx';
import './App.css';

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
  const location = useLocation();

  // Ocultar navbar en dashboards
  const hiddenPaths = ['/restaurante/', '/mesero-dashboard', '/cocina-dashboard'];
  if (hiddenPaths.some(path => location.pathname.includes(path))) {
    return null;
  } 

  const handleLinkClick = () => {
    if (isMobile) {
      setMenuOpen(false);
    }
  };

  if (isMobile) {
    return (
      <nav className="navbar mobile-navbar">
        <Link to="/" className="navbar-logo">ENTREMESA</Link> 
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? '✕' : '☰'} 
        </button>
        <ul className={`navbar-links mobile-menu ${menuOpen ? 'open' : ''}`}>
          <li><Link to="/" onClick={handleLinkClick}>Inicio</Link></li>
          <li><Link to="/acerca" onClick={handleLinkClick}>Acerca de</Link></li>
          <li><Link to="/restaurantes" onClick={handleLinkClick}>Restaurantes</Link></li>
          <li><Link to="/login" onClick={handleLinkClick}>Login</Link></li>
          <li><Link to="/registrar-restaurante" onClick={handleLinkClick}>Registrar Restaurante</Link></li>
        </ul>
      </nav>
    );
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">ENTREMESA</Link> 
      <ul className="navbar-links">
        <li><Link to="/">Inicio</Link></li>
        <li><Link to="/login"> Acceder</Link></li>
        <li><Link to="/registrar-restaurante">Registro de Restaurante</Link></li>

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
    <AuthProvider>
      <div className="app-container">
        <Navbar />
        <Routes>
          <Route path="/" element={
            <main>
              <Home />
              <Acerca />
              <Restaurantes />
            </main>
          } />
          <Route path="/registrar-restaurante" element={<RegistrarRestaurante />} />
          <Route path="/registro-exito" element={<RegistroExito />} />
          <Route path="/menu/:codigo_qr" element={<MenuComensal />} />
          <Route path="/mesa/:idMesa" element={<RestaurantView />} />
          <Route path="/login" element={<Login />} />
          <Route path="/restaurante/:id/dashboard" element={<GerenteDashboard />} />
          <Route path="/mesero/:id/dashboard" element={<MeseroView />} />
          <Route path="/cocinero/:id/dashboard" element={<CocinaView />} />
        </Routes>
        <Footer />
      </div>
    </AuthProvider>
  );
}

export default App;