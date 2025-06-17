import React, { useState } from 'react';
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,

} from '@mui/material';
import {
  FileDownload as DownloadIcon,
  TableChart as ExcelIcon,
  PictureAsPdf as PdfIcon,
  Description as CsvIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';

interface ExportButtonProps {
  data: any[];
  filename: string;
  columns?: { key: string; label: string }[];
  title?: string;
  variant?: 'contained' | 'outlined' | 'text';
  size?: 'small' | 'medium' | 'large';
}

const ExportButton: React.FC<ExportButtonProps> = ({
  data,
  filename,
  columns,
  title = 'Export Data',
  variant = 'outlined',
  size = 'medium',
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [loading, setLoading] = useState(false);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // Convert data to CSV format
  const exportToCSV = () => {
    try {
      setLoading(true);
      
      if (!data || data.length === 0) {
        toast.error('No data to export');
        return;
      }

      // Determine columns
      const exportColumns = columns || Object.keys(data[0]).map(key => ({ key, label: key }));
      
      // Create CSV content
      const headers = exportColumns.map(col => col.label).join(',');
      const rows = data.map(item => 
        exportColumns.map(col => {
          const value = item[col.key];
          // Handle nested objects and arrays
          const cellValue = typeof value === 'object' && value !== null 
            ? JSON.stringify(value).replace(/"/g, '""')
            : String(value || '').replace(/"/g, '""');
          return `"${cellValue}"`;
        }).join(',')
      );
      
      const csvContent = [headers, ...rows].join('\n');
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('CSV exported successfully!');
    } catch (error) {
      console.error('CSV export error:', error);
      toast.error('Failed to export CSV');
    } finally {
      setLoading(false);
      handleClose();
    }
  };

  // Convert data to Excel format (simplified)
  const exportToExcel = () => {
    try {
      setLoading(true);
      
      if (!data || data.length === 0) {
        toast.error('No data to export');
        return;
      }

      // For a simple Excel export, we'll create an HTML table and save as .xls
      const exportColumns = columns || Object.keys(data[0]).map(key => ({ key, label: key }));
      
      let htmlContent = `
        <html>
          <head>
            <meta charset="utf-8">
            <title>${title}</title>
            <style>
              table { border-collapse: collapse; width: 100%; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; font-weight: bold; }
            </style>
          </head>
          <body>
            <h2>${title}</h2>
            <table>
              <thead>
                <tr>
                  ${exportColumns.map(col => `<th>${col.label}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${data.map(item => `
                  <tr>
                    ${exportColumns.map(col => {
                      const value = item[col.key];
                      const cellValue = typeof value === 'object' && value !== null 
                        ? JSON.stringify(value)
                        : String(value || '');
                      return `<td>${cellValue}</td>`;
                    }).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;
      
      const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.xls`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Excel file exported successfully!');
    } catch (error) {
      console.error('Excel export error:', error);
      toast.error('Failed to export Excel file');
    } finally {
      setLoading(false);
      handleClose();
    }
  };

  // Convert data to PDF format (simplified)
  const exportToPDF = () => {
    try {
      setLoading(true);
      
      if (!data || data.length === 0) {
        toast.error('No data to export');
        return;
      }

      // For PDF export, we'll create an HTML page and let the browser handle PDF generation
      const exportColumns = columns || Object.keys(data[0]).map(key => ({ key, label: key }));
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>${title}</title>
            <style>
              @media print {
                body { margin: 0; }
                .no-print { display: none; }
              }
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { color: #333; margin-bottom: 20px; }
              table { border-collapse: collapse; width: 100%; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
              th { background-color: #f2f2f2; font-weight: bold; }
              tr:nth-child(even) { background-color: #f9f9f9; }
              .export-info { margin-bottom: 20px; color: #666; }
            </style>
          </head>
          <body>
            <h1>${title}</h1>
            <div class="export-info">
              <p>Generated on: ${new Date().toLocaleString()}</p>
              <p>Total records: ${data.length}</p>
            </div>
            <table>
              <thead>
                <tr>
                  ${exportColumns.map(col => `<th>${col.label}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${data.map(item => `
                  <tr>
                    ${exportColumns.map(col => {
                      const value = item[col.key];
                      const cellValue = typeof value === 'object' && value !== null 
                        ? JSON.stringify(value)
                        : String(value || '');
                      return `<td>${cellValue}</td>`;
                    }).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="no-print" style="margin-top: 20px;">
              <button onclick="window.print()">Print PDF</button>
              <button onclick="window.close()">Close</button>
            </div>
          </body>
        </html>
      `;
      
      // Open in new window for printing
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        
        // Auto-trigger print dialog after a short delay
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
      
      toast.success('PDF export window opened!');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF');
    } finally {
      setLoading(false);
      handleClose();
    }
  };



  return (
    <>
      <Button
        variant={variant}
        size={size}
        startIcon={loading ? <CircularProgress size={16} /> : <DownloadIcon />}
        onClick={handleClick}
        disabled={loading || !data || data.length === 0}
      >
        Export
      </Button>
      
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <MenuItem onClick={exportToCSV} disabled={loading}>
          <ListItemIcon>
            <CsvIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export as CSV</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={exportToExcel} disabled={loading}>
          <ListItemIcon>
            <ExcelIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export as Excel</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={exportToPDF} disabled={loading}>
          <ListItemIcon>
            <PdfIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export as PDF</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default ExportButton; 