import React, { useState, useEffect } from 'react';
import { Bell, Info, CheckCircle, AlertTriangle, XCircle, Clock, Filter, Trash2, Settings, Check } from 'lucide-react';
import { t } from '../utils/i18n';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { formatDate } from '../utils/FormattingUtils';
import { parseNotificationText } from '../utils/NotificationUtils';

const NotificationsPage = () => {
    const { config } = useAuth();
    const lang = config?.language || 'es-CO';
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchNotifications = async () => {
        try {
            const response = await api.get('/notifications');
            setNotifications(response.data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handleMarkAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const getNotifUI = (type) => {
        switch (type) {
            case 1: // Success
                return { icon: <CheckCircle size={18} />, color: 'var(--success)' };
            case 2: // Warning
                return { icon: <AlertTriangle size={18} />, color: 'var(--warning)' };
            case 3: // Error
                return { icon: <XCircle size={18} />, color: 'var(--danger)' };
            case 4: // Activity
                return { icon: <Clock size={18} />, color: 'var(--primary)' };
            default: // Info
                return { icon: <Info size={18} />, color: 'var(--primary)' };
        }
    };

    return (
        <div className="reveal">
            <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <div>
                    <h1 className="page-title">{t('topbar.notifications', lang)}</h1>
                    <p className="page-subtitle">{t('topbar.notificationsSub', lang)}</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn-secondary" style={{ padding: '0.5rem 1rem' }} onClick={handleMarkAllAsRead}>
                        <Check size={18} />
                        {t('notifications.markAllAsRead', lang)}
                    </button>
                </div>
            </header>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem' }}>
                <button className="badge badge-indigo" style={{ border: 'none', cursor: 'pointer', padding: '0.5rem 1rem' }}>{t('common.all', lang) || 'Todas'}</button>
                <div style={{ flex: 1 }}></div>
            </div>

            <div className="glass-panel" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {isLoading ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>{t('common.loading', lang)}</div>
                    ) : notifications.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>{t('notifications.noNotifications', lang)}</div>
                    ) : notifications.map(notif => {
                        const ui = getNotifUI(notif.type);
                        return (
                            <div 
                                key={notif.id} 
                                className={`notification-item ${!notif.isRead ? 'unread' : ''}`} 
                                onClick={() => !notif.isRead && handleMarkAsRead(notif.id)}
                                style={{ 
                                    display: 'flex', 
                                    gap: '1.5rem', 
                                    padding: '1.5rem', 
                                    borderRadius: '20px', 
                                    background: notif.isRead ? 'rgba(255,255,255,0.02)' : 'rgba(var(--primary-rgb), 0.05)', 
                                    border: '1px solid transparent', 
                                    transition: 'all 0.2s', 
                                    cursor: 'pointer',
                                    position: 'relative',
                                    opacity: notif.isRead ? 0.7 : 1
                                }} 
                                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--card-border)'} 
                                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
                            >
                                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: `${ui.color}15`, color: ui.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    {ui.icon}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                        <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{parseNotificationText(notif.title, lang)}</h4>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDate(notif.createdAt)}</span>
                                    </div>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>{parseNotificationText(notif.message, lang)}</p>
                                </div>
                                {!notif.isRead && (
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', position: 'absolute', top: '24px', right: '24px' }}></div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default NotificationsPage;
