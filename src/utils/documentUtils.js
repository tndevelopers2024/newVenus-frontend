/**
 * Shared utilities for document and prescription rendering
 */

/**
 * Recursively search for an 'image' field in a data object
 * This is used to detect if a handwritten prescription exists regardless of data nesting.
 */
export const findImageField = (obj) => {
    if (!obj || typeof obj !== 'object') return null;
    
    // 1. Explicitly check known fields (Priority)
    if (obj.image && typeof obj.image === 'string') return obj.image;
    if (obj.prescriptionImage && typeof obj.prescriptionImage === 'string') return obj.prescriptionImage;
    if (obj.prescription && obj.prescription.image && typeof obj.prescription.image === 'string') return obj.prescription.image;
    if (obj.prescription && obj.prescription.prescriptionImage && typeof obj.prescription.prescriptionImage === 'string') return obj.prescription.prescriptionImage;
    
    // 2. Fallback: Recursive search (avoiding heavy objects)
    for (const key in obj) {
        if (obj[key] && typeof obj[key] === 'object' && key !== 'patient' && key !== 'doctor') {
            const found = findImageField(obj[key]);
            if (found) return found;
        }
    }
    return null;
};

/**
 * Resolve a raw image path/URL into a valid source for <img> tags
 */
export const resolveImageUrl = (imagePath, apiBase = '') => {
    if (!imagePath) return null;
    
    // 1. Handle absolute URLs (http://... or blob:... or data:...)
    if (imagePath.startsWith('http') || imagePath.startsWith('blob:') || imagePath.startsWith('data:')) {
        return imagePath;
    }
    
    // 2. Resolve relative backend paths
    const baseUrl = (apiBase || '').split('/api')[0];
    const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    
    return `${baseUrl}${cleanPath}`;
};

/**
 * Determine if Image-Only mode should be active
 */
export const isImagePrescription = (data, type = 'prescription') => {
    if (type !== 'prescription') return false;
    const imagePath = findImageField(data);
    return !!imagePath;
};

/**
 * Format duration for prescription display (e.g. "5 Days", "2 Weeks", "1 Month")
 * Cleans up legacy duplications like "2 Days Days"
 */
export const formatMedicationDuration = (duration, durationUnit = 'Days') => {
    if (!duration && duration !== 0) return '-';
    let durStr = String(duration).trim();
    if (!durStr) return '-';

    // Clean up duplicate units like "2 Days Days" or "2 Weeks Weeks"
    durStr = durStr.replace(/\b(days?|weeks?|months?)(\s+\1)+\b/gi, '$1');

    // Check if the duration string already contains a unit
    const match = durStr.match(/^(\d+)\s*(days?|weeks?|months?)$/i);
    if (match) {
        const num = parseInt(match[1], 10);
        const u = match[2].toLowerCase();
        if (u.startsWith('day')) return `${num} ${num === 1 ? 'Day' : 'Days'}`;
        if (u.startsWith('week')) return `${num} ${num === 1 ? 'Week' : 'Weeks'}`;
        if (u.startsWith('month')) return `${num} ${num === 1 ? 'Month' : 'Months'}`;
        return durStr;
    }

    const num = parseInt(durStr, 10);
    if (!isNaN(num)) {
        const unit = (durationUnit || 'Days').trim().toLowerCase();
        if (unit.startsWith('day')) return `${num} ${num === 1 ? 'Day' : 'Days'}`;
        if (unit.startsWith('week')) return `${num} ${num === 1 ? 'Week' : 'Weeks'}`;
        if (unit.startsWith('month')) return `${num} ${num === 1 ? 'Month' : 'Months'}`;
        return `${num} ${durationUnit || 'Days'}`;
    }

    return durStr;
};

/**
 * Normalize medication object when loading drafts or templates
 * Extracts number and unit if combined (e.g. "2 Days" -> duration: "2", durationUnit: "Days")
 */
export const normalizeMedication = (med) => {
    if (!med) return { name: '', frequency: '', duration: '', durationUnit: 'Days', instruction: 'After Food' };
    
    let duration = med.duration !== undefined && med.duration !== null ? String(med.duration).trim() : '';
    let durationUnit = med.durationUnit || 'Days';

    if (duration) {
        // Strip out duplicated words like "2 Days Days"
        duration = duration.replace(/\b(days?|weeks?|months?)(\s+\1)+\b/gi, '$1');

        const match = duration.match(/^(\d+)\s*(days?|weeks?|months?)$/i);
        if (match) {
            duration = match[1];
            const u = match[2].toLowerCase();
            if (u.startsWith('day')) durationUnit = 'Days';
            else if (u.startsWith('week')) durationUnit = 'Weeks';
            else if (u.startsWith('month')) durationUnit = 'Months';
        }
    }

    return {
        ...med,
        duration,
        durationUnit: durationUnit || 'Days'
    };
};

