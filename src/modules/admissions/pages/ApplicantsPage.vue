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

        <AdmissionPeriodSelector @change="fetchData()" />

        <DataTable
            :columns="columns"
            :rows="rows"
            :loading="loading"
            :pagination="pagination"
            @change="handleChange"
        >
            <template #cell-names="{ row }">
                <span class="font-medium text-slate-700">
                    {{ row.names }} {{ row.firstSurname }}
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

            <template #cell-opciones="{ row }">
                <div class="flex items-center justify-center gap-2">
                    <!-- Revisar documentos -->
                    <button
                        type="button"
                        class="border p-1.5 rounded-md text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition"
                        title="Revisar documentos"
                        @click="openReview(row)"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </button>
                    <button
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
                    <button
                        type="button"
                        class="border p-1.5 rounded-md text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition"
                        title="Editar"
                        @click="router.push({ name: 'admissions.applicants.edit', params: { id: row.id } })"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l2.651 2.651M7.5 13.85l-.75 3.75 3.75-.75L19.513 7.138a2.121 2.121 0 00-3-3L7.5 13.85z" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        class="border p-1.5 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 transition"
                        title="Eliminar"
                        @click="router.push({ name: 'admissions.applicants.delete', params: { id: row.id } })"
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
            @reviewed="fetchData()"
        />
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
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

const router = useRouter()
const periodStore = useAdmissionPeriodStore()

const periodFilter = computed(() =>
    periodStore.selectedPeriodId !== null ? { academic_period_id: periodStore.selectedPeriodId } : {}
)

const columns: DataTableColumn<Applicant>[] = [
    { key: 'id',       label: '#',       field: 'id',    sortable: true },
    { key: 'names',    label: 'NOMBRE',  field: 'names', sortable: true },
    { key: 'applicationFolio', label: 'FOLIO', field: 'applicationFolio' },
    { key: 'email',    label: 'EMAIL',   field: 'email', sortable: true },
    { key: 'oferta',   label: 'OFERTA' },
    { key: 'periodo',  label: 'PERIODO' },
    { key: 'status',   label: 'ESTADO' },
    { key: 'opciones', label: 'OPCIONES' },
]

const { rows, loading, pagination, handleChange, fetchData } =
    useDataTableFetch<Applicant>({
        endpoint: API.ADMISSIONS_API.applicants.list,
        extraSearch: periodFilter,
    })

// Review drawer
const reviewDrawerOpen    = ref(false)
const reviewApplicantId   = ref<number | null>(null)
const reviewApplicantName = ref<string | null>(null)

function openReview(row: Applicant) {
    reviewApplicantId.value   = row.id
    reviewApplicantName.value = `${row.names} ${row.firstSurname}`
    reviewDrawerOpen.value    = true
}

onMounted(() => fetchData())
</script>
