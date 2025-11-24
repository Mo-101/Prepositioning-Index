import { Hazard, OutbreakStat } from '../types';
import { getCountries, generateMockData } from './dataService';

const DEFAULT_OUTBREAK_API = 'https://disease.sh/v3/covid-19/countries';

declare global {
    interface ImportMeta {
        readonly env: Record<string, string | undefined>;
    }
}

interface ExternalOutbreakResponse {
    country: string;
    countryInfo?: {
        iso2?: string;
        iso3?: string;
        lat?: number;
        long?: number;
    };
    cases?: number;
    deaths?: number;
    recovered?: number;
    active?: number;
    population?: number;
    updated?: number;
}

const hazardLabel: Record<Hazard, string> = {
    cholera: 'Cholera',
    ebola: 'Ebola',
    mpox: 'Mpox',
    lassa: 'Lassa Fever',
    diphtheria: 'Diphtheria',
};

const normalizeIso = (entry: ExternalOutbreakResponse): string | null => {
    if (entry.countryInfo?.iso3) return entry.countryInfo.iso3.toUpperCase();
    if (entry.countryInfo?.iso2) return entry.countryInfo.iso2.toUpperCase();
    return entry.country?.slice(0, 3).toUpperCase() ?? null;
};

export const fetchOutbreakStats = async (hazard: Hazard): Promise<OutbreakStat[]> => {
    const apiBase = import.meta.env?.VITE_OUTBREAK_API_BASE ?? DEFAULT_OUTBREAK_API;
    const apiKey = import.meta.env?.VITE_OUTBREAK_API_KEY;
    try {
        const response = await fetch(apiBase, {
            headers: apiKey
                ? {
                      Authorization: `Bearer ${apiKey}`,
                  }
                : undefined,
        });

        if (!response.ok) {
            throw new Error(`Outbreak API responded with ${response.status}`);
        }

        const raw: ExternalOutbreakResponse[] = await response.json();
        const countries = getCountries();
        const lookup = new Map(countries.map((country) => [country.iso, country]));

        return raw
            .map<OutbreakStat | null>((entry) => {
                const iso = normalizeIso(entry);
                if (!iso) return null;
                const country = lookup.get(iso) || lookup.get(iso.slice(0, 3));
                const population = country?.population ?? entry.population ?? null;
                const confirmed = entry.cases ?? 0;
                const deaths = entry.deaths ?? 0;
                const incidencePer100k = population && population > 0 ? (confirmed / population) * 100_000 : 0;

                return {
                    iso,
                    country: country?.name ?? entry.country ?? iso,
                    hazard,
                    confirmed,
                    deaths,
                    recovered: entry.recovered ?? undefined,
                    active: entry.active ?? undefined,
                    incidencePer100k,
                    cfr: confirmed > 0 ? (deaths / confirmed) * 100 : 0,
                    lastUpdated: entry.updated ? new Date(entry.updated).toISOString() : new Date().toISOString(),
                } as OutbreakStat;
            })
            .filter((item): item is OutbreakStat => item !== null)
            .sort((a, b) => (b?.incidencePer100k ?? 0) - (a?.incidencePer100k ?? 0));
    } catch (error) {
        console.warn('Falling back to synthetic outbreak data', error);
        return buildSyntheticOutbreakStats(hazard);
    }
};

const buildSyntheticOutbreakStats = (hazard: Hazard): OutbreakStat[] => {
    const { outbreakData } = generateMockData();
    const countries = getCountries();
    const hazardKey = hazardLabel[hazard].toLowerCase();

    return countries
        .map((country) => {
            const countryEvents = outbreakData.filter(
                (entry) => entry.country_iso === country.iso && entry.disease.toLowerCase() === hazardKey,
            );
            const confirmed = countryEvents.reduce((sum, event) => sum + event.cases, 0);
            const deaths = Math.round(confirmed * 0.02);
            return {
                iso: country.iso,
                country: country.name,
                hazard,
                confirmed,
                deaths,
                incidencePer100k: country.population ? (confirmed / country.population) * 100_000 : 0,
                cfr: confirmed > 0 ? (deaths / confirmed) * 100 : 0,
                lastUpdated: new Date().toISOString(),
            } satisfies OutbreakStat;
        })
        .filter((stat) => stat.confirmed > 0)
        .sort((a, b) => b.confirmed - a.confirmed);
};

export const describeHazard = (hazard: Hazard): string => hazardLabel[hazard] ?? hazard;
