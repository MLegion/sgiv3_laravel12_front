<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Oferta Académica</h1>
            <button
                type="button"
                class="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                @click="router.push({ name: 'school-services.academic-offers.create' })"
            >
                <PlusIcon class="w-4 h-4" />
                REGISTRAR OFERTA
            </button>
        </div>

        <div class="bg-white rounded-lg shadow p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <label class="block">
                <span class="text-[10px] font-black uppercase tracking-wider text-slate-400">Campus</span>
                <select
                    v-model="selectedCampusId"
                    @change="onFilterChange"
                    class="mt-1 w-full border-2 rounded-lg px-3 py-2 text-sm border-slate-200 focus:border-blue-500 outline-none"
                >
                    <option :value="null">TODOS</option>
                    <option v-for="c in campuses" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
            </label>
            <label class="block">
                <span class="text-[10px] font-black uppercase tracking-wider text-slate-400">Tipo de modalidad</span>
                <select
                    v-model="selectedModalityTypeId"
                    @change="onFilterChange"
                    class="mt-1 w-full border-2 rounded-lg px-3 py-2 text-sm border-slate-200 focus:border-blue-500 outline-none"
                >
                    <option :value="null">TODOS</option>
                    <option v-for="t in modalityTypes" :key="t.id" :value="t.id">{{ t.name }}</option>
                </select>
            </label>
        </div>

        <div v-if="!bothFiltersSelected" class="bg-white border rounded-xl p-8 text-center text-sm text-slate-400 italic">
            Selecciona un campus y un tipo de modalidad para ver las ofertas.
        </div>

        <DataTable
            v-else
            :columns="columns"
            :rows="rows"
            :loading="loading"
            :pagination="pagination"
            @change="handleChange"
        >
            <template #cell-career="{ row }">
                {{ row.career?.name ?? '-' }}
            </template>

            <template #cell-modality="{ row }">
                {{ row.modality?.modalityType?.name ?? '-' }}
            </template>

            <template #cell-campus="{ row }">
                {{ row.modality?.campus?.name ?? '-' }}
            </template>

            <template #cell-study_plans_count="{ row }">
                <span class="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 text-xs font-bold rounded-full"
                    :class="(row.studyPlansCount ?? 0) > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'">
                    {{ row.studyPlansCount ?? 0 }}
                </span>
            </template>

            <template #cell-status="{ row }">
                <span class="px-2 py-1 text-xs font-semibold rounded-full" :class="row.status === 1 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'">
                    {{ row.status === 1 ? 'ACTIVA' : 'INACTIVA' }}
                </span>
            </template>

            <template #cell-opciones="{ row }">
                <div class="flex items-center justify-center gap-2">
                    <button type="button" class="border p-1.5 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer" title="Ver"
                        @click="router.push({ name: 'school-services.academic-offers.show', params: { id: row.id } })">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12s3.75-7.5 9.75-7.5S21.75 12 21.75 12s-3.75 7.5-9.75 7.5S2.25 12 2.25 12z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </button>
                    <button type="button" class="border p-1.5 rounded-md text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer" title="Editar"
                        @click="router.push({ name: 'school-services.academic-offers.edit', params: { id: row.id } })">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l2.651 2.651M7.5 13.85l-.75 3.75 3.75-.75L19.513 7.138a2.121 2.121 0 00-3-3L7.5 13.85z" /></svg>
                    </button>
                    <button type="button" class="border p-1.5 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 transition cursor-pointer" title="Eliminar"
                        @click="router.push({ name: 'school-services.academic-offers.delete', params: { id: row.id } })">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M6 7.5h12m-10.5 0v10.125A1.875 1.875 0 009.375 19.5h5.25A1.875 1.875 0 0016.5 17.625V7.5M9.75 4.875A1.875 1.875 0 0111.625 3h.75A1.875 1.875 0 0114.25 4.875L15 7.5h-6l.75-2.625z" /></svg>
                    </button>
                </div>
            </template>
        </DataTable>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { PlusIcon } from '@heroicons/vue/24/outline'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import { useDataTableFetch } from '@/app/components/ui/datatable/useDataTableFetch'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { AcademicOfferType } from '@/modules/school-services/types/academic-offer.type'

const router = useRouter()

const columns: DataTableColumn<AcademicOfferType>[] = [
    { key: 'id',                 label: '#',                field: 'id',       sortable: true },
    { key: 'career',             label: 'CARRERA',          field: 'careerId' },
    { key: 'modality',           label: 'MODALIDAD',        field: 'modalityId' },
    { key: 'campus',             label: 'PLANTEL',          field: 'modalityId' },
    { key: 'study_plans_count',  label: 'PLANES VINCULADOS' },
    { key: 'status',             label: 'ESTADO' },
    { key: 'opciones',           label: 'OPCIONES' },
]

/* ---------- Filtros ---------- */
interface Catalog { id: number; name: string }
const campuses       = ref<Catalog[]>([])
const modalityTypes  = ref<Catalog[]>([])

/* Persistencia en sessionStorage para no perder filtros al navegar a
   create/delete de plan y regresar. */
const FILTERS_KEY = 'sgiv3:academic-offers-page:filters'
function loadSavedFilters(): { campusId: number | null; modalityTypeId: number | null } {
    try {
        const raw = sessionStorage.getItem(FILTERS_KEY)
        if (!raw) return { campusId: null, modalityTypeId: null }
        const parsed = JSON.parse(raw)
        return {
            campusId:       typeof parsed?.campusId === 'number' ? parsed.campusId : null,
            modalityTypeId: typeof parsed?.modalityTypeId === 'number' ? parsed.modalityTypeId : null,
        }
    } catch {
        return { campusId: null, modalityTypeId: null }
    }
}
const saved = loadSavedFilters()
const selectedCampusId       = ref<number | null>(saved.campusId)
const selectedModalityTypeId = ref<number | null>(saved.modalityTypeId)

function persistFilters() {
    sessionStorage.setItem(FILTERS_KEY, JSON.stringify({
        campusId:       selectedCampusId.value,
        modalityTypeId: selectedModalityTypeId.value,
    }))
}

const bothFiltersSelected = computed(
    () => !!selectedCampusId.value && !!selectedModalityTypeId.value
)

const extraSearch = computed<Record<string, any>>(() => {
    const s: Record<string, any> = {}
    if (selectedCampusId.value)       s.campus_id        = selectedCampusId.value
    if (selectedModalityTypeId.value) s.modality_type_id = selectedModalityTypeId.value
    return s
})

const { rows, loading, pagination, handleChange, fetchData } = useDataTableFetch<AcademicOfferType>({
    endpoint: API.SCHOOL_SERVICES_API.academicOffers.list,
    extraSearch,
})

function onFilterChange() {
    persistFilters()
    if (!bothFiltersSelected.value) {
        rows.value = []
        pagination.value.total = 0
        return
    }
    pagination.value.page = 1
    fetchData()
}

async function loadCatalogs() {
    try {
        const [c, t] = await Promise.all([
            api.get(API.SCHOOL_SERVICES_API.campuses.list, { params: { per_page: 500, status: 1 } }),
            api.get(API.SUPERADMIN_API.modalityTypes.list, { params: { per_page: 100 } }),
        ])
        campuses.value      = c.data?.items ?? c.data?.data ?? c.data ?? []
        modalityTypes.value = t.data?.items ?? t.data?.data ?? t.data ?? []
    } catch {
        campuses.value = []
        modalityTypes.value = []
    }
}

onMounted(async () => {
    await loadCatalogs()
    // Si el usuario ya tenía filtros guardados, disparar el fetch automáticamente.
    if (bothFiltersSelected.value) {
        fetchData()
    }
})
</script>
