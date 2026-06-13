<template>
    <div class="space-y-5">

        <!-- Encabezado -->
        <div class="flex items-start justify-between flex-wrap gap-3">
            <div>
                <h1 class="text-xl font-semibold text-slate-800 uppercase">Estudiantes</h1>
                <p class="mt-1 text-sm text-slate-500">Lista de estudiantes inscritos en la institución.</p>
            </div>
        </div>

        <!-- Filtros -->
        <div class="bg-white border rounded-xl shadow-sm p-4 space-y-3">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                <div class="xl:col-span-2">
                    <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Buscar</label>
                    <input
                        v-model="search"
                        type="text"
                        placeholder="Nombre, CURP, email, num. control..."
                        class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        @input="debouncedFetch"
                    />
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Campus</label>
                    <select v-model="filters.campusId" @change="onFilterChange"
                            class="w-full border border-slate-200 rounded-lg px-2 py-2 text-sm">
                        <option :value="null">Todos</option>
                        <option v-for="c in campuses" :key="c.id" :value="c.id">{{ c.shortName ?? c.name }}</option>
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Modalidad</label>
                    <select v-model="filters.modalityTypeId" @change="onFilterChange"
                            class="w-full border border-slate-200 rounded-lg px-2 py-2 text-sm">
                        <option :value="null">Todas</option>
                        <option v-for="m in modalityTypes" :key="m.id" :value="m.id">{{ m.shortName ?? m.name }}</option>
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Carrera</label>
                    <select v-model="filters.careerId" @change="onFilterChange"
                            class="w-full border border-slate-200 rounded-lg px-2 py-2 text-sm">
                        <option :value="null">Todas</option>
                        <option v-for="c in careers" :key="c.id" :value="c.id">{{ c.shortName ?? c.name }}</option>
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Estatus</label>
                    <select v-model="filters.studentStatusId" @change="onFilterChange"
                            class="w-full border border-slate-200 rounded-lg px-2 py-2 text-sm">
                        <option :value="null">Todos</option>
                        <option v-for="s in studentStatuses" :key="s.id" :value="s.id">{{ s.name }}</option>
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Semestre</label>
                    <select v-model.number="filters.semester" @change="onFilterChange"
                            class="w-full border border-slate-200 rounded-lg px-2 py-2 text-sm">
                        <option :value="null">Todos</option>
                        <option v-for="n in 12" :key="n" :value="n">{{ n }}°</option>
                    </select>
                </div>
            </div>
            <div v-if="hasActiveFilters" class="flex justify-end">
                <button class="text-xs text-blue-600 hover:underline" @click="clearFilters">Limpiar filtros</button>
            </div>
        </div>

        <!-- Cargando -->
        <div v-if="loading" class="flex justify-center py-12">
            <svg class="animate-spin w-8 h-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
        </div>

        <!-- Sin resultados -->
        <div v-else-if="items.length === 0" class="flex flex-col items-center justify-center py-16 text-slate-400 text-sm gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-10 h-10 opacity-40">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            No hay estudiantes registrados.
        </div>

        <!-- Tabla -->
        <div v-else class="bg-white border rounded-xl shadow-sm overflow-hidden">
            <table class="min-w-full text-sm">
                <thead class="bg-slate-50 border-b text-xs uppercase text-slate-500 font-semibold">
                    <tr>
                        <th scope="col" class="px-4 py-3 text-left">No. Control</th>
                        <th scope="col" class="px-4 py-3 text-left">Nombre</th>
                        <th scope="col" class="px-4 py-3 text-left">CURP</th>
                        <th scope="col" class="px-4 py-3 text-left">Carrera / Plan</th>
                        <th scope="col" class="px-4 py-3 text-left">Modalidad</th>
                        <th scope="col" class="px-4 py-3 text-left">Estatus</th>
                        <th scope="col" class="px-4 py-3 text-left">Semestre</th>
                        <th scope="col" class="px-4 py-3"></th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                    <tr v-for="s in items" :key="s.id" class="hover:bg-slate-50 transition">
                        <td class="px-4 py-3 font-mono text-xs font-bold text-slate-700">{{ s.numControl ?? '—' }}</td>
                        <td class="px-4 py-3 font-medium text-slate-800">
                            {{ s.names }} {{ s.firstSurname }} {{ s.secondSurname ?? '' }}
                        </td>
                        <td class="px-4 py-3 font-mono text-xs">{{ s.curp ?? '—' }}</td>
                        <td class="px-4 py-3 text-xs text-slate-600">
                            <template v-if="activeAffiliation(s)">
                                <div class="font-semibold text-slate-700">
                                    {{ activeAffiliation(s)?.studyPlan?.careerName ?? activeAffiliation(s)?.studyPlan?.name ?? '—' }}
                                </div>
                                <div v-if="activeAffiliation(s)?.studyPlan?.officialCode" class="font-mono text-[10px] text-slate-400">
                                    {{ activeAffiliation(s)?.studyPlan?.officialCode }}
                                </div>
                            </template>
                            <span v-else class="text-slate-400">—</span>
                        </td>
                        <td class="px-4 py-3 text-xs text-slate-600">
                            <template v-if="activeAffiliation(s)?.modality">
                                <div class="font-semibold text-slate-700">
                                    {{ activeAffiliation(s)?.modality?.modalityTypeName ?? '—' }}
                                </div>
                                <div class="text-[10px] text-slate-400">
                                    {{ activeAffiliation(s)?.modality?.campusName ?? '' }}
                                </div>
                            </template>
                            <span v-else class="text-slate-400">—</span>
                        </td>
                        <td class="px-4 py-3">
                            <span
                                v-if="activeAffiliation(s)"
                                class="px-2 py-0.5 rounded-full text-xs font-semibold uppercase"
                                :class="statusClass(activeAffiliation(s)?.studentStatus?.name)"
                            >
                                {{ activeAffiliation(s)?.studentStatus?.name ?? '—' }}
                            </span>
                            <span v-else class="text-slate-400 text-xs">—</span>
                        </td>
                        <td class="px-4 py-3 text-xs text-center">
                            {{ activeAffiliation(s)?.currentPeriodNumber ?? '—' }}
                        </td>
                        <td class="px-4 py-3 text-right">
                            <router-link
                                :to="{ name: 'school-services.students.show', params: { id: s.id } }"
                                class="text-blue-600 hover:underline text-xs font-semibold uppercase"
                            >
                                Ver
                            </router-link>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Paginación -->
        <div v-if="lastPage > 1" class="flex items-center justify-between text-sm text-slate-500">
            <span>Página {{ page }} de {{ lastPage }} ({{ total }} registros)</span>
            <div class="flex gap-2">
                <button
                    class="px-3 py-1.5 border rounded-lg hover:bg-slate-50 disabled:opacity-40"
                    :disabled="page <= 1"
                    @click="changePage(page - 1)"
                >Anterior</button>
                <button
                    class="px-3 py-1.5 border rounded-lg hover:bg-slate-50 disabled:opacity-40"
                    :disabled="page >= lastPage"
                    @click="changePage(page + 1)"
                >Siguiente</button>
            </div>
        </div>

    </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'

const loading  = ref(true)
const items    = ref<any[]>([])
const search   = ref('')
const page     = ref(1)
const total    = ref(0)
const lastPage = ref(1)

interface Filters {
    campusId: number | null
    modalityTypeId: number | null
    careerId: number | null
    studentStatusId: number | null
    semester: number | null
}
const filters = reactive<Filters>({
    campusId: null, modalityTypeId: null, careerId: null,
    studentStatusId: null, semester: null,
})

const campuses        = ref<any[]>([])
const modalityTypes   = ref<any[]>([])
const careers         = ref<any[]>([])
const studentStatuses = ref<any[]>([])

const hasActiveFilters = computed(() =>
    filters.campusId || filters.modalityTypeId || filters.careerId ||
    filters.studentStatusId || filters.semester || search.value.trim(),
)

let debounceTimer: ReturnType<typeof setTimeout> | null = null
function debouncedFetch() {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => { page.value = 1; fetchStudents() }, 350)
}

function onFilterChange() {
    page.value = 1
    fetchStudents()
}

function clearFilters() {
    filters.campusId = null
    filters.modalityTypeId = null
    filters.careerId = null
    filters.studentStatusId = null
    filters.semester = null
    search.value = ''
    page.value = 1
    fetchStudents()
}

async function loadCatalogs() {
    try {
        const [c, m, ca, ss] = await Promise.all([
            api.get(API.SCHOOL_SERVICES_API.campuses.list,        { params: { per_page: 100 } }),
            api.get(API.SUPERADMIN_API.modalityTypes.list,        { params: { per_page: 100 } }),
            api.get(API.SUPERADMIN_API.careers.list,              { params: { per_page: 200 } }),
            api.get(API.SCHOOL_SERVICES_API.studentStatuses.list, { params: { per_page: 100 } }),
        ])
        campuses.value        = c.data?.items ?? c.data ?? []
        modalityTypes.value   = m.data?.items ?? m.data ?? []
        careers.value         = ca.data?.items ?? ca.data ?? []
        studentStatuses.value = ss.data?.items ?? ss.data ?? []
    } catch (e) {
        console.warn('Error cargando catalogos de filtros', e)
    }
}

function activeAffiliation(s: any) {
    if (!s.affiliations?.length) return null
    return s.affiliations.find((a: any) => !a.studentStatus?.isBaja) ?? s.affiliations[s.affiliations.length - 1]
}

function statusClass(name?: string) {
    if (!name) return 'bg-slate-100 text-slate-500'
    const n = name.toUpperCase()
    if (n.includes('BAJA')) return 'bg-red-100 text-red-700'
    if (n.includes('EGRES')) return 'bg-purple-100 text-purple-700'
    if (n.includes('TITULAD')) return 'bg-green-100 text-green-700'
    return 'bg-blue-100 text-blue-700'
}

async function fetchStudents() {
    loading.value = true
    try {
        const params: Record<string, any> = { page: page.value, per_page: 25 }
        const searchObj: Record<string, any> = {}

        const term = search.value.trim()
        if (term) {
            // Texto: backend agrupa string fields en OR.
            searchObj.names          = term
            searchObj.first_surname  = term
            searchObj.second_surname = term
            searchObj.email          = term
            searchObj.curp           = term
            searchObj.num_control    = term
        }
        if (filters.campusId)         searchObj.campus_id             = filters.campusId
        if (filters.modalityTypeId)   searchObj.modality_type_id      = filters.modalityTypeId
        if (filters.careerId)         searchObj.career_id             = filters.careerId
        if (filters.studentStatusId)  searchObj.student_status_id     = filters.studentStatusId
        if (filters.semester)         searchObj.current_period_number = filters.semester

        if (Object.keys(searchObj).length > 0) params.search = searchObj

        const { data } = await api.get(API.SCHOOL_SERVICES_API.students.list, { params })
        items.value    = data.items ?? []
        total.value    = data.total ?? 0
        lastPage.value = data.lastPage ?? 1
    } finally {
        loading.value = false
    }
}

function changePage(p: number) { page.value = p; fetchStudents() }

onMounted(async () => {
    await loadCatalogs()
    await fetchStudents()
})
</script>
