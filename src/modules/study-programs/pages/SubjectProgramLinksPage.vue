<template>
    <div class="space-y-4">
        <div>
            <h1 class="text-xl font-semibold text-slate-800">Enlaces de programas de estudio</h1>
            <p class="text-sm text-slate-500 mt-1">
                Materias activas en la currícula de planes activos. Asigna el programa oficial:
                pega un enlace (preferir <code>tecnm.mx</code>) o sube el PDF (queda respaldado en el sistema).
                Usa "Buscar en web" para las de especialidad que faltan.
            </p>
        </div>

        <div class="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center gap-3">
            <input
                v-model="search"
                type="text"
                aria-label="Buscar materia o programa"
                placeholder="Filtrar por clave o nombre…"
                class="w-72 px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <label class="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" v-model="onlyMissing" /> Solo sin programa
            </label>
            <label class="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" v-model="onlyActiveStudents" /> Solo con estudiantes activos
            </label>
            <span class="ml-auto text-xs text-slate-400">
                {{ filtered.length }} de {{ rows.length }} · con programa: {{ linkedCount }}
            </span>
        </div>

        <DataTable :columns="linkColumns" :rows="filtered" :loading="loading" hide-search caption="Enlaces de programas de estudio" empty-text="No se encontraron materias.">
            <template #cell-clave="{ row: r }"><span class="font-mono">{{ r.clave }}</span></template>
            <template #cell-name="{ row: r }">{{ r.name }}</template>
            <template #cell-students="{ row: r }">
                <span v-if="r.hasActiveStudents" class="px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700">Sí</span>
                <span v-else class="text-slate-300">—</span>
            </template>
            <template #cell-program="{ row: r }">
                <button v-if="r.programIsLocal" class="text-emerald-700 hover:underline" @click="view(r)">
                    Ver PDF <span class="text-[10px] text-emerald-600">(respaldado)</span>
                </button>
                <a v-else-if="r.programUrl" :href="r.programUrl" target="_blank" rel="noopener" class="text-blue-600 hover:underline break-all">Abrir enlace</a>
                <span v-else-if="r.checked" class="text-amber-600 text-xs">Sin programa (revisado)</span>
                <span v-else class="text-slate-400 text-xs">Pendiente</span>
            </template>
            <template #cell-actions="{ row: r }">
                <div class="flex items-center justify-end gap-2">
                    <a
                        :href="googleUrl(r)"
                        target="_blank"
                        rel="noopener"
                        class="px-2 py-1 text-xs rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50"
                    >Buscar en web</a>
                    <button
                        class="px-2 py-1 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                        @click="manage(r)"
                    >Gestionar</button>
                </div>
            </template>
        </DataTable>

        <SubjectProgramModal
            v-if="current"
            v-model="modalOpen"
            :subject-id="current.id"
            :subject-code="current.clave"
            :subject-name="current.name"
            :program-url="current.programUrl"
            :program-is-local="current.programIsLocal"
            @changed="onChanged"
        />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import SubjectProgramModal from '@/modules/study-programs/components/SubjectProgramModal.vue'
import { openSubjectProgram } from '@/modules/study-programs/composables/useSubjectProgram'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'

const linkColumns: DataTableColumn<any>[] = [
    { key: 'clave', label: 'Clave' },
    { key: 'name', label: 'Materia' },
    { key: 'students', label: 'Alumnos', align: 'center' },
    { key: 'program', label: 'Programa oficial' },
    { key: 'actions', label: 'Acciones', align: 'right' },
]

const rows = ref<any[]>([])
const loading = ref(false)
const search = ref('')
const onlyMissing = ref(false)
const onlyActiveStudents = ref(false)

const modalOpen = ref(false)
const current = ref<any | null>(null)

const linkedCount = computed(() => rows.value.filter(r => r.programUrl || r.programIsLocal).length)

const filtered = computed(() => {
    const q = search.value.trim().toLowerCase()
    return rows.value.filter(r =>
        (!onlyMissing.value || (!r.programUrl && !r.programIsLocal)) &&
        (!onlyActiveStudents.value || r.hasActiveStudents) &&
        (!q || r.clave.toLowerCase().includes(q) || (r.name ?? '').toLowerCase().includes(q))
    )
})

function googleUrl(r: any): string {
    const q = `${r.clave} ${r.name} programa de estudio TecNM pdf`
    return `https://www.google.com/search?q=${encodeURIComponent(q)}`
}

function manage(r: any) {
    current.value = r
    modalOpen.value = true
}

async function view(r: any) {
    await openSubjectProgram(r.id, !!r.programIsLocal, r.programUrl)
}

function onChanged(v: { programUrl: string | null; programIsLocal: boolean }) {
    if (!current.value) return
    current.value.programUrl = v.programUrl
    current.value.programIsLocal = v.programIsLocal
    current.value.checked = true
}

async function load() {
    loading.value = true
    try {
        const { data } = await api.get(API.STUDY_PROGRAMS_API.subjectLinks.list)
        rows.value = Array.isArray(data) ? data : (data.items ?? [])
    } finally {
        loading.value = false
    }
}

onMounted(load)
</script>
