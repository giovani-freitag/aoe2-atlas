import { AtlasProvider } from './providers/atlas-provider.tsx';
import { ServicesProvider } from './providers/services-provider.tsx';
import { AppShell } from './components/app-shell.tsx';

/** The application, wired and rendered. */
export function App() {
    return (
        <ServicesProvider>
            <AtlasProvider>
                <AppShell />
            </AtlasProvider>
        </ServicesProvider>
    );
}
