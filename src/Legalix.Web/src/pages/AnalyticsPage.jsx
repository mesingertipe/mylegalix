import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import SearchableSelect from '../components/UI/SearchableSelect';
import { Download, TrendingUp, PieChart as PieIcon, Building2, Calendar, FileText } from 'lucide-react';
import api from '../services/api';
import { formatCurrency } from '../utils/FormattingUtils';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { t } from '../utils/i18n';

const AnalyticsPage = () => {
    const [deptSpent, setDeptSpent] = useState([]);
    const [catSpent, setCatSpent] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [exportParams, setExportParams] = useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
    });
    const { addToast } = useToast();
    const { config, currentTenantId } = useAuth();
    const lang = config?.language || 'es-CO';

    const fetchStats = async () => {
        try {
            const [deptRes, catRes] = await Promise.all([
                api.get('/reports/analytics/spending-by-department'),
                api.get('/reports/analytics/spending-by-category')
            ]);
            setDeptSpent(deptRes.data);
            setCatSpent(catRes.data);
        } catch (error) {
            addToast(t('analytics.loadError', lang), 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        setDeptSpent([]); // Clear stale data
        setCatSpent([]);
        fetchStats();
    }, [lang, currentTenantId]);

    const handleExport = async () => {
        try {
            const response = await api.get(`/reports/export/csv?month=${exportParams.month}&year=${exportParams.year}`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Reporte_Gastos_${exportParams.month}_${exportParams.year}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            addToast(t('analytics.exportSuccess', lang), 'success');
        } catch (error) {
            addToast(t('analytics.exportError', lang), 'error');
        }
    };

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    return (
        <div className="reveal">
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '3rem' }}>

                <div className="glass-panel" style={{ padding: '0.75rem 1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <Calendar size={18} color="var(--primary)" />
                        <div style={{ width: '100px' }}>
                            <SearchableSelect 
                                options={[...Array(12)].map((_, i) => ({ value: i + 1, label: (i + 1).toString().padStart(2, '0') }))}
                                value={exportParams.month}
                                onChange={(val) => setExportParams({...exportParams, month: val})}
                                placeholder={t('analytics.month', lang)}
                                lang={lang}
                            />
                        </div>
                        <input 
                            type="number" 
                            className="search-input" 
                            style={{ width: '70px', padding: '0.3rem', border: 'none' }}
                            value={exportParams.year}
                            onChange={(e) => setExportParams({...exportParams, year: e.target.value})}
                        />
                    </div>
                    <button onClick={handleExport} className="btn-primary" style={{ padding: '0.5rem 1rem' }}>
                        <Download size={18} />
                        {t('analytics.exportCsv', lang)}
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                {/* Spending by Department */}
                <div className="glass-panel" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <TrendingUp color="var(--primary)" />
                        {t('analytics.deptSpending', lang)}
                    </h3>
                    <div style={{ flex: 1 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={deptSpent}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="departmentName" stroke="var(--text-secondary)" fontSize={12} />
                                <YAxis stroke="var(--text-secondary)" fontSize={12} tickFormatter={(value) => `$${value/1000}k`} />
                                <Tooltip 
                                    contentStyle={{ background: 'var(--panel-bg)', borderColor: 'var(--glass-border)', color: 'white' }} 
                                    formatter={(value) => formatCurrency(value)}
                                />
                                <Bar dataKey="totalSpent" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Spending by Category */}
                <div className="glass-panel" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <PieIcon color="var(--success)" />
                        {t('analytics.catSpending', lang)}
                    </h3>
                    <div style={{ flex: 1 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={catSpent}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="total"
                                    nameKey="category"
                                >
                                    {catSpent.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ background: 'var(--panel-bg)', borderColor: 'var(--glass-border)', color: 'white' }}
                                    formatter={(value) => formatCurrency(value)}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '2rem' }}>
                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Building2 color="var(--indigo)" />
                    {t('analytics.summary', lang)}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                    {deptSpent.map(dept => (
                        <div key={dept.departmentName} className="stat-card" style={{ padding: '1rem', borderLeft: '3px solid var(--primary)' }}>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{dept.departmentName}</p>
                            <h4 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{formatCurrency(dept.totalSpent)}</h4>
                            <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,1,0.1)', marginTop: '0.5rem', borderRadius: '4px' }}>
                                <div style={{ 
                                    width: `${Math.min(100, (dept.totalSpent / dept.monthlyBudget) * 100)}%`, 
                                    height: '100%', 
                                    background: (dept.totalSpent / dept.monthlyBudget) > 0.9 ? 'var(--danger)' : 'var(--primary)',
                                    borderRadius: '4px'
                                }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AnalyticsPage;
