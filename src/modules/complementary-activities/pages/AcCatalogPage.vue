<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between flex-wrap gap-2">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Catálogo de actividades</h1>
            <button @click="openCreate" class="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold">Nueva entrada</button>
        </div>
        <p class="text-xs text-slate-400">Nombres estandarizados (y créditos sugeridos) para no reescribirlos al crear actividades. Categorías: actividad complementaria, actividad extraescolar y curso MOOC. Las inactivas no aparecen en los selectores.</p>

        <div class="flex items-center gap-2">
            <label class="text-xs font-semibold text-slate-500">Categoría</label>
            <select v-model="categoryFilter" @change="load" class="rounded-lg border-slate-300 text-sm">
                <option value="">Todas</option>
                <option v-for="c in CATEGORIES" :key="c.value" :value="c.value">{{ c.label }}</option>
            </select>
        </div>

        <section class="rounded-xl border bg-white p-4">
            <p v-if="!rows.length" class="text-sm text-slate-400">Sin entradas. Crea la primera.</p>
            <table v-else class="w-full text-sm">
                <thead><tr class="text-left text-[10px] uppercase text-slate-400 bg-slate-50 border-y">
                    <th class="px-3 py-1">Nombre</th><th>Categoría</th><th>Créditos</th><th>Ámbito</th><th>Activa</th><th></th>
                </tr></thead>
                <tbody>
                    <tr v-for="r in rows" :key="r.id" class="border-b last:border-0">
                        <td class="px-3 py-2 text-slate-700">{{ r.name }}</td>
                        <td class="text-slate-500">{{ categoryLabel(r.category) }}</td>
                        <td class="text-slate-600">{{ r.default_credits ?? '—' }}</td>
                        <td class="text-slate-500">{{ r.is_global ? 'Global' : 'Plantel' }}</td>
                        <td><span :class="r.is_active ? 'text-emerald-600' : 'text-slate-400'">{{ r.is_active ? 'Sí' : 'No' }}</span></td>
                        <td class="text-right"><button v-if="!r.is_global" @click="openEdit(r)" class="text-xs text-emerald-600 hover:underline">editar</button><span v-else class="text-[10px] text-slate-300">global</span></td>
                    </tr>
                </tbody>
            </table>
        </section>

        <div v-if="showForm" class="fixed inset-0 bg-black/30 flex items-center justify-center z-20 p-4" @click.self="showForm = false">
            <div class="bg-white rounded-xl shadow-lg w-full max-w-md p-5 space-y-3">
                <h2 class="text-sm font-bold uppercase text-slate-500">{{ form.id ? 'Editar' : 'Nueva' }} entrada</h2>
                <div v-if="!form.id">
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Categoría</label>
                    <select v-model="form.category" class="w-full rounded-lg border-slate-300 text-sm">
                        <option v-for="c in CATEGORIES" :key="c.value" :value="c.value">{{ c.label }}</option>
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
import { ref, reactive, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'

const CATEGORIES = [
    { value: 'complementaria', label: 'Actividad complementaria' },
    { value: 'extraescolar',   label: 'Actividad extraescolar' },
    { value: 'mooc',           label: 'Curso MOOC' },
]
const categoryLabel = (v: string) => CATEGORIES.find(c => c.value === v)?.label ?? v

const AC = API.AC_API
const toast = useToast()
const rows = ref<any[]>([])
const busy = ref(false)
const showForm = ref(false)
const categoryFilter = ref('')
const form = reactive<any>({ id: null, category: 'complementaria', name: '', default_credits: null, is_active: true })

async function load() {
    const { data } = await api.get(AC.activityCatalog, { params: categoryFilter.value ? { category: categoryFilter.value } : {} })
    rows.value = data ?? []
}
function openCreate() {
    Object.assign(form, { id: null, category: categoryFilter.value || 'complementaria', name: '', default_credits: null, is_active: true })
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
        await load()
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudo guardar.') }
    finally { busy.value = false }
}

onMounted(load)
</script>
