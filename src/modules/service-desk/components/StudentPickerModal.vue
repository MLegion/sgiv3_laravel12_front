<template>
    <BaseModal :model-value="open" size="2xl" @update:model-value="close">
        <template #header>
            <div>
                <h2 class="text-sm font-bold text-slate-800 uppercase tracking-wide">Buscar estudiante</h2>
                <p class="text-[11px] text-slate-400">Filtra y selecciona al estudiante para la constancia.</p>
            </div>
        </template>

            <!-- Filtros -->
            <div class="px-5 py-3 border-b bg-white">
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2">
                    <div class="lg:col-span-2">
                        <input v-model="search" @input="debouncedFetch" type="search" placeholder="Nombre, núm. control, CURP…"
                            aria-label="Buscar estudiante" class="w-full rounded-lg border-slate-300 text-sm" />
                    </div>
                    <select v-model="filters.campusId" @change="onFilterChange" aria-label="Campus" class="rounded-lg border-slate-300 text-sm">
                        <option :value="null">Campus</option>
                        <option v-for="c in campuses" :key="c.id" :value="c.id">{{ c.name ?? c.shortName }}</option>
                    </select>
                    <select v-model="filters.modalityTypeId" @change="onFilterChange" aria-label="Modalidad" class="rounded-lg border-slate-300 text-sm">
                        <option :value="null">Modalidad</option>
                        <option v-for="m in modalityTypes" :key="m.id" :value="m.id">{{ m.name }}</option>
                    </select>
                    <select v-model="filters.careerId" @change="onFilterChange" aria-label="Carrera" class="rounded-lg border-slate-300 text-sm">
                        <option :value="null">Carrera</option>
                        <option v-for="c in careers" :key="c.id" :value="c.id">{{ c.name }}</option>
                    </select>
                    <select v-model="filters.studentStatusId" @change="onFilterChange" aria-label="Estatus" class="rounded-lg border-slate-300 text-sm">
                        <option :value="null">Estatus</option>
                        <option v-for="s in studentStatuses" :key="s.id" :value="s.id">{{ s.name }}</option>
                    </select>
                </div>
                <div v-if="hasActiveFilters" class="flex justify-end mt-2">
                    <button class="text-xs text-blue-600 hover:underline" @click="clearFilters">Limpiar filtros</button>
                </div>
            </div>

            <!-- Lista -->
            <div class="flex-1 overflow-auto">
                <DataTable :columns="columns" :rows="items" :loading="loading" hide-search caption="Estudiantes" empty-text="No se encontraron estudiantes con esos filtros.">
                    <template #cell-numControl="{ row: s }"><span class="font-mono text-xs font-bold text-slate-700">{{ s.numControl ?? '—' }}</span></template>
                    <template #cell-name="{ row: s }"><span class="font-medium text-slate-800">{{ fullName(s) }}</span></template>
                    <template #cell-career="{ row: s }"><span class="text-xs text-slate-600">{{ careerOf(s) }}</span></template>
                    <template #cell-status="{ row: s }">
                        <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase" :class="statusClass(statusOf(s))">{{ statusOf(s) ?? '—' }}</span>
                    </template>
                    <template #cell-actions="{ row: s }">
                        <button class="px-3 py-1 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700" @click.stop="pick(s)">Seleccionar</button>
                    </template>
                </DataTable>
            </div>

            <!-- Paginación -->
            <div v-if="!loading && items.length" class="flex items-center justify-between px-5 py-2.5 border-t bg-slate-50 text-xs text-slate-500">
                <span>Página {{ page }} de {{ lastPage }} ({{ total }})</span>
                <div class="flex gap-1">
                    <button aria-label="Página anterior" class="px-2.5 py-1 rounded border bg-white disabled:opacity-40" :disabled="page <= 1" @click="changePage(page - 1)">‹</button>
                    <button aria-label="Página siguiente" class="px-2.5 py-1 rounded border bg-white disabled:opacity-40" :disabled="page >= lastPage" @click="changePage(page + 1)">›</button>
                </div>
            </div>
    </BaseModal>
</template>

<script setup lang="ts">
import { reactive, ref, computed, watch } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import BaseModal from '@/app/components/ui/modal/BaseModal.vue'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'

const columns: DataTableColumn<any>[] = [
    { key: 'numControl', label: 'No. Control' },
    { key: 'name', label: 'Nombre' },
    { key: 'career', label: 'Carrera' },
    { key: 'status', label: 'Estatus' },
    { key: 'actions', label: '', align: 'right' },
]

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'select', student: any): void }>()

const loading = ref(false)
const items = ref<any[]>([])
const search = ref('')
const page = ref(1)
const total = ref(0)
const lastPage = ref(1)

const filters = reactive({
    campusId: null as number | null,
    modalityTypeId: null as number | null,
    careerId: null as number | null,
    studentStatusId: null as number | null,
})

const campuses = ref<any[]>([])
const modalityTypes = ref<any[]>([])
const careers = ref<any[]>([])
const studentStatuses = ref<any[]>([])
let catalogsLoaded = false

const hasActiveFilters = computed(() =>
    filters.campusId || filters.modalityTypeId || filters.careerId || filters.studentStatusId || search.value.trim(),
)

let debounceTimer: ReturnType<typeof setTimeout> | null = null
function debouncedFetch() {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => { page.value = 1; fetchStudents() }, 350)
}
function onFilterChange() { page.value = 1; fetchStudents() }
function changePage(p: number) { page.value = p; fetchStudents() }
function clearFilters() {
    filters.campusId = filters.modalityTypeId = filters.careerId = filters.studentStatusId = null
    search.value = ''
    page.value = 1
    fetchStudents()
}

function fullName(s: any) {
    return `${s.names ?? ''} ${s.firstSurname ?? ''} ${s.secondSurname ?? ''}`.trim() || '—'
}
function activeAff(s: any) {
    if (!s.affiliations?.length) return null
    return s.affiliations.find((a: any) => !a.studentStatus?.isBaja) ?? s.affiliations[s.affiliations.length - 1]
}
function careerOf(s: any) {
    const a = activeAff(s)
    return a?.studyPlan?.careerName ?? a?.studyPlan?.name ?? '—'
}
function statusOf(s: any) {
    return activeAff(s)?.studentStatus?.name ?? null
}
function statusClass(name?: string | null) {
    if (!name) return 'bg-slate-100 text-slate-500'
    const n = name.toUpperCase()
    if (n.includes('BAJA')) return 'bg-red-100 text-red-700'
    if (n.includes('EGRES')) return 'bg-purple-100 text-purple-700'
    if (n.includes('TITULAD')) return 'bg-green-100 text-green-700'
    return 'bg-blue-100 text-blue-700'
}

async function loadCatalogs() {
    if (catalogsLoaded) return
    try {
        const [c, m, ca, ss] = await Promise.all([
            api.get(API.SCHOOL_SERVICES_API.campuses.list, { params: { per_page: 100 } }),
            api.get(API.SUPERADMIN_API.modalityTypes.list, { params: { per_page: 100 } }),
            api.get(API.SUPERADMIN_API.careers.list, { params: { per_page: 200 } }),
            api.get(API.SCHOOL_SERVICES_API.studentStatuses.list, { params: { per_page: 100 } }),
        ])
        campuses.value = c.data?.items ?? c.data ?? []
        modalityTypes.value = m.data?.items ?? m.data ?? []
        careers.value = ca.data?.items ?? ca.data ?? []
        studentStatuses.value = ss.data?.items ?? ss.data ?? []
        catalogsLoaded = true
    } catch { /* catálogos opcionales */ }
}

async function fetchStudents() {
    loading.value = true
    try {
        const params: Record<string, any> = { page: page.value, per_page: 15 }
        const searchObj: Record<string, any> = {}
        const term = search.value.trim()
        if (term) {
            searchObj.names = term; searchObj.first_surname = term; searchObj.second_surname = term
            searchObj.email = term; searchObj.curp = term; searchObj.num_control = term
        }
        if (filters.campusId) searchObj.campus_id = filters.campusId
        if (filters.modalityTypeId) searchObj.modality_type_id = filters.modalityTypeId
        if (filters.careerId) searchObj.career_id = filters.careerId
        if (filters.studentStatusId) searchObj.student_status_id = filters.studentStatusId
        if (Object.keys(searchObj).length) params.search = searchObj

        const { data } = await api.get(API.SCHOOL_SERVICES_API.students.list, { params })
        items.value = data.items ?? []
        total.value = data.total ?? 0
        lastPage.value = data.lastPage ?? 1
    } catch { items.value = []; total.value = 0; lastPage.value = 1 }
    finally { loading.value = false }
}

function pick(s: any) { emit('select', s) }
function close() { emit('close') }

watch(() => props.open, async (isOpen) => {
    if (isOpen) { await loadCatalogs(); if (!items.value.length) fetchStudents() }
})
</script>
