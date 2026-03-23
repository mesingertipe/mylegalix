import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ChevronDown, Building2, Check, Search } from 'lucide-react';

const TenantSwitcher = ({ isCollapsed }) => {
  const { user, currentTenantId, currentTenantName, switchTenant } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const isSuperAdmin = user?.role === 'SuperAdmin';

  useEffect(() => {
    if (isSuperAdmin) {
      const fetchCompanies = async () => {
        try {
          const response = await api.get('/companies');
          setCompanies(response.data);
        } catch (error) {
          console.error("Error fetching companies", error);
        }
      };
      fetchCompanies();
    }
  }, [isSuperAdmin]);

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // If NOT SuperAdmin, show static identification badge
  if (!isSuperAdmin) {
    return (
      <div className="flex items-center" style={{ 
        gap: '1rem', 
        padding: '0.625rem 1.25rem',
        background: 'var(--tenant-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: '1rem'
      }}>
        <div style={{
          padding: '0.5rem',
          borderRadius: '0.75rem',
          background: 'rgba(99, 102, 241, 0.15)',
          color: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Building2 size={16} />
        </div>
        <div style={{ textAlign: 'left' }}>
          <p style={{
            fontSize: '10px',
            color: 'var(--tenant-text-dim)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontWeight: '900',
            lineHeight: '1',
            marginBottom: '4px'
          }}>Empresa</p>
          <p style={{
            fontSize: '0.875rem',
            fontWeight: '700',
            color: 'var(--tenant-text-bright)',
            margin: '0',
            maxWidth: '180px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {currentTenantName || 'Cargando...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-w-[240px]">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) setSearchTerm('');
        }}
        className="tenant-item"
        style={{
          background: 'var(--tenant-bg)',
          border: '1px solid var(--card-border)',
          borderRadius: '1rem',
          padding: '0.625rem 1.25rem',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div className="flex items-center" style={{ gap: '1rem' }}>
          <div style={{
            padding: '0.5rem',
            borderRadius: '0.75rem',
            background: 'rgba(99, 102, 241, 0.15)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Building2 size={18} />
          </div>
          <div style={{ textAlign: 'left' }}>
            <p style={{
              fontSize: '10px',
              color: 'var(--tenant-text-dim)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontWeight: '900',
              lineHeight: '1',
              marginBottom: '4px'
            }}>Tenant Activo</p>
            <p style={{
              fontSize: '0.875rem',
              fontWeight: '700',
              color: 'var(--tenant-text-bright)',
              margin: '0'
            }}>{currentTenantName || 'Cargando...'}</p>
          </div>
        </div>
        <ChevronDown size={14} style={{
          color: 'var(--tenant-text-dim)',
          transition: 'transform 0.3s',
          transform: isOpen ? 'rotate(180deg)' : 'none'
        }} />
      </button>

      {isOpen && (
        <div className="tenant-selector-container" style={{
          position: 'absolute',
          top: 'calc(100% + 12px)',
          right: '0',
          zIndex: '1000',
          background: 'var(--bg-surface)',
          borderColor: 'var(--card-border)',
          padding: '0.5rem',
          minWidth: '280px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
        }}>
          <div className="tenant-header" style={{ 
            color: 'var(--text-muted)', 
            borderColor: 'var(--card-border)',
            padding: '0.5rem 1rem 0.75rem 1rem'
          }}>
            Seleccionar Tenant
          </div>

          <div style={{ position: 'relative', padding: '0.5rem' }}>
            <Search size={14} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              autoFocus
              type="text"
              className="search-input"
              style={{ 
                width: '100%', 
                fontSize: '0.8rem', 
                padding: '0.5rem 1rem 0.5rem 2.5rem',
                borderRadius: '12px',
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.05)'
              }}
              placeholder="Buscar tenant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="tenant-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {filteredCompanies.length > 0 ? (
              filteredCompanies.map((company) => (
                <button
                  key={company.id}
                  onClick={() => {
                    switchTenant(company.id, company.name);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className={`tenant-item ${currentTenantId === company.id ? 'active' : ''}`}
                  style={{
                    color: currentTenantId === company.id ? 'var(--primary)' : 'var(--text-secondary)',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    margin: '2px 0'
                  }}
                >
                  <span>{company.name}</span>
                  {currentTenantId === company.id && (
                    <div className="check-circle">
                      <Check size={12} />
                    </div>
                  )}
                </button>
              ))
            ) : (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                No se encontraron resultados
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantSwitcher;
