<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Campus</h1>
            <button
                type="button"
                class="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                @click="openCreate"
            >
                <PlusIcon class="w-4 h-4" />
                REGISTRAR CAMPUS
            </button>
        </div>

        <DataTable
            :columns="columns"
            :rows="rows"
            :loading="loading"
            :pagination="pagination"
            @change="handleChange"
        >
            <template #cell-status="{ row }">
                <span
                    class="px-2 py-1 text-xs font-semibold rounded-full"
                    :class="row.status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
                >
                    {{ row.status ? 'ACTIVO' : 'INACTIVO' }}
                </span>
            </template>

            <template #cell-college="{ row }">
                {{ row.college?.name ?? '-' }}
            </template>

            <template #cell-city="{ row }">
                {{ row.geoSettlement?.municipality?.name ?? '-' }}
            </template>

            <template #cell-opciones="{ row }">
                <div class="flex items-center justify-center gap-2">
                    <button aria-label="Editar" type="button" class="border p-1.5 rounded-md text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer" title="Editar"
                        @click="openEdit(row)">
                        <PencilSquareIcon class="w-4 h-4" />
                    </button>
                    <button aria-label="Eliminar" type="button" class="border p-1.5 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 transition cursor-pointer" title="Eliminar"
                        @click="confirmDelete(row)">
                        <TrashIcon class="w-4 h-4" />
                    </button>
                </div>
            </template>
        </DataTable>

        <BaseModal
            v-model="modalOpen"
            :title="editing ? 'Editar Campus' : 'Registrar Campus'"
            size="lg"
            persistent
        >
            <div class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput label="NOMBRE DEL CAMPUS" v-model="form.name" uppercase required />
                    <FormInput label="NOMBRE CORTO" v-model="form.shortName" uppercase />
                </div>

                <GeoAddressFields
                    :key="geoKey"
                    :address="form.address"
                    :geo-settlement-id="form.geoSettlementId"
                    :initial-postal-code="initialPostalCode"
                    @update:address="form.address = $event"
                    @update:geo-settlement-id="form.geoSettlementId = $event"
                />

                <FormSwitch label="ACTIVO" v-model="form.status" />

                <p v-if="formError" class="text-sm text-red-600">{{ formError }}</p>
            </div>

            <template #footer>
                <button type="button" class="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50" @click="modalOpen = false">
                    CANCELAR
                </button>
                <button type="button" class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50" :disabled="submitting" @click="submitForm">
                    {{ submitting ? 'GUARDANDO...' : 'GUARDAR' }}
                </button>
            </template>
        </BaseModal>
    </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/vue/24/outline'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import { useDataTableFetch } from '@/app/components/ui/datatable/useDataTableFetch'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'
import BaseModal from '@/app/components/ui/modal/BaseModal.vue'
import FormInput from '@/app/components/ui/form/FormInput.vue'
import FormSwitch from '@/app/components/ui/form/FormSwitch.vue'
import GeoAddressFields from '@/app/components/ui/form/GeoAddressFields.vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'
import { useConfirm } from '@/app/composables/useConfirm'
import type { CampusType } from '@/modules/school-services/types/campus.type'

const toast = useToast()
const { confirm } = useConfirm()

const columns: DataTableColumn<CampusType>[] = [
    { key: 'id',       label: '#',            field: 'id',        sortable: true },
    { key: 'name',     label: 'NOMBRE',       field: 'name',      sortable: true, searchable: true },
    { key: 'shortName',label: 'CLAVE',        field: 'shortName', searchable: true },
    { key: 'college',  label: 'INSTITUCIÓN',  field: 'collegeId' },
    { key: 'city',     label: 'CIUDAD',       field: 'city',      searchable: true },
    { key: 'status',   label: 'ESTADO' },
    { key: 'opciones', label: 'OPCIONES' },
]

const { rows, loading, pagination, handleChange, fetchData } = useDataTableFetch<CampusType>({
    endpoint: API.SCHOOL_SERVICES_API.campuses.list,
})

/* ---------- Alta / edición en modal ---------- */
const modalOpen = ref(false)
const editing = ref<CampusType | null>(null)
const submitting = ref(false)
const formError = ref<string | null>(null)
const geoKey = ref(0)
const initialPostalCode = ref<string | null>(null)

const form = reactive({
    name: '',
    shortName: '',
    address: '',
    geoSettlementId: null as number | null,
    status: true,
})

function resetForm() {
    form.name = ''
    form.shortName = ''
    form.address = ''
    form.geoSettlementId = null
    form.status = true
    initialPostalCode.value = null
    formError.value = null
}

function openCreate() {
    editing.value = null
    resetForm()
    geoKey.value++
    modalOpen.value = true
}

async function openEdit(row: CampusType) {
    editing.value = row
    resetForm()
    // El listado puede no traer address/geoSettlementId; se hidrata por id.
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.campuses.byId(row.id))
        form.name            = data.name
        form.shortName       = data.shortName ?? ''
        form.address         = data.address ?? ''
        form.geoSettlementId = data.geoSettlementId ?? null
        form.status          = data.status
        initialPostalCode.value = data.geoSettlement?.postalCode ?? null
    } catch {
        toast.error('No se pudo cargar el campus.')
        return
    }
    // Remontar GeoAddressFields para que lea los valores iniciales.
    geoKey.value++
    modalOpen.value = true
}

async function submitForm() {
    formError.value = null
    if (!form.name.trim()) { formError.value = 'El nombre es requerido.'; return }

    submitting.value = true
    try {
        const payload = {
            name:              form.name,
            short_name:        form.shortName || null,
            address:           form.address || null,
            geo_settlement_id: form.geoSettlementId,
            status:            form.status,
        }
        if (editing.value) {
            await api.put(API.SCHOOL_SERVICES_API.campuses.update(editing.value.id), payload)
            toast.success('Campus actualizado.')
        } else {
            await api.post(API.SCHOOL_SERVICES_API.campuses.create, payload)
            toast.success('Campus guardado.')
        }
        modalOpen.value = false
        fetchData()
    } catch (e: any) {
        formError.value = e?.response?.data?.message ?? 'Error al guardar.'
    } finally {
        submitting.value = false
    }
}

/* ---------- Eliminar ---------- */
async function confirmDelete(row: CampusType) {
    const ok = await confirm({
        title: 'Eliminar campus',
        message: `¿Eliminar "${row.name}"? Esta acción no se puede deshacer.`,
        variant: 'danger',
        confirmText: 'Eliminar',
    })
    if (!ok) return
    try {
        await api.delete(API.SCHOOL_SERVICES_API.campuses.delete(row.id))
        toast.success('Campus eliminado.')
        fetchData()
    } catch (e: any) {
        toast.error(e?.response?.data?.message ?? 'No se pudo eliminar el campus.')
    }
}

fetchData()
</script>
