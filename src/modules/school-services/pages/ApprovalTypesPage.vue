<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Tipos de Aprobacion</h1>
            <button
                type="button"
                class="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                @click="openCreate"
            >
                <PlusIcon class="w-4 h-4" />
                REGISTRAR TIPO
            </button>
        </div>

        <DataTable
            :columns="columns"
            :rows="rows"
            :loading="loading"
            :pagination="pagination"
            @change="handleChange"
        >
            <template #cell-collegeName="{ row }">
                {{ row.collegeName ?? 'GLOBAL' }}
            </template>

            <template #cell-isActive="{ row }">
                <span
                    class="px-2 py-1 text-xs font-semibold rounded-full"
                    :class="row.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
                >
                    {{ row.isActive ? 'ACTIVO' : 'INACTIVO' }}
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
            :title="editing ? 'Editar Tipo de Aprobacion' : 'Registrar Tipo de Aprobacion'"
            size="lg"
            persistent
        >
            <div class="space-y-6">
                <FormInput label="NOMBRE" v-model="form.name" required uppercase />
                <FormInput label="CLAVE CORTA" v-model="form.shortName" required uppercase />

                <div class="grid grid-cols-2 gap-4">
                    <FormInput label="CURSO" v-model="form.course" type="number" required />
                    <FormInput label="OPORTUNIDAD" v-model="form.opportunity" type="number" required />
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <FormInput label="CLASE" v-model="form.class" type="number" required />
                    <FormInput label="ORDEN" v-model="form.order" type="number" required />
                </div>

                <FormSwitch label="ACTIVO" v-model="form.isActive" />

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
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'
import { useConfirm } from '@/app/composables/useConfirm'

const toast = useToast()
const { confirm } = useConfirm()

const columns: DataTableColumn<any>[] = [
    { key: 'id',          label: '#',          field: 'id',        sortable: true },
    { key: 'name',        label: 'NOMBRE',     field: 'name',      sortable: true, searchable: true },
    { key: 'shortName',   label: 'CLAVE',      field: 'shortName', sortable: true },
    { key: 'collegeName', label: 'PLANTEL' },
    { key: 'order',       label: 'ORDEN',      field: 'order',     sortable: true },
    { key: 'isActive',    label: 'ESTADO' },
    { key: 'opciones',    label: 'OPCIONES' },
]

const { rows, loading, pagination, handleChange, fetchData } = useDataTableFetch<any>({
    endpoint: API.SCHOOL_SERVICES_API.approvalTypes.list,
})

/* ---------- Alta / edición en modal ---------- */
const modalOpen = ref(false)
const editing = ref<any | null>(null)
const submitting = ref(false)
const formError = ref<string | null>(null)

const form = reactive({
    name: '',
    shortName: '',
    course: 1,
    opportunity: 1,
    class: 1,
    order: 1,
    isActive: true,
})

function resetForm() {
    form.name = ''
    form.shortName = ''
    form.course = 1
    form.opportunity = 1
    form.class = 1
    form.order = 1
    form.isActive = true
    formError.value = null
}

function openCreate() {
    editing.value = null
    resetForm()
    modalOpen.value = true
}

async function openEdit(row: any) {
    editing.value = row
    resetForm()
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.approvalTypes.byId(row.id))
        form.name        = data.name
        form.shortName   = data.shortName
        form.course      = data.course
        form.opportunity = data.opportunity
        form.class       = data.class
        form.order       = data.order
        form.isActive    = data.isActive
    } catch {
        toast.error('No se pudo cargar el tipo de aprobación.')
        return
    }
    modalOpen.value = true
}

async function submitForm() {
    formError.value = null
    submitting.value = true
    try {
        const payload = {
            name:        form.name,
            short_name:  form.shortName,
            course:      Number(form.course),
            opportunity: Number(form.opportunity),
            class:       Number(form.class),
            order:       Number(form.order),
            is_active:   form.isActive,
        }
        if (editing.value) {
            await api.put(API.SCHOOL_SERVICES_API.approvalTypes.update(editing.value.id), payload)
            toast.success('Tipo de aprobación actualizado.')
        } else {
            await api.post(API.SCHOOL_SERVICES_API.approvalTypes.create, payload)
            toast.success('Tipo de aprobación guardado.')
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
async function confirmDelete(row: any) {
    const ok = await confirm({
        title: 'Eliminar tipo de aprobación',
        message: `¿Eliminar "${row.name}"? Esta acción no se puede deshacer.`,
        variant: 'danger',
        confirmText: 'Eliminar',
    })
    if (!ok) return
    try {
        await api.delete(API.SCHOOL_SERVICES_API.approvalTypes.delete(row.id))
        toast.success('Tipo de aprobación eliminado.')
        fetchData()
    } catch (e: any) {
        toast.error(e?.response?.data?.message ?? 'No se pudo eliminar.')
    }
}

fetchData()
</script>
