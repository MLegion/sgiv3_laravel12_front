<template>
    <header class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex min-w-0 items-start gap-3">
            <!-- Botón volver (opcional) -->
            <button
                v-if="backTo !== undefined"
                type="button"
                class="mt-0.5 shrink-0 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
                aria-label="Volver"
                @click="onBack"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-5 w-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
            </button>

            <div class="min-w-0">
                <h1 class="truncate text-xl font-semibold text-slate-800">{{ title }}</h1>
                <p v-if="subtitle" class="mt-0.5 text-sm text-slate-500">{{ subtitle }}</p>
            </div>
        </div>

        <!-- Acciones (botones, etc.) -->
        <div v-if="$slots.actions" class="flex shrink-0 flex-wrap items-center gap-2">
            <slot name="actions" />
        </div>
    </header>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

/**
 * Encabezado de página estandarizado (título + subtítulo + acciones + volver).
 * Resuelve S6 (patrón header+botones repetido en ~9 páginas) y aporta layout
 * responsive (apila en móvil: flex-col sm:flex-row).
 *
 * Uso:
 *   <FormPageHeader title="Aspirantes" subtitle="Periodo 2026-1" :back-to="-1">
 *     <template #actions>
 *       <button class="...">Nuevo</button>
 *     </template>
 *   </FormPageHeader>
 *
 * `back-to`: número (router.go, p.ej. -1) o ubicación de ruta. Omitir = sin botón.
 */

import type { RouteLocationRaw } from 'vue-router'

const props = defineProps<{
    title: string
    subtitle?: string
    backTo?: number | RouteLocationRaw
}>()

const router = useRouter()

function onBack(): void {
    if (typeof props.backTo === 'number') {
        router.go(props.backTo)
    } else if (props.backTo !== undefined) {
        router.push(props.backTo)
    }
}
</script>
