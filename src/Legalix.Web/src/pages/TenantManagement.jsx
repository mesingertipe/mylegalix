import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Plus, MoreVertical, Filter, Loader2, Edit2, Power } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/UI/Modal';
import Skeleton from '../components/UI/Skeleton';
import SearchableSelect from '../components/UI/SearchableSelect';
import { t } from '../utils/i18n';
import api from '../services/api';

const TenantManagement = () => {
  const { token, config } = useAuth();
  const lang = config?.language || 'es-CO';
  const { addToast } = useToast();
  const [tenants, setTenants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    nit: '', 
    address: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTenants = async () => {
    try {
      const response = await api.get('/companies');
      setTenants(response.data);
    } catch (error) {
      addToast(t('tenants.loadError', lang), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleOpenModal = (tenant = null) => {
    if (tenant) {
      setEditingTenant(tenant);
      setFormData({ 
        name: tenant.name, 
        nit: tenant.nit, 
        address: tenant.address || ''
      });
    } else {
      setEditingTenant(null);
      setFormData({ 
        name: '', 
        nit: '', 
        address: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingTenant) {
        await api.put(`/companies/${editingTenant.id}`, formData);
        addToast(t('tenants.updateSuccess', lang), 'success');
      } else {
        await api.post('/companies', formData);
        addToast(t('tenants.createSuccess', lang), 'success');
      }
      setIsModalOpen(false);
      fetchTenants();
    } catch (error) {
      addToast(t('common.processError', lang), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await api.patch(`/companies/${id}/toggle-status`, {});
      addToast('Estado actualizado', 'success');
      fetchTenants();
    } catch (error) {
      addToast('Error al cambiar estado', 'error');
    }
  };

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.nit.includes(searchTerm)
  );

  return (
    <div className="reveal">
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '3rem' }}>

        <button className="btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={20} />
          <span>{t('tenants.newTenant', lang)}</span>
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <div className="search-wrapper">
          <Search className="search-icon" size={18} />
          <input 
            type="text" 
            placeholder={t('tenants.searchPlaceholder', lang)} 
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={18} />
          <span>{t('common.filters', lang)}</span>
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        <table className="legalix-table">
          <thead>
            <tr>
              <th>{t('tenants.company', lang)}</th>
              <th>NIT</th>
              <th>{t('tenants.address', lang)}</th>
              <th>{t('common.status', lang)}</th>
              <th style={{ textAlign: 'right' }}>{t('common.actions', lang)}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [1, 2, 3].map(i => (
                <tr key={i}>
                  <td colSpan="5"><Skeleton height="50px" /></td>
                </tr>
              ))
            ) : filteredTenants.map(tenant => (
              <tr key={tenant.id} style={{ opacity: tenant.isDeleted ? 0.6 : 1 }}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '8px', 
                      background: tenant.isDeleted ? 'rgba(255,255,255,0.05)' : 'rgba(99, 102, 241, 0.1)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      color: tenant.isDeleted ? 'var(--text-muted)' : 'var(--primary)', 
                      fontWeight: 800, 
                      fontSize: '0.75rem' 
                    }}>
                      {tenant.name[0]}
                    </div>
                    <span style={{ fontWeight: 700 }}>{tenant.name}</span>
                  </div>
                </td>
                <td style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{tenant.nit}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{tenant.address || 'N/A'}</td>
                <td>
                    <span className={`badge ${!tenant.isDeleted ? 'badge-success' : 'badge-warning'}`}>
                      {!tenant.isDeleted ? t('tenants.active', lang) : t('tenants.inactive', lang)}
                    </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <button 
                      onClick={() => handleOpenModal(tenant)}
                      className="btn-icon" 
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleToggleStatus(tenant.id)}
                      className="btn-icon" 
                      style={{ color: tenant.isDeleted ? 'var(--success)' : 'var(--danger)' }}
                      title={tenant.isDeleted ? t('common.activate', lang) : t('common.suspend', lang)}
                    >
                      <Power size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingTenant ? t('tenants.edit', lang) : t('tenants.new', lang)}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '70vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
          <div>
            <label className="stat-label">{t('tenants.name', lang)}</label>
            <input 
              type="text" 
              required
              className="search-input" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder={t('tenants.namePlaceholder', lang)}
            />
          </div>
          <div>
            <label className="stat-label">NIT</label>
            <input 
              type="text" 
              required
              className="search-input" 
              value={formData.nit}
              onChange={(e) => setFormData({...formData, nit: e.target.value})}
              placeholder={t('tenants.nitPlaceholder', lang)}
            />
          </div>
          <div>
            <label className="stat-label">{t('tenants.address', lang)} (Opcional)</label>
            <input 
              type="text" 
              className="search-input" 
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              placeholder={t('tenants.addressPlaceholder', lang)}
            />
          </div>

          <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary" style={{ flex: 1 }}>
              {t('common.cancel', lang)}
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ flex: 1, justifyContent: 'center' }}>
              {isSubmitting ? <Loader2 className="spinning" /> : (editingTenant ? t('common.saveChanges', lang) : t('tenants.create', lang))}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

const ToggleRowSmall = ({ label, isActive, onToggle }) => {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
      <div 
        onClick={onToggle}
        style={{ 
          width: '36px', 
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
          transform: isActive ? 'translateX(16px)' : 'translateX(0)', 
          transition: 'all 0.3s' 
        }}></div>
      </div>
    </div>
  );
};

export default TenantManagement;
