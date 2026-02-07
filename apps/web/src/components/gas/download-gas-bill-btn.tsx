"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Bill {
    billNo: string;
    billDate: string | Date;
    periodFrom: string | Date;
    periodTo: string | Date;
    unitsConsumed: number;
    amount: number;
    dueDate?: string | Date;
    status: string;
}

interface Connection {
    connectionNo: string;
    consumerName?: string;
    address?: string;
}

interface DownloadGasBillBtnProps {
    bill: Bill;
    connection: Connection;
}

export function DownloadGasBillBtn({ bill, connection }: DownloadGasBillBtnProps) {
    const [isPending, startTransition] = useTransition();

    const handleDownload = () => {
        startTransition(() => {
            const doc = new jsPDF();

            // Header
            doc.setFontSize(22);
            doc.setTextColor(220, 38, 38); // Red Color
            doc.text("SUVIDHA", 14, 20);

            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text("Integrated Public Service Portal", 14, 25);
            doc.text("Assam Gas Company Limited (AGCL)", 14, 30);

            doc.setDrawColor(200);
            doc.line(14, 35, 196, 35);

            // Bill Title
            doc.setFontSize(16);
            doc.setTextColor(0);
            doc.text("PIPED GAS BILL", 14, 45);

            // Connection Details
            doc.setFontSize(10);
            doc.text(`Consumer Name: ${connection.consumerName || "Valued Customer"}`, 14, 55);
            doc.text(`Connection No: ${connection.connectionNo}`, 14, 60);
            doc.text(`Address: ${connection.address || "N/A"}`, 14, 65);

            doc.text(`Bill No: ${bill.billNo}`, 120, 55);
            doc.text(`Bill Date: ${new Date(bill.billDate).toLocaleDateString()}`, 120, 60);
            doc.text(`Due Date: ${bill.dueDate ? new Date(bill.dueDate).toLocaleDateString() : "N/A"}`, 120, 65);

            // Consumption Details
            const billableUnits = Math.max(bill.unitsConsumed, 5);

            autoTable(doc, {
                startY: 75,
                head: [['Description', 'Details']],
                body: [
                    ['Billing Period', `${new Date(bill.periodFrom).toLocaleDateString()} to ${new Date(bill.periodTo).toLocaleDateString()}`],
                    ['Previous Reading', 'N/A'], // Could pass if available
                    ['Current Reading', 'N/A'],
                    ['Consumption (SCM)', `${bill.unitsConsumed} SCM`],
                    ['Billable Consumption (Min 5 SCM)', `${billableUnits} SCM`],
                ],
                theme: 'striped',
                headStyles: { fillColor: [220, 38, 38] }, // Red header
            });

            // Bill Breakdown Calculation (Reverse Engineered)
            // Total = Taxable * 1.145
            const taxableAmount = bill.amount / 1.145;
            const vatAmount = bill.amount - taxableAmount;

            // Taxable = Units * Rate
            const impliedRate = taxableAmount / billableUnits;

            const currentY = (doc as any).lastAutoTable.finalY + 10;

            autoTable(doc, {
                startY: currentY,
                head: [['Charge Head', 'Calculation', 'Amount (Rs)']],
                body: [
                    ['Gas Distribution Charge', `${billableUnits} SCM x ₹${(impliedRate - 0.20).toFixed(2)}`, (billableUnits * (impliedRate - 0.20)).toFixed(2)],
                    ['Marketing Margin', `${billableUnits} SCM x ₹0.20`, (billableUnits * 0.20).toFixed(2)],
                    ['Sub Total (Taxable)', '', taxableAmount.toFixed(2)],
                    ['VAT (14.5%)', '14.5% on Sub Total', vatAmount.toFixed(2)],
                    [{ content: 'Total Amount Payable', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [255, 240, 240] } }, { content: `Rs. ${bill.amount.toFixed(2)}`, styles: { fontStyle: 'bold', fillColor: [255, 240, 240] } }],
                ],
                theme: 'grid',
                headStyles: { fillColor: [220, 38, 38] }, // Red header
            });

            // Footer
            const pageHeight = doc.internal.pageSize.height;
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text("Tariff: Base ₹15.80 (Escalated 5%/yr) + VAT 14.5%", 14, pageHeight - 15);
            doc.text("Computed by automated system. This is a computer generated invoice.", 14, pageHeight - 10);

            doc.save(`${bill.billNo}.pdf`);
        });
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            disabled={isPending}
            className="text-gas hover:text-red-700 hover:bg-red-50 p-2 h-8 w-8 rounded-full"
            title="Download Bill"
        >
            {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <Download className="h-4 w-4" />
            )}
        </Button>
    );
}
