<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Áreas Académicas</h1>
            <button class="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700" @click="openCreate">
                <PlusIcon class="w-4 h-4" /> NUEVO
            </button>
        </div>
        <DataTable :columns="columns" :rows="rows" :loading="loading" :pagination="pagination" @change="handleChange">
            <template #cell-nombre="{ row }"><span class="font-medium text-slate-700">{{ row.name }}</span></template>
            <template #cell-tipo="{ row }">
                <span v-if="row.collegeId === null" class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">GLOBAL</span>
                <span v-else class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">INSTITUCIONAL</span>
            </template>
            <template #cell-opciones="{ row }">
                <div class="flex items-center justify-center gap-2">
                    <button type="button" class="border p-1.5 rounded-md transition" :class="row.collegeId === null ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:text-amber-600 hover:bg-amber-50'" :disabled="row.collegeId === null" @click="row.collegeId !== null && openEdit(row)">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l2.651 2.651M7.5 13.85l-.75 3.75 3.75-.75L19.513 7.138a2.121 2.121 0 00-3-3L7.5 13.85z" /></svg>
                    </button>
                    <button type="button" class="border p-1.5 rounded-md transition" :class="row.collegeId === null ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:text-red-600 hover:bg-red-50'" :disabled="row.collegeId === null" @click="row.collegeId !== null && confirmDelete(row)">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M6 7.5h12m-10.5 0v10.125A1.875 1.875 0 009.375 19.5h5.25A1.875 1.875 0 0016.5 17.625V7.5M9.75 4.875A1.875 1.875 0 0111.625 3h.75A1.875 1.875 0 0114.25 4.875L15 7.5h-6l.75-2.625z" /></svg>
                    </button>
                </div>
            </template>
        </DataTable>
        <Teleport to="body">
            <Transition enter-active-class="transition-opacity duration-150" leave-active-class="transition-opacity duration-150" enter-from-class="opacity-0" leave-to-class="opacity-0">
                <div v-if="modalOpen" class="fixed inset-0 z-50 flex items-center justify-center">
                    <div class="absolute inset-0 bg-black/40" @click="closeModal" />
                    <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6 space-y-4">
                        <h2 class="text-sm font-bold uppercase tracking-widest text-slate-700">{{ editing ? 'Editar Área Académica' : 'Nuevo/a Área Académica' }}</h2>
                        <div>
                            <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Nombre</label>
                            <input v-model="form.name" type="text" maxlength="120" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                        </div>
                        <p v-if="formError" class="text-xs text-red-600">{{ formError }}</p>
                        <div class="flex justify-end gap-2 pt-2">
                            <button class="px-4 py-2 text-sm rounded-lg border hover:bg-slate-50 transition" @click="closeModal">CANCELAR</button>
                            <button class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition" :disabled="submitting" @click="submitForm">{{ submitting ? 'GUARDANDO...' : 'GUARDAR' }}</button>
                        </div>
                    </div>
                </div>
            </Transition>
        </Teleport>
        <Teleport to="body">
            <Transition enter-active-class="transition-opacity duration-150" leave-active-class="transition-opacity duration-150" enter-from-class="opacity-0" leave-to-class="opacity-0">
                <div v-if="deleteTarget" class="fixed inset-0 z-50 flex items-center justify-center">
                    <div class="absolute inset-0 bg-black/40" @click="deleteTarget = null" />
                    <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6 space-y-4">
                        <h2 class="text-sm font-bold uppercase tracking-widest text-slate-700">Eliminar</h2>
                        <p class="text-sm text-slate-600">¿Eliminar <span class="font-semibold">{{ deleteTarget.name }}</span>? Esta acción no se puede deshacer.</p>
                        <div class="flex justify-end gap-2">
                            <button class="px-4 py-2 text-sm rounded-lg border hover:bg-slate-50 transition" @click="deleteTarget = null">CANCELAR</button>
                            <button class="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition" :disabled="deleting" @click="doDelete">{{ deleting ? 'ELIMINANDO...' : 'ELIMINAR' }}</button>
                        </div>
                    </div>
                </div>
            </Transition>
        </Teleport>
    </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { PlusIcon } from '@heroicons/vue/24/outline'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import { useDataTableFetch } from '@/app/components/ui/datatable/useDataTableFetch'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { CatalogItem } from '@/modules/admissions/types/catalog.type'
const columns: DataTableColumn<CatalogItem>[] = [
    { key: 'id', label: '#', field: 'id', sortable: true },
    { key: 'nombre', label: 'NOMBRE', field: 'name', sortable: true },
    { key: 'tipo', label: 'TIPO' },
    { key: 'opciones', label: 'OPCIONES' },
]
const { rows, loading, pagination, handleChange, fetchData } = useDataTableFetch<CatalogItem>({ endpoint: API.ADMISSIONS_API.academicAreas.paginate })
const modalOpen = ref(false)
const editing = ref<CatalogItem | null>(null)
const submitting = ref(false)
const formError = ref<string | null>(null)
const form = ref({ name: '' })
function openCreate() { editing.value = null; form.value = { name: '' }; formError.value = null; modalOpen.value = true }
function openEdit(row: CatalogItem) { editing.value = row; form.value = { name: row.name }; formError.value = null; modalOpen.value = true }
function closeModal() { modalOpen.value = false; editing.value = null }
async function submitForm() {
    formError.value = null
    if (!form.value.name.trim()) { formError.value = 'El nombre es requerido.'; return }
    submitting.value = true
    try {
        if (editing.value) { await api.put(API.ADMISSIONS_API.academicAreas.update(editing.value.id), { name: form.value.name }) }
        else { await api.post(API.ADMISSIONS_API.academicAreas.create, { name: form.value.name }) }
        closeModal(); fetchData()
    } catch (e: any) { formError.value = e?.response?.data?.message ?? 'Error al guardar.' }
    finally { submitting.value = false }
}
const deleteTarget = ref<CatalogItem | null>(null)
const deleting = ref(false)
function confirmDelete(row: CatalogItem) { deleteTarget.value = row }
async function doDelete() {
    if (!deleteTarget.value) return
    deleting.value = true
    try { await api.delete(API.ADMISSIONS_API.academicAreas.delete(deleteTarget.value.id)); deleteTarget.value = null; fetchData() }
    catch (e: any) { console.error('Error eliminando:', e) }
    finally { deleting.value = false }
}
onMounted(() => fetchData())
</script>
