<template>
    <div class="space-y-4">
        <div>
            <h1 class="text-xl font-semibold text-slate-800">Planeación</h1>
            <p class="text-sm text-slate-500 mt-1">Tus asignaturas y grupos. Abre cada uno para gestionar su instrumentación didáctica.</p>
        </div>

        <!-- Filtros -->
        <div class="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-end gap-3">
            <div class="w-full sm:w-56">
                <FormSelect label="CAMPUS" v-model="campusFilter" :options="campusOptions" />
            </div>
            <div class="w-full sm:w-56">
                <FormSelect label="MODALIDAD" v-model="modalityFilter" :options="modalityOptions" />
            </div>
        </div>

        <SkeletonTable v-if="loading" :rows="5" :cols="6" />
        <DataTable v-else :columns="columns" :rows="filtered" hide-search caption="Planeación de asignaturas y grupos" empty-text="No hay asignaturas para los filtros seleccionados.">
            <template #cell-subject="{ row: a }">
                <div class="font-medium text-slate-700">{{ a.subjectName }}</div>
                <div class="text-xs text-slate-400">{{ a.subjectCode }}</div>
            </template>
            <template #cell-group="{ row: a }">{{ a.groupName }}</template>
            <template #cell-campus="{ row: a }">{{ a.campusName ?? '—' }}</template>
            <template #cell-modality="{ row: a }">{{ a.modalityName ?? '—' }}</template>
            <template #cell-period="{ row: a }">{{ a.periodShort ?? a.periodName }}</template>
            <template #cell-actions="{ row: a }">
                <div class="inline-flex items-center gap-2">
                    <button
                        v-if="a.programIsLocal || a.programExternalUrl"
                        class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                        @click="verPrograma(a)"
                    >
                        <DocumentTextIcon class="w-4 h-4" />
                        Ver programa
                    </button>
                    <span v-if="a.requiresInstrumentation === false"
                        class="inline-flex items-center px-3 py-1.5 text-xs rounded-lg bg-slate-100 text-slate-500 border border-slate-200"
                        title="Residencias, servicio social y actividades complementarias no llevan instrumentación didáctica">
                        No requiere instrumentación
                    </span>
                    <button v-else
                        class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg text-white"
                        :class="a.instrumentationId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'"
                        @click="openInstrumentacion(a)"
                    >
                        <component :is="a.instrumentationId ? ClipboardDocumentListIcon : PlusIcon" class="w-4 h-4" />
                        {{ a.instrumentationId ? 'Ver instrumentación' : 'Crear instrumentación' }}
                    </button>
                </div>
            </template>
        </DataTable>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ClipboardDocumentListIcon, PlusIcon, DocumentTextIcon } from '@heroicons/vue/24/outline'
import FormSelect from '@/app/components/ui/form/FormSelect.vue'
import SkeletonTable from '@/app/components/ui/SkeletonTable.vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { openSubjectProgram } from '@/modules/study-programs/composables/useSubjectProgram'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'

const columns: DataTableColumn<any>[] = [
    { key: 'subject', label: 'Asignatura' },
    { key: 'group', label: 'Grupo' },
    { key: 'campus', label: 'Campus' },
    { key: 'modality', label: 'Modalidad' },
    { key: 'period', label: 'Periodo' },
    { key: 'actions', label: '', align: 'right' },
]

const router = useRouter()
const assignments = ref<any[]>([])
const loading = ref(false)
const campusFilter = ref<any>(null)
const modalityFilter = ref<any>(null)

function uniqueOptions(key: 'campus' | 'modality') {
    const map = new Map<number, string>()
    for (const a of assignments.value) {
        const id = a[`${key}Id`]
        const name = a[`${key}Name`]
        if (id != null && name) map.set(id, name)
    }
    return [...map.entries()].map(([value, label]) => ({ value, label }))
}
const campusOptions = computed(() => uniqueOptions('campus'))
const modalityOptions = computed(() => uniqueOptions('modality'))

const filtered = computed(() =>
    assignments.value.filter(a =>
        (!campusFilter.value || a.campusId === Number(campusFilter.value)) &&
        (!modalityFilter.value || a.modalityId === Number(modalityFilter.value))
    )
)

async function verPrograma(a: any) {
    await openSubjectProgram(a.subjectId, !!a.programIsLocal, a.programExternalUrl)
}

function openInstrumentacion(a: any) {
    // Una asignatura tiene una instrumentación: si ya existe se abre para editar,
    // si no, se va directo a crearla (quedará ligada a esa asignatura).
    if (a.instrumentationId) {
        router.push({ name: 'teaching.planeacion.edit', params: { id: a.instrumentationId } })
    } else {
        router.push({ name: 'teaching.planeacion.create', query: { teacher_assignment_id: a.teacherAssignmentId } })
    }
}

onMounted(async () => {
    loading.value = true
    try {
        const { data } = await api.get(API.TEACHING_API.teacherPortal.myAssignments)
        assignments.value = Array.isArray(data) ? data : (data.items ?? [])
    } finally {
        loading.value = false
    }
})
</script>
