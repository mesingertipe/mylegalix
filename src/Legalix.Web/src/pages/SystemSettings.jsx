import React, { useState, useEffect } from 'react';
import { Settings, Save, Loader2, ShieldCheck, Languages } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { t } from '../utils/i18n';
import api from '../services/api';

const SystemSettings = () => {
  const { addToast } = useToast();
  const { currentTenantId, config, refreshConfig } = useAuth();
  const lang = config?.language || 'es-CO';
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    require2FA: false,
    multiLanguageOcr: true,
    // We include these to not lose them when patching, 
    // although the backend should handle partial updates if implemented correctly.
    // In our case, UpdateSettings expects the full DTO.
    dailyExpenseLimit: 0,
    strictFiscalValidation: false,
    retroactiveExpensesDays: 0,
    currencyCode: '',
    language: '',
    country: '',
    timeZone: ''
  });

  useEffect(() => {
    if (currentTenantId) {
      fetchSettings();
    }
  }, [currentTenantId]);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/companies/settings');
      if (response.data) {
        setSettings(response.data);
      }
    } catch (error) {
      addToast(t('common.loadError', lang), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await api.patch('/companies/settings', settings);
      await refreshConfig(currentTenantId);
      addToast(t('settings.saveSuccess', lang), 'success');
    } catch (error) {
      addToast(t('settings.saveError', lang), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (!currentTenantId) {
    return (
      <div className="reveal" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--text-muted)', gap: '1rem' }}>
        <Settings size={48} opacity={0.2} />
        <p style={{ fontSize: '1.2rem', fontWeight: 500 }}>{t('settings.selectTenant')}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--text-muted)' }}>
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="reveal">
      <div style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '2.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              {t('nav.systemSettings', lang) || 'Ajustes de Sistema'}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              {t('settings.technicalDesc', lang) || 'Configuraciones técnicas y de seguridad del Tenant.'}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
               <ToggleRow 
                  icon={<ShieldCheck size={20} />}
                  label={t('settings.auth2faLabel', lang)} 
                  isActive={settings.require2FA} 
                  sub={t('settings.auth2faSub', lang)} 
                  onToggle={() => handleToggle('require2FA')}
                />
                <ToggleRow 
                  icon={<Languages size={20} />}
                  label={t('settings.ocrLabel', lang)} 
                  isActive={settings.multiLanguageOcr} 
                  sub={t('settings.ocrSub', lang)} 
                  onToggle={() => handleToggle('multiLanguageOcr')}
                />
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                className="btn-primary" 
                style={{ padding: '0.8rem 2.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }} 
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                <span>{isSaving ? t('settings.saving') : t('settings.save')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ToggleRow = ({ label, sub, isActive, onToggle, icon }) => {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      gap: '1.5rem',
      padding: '1.5rem', 
      background: 'rgba(255,255,255,0.03)', 
      borderRadius: '16px',
      border: '1px solid var(--card-border)',
      transition: 'all 0.3s'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          borderRadius: '12px', 
          background: isActive ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255,255,255,0.05)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: isActive ? 'var(--primary)' : 'var(--text-muted)'
        }}>
          {icon}
        </div>
        <div 
          onClick={onToggle}
          style={{ 
            width: '44px', 
            height: '24px', 
            background: isActive ? 'var(--primary)' : 'var(--text-muted)', 
            borderRadius: '12px', 
            padding: '3px', 
            cursor: 'pointer', 
            transition: 'all 0.3s' 
          }}
        >
          <div style={{ 
            width: '18px', 
            height: '18px', 
            background: 'white', 
            borderRadius: '50%', 
            transform: isActive ? 'translateX(20px)' : 'translateX(0)', 
            transition: 'all 0.3s' 
          }}></div>
        </div>
      </div>
      <div>
        <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{label}</p>
        {sub && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '8px 0 0 0', lineHeight: 1.4 }}>{sub}</p>}
      </div>
    </div>
  );
};

export default SystemSettings;
