import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Users, Building2, Shield, ShieldAlert, Mail, Wallet, Edit2, UserPlus, Search, Loader2, Eye, EyeOff, Smartphone, Fingerprint } from 'lucide-react';
import SearchableSelect from '../components/UI/SearchableSelect';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/UI/Modal';
import Skeleton from '../components/UI/Skeleton';
import { formatCurrency } from '../utils/FormattingUtils';
import CurrencyInput from '../components/UI/CurrencyInput';
import { t } from '../utils/i18n';

const UserManagement = () => {
    const { user: currentUser, config, currentTenantId } = useAuth();
    const lang = config?.language || 'es-CO';
    const { addToast } = useToast();
    const [users, setUsers] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({ 
        fullName: '', 
        email: '', 
        role: 'User', 
        departmentId: '', 
        monthlyBudget: 0,
        password: '',
        requirePasswordChange: true,
        nationalId: '',
        reportsToId: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusConfirm, setStatusConfirm] = useState(null); // User object to toggle status

    const isSuperAdmin = currentUser?.role === 'SuperAdmin';
    const isTenantAdmin = currentUser?.role === 'TenantAdmin';
    const isAreaLeader = currentUser?.role === 'AreaLeader';
    const isAdmin = isSuperAdmin || isTenantAdmin;
    // The department the AreaLeader manages (backend returns only their dept)
    const leaderDepartmentId = isAreaLeader && departments.length > 0 ? departments[0]?.id : '';

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Fetch Users, Companies (if Admin), and Departments in parallel
            const requests = [api.get('/users-management')];
            if (isSuperAdmin) requests.push(api.get('/companies'));
            requests.push(api.get('/departments'));

            const responses = await Promise.all(requests.map(r => r.catch(e => e)));
            
            if (!(responses[0] instanceof Error)) setUsers(responses[0].data);
            if (isSuperAdmin && !(responses[1] instanceof Error)) setCompanies(responses[1].data);
            const deptRes = isSuperAdmin ? responses[2] : responses[1];
            if (!(deptRes instanceof Error)) setDepartments(deptRes.data);

        } catch (error) {
            console.error('Error fetching data:', error);
            addToast(t('users.syncError', lang), 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        setUsers([]); // Clear stale data
        fetchData();
    }, [lang, currentTenantId]);

    const handleOpenModal = (user = null) => {
        console.log('DEBUG: handleOpenModal user:', user);
        if (user) {
            setEditingUser(user);
            setFormData({ 
                fullName: user.fullName, 
                email: user.email, 
                role: user.role, 
                companyId: user.companyId || '',
                departmentId: user.departmentId || '',
                monthlyBudget: user.monthlyBudget || 0,
                nationalId: user.nationalId || '',
                password: '',
                requirePasswordChange: false,  // Unchecked by default when editing
                reportsToId: user.reportsToId || ''
            });
        } else {
            setEditingUser(null);
            setFormData({ 
                fullName: '', 
                email: '', 
                role: isAreaLeader ? 'User' : 'User',  // AreaLeader can only create User role
                companyId: currentTenantId || '', 
                departmentId: isAreaLeader ? leaderDepartmentId : '', 
                monthlyBudget: 0,
                password: '',
                requirePasswordChange: true,
                nationalId: '',
                reportsToId: ''
            });
        }
        setShowPassword(false);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = {
                ...formData,
                departmentId: formData.departmentId === '' ? null : formData.departmentId,
                companyId: formData.companyId === '' ? null : formData.companyId
            };
            // If password is empty when editing, don't send it (keeps current password)
            if (editingUser && !payload.password) {
                delete payload.password;
            }

            if (editingUser) {
                await api.put(`/users-management/${editingUser.id}`, payload);
                addToast(t('users.updateSuccess', lang), 'success');
            } else {
                await api.post('/users-management', payload);
                addToast(t('users.createSuccess', lang), 'success');
            }
            setIsModalOpen(false);
            fetchData();
            // Force a reload of the app state if the current user profile changed
            if (editingUser?.id === currentUser?.id) {
                window.location.reload(); 
            }
        } catch (error) {
            addToast(error.response?.data?.message || t('common.processError', lang), 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleStatus = async (user) => {
        setStatusConfirm(user);
    };

    const confirmToggleStatus = async () => {
        setIsSubmitting(true);
        try {
            await api.patch(`/users-management/${statusConfirm.id}/toggle-status`, {});
            addToast(statusConfirm.isDeleted ? t('users.activateSuccess', lang) : t('users.suspendSuccess', lang), 'success');
            setStatusConfirm(null);
            fetchData();
        } catch (error) {
            addToast(t('common.updateStateError', lang), 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredUsers = users.filter(u => 
        u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.companyName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const roles = ["SuperAdmin", "TenantAdmin", "AreaLeader", "Accountant", "User"];

    return (
        <>
            <div className="reveal">
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '3rem' }}>

                {(isAdmin || isAreaLeader) && (
                    <button className="btn-primary" onClick={() => handleOpenModal()}>
                        <UserPlus size={20} />
                        <span>{t('users.new', lang)}</span>
                    </button>
                )}
            </div>

            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                <UserStat label={t('users.total', lang)} value={users.length} icon={<Users size={20} />} color="var(--primary)" />
                <UserStat label={t('nav.tenants', lang) || 'Empresas'} value={isSuperAdmin ? companies.length : 1} icon={<Building2 size={20} />} color="var(--secondary)" />
                <UserStat label={t('users.active', lang)} value={users.filter(u => !u.isDeleted).length} icon={<Shield size={20} />} color="var(--success)" />
                <UserStat label={t('users.suspended', lang)} value={users.filter(u => u.isDeleted).length} icon={<ShieldAlert size={20} />} color="var(--danger)" />
            </div>

            <div className="glass-panel">
                 <div className="search-wrapper" style={{ marginBottom: '2.5rem' }}>
                    <Search className="search-icon" size={18} />
                    <input 
                        type="text" 
                        placeholder={t('users.searchPlaceholder', lang)} 
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {isLoading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        {[1, 2, 3, 4].map(i => <Skeleton key={i} height="200px" borderRadius="18px" />)}
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        {filteredUsers.map(user => (                                <div key={user.id} className="glass-panel" style={{ 
                                    padding: '1.25rem', 
                                    background: 'rgba(255,255,255,0.02)', 
                                    position: 'relative', 
                                    overflow: 'hidden',
                                    border: user.isDeleted ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid var(--card-border)',
                                    opacity: user.isDeleted ? 0.7 : 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '1rem'
                                }}>
                                    <div style={{ position: 'absolute', top: '-15px', right: '-15px', width: '80px', height: '80px', background: 'var(--primary)', opacity: '0.03', borderRadius: '50%' }}></div>
                                    
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                            <div className="avatar" style={{ width: '36px', height: '36px', fontSize: '0.7rem', background: user.isDeleted ? 'var(--bg-deep)' : 'rgba(99, 102, 241, 0.1)', color: user.isDeleted ? 'var(--text-muted)' : 'var(--primary)' }}>
                                                {(user.fullName || '').split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase()}
                                            </div>
                                            <div>
                                                <h4 style={{ fontSize: '0.95rem', fontWeight: 800 }}>{user.fullName}</h4>
                                                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginTop: '0.1rem' }}>
                                                    <span className={`badge ${user.role === 'SuperAdmin' ? 'badge-indigo' : 'badge-warning'}`} style={{ padding: '0.2rem 0.5rem', fontSize: '0.6rem' }}>
                                                        {user.role}
                                                    </span>
                                                    {isSuperAdmin && (
                                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                                            • {user.companyName}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            {user.twoFactorEnabled && <Smartphone style={{ color: 'var(--success)' }} size={16} title="2FA Activado" />}
                                            {user.isDeleted ? <ShieldAlert style={{ color: 'var(--danger)' }} size={18} /> : <Shield style={{ color: 'var(--primary)', opacity: '0.4' }} size={18} />}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.75rem', background: 'rgba(0,0,0,0.05)', padding: '0.75rem', borderRadius: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                                            <Mail size={12} />
                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                                            <Fingerprint size={12} color="var(--primary)" />
                                            <span style={{ fontWeight: 600 }}>{t('users.nationalId', lang)}: {user.nationalId || 'N/A'}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                                            <Wallet size={12} color="var(--primary)" />
                                            <span style={{ fontWeight: 600 }}>{t('users.budget', lang)} {formatCurrency(user.monthlyBudget || 0)}</span>
                                        </div>
                                        {user.reportsToId && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                                                <UserPlus size={12} />
                                                <span>{t('users.reportsTo', lang)}: {users.find(u => u.id === user.reportsToId)?.fullName || '...'}</span>
                                            </div>
                                        )}
                                        {isSuperAdmin && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                                                <Building2 size={12} />
                                                <span>{user.companyName}</span>
                                            </div>
                                        )}
                                    </div>

                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <button 
                                        onClick={() => handleOpenModal(user)} 
                                        className="btn-icon"
                                        style={{ padding: '0.4rem' }}
                                        title={t('common.edit', lang)}
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    {isAdmin && (
                                        <button 
                                            onClick={() => handleToggleStatus(user)} 
                                            className="btn-icon" 
                                            style={{ 
                                                color: 'white',
                                                background: user.isDeleted ? '#10b981' : '#ef4444',
                                                padding: '0.4rem 0.75rem',
                                                borderRadius: '10px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.4rem',
                                                transition: 'all 0.2s',
                                                border: 'none',
                                                flex: 1,
                                                justifyContent: 'center',
                                                fontSize: '0.75rem'
                                            }}
                                        >
                                            {user.isDeleted ? <Shield size={14} /> : <ShieldAlert size={14} />}
                                            <span style={{ fontWeight: 700 }}>
                                                {user.isDeleted ? t('common.activate', lang) : t('common.suspend', lang)}
                                            </span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>

        <Modal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title={editingUser ? t('users.editTitle', lang) : t('users.createTitle', lang)}
                maxWidth="800px"
            >
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', textAlign: 'left' }}>
                    {/* --- Group: Identity --- */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                            <div style={{ textAlign: 'left' }}>
                                <label className="stat-label" style={{ textAlign: 'left', display: 'block', fontSize: '0.75rem' }}>{t('users.fullName', lang)}</label>
                                <input 
                                    type="text" 
                                    className="search-input" 
                                    style={{ fontSize: '0.85rem', padding: '0.6rem 0.8rem' }}
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                                    placeholder={t('users.fullNamePlaceholder', lang)}
                                    required
                                />
                            </div>
                            <div style={{ textAlign: 'left' }}>
                                <label className="stat-label" style={{ textAlign: 'left', display: 'block', fontSize: '0.75rem' }}>{t('users.email', lang)}</label>
                                <input 
                                    type="email" 
                                    className="search-input" 
                                    style={{ fontSize: '0.85rem', padding: '0.6rem 0.8rem' }}
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    placeholder={t('users.emailPlaceholder', lang)}
                                    required
                                />
                            </div>
                            <div style={{ textAlign: 'left' }}>
                                <label className="stat-label" style={{ textAlign: 'left', display: 'block', fontSize: '0.75rem' }}>{t('users.nationalId', lang)}</label>
                                <input 
                                    type="number" 
                                    className="search-input" 
                                    style={{ fontSize: '0.85rem', padding: '0.6rem 0.8rem' }}
                                    value={formData.nationalId}
                                    onChange={(e) => setFormData({...formData, nationalId: e.target.value})}
                                    placeholder={t('users.nationalIdPlaceholder', lang)}
                                    required
                                    autoComplete="off"
                                />
                            </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
                        <div style={{ textAlign: 'left' }}>
                            <label className="stat-label" style={{ textAlign: 'left', display: 'block', fontSize: '0.75rem' }}>{t('users.role', lang)}</label>
                            <SearchableSelect 
                                options={roles.map(r => ({ value: r, label: r }))}
                                value={formData.role}
                                onChange={(val) => setFormData({...formData, role: val})}
                                placeholder={t('users.role', lang)}
                                lang={lang}
                                disabled={!isAdmin || isAreaLeader}
                            />
                        </div>
                        <div style={{ textAlign: 'left' }}>
                            <label className="stat-label" style={{ textAlign: 'left', display: 'block', fontSize: '0.75rem' }}>{t('users.department', lang)}</label>
                            <SearchableSelect 
                                options={[
                                    { value: '', label: t('depts.unassigned', lang) },
                                    ...departments.map(d => ({ value: d.id, label: d.name }))
                                ]}
                                value={formData.departmentId}
                                onChange={(val) => setFormData({...formData, departmentId: val})}
                                placeholder={t('users.selectDept', lang)}
                                lang={lang}
                                disabled={isAreaLeader}
                            />
                        </div>
                        <div style={{ textAlign: 'left' }}>
                            <label className="stat-label" style={{ textAlign: 'left', display: 'block', fontSize: '0.75rem' }}>{t('users.budget', lang)}</label>
                            <CurrencyInput 
                                currencyCode={window.legalixConfig?.currency || 'COP'}
                                className="search-input" 
                                style={{ fontSize: '0.85rem', padding: '0.6rem 0.8rem' }}
                                value={formData.monthlyBudget}
                                onChange={(val) => setFormData({...formData, monthlyBudget: val})}
                                placeholder="0"
                            />
                        </div>
                    </div>

                    {/* --- Group: Security (Unified) --- */}
                    {(isAdmin || isAreaLeader) && (
                        <div style={{ background: 'rgba(99, 102, 241, 0.05)', padding: '1rem', borderRadius: '18px', border: '1px solid rgba(99, 102, 241, 0.1)', display: 'grid', gridTemplateColumns: isAdmin ? '1fr 1fr' : '1fr', gap: '1rem' }}>
                            <div style={{ textAlign: 'left' }}>
                                <label className="stat-label" style={{ textAlign: 'left', display: 'block', fontSize: '0.75rem' }}>
                                    {editingUser ? t('users.changePassword', lang) : t('users.initialPassword', lang)}
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        className="search-input" 
                                        value={formData.password}
                                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                                        placeholder={t('security.passwordPlaceholder', lang)}
                                        style={{ fontSize: '0.85rem', padding: '0.6rem 3.5rem 0.6rem 0.8rem' }}
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {isAdmin && (
                                <div style={{ textAlign: 'left' }}>
                                    <label className="stat-label" style={{ textAlign: 'left', display: 'block', fontSize: '0.75rem' }}>{t('users.reportsTo', lang)}</label>
                                    <SearchableSelect 
                                        options={[
                                            { value: '', label: t('common.none', lang) },
                                            ...users.filter(u => u.id !== editingUser?.id).map(u => ({ value: u.id, label: u.fullName }))
                                        ]}
                                        value={formData.reportsToId}
                                        onChange={(val) => setFormData({...formData, reportsToId: val})}
                                        placeholder={t('users.selectBoss', lang)}
                                        lang={lang}
                                    />
                                </div>
                            )}

                            <div 
                                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', gridColumn: isAdmin ? 'span 2' : 'span 1' }} 
                                onClick={() => setFormData({...formData, requirePasswordChange: !formData.requirePasswordChange})}
                            >
                                <input 
                                    type="checkbox" 
                                    checked={formData.requirePasswordChange}
                                    onChange={() => {}} 
                                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                />
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                    {t('users.requirePasswordChangeLabel', lang)}
                                </span>
                            </div>
                        </div>
                    )}




                    <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                        <button 
                            type="button" 
                            onClick={() => setIsModalOpen(false)} 
                            className="btn-secondary" 
                            style={{ flex: 1 }}
                        >
                            {t('common.cancel', lang)}
                        </button>
                        <button 
                            type="submit" 
                            className="btn-primary" 
                            disabled={isSubmitting} 
                            style={{ flex: 2, justifyContent: 'center', fontSize: '1rem' }}
                        >
                            {isSubmitting ? <Loader2 className="spin" size={20} /> : (editingUser ? t('common.saveChanges', lang) : t('users.create', lang))}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal de Confirmación de Estado */}
            <Modal
                isOpen={!!statusConfirm}
                onClose={() => setStatusConfirm(null)}
                title={statusConfirm?.isDeleted ? t('users.activateTitle', lang) : t('users.suspendTitle', lang)}
            >
                <div style={{ textAlign: 'left', padding: '0.5rem 0' }}>
                    <div style={{ 
                        width: '50px', 
                        height: '50px', 
                        background: statusConfirm?.isDeleted ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                        borderRadius: '12px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        color: statusConfirm?.isDeleted ? '#10b981' : '#ef4444',
                        marginBottom: '1.5rem'
                    }}>
                        {statusConfirm?.isDeleted ? <Shield size={40} /> : <ShieldAlert size={40} />}
                    </div>
                    <h3 style={{ color: 'var(--text-primary)', marginBottom: '1rem', fontSize: '1.4rem', fontWeight: 800 }}>
                        {statusConfirm?.isDeleted ? t('users.reactivateQuestion', lang) : t('users.suspendQuestion', lang)}
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.95rem', lineHeight: '1.5' }}>
                        {statusConfirm?.isDeleted 
                            ? t('users.activateWarning', lang) 
                            : t('users.suspendWarning', lang)}
                    </p>                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button 
                            onClick={() => setStatusConfirm(null)} 
                            className="btn-secondary" 
                            style={{ flex: 1 }}
                            disabled={isSubmitting}
                        >
                            {t('common.cancel', lang)}
                        </button>
                        <button 
                            onClick={confirmToggleStatus} 
                            className="btn-primary" 
                            style={{ 
                                flex: 2, 
                                background: statusConfirm?.isDeleted ? '#10b981' : '#ef4444', 
                                border: 'none', 
                                justifyContent: 'center' 
                            }}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <Loader2 className="spinning" /> : (statusConfirm?.isDeleted ? t('users.confirmActivate', lang) : t('users.confirmSuspend', lang))}
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

const UserStat = ({ label, value, icon, color }) => (
    <div className="glass-panel stat-card" style={{ padding: '1rem 1.5rem', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1rem', height: '100px' }}>
        <div style={{ 
            width: '40px', 
            height: '40px', 
            background: `${color}15`, 
            borderRadius: '10px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: color 
        }}>
            {icon}
        </div>
        <div>
            <p className="stat-label" style={{ margin: 0, fontSize: '0.65rem' }}>{label}</p>
            <p className="stat-value" style={{ margin: '0.2rem 0 0 0', fontSize: '1.4rem', fontWeight: 800 }}>{value}</p>
        </div>
    </div>
);

export default UserManagement;
