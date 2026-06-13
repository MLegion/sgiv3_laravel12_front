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
                    class="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    @click="go(currentIndex - 1)"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-4 w-4">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                    <span class="hidden sm:inline">Anterior</span>
                </button>
                <button
                    type="button"
                    :disabled="currentIndex === steps.length - 1"
                    class="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
                    @click="go(currentIndex + 1)"
                >
                    <span>Siguiente</span>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-4 w-4">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                </button>
            </div>
        </div>

        <!-- Línea de progreso con círculos numerados (scroll horizontal en móvil) -->
        <ol class="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar">
            <li
                v-for="(s, i) in steps"
                :key="s.name"
                class="flex items-center shrink-0"
            >
                <button
                    type="button"
                    :aria-label="`Ir al paso ${i + 1}: ${s.label}`"
                    :aria-current="i === currentIndex ? 'step' : undefined"
                    class="group flex flex-col items-center gap-1 focus:outline-none"
                    @click="go(i)"
                >
                    <span
                        class="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold transition ring-2 ring-offset-1 group-focus:ring-blue-400"
                        :class="circleClass(i)"
                    >
                        <svg v-if="i < currentIndex" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="h-3.5 w-3.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        <template v-else>{{ i + 1 }}</template>
                    </span>
                    <span
                        class="whitespace-nowrap text-[9px] font-semibold uppercase tracking-wide"
                        :class="i === currentIndex ? 'text-blue-600' : 'text-slate-400'"
                    >{{ s.label }}</span>
                </button>
                <!-- conector -->
                <span
                    v-if="i < steps.length - 1"
                    class="mx-1 h-0.5 w-5 sm:w-8 rounded-full"
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
    if (i < currentIndex.value)  return 'bg-emerald-500 text-white ring-emerald-200'
    if (i === currentIndex.value) return 'bg-blue-600 text-white ring-blue-200'
    return 'bg-slate-100 text-slate-400 ring-transparent group-hover:bg-slate-200'
}
</script>
