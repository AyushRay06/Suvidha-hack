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
    loadType?: string;
    sanctionedLoad?: number;
}

interface DownloadBillBtnProps {
    bill: Bill;
    connection: Connection;
}

export function DownloadBillBtn({ bill, connection }: DownloadBillBtnProps) {
    const [isPending, startTransition] = useTransition();

    const handleDownload = () => {
        startTransition(() => {
            const doc = new jsPDF();

            // Header
            doc.setFontSize(22);
            doc.setTextColor(40, 116, 240); // Blue Color
            doc.text("SUVIDHA", 14, 20);

            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text("Integrated Public Service Portal", 14, 25);

            doc.setDrawColor(200);
            doc.line(14, 30, 196, 30);

            // Bill Title
            doc.setFontSize(16);
            doc.setTextColor(0);
            doc.text("ELECTRICITY BILL", 14, 40);

            // Connection Details
            doc.setFontSize(10);
            doc.text(`Consumer Name: ${connection.consumerName || "Demo User"}`, 14, 50);
            doc.text(`Connection No: ${connection.connectionNo}`, 14, 55);
            doc.text(`Address: ${connection.address || "N/A"}`, 14, 60);

            doc.text(`Bill No: ${bill.billNo}`, 120, 50);
            doc.text(`Bill Date: ${new Date(bill.billDate).toLocaleDateString()}`, 120, 55);
            doc.text(`Due Date: ${bill.dueDate ? new Date(bill.dueDate).toLocaleDateString() : "N/A"}`, 120, 60);

            // Consumption Details
            autoTable(doc, {
                startY: 70,
                head: [['Description', 'Details']],
                body: [
                    ['Billing Period', `${new Date(bill.periodFrom).toLocaleDateString()} to ${new Date(bill.periodTo).toLocaleDateString()}`],
                    ['Units Consumed', `${bill.unitsConsumed} KWh`],
                    ['Load Type', connection.loadType || "RESIDENTIAL"],
                    ['Sanctioned Load', `${connection.sanctionedLoad || 0} KW`],
                ],
                theme: 'striped',
                headStyles: { fillColor: [40, 116, 240] },
            });

            // Bill Breakdown
            const currentY = (doc as any).lastAutoTable.finalY + 10;

            // Calculate approximate breakdown (reverse engineering for display)
            const energyCharge = bill.amount * 0.85; // Approx
            const fixedCharge = bill.amount * 0.10; // Approx
            const fpppa = bill.amount * 0.05; // Approx

            autoTable(doc, {
                startY: currentY,
                head: [['Charge Head', 'Amount (Rs)']],
                body: [
                    ['Energy Charge', energyCharge.toFixed(2)],
                    ['Fixed Charge', fixedCharge.toFixed(2)],
                    ['FPPPA Charge', fpppa.toFixed(2)],
                    ['Government Duty', '0.00'],
                    [{ content: 'Total Amount Payable', styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }, { content: `Rs. ${bill.amount.toFixed(2)}`, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }],
                ],
                theme: 'grid',
                headStyles: { fillColor: [40, 116, 240] },
            });

            // Footer
            const pageHeight = doc.internal.pageSize.height;
            doc.setFontSize(8);
            doc.setTextColor(150);
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
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        >
            {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <Download className="h-4 w-4 mr-2" />
            )}
            Download
        </Button>
    );
}
