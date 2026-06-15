<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Espacios</h1>
            <button
                type="button"
                class="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                @click="openCreate"
            >
                <PlusIcon class="w-4 h-4" />
                REGISTRAR ESPACIO
            </button>
        </div>

        <DataTable
            :columns="columns"
            :rows="rows"
            :loading="loading"
            :pagination="pagination"
            @change="handleChange"
        >
            <template #cell-building="{ row }">{{ row.building?.name ?? '-' }}</template>
            <template #cell-campus="{ row }">{{ row.building?.campus?.name ?? '-' }}</template>

            <template #cell-status="{ row }">
                <span class="px-2 py-1 text-xs font-semibold rounded-full" :class="row.status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
                    {{ row.status ? 'ACTIVO' : 'INACTIVO' }}
                </span>
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
            :title="editing ? 'Editar Espacio' : 'Registrar Espacio'"
            size="lg"
            persistent
        >
            <div class="space-y-6">
                <FormRemoteSelect
                    :key="`building-${formKey}`"
                    label="EDIFICIO"
                    v-model="form.buildingId"
                    :endpoint="API.SCHOOL_SERVICES_API.buildings.list"
                    :endpoint-by-id="API.SCHOOL_SERVICES_API.buildings.byId"
                    item-label="name"
                    item-value="id"
                    required
                />

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput label="NOMBRE DEL ESPACIO" v-model="form.name" uppercase required />
                    <FormInput label="NOMBRE CORTO" v-model="form.shortName" uppercase />
                </div>

                <FormInput label="CAPACIDAD" type="number" v-model.number="form.capacity" required />

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
import FormRemoteSelect from '@/app/components/ui/form/FormRemoteSelect.vue'
import FormSwitch from '@/app/components/ui/form/FormSwitch.vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'
import { useConfirm } from '@/app/composables/useConfirm'
import type { PlaceType } from '@/modules/school-services/types/place.type'

const toast = useToast()
const { confirm } = useConfirm()

const columns: DataTableColumn<PlaceType>[] = [
    { key: 'id',        label: '#',          field: 'id',       sortable: true },
    { key: 'name',      label: 'NOMBRE',     field: 'name',     sortable: true, searchable: true },
    { key: 'shortName', label: 'CLAVE',      field: 'shortName' },
    { key: 'building',  label: 'EDIFICIO',   field: 'buildingId' },
    { key: 'campus',    label: 'PLANTEL',    field: 'buildingId' },
    { key: 'capacity',  label: 'CAPACIDAD',  field: 'capacity', sortable: true },
    { key: 'status',    label: 'ESTADO' },
    { key: 'opciones',  label: 'OPCIONES' },
]

const { rows, loading, pagination, handleChange, fetchData } = useDataTableFetch<PlaceType>({
    endpoint: API.SCHOOL_SERVICES_API.places.list,
})

/* ---------- Alta / edición en modal ---------- */
const modalOpen = ref(false)
const editing = ref<PlaceType | null>(null)
const submitting = ref(false)
const formError = ref<string | null>(null)
const formKey = ref(0)

const form = reactive({
    buildingId: null as number | null,
    name:       '',
    shortName:  '',
    capacity:   40,
    status:     true,
})

function resetForm() {
    form.buildingId = null
    form.name       = ''
    form.shortName  = ''
    form.capacity   = 40
    form.status     = true
    formError.value = null
}

function openCreate() {
    editing.value = null
    resetForm()
    formKey.value++
    modalOpen.value = true
}

async function openEdit(row: PlaceType) {
    editing.value = row
    resetForm()
    // El listado puede no traer todos los campos; se hidrata por id.
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.places.byId(row.id))
        form.buildingId = data.buildingId
        form.name       = data.name
        form.shortName  = data.shortName ?? ''
        form.capacity   = data.capacity
        form.status     = data.status
    } catch {
        toast.error('No se pudo cargar el espacio.')
        return
    }
    // Remontar el select de edificio para que lea el valor seleccionado.
    formKey.value++
    modalOpen.value = true
}

async function submitForm() {
    formError.value = null
    if (!form.name.trim()) { formError.value = 'El nombre es requerido.'; return }

    submitting.value = true
    try {
        const payload = {
            building_id: form.buildingId,
            name:        form.name,
            short_name:  form.shortName || null,
            capacity:    form.capacity,
            status:      form.status,
        }
        if (editing.value) {
            await api.put(API.SCHOOL_SERVICES_API.places.update(editing.value.id), payload)
            toast.success('Espacio actualizado.')
        } else {
            await api.post(API.SCHOOL_SERVICES_API.places.create, payload)
            toast.success('Espacio guardado.')
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
async function confirmDelete(row: PlaceType) {
    const ok = await confirm({
        title: 'Eliminar espacio',
        message: `¿Eliminar "${row.name}"? Esta acción no se puede deshacer.`,
        variant: 'danger',
        confirmText: 'Eliminar',
    })
    if (!ok) return
    try {
        await api.delete(API.SCHOOL_SERVICES_API.places.delete(row.id))
        toast.success('Espacio eliminado.')
        fetchData()
    } catch (e: any) {
        toast.error(e?.response?.data?.message ?? 'No se pudo eliminar.')
    }
}

fetchData()
</script>
