import jsPDF from 'jspdf';

export interface PdfMasterField {
  label: string;
  value: string;
}

export interface PdfTableColumn<T> {
  header: string;
  width: number;
  align?: 'left' | 'right' | 'center';
  value: (row: T) => string;
}

export interface MasterDetailPdfConfig<T> {
  fileName: string;
  title: string;
  folio: string;
  store: string;
  user: string;
  generatedAt: string;
  masterTitle?: string;
  detailTitle?: string;
  logoPlaceholderText?: string;
  footerNote?: string;
  masterFieldsLeft: PdfMasterField[];
  masterFieldsRight: PdfMasterField[];
  columns: PdfTableColumn<T>[];
  rows: T[];
  totalLabel: string;
  totalValue: string;
}

export function exportMasterDetailPdf<T>(config: MasterDetailPdfConfig<T>): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  let y = drawHeader(doc, config);
  y = drawMasterData(doc, y, config);
  y = drawDetailTable(doc, y + 4, config);

  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + 10 > pageHeight - 6) {
    doc.addPage();
    y = 20;
  }

  if (config.footerNote) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(110, 110, 110);
    doc.text(config.footerNote, 12, y + 8);
  }

  doc.save(config.fileName);
}

function drawHeader<T>(doc: jsPDF, config: MasterDetailPdfConfig<T>): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const containerX = 12;
  const containerY = 10;
  const containerWidth = pageWidth - 24;
  const containerHeight = 30;

  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.2);
  doc.rect(containerX, containerY, containerWidth, containerHeight);

  doc.setDrawColor(160, 160, 160);
  doc.rect(containerX + 2, containerY + 2, 30, 26);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(130, 130, 130);
  doc.text(config.logoPlaceholderText || 'LOGO', containerX + 17, containerY + 16, { align: 'center' });

  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(config.title, containerX + 36, containerY + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Folio: ${config.folio}`, containerX + 36, containerY + 16);
  doc.text(`Tienda: ${config.store}`, containerX + 36, containerY + 22);
  doc.text(`Usuario: ${config.user}`, containerX + 36, containerY + 28);

  doc.setFontSize(8);
  doc.text(`Generado: ${config.generatedAt}`, containerX + containerWidth - 2, containerY + 28, { align: 'right' });

  return containerY + containerHeight + 8;
}

function drawMasterData<T>(doc: jsPDF, startY: number, config: MasterDetailPdfConfig<T>): number {
  const boxX = 12;
  const boxY = startY;
  const boxWidth = 186;
  const rowsCount = Math.max(config.masterFieldsLeft.length, config.masterFieldsRight.length);
  const boxHeight = Math.max(22, rowsCount * 6 + 10);
  const leftX = boxX + 4;
  const rightX = boxX + 96;

  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.2);
  doc.rect(boxX, boxY, boxWidth, boxHeight);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(config.masterTitle || 'Datos generales', boxX + 4, boxY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  for (let i = 0; i < config.masterFieldsLeft.length; i++) {
    const lineY = boxY + 13 + i * 6;
    const field = config.masterFieldsLeft[i];
    doc.text(`${field.label}: ${field.value}`, leftX, lineY);
  }

  for (let i = 0; i < config.masterFieldsRight.length; i++) {
    const lineY = boxY + 13 + i * 6;
    const field = config.masterFieldsRight[i];
    doc.text(`${field.label}: ${field.value}`, rightX, lineY);
  }

  return boxY + boxHeight + 2;
}

function drawDetailTable<T>(doc: jsPDF, startY: number, config: MasterDetailPdfConfig<T>): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginBottom = 12;
  const tableX = 12;
  const tableWidth = 186;
  const rowMinHeight = 6;
  const colStartX = getColumnStarts(tableX, config.columns);
  let y = startY;

  const drawTableHeader = (): void => {
    doc.setFillColor(240, 240, 240);
    doc.rect(tableX, y, tableWidth, 7, 'F');
    doc.setDrawColor(180, 180, 180);
    doc.rect(tableX, y, tableWidth, 7);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);

    for (let i = 0; i < config.columns.length; i++) {
      const col = config.columns[i];
      const start = colStartX[i];
      const end = start + col.width;
      const align = col.align || 'left';
      const textX = align === 'right' ? end - 2 : align === 'center' ? start + col.width / 2 : start + 2;
      doc.text(col.header, textX, y + 4.5, { align });
    }

    y += 7;
  };

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(config.detailTitle || 'Detalle', tableX, y - 1);
  drawTableHeader();

  for (const row of config.rows) {
    const rowTexts = config.columns.map((col) => col.value(row) || '-');
    const wrappedByCol = rowTexts.map((text, i) => {
      const col = config.columns[i];
      return doc.splitTextToSize(String(text), Math.max(4, col.width - 4));
    });
    const maxLines = wrappedByCol.reduce((max, lines) => Math.max(max, lines.length || 1), 1);
    const rowHeight = Math.max(rowMinHeight, maxLines * 4 + 2);

    if (y + rowHeight > pageHeight - marginBottom) {
      doc.addPage();
      y = 16;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(`${config.detailTitle || 'Detalle'} (continuacion)`, tableX, y - 1);
      drawTableHeader();
    }

    doc.setDrawColor(210, 210, 210);
    doc.rect(tableX, y, tableWidth, rowHeight);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);

    for (let i = 0; i < config.columns.length; i++) {
      const col = config.columns[i];
      const start = colStartX[i];
      const end = start + col.width;
      const align = col.align || 'left';
      const textX = align === 'right' ? end - 2 : align === 'center' ? start + col.width / 2 : start + 2;
      doc.text(wrappedByCol[i], textX, y + 4.2, { align });
    }

    y += rowHeight;
  }

  if (y + 8 > pageHeight - marginBottom) {
    doc.addPage();
    y = 16;
  }

  doc.setDrawColor(180, 180, 180);
  doc.rect(tableX, y, tableWidth, 8);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(config.totalLabel, tableX + tableWidth - 34, y + 5.2, { align: 'right' });
  doc.text(config.totalValue, tableX + tableWidth - 2, y + 5.2, { align: 'right' });

  return y + 8;
}

function getColumnStarts<T>(tableX: number, columns: PdfTableColumn<T>[]): number[] {
  const starts: number[] = [];
  let current = tableX;
  for (const col of columns) {
    starts.push(current);
    current += col.width;
  }
  return starts;
}
