<template>
    <nav
        v-if="currentIndex !== -1"
        aria-label="Progreso del registro de admisión"
        class="bg-white border border-slate-200 rounded-xl shadow-sm p-3 sm:p-4 print:hidden max-w-4xl"
    >
        <!-- Cabecera: paso actual + navegación -->
        <div class="flex items-center justify-between gap-3 mb-3">
            <p class="text-xs font-semibold text-slate-600">
                Paso <span class="text-blue-600">{{ currentIndex + 1 }}</span> de {{ steps.length }}
                <span class="text-slate-400 font-normal">— {{ steps[currentIndex].label }}</span>
            </p>
            <div class="flex items-center gap-2 shrink-0">
                <button
                    type="button"
                    :disabled="currentIndex === 0"
                    class="inline-flex w-[6.5rem] items-center justify-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    @click="go(currentIndex - 1)"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-4 w-4 shrink-0">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                    Anterior
                </button>
                <button
                    type="button"
                    :disabled="currentIndex === steps.length - 1 || isLocked(currentIndex + 1)"
                    :title="isLocked(currentIndex + 1) ? lockReason(currentIndex + 1) : undefined"
                    class="inline-flex w-[6.5rem] items-center justify-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
                    @click="go(currentIndex + 1)"
                >
                    Siguiente
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-4 w-4 shrink-0">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                </button>
            </div>
        </div>

        <!-- Línea de progreso en CSS Grid: columnas 'auto' para los círculos y
             'minmax(0,1fr)' para los conectores → todos los tramos iguales. -->
        <ol class="grid items-center gap-x-1" :style="{ gridTemplateColumns: gridCols }">
            <template v-for="(s, i) in steps" :key="s.name">
                <li class="contents">
                    <button
                        type="button"
                        :disabled="isLocked(i)"
                        :aria-label="isLocked(i) ? `Paso ${i + 1} bloqueado: ${lockReason(i)}` : `Ir al paso ${i + 1}: ${s.label}`"
                        :aria-current="i === currentIndex ? 'step' : undefined"
                        :title="isLocked(i) ? lockReason(i) : s.label"
                        class="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold transition focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400 disabled:cursor-not-allowed"
                        :class="circleClass(i)"
                        @click="go(i)"
                    >
                        <!-- candado en pasos bloqueados -->
                        <svg v-if="isLocked(i)" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-3.5 w-3.5">
                            <path fill-rule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clip-rule="evenodd" />
                        </svg>
                        <!-- check en pasos completados -->
                        <svg v-else-if="i < currentIndex" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="h-3.5 w-3.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        <template v-else>{{ i + 1 }}</template>
                    </button>
                    <!-- conector: ocupa la columna 1fr completa -->
                    <span
                        v-if="i < steps.length - 1"
                        aria-hidden="true"
                        class="h-0.5 w-full rounded-full"
                        :class="i < currentIndex && !isLocked(i + 1) ? 'bg-emerald-400' : 'bg-slate-200'"
                    />
                </li>
            </template>
        </ol>
    </nav>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'

/**
 * Indicador de progreso del portal del aspirante (10 pasos) con GATING.
 *
 * Estados del aspirante: PROSPECTO=2, PREFICHA=3, FICHA=4, ...
 * Desbloqueo por paso:
 *  - 1..6 (expediente): siempre.
 *  - 7 Preficha:   estado >= PREFICHA (3) — el expediente debe estar completo.
 *  - 8 Documentos: estado >= FICHA (4).
 *  - 9 Ficha:      todos los documentos requeridos en estado 'approved'.
 *  - 10 Examen:    igual que el 9 (documentos aprobados).
 *
 * Además de mostrar el candado y deshabilitar la navegación, si el aspirante
 * cae (por URL directa) en un paso bloqueado, se le redirige al último paso
 * disponible.
 */

interface Step { name: string; label: string }

const STATUS_PREFICHA = 3
const STATUS_FICHA    = 4

const steps: Step[] = [
    { name: 'admissions.portal.personal',     label: 'General' },
    { name: 'admissions.portal.ext-personal', label: 'Datos personales' },
    { name: 'admissions.portal.estudios',     label: 'Estudios' },
    { name: 'admissions.portal.contactos',    label: 'Contactos' },
    { name: 'admissions.portal.preventivos',  label: 'Preventivos' },
    { name: 'admissions.portal.otros',        label: 'Otros datos' },
    { name: 'admissions.portal.inscripcion',  label: 'Preficha' },
    { name: 'admissions.portal.documentos',   label: 'Documentos' },
    { name: 'admissions.portal.ficha',        label: 'Ficha' },
    { name: 'admissions.portal.examen',       label: 'Examen' },
]

const route  = useRoute()
const router = useRouter()

const status       = ref(0)
const docsApproved = ref(false)
const loaded       = ref(false)

const currentIndex = computed(() => steps.findIndex(s => s.name === route.name))

// Columnas del grid: 'auto' por círculo + 'minmax(0,1fr)' por conector.
const gridCols = computed(() => 'auto' + ' minmax(0, 1fr) auto'.repeat(steps.length - 1))

/** ¿El paso (0-based) está bloqueado según el avance del aspirante? */
function isLocked(i: number): boolean {
    if (!loaded.value) return false // sin datos aún, no bloqueamos (evita parpadeo)
    switch (i) {
        case 6:  return status.value < STATUS_PREFICHA   // 7 Preficha
        case 7:  return status.value < STATUS_FICHA      // 8 Documentos
        case 8:  return !docsApproved.value              // 9 Ficha
        case 9:  return !docsApproved.value              // 10 Examen
        default: return false                            // 1-6
    }
}

function lockReason(i: number): string {
    switch (i) {
        case 6:  return 'Completa y guarda tu expediente para generar la preficha.'
        case 7:  return 'Obtén tu preficha para poder cargar documentos.'
        case 8:  return 'Disponible cuando todos tus documentos requeridos estén aprobados.'
        case 9:  return 'Disponible cuando todos tus documentos requeridos estén aprobados.'
        default: return ''
    }
}

function go(index: number): void {
    if (index < 0 || index >= steps.length || index === currentIndex.value) return
    if (isLocked(index)) return
    router.push({ name: steps[index].name })
}

function circleClass(i: number): string {
    if (isLocked(i))              return 'bg-slate-100 text-slate-300 ring-1 ring-slate-200'
    if (i < currentIndex.value)   return 'bg-emerald-500 text-white hover:bg-emerald-600'
    if (i === currentIndex.value) return 'bg-blue-600 text-white hover:bg-blue-700'
    return 'bg-slate-100 text-slate-400 hover:bg-slate-200'
}

/** Trae estado + completitud de documentos y, si hace falta, redirige. */
async function load(): Promise<void> {
    try {
        const { data } = await api.get(API.ADMISSIONS_API.portal.me)
        status.value = data?.status ?? 0

        if (status.value >= STATUS_FICHA) {
            try {
                const docs = await api.get(API.ADMISSIONS_API.portal.documents)
                const required: any[] = docs.data?.required ?? []
                const uploaded: any[] = docs.data?.uploaded ?? []
                const approved = new Set(
                    uploaded.filter(u => u.status === 'approved').map(u => u.documentTypeId)
                )
                const mandatory = required.filter(r => r.isRequired)
                docsApproved.value = mandatory.length > 0
                    && mandatory.every(r => approved.has(r.documentTypeId))
            } catch {
                docsApproved.value = false
            }
        }
        // Solo damos por cargado el gating cuando el fetch fue exitoso; ante un
        // error NO bloqueamos nada (loaded queda en false).
        loaded.value = true
    } catch {
        return
    }

    // Si el aspirante entró por URL directa a un paso bloqueado, mandarlo al
    // último paso disponible.
    if (currentIndex.value !== -1 && isLocked(currentIndex.value)) {
        let target = currentIndex.value
        while (target > 0 && isLocked(target)) target--
        router.replace({ name: steps[target].name })
    }
}

// Evento global de progreso del portal: cualquier página que cambie el estado
// del aspirante (obtener preficha, completar expediente, etc.) dispara
// `window.dispatchEvent(new Event('portal:progress'))` y el stepper re-evalúa
// los candados sin necesidad de navegar.
onMounted(() => {
    // Recuerda el último paso visitado para poder reanudar desde la entrada
    // del portal (PortalResume).
    if (currentIndex.value !== -1 && route.name) {
        localStorage.setItem('portal:lastStep', String(route.name))
    }
    load()
    window.addEventListener('portal:progress', load)
})
onUnmounted(() => {
    window.removeEventListener('portal:progress', load)
})
</script>
