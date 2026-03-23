import { t } from './i18n';

/**
 * Parses a notification title or message from the backend.
 * Format: "translation.key|param1:value1|param2:value2"
 * 
 * @param {string} input - The raw string from the database.
 * @param {string} lang - Optional language override.
 * @returns {string} - The translated and formatted text.
 */
export const parseNotificationText = (input, lang = null) => {
  if (!input) return '';
  
  // If it doesn't contain a pipe, it might be a legacy literal string or a simple key
  if (!input.includes('|')) {
    // If it looks like a translation key (no spaces, starts with 'notifications.'), try translating it
    if (input.startsWith('notifications.') && !input.includes(' ')) {
      return t(input, {}, lang);
    }
    return input; // Literal Spanish (legacy)
  }

  const parts = input.split('|');
  const key = parts[0];
  const params = {};

  // Parse parameters: paramName:Value
  for (let i = 1; i < parts.length; i++) {
    const pair = parts[i];
    const firstColonIndex = pair.indexOf(':');
    if (firstColonIndex !== -1) {
      const pName = pair.substring(0, firstColonIndex);
      let pValue = pair.substring(firstColonIndex + 1);
      
      // If the value itself is a translation key (e.g. common.approved), translate it
      if (pValue.startsWith('common.') || pValue.startsWith('notifications.')) {
        pValue = t(pValue, {}, lang);
      }
      
      params[pName] = pValue;
    }
  }

  return t(key, params, lang);
};
