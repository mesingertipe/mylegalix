import React, { useState, useEffect, useMemo } from 'react';
import { 
    Upload, Receipt, CheckCircle, Clock, XCircle, 
    AlertCircle, FileText, Plus, Search, Download, 
    LayoutGrid, List, Filter, Calendar as CalendarIcon,
    Building2, Fingerprint, DollarSign, ExternalLink
} from 'lucide-react';
import api from '../services/api';
import { formatCurrency, formatDate } from '../utils/FormattingUtils';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { t } from '../utils/i18n';
import Modal from '../components/UI/Modal';

const MyExpenses = () => {
    const { config, user, currentTenantId } = useAuth();
    const lang = config?.language || 'es-CO';
    const [expenses, setExpenses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedExpense, setSelectedExpense] = useState(null);
    const { addToast } = useToast();

    const fetchExpenses = async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/expenses?onlyMine=true');
            setExpenses(response.data);
        } catch (error) {
            addToast(t('expenses.loadError', lang), 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, [currentTenantId]);

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.post('/expenses/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            addToast(t('expenses.uploadSuccess', lang), 'success');
            fetchExpenses();
        } catch (error) {
            addToast(error.response?.data?.message || t('expenses.uploadError', lang), 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const filteredExpenses = useMemo(() => {
        return expenses.filter(exp => {
            const date = new Date(exp.invoiceDate || exp.createdAt);
            const matchesDate = date.getMonth() + 1 === parseInt(selectedMonth) && 
                              date.getFullYear() === parseInt(selectedYear);
            
            if (!matchesDate) return false;

            const searchLower = searchTerm.toLowerCase();
            return (
                (exp.razonSocial?.toLowerCase().includes(searchLower)) ||
                (exp.nit?.toLowerCase().includes(searchLower)) ||
                (exp.totalAmount.toString().includes(searchTerm))
            );
        });
    }, [expenses, searchTerm, selectedMonth, selectedYear]);

    // Statistics Calculations
    const stats = useMemo(() => {
        const monthExpenses = filteredExpenses;
        const totalAmount = monthExpenses.reduce((sum, exp) => sum + exp.totalAmount, 0);
        const count = monthExpenses.length;
        const budget = user?.monthlyBudget || 0;
        const remaining = budget - totalAmount;

        return { totalAmount, count, budget, remaining };
    }, [filteredExpenses, user]);

    const handleExportExcel = () => {
        if (filteredExpenses.length === 0) return;

        const headers = [
            t('expenses.invoiceDate', lang),
            t('expenses.establishment', lang),
            t('expenses.nit', lang),
            t('expenses.total', lang),
            t('expenses.status', lang)
        ];

        const getStatusText = (status) => {
            switch (status) {
                case 1: return t('common.approved', lang);
                case 2: return t('common.rejected', lang);
                case 3: return t('common.correct', lang);
                default: return t('common.pending', lang);
            }
        };

        const rows = filteredExpenses.map(exp => [
            formatDate(exp.invoiceDate || exp.createdAt),
            `"${exp.razonSocial || ''}"`,
            exp.nit || '',
            exp.totalAmount,
            getStatusText(exp.status)
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `Mis_Gastos_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        addToast('Archivo exportado correctamente', 'success');
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 1: return <CheckCircle size={16} className="text-success" />;
            case 2: return <XCircle size={16} className="text-danger" />;
            case 3: return <AlertCircle size={16} className="text-warning" />;
            default: return <Clock size={16} className="text-primary" />;
        }
    };

    const StatusBadge = ({ status }) => {
        const config = {
            1: { class: 'badge-success', icon: <CheckCircle size={12} />, text: t('common.approved', lang) },
            2: { class: 'badge-danger', icon: <XCircle size={12} />, text: t('common.rejected', lang) },
            3: { class: 'badge-warning', icon: <AlertCircle size={12} />, text: t('common.correct', lang) },
            default: { class: 'badge-indigo', icon: <Clock size={12} />, text: t('common.pending', lang) }
        };
        const s = config[status] || config.default;
        return <span className={`badge ${s.class}`}>{s.icon} {s.text}</span>;
    };

    return (
        <div className="reveal">
            {/* Header / Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', flex: 1, minWidth: '300px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input 
                            type="text" 
                            className="search-input"
                            placeholder={t('expenses.searchPlaceholder', lang)}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '3.5rem', width: '100%' }}
                        />
                    </div>
                    
                    {/* Period Filters */}
                    <select 
                        className="search-input" 
                        style={{ width: '140px', paddingLeft: '1rem' }}
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                    >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                            <option key={m} value={m}>{t(`month.${m}`, lang)}</option>
                        ))}
                    </select>

                    <select 
                        className="search-input" 
                        style={{ width: '100px', paddingLeft: '1rem' }}
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                    >
                        {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>

                    <button className="btn-secondary" onClick={handleExportExcel} title={t('expenses.exportExcel', lang)}>
                        <Download size={20} />
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ 
                        display: 'flex', 
                        background: 'var(--card-bg)', 
                        padding: '4px', 
                        borderRadius: '12px', 
                        border: '1px solid var(--card-border)' 
                    }}>
                        <button 
                            onClick={() => setViewMode('cards')}
                            style={{ 
                                padding: '8px', 
                                borderRadius: '8px', 
                                border: 'none', 
                                background: viewMode === 'cards' ? 'var(--primary)' : 'transparent',
                                color: viewMode === 'cards' ? 'white' : 'var(--text-muted)',
                                cursor: 'pointer'
                            }}
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button 
                            onClick={() => setViewMode('table')}
                            style={{ 
                                padding: '8px', 
                                borderRadius: '8px', 
                                border: 'none', 
                                background: viewMode === 'table' ? 'var(--primary)' : 'transparent',
                                color: viewMode === 'table' ? 'white' : 'var(--text-muted)',
                                cursor: 'pointer'
                            }}
                        >
                            <List size={18} />
                        </button>
                    </div>

                    <input 
                        type="file" id="expense-upload" hidden onChange={handleFileUpload}
                        accept="image/*,application/pdf" disabled={isUploading}
                    />
                    <label htmlFor="expense-upload" className="btn-primary" style={{ cursor: isUploading ? 'not-allowed' : 'pointer' }}>
                        {isUploading ? <Clock className="spin" size={20} /> : <Plus size={20} />}
                        <span>{isUploading ? t('expenses.processing', lang) : t('expenses.newLegalization', lang)}</span>
                    </label>
                </div>
            </div>

            {/* Summary Cards */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
                gap: '1.5rem', 
                marginBottom: '2.5rem' 
            }}>
                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ 
                        width: '48px', height: '48px', borderRadius: '12px', 
                        background: 'rgba(99, 102, 241, 0.1)', display: 'flex', 
                        alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' 
                    }}>
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('expenses.stats.monthlyTotal', lang)}</p>
                        <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary)' }}>{formatCurrency(stats.totalAmount)}</p>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ 
                        width: '48px', height: '48px', borderRadius: '12px', 
                        background: stats.remaining < 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        color: stats.remaining < 0 ? 'var(--danger)' : 'var(--success)' 
                    }}>
                        <Clock size={24} />
                    </div>
                    <div>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('expenses.stats.availableBalance', lang)}</p>
                        <p style={{ 
                            margin: 0, fontSize: '1.5rem', fontWeight: 900, 
                            color: stats.remaining < 0 ? 'var(--danger)' : 'var(--success)' 
                        }}>{formatCurrency(stats.remaining)}</p>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ 
                        width: '48px', height: '48px', borderRadius: '12px', 
                        background: 'rgba(99, 102, 241, 0.05)', display: 'flex', 
                        alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' 
                    }}>
                        <Building2 size={24} />
                    </div>
                    <div>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('expenses.stats.monthlyBudget', lang)}</p>
                        <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{formatCurrency(stats.budget)}</p>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ 
                        width: '48px', height: '48px', borderRadius: '12px', 
                        background: 'rgba(99, 102, 241, 0.05)', display: 'flex', 
                        alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' 
                    }}>
                        <Receipt size={24} />
                    </div>
                    <div>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('expenses.stats.expenseCount', lang)}</p>
                        <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{stats.count}</p>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div style={{ padding: '5rem', textAlign: 'center' }}>
                    <Clock className="spin" size={48} style={{ color: 'var(--primary)', opacity: 0.5 }} />
                    <p style={{ marginTop: '1.5rem', color: 'var(--text-secondary)' }}>{t('common.loading', lang)}</p>
                </div>
            ) : filteredExpenses.length === 0 ? (
                <div className="glass-panel" style={{ padding: '5rem', textAlign: 'center' }}>
                    <Receipt size={64} style={{ color: 'var(--text-muted)', opacity: 0.2, marginBottom: '1.5rem' }} />
                    <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{t('expenses.noExpenses', lang)}</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>{searchTerm ? 'Prueba con otros términos de búsqueda' : t('expenses.emptySub', lang)}</p>
                </div>
            ) : viewMode === 'cards' ? (
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
                    gap: '1.5rem' 
                }}>
                    {filteredExpenses.map(expense => (
                        <div key={expense.id} className="glass-panel" style={{ 
                            padding: '1.5rem', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '1.25rem',
                            position: 'relative',
                            transition: 'transform 0.2s',
                            cursor: 'default'
                        }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ 
                                    width: '44px', 
                                    height: '44px', 
                                    borderRadius: '12px', 
                                    background: 'rgba(99, 102, 241, 0.1)', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    color: 'var(--primary)' 
                                }}>
                                    <Receipt size={22} />
                                </div>
                                <StatusBadge status={expense.status} />
                            </div>

                            <div>
                                <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                    {expense.razonSocial || 'Establecimiento desconocido'}
                                </h4>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                    <Fingerprint size={12} />
                                    <span>{expense.nit || 'NIT no detectado'}</span>
                                </div>
                            </div>

                            <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                padding: '1rem',
                                background: 'rgba(0,0,0,0.1)',
                                borderRadius: '12px',
                                border: '1px solid rgba(255,255,255,0.03)'
                            }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Monto Total</span>
                                    <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--primary)' }}>{formatCurrency(expense.totalAmount)}</span>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                        <CalendarIcon size={12} />
                                        {formatDate(expense.invoiceDate || expense.createdAt)}
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button 
                                    onClick={() => setSelectedExpense(expense)}
                                    className="btn-secondary" 
                                    style={{ flex: 1, padding: '0.6rem', fontSize: '0.8rem' }}
                                >
                                    <FileText size={16} />
                                    <span>{t('common.details', lang) || 'Detalle'}</span>
                                </button>
                                {expense.attachments.length > 0 && (
                                    <a href={expense.attachments[0].storageUrl} target="_blank" rel="noreferrer" className="btn-icon">
                                        <ExternalLink size={16} />
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>{t('expenses.invoiceDate', lang)}</th>
                                <th>{t('expenses.establishment', lang)}</th>
                                <th>{t('expenses.nit', lang)}</th>
                                <th>{t('expenses.total', lang)}</th>
                                <th>{t('expenses.status', lang)}</th>
                                <th>{t('expenses.attachments', lang)}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredExpenses.map(expense => (
                                <tr key={expense.id}>
                                    <td>{formatDate(expense.invoiceDate || expense.createdAt)}</td>
                                    <td style={{ fontWeight: 700 }}>{expense.razonSocial || t('common.na', lang)}</td>
                                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{expense.nit || t('common.na', lang)}</td>
                                    <td style={{ fontWeight: 800, color: 'var(--primary)' }}>{formatCurrency(expense.totalAmount)}</td>
                                    <td><StatusBadge status={expense.status} /></td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button onClick={() => setSelectedExpense(expense)} className="btn-icon" title="Ver Detalle">
                                                <FileText size={18} />
                                            </button>
                                            {expense.attachments.map(att => (
                                                <a key={att.id} href={att.storageUrl} target="_blank" rel="noreferrer" className="btn-icon">
                                                    <ExternalLink size={18} />
                                                </a>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Detail Modal */}
            <Modal
                isOpen={!!selectedExpense}
                onClose={() => setSelectedExpense(null)}
                title={t('approvals.expenseDetail', lang) || "Detalle del Gasto"}
                size="large"
            >
                {selectedExpense && (
                    <div style={{ display: 'flex', gap: '2.5rem', margin: '0 -2.5rem -2.5rem -2.5rem', background: 'var(--bg-deep)' }}>
                        {/* Data Column */}
                        <div style={{ flex: 1, padding: '2.5rem', background: 'var(--bg-surface)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <StatusBadge status={selectedExpense.status} />
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: {selectedExpense.id.substring(0,8)}</span>
                                </div>

                                <div className="detail-group">
                                    <label style={{ display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 700 }}>{t('expenses.establishment', lang)}</label>
                                    <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>{selectedExpense.razonSocial || 'N/A'}</p>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div className="detail-group">
                                        <label style={{ display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 700 }}>{t('expenses.total', lang)}</label>
                                        <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{formatCurrency(selectedExpense.totalAmount)}</p>
                                    </div>
                                    {selectedExpense.nit && (
                                        <div className="detail-group">
                                            <label style={{ display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 700 }}>{t('expenses.nit', lang)}</label>
                                            <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{selectedExpense.nit}</p>
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div className="detail-group">
                                        <label style={{ display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 700 }}>{t('expenses.invoiceDate', lang)}</label>
                                        <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{formatDate(selectedExpense.invoiceDate || selectedExpense.createdAt)}</p>
                                    </div>
                                    <div className="detail-group">
                                        <label style={{ display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 700 }}>Categoría</label>
                                        <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{selectedExpense.category || 'Varios'}</p>
                                    </div>
                                </div>

                                <div style={{ 
                                    padding: '1.5rem', 
                                    background: 'rgba(99, 102, 241, 0.05)', 
                                    borderRadius: '16px', 
                                    border: '1px solid rgba(99, 102, 241, 0.1)',
                                    marginTop: '1rem'
                                }}>
                                    <label style={{ display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--primary)', marginBottom: '0.5rem', fontWeight: 800 }}>Monto Total</label>
                                    <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 900, color: 'var(--primary)' }}>{formatCurrency(selectedExpense.totalAmount)}</p>
                                </div>

                                {selectedExpense.adminComment && (
                                    <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--danger)', marginBottom: '0.4rem', fontWeight: 800 }}>
                                            <AlertCircle size={12} /> Comentario de Revisión
                                        </label>
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: '1.5' }}>{selectedExpense.adminComment}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Image Preview Column */}
                        <div style={{ flex: 1.2, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-deep)', overflow: 'hidden' }}>
                            {selectedExpense.attachments.length > 0 ? (
                                <img 
                                    src={selectedExpense.attachments[0].storageUrl} 
                                    alt="Receipt Preview" 
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                />
                            ) : (
                                <div style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
                                    <FileText size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                    <p>No hay imagen disponible</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default MyExpenses;
