<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-xl font-semibold text-slate-800 uppercase">Escuelas de Procedencia (Nacional)</h1>
                <p class="text-sm text-slate-500 mt-1">
                    Catálogo global compartido por todos los planteles. Los colegios lo ven en su propio listado (solo lectura).
                </p>
            </div>
            <button class="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700" @click="openCreate">
                <PlusIcon class="w-4 h-4" /> NUEVA
            </button>
        </div>

        <!-- Filtros -->
        <div class="bg-white border rounded-xl p-3 flex flex-wrap gap-3 items-end">
            <div class="flex flex-col">
                <label class="text-[11px] font-semibold text-slate-500 uppercase mb-1">Estado</label>
                <select v-model="filterState" class="border rounded-lg px-3 py-1.5 text-sm min-w-[180px] focus:outline-none focus:ring-2 focus:ring-blue-400" @change="onStateChange">
                    <option value="">Todos</option>
                    <option v-for="s in states" :key="s.id" :value="s.id">{{ s.name }}</option>
                </select>
            </div>
            <div class="flex flex-col">
                <label class="text-[11px] font-semibold text-slate-500 uppercase mb-1">Municipio</label>
                <select v-model="filterMunicipality" :disabled="!filterState || loadingMunis" class="border rounded-lg px-3 py-1.5 text-sm min-w-[180px] disabled:bg-slate-50 disabled:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400" @change="applyFilters">
                    <option value="">{{ loadingMunis ? 'Cargando…' : 'Todos' }}</option>
                    <option v-for="m in municipalities" :key="m.id" :value="m.id">{{ m.name }}</option>
                </select>
            </div>
            <div class="flex flex-col">
                <label class="text-[11px] font-semibold text-slate-500 uppercase mb-1">Nivel</label>
                <input v-model="filterLevel" type="text" placeholder="p. ej. tecnológico" class="border rounded-lg px-3 py-1.5 text-sm min-w-[160px] focus:outline-none focus:ring-2 focus:ring-blue-400" @keyup.enter="applyFilters" @change="applyFilters" />
            </div>
            <div class="flex flex-col">
                <label class="text-[11px] font-semibold text-slate-500 uppercase mb-1">Estatus</label>
                <select v-model="filterStatus" class="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" @change="applyFilters">
                    <option value="">Todos</option>
                    <option value="1">Activa</option>
                    <option value="0">Inactiva</option>
                </select>
            </div>
            <button type="button" class="ml-auto px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 border rounded-lg hover:bg-slate-50" @click="clearFilters">
                Limpiar filtros
            </button>
        </div>

        <DataTable :columns="columns" :rows="rows" :loading="loading" :pagination="pagination" @change="handleChange">
            <template #cell-location="{ row }">
                <span class="text-sm text-slate-600">{{ locationOf(row) }}</span>
            </template>
            <template #cell-status="{ row }">
                <span class="px-2 py-1 text-xs font-semibold rounded-full"
                    :class="row.status === 1 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'">
                    {{ row.status === 1 ? 'ACTIVA' : 'INACTIVA' }}
                </span>
            </template>
            <template #cell-opciones="{ row }">
                <div class="flex items-center justify-center gap-2">
                    <button type="button" class="border p-1.5 rounded-md text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition" title="Editar" @click="openEdit(row)">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l2.651 2.651M7.5 13.85l-.75 3.75 3.75-.75L19.513 7.138a2.121 2.121 0 00-3-3L7.5 13.85z" /></svg>
                    </button>
                    <button type="button" class="border p-1.5 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 transition" title="Eliminar" @click="confirmDelete(row)">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M6 7.5h12m-10.5 0v10.125A1.875 1.875 0 009.375 19.5h5.25A1.875 1.875 0 0016.5 17.625V7.5M9.75 4.875A1.875 1.875 0 0111.625 3h.75A1.875 1.875 0 0114.25 4.875L15 7.5h-6l.75-2.625z" /></svg>
                    </button>
                </div>
            </template>
        </DataTable>

        <!-- Modal crear/editar -->
        <Teleport to="body">
            <Transition enter-active-class="transition-opacity duration-150" leave-active-class="transition-opacity duration-150" enter-from-class="opacity-0" leave-to-class="opacity-0">
                <div v-if="modalOpen" class="fixed inset-0 z-50 flex items-center justify-center">
                    <div class="absolute inset-0 bg-black/40" @click="closeModal" />
                    <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6 space-y-4">
                        <h2 class="text-sm font-bold uppercase tracking-widest text-slate-700">{{ editing ? 'Editar escuela' : 'Nueva escuela' }}</h2>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div class="sm:col-span-2">
                                <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Nombre</label>
                                <input v-model="form.name" type="text" maxlength="255" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Siglas</label>
                                <input v-model="form.short_name" type="text" maxlength="50" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">CCT</label>
                                <input v-model="form.cct" type="text" maxlength="20" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Nivel</label>
                                <input v-model="form.school_level" type="text" maxlength="50" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Estado</label>
                                <select v-model.number="form.status" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                                    <option :value="1">Activa</option>
                                    <option :value="0">Inactiva</option>
                                </select>
                            </div>
                            <div class="sm:col-span-2">
                                <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Domicilio</label>
                                <input v-model="form.address" type="text" maxlength="255" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Teléfono</label>
                                <input v-model="form.phone" type="text" maxlength="20" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Correo</label>
                                <input v-model="form.email" type="email" maxlength="255" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                            </div>
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

        <!-- Modal eliminar -->
        <Teleport to="body">
            <Transition enter-active-class="transition-opacity duration-150" leave-active-class="transition-opacity duration-150" enter-from-class="opacity-0" leave-to-class="opacity-0">
                <div v-if="deleteTarget" class="fixed inset-0 z-50 flex items-center justify-center">
                    <div class="absolute inset-0 bg-black/40" @click="deleteTarget = null" />
                    <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6 space-y-4">
                        <h2 class="text-sm font-bold uppercase tracking-widest text-slate-700">Eliminar escuela</h2>
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
import { ref, computed, onMounted } from 'vue'
import { PlusIcon } from '@heroicons/vue/24/outline'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import { useDataTableFetch } from '@/app/components/ui/datatable/useDataTableFetch'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { OriginSchoolType } from '@/modules/admissions/types/origin-school.type'

const endpoints = API.SUPERADMIN_API.admCatalogs.originSchools

// ── Filtros ────────────────────────────────────────────────────────────
const filterState = ref<string | number>('')
const filterMunicipality = ref<string | number>('')
const filterLevel = ref('')
const filterStatus = ref('')
const states = ref<{ id: number; name: string }[]>([])
const municipalities = ref<{ id: number; name: string }[]>([])
const loadingMunis = ref(false)

const extraSearch = computed<Record<string, any>>(() => {
    const f: Record<string, any> = {}
    if (filterState.value) f.f_state = filterState.value
    if (filterMunicipality.value) f.f_municipality = filterMunicipality.value
    if (filterLevel.value.trim()) f.f_level = filterLevel.value.trim()
    if (filterStatus.value !== '') f.f_status = filterStatus.value
    return f
})

const columns: DataTableColumn<OriginSchoolType>[] = [
    { key: 'id',        label: '#',        field: 'id',   sortable: true },
    { key: 'name',      label: 'NOMBRE',   field: 'name', sortable: true },
    { key: 'cct',       label: 'CCT',      field: 'cct',  sortable: false },
    { key: 'schoolLevel', label: 'NIVEL',  field: 'school_level', sortable: false },
    { key: 'location',  label: 'UBICACIÓN' },
    { key: 'status',    label: 'ESTADO' },
    { key: 'opciones',  label: 'OPCIONES' },
]

const { rows, loading, pagination, handleChange, fetchData } = useDataTableFetch<OriginSchoolType>({
    endpoint: endpoints.paginate,
    extraSearch,
})

function applyFilters() {
    pagination.value.page = 1
    fetchData()
}

async function onStateChange() {
    filterMunicipality.value = ''
    municipalities.value = []
    if (filterState.value) {
        loadingMunis.value = true
        try {
            const { data } = await api.get(API.GEO_API.municipalities(Number(filterState.value)))
            municipalities.value = Array.isArray(data) ? data : []
        } finally {
            loadingMunis.value = false
        }
    }
    applyFilters()
}

function clearFilters() {
    filterState.value = ''
    filterMunicipality.value = ''
    filterLevel.value = ''
    filterStatus.value = ''
    municipalities.value = []
    applyFilters()
}

function locationOf(row: any): string {
    const muni = row.municipalityName ?? row.geoSettlement?.municipality?.name
    const state = row.stateName ?? row.geoSettlement?.state?.name
    return [muni, state].filter(Boolean).join(', ') || '—'
}

const emptyForm = () => ({ name: '', short_name: '', cct: '', school_level: '', address: '', phone: '', email: '', status: 1 })
const modalOpen = ref(false)
const editing = ref<any | null>(null)
const submitting = ref(false)
const formError = ref<string | null>(null)
const form = ref(emptyForm())

function openCreate() { editing.value = null; form.value = emptyForm(); formError.value = null; modalOpen.value = true }
function openEdit(row: any) {
    editing.value = row
    form.value = {
        name: row.name ?? '', short_name: row.shortName ?? '', cct: row.cct ?? '',
        school_level: row.schoolLevel ?? '', address: row.address ?? '',
        phone: row.phone ?? '', email: row.email ?? '', status: row.status ?? 1,
    }
    formError.value = null; modalOpen.value = true
}
function closeModal() { modalOpen.value = false; editing.value = null }

async function submitForm() {
    formError.value = null
    if (!form.value.name.trim()) { formError.value = 'El nombre es requerido.'; return }
    submitting.value = true
    try {
        const payload = { ...form.value, email: form.value.email || null }
        if (editing.value) await api.put(endpoints.update(editing.value.id), payload)
        else await api.post(endpoints.create, payload)
        closeModal(); fetchData()
    } catch (e: any) { formError.value = e?.response?.data?.message ?? 'Error al guardar.' }
    finally { submitting.value = false }
}

const deleteTarget = ref<any | null>(null)
const deleting = ref(false)
function confirmDelete(row: any) { deleteTarget.value = row }
async function doDelete() {
    if (!deleteTarget.value) return
    deleting.value = true
    try { await api.delete(endpoints.delete(deleteTarget.value.id)); deleteTarget.value = null; fetchData() }
    catch (e: any) { console.error('Error eliminando:', e) }
    finally { deleting.value = false }
}

onMounted(async () => {
    try {
        const { data } = await api.get(API.GEO_API.states)
        states.value = Array.isArray(data) ? data : []
    } catch { /* ignore */ }
    fetchData()
})
</script>
