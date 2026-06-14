<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Aspirantes</h1>
            <button
                class="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                @click="router.push({ name: 'admissions.applicants.create' })"
            >
                <PlusIcon class="w-4 h-4" />
                REGISTRAR
            </button>
        </div>

        <div class="space-y-3">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <AdmissionPeriodSelector @change="onPeriodChange" />

                <button
                    type="button"
                    @click="toggleDocsFilter"
                    :class="docsToReview
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'"
                    class="inline-flex items-center gap-2 px-3.5 py-1.5 text-sm font-medium rounded-full border transition self-start sm:self-auto"
                    title="Mostrar solo aspirantes con documentos pendientes o rechazados"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" class="w-4 h-4">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                    Documentos por revisar
                    <span
                        v-if="docsCount > 0"
                        :class="docsToReview ? 'bg-white/25 text-white' : 'bg-amber-100 text-amber-700'"
                        class="px-1.5 py-0.5 text-xs font-bold rounded-full"
                    >{{ docsCount }}</span>
                </button>
            </div>

            <div class="flex flex-col sm:flex-row sm:items-center gap-3">
                <!-- Búsqueda global (nombre/apellidos/CURP/folio/email) -->
                <div class="relative w-full sm:max-w-xs">
                    <span class="absolute inset-y-0 left-3 flex items-center text-slate-400">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </span>
                    <input
                        v-model="searchTerm"
                        @input="onSearchInput"
                        type="text"
                        placeholder="Buscar por nombre, CURP, folio o email..."
                        class="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition"
                    />
                </div>

                <!-- Filtro por estado -->
                <select
                    v-model="statusFilter"
                    @change="onStatusChange"
                    class="w-full sm:w-52 py-2 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition"
                >
                    <option :value="null">Todos los estados</option>
                    <option v-for="s in STATUS_OPTIONS" :key="s.value" :value="s.value">{{ s.label }}</option>
                </select>
            </div>
        </div>

        <DataTable
            :columns="columns"
            :rows="rows"
            :loading="loading"
            :hide-search="true"
            :pagination="pagination"
            @change="handleChange"
        >
            <template #cell-names="{ row }">
                <span class="font-medium text-slate-700">
                    {{ [row.firstSurname, row.secondSurname, row.names].filter(Boolean).join(' ') || '—' }}
                </span>
            </template>

            <template #cell-oferta="{ row }">
                <span v-if="row.academicOffer?.career?.name" class="text-sm text-slate-600">
                    {{ row.academicOffer.career.name }}
                </span>
                <span v-else class="text-xs text-slate-400 italic">—</span>
            </template>

            <template #cell-periodo="{ row }">
                <span v-if="row.academicPeriod?.shortName" class="text-sm text-slate-600">
                    {{ row.academicPeriod.shortName }}
                </span>
                <span v-else class="text-xs text-slate-400 italic">—</span>
            </template>

            <template #cell-status="{ row }">
                <span
                    class="px-2 py-1 text-xs font-semibold rounded-full"
                    :class="STATUS_CLASSES[row.status] ?? 'bg-slate-100 text-slate-500'"
                >
                    {{ STATUS_OPTIONS.find(o => o.value === row.status)?.label ?? row.status }}
                </span>
            </template>

            <template #cell-docs="{ row }">
                <div v-if="docSummary[row.id] && docSummary[row.id].total" class="flex flex-wrap items-center gap-1">
                    <span v-if="docSummary[row.id].approved" class="px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-semibold" title="Aprobados">{{ docSummary[row.id].approved }} ✓</span>
                    <span v-if="docSummary[row.id].pending" class="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-semibold" title="Pendientes">{{ docSummary[row.id].pending }} pend.</span>
                    <span v-if="docSummary[row.id].rejected" class="px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-semibold" title="Rechazados">{{ docSummary[row.id].rejected }} rech.</span>
                </div>
                <span v-else class="text-xs text-slate-300">—</span>
            </template>

            <template #cell-opciones="{ row }">
                <div class="flex items-center justify-center gap-2">
                    <!-- Revisar documentos -->
                    <button aria-label="Revisar documentos"
                        type="button"
                        class="border p-1.5 rounded-md text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition"
                        title="Revisar documentos"
                        @click="openReview(row)"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </button>
                    <button aria-label="Ver"
                        type="button"
                        class="border p-1.5 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                        title="Ver"
                        @click="router.push({ name: 'admissions.applicants.show', params: { id: row.id } })"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12s3.75-7.5 9.75-7.5S21.75 12 21.75 12s-3.75 7.5-9.75 7.5S2.25 12 2.25 12z" />
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>
                    <button aria-label="Editar"
                        type="button"
                        class="border p-1.5 rounded-md text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition"
                        title="Editar"
                        @click="router.push({ name: 'admissions.applicants.edit', params: { id: row.id } })"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l2.651 2.651M7.5 13.85l-.75 3.75 3.75-.75L19.513 7.138a2.121 2.121 0 00-3-3L7.5 13.85z" />
                        </svg>
                    </button>
                    <button aria-label="Eliminar"
                        type="button"
                        class="border p-1.5 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 transition"
                        title="Eliminar"
                        @click="deleteApplicant(row)"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 7.5h12m-10.5 0v10.125A1.875 1.875 0 009.375 19.5h5.25A1.875 1.875 0 0016.5 17.625V7.5M9.75 4.875A1.875 1.875 0 0111.625 3h.75A1.875 1.875 0 0114.25 4.875L15 7.5h-6l.75-2.625z" />
                        </svg>
                    </button>
                </div>
            </template>
        </DataTable>

        <DocumentReviewDrawer
            :open="reviewDrawerOpen"
            :applicant-id="reviewApplicantId"
            :applicant-name="reviewApplicantName"
            @close="reviewDrawerOpen = false"
            @reviewed="onReviewed"
        />
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { PlusIcon } from '@heroicons/vue/24/outline'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import { useDataTableFetch } from '@/app/components/ui/datatable/useDataTableFetch'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'
import { API } from '@/shared/api'
import type { Applicant } from '@/modules/admissions/types/applicant.type'
import { STATUS_OPTIONS, STATUS_CLASSES } from '@/modules/admissions/types/applicant.type'
import AdmissionPeriodSelector from '@/modules/admissions/components/AdmissionPeriodSelector.vue'
import DocumentReviewDrawer from '@/modules/admissions/components/DocumentReviewDrawer.vue'
import { useAdmissionPeriodStore } from '@/modules/admissions/stores/admission-period.store'
import { api } from '@/shared/services/api'
import { useMenuStore } from '@/app/stores/menu.store'
import { useConfirm } from '@/app/composables/useConfirm'
import { useToast } from '@/app/composables/useToast'

const router = useRouter()
const periodStore = useAdmissionPeriodStore()
const menuStore = useMenuStore()
const { confirm } = useConfirm()
const toast = useToast()

// Filtro "Documentos por revisar": aspirantes con docs pending/rejected.
const docsToReview = ref(false)
const docsCount    = ref(0)

// Búsqueda global + filtro por estado.
const searchTerm   = ref('')
const statusFilter = ref<number | null>(null)
let searchTimeout: ReturnType<typeof setTimeout> | null = null

const searchFilter = computed(() => ({
    ...(periodStore.selectedPeriodId !== null ? { academic_period_id: periodStore.selectedPeriodId } : {}),
    ...(docsToReview.value ? { has_docs_to_review: 1 } : {}),
    ...(statusFilter.value !== null ? { status: statusFilter.value } : {}),
    ...(searchTerm.value.trim() ? { q: searchTerm.value.trim() } : {}),
}))

const columns: DataTableColumn<Applicant>[] = [
    { key: 'id',       label: '#',       field: 'id',    sortable: true },
    { key: 'names',    label: 'NOMBRE COMPLETO',  field: 'first_surname', sortable: true },
    { key: 'applicationFolio', label: 'FOLIO', field: 'applicationFolio' },
    { key: 'email',    label: 'EMAIL',   field: 'email', sortable: true },
    { key: 'oferta',   label: 'OFERTA' },
    { key: 'periodo',  label: 'PERIODO' },
    { key: 'status',   label: 'ESTADO' },
    { key: 'docs',     label: 'DOCS' },
    { key: 'opciones', label: 'OPCIONES' },
]

// Resumen de documentos por aspirante (id -> conteos), de la página visible.
type DocSummary = { pending: number; approved: number; rejected: number; reviewing: number; total: number }
const docSummary = ref<Record<number, DocSummary>>({})

async function loadDocSummary() {
    const ids = rows.value.map(r => r.id)
    if (!ids.length) { docSummary.value = {}; return }
    try {
        const res = await api.get(`${API.ADMISSIONS_API.applicants.documentsSummary}?ids=${ids.join(',')}`)
        docSummary.value = res.data ?? {}
    } catch {
        docSummary.value = {}
    }
}

const { rows, loading, pagination, handleChange, fetchData } =
    useDataTableFetch<Applicant>({
        endpoint: API.ADMISSIONS_API.applicants.list,
        extraSearch: searchFilter,
    })

// Cuando cambia la página visible, recarga el resumen de documentos.
watch(rows, () => loadDocSummary())

async function loadDocsCount() {
    try {
        const base = API.ADMISSIONS_API.applicants.docsToReviewCount
        const url = periodStore.selectedPeriodId !== null
            ? `${base}?academic_period_id=${periodStore.selectedPeriodId}`
            : base
        const res = await api.get(url)
        docsCount.value = res.data?.count ?? 0
    } catch {
        docsCount.value = 0
    }
}

function toggleDocsFilter() {
    docsToReview.value = !docsToReview.value
    fetchData()
}

function onPeriodChange() {
    fetchData()
    loadDocsCount()
}

function onSearchInput() {
    if (searchTimeout) clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => fetchData(), 400)
}

function onStatusChange() {
    fetchData()
}

async function deleteApplicant(row: Applicant) {
    const name = [row.firstSurname, row.secondSurname, row.names].filter(Boolean).join(' ') || 'este aspirante'
    const ok = await confirm({
        title: 'Eliminar aspirante',
        message: `¿Eliminar a ${name}? Esta acción no se puede deshacer.`,
        variant: 'danger',
        confirmText: 'Eliminar',
    })
    if (!ok) return

    try {
        await api.delete(API.ADMISSIONS_API.applicants.delete(row.id))
        toast.success('Aspirante eliminado.')
        fetchData()
        loadDocsCount()
        menuStore.loadBadges()
    } catch (e: any) {
        toast.error(e?.response?.data?.message ?? 'No se pudo eliminar el aspirante.')
    }
}

// Review drawer
const reviewDrawerOpen    = ref(false)
const reviewApplicantId   = ref<number | null>(null)
const reviewApplicantName = ref<string | null>(null)

function openReview(row: Applicant) {
    reviewApplicantId.value   = row.id
    reviewApplicantName.value = `${row.names} ${row.firstSurname}`
    reviewDrawerOpen.value    = true
}

function onReviewed() {
    fetchData()
    loadDocsCount()
    loadDocSummary()
    menuStore.loadBadges()
}

onMounted(() => {
    fetchData()
    loadDocsCount()
})
</script>
