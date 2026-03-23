import React, { useState, useEffect } from 'react';
import { Calendar, Lock, Unlock, Plus, AlertCircle, History, Clock } from 'lucide-react';
import SearchableSelect from '../components/UI/SearchableSelect';
import api from '../services/api';
import { formatDate } from '../utils/FormattingUtils';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { t } from '../utils/i18n';

const FiscalPeriodsPage = () => {
    const [periods, setPeriods] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newPeriod, setNewPeriod] = useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        closingDate: ''
    });
    const { addToast } = useToast();
    const { config, currentTenantId } = useAuth();
    const lang = config?.language || 'es-CO';

    const fetchPeriods = async () => {
        try {
            const response = await api.get('/fiscalperiods');
            setPeriods(response.data);
        } catch (error) {
            addToast(t('periods.loadError', lang), 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        setPeriods([]); // Clear stale data
        fetchPeriods();
    }, [lang, currentTenantId]);

    const handleOpenPeriod = async () => {
        try {
            await api.post('/fiscalperiods/open', newPeriod);
            addToast(`${t('periods.openSuccess', lang)}: ${newPeriod.month}/${newPeriod.year}`, 'success');
            setIsModalOpen(false);
            fetchPeriods();
        } catch (error) {
            addToast(error.response?.data || t('periods.openError', lang), 'error');
        }
    };

    const handleClosePeriod = async (id, name) => {
        if (!window.confirm(`${t('periods.closeConfirm', lang)} ${name}? ${t('periods.closeConfirmWarning', lang)}`)) return;
        
        try {
            await api.post(`/fiscalperiods/${id}/close`);
            addToast(t('periods.closeSuccess', lang), 'info');
            fetchPeriods();
        } catch (error) {
            addToast(t('periods.closeError', lang), 'error');
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 0: // Open
                return <span className="badge badge-success"><Unlock size={12} /> {t('periods.open', lang)}</span>;
            case 1: // Closed
                return <span className="badge badge-danger"><Lock size={12} /> {t('periods.closed', lang)}</span>;
            default:
                return <span className="badge badge-secondary"><History size={12} /> {t('periods.archived', lang)}</span>;
        }
    };

    return (
        <div className="reveal">
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '3rem' }}>

                <button onClick={() => setIsModalOpen(true)} className="btn-primary">
                    <Plus size={20} />
                    <span>{t('periods.new', lang)}</span>
                </button>
            </div>

            <div className="glass-panel" style={{ padding: '0' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>{t('periods.periodCol', lang)}</th>
                            <th>{t('common.status', lang)}</th>
                            <th>{t('periods.openDateCol', lang)}</th>
                            <th>{t('periods.closeDateCol', lang)}</th>
                            <th>{t('common.actions', lang)}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '3rem' }}>{t('common.loading', lang)}</td></tr>
                        ) : periods.length === 0 ? (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>{t('periods.noPeriods', lang)}</td></tr>
                        ) : periods.map(period => (
                            <tr key={period.id}>
                                <td style={{ fontWeight: 800, fontSize: '1.2rem' }}>{period.month.toString().padStart(2, '0')}/{period.year}</td>
                                <td>{getStatusBadge(period.status)}</td>
                                <td>{formatDate(period.openingDate)}</td>
                                <td>{period.closingDate ? formatDate(period.closingDate) : t('common.pending', lang)}</td>
                                <td>
                                    {period.status === 0 && (
                                        <button onClick={() => handleClosePeriod(period.id, `${period.month}/${period.year}`)} className="btn-secondary" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
                                            Cerrar Periodo
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="glass-panel" style={{ maxWidth: '450px', width: '90%', padding: '2rem' }}>
                        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Clock color="var(--primary)" />
                            {t('periods.newTitle', lang)}
                        </h3>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div>
                                <label className="form-label">{t('periods.month', lang)}</label>
                                <SearchableSelect 
                                    options={[...Array(12)].map((_, i) => ({ value: i + 1, label: (i + 1).toString().padStart(2, '0') }))}
                                    value={newPeriod.month}
                                    onChange={(val) => setNewPeriod({...newPeriod, month: val})}
                                    placeholder={t('periods.month', lang)}
                                    lang={lang}
                                />
                            </div>
                            <div>
                                <label className="form-label">{t('periods.year', lang)}</label>
                                <input 
                                    type="number" 
                                    className="search-input" 
                                    style={{ width: '100%' }}
                                    value={newPeriod.year}
                                    onChange={(e) => setNewPeriod({...newPeriod, year: parseInt(e.target.value)})}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <label className="form-label">{t('periods.limitDate', lang)}</label>
                            <input 
                                type="date" 
                                className="search-input" 
                                style={{ width: '100%' }}
                                value={newPeriod.closingDate}
                                onChange={(e) => setNewPeriod({...newPeriod, closingDate: e.target.value})}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>{t('common.cancel', lang)}</button>
                            <button className="btn-primary" style={{ flex: 1 }} onClick={handleOpenPeriod}>{t('periods.new', lang)}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FiscalPeriodsPage;
