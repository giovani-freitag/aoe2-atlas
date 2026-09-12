import { openingState } from './hooks/use-address.ts';
import { AtlasProvider } from './providers/atlas-provider.tsx';
import { ServicesProvider } from './providers/services-provider.tsx';
import { AppShell } from './components/app-shell.tsx';

/** The application, wired and rendered, opening wherever the address asked for. */
export function App() {
    return (
        <ServicesProvider>
            <AtlasProvider initial={openingState(window.location.search)}>
                <AppShell />
            </AtlasProvider>
        </ServicesProvider>
    );
}
