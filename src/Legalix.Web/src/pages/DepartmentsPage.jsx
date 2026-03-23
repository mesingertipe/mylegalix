import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Search, Plus, Users, Wallet, Loader2, Edit2, Trash2, Building2, TrendingUp } from 'lucide-react';
import SearchableSelect from '../components/UI/SearchableSelect';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/UI/Modal';
import Skeleton from '../components/UI/Skeleton';
import { formatCurrency } from '../utils/FormattingUtils';
import CurrencyInput from '../components/UI/CurrencyInput';
import { t } from '../utils/i18n';

const DepartmentsPage = () => {
    const { user: currentUser, config, currentTenantId } = useAuth();
    const lang = config?.language || 'es-CO';
    const { addToast } = useToast();
    const [departments, setDepartments] = useState([]);
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Role Helpers
    const isSuperAdmin = currentUser?.role === 'SuperAdmin';
    const isTenantAdmin = currentUser?.role === 'TenantAdmin';
    const isAdmin = isSuperAdmin || isTenantAdmin;
    const isAreaLeader = currentUser?.role === 'AreaLeader';
    // Id can come as camelCase or PascalCase depending on the JSON serializer
    const currentUserId = currentUser?.id || currentUser?.Id;

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDept, setEditingDept] = useState(null);
    const [isBudgetOnly, setIsBudgetOnly] = useState(false);
    const [formData, setFormData] = useState({ name: '', monthlyBudget: 0, managerId: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null); // ID of dept to delete

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [deptsRes, usersRes] = await Promise.all([
                api.get('/departments'),
                api.get('/users-management')
            ]);
            console.log('Departamentos recibidos:', deptsRes.data);
            setDepartments(deptsRes.data);
            setUsers(usersRes.data);
        } catch (error) {
            addToast(t('common.loadError', lang), 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        setDepartments([]); // Clear stale data
        fetchData();
    }, [lang, currentTenantId]);

    const handleOpenModal = (dept = null, budgetOnly = false) => {
        setIsBudgetOnly(budgetOnly);
        if (dept) {
            setEditingDept(dept);
            setFormData({ 
                name: dept.name, 
                monthlyBudget: dept.monthlyBudget, 
                managerId: dept.managerId || '' 
            });
        } else {
            setEditingDept(null);
            setFormData({ name: '', monthlyBudget: 0, managerId: '' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        const payload = {
            name: formData.name,
            monthlyBudget: isNaN(formData.monthlyBudget) ? 0 : formData.monthlyBudget,
            managerId: formData.managerId === '' ? null : formData.managerId
        };

        console.log('Enviando departamento:', payload);

        try {
            if (isBudgetOnly) {
                await api.patch(`/departments/${editingDept.id}/budget`, {
                    monthlyBudget: payload.monthlyBudget
                });
                addToast(t('depts.budgetUpdateSuccess', lang), 'success');
            } else if (editingDept) {
                await api.put(`/departments/${editingDept.id}`, payload);
                addToast(t('depts.updateSuccess', lang), 'success');
            } else {
                const response = await api.post('/departments', payload);
                console.log('Respuesta creación:', response.data);
                addToast(t('depts.createSuccess', lang), 'success');
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Error en DepartmentsPage:', error);
            const errorMsg = error.response?.data?.message || error.message || t('common.processError', lang);
            addToast(errorMsg, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        setDeleteConfirm(id);
    };

    const confirmDelete = async () => {
        setIsSubmitting(true);
        try {
            await api.delete(`/departments/${deleteConfirm}`);
            addToast(t('common.delete', lang) + ' OK', 'success');
            setDeleteConfirm(null);
            fetchData();
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || t('common.deleteError', lang);
            addToast(errorMsg, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredDepts = departments.filter(d => 
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        d.managerName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="reveal">
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '3rem' }}>

                {isAdmin && (
                    <button className="btn-primary" onClick={() => handleOpenModal()}>
                        <Plus size={20} />
                        <span>{t('depts.new', lang)}</span>
                    </button>
                )}
            </div>

            <div className="glass-panel" style={{ marginBottom: '2.5rem' }}>
                <div className="search-wrapper">
                    <Search className="search-icon" size={18} />
                    <input 
                        type="text" 
                        placeholder={t('depts.searchPlaceholder', lang)} 
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {isLoading ? (
                    [1, 2, 3].map(i => <Skeleton key={i} height="220px" borderRadius="24px" />)
                ) : filteredDepts.map(dept => (
                    <div key={dept.id} className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                <div style={{ width: '40px', height: '40px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                                    <Building2 size={20} />
                                </div>
                                <div>
                                    <h4 style={{ fontSize: '1rem', fontWeight: 800 }}>{dept.name}</h4>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.15rem' }}>
                                        <Users size={12} />
                                        <span>{t('depts.leader', lang)} {dept.managerName}</span>
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                {isAdmin && (
                                    <>
                                        <button 
                                            onClick={() => handleOpenModal(dept)} 
                                            className="btn-icon" 
                                            style={{ color: 'var(--text-muted)' }}
                                            title={t('common.edit', lang)}
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(dept.id)} 
                                            className="btn-icon" 
                                            style={{ color: 'var(--danger)' }}
                                            title={t('common.delete', lang)}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </>
                                )}
                                {!isAdmin && isAreaLeader && dept.managerId === currentUserId && (
                                    <button 
                                        onClick={() => handleOpenModal(dept, true)} 
                                        className="btn-primary-alt" 
                                        style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}
                                    >
                                        <TrendingUp size={14} style={{ marginRight: '0.5rem' }} />
                                        {t('depts.loadBudget', lang)}
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="glass-panel" style={{ background: 'var(--bg-deep)', padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Wallet size={16} color="var(--primary)" />
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t('depts.budget', lang)}</span>
                            </div>
                            <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
                                {formatCurrency(dept.monthlyBudget)}
                            </span>
                        </div>
                    </div>
                ))}
                {!isLoading && filteredDepts.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        <Building2 size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                        <p style={{ fontSize: '1rem', fontWeight: 600 }}>
                            {isAreaLeader
                                ? t('depts.noAssigned', lang)
                                : t('depts.noDepts', lang)}
                        </p>
                    </div>
                )}
            </div>

            <Modal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title={isBudgetOnly ? t('depts.updateBudgetTitle', lang) : (editingDept ? t('depts.editTitle', lang) : t('depts.new', lang))}
            >
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {!isBudgetOnly && (
                        <div>
                            <label className="stat-label">{t('depts.nameLabel', lang)}</label>
                            <input 
                                type="text" 
                                required
                                className="search-input" 
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                placeholder={t('depts.namePlaceholder', lang)}
                            />
                        </div>
                    )}
                    <div>
                        <label className="stat-label">{t('depts.budgetLabel', lang)}</label>
                        <CurrencyInput 
                            className="search-input" 
                            value={isNaN(formData.monthlyBudget) ? '' : formData.monthlyBudget}
                            onChange={(val) => {
                                setFormData({...formData, monthlyBudget: val || 0});
                            }}
                        />
                    </div>
                    {!isBudgetOnly && (
                        <div>
                            <label className="stat-label">{t('depts.leaderLabel', lang)}</label>
                            <SearchableSelect 
                                options={[
                                    { value: '', label: t('depts.unassigned', lang) },
                                    ...users.map(u => ({ value: u.id, label: u.fullName }))
                                ]}
                                value={formData.managerId}
                                onChange={(val) => setFormData({...formData, managerId: val})}
                                placeholder={t('depts.leaderLabel', lang)}
                                lang={lang}
                            />
                            <p style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                {t('depts.leaderHelper', lang)}
                            </p>
                        </div>
                    )}

                    <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                        <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary" style={{ flex: 1 }}>
                            {t('common.cancel', lang)}
                        </button>
                        <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ flex: 1, justifyContent: 'center' }}>
                            {isSubmitting ? <Loader2 className="spinning" /> : (isBudgetOnly ? t('depts.updateBudgetTitle', lang) : (editingDept ? t('common.saveChanges', lang) : t('depts.create', lang)))}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal de Confirmación de Borrado */}
            <Modal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                title={t('depts.deleteConfirmTitle', lang)}
            >
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                    <div style={{ 
                        width: '80px', 
                        height: '80px', 
                        background: 'rgba(239, 68, 68, 0.15)', 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        color: '#ef4444',
                        margin: '0 auto 1.5rem auto',
                        border: '2px solid rgba(239, 68, 68, 0.2)'
                    }}>
                        <Trash2 size={40} />
                    </div>
                    <h3 style={{ color: 'var(--text-primary)', marginBottom: '1rem', fontSize: '1.4rem', fontWeight: 800 }}>
                        {t('depts.deleteQuestion', lang)}
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', fontSize: '1rem', lineHeight: '1.5' }}>
                        {t('depts.deleteWarning', lang)}
                    </p>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button 
                            onClick={() => setDeleteConfirm(null)} 
                            className="btn-secondary" 
                            style={{ flex: 1 }}
                            disabled={isSubmitting}
                        >
                            {t('common.cancel', lang)}
                        </button>
                        <button 
                            onClick={confirmDelete} 
                            className="btn-primary" 
                            style={{ flex: 1, background: 'var(--danger)', border: 'none', justifyContent: 'center' }}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <Loader2 className="spinning" /> : t('depts.confirmDelete', lang)}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default DepartmentsPage;
