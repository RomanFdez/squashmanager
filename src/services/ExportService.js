
export const exportToCSV = (data, filename) => {
    if (!data || !data.length) {
        alert('No hay datos para exportar');
        return;
    }

    // Get headers from first object
    // We want to flatten objects if possible or just pick keys
    // For simplicity, we assume flat objects or simple depth.

    // We need to handle potential nulls in values
    const headers = Object.keys(data[0]);

    const csvContent = [
        headers.join(','), // Header row
        ...data.map(row => headers.map(header => {
            let value = row[header];
            if (value === null || value === undefined) value = '';
            // Escape quotes and wrap in quotes if contains comma
            const stringValue = String(value);
            if (stringValue.includes(',') || stringValue.includes('"')) {
                return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
        }).join(','))
    ].join('\n');

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
