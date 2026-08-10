import { getUnifiedDocumentHTML } from './documentGenerator';

export const printDocument = (data, type = 'prescription') => {
    const html = getUnifiedDocumentHTML(data, type);
    
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    
    document.body.appendChild(iframe);
    
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();
    
    // Remove the iframe after a generous delay to ensure print dialog finishes
    setTimeout(() => {
        if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
        }
    }, 120000); // 2 minutes
};
