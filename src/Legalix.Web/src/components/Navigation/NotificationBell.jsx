import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, ExternalLink, Clock, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { t } from '../../utils/i18n';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { parseNotificationText } from '../../utils/NotificationUtils';

const NotificationBell = () => {
    const { user, config } = useAuth();
    const lang = config?.language || 'es-CO';
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const { addToast } = useToast();
    const popoverRef = useRef(null);
    const lastIdRef = useRef(null);

    const fetchNotifications = async () => {
        try {
            setIsLoading(true);
            const [notifRes, unreadRes] = await Promise.all([
                api.get('/notifications'),
                api.get('/notifications/unread-count')
            ]);
            
            const newNotifs = notifRes.data.slice(0, 5);
            
            // Trigger Toast for NEW notifications (if we have a baseline)
            if (lastIdRef.current && newNotifs.length > 0) {
                const newest = newNotifs[0];
                if (newest.id !== lastIdRef.current && !newest.isRead) {
                    const typeMap = { 0: 'info', 1: 'success', 2: 'error', 3: 'error', 4: 'info' };
                    addToast(parseNotificationText(newest.message, lang), typeMap[newest.type] || 'info');
                }
            }
            
            if (newNotifs.length > 0) {
                lastIdRef.current = newNotifs[0].id;
            }
            
            setNotifications(newNotifs);
            setUnreadCount(unreadRes.data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(() => {
            if (!isOpen) fetchNotifications();
        }, 30000); // 30 sec polling
        return () => clearInterval(interval);
    }, [user, isOpen]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAllAsRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error('Error marking notifications as read:', error);
        }
    };

    const handleNotificationClick = async (notif) => {
        if (!notif.isRead) {
            try {
                await api.put(`/notifications/${notif.id}/read`);
            } catch (error) {
                console.error('Error marking notification as read:', error);
            }
        }
        setIsOpen(false);
        if (notif.actionUrl) {
            navigate(notif.actionUrl);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 0: // Activity/Info
                return <Info size={16} className="text-primary" />;
            case 1: // Success
                return <CheckCircle2 size={16} className="text-success" />;
            case 2: // Error/Warning
                return <AlertCircle size={16} className="text-danger" />;
            default:
                return <Bell size={16} />;
        }
    };

    const formatTime = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000); // seconds

        if (diff < 60) return t('common.now', lang);
        if (diff < 3600) return `${Math.floor(diff / 60)}m`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
        return date.toLocaleDateString(lang, { day: '2-digit', month: 'short' });
    };

    return (
        <div className="relative" ref={popoverRef} style={{ marginRight: '1rem' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="btn-icon"
                style={{
                    position: 'relative',
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'var(--card-bg)',
                    border: '1px solid var(--card-border)',
                    color: unreadCount > 0 ? 'var(--primary)' : 'var(--text-secondary)'
                }}
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: 'var(--danger)',
                        color: 'white',
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        minWidth: '18px',
                        height: '18px',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid var(--bg-surface)',
                        padding: '0 4px'
                    }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div 
                    className="glass-panel" 
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 12px)',
                        right: '0',
                        width: '320px',
                        zIndex: 1000,
                        padding: '0',
                        overflow: 'hidden',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                        animation: 'reveal 0.2s ease-out'
                    }}
                >
                    <div style={{
                        padding: '1rem 1.25rem',
                        borderBottom: '1px solid var(--card-border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'rgba(255,255,255,0.02)'
                    }}>
                        <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800 }}>{t('nav.notifications', lang)}</h3>
                        {unreadCount > 0 && (
                            <button 
                                onClick={handleMarkAllAsRead}
                                style={{ 
                                    background: 'none', 
                                    border: 'none', 
                                    color: 'var(--primary)', 
                                    fontSize: '0.75rem', 
                                    fontWeight: 700, 
                                    cursor: 'pointer',
                                    padding: '4px 8px',
                                    borderRadius: '6px'
                                }}
                            >
                                {t('notifications.markAllAsRead', lang)}
                            </button>
                        )}
                    </div>

                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {notifications.length > 0 ? (
                            notifications.map((notif) => (
                                <div 
                                    key={notif.id}
                                    onClick={() => handleNotificationClick(notif)}
                                    style={{
                                        padding: '1rem 1.25rem',
                                        borderBottom: '1px solid var(--card-border)',
                                        cursor: 'pointer',
                                        background: notif.isRead ? 'transparent' : 'rgba(99, 102, 241, 0.03)',
                                        display: 'flex',
                                        gap: '1rem',
                                        transition: 'background 0.2s'
                                    }}
                                    className="notif-item-hover"
                                >
                                    <div style={{
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: '10px',
                                        background: notif.isRead ? 'var(--bg-deep)' : 'rgba(99, 102, 241, 0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0
                                    }}>
                                        {getIcon(notif.type)}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2px' }}>
                                            <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: notif.isRead ? 600 : 800, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {parseNotificationText(notif.title, lang)}
                                            </p>
                                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', flexShrink: 0, marginLeft: '8px' }}>
                                                {formatTime(notif.createdAt)}
                                            </span>
                                        </div>
                                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {parseNotificationText(notif.message, lang)}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{ padding: '2rem', textAlign: 'center' }}>
                                <Bell size={32} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: '1rem' }} />
                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('notifications.noNotifications', lang)}</p>
                            </div>
                        )}
                    </div>

                    <button 
                        onClick={() => {
                            setIsOpen(false);
                            navigate('/notifications');
                        }}
                        style={{
                            width: '100%',
                            padding: '0.85rem',
                            background: 'rgba(255,255,255,0.02)',
                            border: 'none',
                            borderTop: '1px solid var(--card-border)',
                            color: 'var(--primary)',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                        }}
                    >
                        {t('notifications.viewAll', lang)}
                        <ExternalLink size={12} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
