<template>
    <div class="p-4 md:p-6 max-w-6xl mx-auto">
        <h1 class="text-xl font-semibold text-slate-800">Reporte de estudiantes ausentes por tutor</h1>
        <p class="text-sm text-slate-500 mb-4">Alumnos tutorados con ausencias registradas por sus docentes en el periodo activo.</p>

        <div class="flex flex-wrap items-end gap-3 mb-4">
            <div>
                <label class="block text-xs font-medium text-slate-600">Desde</label>
                <input type="date" v-model="from" class="mt-1 rounded-lg border-slate-300 text-sm" />
            </div>
            <div>
                <label class="block text-xs font-medium text-slate-600">Hasta</label>
                <input type="date" v-model="to" class="mt-1 rounded-lg border-slate-300 text-sm" />
            </div>
            <button @click="load" class="px-4 py-2 rounded-lg bg-slate-700 text-white text-sm font-medium">Filtrar</button>
        </div>

        <DataTable
            :columns="columns"
            :rows="pagedRows"
            :loading="loading"
            :pagination="{ page, perPage, total: filtered.length }"
            :exportable="['csv', 'xlsx']"
            search-placeholder="Buscar tutor o estudiante…"
            empty-text="Sin ausencias registradas en el periodo."
            @change="onTableChange"
        >
            <template #cell-num_control="{ row }">
                <span class="font-mono text-xs">{{ row.num_control }}</span>
            </template>
            <template #cell-status="{ row }">
                <span class="px-2 py-0.5 rounded-full text-xs"
                    :class="row.status === 'absent' ? 'bg-rose-100 text-rose-700' : row.status === 'late' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'">
                    {{ statusLabel(row.status) }}
                </span>
            </template>
        </DataTable>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import type { DataTableColumn, DataTableChangeEvent } from '@/app/components/ui/datatable/types'

const toast = useToast()
const GA = API.MIDOCENCIA_API.groupAttendance

interface Row { tutor: string; num_control: string; nombre: string; materia: string; grupo: string; fecha: string; status: string; motivo?: string }

const rows = ref<Row[]>([])
const from = ref<string>('')
const to = ref<string>('')
const loading = ref(false)

const page = ref(1)
const perPage = ref(25)
const term = ref('')
const columns: DataTableColumn<Row>[] = [
    { key: 'tutor', label: 'Tutor', searchable: true },
    { key: 'num_control', label: 'No. Control', searchable: true },
    { key: 'nombre', label: 'Estudiante', searchable: true },
    { key: 'materia', label: 'Materia' },
    { key: 'grupo', label: 'Grupo' },
    { key: 'fecha', label: 'Fecha' },
    { key: 'status', label: 'Estado' },
    { key: 'motivo', label: 'Motivo' },
]
const filtered = computed(() => {
    const t = term.value.trim().toLowerCase()
    if (!t) return rows.value
    return rows.value.filter(r => r.tutor.toLowerCase().includes(t) || r.nombre.toLowerCase().includes(t) || (r.num_control ?? '').toLowerCase().includes(t))
})
const pagedRows = computed(() => filtered.value.slice((page.value - 1) * perPage.value, page.value * perPage.value))

function onTableChange(e: DataTableChangeEvent) {
    page.value = e.page
    perPage.value = e.perPage
    if (e.search !== undefined) {
        term.value = typeof e.search === 'string' ? e.search : (Object.values(e.search)[0] ?? '')
        page.value = 1
    }
}

function statusLabel(s: string): string {
    return s === 'absent' ? 'Ausente' : s === 'late' ? 'Retardo' : s === 'excused' ? 'Justificado' : s
}

async function load() {
    loading.value = true
    page.value = 1
    try {
        const { data } = await api.get(GA.absenceReport, { params: { from: from.value || null, to: to.value || null } })
        rows.value = data
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudo cargar el reporte.') }
    finally { loading.value = false }
}

onMounted(load)
</script>
