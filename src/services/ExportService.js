import * as XLSX from 'xlsx';

export const exportToExcel = (data, filename) => {
    if (!data || !data.length) {
        alert('No hay datos para exportar');
        return;
    }

    // Create a new workbook
    const wb = XLSX.utils.book_new();

    // Convert data to worksheet
    const ws = XLSX.utils.json_to_sheet(data);

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, "Datos");

    // Generate buffer and trigger download
    // XLSX.writeFile will handle the file creation and download in most browsers
    XLSX.writeFile(wb, `${filename}.xlsx`);
};
