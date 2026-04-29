<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Fases de Asesoría / Reinscripción</h1>
        </div>

        <div class="bg-white rounded-lg shadow px-4 py-3 flex items-center gap-3">
            <label class="inline-flex items-center gap-2 cursor-pointer">
                <input
                    type="checkbox"
                    class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    v-model="includeArchived"
                    @change="onToggleArchived"
                />
                <span class="text-sm text-slate-700">Incluir periodos archivados</span>
            </label>
            <span class="text-xs text-slate-400">
                Asesoría sólo se puede abrir si los horarios están publicados en SCA. Reinscripción y Altas/Bajas son posteriores.
            </span>
        </div>

        <div v-if="errorMsg" class="text-sm px-4 py-3 rounded-lg bg-red-50 text-red-700 border border-red-100">
            {{ errorMsg }}
        </div>
        <div v-if="okMsg" class="text-sm px-4 py-3 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
            {{ okMsg }}
        </div>

        <DataTable
            :columns="columns"
            :rows="rows"
            :loading="loading"
            :pagination="pagination"
            @change="handleChange"
        >
            <template #cell-period="{ row }">
                <div class="flex flex-col">
                    <span class="text-sm font-bold text-slate-700">{{ row.period?.name ?? '—' }}</span>
                    <span class="text-[10px] text-slate-400">{{ periodStatusLabel(row.period?.status) }}</span>
                </div>
            </template>

            <template #cell-modality="{ row }">
                <div class="flex flex-col">
                    <span class="text-sm text-slate-700">{{ row.modality?.modalityType?.name ?? '—' }}</span>
                    <span class="text-[10px] text-slate-400">{{ row.modality?.campus?.shortName ?? row.modality?.campus?.name ?? '' }}</span>
                </div>
            </template>

            <template #cell-published="{ row }">
                <span v-if="row.phaseSchedulePublished" class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                    Publicado
                </span>
                <span v-else class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                    Pendiente
                </span>
            </template>

            <template #cell-advising="{ row }">
                <PhaseSwitch
                    :value="row.phaseAdvising"
                    :disabled="!row.phaseSchedulePublished && !row.phaseAdvising"
                    :saving="savingKey(row, 'phase_advising')"
                    @toggle="(val: boolean) => toggle(row, 'phase_advising', val)"
                />
            </template>

            <template #cell-enrollment="{ row }">
                <PhaseSwitch
                    :value="row.phaseEnrollment"
                    :saving="savingKey(row, 'phase_enrollment')"
                    @toggle="(val: boolean) => toggle(row, 'phase_enrollment', val)"
                />
            </template>

            <template #cell-add_drop="{ row }">
                <PhaseSwitch
                    :value="row.phaseAddDrop"
                    :saving="savingKey(row, 'phase_add_drop')"
                    @toggle="(val: boolean) => toggle(row, 'phase_add_drop', val)"
                />
            </template>
        </DataTable>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, h, defineComponent } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import { useDataTableFetch } from '@/app/components/ui/datatable/useDataTableFetch'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'
import type { AdvisingPhase } from '@/modules/advising/types/advising.type'

interface Row {
    id: number
    collegeAcademicPeriodId: number
    modalityId: number
    period: { id: number; name: string; shortName: string; status: string } | null
    modality: {
        id: number
        modalityType: { id: number; name: string; shortName: string } | null
        campus: { id: number; name: string; shortName: string } | null
    } | null
    phaseSchedulePublished: boolean
    phaseAdvising: boolean
    phaseEnrollment: boolean
    phaseAddDrop: boolean
}

const columns: DataTableColumn<Row>[] = [
    { key: 'id',         label: '#', field: 'id', sortable: true },
    { key: 'period',     label: 'PERIODO' },
    { key: 'modality',   label: 'MODALIDAD' },
    { key: 'published',  label: 'HORARIOS' },
    { key: 'advising',   label: 'ASESORÍA' },
    { key: 'enrollment', label: 'REINSCRIPCIÓN' },
    { key: 'add_drop',   label: 'ALTAS Y BAJAS' },
]

const includeArchived = ref(false)
const extraSearch = computed<Record<string, any>>(() =>
    includeArchived.value ? { include_archived: 1 } : {},
)

const { rows, loading, pagination, handleChange, fetchData } = useDataTableFetch<Row>({
    endpoint: API.ADVISING_API.phases.list,
    extraSearch,
})
fetchData()

function onToggleArchived() {
    pagination.value.page = 1
    fetchData()
}

const errorMsg = ref('')
const okMsg    = ref('')
/** rowId+phase => true mientras se está guardando ese toggle */
const savingMap = ref<Record<string, boolean>>({})

function savingKey(row: Row, phase: AdvisingPhase): boolean {
    return !!savingMap.value[`${row.id}:${phase}`]
}

function periodStatusLabel(s?: string): string {
    if (!s) return '—'
    return ({
        draft: 'BORRADOR', planned: 'PLANEADO', active: 'ACTIVO',
        closed: 'CERRADO', archived: 'ARCHIVADO',
    } as Record<string, string>)[s] ?? s.toUpperCase()
}

async function toggle(row: Row, phase: AdvisingPhase, newValue: boolean) {
    const key = `${row.id}:${phase}`
    savingMap.value[key] = true
    errorMsg.value = ''
    okMsg.value    = ''
    try {
        await api.post(API.ADVISING_API.phases.toggle, {
            college_academic_period_id: row.collegeAcademicPeriodId,
            modality_id:                row.modalityId,
            phase,
            new_value:                  newValue,
        })
        // Update inline para reflejar el cambio sin re-fetch.
        if (phase === 'phase_advising')   row.phaseAdvising = newValue
        if (phase === 'phase_enrollment') row.phaseEnrollment = newValue
        if (phase === 'phase_add_drop')   row.phaseAddDrop = newValue
        okMsg.value = 'Fase actualizada.'
        setTimeout(() => okMsg.value = '', 1500)
    } catch (e: any) {
        const violations = e?.response?.data?.context?.violations
        errorMsg.value = Array.isArray(violations) && violations[0]?.message
            ? violations[0].message
            : (e?.response?.data?.message ?? 'Error al actualizar fase.')
    } finally {
        delete savingMap.value[key]
    }
}

const PhaseSwitch = defineComponent({
    props: {
        value:    { type: Boolean, required: true },
        disabled: { type: Boolean, default: false },
        saving:   { type: Boolean, default: false },
    },
    emits: ['toggle'],
    setup(props, { emit }) {
        return () => h('div', { class: 'flex items-center gap-2' }, [
            h('button', {
                type: 'button',
                disabled: props.disabled || props.saving,
                class: [
                    'relative inline-flex h-6 w-11 items-center rounded-full transition disabled:opacity-40 disabled:cursor-not-allowed',
                    props.value ? 'bg-emerald-500' : 'bg-slate-300',
                ],
                onClick: () => emit('toggle', !props.value),
            }, [
                h('span', {
                    class: [
                        'inline-block h-4 w-4 transform rounded-full bg-white transition',
                        props.value ? 'translate-x-6' : 'translate-x-1',
                    ],
                }),
            ]),
            props.saving ? h('span', { class: 'text-[10px] text-slate-400' }, '…') : null,
        ])
    },
})
</script>
