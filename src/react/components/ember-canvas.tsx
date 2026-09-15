import { useEmberField, type EmberFieldOptions } from '@/react/hooks/dom/use-ember-field.ts';

export interface EmberCanvasProps extends EmberFieldOptions {
    className?: string;
}

/** The canvas the embers drift across, sized by whatever box it is dropped into. */
export function EmberCanvas({ className, ...options }: EmberCanvasProps) {
    const canvas = useEmberField(options);

    return <canvas className={className} ref={canvas} aria-hidden="true" />;
}
