<template>
    <!-- Requisito cubierto por excepción aprobada -->
    <span v-if="waived || status === 'approved'"
          class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md bg-emerald-100 text-emerald-700">
        ✓ Excepción aprobada
    </span>

    <!-- Requisito cumplido normalmente -->
    <span v-else-if="ok" class="inline-flex items-center justify-center text-emerald-600 text-xs">✓</span>

    <!-- Solicitud pendiente -->
    <span v-else-if="status === 'pending'"
          class="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md bg-amber-100 text-amber-700">
        ⏳ Excepción pendiente
    </span>

    <!-- Rechazada: permitir reintentar -->
    <button v-else-if="status === 'rejected'" type="button"
            class="text-[10px] font-semibold px-2 py-1 rounded-md border border-rose-300 text-rose-700 hover:bg-rose-50"
            @click="$emit('request')">
        Rechazada · reintentar
    </button>

    <!-- Sin solicitar: pedir excepción -->
    <button v-else type="button"
            class="text-[10px] font-semibold px-2 py-1 rounded-md border border-amber-300 text-amber-700 hover:bg-amber-50 whitespace-nowrap"
            @click="$emit('request')">
        Pedir excepción
    </button>
</template>

<script setup lang="ts">
import type { RequirementExceptionStatus } from '@/modules/advising/types/advising.type'

defineProps<{
    ok: boolean
    waived?: boolean
    status: RequirementExceptionStatus | null
}>()

defineEmits<{ (e: 'request'): void }>()
</script>
