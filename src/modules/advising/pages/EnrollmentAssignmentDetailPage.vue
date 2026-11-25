<template>
    <div class="space-y-4">
        <div>
            <button class="text-sm text-slate-600 hover:underline" @click="goBack">
                ← Volver
            </button>
            <h1 class="text-xl font-semibold text-slate-800 uppercase mt-1">
                Lista de alumnos inscritos
            </h1>
        </div>

        <div v-if="error" class="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded px-3 py-2">
            {{ error }}
        </div>

        <div class="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div class="px-4 py-3 border-b bg-slate-50 flex items-center justify-between flex-wrap gap-2">
                <h3 class="text-sm font-bold text-slate-700 uppercase">Alumnos</h3>
                <span class="text-xs text-slate-500">
                    <span class="text-2xl font-bold tabular-nums" :class="rows.length > 0 ? 'text-emerald-700' : 'text-slate-300'">
                        {{ rows.length }}
                    </span>
                    <span class="ml-1 text-[10px] uppercase">{{ rows.length === 1 ? 'alumno' : 'alumnos' }}</span>
                </span>
            </div>
            <DataTable :columns="columns" :rows="rows" :loading="loading" hide-search caption="Alumnos inscritos"
                empty-text="No hay alumnos inscritos en esta materia.">
                <template #cell-index="{ index }"><span class="text-xs text-slate-400 tabular-nums">{{ index + 1 }}</span></template>
                <template #cell-num_control="{ row }"><span class="font-mono text-xs text-slate-700">{{ row.student.num_control ?? '—' }}</span></template>
                <template #cell-full_name="{ row }"><span class="font-bold text-slate-700">{{ row.student.full_name }}</span></template>
                <template #cell-career="{ row }"><span class="text-xs text-slate-600">{{ row.career?.short_name ?? row.career?.name ?? '—' }}</span></template>
            </DataTable>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { AssignmentEnrolledStudentRow } from '@/modules/advising/types/advising.type'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'

const route  = useRoute()
const router = useRouter()

const teacherAssignmentId = computed(() => Number(route.params.teacherAssignmentId))
const columns: DataTableColumn<AssignmentEnrolledStudentRow>[] = [
    { key: 'index', label: '#', width: '3rem' },
    { key: 'num_control', label: 'Num control', width: '9rem' },
    { key: 'full_name', label: 'Nombre' },
    { key: 'career', label: 'Carrera' },
]
const rows    = ref<AssignmentEnrolledStudentRow[]>([])
const loading = ref(false)
const error   = ref('')

async function load() {
    if (!teacherAssignmentId.value || isNaN(teacherAssignmentId.value)) return
    loading.value = true
    error.value = ''
    try {
        const { data } = await api.get(API.ADVISING_API.enrollments.adminByAssignment(teacherAssignmentId.value))
        rows.value = Array.isArray(data?.data) ? data.data : []
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'No se pudo cargar la lista de alumnos.'
    } finally {
        loading.value = false
    }
}

function goBack() {
    const groupId = route.query.groupId
    if (groupId) {
        router.push({
            name: 'advising.enrollments.group',
            params: { groupId: String(groupId) },
            query: { period: route.query.period },
        })
        return
    }
    router.push({ name: 'advising.enrollments.groups', query: route.query })
}

onMounted(load)
</script>
