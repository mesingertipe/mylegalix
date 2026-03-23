import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  BarChart3, 
  Building2, 
  Users, 
  Settings, 
  LogOut,
  Shield,
  Cpu,
  ChevronRight,
  ChevronLeft,
  Archive,
  PieChart,
  Sun,
  Moon,
  Receipt,
  CheckSquare,
  Calendar,
  Bell,
  LayoutDashboard,
  FileText,
  Building,
  Pin,
  PinOff
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { t } from '../../utils/i18n';
import api from '../../services/api';

const Sidebar = ({ theme, onToggleTheme, isPinned, onTogglePin }) => {
  const { user, logout, config } = useAuth();
  const lang = config?.language || 'es-CO';
  const [isHovered, setIsHovered] = useState(false);
  const [openGroups, setOpenGroups] = useState(['core', 'system', 'management']);

  const isCollapsed = !isPinned && !isHovered;

  // Notifications moved to TopBar

  const toggleGroup = (groupId) => {
    setOpenGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(g => g !== groupId) 
        : [...prev, groupId]
    );
  };

  const navGroups = [
    {
      id: 'core',
      name: t('nav.group.core', lang) || 'Principal',
      items: [
        { id: 'dashboard', name: t('nav.dashboard', lang), path: '/dashboard', icon: <LayoutDashboard size={20} /> },
        { id: 'my-expenses', name: t('nav.myExpenses', lang) || 'Mis Gastos', path: '/my-expenses', icon: <FileText size={20} /> },
        { id: 'approvals', name: t('nav.approvals', lang) || 'Aprobaciones', path: '/approvals', icon: <CheckSquare size={20} />, roles: ['SuperAdmin', 'TenantAdmin', 'AreaLeader'] },
        { id: 'calendar', name: t('nav.calendar', lang) || 'Calendario', path: '/calendar', icon: <Calendar size={20} /> },
      ]
    },
    {
      id: 'management',
      name: t('nav.group.management', lang) || 'Administración',
      roles: ['SuperAdmin', 'TenantAdmin', 'AreaLeader'],
      items: [
        { id: 'tenants', name: t('nav.tenants', lang) || 'Empresas', path: '/tenants', icon: <Building size={20} />, roles: ['SuperAdmin'] },
        { id: 'departments', name: t('nav.departments', lang), path: '/departments', icon: <Building2 size={20} /> },
        { id: 'users', name: t('nav.users', lang), path: '/users', icon: <Users size={20} />, roles: ['SuperAdmin', 'TenantAdmin', 'AreaLeader'] },
        { id: 'periods', name: t('nav.periods', lang) || 'Periodos', path: '/fiscal-periods', icon: <Archive size={20} />, roles: ['SuperAdmin', 'TenantAdmin'] },
      ]
    },
    {
      id: 'analytics',
      name: t('nav.group.analytics', lang) || 'Analítica y Control',
      roles: ['SuperAdmin', 'TenantAdmin', 'AreaLeader'],
      items: [
        { id: 'analytics-page', name: t('nav.analytics', lang), path: '/analytics', icon: <PieChart size={20} />, roles: ['SuperAdmin', 'TenantAdmin', 'AreaLeader'] },
        { id: 'audit', name: t('nav.audit', lang) || 'Auditoría', path: '/audit', icon: <Shield size={20} />, roles: ['SuperAdmin'] },
      ]
    },
    {
      id: 'system',
      name: t('nav.group.system', lang) || 'Sistema',
      items: [
        { id: 'security', name: t('nav.security', lang) || 'Seguridad', path: '/security', icon: <Shield size={20} /> },
        { id: 'settings', name: t('nav.settings', lang), path: '/settings', icon: <Settings size={20} />, roles: ['SuperAdmin', 'TenantAdmin'] },
        { id: 'system-settings', name: t('nav.systemSettings', lang) || 'Ajustes del Sistema', path: '/system-settings', icon: <Cpu size={20} />, roles: ['SuperAdmin', 'TenantAdmin'] },
      ]
    }
  ];

  const canShowItem = (item) => {
    if (!item.roles) return true;
    return item.roles.includes(user?.role);
  };

  return (
    <aside 
      className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${!isPinned ? 'floating' : ''}`} 
      onMouseEnter={() => !isPinned && setIsHovered(true)}
      onMouseLeave={() => !isPinned && setIsHovered(false)}
      style={{ 
        padding: isCollapsed ? '1.5rem 0.5rem' : '1.5rem 1rem', 
        display: 'flex', 
        flexDirection: 'column' 
      }}
    >
      <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', padding: '0 0.5rem', flexShrink: 0 }}>
        <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/assets/logo.png" alt="L" style={{ width: '28px', height: '28px', borderRadius: '6px' }} />
          {!isCollapsed && (
            <span className="logo-text" style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              MYLEGALIX<span className="logo-dot" style={{ color: 'var(--primary)' }}>.</span>
            </span>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '5px' }}>
          {!isCollapsed && (
             <button 
                onClick={onTogglePin}
                className="theme-toggle-btn"
                title={isPinned ? "Unpin Sidebar" : "Pin Sidebar"}
                style={{
                  background: isPinned ? 'rgba(99, 102, 241, 0.1)' : 'var(--card-bg)',
                  border: '1px solid var(--card-border)',
                  color: isPinned ? 'var(--primary)' : 'var(--text-secondary)',
                  padding: '0.3rem',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                {isPinned ? <Pin size={14} fill="currentColor" /> : <PinOff size={14} />}
              </button>
          )}

          <button 
            onClick={onToggleTheme}
            className="theme-toggle-btn"
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              color: 'var(--text-secondary)',
              padding: '0.3rem',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>
      </div>

      <nav className="nav-menu" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '0.25rem', 
        flex: 1, 
        overflowY: 'auto', 
        minHeight: 0,
        paddingBottom: '3rem',
        paddingRight: '4px' 
      }}>
        {navGroups.map((group) => {
          if (group.roles && !group.roles.includes(user?.role)) return null;
          const filteredItems = group.items.filter(canShowItem);
          if (filteredItems.length === 0) return null;

          const isGroupOpen = openGroups.includes(group.id);

          return (
            <div key={group.id} style={{ marginBottom: '0.5rem' }}>
              {!isCollapsed && (
                <div
                  onClick={() => toggleGroup(group.id)}
                  style={{
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer'
                  }}
                >
                  {group.name}
                  <ChevronRight size={10} style={{ transform: isGroupOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                </div>
              )}
              
              {(isGroupOpen || isCollapsed) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {filteredItems.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '10px', 
                        padding: '0.6rem 0.75rem', 
                        borderRadius: '10px', 
                        textDecoration: 'none', 
                        color: 'var(--text-secondary)',
                        fontSize: '0.85rem'
                      }}
                    >
                      {item.icon}
                      {!isCollapsed && <span style={{flex: 1, fontWeight: 500}}>{item.name}</span>}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer" style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--card-border)' }}>
        <div className="user-profile" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px', 
          padding: '0.75rem', 
          background: 'var(--card-bg)', 
          borderRadius: '12px', 
          marginBottom: '0.75rem' 
        }}>
          <div className="avatar" style={{ 
            width: '32px', 
            height: '32px', 
            background: 'var(--primary-gradient)', 
            borderRadius: '10px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: 'white', 
            fontWeight: 700, 
            fontSize: '0.8rem' 
          }}>
            {user?.fullName ? user.fullName.split(' ').map(n => n[0]).join('') : 'U'}
          </div>
          {!isCollapsed && (
            <div className="user-info" style={{ overflow: 'hidden' }}>
              <h4 style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user?.fullName || 'Usuario'}</h4>
              <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-muted)' }}>{user?.role || 'User'}</p>
            </div>
          )}
        </div>
        
        <button 
          className="btn-danger-alt" 
          style={{ width: '100%', marginBottom: '0.75rem', padding: '0.6rem', borderRadius: '10px' }} 
          onClick={logout}
        >
          <LogOut size={14} />
          {!isCollapsed && <span>{t('nav.logout', lang)}</span>}
        </button>

        {!isCollapsed ? (
          <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
            <p style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: 600, margin: 0, opacity: 0.9 }}>
              Powered by Technology And Development
            </p>
            <p style={{ fontSize: '0.55rem', color: 'var(--primary)', fontWeight: 800, marginTop: '2px' }}>
              MYLEGALIX v2.0
            </p>
          </div>
        ) : (
          <div style={{ textAlign: 'center', marginTop: '0.75rem', opacity: 0.8 }}>
            <p style={{ fontSize: '0.55rem', fontWeight: 900, color: 'var(--primary)' }}>v2.0</p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
