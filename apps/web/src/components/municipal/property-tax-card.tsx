"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, IndianRupee, Calendar, Ruler } from "lucide-react";
import Link from "next/link";

interface PropertyTaxCardProps {
    property: {
        id: string;
        propertyId: string;
        propertyType: string;
        address: string;
        ward: string;
        area: number;
        taxRecords: {
            financialYear: string;
            totalAmount: number;
            amountPaid: number;
            status: string;
            dueDate: string;
        }[];
    };
}

export function PropertyTaxCard({ property }: PropertyTaxCardProps) {
    const latestTax = property.taxRecords[0];
    const isPaid = latestTax?.status === 'PAID';
    const pendingAmount = latestTax ? latestTax.totalAmount - latestTax.amountPaid : 0;

    return (
        <Card className="border-2 hover:border-municipal-light transition-colors">
            <CardContent className="p-4">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-municipal-light rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-6 h-6 text-municipal" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                            <p className="font-medium text-primary">
                                {property.propertyId}
                            </p>
                            <Badge variant={isPaid ? "default" : "secondary"}>
                                {property.propertyType}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                            <MapPin className="w-3 h-3" />
                            {property.address}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <Ruler className="w-3 h-3" />
                                {property.area} sq ft
                            </div>
                            {property.ward && (
                                <div>Ward: {property.ward}</div>
                            )}
                        </div>

                        {latestTax && (
                            <div className="mt-4 pt-4 border-t">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            Tax {latestTax.financialYear}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-lg text-primary">
                                                ₹{latestTax.totalAmount.toLocaleString()}
                                            </span>
                                            {!isPaid && pendingAmount > 0 && (
                                                <Badge variant="destructive" className="text-xs">
                                                    ₹{pendingAmount.toLocaleString()} due
                                                </Badge>
                                            )}
                                            {isPaid && (
                                                <Badge variant="default" className="text-xs bg-green-500">
                                                    Paid
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    {!isPaid && (
                                        <Link href={`/services/municipal/tax/${property.id}`}>
                                            <Button size="sm" variant="cta">
                                                <IndianRupee className="w-4 h-4 mr-1" />
                                                Pay Now
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                                    <Calendar className="w-3 h-3" />
                                    Due: {new Date(latestTax.dueDate).toLocaleDateString()}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
