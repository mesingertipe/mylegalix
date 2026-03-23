import React, { useState, useEffect } from 'react';
import { Shield, ArrowUpRight, ArrowDownLeft, Info, Search, Filter, History } from 'lucide-react';
import api from '../services/api';
import { formatCurrency, formatDate } from '../utils/FormattingUtils';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { t } from '../utils/i18n';

const AuditLogPage = () => {
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { addToast } = useToast();
    const { config, currentTenantId } = useAuth();
    const lang = config?.language || 'es-CO';

    const fetchLogs = async () => {
        try {
            const response = await api.get('/reports/audit-logs');
            setLogs(response.data);
        } catch (error) {
            addToast(t('audit.loadError', lang), 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        setLogs([]); // Clear stale data
        fetchLogs();
    }, [lang, currentTenantId]);

    const getTypeIcon = (type) => {
        switch (type) {
            case 0: // Expense
                return <ArrowUpRight color="var(--danger)" size={18} />;
            case 1: // Reload
                return <ArrowDownLeft color="var(--success)" size={18} />;
            default: // Adjustment
                return <Info color="var(--indigo)" size={18} />;
        }
    };

    const filtratedLogs = logs.filter(log => 
        log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.virtualCard?.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="reveal">
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '3rem' }}>
                <div className="search-container">
                    <Search size={18} />
                    <input 
                        type="text" 
                        placeholder={t('audit.searchPlaceholder', lang)} 
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '0' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>{t('common.date', lang)}</th>
                            <th>{t('audit.type', lang)}</th>
                            <th>{t('common.user', lang)}</th>
                            <th>{t('audit.description', lang)}</th>
                            <th>{t('audit.prevBalance', lang)}</th>
                            <th>{t('audit.amount', lang)}</th>
                            <th>{t('audit.newBalance', lang)}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan="7" style={{ textAlign: 'center', padding: '3rem' }}>{t('common.loading', lang)}</td></tr>
                        ) : filtratedLogs.length === 0 ? (
                            <tr><td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>{t('audit.noRecords', lang)}</td></tr>
                        ) : filtratedLogs.map(log => (
                            <tr key={log.id}>
                                <td style={{ fontSize: '0.85rem' }}>{formatDate(log.createdAt)}</td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {getTypeIcon(log.type)}
                                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                            {log.type === 0 ? t('audit.expense', lang) : log.type === 1 ? t('audit.reload', lang) : t('audit.adjustment', lang)}
                                        </span>
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--panel-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>
                                            {log.virtualCard?.user?.fullName?.charAt(0)}
                                        </div>
                                        {log.virtualCard?.user?.fullName || t('audit.system', lang)}
                                    </div>
                                </td>
                                <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '250px' }}>{log.description}</td>
                                <td style={{ color: 'var(--text-muted)' }}>{formatCurrency(log.previousBalance)}</td>
                                <td style={{ fontWeight: 800, color: log.type === 1 ? 'var(--success)' : 'var(--danger)' }}>
                                    {log.type === 1 ? '+' : '-'}{formatCurrency(log.amount)}
                                </td>
                                <td style={{ fontWeight: 800 }}>{formatCurrency(log.newBalance)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AuditLogPage;
