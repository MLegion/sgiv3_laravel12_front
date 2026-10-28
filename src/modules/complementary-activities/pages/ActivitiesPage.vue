<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between flex-wrap gap-2">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Actividades Complementarias</h1>
            <p class="text-xs text-slate-400">Actividades que otorgan créditos (Cap. 15): agendadas con instructor, lugar y lista.</p>
        </div>

        <!-- Filtros -->
        <section class="rounded-xl border bg-white p-4 grid sm:grid-cols-4 gap-3 items-end">
            <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1">Periodo</label>
                <select v-model="periodId" @change="loadList" class="w-full rounded-lg border-slate-300 text-sm">
                    <option value="">Elegir…</option>
                    <option v-for="p in periods" :key="p.id" :value="p.id">{{ p.name }}</option>
                </select>
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1">Tipo</label>
                <select v-model="typeFilter" @change="loadList" class="w-full rounded-lg border-slate-300 text-sm">
                    <option value="">Todos</option>
                    <option v-for="t in types" :key="t.value" :value="t.value">{{ t.label }}</option>
                </select>
            </div>
            <div class="sm:col-span-2 text-right">
                <button @click="openCreate" :disabled="!periodId" class="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50">Nueva actividad</button>
            </div>
        </section>

        <!-- Lista -->
        <section v-if="periodId" class="rounded-xl border bg-white p-4">
            <p v-if="!rows.length" class="text-sm text-slate-400">Sin actividades para este periodo.</p>
            <table v-else class="w-full text-sm">
                <thead><tr class="text-left text-[10px] uppercase text-slate-400 bg-slate-50 border-y">
                    <th class="px-3 py-1">Actividad</th><th>Tipo</th><th>Lugar</th><th>Créditos</th><th>Inscritos</th><th>Estado</th><th></th>
                </tr></thead>
                <tbody>
                    <tr v-for="a in rows" :key="a.id" class="border-b last:border-0 hover:bg-slate-50">
                        <td class="px-3 py-2 text-slate-700">{{ a.name }}<span v-if="a.career_name" class="block text-[11px] text-slate-400">{{ a.career_name }}</span></td>
                        <td class="text-slate-600">{{ typeLabel(a.type) }}</td>
                        <td class="text-slate-600">{{ a.place_name ?? a.location_label ?? '—' }}</td>
                        <td class="text-slate-600">{{ a.credits }}</td>
                        <td class="text-slate-600">{{ a.attendees_count }}<span v-if="a.capacity"> / {{ a.capacity }}</span></td>
                        <td><span :class="a.status === 'active' ? 'text-emerald-600' : 'text-slate-400'">{{ a.status === 'active' ? 'Activa' : 'Cerrada' }}</span></td>
                        <td class="text-right whitespace-nowrap">
                            <RouterLink :to="`/complementary-activities/${a.id}`" class="text-xs text-emerald-600 hover:underline">ver</RouterLink>
                            <button v-if="a.status === 'active'" @click="close(a)" class="ml-3 text-xs text-slate-400 hover:text-rose-500">cerrar</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </section>

        <!-- Modal alta -->
        <div v-if="showCreate" class="fixed inset-0 bg-black/30 flex items-center justify-center z-20 p-4" @click.self="showCreate = false">
            <div class="bg-white rounded-xl shadow-lg w-full max-w-lg p-5 space-y-3">
                <h2 class="text-sm font-bold uppercase text-slate-500">Nueva actividad</h2>
                <div class="grid sm:grid-cols-2 gap-3">
                    <div>
                        <label class="block text-xs font-semibold text-slate-500 mb-1">Tipo</label>
                        <select v-model="form.type" class="w-full rounded-lg border-slate-300 text-sm">
                            <option value="">Elegir…</option>
                            <option v-for="t in types" :key="t.value" :value="t.value">{{ t.label }}</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-500 mb-1">Carrera (opcional)</label>
                        <select v-model="form.career_id" class="w-full rounded-lg border-slate-300 text-sm">
                            <option :value="null">—</option>
                            <option v-for="c in careers" :key="c.id" :value="c.id">{{ c.name }}</option>
                        </select>
                    </div>
                    <div class="sm:col-span-2">
                        <label class="block text-xs font-semibold text-slate-500 mb-1">Nombre</label>
                        <input v-model="form.name" class="w-full rounded-lg border-slate-300 text-sm" placeholder="p. ej. Taller de ajedrez" />
                    </div>
                    <div class="sm:col-span-2 relative">
                        <label class="block text-xs font-semibold text-slate-500 mb-1">Lugar</label>
                        <div v-if="form.place_id" class="flex items-center gap-2 mb-1 text-sm">
                            <span class="px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold">{{ form.place_label }}</span>
                            <button @click="clearPlace" class="text-xs text-slate-400 hover:text-rose-500">cambiar</button>
                        </div>
                        <template v-else>
                            <input v-model="placeSearch" @input="searchPlaces" class="w-full rounded-lg border-slate-300 text-sm" placeholder="Buscar aula…" />
                            <ul v-if="placeResults.length" class="absolute z-10 bg-white border rounded-lg mt-1 w-full max-h-48 overflow-y-auto shadow">
                                <li v-for="pl in placeResults" :key="pl.id" @click="pickPlace(pl)" class="px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer">
                                    {{ pl.name }} <span class="text-slate-400">· {{ pl.building_name }}</span>
                                </li>
                            </ul>
                            <input v-model="form.location_label" class="w-full rounded-lg border-slate-300 text-sm mt-1" placeholder="…o escribe un lugar (no salón)" />
                        </template>
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-500 mb-1">Cupo (opcional)</label>
                        <input v-model="form.capacity" type="number" min="1" class="w-full rounded-lg border-slate-300 text-sm" />
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-500 mb-1">Créditos</label>
                        <input v-model="form.credits" type="number" min="0" max="50" class="w-full rounded-lg border-slate-300 text-sm" />
                    </div>
                </div>
                <div class="flex justify-end gap-2 pt-1">
                    <button @click="showCreate = false" class="px-4 py-2 rounded-lg border text-sm text-slate-500">Cancelar</button>
                    <button @click="create" :disabled="busy || !form.type || !form.name || (!form.place_id && !form.location_label)"
                        class="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50">Crear</button>
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

const AC = API.AC_API
const toast = useToast()

const periods = ref<any[]>([])
const careers = ref<any[]>([])
const types = ref<any[]>([])
const rows = ref<any[]>([])
const periodId = ref<string>('')
const typeFilter = ref<string>('')
const busy = ref(false)

const showCreate = ref(false)
const form = reactive<any>({ type: '', name: '', career_id: null, place_id: null, place_label: '', location_label: '', capacity: null, credits: 0 })

const placeSearch = ref('')
const placeResults = ref<any[]>([])
let placeTimer: any = null

function typeLabel(v: string): string {
    return types.value.find(t => t.value === v)?.label ?? v
}

async function loadCatalog() {
    const { data } = await api.get(AC.catalog)
    periods.value = data.periods ?? []
    careers.value = data.careers ?? []
    types.value = data.types ?? []
}
async function loadList() {
    rows.value = []
    if (!periodId.value) return
    const { data } = await api.get(AC.activities, { params: { period_id: periodId.value, type: typeFilter.value || undefined } })
    rows.value = data ?? []
}

function openCreate() {
    Object.assign(form, { type: '', name: '', career_id: null, place_id: null, place_label: '', location_label: '', capacity: null, credits: 0 })
    placeSearch.value = ''; placeResults.value = []
    showCreate.value = true
}
function searchPlaces() {
    clearTimeout(placeTimer)
    placeTimer = setTimeout(async () => {
        if (placeSearch.value.trim().length < 2) { placeResults.value = []; return }
        const { data } = await api.get(AC.catalog, { params: { place_search: placeSearch.value } })
        placeResults.value = data.places ?? []
    }, 300)
}
function pickPlace(pl: any) {
    form.place_id = pl.id; form.place_label = pl.name; form.location_label = ''
    placeResults.value = []; placeSearch.value = ''
}
function clearPlace() { form.place_id = null; form.place_label = '' }

async function create() {
    await act(async () => {
        await api.post(AC.activities, {
            period_id: Number(periodId.value),
            type: form.type,
            name: form.name,
            career_id: form.career_id,
            place_id: form.place_id,
            location_label: form.place_id ? null : (form.location_label || null),
            capacity: form.capacity ? Number(form.capacity) : null,
            credits: Number(form.credits) || 0,
        })
        toast.success('Actividad creada.')
        showCreate.value = false
        await loadList()
    })
}
async function close(a: any) {
    if (!confirm(`¿Cerrar la actividad "${a.name}"?`)) return
    await act(async () => {
        await api.post(AC.close(a.id), {})
        toast.success('Actividad cerrada.')
        await loadList()
    })
}

async function act(fn: () => Promise<void>) {
    busy.value = true
    try { await fn() }
    catch (e: any) { toast.error(e?.response?.data?.message ?? 'Operación no permitida.') }
    finally { busy.value = false }
}

onMounted(async () => {
    await loadCatalog()
    if (periods.value.length) { periodId.value = String(periods.value[0].id); await loadList() }
})
</script>
