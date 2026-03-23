import React from 'react';
import { TrendingUp, TrendingDown, ArrowUpRight, Calendar, AlertCircle, Plus, UserPlus, FileText } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Skeleton from '../components/UI/Skeleton';
import { formatCurrency } from '../utils/FormattingUtils';
import { t } from '../utils/i18n';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';


const DashboardPage = () => {
  const { user, config, currentTenantId } = useAuth();
  const lang = config?.language || 'es-CO';
  const currency = config?.currency || 'COP';
  const [isLoading, setIsLoading] = React.useState(true);
  const [stats, setStats] = React.useState(null);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchStats();
  }, [currentTenantId]);

  if (isLoading || !stats) {
    return (
      <div className="reveal">
        <div className="stats-grid">
           {[1,2,3,4].map(i => <Skeleton key={i} height="160px" borderRadius="28px" />)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
           <Skeleton height="400px" borderRadius="28px" />
           <Skeleton height="400px" borderRadius="28px" />
        </div>
      </div>
    );
  }

  return (
    <div className="reveal">
      {/* Quick Actions Bar */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
        <button className="btn-primary" onClick={() => window.location.href='/expenses'} style={{ padding: '0.8rem 1.5rem', borderRadius: '16px' }}>
          <Plus size={18} />
          <span>{t('dash.newExpense', lang) || 'Nueva Rendición'}</span>
        </button>
        <button className="btn-secondary" onClick={() => window.location.href='/users'} style={{ padding: '0.8rem 1.5rem', borderRadius: '16px', background: 'var(--bg-surface)' }}>
          <UserPlus size={18} />
          <span>{t('dash.newUser', lang) || 'Nuevo Usuario'}</span>
        </button>
        {(user?.role === 'Admin' || user?.role === 'Accountant') && (
          <button className="btn-secondary" onClick={() => window.location.href='/reports'} style={{ padding: '0.8rem 1.5rem', borderRadius: '16px', background: 'var(--bg-surface)' }}>
            <FileText size={18} />
            <span>{t('dash.exportStats', lang) || 'Exportar Reportes'}</span>
          </button>
        )}
      </div>

      <div className="stats-grid">
        <StatCard title={t('dash.totalLegalized', lang)} value={formatCurrency(stats.totalLegalized)} trend="+12.5%" type="up" lang={lang} />
        <StatCard title={t('dash.availableBudget', lang)} value={formatCurrency(stats.availableBudget)} trend="-5.2%" type="down" lang={lang} />
        <StatCard title={t('dash.pendingExpenses', lang)} value={stats.pendingExpenses.toString()} trend="+3" type="up" lang={lang} />
        <StatCard title={t('dash.activeUsers', lang)} value={stats.activeUsers.toString()} trend="+5" type="up" lang={lang} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
           <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '2rem', color: 'var(--text-primary)' }}>{t('dash.trendTitle', lang)}</h3>
           <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={stats.spendingTrend}>
                 <defs>
                   <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                     <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" vertical={false} />
                 <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `${currency === 'COP' ? '$' : currency}${value >= 1000000 ? (value/1000000).toFixed(1)+'M' : (value/1000).toFixed(0)+'k'}`} />
                 <Tooltip 
                    contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--card-border)', borderRadius: '12px', color: 'var(--text-primary)' }}
                    itemStyle={{ color: 'var(--primary)' }}
                    formatter={(value) => formatCurrency(value)}
                 />
                 <Area type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>

        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
             <Calendar color="var(--primary)" size={20} />
             <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{t('dash.taxCalendar', lang)}</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
             {stats.upcomingTaxes.length > 0 ? stats.upcomingTaxes.map((tax, idx) => (
               <TaxDate key={idx} title={tax.title} date={new Date(tax.dueDate).toLocaleDateString(lang, { day: '2-digit', month: 'short' })} status={tax.status === 'Urgent' ? t('common.urgent', lang) : t('common.next', lang)} />
             )) : (
               <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1rem' }}>No hay eventos próximos</p>
             )}
          </div>
          <button className="btn-secondary" style={{ marginTop: 'auto', width: '100%' }} onClick={() => window.location.href='/calendar'}>{t('common.viewFullCalendar', lang)}</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
             <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{t('dash.recentActivity', lang)}</h3>
             <button style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }} onClick={() => window.location.href='/audit'}>{t('common.viewAll', lang)}</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                 {stats.recentActivity.length > 0 ? stats.recentActivity.map((activity, idx) => (
                   <ActivityItem key={idx} company={activity.companyName || 'General'} user={activity.userFullName} amount={formatCurrency(activity.amount)} time={activity.action} />
                 )) : (
                   <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Sin actividad reciente</p>
                 )}
          </div>
        </div>

        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
             <ArrowUpRight color="var(--primary)" size={32} />
          </div>
          <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{t('dash.monthlyGrowth', lang)}</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>{t('dash.growthMsg', lang)}</p>
          <button className="btn-secondary" style={{ width: '100%' }} onClick={() => window.location.href='/analytics'}>{t('common.viewReport', lang)}</button>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, trend, type, lang }) => (
  <div className="glass-panel stat-card">
    <span className="stat-label">{title}</span>
    <span className="stat-value">{value}</span>
    <div className={`stat-trend ${type === 'up' ? 'trend-up' : 'trend-down'}`}>
      {type === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
      <span>{trend}</span>
      <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: '0.25rem' }}>{t('common.thisMonth', lang)}</span>
    </div>
  </div>
);

const ActivityItem = ({ company, user, amount, time }) => {
  const [isHovered, setIsHovered] = React.useState(false);
  
  return (
    <div 
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: '1rem', 
        borderRadius: '18px', 
        background: 'var(--card-bg)', 
        border: '1px solid var(--card-border)', 
        transition: 'all 0.2s' 
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 800 }}>
          {company[0]}
        </div>
        <div>
          <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{user}</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{company}</p>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <p style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{amount}</p>
        <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{time}</p>
      </div>
    </div>
  );
};

const TaxDate = ({ title, date, status }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', borderRadius: '14px', background: 'var(--card-bg)' }}>
    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--bg-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)' }}>
        {date}
      </div>
      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{title}</span>
    </div>
    <span className="badge badge-indigo" style={{ fontSize: '0.6rem' }}>{status}</span>
  </div>
);

export default DashboardPage;
