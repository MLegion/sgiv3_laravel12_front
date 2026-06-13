<template>
    <div class="space-y-3">
        <div class="flex items-start justify-between gap-3">
            <div>
                <h3 class="text-sm font-bold uppercase tracking-widest text-slate-700">
                    Aulas/clases afectadas por este examen
                </h3>
                <p class="text-xs text-slate-500">
                    Estas son las clases escolarizadas que coinciden con la sesión y que el jefe de carrera deberá reubicar.
                </p>
            </div>
            <button aria-label="Vuelve a calcular las clases afectadas usando los datos actuales de la sesión"
                type="button"
                class="text-[11px] font-semibold uppercase tracking-wide px-3 py-1.5 rounded border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                :disabled="loading || regenerating"
                @click="regenerate"
                title="Vuelve a calcular las clases afectadas usando los datos actuales de la sesión"
            >
                {{ regenerating ? 'Recalculando...' : 'Recalcular' }}
            </button>
        </div>

        <p v-if="lastRegenSummary" class="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-1">
            {{ lastRegenSummary }}
        </p>

        <div v-if="loading" class="text-xs text-slate-400 italic">Cargando...</div>
        <ul v-else-if="warnings.length > 0" class="space-y-1">
            <li
                v-for="w in warnings"
                :key="w.id"
                class="border border-slate-200 rounded-md p-3 bg-slate-50 flex items-start justify-between gap-3"
            >
                <div class="text-xs space-y-0.5">
                    <div class="font-medium text-slate-800">
                        {{ w.subject?.name ?? 'Materia desconocida' }}
                    </div>
                    <div class="text-slate-500">
                        Docente: {{ w.teacher?.fullName ?? '—' }}
                    </div>
                    <div class="text-slate-500">
                        Carrera: {{ w.career?.name ?? '—' }}
                    </div>
                </div>
                <span
                    v-if="w.acknowledgedAt"
                    class="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 uppercase"
                >Atendido</span>
                <span
                    v-else
                    class="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 uppercase"
                >Pendiente</span>
            </li>
        </ul>
        <p v-else class="text-xs text-slate-400 italic">Sin clases afectadas.</p>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { ExamClassWarning } from '@/modules/admissions/types/exam-class-warning.type'

const props = defineProps<{ sessionId: number }>()

const warnings = ref<ExamClassWarning[]>([])
const loading  = ref(false)
const regenerating = ref(false)
const lastRegenSummary = ref<string | null>(null)

async function load() {
    loading.value = true
    try {
        const { data } = await api.get(API.ADMISSIONS_API.examSessions.warnings(props.sessionId))
        warnings.value = data
    } finally {
        loading.value = false
    }
}

async function regenerate() {
    regenerating.value = true
    lastRegenSummary.value = null
    try {
        const { data } = await api.post(API.ADMISSIONS_API.examSessions.regenerateWarnings(props.sessionId))
        const before = data?.before ?? 0
        const after  = data?.after ?? 0
        const semi   = data?.semiSchoolarizedSkipped ?? 0
        lastRegenSummary.value = `Recalculado: ${before} → ${after} clases${semi > 0 ? ` · ${semi} semi-escolarizadas omitidas (requieren ranura manual)` : ''}`
        await load()
    } finally {
        regenerating.value = false
    }
}

onMounted(load)
</script>
