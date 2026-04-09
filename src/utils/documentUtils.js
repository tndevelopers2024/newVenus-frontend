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
    
    // 1. Handle absolute URLs (http://... or blob:...)
    if (imagePath.startsWith('http') || imagePath.startsWith('blob:')) {
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
