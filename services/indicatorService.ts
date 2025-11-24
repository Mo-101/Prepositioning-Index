import { Hazard, EpidemiologicalSummary, ReplenishmentReport, Country } from '../types';
import { generateAiScenario } from './supplyChainService';

const POPULATION_DATA: Record<string, number> = {
    NGA: 219463862,
    COD: 95320411,
    SLE: 8605718,
    SOM: 17709000,
    SSD: 11381218,
    ETH: 123379924,
    MWI: 20931752,
    ZWE: 16320537,
    YEM: 33696614,
};

const CASE_FATALITY_RATIOS: Partial<Record<Hazard, number>> = {
    cholera: 1.2,
    ebola: 48.5,
    mpox: 3.7,
    lassa: 19.0,
    diphtheria: 7.5,
};

const CONFIRMED_CASE_RATIOS: Partial<Record<Hazard, number>> = {
    cholera: 0.68,
    ebola: 0.82,
    mpox: 0.74,
    lassa: 0.65,
    diphtheria: 0.7,
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const fetchPopulation = async (countryIso: string): Promise<number | null> => {
    await delay(120);
    return POPULATION_DATA[countryIso] ?? null;
};

export const buildEpidemiologicalSummary = (
    country: Country | null,
    hazard: Hazard,
    report: ReplenishmentReport | null
): EpidemiologicalSummary | null => {
    if (!country) return null;

    const scenario = generateAiScenario(country, hazard);

    const totalCases = report?.scenario_summary.projected_cases
        ?? Math.round(country.population * (scenario.attack_rate_percent / 100));

    const severeCases = report?.scenario_summary.severe_cases
        ?? Math.round(totalCases * (scenario.severity_ratio_severe_percent / 100));

    const mildCases = Math.max(totalCases - severeCases, 0);

    const caseFatalityRatio = CASE_FATALITY_RATIOS[hazard] ?? 5.0;
    const confirmedRatio = CONFIRMED_CASE_RATIOS[hazard] ?? 0.7;

    const confirmedCases = Math.round(totalCases * confirmedRatio);

    return {
        attack_rate_percent: scenario.attack_rate_percent,
        case_fatality_ratio_percent: caseFatalityRatio,
        confirmed_cases: confirmedCases,
        total_cases: totalCases,
        severe_cases: severeCases,
        mild_cases: mildCases,
    };
};
