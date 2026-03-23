import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../context/ToastContext';
import { Lock, ArrowRight, Loader2, KeyRound } from 'lucide-react';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { addToast } = useToast();
  const navigate = useNavigate();

  const email = searchParams.get('email');
  const token = searchParams.get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      addToast('Las contraseñas no coinciden', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await axios.post('http://localhost:5001/api/auth/reset-password', {
        email,
        token,
        newPassword
      });
      addToast('Contraseña actualizada con éxito', 'success');
      navigate('/login');
    } catch (error) {
      addToast('Error al restablecer la contraseña. El enlace puede haber expirado.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!email || !token) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
          <h2 style={{ color: 'var(--text-primary)' }}>Enlace Inválido</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Falta el token de recuperación o el correo.</p>
          <button onClick={() => navigate('/login')} className="btn-primary" style={{ marginTop: '1rem' }}>Volver al Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-deep)' }}>
      <div className="bg-glow-top"></div>
      <div className="bg-glow-bottom"></div>
      
      <div className="glass-panel reveal" style={{ width: '100%', maxWidth: '420px', padding: '3rem', position: 'relative', zIndex: 1, borderRadius: '32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div className="icon-container" style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '1rem', borderRadius: '20px', width: 'fit-content', margin: '0 auto 1.5rem' }}>
            <KeyRound size={32} />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Nueva Contraseña</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Establece tu nueva clave de acceso</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ position: 'relative' }}>
            <Lock className="search-icon" size={18} style={{ left: '1.25rem' }} />
            <input 
              type="password"
              placeholder="Nueva contraseña"
              className="search-input"
              style={{ paddingLeft: '3.5rem', width: '100%', borderRadius: '16px' }}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <Lock className="search-icon" size={18} style={{ left: '1.25rem' }} />
            <input 
              type="password"
              placeholder="Confirmar contraseña"
              className="search-input"
              style={{ paddingLeft: '3.5rem', width: '100%', borderRadius: '16px' }}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={isLoading} style={{ padding: '1.25rem', justifyContent: 'center', fontSize: '1rem', marginTop: '1rem', borderRadius: '16px' }}>
            {isLoading ? <Loader2 className="spinning" size={20} /> : (
              <>
                Restablecer Contraseña
                <ArrowRight size={18} style={{ marginLeft: '0.75rem' }} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
