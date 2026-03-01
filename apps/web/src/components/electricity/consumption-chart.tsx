"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, TrendingDown, Zap } from "lucide-react";

interface Bill {
    billNo: string;
    periodTo: string | Date;
    unitsConsumed: number;
    amount: number;
}

interface ConsumptionChartProps {
    bills: Bill[];
}

export function ConsumptionChart({ bills }: ConsumptionChartProps) {
    if (!bills || bills.length === 0) return null;

    // Process data for chart - sort by date ascending and take last 6
    const data = [...bills]
        .sort((a, b) => new Date(a.periodTo).getTime() - new Date(b.periodTo).getTime())
        .slice(-6)
        .map(bill => ({
            name: new Date(bill.periodTo).toLocaleDateString('en-US', { month: 'short' }),
            units: bill.unitsConsumed,
            amount: bill.amount,
            date: new Date(bill.periodTo).toLocaleDateString()
        }));

    // Calculate trend
    let trend = 0;
    if (data.length >= 2) {
        const last = data[data.length - 1].units;
        const prev = data[data.length - 2].units;
        trend = ((last - prev) / prev) * 100;
    }

    const averageConsumption = data.reduce((acc, curr) => acc + curr.units, 0) / data.length;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-yellow-500" />
                            Consumption History
                        </CardTitle>
                        <CardDescription>
                            Your electricity usage over the last {data.length} bills
                        </CardDescription>
                    </div>
                    {data.length >= 2 && (
                        <div className={`flex items-center gap-1 text-sm font-medium px-3 py-1 rounded-full ${trend <= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                            }`}>
                            {trend <= 0 ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                            {Math.abs(trend).toFixed(1)}% vs last month
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <XAxis
                                dataKey="name"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value}`}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                cursor={{ fill: 'transparent' }}
                                formatter={(value: any) => [`${value} Units`, 'Consumption']}
                            />
                            <Bar dataKey="units" radius={[4, 4, 0, 0]}>
                                {data.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.units > averageConsumption * 1.2 ? '#f87171' : '#3b82f6'}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
