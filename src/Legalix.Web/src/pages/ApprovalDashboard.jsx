import React, { useState, useEffect } from 'react';
import { Check, X, Eye, Clock, User, Building, AlertCircle, FileText, Search } from 'lucide-react';
import api from '../services/api';
import { formatCurrency, formatDate } from '../utils/FormattingUtils';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { t } from '../utils/i18n';
import Modal from '../components/UI/Modal';

const ApprovalDashboard = () => {
    const { config, user, currentTenantId } = useAuth();
    const lang = config?.language || 'es-CO';
    const [expenses, setExpenses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedExpense, setSelectedExpense] = useState(null); // For rejection
    const [approveExpense, setApproveExpense] = useState(null); // For approval confirmation
    const [detailExpense, setDetailExpense] = useState(null); // For full detail view
    const [rejectionComment, setRejectionComment] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const { addToast } = useToast();

    const fetchExpenses = async () => {
        try {
            const response = await api.get('/expenses');
            console.log('Current User Config:', config);
            console.log('Current User:', user);
            console.log('Fetched Expenses:', response.data);
            // Filter only pending for approval view AND exclude own expenses
            const currentUserId = user?.id || user?.Id;
            setExpenses(response.data.filter(e => e.status === 0 && e.userId !== currentUserId));
        } catch (error) {
            addToast(t('approvals.loadError', lang), 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        setExpenses([]); // Clear stale data
        fetchExpenses();
    }, [lang, currentTenantId]);

    const handleApprove = async (id) => {
        try {
            await api.post(`/expenses/${id}/approve`);
            addToast(t('approvals.approveSuccess', lang), 'success');
            setApproveExpense(null);
            fetchExpenses();
        } catch (error) {
            addToast(t('approvals.approveError', lang), 'error');
        }
    };

    const handleReject = async (id) => {
        if (!rejectionComment) {
            addToast(t('approvals.rejectReasonRequired', lang), 'warning');
            return;
        }
        try {
            await api.post(`/expenses/${id}/reject`, JSON.stringify(rejectionComment), {
                headers: { 'Content-Type': 'application/json' }
            });
            addToast(t('approvals.rejectSuccess', lang), 'info');
            setRejectionComment('');
            setSelectedExpense(null);
            fetchExpenses();
        } catch (error) {
            addToast(t('approvals.rejectError', lang), 'error');
        }
    };

    // Filter and Pagination Logic
    const filteredExpenses = expenses.filter(e => 
        e.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.razonSocial?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
    const paginatedExpenses = filteredExpenses.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const stats = {
        pendingCount: expenses.length,
        totalPending: expenses.reduce((sum, e) => sum + e.totalAmount, 0),
        urgentCount: expenses.filter(e => e.adminComment?.includes('ALERTA')).length
    };

    return (
        <div className="reveal">
            <div style={{ height: '2rem' }}></div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div className="glass-panel stat-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1rem', borderLeft: '3px solid var(--primary)' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(var(--primary-rgb), 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Clock size={20} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', lineHeight: '1.2' }}>{t('approvals.pendingReview', lang) || 'Pendientes de Revisión'}</p>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: '1.2' }}>{stats.pendingCount}</h3>
                    </div>
                </div>

                <div className="glass-panel stat-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1rem', borderLeft: '3px solid var(--success)' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Check size={20} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', lineHeight: '1.2' }}>{t('approvals.totalToApprove', lang) || 'Total por Aprobar'}</p>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: '1.2' }}>{formatCurrency(stats.totalPending)}</h3>
                    </div>
                </div>

                <div className="glass-panel stat-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1rem', borderLeft: '3px solid var(--danger)' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <AlertCircle size={20} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', lineHeight: '1.2' }}>{t('approvals.criticalAlerts', lang) || 'Alertas Críticas'}</p>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: '1.2' }}>{stats.urgentCount}</h3>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                        type="text" 
                        className="search-input" 
                        placeholder={t('approvals.searchPlaceholder', lang)} 
                        style={{ paddingLeft: '3rem', width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)' }}
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                    />
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '0' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th style={{ minWidth: '200px', padding: '1.25rem 1.5rem' }}>{t('approvals.employee', lang) || 'Empleado'}</th>
                            <th style={{ minWidth: '180px', padding: '1.25rem 1.5rem' }}>{t('expenses.establishment', lang) || 'Establecimiento'}</th>
                            <th style={{ minWidth: '120px', padding: '1.25rem 1.5rem' }}>{t('approvals.category', lang) || 'Categoría'}</th>
                            <th style={{ minWidth: '120px', padding: '1.25rem 1.5rem' }}>{t('expenses.total', lang) || 'Total'}</th>
                            <th style={{ minWidth: '140px', padding: '1.25rem 1.5rem' }}>{t('approvals.date', lang) || 'Fecha'}</th>
                            <th style={{ minWidth: '150px', padding: '1.25rem 1.5rem' }}>{t('approvals.actions', lang) || 'Acciones'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}>{t('common.loading', lang)}</td></tr>
                        ) : paginatedExpenses.length === 0 ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>{t('approvals.noResults', lang) || 'Sin resultados'}</td></tr>
                        ) : paginatedExpenses.map(expense => {
                            const isUrgent = expense.adminComment?.includes('ALERTA');
                            return (
                                <tr key={expense.id} style={{ 
                                    background: isUrgent ? 'rgba(239, 68, 68, 0.05)' : 'transparent',
                                    borderLeft: isUrgent ? '3px solid var(--danger)' : '3px solid transparent'
                                }}>
                                    <td style={{ padding: '1.25rem 1.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-gradient)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800 }}>
                                                {expense.user?.fullName?.charAt(0)}
                                            </div>
                                            <div>
                                                <p style={{ margin: 0, fontWeight: 700 }}>{expense.user?.fullName}</p>
                                                <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>{expense.user?.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.25rem 1.5rem' }}>
                                        <div style={{ fontWeight: 600 }}>{expense.razonSocial || t('common.na', lang)}</div>
                                        {expense.adminComment && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', color: 'var(--danger)', fontSize: '0.65rem', fontWeight: 700, marginTop: '2px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <AlertCircle size={10} />
                                                    <span>{t('approvals.budgetExceeded', lang) || 'ALERTA DE LÍMITE'}</span>
                                                </div>
                                                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 500, lineHeight: 1.4, maxWidth: '240px' }}>
                                                    {expense.adminComment.replace(/ALERTA: /g, '')}
                                                </div>
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ padding: '1.25rem 1.5rem' }}>
                                        <span className="badge badge-indigo" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                                            {expense.category || 'Varios'}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: 800, color: 'var(--primary)', padding: '1.25rem 1.5rem' }}>{formatCurrency(expense.totalAmount)}</td>
                                    <td style={{ padding: '1.25rem 1.5rem' }}>{formatDate(expense.createdAt)}</td>
                                    <td style={{ padding: '1.25rem 1.5rem' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            <button 
                                                onClick={() => setApproveExpense(expense)} 
                                                className="btn-icon" 
                                                title={t('common.approve', lang)}
                                                style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)', border: '1px solid rgba(34, 197, 94, 0.2)' }}
                                            >
                                                <Check size={18} />
                                            </button>
                                            <button 
                                                onClick={() => setSelectedExpense(expense)} 
                                                className="btn-icon" 
                                                title={t('common.reject', lang)}
                                                style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                                            >
                                                <X size={18} />
                                            </button>
                                            <button 
                                                onClick={() => setDetailExpense(expense)} 
                                                className="btn-icon"
                                                title={t('common.details', lang)}
                                                style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-primary)', border: '1px solid var(--card-border)' }}
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            {t('approvals.page', lang)} {currentPage} {t('approvals.of', lang)} {totalPages}
                        </span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button 
                                className="btn-secondary" 
                                style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => p - 1)}
                            >
                                {t('approvals.previous', lang)}
                            </button>
                            <button 
                                className="btn-secondary" 
                                style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(p => p + 1)}
                            >
                                {t('approvals.next', lang)}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Rejection Modal */}
            <Modal 
                isOpen={!!selectedExpense} 
                onClose={() => setSelectedExpense(null)}
                title={t('approvals.rejectExpense', lang)}
                maxWidth="450px"
            >
                <div style={{ textAlign: 'center' }}>
                    <div style={{ 
                        width: '60px', 
                        height: '60px', 
                        borderRadius: '50%', 
                        background: 'rgba(239, 68, 68, 0.1)', 
                        color: 'var(--danger)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem auto'
                    }}>
                        <AlertCircle size={32} />
                    </div>
                    
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                        {t('approvals.rejectPrompt', lang)} <b>{selectedExpense?.user?.fullName}</b> {t('common.for', lang)} <b>{formatCurrency(selectedExpense?.totalAmount || 0)}</b>?
                    </p>
                    
                    <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                            {t('approvals.rejectionReason', lang)}
                        </label>
                        <textarea 
                            className="search-input" 
                            style={{ height: '100px', padding: '1rem', width: '100%', fontSize: '0.9rem', borderRadius: '12px' }}
                            placeholder={t('approvals.rejectPlaceholder', lang)}
                            value={rejectionComment}
                            onChange={(e) => setRejectionComment(e.target.value)}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button className="btn-secondary" style={{ flex: 1, padding: '0.75rem' }} onClick={() => setSelectedExpense(null)}>{t('common.cancel', lang)}</button>
                        <button className="btn-primary" style={{ flex: 1, background: 'var(--danger)', padding: '0.75rem' }} onClick={() => handleReject(selectedExpense.id)}>{t('common.reject', lang)}</button>
                    </div>
                </div>
            </Modal>

            {/* Approval Confirmation Modal */}
            <Modal
                isOpen={!!approveExpense}
                onClose={() => setApproveExpense(null)}
                title={t('approvals.approveExpense', lang)}
                maxWidth="450px"
            >
                <div style={{ textAlign: 'center' }}>
                    <div style={{ 
                        width: '60px', 
                        height: '60px', 
                        borderRadius: '50%', 
                        background: 'rgba(34, 197, 94, 0.1)', 
                        color: 'var(--success)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem auto'
                    }}>
                        <Check size={32} />
                    </div>
                    
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.9rem' }}>
                        {t('approvals.approveConfirmMsg', lang)} <b>{approveExpense?.user?.fullName}</b> {t('common.for', lang)} <b>{formatCurrency(approveExpense?.totalAmount || 0)}</b>?
                    </p>
                    
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button className="btn-secondary" style={{ flex: 1, padding: '0.75rem' }} onClick={() => setApproveExpense(null)}>{t('common.cancel', lang)}</button>
                        <button className="btn-primary" style={{ flex: 1, background: 'var(--success)', padding: '0.75rem' }} onClick={() => handleApprove(approveExpense.id)}>{t('common.approve', lang)}</button>
                    </div>
                </div>
            </Modal>

            {/* Expense Detail Modal */}
            <Modal
                isOpen={!!detailExpense}
                onClose={() => setDetailExpense(null)}
                title={t('approvals.expenseDetail', lang)}
                maxWidth="900px"
            >
                {detailExpense && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0', margin: '0 -2.5rem -2.5rem -2.5rem' }}>
                        {/* Image Side */}
                        <div style={{ background: 'var(--bg-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', minHeight: '400px', borderRight: '1px solid var(--card-border)' }}>
                            {detailExpense.attachments && detailExpense.attachments[0] ? (
                                <img 
                                    src={detailExpense.attachments[0].storageUrl} 
                                    alt="Receipt" 
                                    style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}
                                />
                            ) : (
                                <div style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
                                    <FileText size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                                    <p>{t('expenses.noImage', lang)}</p>
                                </div>
                            )}
                        </div>

                        {/* Data Side */}
                        <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                                <DetailField label={t('approvals.employee', lang)} value={detailExpense.user?.fullName} />
                                <DetailField label={t('expenses.establishment', lang)} value={detailExpense.razonSocial} />
                                <DetailField label="NIT" value={detailExpense.nit || 'N/A'} />
                                <DetailField label={t('approvals.category', lang)} value={detailExpense.category} />
                                <DetailField label={t('approvals.date', lang)} value={formatDate(detailExpense.invoiceDate || detailExpense.createdAt)} />
                                <DetailField label={t('expenses.invoiceNum', lang) || 'Nro. Factura'} value={detailExpense.invoiceNumber || 'N/A'} />
                            </div>

                            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', background: 'rgba(var(--primary-rgb), 0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Subtotal</span>
                                    <span style={{ fontWeight: 700 }}>{formatCurrency(detailExpense.totalAmount - (detailExpense.taxAmount || 0))}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>IVA</span>
                                    <span style={{ fontWeight: 700 }}>{formatCurrency(detailExpense.taxAmount || 0)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--card-border)', paddingTop: '0.75rem' }}>
                                    <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>Total</span>
                                    <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)' }}>{formatCurrency(detailExpense.totalAmount)}</span>
                                </div>
                            </div>

                            <div style={{ marginTop: 'auto', display: 'flex', gap: '1rem' }}>
                                <button className="btn-secondary" style={{ flex: 1 }} onClick={() => { setSelectedExpense(detailExpense); setDetailExpense(null); }}>{t('common.reject', lang)}</button>
                                <button className="btn-primary" style={{ flex: 1 }} onClick={() => { setApproveExpense(detailExpense); setDetailExpense(null); }}>{t('common.approve', lang)}</button>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

const DetailField = ({ label, value }) => (
    <div>
        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{label}</label>
        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{value || 'N/A'}</div>
    </div>
);

export default ApprovalDashboard;
