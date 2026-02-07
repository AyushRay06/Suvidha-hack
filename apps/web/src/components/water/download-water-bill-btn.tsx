"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface DownloadWaterBillBtnProps {
    billNo: string;
    amount: number;
    unitsConsumed: number;
    connectionId: string;
}

export function DownloadWaterBillBtn({
    billNo,
    amount,
    unitsConsumed,
    connectionId,
}: DownloadWaterBillBtnProps) {
    const [loading, setLoading] = useState(false);

    const handleDownload = async () => {
        setLoading(true);

        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();

            // Header
            doc.setFillColor(14, 165, 233); // water blue
            doc.rect(0, 0, pageWidth, 40, "F");

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(20);
            doc.setFont("helvetica", "bold");
            doc.text("SUVIDHA WATER BILL", pageWidth / 2, 20, { align: "center" });

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text("Guwahati Jal Board", pageWidth / 2, 30, { align: "center" });

            // Bill Details
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text("Bill Details", 14, 55);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.text(`Bill No: ${billNo}`, 14, 65);
            doc.text(`Bill Date: ${new Date().toLocaleDateString('en-IN')}`, 14, 72);
            doc.text(`Due Date: ${new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN')}`, 14, 79);

            doc.text(`Connection ID: ${connectionId.slice(0, 12)}...`, pageWidth / 2 + 14, 65);
            doc.text(`Units Consumed: ${unitsConsumed} kL`, pageWidth / 2 + 14, 72);

            // Charges Table
            autoTable(doc, {
                startY: 90,
                head: [["Description", "Amount (₹)"]],
                body: [
                    ["Water Charges", (amount * 0.7).toFixed(2)],
                    ["Fixed Charges", "50.00"],
                    ["Sewerage Charges (15%)", (amount * 0.15).toFixed(2)],
                    ["Total Amount", amount.toFixed(2)],
                ],
                theme: "striped",
                headStyles: { fillColor: [14, 165, 233] },
                footStyles: { fontStyle: "bold" },
            });

            // Payment Instructions
            const finalY = (doc as any).lastAutoTable.finalY || 130;
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text("Payment Instructions:", 14, finalY + 15);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.text("• Pay online via Suvidha Kiosk or mobile app", 14, finalY + 25);
            doc.text("• Late payment incurs 2% penalty per month", 14, finalY + 32);
            doc.text("• For queries: 1800-XXX-XXXX (Toll Free)", 14, finalY + 39);

            // Footer
            doc.setFillColor(240, 240, 240);
            doc.rect(0, 280, pageWidth, 17, "F");
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.text("This is a computer-generated bill and does not require a signature.", pageWidth / 2, 288, { align: "center" });

            // Save
            doc.save(`Water_Bill_${billNo}.pdf`);
        } catch (error) {
            console.error("Failed to generate PDF:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            onClick={handleDownload}
            disabled={loading}
            variant="cta"
            className="w-full"
        >
            {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
                <Download className="w-4 h-4 mr-2" />
            )}
            Download Bill
        </Button>
    );
}
