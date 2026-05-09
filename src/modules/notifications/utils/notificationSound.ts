/**
 * Beep corto para indicar nueva notificación. Usa Web Audio API en lugar de
 * un asset MP3: sin red, sin assets, sin licencias. Dos tonos rápidos
 * (ascendente) que duran ~250ms en total.
 *
 * Los navegadores móviles/desktop bloquean audio antes de la primera
 * interacción del usuario. Aquí cacheamos el AudioContext y lo reanudamos
 * cuando el navegador lo permita; si no se puede, simplemente no suena.
 */

let audioContext: AudioContext | null = null

function getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (audioContext) return audioContext
    const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext | undefined
    if (!Ctx) return null
    try {
        audioContext = new Ctx()
        return audioContext
    } catch {
        return null
    }
}

export function playNotificationBeep(): void {
    const ctx = getContext()
    if (!ctx) return

    // Reanudar si el navegador lo suspendió (autoplay policy)
    if (ctx.state === 'suspended') {
        void ctx.resume().catch(() => {})
    }

    const now = ctx.currentTime
    const tones: Array<{ freq: number; start: number; dur: number }> = [
        { freq: 880,  start: now,         dur: 0.10 },
        { freq: 1320, start: now + 0.12,  dur: 0.13 },
    ]

    for (const t of tones) {
        const osc  = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(t.freq, t.start)

        // Envelope suave: ataque corto, decaimiento natural.
        gain.gain.setValueAtTime(0.0001, t.start)
        gain.gain.exponentialRampToValueAtTime(0.20, t.start + 0.01)
        gain.gain.exponentialRampToValueAtTime(0.0001, t.start + t.dur)

        osc.connect(gain).connect(ctx.destination)
        osc.start(t.start)
        osc.stop(t.start + t.dur + 0.02)
    }
}
