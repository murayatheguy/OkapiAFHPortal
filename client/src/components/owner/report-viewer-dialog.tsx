import { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Printer, Download } from "lucide-react";

interface ReportViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
}

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
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              padding: 0.5in;
              color: black;
              background: white;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 1rem 0;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f5f5f5;
            }
            h1, h2, h3 {
              margin-top: 1rem;
            }
            .text-red-600 { color: #dc2626; }
            .text-green-600 { color: #16a34a; }
            .text-amber-600 { color: #d97706; }
            .text-blue-600 { color: #2563eb; }
            .bg-red-100 { background-color: #fee2e2; padding: 8px; border-radius: 4px; }
            .bg-amber-50 { background-color: #fffbeb; }
            @media print {
              body { padding: 0; }
            }
          </style>
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
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden flex flex-col p-0 bg-white">
        {/* Header - Hidden when printing */}
        <div className="print:hidden flex items-center justify-between p-4 border-b bg-stone-100">
          <h2 className="text-lg font-semibold text-stone-800">{title}</h2>
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
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
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
