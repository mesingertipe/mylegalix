/**
 * Utils for Localized Formatting
 */

export const formatCurrency = (amount) => {
    const config = window.legalixConfig || { currency: 'COP', language: 'es-CO' };
    return new Intl.NumberFormat(config.language, {
        style: 'currency',
        currency: config.currency,
        minimumFractionDigits: 0
    }).format(amount);
};

export const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const config = window.legalixConfig || { timeZone: 'SA Pacific Standard Time', language: 'es-CO' };
    
    // Mapping .NET TimeZone IDs to IANA (Simple subset)
    const tzMapping = {
        'SA Pacific Standard Time': 'America/Bogota',
        'Central Standard Time (Mexico)': 'America/Mexico_City',
        'Eastern Standard Time': 'America/New_York',
        'Central European Standard Time': 'Europe/Madrid'
    };

    const ianaTz = tzMapping[config.timeZone] || 'UTC';

    return new Intl.DateTimeFormat(config.language, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: ianaTz
    }).format(new Date(dateString));
};
