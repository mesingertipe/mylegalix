import React, { useState, useEffect } from 'react';
import { Globe, Save, Loader2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { t } from '../utils/i18n';
import api from '../services/api';
import CurrencyInput from '../components/UI/CurrencyInput';
import SearchableSelect from '../components/UI/SearchableSelect';

const SettingsPage = () => {
  const { addToast } = useToast();
  const { currentTenantId, config, refreshConfig } = useAuth();
  const lang = config?.language || 'es-CO';
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    dailyExpenseLimit: 800000,
    strictFiscalValidation: true,
    retroactiveExpensesDays: 5,
    currencyCode: 'COP',
    language: 'es-CO',
    country: 'Colombia',
    timeZone: 'SA Pacific Standard Time'
  });

  useEffect(() => {
    if (currentTenantId) {
      fetchSettings();
    }
  }, [currentTenantId]);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      console.log("Fetching settings for tenant:", currentTenantId);
      const response = await api.get('/companies/settings');
      console.log("Settings received:", response.data);
      if (response.data) {
        setSettings(response.data);
        // Refresh global config
        window.legalixConfig = {
          ...window.legalixConfig,
          currency: response.data.currencyCode,
          language: response.data.language
        };
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      const status = error.response?.status;
      const message = error.response?.data?.message || error.response?.data || error.message;
      
      if (status === 404) {
        addToast('No se encontró configuración para esta empresa. Verifique que la empresa existe.', 'error');
      } else if (status === 403) {
        addToast('No tiene permisos para ver esta configuración.', 'error');
        addToast(t('settings.noPermissions'), 'error');
      } else {
        addToast(`Error al cargar la configuración: ${message}`, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentTenantId) {
    return (
      <div className="reveal" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--text-muted)', gap: '1rem' }}>
        <Globe size={48} opacity={0.2} />
        <p style={{ fontSize: '1.2rem', fontWeight: 500 }}>{t('settings.selectTenant')}</p>
        <p style={{ fontSize: '0.9rem' }}>{t('settings.superAdminNotice')}</p>
      </div>
    );
  }

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await api.patch('/companies/settings', settings);
      
      // Update global config immediately by refreshing from server
      await refreshConfig(currentTenantId);

      addToast(t('settings.saveSuccess', settings.language) || 'Configuración guardada exitosamente', 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      addToast(t('settings.saveError', settings.language) || 'Error al guardar la configuración', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-muted)' }}>
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="reveal">
      <div style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Globalization Row 1 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--card-border)' }}>
              <div>
                <label className="stat-label" style={{ display: 'block', marginBottom: '0.25rem' }}>{t('tenants.country', lang) || 'País'}</label>
                <SearchableSelect 
                  options={[
                    { value: 'Colombia', label: 'Colombia' },
                    { value: 'Mexico', label: t('countries.mexico', lang) || 'México' },
                    { value: 'Ecuador', label: 'Ecuador' },
                    { value: 'USA', label: 'USA' },
                    { value: 'Spain', label: t('countries.spain', lang) || 'España' }
                  ]}
                  value={settings.country}
                  onChange={(val) => setSettings(prev => ({ ...prev, country: val }))}
                  placeholder={t('tenants.country', lang)}
                  lang={lang}
                />
              </div>
              <div>
                <label className="stat-label" style={{ display: 'block', marginBottom: '0.25rem' }}>{t('settings.mainCurrency')}</label>
                <SearchableSelect 
                  options={[
                    { value: 'COP', label: 'Peso Colombiano (COP)' },
                    { value: 'USD', label: 'Dólar Americano (USD)' },
                    { value: 'EUR', label: 'Euro (EUR)' },
                    { value: 'MXN', label: 'Peso Mexicano (MXN)' }
                  ]}
                  value={settings.currencyCode}
                  onChange={(val) => setSettings(prev => ({ ...prev, currencyCode: val }))}
                  placeholder={t('settings.mainCurrency')}
                  lang={lang}
                />
              </div>
            </div>

            {/* Globalization Row 2 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--card-border)' }}>
              <div>
                <label className="stat-label" style={{ display: 'block', marginBottom: '0.25rem' }}>{t('tenants.timezone', lang) || 'Zona Horaria'}</label>
                <SearchableSelect 
                  options={[
                    { value: 'SA Pacific Standard Time', label: '(GMT-5) Bogotá, Lima, Quito' },
                    { value: 'Central Standard Time (Mexico)', label: '(GMT-6) Ciudad de México' },
                    { value: 'Eastern Standard Time', label: '(GMT-5) New York, Miami' },
                    { value: 'Central European Standard Time', label: '(GMT+1) Madrid, Paris' }
                  ]}
                  value={settings.timeZone}
                  onChange={(val) => setSettings(prev => ({ ...prev, timeZone: val }))}
                  placeholder={t('tenants.timezone', lang)}
                  lang={lang}
                />
              </div>
              <div>
                <label className="stat-label" style={{ display: 'block', marginBottom: '0.25rem' }}>{t('settings.language')}</label>
                <SearchableSelect 
                  options={[
                    { value: 'es-CO', label: 'Español' },
                    { value: 'en-US', label: 'English (United States)' }
                  ]}
                  value={settings.language}
                  onChange={(val) => setSettings(prev => ({ ...prev, language: val }))}
                  placeholder={t('settings.language')}
                  lang={lang}
                />
              </div>
            </div>

            {/* Viaticos Limit */}
            <div style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--card-border)' }}>
              <label className="stat-label" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                {t('settings.dailyLimit')} ({settings.currencyCode})
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', maxWidth: '350px' }}>
                 <div style={{ 
                   background: 'rgba(99, 102, 241, 0.1)', 
                   color: 'var(--primary)', 
                   height: '42px',
                   padding: '0 1rem',
                   borderRadius: '10px',
                   display: 'flex',
                   alignItems: 'center',
                   fontWeight: 800,
                   border: '1px solid var(--card-border)',
                   fontSize: '0.9rem'
                 }}>
                   {settings.currencyCode === 'COP' ? '$' : settings.currencyCode}
                 </div>
                 <CurrencyInput 
                   currencyCode={settings.currencyCode}
                   className="search-input" 
                   style={{ width: '100%', height: '42px' }} 
                   value={settings.dailyExpenseLimit}
                   onChange={(val) => setSettings(prev => ({ ...prev, dailyExpenseLimit: val }))}
                 />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <ToggleRow 
                label={t('settings.fiscalValidationLabel', lang)} 
                isActive={settings.strictFiscalValidation} 
                sub={t('settings.fiscalValidationSub', lang)} 
                onToggle={() => handleToggle('strictFiscalValidation')}
                compact
              />
              <ToggleRow 
                label={t('settings.retroactiveLabel', lang)} 
                isActive={settings.retroactiveExpensesDays > 0} 
                sub={`${t('settings.retroactiveSub', lang)} (${settings.retroactiveExpensesDays} ${t('common.days', lang) || 'días'})`} 
                onToggle={() => {
                  const newVal = settings.retroactiveExpensesDays > 0 ? 0 : 5;
                  setSettings(prev => ({ ...prev, retroactiveExpensesDays: newVal }));
                }}
                compact
              />
            </div>

            {/* Save Button */}
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
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

const ToggleRow = ({ label, sub, isActive, onToggle, compact }) => {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: compact ? '0.75rem' : '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
      <div>
        <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{label}</p>
        {sub && <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>{sub}</p>}
      </div>
      <div 
        onClick={onToggle}
        style={{ 
          width: '40px', 
          height: '20px', 
          background: isActive ? 'var(--primary)' : 'var(--text-muted)', 
          borderRadius: '10px', 
          padding: '2px', 
          cursor: 'pointer', 
          transition: 'all 0.3s' 
        }}
      >
        <div style={{ 
          width: '16px', 
          height: '16px', 
          background: 'white', 
          borderRadius: '50%', 
          transform: isActive ? 'translateX(20px)' : 'translateX(0)', 
          transition: 'all 0.3s' 
        }}></div>
      </div>
    </div>
  );
};

export default SettingsPage;
