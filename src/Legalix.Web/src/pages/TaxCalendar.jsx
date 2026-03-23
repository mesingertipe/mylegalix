import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Bell, 
  CheckCircle2, 
  Clock,
  AlertTriangle,
  MoreVertical,
  Edit2,
  Trash2
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { formatDate } from '../utils/FormattingUtils';
import { useAuth } from '../context/AuthContext';
import { t } from '../utils/i18n';
import api from '../services/api';

const TaxCalendar = () => {
    const { config } = useAuth();
    const lang = config?.language || 'es-CO';
    const { addToast } = useToast();
    
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        dueDate: '',
        color: '#6366f1',
        isFullDay: true
    });

    useEffect(() => {
        fetchEvents();
    }, [currentDate]);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const start = new Date(year, month - 1, 1).toISOString();
            const end = new Date(year, month + 2, 0).toISOString();
            
            const response = await api.get(`/taxevents?start=${start}&end=${end}`);
            setEvents(response.data);
        } catch (error) {
            console.error('Error fetching events:', error);
            addToast(t('calendar.loadError', lang), 'error');
        } finally {
            setLoading(false);
        }
    };

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleSaveEvent = async (e) => {
        e.preventDefault();
        try {
            if (selectedEvent) {
                await api.put(`/taxevents/${selectedEvent.id}`, formData);
                addToast(t('common.saveSuccess', lang) || 'Evento actualizado', 'success');
            } else {
                await api.post('/taxevents', formData);
                addToast(t('common.saveSuccess', lang) || 'Evento creado', 'success');
            }
            setShowModal(false);
            fetchEvents();
        } catch (error) {
            addToast(t('common.processError', lang), 'error');
        }
    };

    const handleDeleteEvent = async (id) => {
        if (!window.confirm(t('common.deleteConfirm', lang))) return;
        try {
            await api.delete(`/taxevents/${id}`);
            addToast(t('common.deleteSuccess', lang) || 'Evento eliminado', 'success');
            fetchEvents();
        } catch (error) {
            addToast(t('common.deleteError', lang), 'error');
        }
    };

    const openEditModal = (event) => {
        setSelectedEvent(event);
        setFormData({
            title: event.title,
            description: event.description || '',
            dueDate: event.dueDate.split('T')[0],
            color: event.color,
            isFullDay: event.isFullDay
        });
        setShowModal(true);
    };

    const openCreateModal = (day = null) => {
        setSelectedEvent(null);
        const dateStr = day ? 
            new Date(currentDate.getFullYear(), currentDate.getMonth(), day + 1).toISOString().split('T')[0] : 
            new Date().toISOString().split('T')[0];
            
        setFormData({
            title: '',
            description: '',
            dueDate: dateStr,
            color: '#6366f1',
            isFullDay: true
        });
        setShowModal(true);
    };

    // Calendar Generation Logic
    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const days = [];
    const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
    const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());

    // Padding for first week
    for (let i = 0; i < firstDay; i++) {
        days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
    }

    const monthNames = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

    return (
        <div className="reveal">
            {/* Header / Navigation */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '2rem' 
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>
                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </h2>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn-icon" onClick={handlePrevMonth} style={{ background: 'var(--card-bg)' }}>
                            <ChevronLeft size={20} />
                        </button>
                        <button className="btn-icon" onClick={handleNextMonth} style={{ background: 'var(--card-bg)' }}>
                            <ChevronRight size={20} />
                        </button>
                        <button className="btn-secondary" onClick={() => setCurrentDate(new Date())} style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                            Hoy
                        </button>
                    </div>
                </div>

                <button className="btn-primary" onClick={() => openCreateModal()}>
                    <Plus size={20} />
                    <span>{t('calendar.newEvent', lang)}</span>
                </button>
            </div>

            {/* Calendar Grid */}
            <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--card-border)' }}>
                {/* Day Names Header */}
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(7, 1fr)', 
                    background: 'rgba(255,255,255,0.02)',
                    borderBottom: '1px solid var(--card-border)'
                }}>
                    {dayNames.map(day => (
                        <div key={day} style={{ 
                            padding: '1rem', 
                            textAlign: 'center', 
                            fontSize: '0.75rem', 
                            fontWeight: 800, 
                            color: 'var(--text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em'
                        }}>
                            {day}
                        </div>
                    ))}
                </div>

                {/* Grid Cells */}
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    background: 'var(--card-border)',
                    gap: '1px'
                }}>
                    {days.map((day, idx) => {
                        const cellDate = day ? new Date(currentDate.getFullYear(), currentDate.getMonth(), day) : null;
                        const isToday = cellDate && cellDate.toDateString() === new Date().toDateString();
                        
                        const dayEvents = events.filter(e => {
                            const eventDate = new Date(e.dueDate);
                            return day && 
                                   eventDate.getUTCDate() === day && 
                                   eventDate.getUTCMonth() === currentDate.getMonth() &&
                                   eventDate.getUTCFullYear() === currentDate.getFullYear();
                        });

                        return (
                            <div key={idx} style={{ 
                                background: 'var(--bg-surface)', 
                                minHeight: '140px',
                                padding: '0.75rem',
                                position: 'relative',
                                cursor: day ? 'pointer' : 'default',
                                transition: 'background 0.2s'
                            }}
                            onClick={() => day && openCreateModal(day)}
                            onMouseEnter={e => day && (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                            onMouseLeave={e => day && (e.currentTarget.style.background = 'var(--bg-surface)')}
                            >
                                {day && (
                                    <span style={{ 
                                        fontSize: '0.875rem', 
                                        fontWeight: 700,
                                        color: isToday ? 'white' : 'var(--text-secondary)',
                                        background: isToday ? 'var(--primary)' : 'transparent',
                                        width: '28px',
                                        height: '28px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: '50%',
                                        marginBottom: '0.5rem'
                                    }}>
                                        {day}
                                    </span>
                                )}

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {dayEvents.map(event => (
                                        <div 
                                            key={event.id}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openEditModal(event);
                                            }}
                                            style={{ 
                                                background: event.color + '22',
                                                borderLeft: `3px solid ${event.color}`,
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '0.7rem',
                                                fontWeight: 600,
                                                color: 'var(--text-primary)',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                transition: 'transform 0.1s'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.transform = 'translateX(2px)'}
                                            onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}
                                        >
                                            {event.title}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Modal for Add/Edit */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h3 className="header-title">{selectedEvent ? 'Editar Evento' : 'Nuevo Evento'}</h3>
                        </div>
                        <form onSubmit={handleSaveEvent} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div className="form-group">
                                <label className="stat-label">Título</label>
                                <input 
                                    type="text" 
                                    className="search-input" 
                                    style={{ paddingLeft: '1rem' }}
                                    value={formData.title}
                                    onChange={e => setFormData({...formData, title: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="stat-label">Descripción</label>
                                <textarea 
                                    className="search-input" 
                                    style={{ paddingLeft: '1rem', minHeight: '80px', paddingTop: '0.75rem' }}
                                    value={formData.description}
                                    onChange={e => setFormData({...formData, description: e.target.value})}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="stat-label">Fecha</label>
                                    <input 
                                        type="date" 
                                        className="search-input" 
                                        style={{ paddingLeft: '1rem' }}
                                        value={formData.dueDate}
                                        onChange={e => setFormData({...formData, dueDate: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="stat-label">Color</label>
                                    <input 
                                        type="color" 
                                        className="search-input" 
                                        style={{ paddingLeft: '0.5rem', paddingRight: '0.5rem', height: '48px' }}
                                        value={formData.color}
                                        onChange={e => setFormData({...formData, color: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                                    {selectedEvent ? 'Actualizar' : 'Guardar'}
                                </button>
                                {selectedEvent && (
                                    <button 
                                        type="button" 
                                        className="btn-danger-alt" 
                                        style={{ width: '48px', padding: 0 }}
                                        onClick={() => handleDeleteEvent(selectedEvent.id)}
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                )}
                            </div>
                            <button type="button" className="btn-secondary" style={{ width: '100%' }} onClick={() => setShowModal(false)}>
                                Cancelar
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TaxCalendar;
