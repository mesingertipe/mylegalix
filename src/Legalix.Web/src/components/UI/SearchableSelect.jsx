import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

const SearchableSelect = ({ options = [], value, onChange, placeholder, lang = 'es-CO', disabled = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef(null);

    const toggleOpen = () => {
        if (!disabled) setIsOpen(!isOpen);
    };

    const handleClickOutside = (event) => {
        if (containerRef.current && !containerRef.current.contains(event.target)) {
            setIsOpen(false);
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = options.filter(opt => 
        opt.label?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedOption = options.find(opt => opt.value === value);

    const handleSelect = (val) => {
        onChange(val);
        setIsOpen(false);
        setSearchTerm('');
    };

    const clearSelection = (e) => {
        e.stopPropagation();
        onChange('');
        setSearchTerm('');
    };

    return (
        <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
            <div 
                onClick={toggleOpen}
                className={`search-input ${disabled ? 'disabled' : ''}`}
                style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    paddingRight: '1rem',
                    borderRadius: '16px',
                    opacity: disabled ? 0.6 : 1,
                    minHeight: '52px'
                }}
            >
                <span style={{ 
                    color: selectedOption ? 'var(--text-primary)' : 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    marginRight: '0.5rem'
                }}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {selectedOption && !disabled && (
                        <X 
                            size={16} 
                            className="btn-icon" 
                            style={{ padding: '2px' }} 
                            onClick={clearSelection}
                        />
                    )}
                    <ChevronDown size={18} color="var(--text-muted)" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </div>
            </div>

            {isOpen && (
                <div className="glass-panel" style={{ 
                    position: 'absolute', 
                    top: 'calc(100% + 8px)', 
                    left: 0, 
                    right: 0, 
                    zIndex: 2000, 
                    padding: '0.75rem',
                    maxHeight: '350px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '20px',
                    animation: 'slideUpDropdown 0.2s ease-out forwards'
                }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: '1.1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input 
                            autoFocus
                            type="text"
                            className="search-input"
                            style={{ 
                                width: '100%', 
                                fontSize: '0.9rem', 
                                padding: '0.75rem 1rem 0.75rem 2.8rem',
                                borderRadius: '14px',
                                background: 'rgba(0,0,0,0.2)',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}
                            placeholder={lang === 'es-CO' ? 'Buscar...' : 'Search...'}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>

                    <div style={{ 
                        overflowY: 'auto', 
                        flex: 1, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '2px',
                        paddingRight: '4px' 
                    }} className="custom-scrollbar">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map(opt => (
                                <div 
                                    key={opt.value}
                                    onClick={() => handleSelect(opt.value)}
                                    style={{ 
                                        padding: '0.8rem 1rem',
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        background: value === opt.value ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                                        transition: 'all 0.2s',
                                        border: '1px solid transparent'
                                    }}
                                    className="select-option"
                                >
                                    <span style={{ 
                                        fontSize: '0.95rem', 
                                        color: value === opt.value ? 'var(--primary)' : 'var(--text-primary)', 
                                        fontWeight: value === opt.value ? 700 : 500 
                                    }}>
                                        {opt.label}
                                    </span>
                                    {value === opt.value && <Check size={18} color="var(--primary)" />}
                                </div>
                            ))
                        ) : (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                {lang === 'es-CO' ? 'No se encontraron resultados' : 'No results found'}
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes slideUpDropdown {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.1);
                    border-radius: 10px;
                }
                .select-option:hover {
                    background: rgba(255,255,255,0.05) !important;
                    border-color: rgba(255,255,255,0.05) !important;
                }
            `}} />
        </div>
    );
};

export default SearchableSelect;
