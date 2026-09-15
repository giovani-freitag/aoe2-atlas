import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import manifest from './package.json' with { type: 'json' };

export default defineConfig({
    base: './',
    // The footer of the interface names the running version and links back to where it came from.
    define: {
        __APP_VERSION__: JSON.stringify(manifest.version),
        __APP_REPOSITORY__: JSON.stringify(manifest.repository.url),
    },
    plugins: [react()],
    server: {
        // Bind to every interface so the dev server can be opened from a phone on the same network.
        host: true,
        port: 5174,
        strictPort: true,
        // Vite rejects a request whose Host header it does not know; these are the tunnels used
        // to put the dev server in front of someone who is not on this machine.
        allowedHosts: [
            '.serveo.net',
            '.serveousercontent.com',
            '.localhost.run',
            '.lhr.life',
            '.trycloudflare.com',
            '.ngrok-free.app',
        ],
    },
    // Showing the atlas to someone elsewhere goes through the preview server: one bundle over a
    // tunnel beats the two thousand separate module requests dev mode would send down the same
    // SSH connection. Both servers list the tunnel hosts because Vite rejects an unknown Host.
    preview: {
        host: true,
        port: 5174,
        strictPort: true,
        allowedHosts: [
            '.serveo.net',
            '.serveousercontent.com',
            '.localhost.run',
            '.lhr.life',
            '.trycloudflare.com',
            '.ngrok-free.app',
        ],
    },
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    build: {
        target: 'es2022',
        cssCodeSplit: true,
        reportCompressedSize: false,
        // The coastline and the fifty-six borders are the bundle; splitting them out would only
        // trade one download for two and put a loading state in front of the map.
        chunkSizeWarningLimit: 900,
        rollupOptions: {
            output: {
                manualChunks(id: string) {
                    if (!id.includes('node_modules')) return undefined;

                    if (/node_modules[\\/]react(-dom)?[\\/]/.test(id)) return 'v-react';
                    if (/node_modules[\\/]d3-/.test(id)) return 'v-d3';
                    if (/i18next/.test(id)) return 'v-i18n';
                    if (/lucide/.test(id)) return 'v-lucide';
                    if (/radix|floating-ui|aria-hidden|react-remove-scroll|react-style-singleton/.test(id)) {
                        return 'v-radix';
                    }

                    return 'v-outros';
                },
            },
        },
    },
});
