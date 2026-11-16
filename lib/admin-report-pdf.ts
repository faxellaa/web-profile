import type { CellHookData } from 'jspdf-autotable';
import type { jsPDF } from 'jspdf';

export type AdminReportCell = string | {
  text: string;
  hyperlink?: string;
  tooltip?: string;
};

export type AdminReportColumn = {
  header: string;
  width: number;
};

export type AdminReport = {
  title: string;
  fileName: string;
  columns: AdminReportColumn[];
  rows: AdminReportCell[][];
  period: string;
};

async function loadLetterhead(): Promise<Uint8Array> {
  const response = await fetch('/img/kop-surat-smp.jpeg');
  if (!response.ok) throw new Error(`Letterhead request failed with status ${response.status}`);
  return new Uint8Array(await response.arrayBuffer());
}

function cellText(cell: AdminReportCell): string {
  return typeof cell === 'string' ? cell : cell.text;
}

function downloadBlob(blob: Blob, fileName: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

function drawLetterhead(
  doc: jsPDF,
  letterhead: Uint8Array,
  title: string,
  period: string,
): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const letterheadWidth = 700;
  const letterheadHeight = letterheadWidth * 372 / 2049;
  doc.addImage(letterhead, 'JPEG', (pageWidth - letterheadWidth) / 2, 16, letterheadWidth, letterheadHeight);
  doc.setTextColor(31, 41, 55);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(title.toLocaleUpperCase('id-ID'), pageWidth / 2, 163, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(period, pageWidth / 2, 178, { align: 'center' });
}

export async function exportAdminReportToPdf(report: AdminReport): Promise<void> {
  const [{ jsPDF }, { autoTable }, letterhead] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
    loadLetterhead(),
  ]);
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a3', compress: true });
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - 64;
  const totalWeight = report.columns.reduce((sum, column) => sum + column.width, 0);
  const columnStyles = Object.fromEntries(
    report.columns.map((column, index) => [
      index,
      { cellWidth: contentWidth * column.width / totalWeight },
    ]),
  );

  autoTable(doc, {
    head: [report.columns.map(({ header }) => header)],
    body: report.rows.map((row) => report.columns.map((_, index) => cellText(row[index] ?? '—'))),
    startY: 193,
    margin: { top: 193, right: 32, bottom: 32, left: 32 },
    tableWidth: contentWidth,
    theme: 'grid',
    showHead: 'everyPage',
    horizontalPageBreak: true,
    horizontalPageBreakRepeat: [0],
    styles: {
      font: 'helvetica',
      fontSize: 7,
      cellPadding: 3,
      overflow: 'linebreak',
      textColor: [31, 41, 55],
      lineColor: [209, 213, 219],
      lineWidth: 0.35,
      valign: 'top',
    },
    headStyles: {
      fillColor: [229, 231, 235],
      textColor: [31, 41, 55],
      fontStyle: 'bold',
      halign: 'center',
    },
    alternateRowStyles: { fillColor: [243, 244, 246] },
    columnStyles,
    willDrawPage: () => drawLetterhead(doc, letterhead, report.title, report.period),
    didDrawCell: (data: CellHookData) => {
      if (data.section !== 'body') return;
      const value = report.rows[data.row.index]?.[data.column.index];
      if (typeof value !== 'string' && value?.hyperlink) {
        doc.link(data.cell.x, data.cell.y, data.cell.width, data.cell.height, { url: value.hyperlink });
      }
    },
  });

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text(`Halaman ${page} dari ${pageCount}`, pageWidth - 32, doc.internal.pageSize.getHeight() - 14, { align: 'right' });
  }

  downloadBlob(doc.output('blob'), `${report.fileName}.pdf`);
}
