import React, { useState } from 'react';
import api from '../services/api';
import { Key, Shield, Lock, Fingerprint, Eye, EyeOff, Smartphone, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { t } from '../utils/i18n';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/UI/Modal';
import { QRCodeSVG } from 'qrcode.react';

const SecurityPage = () => {
  const { addToast } = useToast();
  const { token, config, user, updateUser } = useAuth();
  const lang = config?.language || 'es-CO';
  
  const [tfaSecret, setTfaSecret] = useState('');
  const [tfaCode, setTfaCode] = useState('');
  const [isTfaSetupOpen, setIsTfaSetupOpen] = useState(false);
  const [isTfaLoading, setIsTfaLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSetupTFA = async () => {
    setIsTfaLoading(true);
    try {
      const response = await api.post('/auth/2fa/setup');
      setTfaSecret(response.data.secret);
      setIsTfaSetupOpen(true);
    } catch (error) {
      addToast(t('security.setup2faError', lang), 'error');
    } finally {
      setIsTfaLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    setIsTfaLoading(true);
    try {
      await api.post('/auth/2fa/verify', `"${tfaCode}"`, {
        headers: { 
          'Content-Type': 'application/json'
        }
      });
      addToast(t('security.verifySuccess', lang), 'success');
      updateUser({ is2FAEnabled: true });
      setIsTfaSetupOpen(false);
      setTfaCode('');
    } catch (error) {
      addToast(t('security.verifyError', lang), 'error');
    } finally {
      setIsTfaLoading(false);
    }
  };

  const handleToggle2FA = async (enable) => {
    if (enable) {
      handleSetupTFA();
    } else {
      setIsTfaLoading(true);
      try {
        await api.post('/auth/2fa/toggle', false, {
            headers: { 'Content-Type': 'application/json' }
        });
        updateUser({ is2FAEnabled: false });
        addToast('2FA Desactivado', 'success');
      } catch (error) {
        addToast('Error al desactivar 2FA', 'error');
      } finally {
        setIsTfaLoading(false);
      }
    }
  };

  return (
    <div className="reveal">
      <div style={{ height: '2rem' }}></div>


      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '2rem', 
        alignItems: 'start'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Basic Information Section */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <Fingerprint className="text-primary" />
                {t('security.basicInfo', lang)}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                    <label className="stat-label">{t('users.fullName', lang)}</label>
                    <p style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{user?.fullName}</p>
                </div>
                <div>
                    <label className="stat-label">{t('security.email', lang)}</label>
                    <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{user?.email || user?.Email || 'N/A'}</p>
                </div>
                <div>
                    <label className="stat-label">{t('users.role', lang)}</label>
                    <p style={{ color: 'var(--text-secondary)' }}>{user?.role || user?.Role}</p>
                </div>
                <div>
                    <label className="stat-label">{t('security.department', lang)}</label>
                    <p style={{ color: 'var(--text-secondary)' }}>{user?.departmentName || user?.DepartmentName || 'N/A'}</p>
                </div>
                <div>
                    <label className="stat-label">{t('users.reportsTo', lang)}</label>
                    <p style={{ fontWeight: 600, color: 'var(--primary)' }}>{user?.reportsToFullName || user?.ReportsToFullName || t('common.none', lang)}</p>
                </div>
            </div>
          </div>
          {/* API Keys Section */}
          {(user?.role === 'SuperAdmin' || user?.role === 'TenantAdmin') && (
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                  <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <Key className="text-primary" />
                          {t('security.apiKey', lang)}
                      </h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                          {t('security.apiKeyDesc', lang)}
                      </p>
                  </div>
                  <button className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>
                      <RefreshCw size={16} />
                      {t('security.regenerate', lang)}
                  </button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <ApiKeyItem name="ERP Sync Service" lastUsed="Hace 3 días" />
                <ApiKeyItem name="Zapier Integration" lastUsed="Hoy, 09:00 AM" />
              </div>

              <button className="btn-secondary" style={{ width: '100%', marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
                <Key size={18} />
                {t('security.generateKey', lang)}
              </button>
            </div>
          )}

          {/* 2FA Section */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Smartphone color="var(--success)" />
                        {t('security.twoFactor', lang)}
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                        {t('security.twoFactorDesc', lang)}
                    </p>
                </div>
                <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={user?.is2FAEnabled || false} 
                      onChange={(e) => handleToggle2FA(e.target.checked)}
                    />
                    <span className="slider round"></span>
                </label>
            </div>

            {user?.is2FAEnabled ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <Shield size={18} color="var(--success)" />
                  <span style={{ fontSize: '0.85rem', color: 'var(--success)', fontWeight: 600 }}>{t('security.twoFactorActive', lang)}</span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                  <AlertCircle size={18} color="var(--danger)" />
                  <span style={{ fontSize: '0.85rem', color: 'var(--danger)', fontWeight: 600 }}>2FA Desactivado</span>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Change Password Section */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <Lock color="var(--indigo)" />
                {t('security.changePassword', lang)}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '400px' }}>
                <div>
                    <label className="stat-label">{t('security.currentPassword', lang)}</label>
                    <input 
                        type="password" 
                        className="search-input" 
                        placeholder="••••••••"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                </div>
                <div>
                    <label className="stat-label">{t('security.newPassword', lang)}</label>
                    <input 
                        type="password" 
                        className="search-input" 
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                </div>
                <button className="btn-primary" style={{ marginTop: '0.5rem' }}
                  onClick={() => addToast(t('security.updatePassword', lang), 'info')}
                >
                    {t('security.updatePassword', lang)}
                </button>
            </div>

            <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--panel-bg)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    <AlertCircle size={16} />
                    <span>{t('security.passwordNote', lang)}</span>
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2FA Setup Modal */}
      <Modal 
        isOpen={isTfaSetupOpen} 
        onClose={() => setIsTfaSetupOpen(false)}
        title={t('security.setupTfaTitle', lang)}
        maxWidth="600px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 0 }}>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                        {t('security.setupTfaDesc', lang)}
                    </p>
                    
                    <div style={{ background: 'var(--bg-deep)', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                        <label className="stat-label" style={{ fontSize: '0.7rem', marginBottom: '0.25rem', display: 'block' }}>Secret Key</label>
                        <code style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--primary)', letterSpacing: '1px', wordBreak: 'break-all' }}>
                            {tfaSecret}
                        </code>
                    </div>
                </div>

                <div style={{ 
                    background: 'white', 
                    padding: '0.75rem', 
                    borderRadius: '12px', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <QRCodeSVG 
                        value={`otpauth://totp/MyLegalix:${user?.email}?secret=${tfaSecret}&issuer=MyLegalix`}
                        size={120}
                        level="H"
                        includeMargin={false}
                    />
                </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                <label className="stat-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                    {t('security.enterCode', lang)}
                </label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <input 
                        type="text" 
                        className="search-input" 
                        placeholder="000000"
                        maxLength={6}
                        value={tfaCode}
                        onChange={(e) => setTfaCode(e.target.value)}
                        style={{ textAlign: 'center', fontSize: '1.25rem', letterSpacing: '0.4rem', flex: 1 }}
                    />
                    <button 
                        className="btn-primary" 
                        disabled={tfaCode.length !== 6 || isTfaLoading}
                        onClick={handleVerify2FA}
                        style={{ minWidth: '140px' }}
                    >
                        {isTfaLoading ? <Loader2 className="animate-spin" /> : 'Activar'}
                    </button>
                </div>
            </div>
        </div>
      </Modal>
    </div>
  );
};

const ApiKeyItem = ({ name, lastUsed }) => {
  const { addToast } = useToast();
  
  const copyKey = () => {
    navigator.clipboard.writeText('lx_test_51MzZ2BKW9...');
    addToast(t('security.keyCopied', lang), 'success');
  };

  return (
    <div style={{ background: 'var(--card-bg)', padding: '1.25rem', borderRadius: '18px', border: '1px solid var(--card-border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{name}</span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={copyKey}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <Key size={14} />
          </button>
          <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><RefreshCw size={14} /></button>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>••••••••••••••••••••</span>
        <span style={{ fontSize: '0.6rem', color: 'var(--primary)', fontWeight: 'bold' }}>{lastUsed}</span>
      </div>
    </div>
  );
};

export default SecurityPage;
