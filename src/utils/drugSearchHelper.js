/**
 * Smart in-memory ranking helper for drug search suggestions.
 * Prioritizes:
 * 1. Exact match (e.g., "tab" === "tab")
 * 2. Prefix match: Drugs that start directly with the query (e.g. "TAB. ..." or "TAB ...")
 * 3. Medicine brand starts with query after stripping dosage prefixes (e.g. "TAB. CILACAR" for "cila")
 * 4. Word boundary match: A word inside starts with the query
 * 5. Substring match elsewhere
 */
export const rankDrugResults = (drugs, query) => {
    if (!query || !query.trim() || !Array.isArray(drugs)) return drugs || [];

    const q = query.trim().toLowerCase();
    const qClean = q.replace(/[.\s]+$/, '');

    const getScore = (name) => {
        if (!name) return 999;
        const n = name.trim().toLowerCase();

        // Tier 0: Exact match
        if (n === q || n === qClean) return 0;

        // Tier 1: Starts with query directly (e.g., "TAB. THYRONORM..." when typing "tab" or "tab.")
        if (n.startsWith(q) || n.startsWith(qClean + '.') || n.startsWith(qClean + ' ')) {
            return 10;
        }

        // Tier 2: Medicine brand name starts with query after stripping standard prefixes (TAB., CAP., SYP., INJ., etc.)
        const withoutPrefix = n.replace(/^(tab\.|tab\s|cap\.|cap\s|syp\.|syp\s|inj\.|inj\s|oint\.|oint\s|gel\s|drops\s)/i, '').trim();
        if (withoutPrefix.startsWith(q) || withoutPrefix.startsWith(qClean)) {
            return 20;
        }

        // Tier 3: Any word starts with query
        const words = n.split(/[\s./-]+/).filter(Boolean);
        const wordMatchIndex = words.findIndex(w => w.startsWith(qClean));
        if (wordMatchIndex !== -1) {
            return 30 + Math.min(wordMatchIndex * 5, 30);
        }

        // Tier 4: Query appears inside a word (substring)
        const subIndex = n.indexOf(qClean);
        if (subIndex !== -1) {
            return 80 + Math.min(subIndex, 20);
        }

        return 200;
    };

    return [...drugs].sort((a, b) => {
        const scoreA = getScore(a);
        const scoreB = getScore(b);
        if (scoreA !== scoreB) return scoreA - scoreB;
        if (a.length !== b.length) return a.length - b.length;
        return a.localeCompare(b);
    });
};

