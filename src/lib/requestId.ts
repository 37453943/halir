export function generateRequestId() {
    // Use crypto.randomUUID if available (Node 18+), otherwise fallback to timestamp+random
    try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            // @ts-ignore
            return crypto.randomUUID();
        }
    } catch (e) {
        // ignore
    }
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}
