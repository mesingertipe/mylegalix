import React, { useState, useEffect } from 'react';

const CurrencyInput = ({ 
    value, 
    onChange, 
    placeholder, 
    disabled, 
    className = "search-input", 
    style, 
    currencyCode = 'COP' 
}) => {
    const [displayValue, setDisplayValue] = useState('');

    // Format a generic number to locale string
    const formatValue = (val) => {
        if (val === null || val === undefined || val === '') return '';
        const num = Number(val);
        if (isNaN(num)) return '';
        
        const lang = window.legalixConfig?.language || 'es-CO';
        return num.toLocaleString(lang);
    };

    // Update display value when prop changes externally
    useEffect(() => {
        setDisplayValue(formatValue(value));
    }, [value]);

    const handleChange = (e) => {
        const inputValue = e.target.value;
        const lang = window.legalixConfig?.language || 'es-CO';
        
        // Remove everything except digits and minus sign
        // This is safe even for formatted numbers, as it strips commas/dots
        const rawString = inputValue.replace(/[^0-9-]/g, '');
        
        // Let the user type freely
        setDisplayValue(inputValue);
        
        if (onChange) {
            if (rawString === '' || rawString === '-') {
                onChange(0);
            } else {
                onChange(Number(rawString));
            }
        }
    };

    const handleBlur = () => {
        // Reformat immediately when leaving input
        setDisplayValue(formatValue(value));
    };

    return (
        <input
            type="text"
            value={displayValue}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={disabled}
            className={className}
            style={style}
            placeholder={placeholder}
        />
    );
};

export default CurrencyInput;
