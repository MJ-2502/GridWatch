import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';

function geoJsonLoader() {
    return {
        name: 'geojson-loader',
        transform(source, id) {
            if (!id.split('?')[0].endsWith('.geojson')) {
                return null;
            }

            return `export default ${JSON.stringify(JSON.parse(source))}`;
        },
    };
}

export default defineConfig({
    plugins: [
        geoJsonLoader(),
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.jsx'],
            refresh: true,
        }),
        tailwindcss(),
    ],
    server: {
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
});
