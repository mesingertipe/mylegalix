import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { t } from '../utils/i18n';
import api from '../services/api';
import { Mail, Lock, ShieldCheck, ArrowRight, Loader2, User, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [show2FA, setShow2FA] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState(1); // 1: Verify, 2: Reset
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryId, setRecoveryId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  
  const { login, config } = useAuth();
  const lang = config?.language || 'es-CO';
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await login(email, password, show2FA ? twoFactorCode : null);
      if (result.requires2FA) {
        setShow2FA(true);
        addToast(t('login.twoFaPrompt', lang), 'info');
      } else if (result.requirePasswordChange) {
        addToast(t('login.requirePasswordChange', lang), 'info');
        navigate('/change-password');
      } else {
        addToast(t('login.welcome', lang), 'success');
        navigate('/');
      }
    } catch (error) {
      addToast(error, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecoveryVerify = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post('/auth/recovery/verify', { email: recoveryEmail, nationalId: recoveryId });
      setRecoveryStep(2);
      addToast(t('login.identityVerified', lang), 'success');
    } catch (error) {
      addToast(error.response?.data?.message || t('login.dataMismatch', lang), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecoveryReset = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      addToast(t('login.passwordMismatch', lang), 'error');
      return;
    }
    setIsLoading(true);
    try {
      await api.post('/auth/recovery/reset', { 
        email: recoveryEmail, 
        nationalId: recoveryId,
        newPassword 
      });
      addToast(t('login.passwordResetOk', lang), 'success');
      setIsRecovery(false);
      setRecoveryStep(1);
      setPassword('');
    } catch (error) {
      addToast(error.response?.data?.message || t('login.resetError', lang), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const pValid = {
    length: newPassword.length >= 8,
    letter: /[a-zA-Z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[^a-zA-Z0-9]/.test(newPassword)
  };
  const canReset = Object.values(pValid).every(v => v) && newPassword === confirmPassword && newPassword !== '';

  return (
    <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-deep)' }}>
      <div className="bg-glow-top"></div>
      <div className="bg-glow-bottom"></div>
      
      <div className="glass-panel reveal" style={{ width: '100%', maxWidth: '420px', padding: '3rem', position: 'relative', zIndex: 1, borderRadius: '32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <img 
            src="/assets/logo.png" 
            alt="MyLegalix Logo" 
            style={{ width: '120px', height: '120px', margin: '0 auto 1.5rem', display: 'block' }} 
          />
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
            MYLEGALIX<span className="logo-dot">.</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 500 }}>
            {isRecovery ? t('login.recovery', lang) : show2FA ? t('login.twoFaVerify', lang) : t('login.subtitle', lang)}
          </p>
        </div>

        {isRecovery ? (
          recoveryStep === 1 ? (
            <form onSubmit={handleRecoveryVerify} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ position: 'relative' }}>
                <Mail className="search-icon" size={18} style={{ left: '1.25rem' }} />
                <input 
                  type="email"
                  placeholder={t('login.emailPlaceholder', lang)}
                  className="search-input"
                  style={{ paddingLeft: '3.5rem', width: '100%', borderRadius: '16px' }}
                  required
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                />
              </div>
              <div style={{ position: 'relative' }}>
                <User className="search-icon" size={18} style={{ left: '1.25rem' }} />
                <input 
                  type="text"
                  placeholder={t('users.nationalId')}
                  className="search-input"
                  style={{ paddingLeft: '3.5rem', width: '100%', borderRadius: '16px' }}
                  required
                  value={recoveryId}
                  onChange={(e) => setRecoveryId(e.target.value)}
                />
              </div>
              <button type="submit" className="btn-primary" disabled={isLoading} style={{ padding: '1.25rem', justifyContent: 'center', borderRadius: '16px' }}>
                {isLoading ? <Loader2 className="spinning" size={20} /> : t('login.verifyIdentity', lang)}
              </button>
              <button onClick={() => { setIsRecovery(false); setRecoveryStep(1); }} type="button" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer' }}>
                {t('login.backToLogin', lang)}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRecoveryReset} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ position: 'relative' }}>
                <Lock className="search-icon" size={18} style={{ left: '1.25rem' }} />
                <input 
                  type={showPwd ? "text" : "password"}
                  placeholder={t('login.newPasswordPlaceholder', lang)}
                  className="search-input"
                  style={{ paddingLeft: '3.5rem', paddingRight: '3.5rem', width: '100%', borderRadius: '16px' }}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: '1.25rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock className="search-icon" size={18} style={{ left: '1.25rem' }} />
                <input 
                  type="password"
                  placeholder={t('login.confirmPasswordPlaceholder', lang)}
                  className="search-input"
                  style={{ paddingLeft: '3.5rem', width: '100%', borderRadius: '16px' }}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '16px', border: '1px solid var(--card-border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <ValidationRule met={pValid.length} text={t('login.rule8chars', lang)} />
                  <ValidationRule met={pValid.letter} text={t('login.ruleLetters', lang)} />
                  <ValidationRule met={pValid.number} text={t('login.ruleNumbers', lang)} />
                  <ValidationRule met={pValid.special} text={t('login.ruleSpecial', lang)} />
              </div>

              <button type="submit" className="btn-primary" disabled={isLoading || !canReset} style={{ padding: '1.25rem', justifyContent: 'center', borderRadius: '16px', opacity: canReset ? 1 : 0.6 }}>
                {isLoading ? <Loader2 className="spinning" size={20} /> : t('login.changePassword', lang)}
              </button>
            </form>
          )
        ) : (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {!show2FA ? (
              <>
                <div style={{ position: 'relative' }}>
                  <Mail className="search-icon" size={18} style={{ left: '1.25rem' }} />
                  <input 
                    type="email"
                    placeholder={t('login.emailPlaceholder', lang)}
                    className="search-input"
                    style={{ paddingLeft: '3.5rem', width: '100%', borderRadius: '16px' }}
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock className="search-icon" size={18} style={{ left: '1.25rem' }} />
                  <input 
                    type="password"
                    placeholder={t('login.passwordPlaceholder', lang)}
                    className="search-input"
                    style={{ paddingLeft: '3.5rem', width: '100%', borderRadius: '16px' }}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </>
            ) : (
              <div style={{ position: 'relative' }}>
                <ShieldCheck className="search-icon" size={18} style={{ left: '1.25rem' }} />
                <input 
                  autoFocus
                  type="text"
                  placeholder={t('login.twoFaPlaceholder', lang)}
                  className="search-input"
                  style={{ paddingLeft: '3.5rem', width: '100%', borderRadius: '16px', letterSpacing: '4px', textAlign: 'center', fontWeight: 800 }}
                  required
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                />
              </div>
            )}

            <button 
              type="submit" 
              className="btn-primary" 
              disabled={isLoading}
              style={{ padding: '1.25rem', justifyContent: 'center', fontSize: '1rem', marginTop: '1rem', borderRadius: '16px' }}
            >
              {isLoading ? (
                <Loader2 className="spinning" size={20} />
              ) : (
                <>
                  {show2FA ? t('login.verify', lang) : t('login.signIn', lang)}
                  <ArrowRight size={18} style={{ marginLeft: '0.75rem' }} />
                </>
              )}
            </button>
            {!show2FA && (
              <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                <button 
                  onClick={() => setIsRecovery(true)}
                  type="button"
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  {t('login.forgotPassword', lang)}
                </button>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

const ValidationRule = ({ met, text }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', color: met ? 'var(--success)' : 'var(--text-muted)' }}>
      {met ? <CheckCircle size={12} /> : <XCircle size={12} />}
      <span style={{ fontWeight: met ? 700 : 500 }}>{text}</span>
  </div>
);

export default LoginPage;
