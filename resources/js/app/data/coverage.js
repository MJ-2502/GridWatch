const municipalityFiles = import.meta.glob(
    "../../../Soreco_Coverage_Geojson/*/*.geojson",
    { eager: true, query: "?json", import: "default" },
);
const barangayFiles = import.meta.glob(
    "../../../Soreco_Coverage_Geojson/*/*/*.geojson",
    { eager: true, query: "?json", import: "default" },
);

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

export function featuresFor(files, scope, municipality = "") {
    return Object.entries(files)
        .filter(([path]) =>
            scope.folders.some((folder) => path.includes(`/${folder}/`)),
        )
        .map(([, data]) => data.features?.[0])
        .filter(Boolean)
        .filter(
            (feature) =>
                !municipality ||
                municipalityKey(feature.properties?.ADM3_EN) ===
                    municipalityKey(municipality),
        );
}

export function municipalityFeatures(scope, municipality) {
    return featuresFor(municipalityFiles, scope, municipality);
}

export function barangayFeatures(scope, municipality) {
    return featuresFor(barangayFiles, scope, municipality);
}

export function municipalityNames(scope) {
    return [
        ...new Set(
            municipalityFeatures(scope)
                .map((feature) => feature.properties?.ADM3_EN)
                .filter(Boolean),
        ),
    ];
}
