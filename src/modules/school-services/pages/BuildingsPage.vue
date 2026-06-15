<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Edificios</h1>
            <button
                type="button"
                class="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                @click="openCreate"
            >
                <PlusIcon class="w-4 h-4" />
                REGISTRAR EDIFICIO
            </button>
        </div>

        <DataTable
            :columns="columns"
            :rows="rows"
            :loading="loading"
            :pagination="pagination"
            @change="handleChange"
        >
            <template #cell-campus="{ row }">
                {{ row.campus?.name ?? '-' }}
            </template>

            <template #cell-status="{ row }">
                <span
                    class="px-2 py-1 text-xs font-semibold rounded-full"
                    :class="row.status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
                >
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
            :title="editing ? 'Editar Edificio' : 'Registrar Edificio'"
            size="lg"
            persistent
        >
            <div class="space-y-6">
                <FormRemoteSelect
                    :key="selectKey"
                    label="PLANTEL"
                    v-model="form.campusId"
                    :endpoint="API.SCHOOL_SERVICES_API.campuses.list"
                    :endpoint-by-id="API.SCHOOL_SERVICES_API.campuses.byId"
                    item-label="name"
                    item-value="id"
                    required
                />

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput label="NOMBRE DEL EDIFICIO" v-model="form.name" uppercase required />
                    <FormInput label="NOMBRE CORTO" v-model="form.shortName" uppercase />
                </div>

                <FormInput label="DESCRIPCIÓN" v-model="form.description" uppercase />

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
import type { BuildingType } from '@/modules/school-services/types/building.type'

const toast = useToast()
const { confirm } = useConfirm()

const columns: DataTableColumn<BuildingType>[] = [
    { key: 'id',          label: '#',         field: 'id',        sortable: true },
    { key: 'name',        label: 'NOMBRE',    field: 'name',      sortable: true, searchable: true },
    { key: 'shortName',   label: 'CLAVE',     field: 'shortName', searchable: true },
    { key: 'campus',      label: 'PLANTEL',   field: 'campusId' },
    { key: 'status',      label: 'ESTADO' },
    { key: 'opciones',    label: 'OPCIONES' },
]

const { rows, loading, pagination, handleChange, fetchData } = useDataTableFetch<BuildingType>({
    endpoint: API.SCHOOL_SERVICES_API.buildings.list,
})

/* ---------- Alta / edición en modal ---------- */
const modalOpen = ref(false)
const editing = ref<BuildingType | null>(null)
const submitting = ref(false)
const formError = ref<string | null>(null)
const selectKey = ref(0)

const form = reactive({
    campusId:    null as number | null,
    name:        '',
    shortName:   '',
    description: '',
    status:      true,
})

function resetForm() {
    form.campusId    = null
    form.name        = ''
    form.shortName   = ''
    form.description = ''
    form.status      = true
    formError.value  = null
}

function openCreate() {
    editing.value = null
    resetForm()
    selectKey.value++
    modalOpen.value = true
}

async function openEdit(row: BuildingType) {
    editing.value = row
    resetForm()
    // El listado puede no traer todos los campos; se hidrata por id.
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.buildings.byId(row.id))
        form.campusId    = data.campusId ?? null
        form.name        = data.name
        form.shortName   = data.shortName ?? ''
        form.description = data.description ?? ''
        form.status      = data.status
    } catch {
        toast.error('No se pudo cargar el edificio.')
        return
    }
    // Remontar FormRemoteSelect para que lea el valor seleccionado.
    selectKey.value++
    modalOpen.value = true
}

async function submitForm() {
    formError.value = null
    if (!form.name.trim()) { formError.value = 'El nombre es requerido.'; return }
    if (!form.campusId)    { formError.value = 'El plantel es requerido.'; return }

    submitting.value = true
    try {
        const payload = {
            campus_id:   form.campusId,
            name:        form.name,
            short_name:  form.shortName || null,
            description: form.description || null,
            status:      form.status,
        }
        if (editing.value) {
            await api.put(API.SCHOOL_SERVICES_API.buildings.update(editing.value.id), payload)
            toast.success('Edificio actualizado.')
        } else {
            await api.post(API.SCHOOL_SERVICES_API.buildings.create, payload)
            toast.success('Edificio guardado.')
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
async function confirmDelete(row: BuildingType) {
    const ok = await confirm({
        title: 'Eliminar edificio',
        message: `¿Eliminar "${row.name}"? Esta acción no se puede deshacer.`,
        variant: 'danger',
        confirmText: 'Eliminar',
    })
    if (!ok) return
    try {
        await api.delete(API.SCHOOL_SERVICES_API.buildings.delete(row.id))
        toast.success('Edificio eliminado.')
        fetchData()
    } catch (e: any) {
        toast.error(e?.response?.data?.message ?? 'No se pudo eliminar el edificio.')
    }
}

fetchData()
</script>
