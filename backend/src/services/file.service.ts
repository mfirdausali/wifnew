import { parse } from 'csv-parse';
import { stringify } from 'csv-stringify';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { Readable } from 'stream';
import logger from '../utils/logger';

export class FileService {
  static async parseImportFile(file: any, options: any) {
    const errors: any[] = [];
    const rows: any[] = [];

    try {
      switch (options.format) {
        case 'csv':
          return await this.parseCSV(file, options);
        case 'xlsx':
          return await this.parseExcel(file, options);
        case 'json':
          return await this.parseJSON(file, options);
        default:
          throw new Error('Unsupported file format');
      }
    } catch (error: any) {
      errors.push({ error: error.message });
      return { rows, errors };
    }
  }

  private static async parseCSV(file: any, options: any) {
    return new Promise<{ rows: any[], errors: any[] }>((resolve, reject) => {
      const rows: any[] = [];
      const errors: any[] = [];
      let headers: string[] = [];
      let rowIndex = 0;

      const parser = parse({
        delimiter: ',',
        skip_empty_lines: true,
        skip_records_with_error: true,
        trim: true,
      });

      parser.on('readable', function() {
        let record;
        while ((record = parser.read()) !== null) {
          if (rowIndex === 0 && options.hasHeaders) {
            headers = record;
          } else {
            const row: any = {};
            
            if (options.hasHeaders && headers.length > 0) {
              headers.forEach((header, index) => {
                const mappedField = options.columnMapping?.[header] || header;
                row[mappedField] = record[index];
              });
            } else {
              // Use index-based mapping
              record.forEach((value: any, index: number) => {
                row[`column${index}`] = value;
              });
            }
            
            rows.push(row);
          }
          rowIndex++;
        }
      });

      parser.on('error', function(err) {
        errors.push({ row: rowIndex, error: err.message });
      });

      parser.on('end', function() {
        resolve({ rows, errors });
      });

      // Convert file buffer to stream and pipe to parser
      const stream = Readable.from(file.buffer);
      stream.pipe(parser);
    });
  }

  private static async parseExcel(file: any, options: any) {
    const rows: any[] = [];
    const errors: any[] = [];

    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(file.buffer);
      
      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        throw new Error('No worksheet found');
      }

      let headers: string[] = [];
      let rowIndex = 0;

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1 && options.hasHeaders) {
          headers = row.values.slice(1) as string[]; // ExcelJS rows are 1-indexed with empty first element
        } else {
          const rowData: any = {};
          
          if (options.hasHeaders && headers.length > 0) {
            row.values.slice(1).forEach((value, index) => {
              if (index < headers.length) {
                const mappedField = options.columnMapping?.[headers[index]] || headers[index];
                rowData[mappedField] = value;
              }
            });
          } else {
            row.values.slice(1).forEach((value, index) => {
              rowData[`column${index}`] = value;
            });
          }
          
          rows.push(rowData);
        }
        rowIndex++;
      });

      return { rows, errors };
    } catch (error: any) {
      errors.push({ error: error.message });
      return { rows, errors };
    }
  }

  private static async parseJSON(file: any, options: any) {
    const rows: any[] = [];
    const errors: any[] = [];

    try {
      const content = file.buffer.toString('utf8');
      const data = JSON.parse(content);

      if (!Array.isArray(data)) {
        throw new Error('JSON file must contain an array of objects');
      }

      // Apply column mapping if provided
      data.forEach((item, index) => {
        const row: any = {};
        
        Object.entries(item).forEach(([key, value]) => {
          const mappedField = options.columnMapping?.[key] || key;
          row[mappedField] = value;
        });
        
        rows.push(row);
      });

      return { rows, errors };
    } catch (error: any) {
      errors.push({ error: error.message });
      return { rows, errors };
    }
  }

  static async generateCSV(data: any[], options: any): Promise<Buffer> {
    const columns = options.fields || Object.keys(data[0] || {});
    
    const stringifier = stringify({
      header: options.includeHeaders !== false,
      columns: columns.map((col: string) => ({
        key: col,
        header: col.replace(/([A-Z])/g, ' $1').trim(), // Convert camelCase to Title Case
      })),
    });

    const chunks: Buffer[] = [];
    
    stringifier.on('readable', function() {
      let chunk;
      while ((chunk = stringifier.read()) !== null) {
        chunks.push(chunk);
      }
    });

    // Write data
    data.forEach(row => {
      stringifier.write(row);
    });

    stringifier.end();

    return new Promise((resolve, reject) => {
      stringifier.on('error', reject);
      stringifier.on('finish', () => {
        resolve(Buffer.concat(chunks));
      });
    });
  }

  static async generateExcel(data: any[], options: any): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Users');

    // Define columns
    const columns = options.fields || Object.keys(data[0] || {});
    worksheet.columns = columns.map((col: string) => ({
      header: col.replace(/([A-Z])/g, ' $1').trim(),
      key: col,
      width: 20,
    }));

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Add data
    data.forEach(row => {
      const rowData: any = {};
      columns.forEach((col: string) => {
        let value = row[col];
        
        // Format dates
        if (value instanceof Date) {
          value = value.toISOString().split('T')[0];
        } else if (options.dateFormat && typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
          value = new Date(value).toLocaleDateString();
        }
        
        rowData[col] = value;
      });
      
      worksheet.addRow(rowData);
    });

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      if (column.values) {
        const lengths = column.values.map((v: any) => v ? v.toString().length : 10);
        const maxLength = Math.max(...lengths);
        column.width = Math.min(maxLength + 2, 50);
      }
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as Buffer;
  }

  static async generatePDF(data: any[], options: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: options.pageSize || 'A4',
        layout: options.orientation || 'portrait',
        margin: 50,
      });

      const chunks: Buffer[] = [];
      
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Title
      doc.fontSize(20).text('User Export', { align: 'center' });
      doc.moveDown();

      // Metadata
      doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'right' });
      doc.text(`Total Records: ${data.length}`, { align: 'right' });
      doc.moveDown();

      // Table header
      const columns = options.fields || ['email', 'firstName', 'lastName', 'role', 'status'];
      const columnWidth = (doc.page.width - 100) / columns.length;

      doc.fontSize(12).font('Helvetica-Bold');
      let x = 50;
      columns.forEach((col: string) => {
        doc.text(col.replace(/([A-Z])/g, ' $1').trim(), x, doc.y, { 
          width: columnWidth,
          align: 'left',
        });
        x += columnWidth;
      });

      doc.moveDown();
      doc.strokeColor('#000000').lineWidth(1).moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();
      doc.moveDown(0.5);

      // Table rows
      doc.font('Helvetica').fontSize(10);
      
      data.forEach((row, index) => {
        // Check if we need a new page
        if (doc.y > doc.page.height - 100) {
          doc.addPage();
          doc.y = 50;
        }

        x = 50;
        columns.forEach((col: string) => {
          let value = row[col] || '';
          
          // Format values
          if (value instanceof Date) {
            value = value.toLocaleDateString();
          } else if (typeof value === 'object') {
            value = JSON.stringify(value);
          }

          doc.text(value.toString(), x, doc.y, {
            width: columnWidth - 5,
            align: 'left',
            ellipsis: true,
          });
          x += columnWidth;
        });

        doc.moveDown(0.5);

        // Add alternating row background
        if (index % 2 === 0) {
          const rowY = doc.y - 15;
          doc.fillColor('#f5f5f5')
            .rect(50, rowY, doc.page.width - 100, 15)
            .fill()
            .fillColor('#000000');
        }
      });

      // Footer
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).text(
          `Page ${i + 1} of ${pages.count}`,
          50,
          doc.page.height - 50,
          { align: 'center' }
        );
      }

      doc.end();
    });
  }

  static async saveUploadedFile(file: any, directory: string): Promise<string> {
    // Implementation for saving uploaded files
    // This would typically involve:
    // 1. Generating a unique filename
    // 2. Saving to disk or cloud storage
    // 3. Returning the file path/URL
    
    const filename = `${Date.now()}_${file.originalname}`;
    const filepath = `${directory}/${filename}`;
    
    // Save file logic here
    
    logger.info('File saved', { filename, filepath });
    
    return filepath;
  }

  static async deleteFile(filepath: string): Promise<void> {
    // Implementation for deleting files
    logger.info('File deleted', { filepath });
  }
}