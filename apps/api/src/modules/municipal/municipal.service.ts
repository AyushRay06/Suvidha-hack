/**
 * Municipal Service
 * Provides property tax calculation and waste schedule generation.
 */

interface WasteScheduleDay {
    day: string;
    date: string;
    wasteType: 'DRY' | 'WET' | 'HAZARDOUS';
    timeSlot: string;
}

interface WasteSchedule {
    ward: string;
    zone: string;
    schedule: WasteScheduleDay[];
    nextCollection: WasteScheduleDay;
}

interface TaxCalculation {
    baseRate: number;
    area: number;
    baseAmount: number;
    locationFactor: number;
    typeFactor: number;
    totalAmount: number;
    dueDate: Date;
}

// Tax rates per sq ft per year
const TAX_RATES: Record<string, number> = {
    RESIDENTIAL: 2.5,
    COMMERCIAL: 8.0,
    INDUSTRIAL: 12.0,
    AGRICULTURAL: 0.5,
};

// Location multipliers
const LOCATION_FACTORS: Record<string, number> = {
    URBAN: 1.5,
    SEMI_URBAN: 1.0,
    RURAL: 0.7,
};

export class MunicipalService {
    /**
     * Calculate property tax based on area and type
     */
    static calculatePropertyTax(
        area: number,
        propertyType: string,
        location: string = 'URBAN'
    ): TaxCalculation {
        const baseRate = TAX_RATES[propertyType] || TAX_RATES['RESIDENTIAL'];
        const locationFactor = LOCATION_FACTORS[location] || 1.0;
        const typeFactor = 1.0;

        const baseAmount = area * baseRate;
        const totalAmount = Math.round(baseAmount * locationFactor * typeFactor);

        // Due date is March 31st of current financial year
        const now = new Date();
        const fyEnd = new Date(now.getMonth() >= 3 ? now.getFullYear() + 1 : now.getFullYear(), 2, 31);

        return {
            baseRate,
            area,
            baseAmount,
            locationFactor,
            typeFactor,
            totalAmount,
            dueDate: fyEnd,
        };
    }

    /**
     * Get waste collection schedule for a pincode/ward
     */
    static getWasteSchedule(pincode: string): WasteSchedule {
        // Mock schedule - in production, this would be fetched from DB
        const today = new Date();
        const schedule: WasteScheduleDay[] = [];

        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() + i);

            const dayOfWeek = date.getDay();
            let wasteType: 'DRY' | 'WET' | 'HAZARDOUS' = 'WET';

            if (dayOfWeek === 0) continue; // No collection on Sunday
            if (dayOfWeek === 1 || dayOfWeek === 4) wasteType = 'DRY';
            if (dayOfWeek === 6) wasteType = 'HAZARDOUS';

            schedule.push({
                day: date.toLocaleDateString('en-US', { weekday: 'long' }),
                date: date.toISOString().split('T')[0],
                wasteType,
                timeSlot: '7:00 AM - 9:00 AM',
            });
        }

        return {
            ward: `Ward ${parseInt(pincode.slice(-2)) % 30 + 1}`,
            zone: 'Zone A',
            schedule,
            nextCollection: schedule[0],
        };
    }

    /**
     * Get financial year string
     */
    static getFinancialYear(date: Date = new Date()): string {
        const year = date.getFullYear();
        const month = date.getMonth();

        if (month >= 3) {
            return `${year}-${(year + 1).toString().slice(-2)}`;
        } else {
            return `${year - 1}-${year.toString().slice(-2)}`;
        }
    }
}
