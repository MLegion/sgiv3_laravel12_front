<template>
    <div class="space-y-5">
        <div class="flex items-center justify-between flex-wrap gap-2">
            <div>
                <h1 class="text-xl font-semibold text-slate-800 uppercase">Catálogo de actividades</h1>
                <p class="text-xs text-slate-400">Nombres estandarizados (y créditos sugeridos) para no reescribirlos al crear actividades. Categorías: complementaria, extraescolar y curso MOOC. Las inactivas no aparecen en los selectores.</p>
            </div>
            <button @click="openCreate" class="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold flex items-center gap-2">
                <PlusIcon class="w-4 h-4" /> Nueva entrada
            </button>
        </div>

        <div class="flex items-center gap-2">
            <label class="text-xs font-semibold text-slate-500">Categoría</label>
            <select v-model="categoryFilter" @change="onFilterChange" class="rounded-lg border-slate-300 text-sm" :disabled="visibleCategories.length === 1">
                <option v-if="visibleCategories.length > 1" value="">Todas</option>
                <option v-for="c in visibleCategories" :key="c.value" :value="c.value">{{ c.label }}</option>
            </select>
        </div>

        <DataTable
            :columns="columns"
            :rows="rows"
            :loading="loading"
            :pagination="pagination"
            :initial-search="initialSearch"
            search-placeholder="Buscar por nombre…"
            @change="handleChange">

            <template #cell-category="{ row }">{{ categoryLabel(row.category) }}</template>
            <template #cell-default_credits="{ row }">{{ row.default_credits ?? '—' }}</template>
            <template #cell-scope="{ row }">
                <span class="text-xs" :class="row.is_global ? 'text-indigo-600' : 'text-slate-500'">{{ row.is_global ? 'Global' : 'Plantel' }}</span>
            </template>
            <template #cell-is_active="{ row }">
                <span class="px-2 py-1 text-xs font-semibold rounded-full" :class="row.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'">
                    {{ row.is_active ? 'ACTIVA' : 'INACTIVA' }}
                </span>
            </template>
            <template #cell-opciones="{ row }">
                <div class="flex items-center justify-center gap-2">
                    <button v-if="!row.is_global" @click="openEdit(row)" aria-label="Editar" title="Editar"
                        class="border p-1.5 rounded-md text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition">
                        <PencilSquareIcon class="w-4 h-4" />
                    </button>
                    <span v-else class="text-[10px] text-slate-300">global</span>
                </div>
            </template>
        </DataTable>

        <div v-if="showForm" class="fixed inset-0 bg-black/30 flex items-center justify-center z-20 p-4" @click.self="showForm = false">
            <div class="bg-white rounded-xl shadow-lg w-full max-w-md p-5 space-y-3">
                <h2 class="text-sm font-bold uppercase text-slate-500">{{ form.id ? 'Editar' : 'Nueva' }} entrada</h2>
                <div v-if="!form.id">
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Categoría</label>
                    <select v-model="form.category" class="w-full rounded-lg border-slate-300 text-sm">
                        <option v-for="c in visibleCategories" :key="c.value" :value="c.value">{{ c.label }}</option>
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Nombre</label>
                    <input v-model="form.name" class="w-full rounded-lg border-slate-300 text-sm" placeholder="p. ej. Taller de ajedrez" />
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Créditos sugeridos (opcional)</label>
                    <input v-model.number="form.default_credits" type="number" min="0" max="50" class="w-full rounded-lg border-slate-300 text-sm" placeholder="p. ej. 5" />
                </div>
                <label v-if="form.id" class="flex items-center gap-2 text-sm text-slate-600">
                    <input type="checkbox" v-model="form.is_active" /> Activa
                </label>
                <div class="flex justify-end gap-2 pt-1">
                    <button @click="showForm = false" class="px-4 py-2 rounded-lg border text-sm text-slate-500">Cancelar</button>
                    <button @click="save" :disabled="busy || !form.name || !form.category" class="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50">Guardar</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { PlusIcon, PencilSquareIcon } from '@heroicons/vue/24/outline'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import { useDataTableFetch } from '@/app/components/ui/datatable/useDataTableFetch'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'

const CATEGORIES = [
    { value: 'complementaria', label: 'Actividad complementaria' },
    { value: 'extraescolar',   label: 'Actividad extraescolar' },
    { value: 'mooc',           label: 'Curso MOOC' },
]
const categoryLabel = (v: string) => CATEGORIES.find(c => c.value === v)?.label ?? v

const AC = API.AC_API
const toast = useToast()
const busy = ref(false)
const showForm = ref(false)
const categoryFilter = ref('')
const form = reactive<any>({ id: null, category: 'complementaria', name: '', default_credits: null, is_active: true })

// Categorías permitidas según el rol (encargado = solo la suya; coordinador = todas).
const allowedCats = ref<string[]>(CATEGORIES.map(c => c.value))
const visibleCategories = computed(() => CATEGORIES.filter(c => allowedCats.value.includes(c.value)))
async function loadAllowedCategories() {
    try {
        const { data } = await api.get(AC.catalogCategories)
        allowedCats.value = Array.isArray(data?.categories) && data.categories.length ? data.categories : CATEGORIES.map(c => c.value)
    } catch { /* deja todas */ }
    // Encargado con una sola categoría: fija el filtro y el formulario.
    if (visibleCategories.value.length === 1) {
        categoryFilter.value = visibleCategories.value[0].value
        form.category = visibleCategories.value[0].value
    }
}

const columns: DataTableColumn[] = [
    { key: 'name',            label: 'NOMBRE',    field: 'name', sortable: true, searchable: true },
    { key: 'category',        label: 'CATEGORÍA', field: 'category', sortable: true },
    { key: 'default_credits', label: 'CRÉDITOS',  field: 'default_credits', sortable: true, align: 'center' },
    { key: 'scope',           label: 'ÁMBITO',    align: 'center' },
    { key: 'is_active',       label: 'ESTADO',    field: 'is_active', sortable: true, align: 'center' },
    { key: 'opciones',        label: 'OPCIONES',  align: 'center' },
]
const extraSearch = computed<Record<string, any>>(() => (categoryFilter.value ? { category: categoryFilter.value } : {}))
const { rows, loading, pagination, handleChange, fetchData, initialSearch } = useDataTableFetch<any>({
    endpoint: AC.activityCatalog,
    extraSearch,
})
function onFilterChange() { pagination.value.page = 1; fetchData() }

function openCreate() {
    const def = categoryFilter.value || visibleCategories.value[0]?.value || 'complementaria'
    Object.assign(form, { id: null, category: def, name: '', default_credits: null, is_active: true })
    showForm.value = true
}
function openEdit(r: any) {
    Object.assign(form, { id: r.id, category: r.category, name: r.name, default_credits: r.default_credits, is_active: r.is_active })
    showForm.value = true
}
async function save() {
    busy.value = true
    try {
        const credits = form.default_credits === '' || form.default_credits == null ? null : Number(form.default_credits)
        if (form.id) {
            await api.put(AC.activityCatalogItem(form.id), { name: form.name, default_credits: credits, is_active: form.is_active })
        } else {
            await api.post(AC.activityCatalog, { category: form.category, name: form.name, default_credits: credits })
        }
        toast.success('Catálogo guardado.')
        showForm.value = false
        await fetchData()
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudo guardar.') }
    finally { busy.value = false }
}

loadAllowedCategories().then(() => fetchData())
</script>
