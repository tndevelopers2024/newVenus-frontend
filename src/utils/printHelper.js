import { getUnifiedDocumentHTML } from '../components/shared/UnifiedDocument';

export const printDocument = (data, type = 'prescription') => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = getUnifiedDocumentHTML(data, type);
    printWindow.document.write(html);
    printWindow.document.close();
};
