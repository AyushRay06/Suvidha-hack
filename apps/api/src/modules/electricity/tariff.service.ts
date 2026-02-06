import { prisma, ServiceType } from '@suvidha/database';

export interface TariffSlab {
    slabStart: number;
    slabEnd: number | null;
    ratePerUnit: number;
}

export interface BillCalculation {
    unitsConsumed: number;
    fixedCharge: number;
    energyCharge: number;
    fpppaCharge: number; // Fuel and Power Purchase Price Adjustment
    totalAmount: number;
    slabBreakdown: Array<{
        slab: string;
        units: number;
        rate: number;
        amount: number;
    }>;
}

// Assam FPPPA charge (April 2025)
const FPPPA_CHARGE_PER_UNIT = 0.69;

export class TariffService {
    /**
     * Calculate bill amount based on consumption and tariff slabs
     */
    static async calculateBill(
        unitsConsumed: number,
        loadType: string,
        serviceType: ServiceType = ServiceType.ELECTRICITY
    ): Promise<BillCalculation> {
        // Fetch active tariffs for the load type
        const tariffs = await prisma.tariff.findMany({
            where: {
                serviceType,
                loadType,
                isActive: true,
                validFrom: { lte: new Date() },
                OR: [{ validTo: null }, { validTo: { gte: new Date() } }],
            },
            orderBy: { slabStart: 'asc' },
        });

        if (tariffs.length === 0) {
            throw new Error(`No active tariffs found for ${loadType}`);
        }

        let remainingUnits = unitsConsumed;
        let energyCharge = 0;
        const slabBreakdown: BillCalculation['slabBreakdown'] = [];
        const fixedCharge = tariffs[0].fixedCharge;

        // Calculate energy charge using slab-based pricing
        for (const tariff of tariffs) {
            if (remainingUnits <= 0) break;

            const slabSize = tariff.slabEnd
                ? tariff.slabEnd - tariff.slabStart
                : Infinity;
            const unitsInThisSlab = Math.min(remainingUnits, slabSize);

            const slabCharge = unitsInThisSlab * tariff.ratePerUnit;
            energyCharge += slabCharge;

            slabBreakdown.push({
                slab: `${tariff.slabStart}-${tariff.slabEnd || '∞'}`,
                units: unitsInThisSlab,
                rate: tariff.ratePerUnit,
                amount: slabCharge,
            });

            remainingUnits -= unitsInThisSlab;
        }

        // Calculate FPPPA charge (Fuel and Power Purchase Price Adjustment)
        const fpppaCharge = unitsConsumed * FPPPA_CHARGE_PER_UNIT;

        return {
            unitsConsumed,
            fixedCharge,
            energyCharge,
            fpppaCharge,
            totalAmount: fixedCharge + energyCharge + fpppaCharge,
            slabBreakdown,
        };
    }

    /**
     * Get all active tariffs for a service type
     */
    static async getActiveTariffs(serviceType: ServiceType = ServiceType.ELECTRICITY) {
        return prisma.tariff.findMany({
            where: {
                serviceType,
                isActive: true,
                validFrom: { lte: new Date() },
                OR: [{ validTo: null }, { validTo: { gte: new Date() } }],
            },
            orderBy: [{ loadType: 'asc' }, { slabStart: 'asc' }],
        });
    }
}
