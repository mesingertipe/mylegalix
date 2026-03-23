import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Command, Layout, Building2, Users, Bell, Settings } from 'lucide-react';

const CommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const items = [
    { icon: <Layout size={18} />, label: 'Ir al Dashboard', path: '/' },
    { icon: <Building2 size={18} />, label: 'Gestionar Tenants', path: '/tenants' },
    { icon: <Users size={18} />, label: 'Gestionar Usuarios', path: '/users' },
    { icon: <Bell size={18} />, label: 'Ver Notificaciones', path: '/notifications' },
    { icon: <Settings size={18} />, label: 'Configuración del Sistema', path: '/settings' },
  ];

  const filteredItems = items.filter(item => 
    item.label.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="cmdk-overlay" onClick={() => setIsOpen(false)}>
      <div className="cmdk-modal reveal" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '1.25rem', borderBottom: '1px solid var(--card-border)' }}>
          <Search size={20} color="var(--text-muted)" style={{ marginRight: '1rem' }} />
          <input 
            autoFocus
            placeholder="Escribe un comando o busca..."
            style={{ background: 'none', border: 'none', color: 'var(--text-primary)', outline: 'none', width: '100%', fontSize: '1rem' }}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div style={{ padding: '4px 8px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '6px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            ESC
          </div>
        </div>
        
        <div style={{ padding: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
          {filteredItems.length > 0 ? filteredItems.map((item, index) => (
            <div 
              key={item.path}
              onClick={() => { navigate(item.path); setIsOpen(false); }}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1rem', 
                padding: '0.75rem 1rem', 
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'var(--transition)'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--card-bg)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <div style={{ color: 'var(--text-muted)' }}>{item.icon}</div>
              <span style={{ flex: 1, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{item.label}</span>
              <Command size={14} color="var(--text-muted)" />
            </div>
          )) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              No se encontraron resultados para "{search}"
            </div>
          )}
        </div>

        <div style={{ padding: '0.75rem 1.25rem', background: 'var(--card-bg)', borderTop: '1px solid var(--card-border)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            <span style={{ padding: '2px 6px', background: 'var(--bg-surface)', border: '1px solid var(--card-border)', borderRadius: '4px' }}>↵</span>
            Seleccionar
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            <span style={{ padding: '2px 6px', background: 'var(--bg-surface)', border: '1px solid var(--card-border)', borderRadius: '4px' }}>↑↓</span>
            Navegar
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
