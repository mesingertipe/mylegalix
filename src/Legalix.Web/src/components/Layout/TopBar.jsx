import React from 'react';
import { useLocation } from 'react-router-dom';
import TenantSwitcher from '../Navigation/TenantSwitcher';
import NotificationBell from '../Navigation/NotificationBell';
import { useAuth } from '../../context/AuthContext';
import { t } from '../../utils/i18n';
import { 
  Bell,
  LayoutDashboard,
  Globe,
  Clock,
  Languages
} from 'lucide-react';

const TopBar = ({ isSidebarPinned }) => {
  const location = useLocation();
  const { config } = useAuth();
  const [time, setTime] = React.useState(new Date());
  
  const lang = config?.language || 'es-CO';
  const timeZone = config?.timeZone || 'SA Pacific Standard Time';

  // Mapping from Windows TimeZone IDs to IANA for Intl.DateTimeFormat
  const tzMapping = {
    'SA Pacific Standard Time': 'America/Bogota',
    'Central Standard Time (Mexico)': 'America/Mexico_City',
    'Eastern Standard Time': 'America/New_York',
    'Central European Standard Time': 'Europe/Madrid'
  };

  const ianaTimeZone = tzMapping[timeZone] || 'UTC';

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatOptions = {
    timeZone: ianaTimeZone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    day: '2-digit',
    month: 'short',
  };

  const localizedTime = new Intl.DateTimeFormat(lang, formatOptions).format(time);

  const tzLabels = {
    'SA Pacific Standard Time': '(GMT-5)',
    'Central Standard Time (Mexico)': '(GMT-6)',
    'Eastern Standard Time': '(GMT-5)',
    'Central European Standard Time': '(GMT+1)'
  };

  const getPageInfo = () => {
    const path = location.pathname;
    switch (path) {
      case '/dashboard':
        return { 
          title: t('topbar.welcome', lang), 
          subtitle: t('topbar.welcomeSub', lang) 
        };
      case '/tenants':
        return { 
          title: t('topbar.tenants', lang), 
          subtitle: t('topbar.tenantsSub', lang) 
        };
      case '/users':
        return { 
          title: t('topbar.users', lang), 
          subtitle: t('topbar.usersSub', lang) 
        };
      case '/departments':
        return { 
          title: t('topbar.departments', lang), 
          subtitle: t('topbar.departmentsSub', lang) 
        };
      case '/my-expenses':
        return { 
          title: t('topbar.expenses', lang), 
          subtitle: t('topbar.expensesSub', lang) 
        };
      case '/approvals':
        return { 
          title: t('topbar.approvals', lang), 
          subtitle: t('topbar.approvalsSub', lang) 
        };
      case '/audit':
        return { 
          title: t('topbar.audit', lang), 
          subtitle: t('topbar.auditSub', lang) 
        };
      case '/analytics':
        return { 
          title: t('topbar.analytics', lang), 
          subtitle: t('topbar.analyticsSub', lang) 
        };
      case '/fiscal-periods':
        return { 
          title: t('topbar.periods', lang), 
          subtitle: t('topbar.periodsSub', lang) 
        };
      case '/calendar':
        return { 
          title: t('topbar.calendar', lang), 
          subtitle: t('topbar.calendarSub', lang) 
        };
      case '/notifications':
        return { 
          title: t('topbar.notifications', lang), 
          subtitle: t('topbar.notificationsSub', lang) 
        };
      case '/security':
        return { 
          title: t('topbar.security', lang), 
          subtitle: t('topbar.securitySub', lang) 
        };
      case '/settings':
        return { 
          title: t('topbar.settings', lang), 
          subtitle: t('topbar.settingsSub', lang) 
        };
      case '/system-settings':
        return {
          title: t('topbar.systemSettings', lang) || 'Ajustes del Sistema',
          subtitle: t('topbar.systemSettingsSub', lang) || 'Configuración técnica y parámetros globales'
        };
      default:
        return { 
          title: t('topbar.defaultTitle', lang), 
          subtitle: t('topbar.defaultSub', lang) 
        };
    }
  };

  const { title, subtitle } = getPageInfo();

  return (
    <header className={`top-bar ${!isSidebarPinned ? 'full-width' : ''}`}>
      <div style={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: '0 3rem' 
      }}>
        <div className="header-titles">
          <h1 className="header-title">{title}</h1>
          <p className="header-subtitle">{subtitle}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {/* Config Status Info */}
          <div className="glass-panel" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem', 
            padding: '0.4rem 1rem',
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            borderRadius: '10px',
            fontSize: '0.7rem',
            color: 'var(--text-muted)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Languages size={12} className="text-primary" />
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{lang === 'es-CO' ? 'ES' : 'EN'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Globe size={12} className="text-primary" />
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{tzLabels[timeZone] || 'GMT'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Clock size={12} className="text-primary" />
              <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                {localizedTime}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <NotificationBell />
            <TenantSwitcher />
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
