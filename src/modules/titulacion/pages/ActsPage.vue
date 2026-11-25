<template>
    <div class="space-y-5">
        <h1 class="text-xl font-semibold text-slate-800 uppercase">Actos de Titulación</h1>

        <div class="rounded-xl border bg-white p-4 grid sm:grid-cols-5 gap-3">
            <input type="date" v-model="filters.from" aria-label="Fecha desde" class="rounded-lg border-slate-300 text-sm" />
            <input type="date" v-model="filters.to" aria-label="Fecha hasta" class="rounded-lg border-slate-300 text-sm" />
            <select v-model="filters.career_id" aria-label="Carrera" class="rounded-lg border-slate-300 text-sm">
                <option value="">Todas las carreras</option>
                <option v-for="c in options.careers" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
            <select v-model="filters.status" aria-label="Estado" class="rounded-lg border-slate-300 text-sm">
                <option value="">Todos</option><option value="scheduled">Programados</option>
                <option value="done">Realizados</option><option value="cancelled">Cancelados</option>
            </select>
            <button @click="fetchList" class="px-4 py-2 rounded-lg border text-sm font-semibold text-slate-600">Filtrar</button>
        </div>

        <DataTable :columns="columns" :rows="rows" hide-search caption="Actos de Titulación" empty-text="Sin actos.">
            <template #cell-date="{ row: a }">
                <span class="font-semibold text-slate-700">{{ a.date }}</span><br><span class="text-xs text-slate-400">{{ a.start_time?.slice(0,5) }}–{{ a.end_time?.slice(0,5) }}</span>
            </template>
            <template #cell-student="{ row: a }">
                <div class="text-slate-700">{{ a.student_name }}</div><div class="text-xs text-slate-400">{{ a.num_control }}</div>
            </template>
            <template #cell-place="{ row: a }"><span class="text-slate-600">{{ a.place_name ?? '—' }}</span></template>
            <template #cell-option="{ row: a }"><span class="text-slate-600">{{ a.option_name ?? '—' }}</span></template>
            <template #cell-status="{ row: a }"><span class="px-2 py-0.5 rounded-full text-xs font-bold" :class="actStatusClass(a.status)">{{ actStatusLabel(a.status) }}</span></template>
            <template #cell-outcome="{ row: a }"><span class="text-slate-600">{{ outcomeLabel(a.outcome) }}</span></template>
            <template #cell-actions="{ row: a }">
                <button v-if="a.status === 'scheduled'" @click="openConclude(a)" class="text-xs text-emerald-600 font-semibold">Concluir</button>
                <button v-if="a.status === 'scheduled'" @click="cancel(a)" class="text-xs text-red-500 ml-2">Cancelar</button>
            </template>
        </DataTable>

        <BaseModal :model-value="!!concludeAct" @update:model-value="concludeAct = null" title="Concluir acto" size="sm">
            <div v-if="concludeAct" class="space-y-3">
                <p class="text-sm text-slate-500">{{ concludeAct.student_name }} · {{ concludeAct.date }}</p>
                <label class="block"><span class="text-xs font-semibold text-slate-500">Resultado</span>
                    <select v-model="concludeForm.outcome" class="mt-1 w-full rounded-lg border-slate-300 text-sm">
                        <option value="aprobado">Aprobado</option><option value="suspendido">Suspendido</option><option value="aplazado">Aplazado</option>
                    </select></label>
                <label class="block"><span class="text-xs font-semibold text-slate-500">Notas (opcional)</span>
                    <textarea v-model="concludeForm.notes" rows="2" class="mt-1 w-full rounded-lg border-slate-300 text-sm"></textarea></label>
            </div>
            <template #footer>
                <button @click="concludeAct = null" class="px-4 py-2 rounded-lg border text-sm">Cancelar</button>
                <button @click="doConclude" class="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold">Guardar</button>
            </template>
        </BaseModal>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { TitulacionAct } from '@/modules/titulacion/types/titulacion.type'
import { actStatusLabel, actStatusClass, outcomeLabel } from '@/modules/titulacion/pages/status'
import BaseModal from '@/app/components/ui/modal/BaseModal.vue'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'
import { useConfirm } from '@/app/composables/useConfirm'

const { confirm } = useConfirm()

const T = API.TITULACION_API
const rows = ref<TitulacionAct[]>([])
const columns: DataTableColumn<TitulacionAct>[] = [
    { key: 'date', label: 'Fecha / Hora' },
    { key: 'student', label: 'Alumno' },
    { key: 'place', label: 'Aula' },
    { key: 'option', label: 'Opción' },
    { key: 'status', label: 'Estado' },
    { key: 'outcome', label: 'Resultado' },
    { key: 'actions', label: '', align: 'right' },
]
const options = reactive<{ careers: any[] }>({ careers: [] })
const filters = reactive({ from: '', to: '', career_id: '', status: '' })

const concludeAct = ref<TitulacionAct | null>(null)
const concludeForm = reactive({ outcome: 'aprobado', notes: '' })

async function fetchList() {
    const { data } = await api.get(T.acts.list, { params: { from: filters.from || undefined, to: filters.to || undefined, career_id: filters.career_id || undefined, status: filters.status || undefined } })
    rows.value = data ?? []
}
async function fetchOptions() { options.careers = (await api.get(T.records.filterOptions)).data?.careers ?? [] }

function openConclude(a: TitulacionAct) { concludeAct.value = a; concludeForm.outcome = 'aprobado'; concludeForm.notes = '' }
async function doConclude() {
    if (!concludeAct.value) return
    await api.post(T.acts.conclude(concludeAct.value.id), { outcome: concludeForm.outcome, notes: concludeForm.notes || null })
    concludeAct.value = null; await fetchList()
}
async function cancel(a: TitulacionAct) {
    if (!await confirm({ title: 'Cancelar acto', message: '¿Cancelar este acto? Se avisará al jurado y al alumno.', confirmText: 'Cancelar acto', variant: 'warning' })) return
    await api.post(T.acts.cancel(a.id)); await fetchList()
}

onMounted(async () => { await Promise.all([fetchOptions(), fetchList()]) })
</script>
