<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">Programas de estudio</h1>
            <button
                type="button"
                class="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                @click="router.push({ name: 'study-programs.create' })"
            >
                <PlusIcon class="w-4 h-4" />
                NUEVO PROGRAMA
            </button>
        </div>

        <DataTable
            :columns="columns"
            :rows="rows"
            :loading="loading"
            :pagination="pagination"
            @change="handleChange"
        >
            <template #cell-clave="{ row }">
                {{ row.claveNormalized }}
            </template>

            <template #cell-status="{ row }">
                <span class="px-2 py-1 text-xs font-semibold rounded-full" :class="statusClass(row.approvalStatus)">
                    {{ statusLabel(row.approvalStatus) }}
                </span>
            </template>

            <template #cell-opciones="{ row }">
                <div class="flex items-center justify-center gap-2">
                    <button :aria-label="row.subject.programFilePath ? 'Abrir PDF del programa (respaldado)' : 'Abrir enlace al programa'"
                        v-if="row.subject && (row.subject.programFilePath || row.subject.programUrl)"
                        type="button"
                        class="border p-1.5 rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer disabled:opacity-50"
                        :disabled="openingPdfId === row.id"
                        :title="row.subject.programFilePath ? 'Abrir PDF del programa (respaldado)' : 'Abrir enlace al programa'"
                        @click="openPdf(row)"
                    >
                        <DocumentTextIcon class="w-4 h-4" />
                    </button>
                    <button aria-label="Editar" type="button" class="border p-1.5 rounded-md text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer" title="Editar"
                        @click="router.push({ name: 'study-programs.edit', params: { id: row.id } })">
                        <PencilSquareIcon class="w-4 h-4" />
                    </button>
                    <!-- Flujo de aprobación -->
                    <button aria-label="Enviar a revisión" v-if="row.approvalStatus === 'draft' || row.approvalStatus === 'rejected'" type="button"
                        class="border p-1.5 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                        title="Enviar a revisión" @click="openAction('submit', row)">
                        <PaperAirplaneIcon class="w-4 h-4" />
                    </button>
                    <button aria-label="Aprobar" v-if="row.approvalStatus === 'pending'" type="button"
                        class="border p-1.5 rounded-md text-slate-500 hover:text-green-600 hover:bg-green-50 transition cursor-pointer"
                        title="Aprobar" @click="openAction('approve', row)">
                        <CheckIcon class="w-4 h-4" />
                    </button>
                    <button aria-label="Rechazar" v-if="row.approvalStatus === 'pending'" type="button"
                        class="border p-1.5 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                        title="Rechazar" @click="openAction('reject', row)">
                        <XMarkIcon class="w-4 h-4" />
                    </button>
                </div>
            </template>
        </DataTable>

        <!-- Modal de flujo (enviar / aprobar / rechazar) -->
        <div v-if="action.open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/30" @click.self="action.open = false">
            <div class="bg-white rounded-lg shadow-lg w-full max-w-md p-4 space-y-3">
                <h3 class="font-semibold text-slate-800">{{ actionTitle }}</h3>
                <p class="text-sm text-slate-600">{{ actionMessage }}</p>
                <div v-if="action.mode === 'reject'">
                    <label class="block text-xs text-slate-500 mb-1">Motivo del rechazo</label>
                    <textarea v-model="action.notes" rows="3" class="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" placeholder="Explica por qué se rechaza…"></textarea>
                </div>
                <p v-if="action.error" class="text-sm text-red-600">{{ action.error }}</p>
                <div class="flex justify-end gap-2 pt-1">
                    <button type="button" class="px-3 py-1.5 text-sm rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50" @click="action.open = false">Cancelar</button>
                    <button type="button" class="px-3 py-1.5 text-sm rounded-lg text-white disabled:opacity-50" :class="confirmBtnClass"
                        :disabled="action.busy || (action.mode === 'reject' && !action.notes.trim())" @click="confirmAction">
                        {{ action.busy ? 'Procesando…' : confirmLabel }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { PlusIcon, PencilSquareIcon, DocumentTextIcon, PaperAirplaneIcon, CheckIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import { useDataTableFetch } from '@/app/components/ui/datatable/useDataTableFetch'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'
import { API } from '@/shared/api'
import { api } from '@/shared/services/api'
import { openSubjectProgram } from '@/modules/study-programs/composables/useSubjectProgram'

const router = useRouter()

// Flujo de aprobación (enviar a revisión / aprobar / rechazar) vía modal inline.
type ActionMode = 'submit' | 'approve' | 'reject'
const action = reactive<{ open: boolean; mode: ActionMode; row: any; notes: string; busy: boolean; error: string }>(
    { open: false, mode: 'submit', row: null, notes: '', busy: false, error: '' },
)
const actionTitle = computed(() => ({ submit: 'Enviar a revisión', approve: 'Aprobar programa', reject: 'Rechazar programa' }[action.mode]))
const actionMessage = computed(() => ({
    submit: `Se enviará a revisión "${action.row?.name ?? ''}". Quedará EN REVISIÓN.`,
    approve: `Se aprobará "${action.row?.name ?? ''}". Quedará APROBADO.`,
    reject: `Se rechazará "${action.row?.name ?? ''}".`,
}[action.mode]))
const confirmLabel = computed(() => ({ submit: 'Enviar', approve: 'Aprobar', reject: 'Rechazar' }[action.mode]))
const confirmBtnClass = computed(() => ({
    submit: 'bg-blue-600 hover:bg-blue-700', approve: 'bg-green-600 hover:bg-green-700', reject: 'bg-red-600 hover:bg-red-700',
}[action.mode]))

function openAction(mode: ActionMode, row: any): void {
    Object.assign(action, { open: true, mode, row, notes: '', busy: false, error: '' })
}

async function confirmAction(): Promise<void> {
    action.busy = true
    action.error = ''
    try {
        const id = action.row.id
        if (action.mode === 'submit') {
            await api.patch(API.STUDY_PROGRAMS_API.studyPrograms.submit(id))
        } else {
            await api.patch(API.STUDY_PROGRAMS_API.studyPrograms.approve(id), {
                approved: action.mode === 'approve',
                notes: action.mode === 'reject' ? action.notes : null,
            })
        }
        action.open = false
        fetchData()
    } catch (e: any) {
        action.error = e?.response?.data?.message ?? 'No se pudo completar la acción (¿permiso?).'
    } finally {
        action.busy = false
    }
}

const openingPdfId = ref<number | null>(null)

async function openPdf(row: any): Promise<void> {
    if (!row.subject?.id) return
    openingPdfId.value = row.id
    try {
        await openSubjectProgram(row.subject.id, !!row.subject.programFilePath, row.subject.programUrl)
    } finally {
        openingPdfId.value = null
    }
}

const columns: DataTableColumn<any>[] = [
    { key: 'id',        label: '#',       field: 'id', sortable: true },
    { key: 'clave',     label: 'CLAVE',   field: 'clave_normalized', searchable: true },
    { key: 'name',      label: 'NOMBRE',  field: 'name', searchable: true },
    { key: 'status',    label: 'ESTADO' },
    { key: 'opciones',  label: 'OPCIONES' },
]

const { rows, loading, pagination, handleChange, fetchData } = useDataTableFetch<any>({
    endpoint: API.STUDY_PROGRAMS_API.studyPrograms.list,
})

function statusLabel(s: string): string {
    return ({ draft: 'BORRADOR', pending: 'EN REVISIÓN', approved: 'APROBADO', rejected: 'RECHAZADO' } as Record<string, string>)[s] ?? s
}
function statusClass(s: string): string {
    return ({
        draft: 'bg-slate-100 text-slate-600',
        pending: 'bg-amber-100 text-amber-700',
        approved: 'bg-green-100 text-green-700',
        rejected: 'bg-red-100 text-red-700',
    } as Record<string, string>)[s] ?? 'bg-slate-100 text-slate-600'
}

fetchData()
</script>
