"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from "recharts";
import { TrendingUp, TrendingDown, Flame, Info } from "lucide-react";

interface Bill {
    billNo: string;
    periodTo: string | Date;
    unitsConsumed: number;
    amount: number;
}

interface GasConsumptionChartProps {
    bills: Bill[];
}

export function GasConsumptionChart({ bills }: GasConsumptionChartProps) {
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
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gas-light rounded-lg flex items-center justify-center">
                        <Flame className="w-5 h-5 text-gas" />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900">Monthly Consumption</h4>
                        <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Units in SCM (Standard Cubic Meters)</p>
                    </div>
                </div>
                {data.length >= 2 && (
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${trend <= 0 ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-700 border-red-100"
                        }`}>
                        {trend <= 0 ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
                        {Math.abs(trend).toFixed(1)}% <span className="opacity-70 font-medium">vs last month</span>
                    </div>
                )}
            </div>

            <div className="h-[220px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="name"
                            fontSize={11}
                            fontWeight={600}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: '#64748b' }}
                            dy={10}
                        />
                        <YAxis
                            fontSize={11}
                            fontWeight={600}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: '#64748b' }}
                            tickFormatter={(v) => `${v}`}
                        />
                        <Tooltip
                            cursor={{ fill: '#f8fafc' }}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="bg-white p-3 rounded-xl shadow-xl border border-slate-100 animate-in fade-in zoom-in duration-200">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{payload[0].payload.date}</p>
                                            <div className="flex items-center gap-4">
                                                <div>
                                                    <p className="text-xs text-slate-500 font-medium">Consumption</p>
                                                    <p className="text-lg font-black text-slate-900">{payload[0].value} <span className="text-xs font-bold text-slate-400">SCM</span></p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Bar
                            dataKey="units"
                            radius={[6, 6, 0, 0]}
                            barSize={32}
                            animationDuration={1500}
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.units > averageConsumption ? '#ef4444' : '#fca5a5'} // Solid red for above avg, Light red for below
                                    className="transition-all duration-300 hover:opacity-80"
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="flex items-center gap-2 pt-2 text-[10px] text-slate-400 font-medium italic">
                <Info className="w-3 h-3" />
                <span>Consumption higher than average is highlighted in solid red</span>
            </div>
        </div>
    );
}
