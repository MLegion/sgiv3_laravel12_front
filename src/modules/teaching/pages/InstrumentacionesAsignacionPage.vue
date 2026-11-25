<template>
    <div class="space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-y-2">
            <div>
                <button class="text-sm text-slate-500 hover:text-slate-700 mb-1" @click="router.push({ name: 'teaching.planeacion' })">← Mis asignaturas</button>
                <h1 class="text-xl font-semibold text-slate-800">Instrumentación</h1>
                <p class="text-sm text-slate-500">{{ label }}</p>
            </div>
            <button
                type="button"
                class="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                @click="router.push({ name: 'teaching.planeacion.create', query: { teacher_assignment_id: assignmentId } })"
            >
                <PlusIcon class="w-4 h-4" />
                NUEVA INSTRUMENTACIÓN
            </button>
        </div>

        <DataTable :columns="columns" :rows="items" hide-search caption="Instrumentaciones de la asignatura" empty-text="Sin instrumentaciones. Crea la primera.">
            <template #cell-id="{ row: inst }">{{ inst.id }}</template>
            <template #cell-title="{ row: inst }">{{ inst.title ?? '(sin título)' }}</template>
            <template #cell-program="{ row: inst }">{{ inst.studyProgram?.name ?? '—' }}</template>
            <template #cell-status="{ row: inst }">
                <span class="px-2 py-1 text-xs font-semibold rounded-full" :class="statusClass(inst.status)">{{ statusLabel(inst.status) }}</span>
            </template>
            <template #cell-actions="{ row: inst }">
                <button class="text-blue-600 hover:text-blue-800 text-sm" @click="router.push({ name: 'teaching.planeacion.edit', params: { id: inst.id } })">Editar</button>
            </template>
        </DataTable>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { PlusIcon } from '@heroicons/vue/24/outline'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'

const columns: DataTableColumn<any>[] = [
    { key: 'id', label: '#' },
    { key: 'title', label: 'Título' },
    { key: 'program', label: 'Programa' },
    { key: 'status', label: 'Estado' },
    { key: 'actions', label: 'Opciones', align: 'right' },
]

const route = useRoute()
const router = useRouter()

const assignmentId = (route.query.teacher_assignment_id as string) ?? ''
const label = (route.query.label as string) ?? ''
const items = ref<any[]>([])
const loading = ref(false)

function statusLabel(s: string): string {
    return ({ draft: 'BORRADOR', submitted: 'ENVIADA', approved: 'APROBADA', rejected: 'RECHAZADA' } as Record<string, string>)[s] ?? s
}
function statusClass(s: string): string {
    return ({
        draft: 'bg-slate-100 text-slate-600',
        submitted: 'bg-amber-100 text-amber-700',
        approved: 'bg-green-100 text-green-700',
        rejected: 'bg-red-100 text-red-700',
    } as Record<string, string>)[s] ?? 'bg-slate-100 text-slate-600'
}

onMounted(async () => {
    if (!assignmentId) return
    loading.value = true
    try {
        const { data } = await api.get(API.TEACHING_API.instrumentations.list, {
            params: { teacher_assignment_id: assignmentId },
        })
        items.value = Array.isArray(data) ? data : (data.items ?? [])
    } finally {
        loading.value = false
    }
})
</script>
