<template>
    <nav
        v-if="currentIndex !== -1"
        aria-label="Progreso del registro de admisión"
        class="bg-white border border-slate-200 rounded-xl shadow-sm p-3 sm:p-4 print:hidden"
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
                    :disabled="currentIndex === steps.length - 1"
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

        <!-- Línea de progreso: círculos numerados con conectores que llenan el
             ancho (flex-1) — nunca se desborda ni se corta. Sin labels por paso
             (el del paso actual va en el encabezado). -->
        <ol class="flex items-center">
            <li
                v-for="(s, i) in steps"
                :key="s.name"
                class="flex items-center"
                :class="i < steps.length - 1 ? 'flex-1' : 'shrink-0'"
            >
                <button
                    type="button"
                    :aria-label="`Ir al paso ${i + 1}: ${s.label}`"
                    :aria-current="i === currentIndex ? 'step' : undefined"
                    :title="s.label"
                    class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400"
                    :class="circleClass(i)"
                    @click="go(i)"
                >
                    <svg v-if="i < currentIndex" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="h-3.5 w-3.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <template v-else>{{ i + 1 }}</template>
                </button>
                <!-- conector que estira (mismo grosor/estilo entre todos) -->
                <span
                    v-if="i < steps.length - 1"
                    class="mx-0.5 h-0.5 flex-1 rounded-full"
                    :class="i < currentIndex ? 'bg-emerald-400' : 'bg-slate-200'"
                />
            </li>
        </ol>
    </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

/**
 * Indicador de progreso del portal del aspirante (10 pasos).
 * Resuelve la fricción "portal de 10 pasos sin stepper ni Anterior/Siguiente"
 * del journey de admisión. Se inserta al tope de cada página-paso del portal;
 * detecta el paso actual por el nombre de la ruta.
 */

interface Step { name: string; label: string }

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

const currentIndex = computed(() => steps.findIndex(s => s.name === route.name))

function go(index: number): void {
    if (index < 0 || index >= steps.length || index === currentIndex.value) return
    router.push({ name: steps[index].name })
}

function circleClass(i: number): string {
    if (i < currentIndex.value)   return 'bg-emerald-500 text-white hover:bg-emerald-600'
    if (i === currentIndex.value) return 'bg-blue-600 text-white hover:bg-blue-700'
    return 'bg-slate-100 text-slate-400 hover:bg-slate-200'
}
</script>
