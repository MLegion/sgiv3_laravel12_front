<template>
    <div class="space-y-4">
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-5 text-sm text-blue-800">
            <slot name="explainer">
                Tu plantel ofrece dos modalidades de examen. Elige cómo quieres presentar.
                Podrás cambiar tu elección mientras no presentes el examen.
            </slot>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
                type="button"
                :disabled="loading || disabled"
                class="group bg-white border-2 border-slate-200 rounded-xl p-6 text-left hover:border-blue-500 hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                @click="$emit('choose', 'online')"
            >
                <ComputerDesktopIcon class="w-10 h-10 text-blue-600 mb-3" />
                <h3 class="text-base font-bold text-slate-800 uppercase">En línea</h3>
                <p class="text-xs text-slate-600 mt-1">
                    Presentas el examen desde tu computadora en el horario que elijas dentro del periodo.
                </p>
            </button>
            <button
                type="button"
                :disabled="loading || disabled"
                class="group bg-white border-2 border-slate-200 rounded-xl p-6 text-left hover:border-purple-500 hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                @click="$emit('choose', 'presencial')"
            >
                <BuildingLibraryIcon class="w-10 h-10 text-purple-600 mb-3" />
                <h3 class="text-base font-bold text-slate-800 uppercase">Presencial</h3>
                <p class="text-xs text-slate-600 mt-1">
                    Asistes al plantel en la fecha y aula que se te asigne.
                </p>
            </button>
        </div>
        <p v-if="errorMessage" class="text-xs text-red-600">{{ errorMessage }}</p>
    </div>
</template>

<script setup lang="ts">
/**
 * Tarjetas de elección de modalidad de examen para el aspirante.
 *
 * Encapsula la UI que antes vivía inline en PortalExamenPage. Hoy se usa
 * también en PortalInscripcionPage para que el aspirante pueda elegir desde
 * el momento que obtiene su preficha (sin esperar a entrar al examen),
 * para que el plantel pueda planear sesiones presenciales con tiempo.
 */
import { BuildingLibraryIcon, ComputerDesktopIcon } from '@heroicons/vue/24/outline'

defineProps<{
    /** Deshabilita ambas tarjetas mientras se procesa la elección. */
    loading?: boolean
    /** Deshabilita por causa externa (p.ej. ya presentó examen). */
    disabled?: boolean
    /** Mensaje de error del último intento, si lo hay. */
    errorMessage?: string | null
}>()

defineEmits<{
    (e: 'choose', mode: 'online' | 'presencial'): void
}>()
</script>
