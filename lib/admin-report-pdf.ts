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

const SCHOOL_NAME = 'SMP MUHAMMADIYAH KEMBARAN';
const SCHOOL_ADDRESS = 'Jl. Masjid No.2, Kramat, Kembaran, Banyumas, Jawa Tengah 53182';
const REPORT_GRAY: [number, number, number] = [75, 85, 99];

async function loadReportLogo(): Promise<string> {
  const response = await fetch('/img/logosmp.png');
  if (!response.ok) throw new Error(`School logo request failed with status ${response.status}`);

  const image = await createImageBitmap(await response.blob());
  try {
    const scale = Math.min(1, 180 / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));

    const context = canvas.getContext('2d');
    if (!context) throw new Error('A canvas context is unavailable for the school logo.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const resizedLogo = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('The school logo could not be resized.'));
      }, 'image/png');
    });

    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') resolve(reader.result);
        else reject(new Error('The school logo could not be encoded.'));
      };
      reader.onerror = () => reject(reader.error || new Error('The school logo could not be read.'));
      reader.readAsDataURL(resizedLogo);
    });
  } finally {
    image.close();
  }
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
  logo: string,
  title: string,
  period: string,
): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.addImage(logo, 'PNG', 34, 17, 48, 48);
  doc.setTextColor(31, 41, 55);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(SCHOOL_NAME, pageWidth / 2, 31, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Kramat, Kembaran, Banyumas', pageWidth / 2, 47, { align: 'center' });
  doc.text(SCHOOL_ADDRESS, pageWidth / 2, 60, { align: 'center' });

  doc.setDrawColor(...REPORT_GRAY);
  doc.setLineWidth(1);
  doc.line(32, 73, pageWidth - 32, 73);
  doc.setLineWidth(0.35);
  doc.line(32, 76, pageWidth - 32, 76);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(title.toLocaleUpperCase('id-ID'), pageWidth / 2, 96, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(period, pageWidth / 2, 110, { align: 'center' });
}

export async function exportAdminReportToPdf(report: AdminReport): Promise<void> {
  const [{ jsPDF }, { autoTable }, logo] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
    loadReportLogo(),
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
    startY: 126,
    margin: { top: 126, right: 32, bottom: 32, left: 32 },
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
    willDrawPage: () => drawLetterhead(doc, logo, report.title, report.period),
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
