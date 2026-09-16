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

// NEW: Smarter async function to fetch Barangays ONLY when needed
export async function loadBarangayFeatures(scope, municipality) {
    if (!municipality) return []; 

    const features = [];
    const targetMunKey = municipalityKey(municipality);

    // 1. FILTER FIRST: Look at the file paths and only keep the ones that match our municipality folder
    const relevantLoaders = Object.entries(barangayLoaders).filter(([path]) => {
        // Must belong to the current scope (e.g., Soreco_1)
        if (!scope.folders.some((folder) => path.includes(`/${folder}/`))) return false;

        // Extract the folder name from the path.
        // Paths look like: "../../../Soreco_Coverage_Geojson/Soreco_1/Bulan Brgy/Barangay_Name.geojson"
        const pathParts = path.split('/');
        const folderName = pathParts[pathParts.length - 2]; 

        // Strip the word "Brgy" (case-insensitive) out of the folder name so it matches the municipality name
        const cleanFolderName = folderName.replace(/brgy/i, "").trim();

        // Now "Bulan Brgy" becomes "Bulan", which matches targetMunKey perfectly!
        return municipalityKey(cleanFolderName) === targetMunKey;
    });

    // 2. FETCH SECOND: Now we only trigger network requests for the exact files we need
    const loadPromises = relevantLoaders.map(async ([path, loader]) => {
        try {
            const raw = await loader(); // Only the files inside the specific "[Municipality] Brgy" folder will trigger
            const data = JSON.parse(raw);
            const feature = data?.features?.[0];
            
            if (feature) {
                features.push(feature);
            }
        } catch (error) {
            console.error(`Failed to load GeoJSON at ${path}`, error);
        }
    });

    await Promise.all(loadPromises);
    return features;
}