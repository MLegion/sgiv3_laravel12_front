<template>
    <div class="h-full flex flex-col text-xs">
        <div v-if="loading && !data" class="text-slate-400 italic">Cargando…</div>

        <div v-else-if="!data?.studentId" class="flex-1 flex items-center justify-center text-slate-400 italic text-center">
            Aún no tienes un perfil de estudiante activo.
        </div>

        <div v-else-if="!data.isProspect" class="flex-1 flex items-center justify-center text-slate-500 italic text-center px-2">
            Tu plan académico sigue en curso. Esta sección se activará cuando termines tu curriculum.
        </div>

        <div v-else-if="!data.hasDebts" class="flex-1 flex flex-col items-center justify-center text-center gap-2 px-2">
            <CheckCircleIcon class="w-10 h-10 text-emerald-500" />
            <p class="text-sm font-semibold text-emerald-700">¡Vas con todo!</p>
            <p class="text-[11px] text-slate-600">
                No tenemos registrados adeudos pendientes para tu titulación.
                El sistema te promoverá a EGRESADO en el próximo ciclo de revisión.
            </p>
        </div>

        <div v-else class="flex-1 flex flex-col gap-2 overflow-hidden">
            <div class="flex items-baseline justify-between gap-2">
                <h3 class="text-[11px] uppercase tracking-wide font-semibold text-amber-700">
                    Adeudos pendientes
                </h3>
                <span class="text-[10px] text-slate-500">{{ data.debts.length }}</span>
            </div>

            <ul class="flex-1 overflow-y-auto space-y-1.5 pr-1">
                <li
                    v-for="d in data.debts"
                    :key="d.code"
                    class="border border-amber-200 bg-amber-50 rounded-md px-2.5 py-1.5"
                >
                    <div class="flex items-baseline justify-between gap-2">
                        <span class="text-[11px] font-semibold text-slate-800 truncate" :title="d.label">
                            {{ d.label }}
                        </span>
                        <span
                            v-if="d.dueDate"
                            class="text-[9px] text-slate-500 whitespace-nowrap"
                        >Vence {{ formatDate(d.dueDate) }}</span>
                    </div>
                    <p v-if="d.description" class="text-[10px] text-slate-600 leading-snug">
                        {{ d.description }}
                    </p>
                    <a
                        v-if="d.detailUrl"
                        :href="d.detailUrl"
                        class="text-[10px] text-blue-600 hover:underline"
                    >Ver detalle</a>
                </li>
            </ul>

            <p class="text-[10px] text-slate-500 italic">
                Una vez resueltos, tu estatus cambiará a EGRESADO automáticamente.
            </p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { CheckCircleIcon } from '@heroicons/vue/24/outline'

interface Debt {
    code:        string
    label:       string
    description: string | null
    dueDate:     string | null
    detailUrl:   string | null
}

interface Payload {
    studentId:  number | null
    isProspect: boolean
    hasDebts:   boolean
    debts:      Debt[]
}

defineProps<{
    data:    Payload | null
    loading: boolean
    error:   unknown
}>()

function formatDate(iso: string | null): string {
    if (!iso) return '—'
    try {
        return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
    } catch {
        return iso
    }
}
</script>
