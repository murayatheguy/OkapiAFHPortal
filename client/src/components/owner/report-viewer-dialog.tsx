import { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";

interface ReportViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
}

// Comprehensive print styles matching Tailwind classes
const PRINT_STYLES = `
  * { box-sizing: border-box; }
  body {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    padding: 0.5in;
    color: #111827;
    background: white;
    font-size: 14px;
    line-height: 1.5;
  }

  /* Typography */
  h1 { font-size: 1.5rem; font-weight: 700; margin: 0 0 0.25rem 0; }
  h2 { font-size: 1.25rem; font-weight: 600; margin: 0; }
  h3 { font-size: 1rem; font-weight: 600; margin: 0 0 0.75rem 0; color: #374151; }
  h4 { font-size: 0.875rem; font-weight: 600; margin: 0; }
  p { margin: 0.25rem 0; }

  /* Tables */
  table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
  th, td { border: 1px solid #d1d5db; padding: 0.5rem 0.75rem; text-align: left; }
  th { background-color: #f3f4f6; font-weight: 600; color: #374151; }
  td { color: #374151; }
  tr:nth-child(even) { background-color: #f9fafb; }
  .text-center, td.text-center, th.text-center { text-align: center; }
  .text-right, td.text-right, th.text-right { text-align: right; }

  /* Grid layouts for summary stats */
  .grid { display: grid; gap: 0.75rem; }
  .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
  .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
  .grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
  .grid-cols-5 { grid-template-columns: repeat(5, 1fr); }
  .grid-cols-6 { grid-template-columns: repeat(6, 1fr); }

  /* Flexbox */
  .flex { display: flex; }
  .flex-wrap { flex-wrap: wrap; }
  .items-center { align-items: center; }
  .justify-between { justify-content: space-between; }
  .gap-1 { gap: 0.25rem; }
  .gap-2 { gap: 0.5rem; }
  .gap-3 { gap: 0.75rem; }
  .gap-4 { gap: 1rem; }

  /* Spacing */
  .p-2 { padding: 0.5rem; }
  .p-3 { padding: 0.75rem; }
  .p-4 { padding: 1rem; }
  .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
  .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
  .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
  .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
  .mb-1 { margin-bottom: 0.25rem; }
  .mb-2 { margin-bottom: 0.5rem; }
  .mb-3 { margin-bottom: 0.75rem; }
  .mb-4 { margin-bottom: 1rem; }
  .mb-6 { margin-bottom: 1.5rem; }
  .mt-1 { margin-top: 0.25rem; }
  .mt-2 { margin-top: 0.5rem; }
  .mt-4 { margin-top: 1rem; }
  .mt-6 { margin-top: 1.5rem; }
  .ml-1 { margin-left: 0.25rem; }
  .ml-2 { margin-left: 0.5rem; }
  .pt-4 { padding-top: 1rem; }

  /* Borders */
  .border { border: 1px solid #e5e7eb; }
  .border-b { border-bottom: 1px solid #e5e7eb; }
  .border-b-2 { border-bottom: 2px solid #1f2937; }
  .border-t { border-top: 1px solid #e5e7eb; }
  .border-gray-100 { border-color: #f3f4f6; }
  .border-gray-200 { border-color: #e5e7eb; }
  .border-gray-300 { border-color: #d1d5db; }
  .border-gray-800 { border-color: #1f2937; }
  .rounded { border-radius: 0.25rem; }
  .rounded-lg { border-radius: 0.5rem; }

  /* Background colors */
  .bg-white { background-color: white; }
  .bg-gray-50 { background-color: #f9fafb; }
  .bg-gray-100 { background-color: #f3f4f6; }
  .bg-blue-50 { background-color: #eff6ff; }
  .bg-blue-100 { background-color: #dbeafe; }
  .bg-green-50 { background-color: #f0fdf4; }
  .bg-green-100 { background-color: #dcfce7; }
  .bg-yellow-50 { background-color: #fefce8; }
  .bg-yellow-100 { background-color: #fef9c3; }
  .bg-red-50 { background-color: #fef2f2; }
  .bg-red-100 { background-color: #fee2e2; }
  .bg-orange-50 { background-color: #fff7ed; }
  .bg-purple-50 { background-color: #faf5ff; }

  /* Border colors for cards */
  .border-blue-100 { border-color: #dbeafe; }
  .border-green-100 { border-color: #dcfce7; }
  .border-green-300 { border-color: #86efac; }
  .border-yellow-100 { border-color: #fef9c3; }
  .border-yellow-300 { border-color: #fde047; }
  .border-red-100 { border-color: #fee2e2; }
  .border-red-300 { border-color: #fca5a5; }
  .border-orange-100 { border-color: #ffedd5; }
  .border-purple-100 { border-color: #f3e8ff; }

  /* Text colors */
  .text-gray-400 { color: #9ca3af; }
  .text-gray-500 { color: #6b7280; }
  .text-gray-600 { color: #4b5563; }
  .text-gray-700 { color: #374151; }
  .text-gray-800 { color: #1f2937; }
  .text-gray-900 { color: #111827; }
  .text-blue-700 { color: #1d4ed8; }
  .text-green-700 { color: #15803d; }
  .text-yellow-700 { color: #a16207; }
  .text-red-700 { color: #b91c1c; }
  .text-red-800 { color: #991b1b; }
  .text-orange-700 { color: #c2410c; }
  .text-purple-700 { color: #7e22ce; }

  /* Font sizes */
  .text-xs { font-size: 0.75rem; }
  .text-sm { font-size: 0.875rem; }
  .text-lg { font-size: 1.125rem; }
  .text-xl { font-size: 1.25rem; }
  .text-2xl { font-size: 1.5rem; }

  /* Font weights */
  .font-medium { font-weight: 500; }
  .font-semibold { font-weight: 600; }
  .font-bold { font-weight: 700; }

  /* Uppercase */
  .uppercase { text-transform: uppercase; }
  .tracking-wide { letter-spacing: 0.025em; }

  /* Status badges - inline */
  .inline-block { display: inline-block; }
  span.bg-green-100, span.bg-yellow-100, span.bg-red-100, span.bg-gray-100, span.bg-blue-100 {
    padding: 0.125rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 500;
  }

  /* Legend items */
  .w-3 { width: 0.75rem; }
  .h-3 { height: 0.75rem; }

  /* Overflow hidden for table cells */
  .overflow-x-auto { overflow-x: visible; }

  /* Print-specific */
  @media print {
    body { padding: 0.25in; }
    .grid-cols-5 { grid-template-columns: repeat(5, 1fr); }
    .grid-cols-6 { grid-template-columns: repeat(6, 1fr); }
  }
`;

export function ReportViewerDialog({
  open,
  onOpenChange,
  title,
  children,
}: ReportViewerDialogProps) {
  const handlePrint = () => {
    const reportContent = document.querySelector('.report-content');
    if (!reportContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>${PRINT_STYLES}</style>
        </head>
        <body>
          ${reportContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    // Wait for content to load, then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden flex flex-col p-0 bg-white [&>button]:hidden">
        {/* Header - Hidden when printing */}
        <div className="print:hidden flex items-center justify-between p-4 border-b bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-2"
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Save as PDF
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              Close
            </Button>
          </div>
        </div>

        {/* Report Content */}
        <div className="flex-1 overflow-auto p-6 print:p-0 print:overflow-visible bg-white">
          <div className="report-content max-w-3xl mx-auto">
            {children}
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}

// Report header component for consistent styling
interface ReportHeaderProps {
  facilityName: string;
  facilityAddress?: string;
  facilityPhone?: string;
  reportTitle: string;
  dateRange?: string;
  generatedDate?: string;
}

export function ReportHeader({
  facilityName,
  facilityAddress,
  facilityPhone,
  reportTitle,
  dateRange,
  generatedDate = new Date().toLocaleString(),
}: ReportHeaderProps) {
  return (
    <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
      <h1 className="text-xl font-bold text-gray-900">{facilityName}</h1>
      {facilityAddress && <p className="text-gray-600 text-sm">{facilityAddress}</p>}
      {facilityPhone && <p className="text-gray-600 text-sm">{facilityPhone}</p>}
      <h2 className="text-lg font-semibold text-gray-800 mt-4">{reportTitle}</h2>
      {dateRange && <p className="text-gray-600 text-sm">{dateRange}</p>}
      <p className="text-gray-500 text-xs mt-2">Generated: {generatedDate}</p>
    </div>
  );
}

// Report footer component
export function ReportFooter() {
  return (
    <div className="border-t pt-4 mt-8 text-center text-xs text-gray-500">
      <p>This document contains confidential medical information.</p>
      <p>Please handle according to facility privacy policies and HIPAA regulations.</p>
      <p className="mt-1">
        Generated on {new Date().toLocaleString()}
      </p>
    </div>
  );
}

// Table component for reports
interface ReportTableProps {
  headers: string[];
  children: ReactNode;
}

export function ReportTable({ headers, children }: ReportTableProps) {
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="bg-gray-100">
          {headers.map((header, idx) => (
            <th
              key={idx}
              className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700"
            >
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}
