// 1. EAGER load municipalities - needed immediately for the initial view
const rawMunicipalityFiles = import.meta.glob(
    "../../../Soreco_Coverage_Geojson/*/*.geojson",
    { eager: true, query: "?raw", import: "default" },
);

// 2. LAZY load barangays - returns functions to load files instead of the files themselves
const barangayLoaders = import.meta.glob(
    "../../../Soreco_Coverage_Geojson/*/*/*.geojson",
    { query: "?raw", import: "default" },
);

function parseGeojsonFiles(rawFiles) {
    return Object.fromEntries(
        Object.entries(rawFiles).map(([path, raw]) => {
            try {
                return [path, JSON.parse(raw)];
            } catch (error) {
                console.error(`Failed to parse GeoJSON: ${path}`, error);
                return [path, null];
            }
        }),
    );
}

// Only parse municipalities synchronously now
const municipalityFiles = parseGeojsonFiles(rawMunicipalityFiles);

export const scopes = {
    soreco1: { label: "SORECO 1", color: "#ff7900", folders: ["Soreco_1"] },
    soreco2: { label: "SORECO 2", color: "#18aeea", folders: ["Soreco_2"] },
};

export function municipalityKey(value = "") {
    return String(value ?? "")
        .toLowerCase()
        .replace(/\(capital\)/g, "")
        .replace(/\bsta\.?\b/g, "santa")
        .replace(/[^a-z0-9]/g, "");
}

// Keep the original featuresFor function
export function featuresFor(files, scope, municipality = "") {
    return Object.entries(files)
        .filter(([path]) =>
            scope.folders.some((folder) => path.includes(`/${folder}/`)),
        )
        .map(([, data]) => data?.features?.[0])
        .filter(Boolean)
        .filter(
            (feature) =>
                !municipality ||
                municipalityKey(feature.properties?.ADM3_EN) ===
                    municipalityKey(municipality),
        );
}

// The export your dashboard was missing!
export function municipalityFeatures(scope, municipality) {
    return featuresFor(municipalityFiles, scope, municipality);
}

// Keep the original municipalityNames function
export function municipalityNames(scope) {
    return [
        ...new Set(
            municipalityFeatures(scope)
                .map((feature) => feature.properties?.ADM3_EN)
                .filter(Boolean),
        ),
    ];
}

export async function loadBarangayFeatures(scope, municipality) {
    if (!municipality) return [];
    
    const features = [];
    
    // Loop through your original, perfect files
    for (const [path, loader] of Object.entries(barangayLoaders)) {
        // Only load files that match the current Scope and Municipality
        const matchesScope = scope.folders.some((folder) => path.includes(`/${folder}/`));
        
        // Ensure we only grab files inside the clicked municipality's folder
        const cleanMuni = municipalityKey(municipality);
        const matchesMuni = municipalityKey(path).includes(cleanMuni);

        if (matchesScope && matchesMuni) {
            try {
                // Load and parse the original file on demand
                const rawJson = await loader();
                const data = typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson;
                
                if (data && data.features) {
                    features.push(...data.features);
                }
            } catch (error) {
                console.error(`Failed to load original file at ${path}`, error);
            }
        }
    }
    
    return features;
}