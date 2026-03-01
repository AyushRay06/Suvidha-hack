/**
 * Water Tariff Service
 * Implements slab-based water tariff calculations for Assam/Guwahati region.
 */

interface TariffSlab {
    slabStart: number;
    slabEnd: number | null;
    ratePerUnit: number;
}

interface BillCalculation {
    unitsConsumed: number;
    loadType: string;
    slabBreakdown: { slab: string; units: number; rate: number; amount: number }[];
    energyCharge: number;
    fixedCharge: number;
    sewerageCharge: number;
    totalAmount: number;
}

// Tariff slabs (in Kiloliters)
const DOMESTIC_TARIFFS: TariffSlab[] = [
    { slabStart: 0, slabEnd: 10, ratePerUnit: 5 },
    { slabStart: 10, slabEnd: 20, ratePerUnit: 7 },
    { slabStart: 20, slabEnd: 30, ratePerUnit: 10 },
    { slabStart: 30, slabEnd: null, ratePerUnit: 15 },
];

const COMMERCIAL_TARIFFS: TariffSlab[] = [
    { slabStart: 0, slabEnd: 10, ratePerUnit: 15 },
    { slabStart: 10, slabEnd: 20, ratePerUnit: 20 },
    { slabStart: 20, slabEnd: 30, ratePerUnit: 25 },
    { slabStart: 30, slabEnd: null, ratePerUnit: 35 },
];

const FIXED_CHARGES: Record<string, number> = {
    DOMESTIC: 50,
    COMMERCIAL: 150,
    INDUSTRIAL: 300,
};

const SEWERAGE_RATE = 0.15; // 15% of water charges

export class WaterTariffService {
    static async calculateBill(unitsConsumed: number, loadType: string = 'DOMESTIC'): Promise<BillCalculation> {
        const tariffs = loadType === 'COMMERCIAL' ? COMMERCIAL_TARIFFS : DOMESTIC_TARIFFS;
        const fixedCharge = FIXED_CHARGES[loadType] || FIXED_CHARGES['DOMESTIC'];

        let remainingUnits = unitsConsumed;
        let energyCharge = 0;
        const slabBreakdown: BillCalculation['slabBreakdown'] = [];

        for (const slab of tariffs) {
            if (remainingUnits <= 0) break;

            const slabSize = slab.slabEnd ? slab.slabEnd - slab.slabStart : Infinity;
            const unitsInSlab = Math.min(remainingUnits, slabSize);
            const slabAmount = unitsInSlab * slab.ratePerUnit;

            energyCharge += slabAmount;
            slabBreakdown.push({
                slab: slab.slabEnd ? `${slab.slabStart}-${slab.slabEnd} kL` : `>${slab.slabStart} kL`,
                units: unitsInSlab,
                rate: slab.ratePerUnit,
                amount: slabAmount,
            });

            remainingUnits -= unitsInSlab;
        }

        const sewerageCharge = Math.round(energyCharge * SEWERAGE_RATE * 100) / 100;
        const totalAmount = Math.round((energyCharge + fixedCharge + sewerageCharge) * 100) / 100;

        return {
            unitsConsumed,
            loadType,
            slabBreakdown,
            energyCharge: Math.round(energyCharge * 100) / 100,
            fixedCharge,
            sewerageCharge,
            totalAmount,
        };
    }
}
