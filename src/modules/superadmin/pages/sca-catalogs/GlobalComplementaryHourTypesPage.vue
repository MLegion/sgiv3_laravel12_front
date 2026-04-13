<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Tipos de Horas Complementarias (Global)</h1>
            <button class="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700" @click="openCreate">
                <PlusIcon class="w-4 h-4" /> NUEVO
            </button>
        </div>

        <DataTable :columns="columns" :rows="rows" :loading="loading" :pagination="pagination" @change="handleChange">
            <template #cell-nombre="{ row }">
                <div class="flex items-center gap-2">
                    <span v-if="row.color" class="w-3 h-3 rounded-full border border-slate-200" :style="{ backgroundColor: row.color }" />
                    <span class="font-medium text-slate-700">{{ row.name }}</span>
                </div>
            </template>

            <template #cell-shortName="{ row }">
                <span class="text-xs font-mono uppercase text-slate-500">{{ row.shortName }}</span>
            </template>

            <template #cell-countsAsTeaching="{ row }">
                <span v-if="row.countsAsTeaching" class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">SÍ</span>
                <span v-else class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">NO</span>
            </template>

            <template #cell-estado="{ row }">
                <span v-if="row.status" class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-green-100 text-green-700">ACTIVO</span>
                <span v-else class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-500">INACTIVO</span>
            </template>

            <template #cell-opciones="{ row }">
                <div class="flex items-center justify-center gap-2">
                    <button type="button" class="border p-1.5 rounded-md text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition" @click="openEdit(row)">
                        <PencilSquareIcon class="w-4 h-4" />
                    </button>
                    <button type="button" class="border p-1.5 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 transition" @click="confirmDelete(row)">
                        <TrashIcon class="w-4 h-4" />
                    </button>
                </div>
            </template>
        </DataTable>

        <!-- Form Modal -->
        <Teleport to="body">
            <Transition enter-active-class="transition-opacity duration-150" leave-active-class="transition-opacity duration-150" enter-from-class="opacity-0" leave-to-class="opacity-0">
                <div v-if="modalOpen" class="fixed inset-0 z-50 flex items-center justify-center">
                    <div class="absolute inset-0 bg-black/40" @click="closeModal" />
                    <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 p-6 space-y-4">
                        <h2 class="text-sm font-bold uppercase tracking-widest text-slate-700">
                            {{ editing ? 'Editar Tipo Global' : 'Nuevo Tipo Global' }}
                        </h2>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="md:col-span-2">
                                <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Nombre</label>
                                <input v-model="form.name" type="text" maxlength="100" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                            </div>

                            <div>
                                <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Nombre Corto</label>
                                <input v-model="form.shortName" type="text" maxlength="30" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                            </div>

                            <div>
                                <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Orden</label>
                                <input v-model.number="form.sortOrder" type="number" min="0" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                            </div>

                            <div class="md:col-span-2">
                                <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Descripción</label>
                                <textarea v-model="form.description" rows="2" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                            </div>

                            <div>
                                <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Color</label>
                                <div class="flex items-center gap-2">
                                    <input v-model="form.color" type="color" class="h-9 w-12 border rounded-lg cursor-pointer" />
                                    <input v-model="form.color" type="text" placeholder="#22c55e" pattern="^#[0-9A-Fa-f]{6}$" class="flex-1 border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400" />
                                </div>
                            </div>

                            <div class="flex items-center gap-4 pt-6">
                                <label class="flex items-center gap-2 cursor-pointer">
                                    <input v-model="form.countsAsTeaching" type="checkbox" class="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-400" />
                                    <span class="text-xs font-semibold text-slate-600 uppercase">Cuenta como docencia</span>
                                </label>
                                <label class="flex items-center gap-2 cursor-pointer">
                                    <input v-model="form.status" type="checkbox" class="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-400" />
                                    <span class="text-xs font-semibold text-slate-600 uppercase">Activo</span>
                                </label>
                            </div>
                        </div>

                        <p v-if="formError" class="text-xs text-red-600">{{ formError }}</p>

                        <div class="flex justify-end gap-2 pt-2">
                            <button class="px-4 py-2 text-sm rounded-lg border hover:bg-slate-50 transition" @click="closeModal">CANCELAR</button>
                            <button class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition" :disabled="submitting" @click="submitForm">
                                {{ submitting ? 'GUARDANDO...' : 'GUARDAR' }}
                            </button>
                        </div>
                    </div>
                </div>
            </Transition>
        </Teleport>

        <!-- Delete Confirm Modal -->
        <Teleport to="body">
            <Transition enter-active-class="transition-opacity duration-150" leave-active-class="transition-opacity duration-150" enter-from-class="opacity-0" leave-to-class="opacity-0">
                <div v-if="deleteTarget" class="fixed inset-0 z-50 flex items-center justify-center">
                    <div class="absolute inset-0 bg-black/40" @click="deleteTarget = null" />
                    <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6 space-y-4">
                        <h2 class="text-sm font-bold uppercase tracking-widest text-slate-700">Eliminar</h2>
                        <p class="text-sm text-slate-600">
                            ¿Eliminar <span class="font-semibold">{{ deleteTarget.name }}</span>?
                        </p>
                        <div class="flex justify-end gap-2">
                            <button class="px-4 py-2 text-sm rounded-lg border hover:bg-slate-50 transition" @click="deleteTarget = null">CANCELAR</button>
                            <button class="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition" :disabled="deleting" @click="doDelete">
                                {{ deleting ? 'ELIMINANDO...' : 'ELIMINAR' }}
                            </button>
                        </div>
                    </div>
                </div>
            </Transition>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/vue/24/outline'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import { useDataTableFetch } from '@/app/components/ui/datatable/useDataTableFetch'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { ComplementaryHourType, ComplementaryHourTypeForm } from '@/modules/sca/types/complementaryHourType.type'
import { emptyForm } from '@/modules/sca/types/complementaryHourType.type'

const columns: DataTableColumn<ComplementaryHourType>[] = [
    { key: 'id', label: '#', field: 'id', sortable: true },
    { key: 'nombre', label: 'NOMBRE', field: 'name', sortable: true },
    { key: 'shortName', label: 'CORTO' },
    { key: 'countsAsTeaching', label: 'DOCENCIA' },
    { key: 'estado', label: 'ESTADO' },
    { key: 'opciones', label: 'OPCIONES' },
]

const { rows, loading, pagination, handleChange, fetchData } = useDataTableFetch<ComplementaryHourType>({
    endpoint: API.SUPERADMIN_API.scaCatalogs.complementaryHourTypes.paginate,
})

const modalOpen = ref(false)
const editing = ref<ComplementaryHourType | null>(null)
const submitting = ref(false)
const formError = ref<string | null>(null)
const form = ref<ComplementaryHourTypeForm>(emptyForm())

function openCreate() {
    editing.value = null
    form.value = emptyForm()
    formError.value = null
    modalOpen.value = true
}

function openEdit(row: ComplementaryHourType) {
    editing.value = row
    form.value = {
        name: row.name,
        shortName: row.shortName,
        description: row.description ?? '',
        countsAsTeaching: row.countsAsTeaching,
        color: row.color ?? '',
        sortOrder: row.sortOrder,
        status: row.status,
    }
    formError.value = null
    modalOpen.value = true
}

function closeModal() {
    modalOpen.value = false
    editing.value = null
}

async function submitForm() {
    formError.value = null
    if (!form.value.name.trim()) { formError.value = 'El nombre es requerido.'; return }
    if (!form.value.shortName.trim()) { formError.value = 'El nombre corto es requerido.'; return }

    submitting.value = true
    try {
        const payload = {
            name:               form.value.name,
            short_name:         form.value.shortName,
            description:        form.value.description || null,
            counts_as_teaching: form.value.countsAsTeaching,
            color:              form.value.color || null,
            sort_order:         form.value.sortOrder,
            status:             form.value.status,
        }
        if (editing.value) {
            await api.put(API.SUPERADMIN_API.scaCatalogs.complementaryHourTypes.update(editing.value.id), payload)
        } else {
            await api.post(API.SUPERADMIN_API.scaCatalogs.complementaryHourTypes.create, payload)
        }
        closeModal()
        fetchData()
    } catch (e: any) {
        formError.value = e?.response?.data?.message ?? 'Error al guardar.'
    } finally {
        submitting.value = false
    }
}

const deleteTarget = ref<ComplementaryHourType | null>(null)
const deleting = ref(false)

function confirmDelete(row: ComplementaryHourType) {
    deleteTarget.value = row
}

async function doDelete() {
    if (!deleteTarget.value) return
    deleting.value = true
    try {
        await api.delete(API.SUPERADMIN_API.scaCatalogs.complementaryHourTypes.delete(deleteTarget.value.id))
        deleteTarget.value = null
        fetchData()
    } catch (e: any) {
        console.error('Error eliminando:', e)
    } finally {
        deleting.value = false
    }
}

onMounted(() => fetchData())
</script>
