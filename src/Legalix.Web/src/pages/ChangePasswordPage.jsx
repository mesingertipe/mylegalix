import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, CheckCircle, XCircle, Loader2, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { t } from '../utils/i18n';
import api from '../services/api';

const ChangePasswordPage = () => {
    const { user, logout, config } = useAuth();
    const lang = config?.language || 'es-CO';
    const { addToast } = useToast();
    const navigate = useNavigate();
    
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Validation flags
    const validations = {
        length: newPassword.length >= 8,
        letter: /[a-zA-Z]/.test(newPassword),
        number: /[0-9]/.test(newPassword),
        special: /[^a-zA-Z0-9]/.test(newPassword)
    };
    
    const allValid = Object.values(validations).every(v => v) && newPassword === confirmPassword && newPassword !== '';

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!allValid) return;
        
        setIsSubmitting(true);
        try {
            await api.post('/auth/change-password', {
                currentPassword,
                newPassword
            });
            addToast(t('changePwd.success', lang), 'success');
            logout();
            navigate('/login');
        } catch (error) {
            addToast(error.response?.data?.message || t('changePwd.error', lang), 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-deep)' }}>
            <div className="bg-glow-top"></div>
            
            <div className="glass-panel reveal" style={{ width: '100%', maxWidth: '480px', padding: '3rem', borderRadius: '32px' }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{ 
                        width: '70px', 
                        height: '70px', 
                        background: 'rgba(99, 102, 241, 0.1)', 
                        borderRadius: '20px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        color: 'var(--primary)',
                        margin: '0 auto 1.5rem auto'
                    }}>
                        <ShieldCheck size={36} />
                    </div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>{t('changePwd.title', lang)}</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                        {t('changePwd.subtitle', lang)}
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ position: 'relative' }}>
                        <label className="stat-label">{t('changePwd.currentLabel', lang)}</label>
                        <div style={{ position: 'relative' }}>
                            <Lock className="search-icon" size={18} style={{ left: '1.25rem' }} />
                            <input 
                                type="password"
                                className="search-input"
                                style={{ paddingLeft: '3.5rem', width: '100%', borderRadius: '16px' }}
                                required
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder={t('changePwd.currentPlaceholder', lang)}
                            />
                        </div>
                    </div>

                    <div style={{ position: 'relative' }}>
                        <label className="stat-label">{t('changePwd.newLabel', lang)}</label>
                        <div style={{ position: 'relative' }}>
                            <Lock className="search-icon" size={18} style={{ left: '1.25rem' }} />
                            <input 
                                type="password"
                                className="search-input"
                                style={{ paddingLeft: '3.5rem', width: '100%', borderRadius: '16px' }}
                                required
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder={t('changePwd.newPlaceholder', lang)}
                            />
                        </div>
                    </div>

                    <div style={{ position: 'relative' }}>
                        <label className="stat-label">{t('changePwd.confirmLabel', lang)}</label>
                        <div style={{ position: 'relative' }}>
                            <Lock className="search-icon" size={18} style={{ left: '1.25rem' }} />
                            <input 
                                type="password"
                                className="search-input"
                                style={{ paddingLeft: '3.5rem', width: '100%', borderRadius: '16px' }}
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder={t('changePwd.confirmPlaceholder', lang)}
                            />
                        </div>
                    </div>

                    {/* Validation Indicators */}
                    <div style={{ 
                        background: 'rgba(255,255,255,0.02)', 
                        padding: '1.5rem', 
                        borderRadius: '20px', 
                        border: '1px solid var(--card-border)',
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '1rem'
                    }}>
                        <ValidationRule met={validations.length} text={t('changePwd.rule8chars', lang)} />
                        <ValidationRule met={validations.letter} text={t('changePwd.ruleLetters', lang)} />
                        <ValidationRule met={validations.number} text={t('changePwd.ruleNumbers', lang)} />
                        <ValidationRule met={validations.special} text={t('changePwd.ruleSpecial', lang)} />
                        <div style={{ gridColumn: 'span 2', marginTop: '0.5rem', borderTop: '1px solid var(--card-border)', paddingTop: '0.75rem' }}>
                            <ValidationRule met={newPassword === confirmPassword && newPassword !== ''} text={t('changePwd.ruleMatch', lang)} />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        className="btn-primary" 
                        disabled={!allValid || isSubmitting}
                        style={{ padding: '1.25rem', justifyContent: 'center', fontSize: '1rem', marginTop: '1rem', borderRadius: '16px', opacity: allValid ? 1 : 0.6 }}
                    >
                        {isSubmitting ? (
                            <Loader2 className="spinning" size={20} />
                        ) : (
                            <>
                                {t('changePwd.submit', lang)}
                                <ArrowRight size={18} style={{ marginLeft: '0.75rem' }} />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

const ValidationRule = ({ met, text }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem', color: met ? 'var(--success)' : 'var(--text-muted)' }}>
        {met ? <CheckCircle size={14} /> : <XCircle size={14} />}
        <span style={{ fontWeight: met ? 700 : 500 }}>{text}</span>
    </div>
);

export default ChangePasswordPage;
