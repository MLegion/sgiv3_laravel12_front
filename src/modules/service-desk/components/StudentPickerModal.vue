<template>
    <div v-if="open" class="fixed inset-0 z-[120] flex items-center justify-center p-4" @keydown.esc="close">
        <div class="absolute inset-0 bg-black/40" @click="close"></div>

        <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[88vh] flex flex-col overflow-hidden">
            <!-- Encabezado -->
            <div class="flex items-center justify-between px-5 py-3.5 border-b bg-slate-50">
                <div>
                    <h2 class="text-sm font-bold text-slate-800 uppercase tracking-wide">Buscar estudiante</h2>
                    <p class="text-[11px] text-slate-400">Filtra y selecciona al estudiante para la constancia.</p>
                </div>
                <button class="text-slate-400 hover:text-slate-600" @click="close" aria-label="Cerrar">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <!-- Filtros -->
            <div class="px-5 py-3 border-b bg-white">
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2">
                    <div class="lg:col-span-2">
                        <input v-model="search" @input="debouncedFetch" type="search" placeholder="Nombre, núm. control, CURP…"
                            class="w-full rounded-lg border-slate-300 text-sm" />
                    </div>
                    <select v-model="filters.campusId" @change="onFilterChange" class="rounded-lg border-slate-300 text-sm">
                        <option :value="null">Campus</option>
                        <option v-for="c in campuses" :key="c.id" :value="c.id">{{ c.name ?? c.shortName }}</option>
                    </select>
                    <select v-model="filters.modalityTypeId" @change="onFilterChange" class="rounded-lg border-slate-300 text-sm">
                        <option :value="null">Modalidad</option>
                        <option v-for="m in modalityTypes" :key="m.id" :value="m.id">{{ m.name }}</option>
                    </select>
                    <select v-model="filters.careerId" @change="onFilterChange" class="rounded-lg border-slate-300 text-sm">
                        <option :value="null">Carrera</option>
                        <option v-for="c in careers" :key="c.id" :value="c.id">{{ c.name }}</option>
                    </select>
                    <select v-model="filters.studentStatusId" @change="onFilterChange" class="rounded-lg border-slate-300 text-sm">
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
                <div v-if="loading" class="flex justify-center py-12">
                    <svg class="animate-spin w-7 h-7 text-blue-500" viewBox="0 0 24 24" fill="none">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                </div>
                <div v-else-if="items.length === 0" class="text-center text-slate-400 text-sm py-12">
                    No se encontraron estudiantes con esos filtros.
                </div>
                <table v-else class="min-w-full text-sm">
                    <thead class="bg-slate-50 border-b text-[10px] uppercase text-slate-400 font-semibold sticky top-0">
                        <tr>
                            <th class="px-4 py-2 text-left">No. Control</th>
                            <th class="px-4 py-2 text-left">Nombre</th>
                            <th class="px-4 py-2 text-left">Carrera</th>
                            <th class="px-4 py-2 text-left">Estatus</th>
                            <th class="px-4 py-2"></th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        <tr v-for="s in items" :key="s.id" class="hover:bg-blue-50/50 cursor-pointer" @click="pick(s)">
                            <td class="px-4 py-2 font-mono text-xs font-bold text-slate-700">{{ s.numControl ?? '—' }}</td>
                            <td class="px-4 py-2 font-medium text-slate-800">{{ fullName(s) }}</td>
                            <td class="px-4 py-2 text-xs text-slate-600">{{ careerOf(s) }}</td>
                            <td class="px-4 py-2">
                                <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase" :class="statusClass(statusOf(s))">{{ statusOf(s) ?? '—' }}</span>
                            </td>
                            <td class="px-4 py-2 text-right">
                                <button class="px-3 py-1 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700" @click.stop="pick(s)">Seleccionar</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Paginación -->
            <div v-if="!loading && items.length" class="flex items-center justify-between px-5 py-2.5 border-t bg-slate-50 text-xs text-slate-500">
                <span>Página {{ page }} de {{ lastPage }} ({{ total }})</span>
                <div class="flex gap-1">
                    <button class="px-2.5 py-1 rounded border bg-white disabled:opacity-40" :disabled="page <= 1" @click="changePage(page - 1)">‹</button>
                    <button class="px-2.5 py-1 rounded border bg-white disabled:opacity-40" :disabled="page >= lastPage" @click="changePage(page + 1)">›</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, watch } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'

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
