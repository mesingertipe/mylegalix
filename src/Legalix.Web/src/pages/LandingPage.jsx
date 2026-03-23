import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Zap, 
  BarChart3, 
  CheckCircle2, 
  ArrowRight, 
  Globe, 
  Smartphone, 
  Coffee 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: <Zap className="text-yellow-400" size={24} />,
      title: "Escaneo Inteligente (OCR)",
      description: "Nuestra IA extrae automáticamente los datos de tus facturas y recibos en segundos."
    },
    {
      icon: <Shield className="text-blue-400" size={24} />,
      title: "Cumplimiento Fiscal Global",
      description: "Validación automática de documentos bajo regulaciones de Colombia, México y más."
    },
    {
      icon: <BarChart3 className="text-indigo-400" size={24} />,
      title: "Control en Tiempo Real",
      description: "Visualiza presupuestos, límites y estados de aprobación de forma instantánea."
    }
  ];

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--bg-deep)', 
      color: 'var(--text-primary)',
      overflowX: 'hidden',
      position: 'relative'
    }}>
      {/* Background Decorations */}
      <div className="bg-glow-top"></div>
      <div className="bg-glow-bottom"></div>

      {/* Navigation */}
      <nav style={{
        padding: '1.5rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: 'rgba(5, 8, 16, 0.5)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--card-border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/assets/logo.png" alt="Logo" style={{ width: '32px', height: '32px' }} />
          <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            MYLEGALIX<span style={{ color: 'var(--primary)' }}>.</span>
          </span>
        </div>
        <div>
          {isAuthenticated ? (
            <button 
              onClick={() => navigate('/dashboard')}
              className="btn-primary"
              style={{ padding: '0.6rem 1.25rem', borderRadius: '12px' }}
            >
              Ir al Dashboard
            </button>
          ) : (
            <button 
              onClick={() => navigate('/login')}
              className="btn-primary"
              style={{ padding: '0.6rem 1.25rem', borderRadius: '12px' }}
            >
              Iniciar Sesión
            </button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <header style={{ 
        padding: '10rem 2rem 6rem', 
        textAlign: 'center', 
        maxWidth: '1000px', 
        margin: '0 auto',
        position: 'relative'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '0.5rem 1rem',
          background: 'rgba(99, 102, 241, 0.1)',
          borderRadius: '999px',
          color: 'var(--primary)',
          fontSize: '0.8rem',
          fontWeight: 700,
          marginBottom: '2rem',
          border: '1px solid rgba(99, 102, 241, 0.2)'
        }}>
          <Globe size={14} />
          <span>Gestión de Viáticos para el Mundo Moderno</span>
        </div>
        
        <h1 style={{ 
          fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', 
          fontWeight: 900, 
          lineHeight: 1.1, 
          marginBottom: '1.5rem',
          letterSpacing: '-0.04em'
        }}>
          Gestiona tus gastos con <span style={{ 
            background: 'linear-gradient(to right, var(--primary), var(--secondary))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>Inteligencia Legal</span>
        </h1>
        
        <p style={{ 
          fontSize: '1.25rem', 
          color: 'var(--text-secondary)', 
          maxWidth: '700px', 
          margin: '0 auto 2.5rem',
          lineHeight: 1.6
        }}>
          La plataforma definitiva para PYMES que buscan automatizar la legalización de viáticos, 
          mantener el cumplimiento fiscal y tener control total de los costos.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button 
            onClick={() => navigate('/login')}
            className="btn-primary"
            style={{ padding: '1.25rem 2.5rem', fontSize: '1.1rem' }}
          >
            Comenzar ahora <ArrowRight size={20} style={{ marginLeft: '8px' }} />
          </button>
        </div>
      </header>

      {/* Features Grid */}
      <section style={{ padding: '1rem 2rem 8rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '2rem' 
        }}>
          {features.map((f, i) => (
            <div key={i} className="glass-panel" style={{ 
              padding: '2.5rem', 
              transition: 'transform 0.3s ease',
              cursor: 'default'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-10px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ 
                width: '50px', 
                height: '50px', 
                background: 'rgba(255, 255, 255, 0.05)', 
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.5rem',
                border: '1px solid var(--card-border)'
              }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>{f.title}</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.95rem' }}>{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Social Proof / Stats */}
      <section style={{ 
        padding: '6rem 2rem', 
        background: 'rgba(255, 255, 255, 0.02)', 
        borderTop: '1px solid var(--card-border)',
        borderBottom: '1px solid var(--card-border)',
        textAlign: 'center'
      }}>
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          justifyContent: 'center', 
          gap: '4rem',
          maxWidth: '1000px',
          margin: '0 auto'
        }}>
          {[
            { label: "Legalizaciones", value: "10k+" },
            { label: "Ahorro de Tiempo", value: "85%" },
            { label: "Cumplimiento", value: "100%" },
            { label: "Precisión OCR", value: "99.2%" }
          ].map((s, i) => (
            <div key={i}>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--primary)' }}>{s.value}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section style={{ padding: '8rem 2rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '2rem' }}>¿Listo para modernizar tu contabilidad?</h2>
        <button 
          onClick={() => navigate('/login')}
          className="btn-primary"
          style={{ padding: '1.25rem 2.5rem', fontSize: '1.1rem' }}
        >
          Crear cuenta gratuita
        </button>
      </section>

      {/* Footer */}
      <footer style={{ 
        padding: '4rem 2rem', 
        borderTop: '1px solid var(--card-border)', 
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.9rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '1.5rem' }}>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Privacidad</a>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Términos</a>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Soporte</a>
        </div>
        <p>© 2026 MyLegalix. Powered by Technology And Development.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
