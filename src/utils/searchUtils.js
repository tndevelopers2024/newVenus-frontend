/**
 * Search and normalization utilities for matching patients, doctors, and users.
 */

/**
 * Normalizes a string by converting to lowercase and stripping non-alphanumeric characters.
 * Useful for matching names with titles (e.g., "MR.GANESH" vs "mr ganesh")
 * and formatted IDs (e.g., "#NVC-2028-000006" vs "nvc2028000006").
 */
export const normalizeAlphanumeric = (str) => {
    return (str || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
};

/**
 * Checks whether a patient/user object matches a search query string.
 * Supports:
 * - Patient Name (ignoring dots, titles like MR./MRS./DR., and multiple spaces)
 * - Display ID (e.g. #NVC-2028-000006, NVC-2028-000006, 000006, NVC)
 * - Phone number (e.g. 6381798284, formatted numbers, or partial digits)
 * - Email address
 * - Database _id (or last 8 characters)
 * - Age and Gender (e.g. "47", "male")
 * - Multi-token / multi-word queries (e.g. "mr ganesh", "ganesh 47", "nvc 000006")
 */
export const matchesPatientQuery = (person, rawQuery) => {
    if (!rawQuery || typeof rawQuery !== 'string' || !rawQuery.trim()) return true;
    if (!person) return false;

    const query = rawQuery.trim().toLowerCase();
    const normQuery = normalizeAlphanumeric(query);

    const name = (person.name || '').toLowerCase();
    const normName = normalizeAlphanumeric(person.name);

    const email = (person.email || '').toLowerCase();

    const phone = (person.phone || '').toString().toLowerCase();
    const normPhone = normalizeAlphanumeric(person.phone);

    const displayId = (person.displayId || '').toLowerCase();
    const normDisplayId = normalizeAlphanumeric(person.displayId);

    const mongoId = (person._id || '').toString().toLowerCase();
    const idSuffix = mongoId ? mongoId.slice(-8) : '';

    const age = person.age ? String(person.age) : '';
    const gender = (person.gender || '').toLowerCase();

    // 1. Direct substring match on primary fields
    if (
        name.includes(query) ||
        email.includes(query) ||
        phone.includes(query) ||
        displayId.includes(query) ||
        mongoId.includes(query) ||
        idSuffix.includes(query)
    ) {
        return true;
    }

    // 2. Normalized match (strips dots, spaces, dashes, #, etc.)
    if (normQuery.length > 0) {
        if (
            (normName && normName.includes(normQuery)) ||
            (normPhone && normPhone.includes(normQuery)) ||
            (normDisplayId && normDisplayId.includes(normQuery))
        ) {
            return true;
        }
    }

    // 3. Query without leading '#' (e.g., user typed '#NVC-2028-000006')
    const queryWithoutHash = query.startsWith('#') ? query.slice(1).trim() : '';
    if (queryWithoutHash) {
        if (
            displayId.includes(queryWithoutHash) ||
            mongoId.includes(queryWithoutHash) ||
            idSuffix.includes(queryWithoutHash)
        ) {
            return true;
        }
    }

    // 4. Multi-token match (all words entered must match something in the record)
    const tokens = query.split(/\s+/).filter(Boolean);
    if (tokens.length > 1) {
        const composite = `${name} ${normName} ${email} ${phone} ${normPhone} ${displayId} ${normDisplayId} ${mongoId} ${idSuffix} ${age} ${gender}`;
        const allTokensMatch = tokens.every(token => {
            const cleanToken = token.startsWith('#') ? token.slice(1) : token;
            const normToken = normalizeAlphanumeric(cleanToken);
            return (
                composite.includes(token) ||
                (cleanToken && composite.includes(cleanToken)) ||
                (normToken && composite.includes(normToken))
            );
        });
        if (allTokensMatch) return true;
    }

    return false;
};
