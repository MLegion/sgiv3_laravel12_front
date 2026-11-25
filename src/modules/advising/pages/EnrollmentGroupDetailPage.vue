<template>
    <div class="space-y-4">
        <div>
            <button class="text-sm text-slate-600 hover:underline"
                    @click="goBack">
                ← Volver a grupos
            </button>
            <h1 class="text-xl font-semibold text-slate-800 uppercase mt-1">
                Grupo
                <span class="font-mono">{{ groupName ?? '—' }}</span>
            </h1>
            <p v-if="totals" class="text-xs text-slate-500 mt-0.5">
                {{ assignments.length }} materia{{ assignments.length === 1 ? '' : 's' }} ·
                {{ totals.totalEnrolled }} inscripción{{ totals.totalEnrolled === 1 ? '' : 'es' }}
            </p>
        </div>

        <div v-if="error" class="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded px-3 py-2">
            {{ error }}
        </div>

        <div class="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <DataTable :columns="columns" :rows="assignments" :loading="loading" hide-search caption="Materias del grupo"
                empty-text="Este grupo no tiene materias asignadas.">
                <template #cell-subject="{ row }">
                    <div class="font-bold text-slate-700">{{ row.subject.name }}</div>
                    <div class="text-[10px] font-mono text-slate-400">{{ row.subject.official_code ?? '—' }}</div>
                </template>
                <template #cell-credits="{ row }"><span class="text-xs">{{ row.subject.credits ?? 0 }}</span></template>
                <template #cell-teacher="{ row }"><span class="text-xs text-slate-600">{{ row.teacher?.name ?? '— por asignar —' }}</span></template>
                <template #cell-capacity="{ row }"><span class="text-xs text-slate-600 tabular-nums">{{ row.capacity ?? '—' }}</span></template>
                <template #cell-enrollment_count="{ row }">
                    <span class="text-lg font-bold tabular-nums" :class="row.enrollment_count > 0 ? 'text-emerald-700' : 'text-slate-300'">
                        {{ row.enrollment_count }}
                    </span>
                </template>
                <template #cell-actions="{ row }">
                    <button class="text-blue-600 hover:underline text-sm"
                            @click="goToAssignment(row.teacher_assignment_id)">
                        Lista →
                    </button>
                </template>
            </DataTable>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { GroupAssignmentRow } from '@/modules/advising/types/advising.type'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'

const route  = useRoute()
const router = useRouter()

const groupId = computed(() => Number(route.params.groupId))
const columns: DataTableColumn<GroupAssignmentRow>[] = [
    { key: 'subject', label: 'Materia' },
    { key: 'credits', label: 'Cr.', width: '5rem' },
    { key: 'teacher', label: 'Docente' },
    { key: 'capacity', label: 'Cupo', align: 'right', width: '8rem' },
    { key: 'enrollment_count', label: 'Inscritos', align: 'right', width: '8rem' },
    { key: 'actions', label: '', align: 'right', width: '6rem' },
]
const assignments = ref<GroupAssignmentRow[]>([])
const loading     = ref(false)
const error       = ref('')

const groupName = computed(() => assignments.value[0]?.group.name ?? null)
const totals = computed(() => ({
    totalEnrolled: assignments.value.reduce((acc, a) => acc + a.enrollment_count, 0),
}))

async function load() {
    if (!groupId.value || isNaN(groupId.value)) return
    loading.value = true
    error.value = ''
    try {
        const { data } = await api.get(API.ADVISING_API.enrollments.adminGroupAssignments(groupId.value))
        assignments.value = Array.isArray(data?.data) ? data.data : []
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'No se pudo cargar el detalle del grupo.'
    } finally {
        loading.value = false
    }
}

function goBack() {
    router.push({ name: 'advising.enrollments.groups', query: route.query })
}

function goToAssignment(taId: number) {
    router.push({
        name: 'advising.enrollments.assignment',
        params: { teacherAssignmentId: taId },
        query: { ...route.query, groupId: String(groupId.value) },
    })
}

onMounted(load)
</script>
