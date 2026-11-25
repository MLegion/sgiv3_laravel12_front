<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { EvdAreaResult, EvdLevel, EvdTeacherAssignmentRow, EvdTeacherDetail } from '@/modules/evd/types/evd.type'
import SkeletonStat from '@/app/components/ui/SkeletonStat.vue'
import SkeletonTable from '@/app/components/ui/SkeletonTable.vue'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'

const areaColumns: DataTableColumn<EvdAreaResult>[] = [
    { key: 'area', label: 'ÁREA', width: '4rem' },
    { key: 'aspect', label: 'ASPECTO' },
    { key: 'responses', label: 'RESPUESTAS', align: 'right', width: '8rem' },
    { key: 'average', label: 'PROMEDIO', align: 'right', width: '7rem' },
    { key: 'level', label: 'NIVEL', width: '9rem' },
]

const subjectColumns: DataTableColumn<EvdTeacherAssignmentRow>[] = [
    { key: 'subject', label: 'MATERIA' },
    { key: 'group', label: 'GRUPO', width: '8rem' },
    { key: 'progress', label: 'AVANCE', align: 'right', width: '12rem' },
]

const route   = useRoute()
const router  = useRouter()
const data    = ref<EvdTeacherDetail | null>(null)
const loading = ref(true)
const error   = ref('')

const teacherId = computed(() => Number(route.params.teacherId))

function queryNum(key: string): number | null {
    const v = route.query[key]
    return v !== undefined && v !== null && v !== '' ? Number(v) : null
}
const capId          = computed(() => queryNum('cap'))
const campusId       = computed(() => queryNum('campus_id'))
const modalityTypeId = computed(() => queryNum('modality_type'))
const careerId       = computed(() => queryNum('career_id'))


async function load() {
    if (capId.value === null || !teacherId.value) {
        error.value = 'Falta el periodo de referencia. Regresa a la lista de resultados.'
        loading.value = false
        return
    }
    loading.value = true
    error.value = ''
    try {
        const params: Record<string, number> = {}
        if (campusId.value !== null)       params.campus_id = campusId.value
        if (modalityTypeId.value !== null) params.modality_type_id = modalityTypeId.value
        if (careerId.value !== null)       params.career_id = careerId.value
        const { data: resp } = await api.get(
            API.EVD_API.admin.teacherDetail(capId.value, teacherId.value),
            { params },
        )
        data.value = resp
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'No se pudo cargar el detalle del docente.'
    } finally {
        loading.value = false
    }
}

function levelClass(level: EvdLevel | null): string {
    switch (level) {
        case 'EXCELENTE':    return 'bg-emerald-100 text-emerald-700'
        case 'NOTABLE':      return 'bg-emerald-50 text-emerald-600'
        case 'BUENO':        return 'bg-blue-50 text-blue-600'
        case 'SUFICIENTE':   return 'bg-amber-50 text-amber-700'
        case 'INSUFICIENTE': return 'bg-rose-50 text-rose-700'
        default:             return 'bg-slate-100 text-slate-500'
    }
}

function avgClass(avg: number | null): string {
    if (avg === null) return 'text-slate-400'
    if (avg >= 4.75) return 'text-emerald-700'
    if (avg >= 4.25) return 'text-emerald-600'
    if (avg >= 3.75) return 'text-blue-600'
    if (avg >= 3.25) return 'text-amber-600'
    return 'text-rose-600'
}

function goBack() {
    router.push({
        name: 'evd.admin.results',
        query: {
            cap:           capId.value ?? undefined,
            campus_id:     campusId.value ?? undefined,
            modality_type: modalityTypeId.value ?? undefined,
            career_id:     careerId.value ?? undefined,
        },
    })
}

const subjectCount    = computed(() => data.value?.assignments?.length ?? 0)
const totalStudents   = computed(() =>
    (data.value?.assignments ?? []).reduce((s, a) => s + a.total_students, 0),
)
const completedStudents = computed(() =>
    (data.value?.assignments ?? []).reduce((s, a) => s + a.completed_students, 0),
)

onMounted(load)
</script>

<template>
    <div class="space-y-4 max-w-6xl">
        <div>
            <button class="text-sm text-slate-600 hover:underline" @click="goBack">← Lista de resultados</button>
            <h1 class="text-xl font-semibold text-slate-800 uppercase mt-1">
                {{ data?.teacher?.name ?? 'Detalle docente' }}
            </h1>
            <p v-if="data?.teacher?.custom_id" class="text-xs font-mono text-slate-400">{{ data.teacher.custom_id }}</p>
            <p v-if="data?.period" class="text-xs text-slate-500 mt-0.5">
                {{ data.period.period_name }}
            </p>
        </div>

        <div v-if="loading" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <SkeletonStat v-for="n in 3" :key="n" />
            </div>
            <SkeletonTable :rows="5" :cols="5" />
        </div>
        <div v-if="error" class="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded px-3 py-2">{{ error }}</div>

        <template v-if="data?.teacher">
            <!-- Header con promedio general -->
            <div class="bg-white border border-slate-200 rounded-xl p-5 flex flex-wrap items-center gap-6">
                <div class="text-center">
                    <div class="text-[10px] uppercase font-black text-slate-400 tracking-wider">Promedio general</div>
                    <div class="text-5xl font-bold tabular-nums mt-1" :class="avgClass(data.overall?.avg ?? null)">
                        {{ data.overall?.avg !== null && data.overall?.avg !== undefined ? data.overall.avg.toFixed(2) : '—' }}
                    </div>
                    <span v-if="data.overall?.level"
                          class="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                          :class="levelClass(data.overall.level)">
                        {{ data.overall.level }}
                    </span>
                </div>
                <div class="flex-1 grid grid-cols-2 gap-4">
                    <div>
                        <div class="text-[10px] uppercase font-black text-slate-400 tracking-wider">Materias evaluadas</div>
                        <div class="text-2xl font-bold tabular-nums text-slate-700 mt-1">{{ subjectCount }}</div>
                    </div>
                    <div>
                        <div class="text-[10px] uppercase font-black text-slate-400 tracking-wider">Respuestas de alumnos</div>
                        <div class="text-2xl font-bold tabular-nums text-emerald-700 mt-1">
                            {{ completedStudents }} <span class="text-base text-slate-400">/ {{ totalStudents }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Áreas -->
            <div class="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div class="px-4 py-3 border-b bg-slate-50">
                    <h3 class="text-sm font-bold text-slate-700 uppercase">Desglose por área</h3>
                </div>
                <DataTable :columns="areaColumns" :rows="data.areas" hide-search
                           caption="Desglose por área"
                           empty-text="Aún no hay respuestas agregadas para este docente.">
                    <template #cell-area="{ row: a }">
                        <span class="font-mono font-bold text-slate-700">{{ a.area_code }}</span>
                    </template>
                    <template #cell-aspect="{ row: a }">
                        <span class="text-slate-700">{{ a.area_title }}</span>
                    </template>
                    <template #cell-responses="{ row: a }">
                        <span class="text-xs text-slate-600 tabular-nums">{{ a.respondents_count }}</span>
                    </template>
                    <template #cell-average="{ row: a }">
                        <span class="tabular-nums font-bold" :class="avgClass(a.avg_score)">
                            {{ a.avg_score.toFixed(2) }}
                        </span>
                    </template>
                    <template #cell-level="{ row: a }">
                        <span class="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                              :class="levelClass(a.level)">
                            {{ a.level ?? '—' }}
                        </span>
                    </template>
                </DataTable>
            </div>

            <!-- Materias evaluadas -->
            <div class="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div class="px-4 py-3 border-b bg-slate-50">
                    <h3 class="text-sm font-bold text-slate-700 uppercase">Materias evaluadas</h3>
                </div>
                <DataTable :columns="subjectColumns" :rows="data.assignments" hide-search
                           caption="Materias evaluadas"
                           empty-text="Este docente no tiene materias evaluadas en este periodo.">
                    <template #cell-subject="{ row: a }">
                        <div class="font-bold text-slate-700">{{ a.subject?.name ?? '—' }}</div>
                        <div class="text-[10px] font-mono text-slate-400">{{ a.subject?.official_code ?? '' }}</div>
                    </template>
                    <template #cell-group="{ row: a }">
                        <span class="font-mono text-xs text-slate-700">{{ a.group?.name ?? '—' }}</span>
                    </template>
                    <template #cell-progress="{ row: a }">
                        <div class="text-xs text-slate-500">
                            <span class="font-bold text-emerald-700 tabular-nums">{{ a.completed_students }}</span>
                            / {{ a.total_students }}
                        </div>
                        <div class="h-1.5 bg-slate-100 rounded overflow-hidden mt-1">
                            <div class="h-full bg-emerald-500" :style="{ width: a.progress_pct + '%' }"></div>
                        </div>
                        <div class="text-[10px] text-slate-400 mt-0.5">{{ a.progress_pct }}%</div>
                    </template>
                </DataTable>
            </div>
        </template>
    </div>
</template>
