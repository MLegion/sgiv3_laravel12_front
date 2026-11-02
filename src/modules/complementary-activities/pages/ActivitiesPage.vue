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
                <select v-model="periodId" @change="onFilterChange" class="w-full rounded-lg border-slate-300 text-sm">
                    <option value="">Elegir…</option>
                    <option v-for="p in periods" :key="p.id" :value="p.id">{{ p.name }}</option>
                </select>
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-500 mb-1">Tipo</label>
                <select v-model="typeFilter" @change="onFilterChange" class="w-full rounded-lg border-slate-300 text-sm">
                    <option value="">Todos</option>
                    <option v-for="t in types" :key="t.value" :value="t.value">{{ t.label }}</option>
                </select>
            </div>
            <div class="sm:col-span-2 text-right flex gap-2 justify-end">
                <button @click="openWindow" :disabled="!periodId" class="px-4 py-2 rounded-lg border text-slate-600 text-sm font-semibold disabled:opacity-50">Ventana de inscripción</button>
                <button @click="openCreate" :disabled="!periodId" class="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50">Nueva actividad</button>
            </div>
        </section>

        <!-- Lista -->
        <section v-if="periodId">
            <DataTable
                :columns="columns"
                :rows="rows"
                :loading="loading"
                :pagination="pagination"
                :initial-search="initialSearch"
                search-placeholder="Buscar actividad por nombre…"
                @change="handleChange">

                <template #cell-name="{ row }">
                    <span class="text-slate-700">{{ row.name }}</span>
                    <span v-if="row.career_name" class="block text-[11px] text-slate-400">{{ row.career_name }}</span>
                </template>
                <template #cell-type="{ row }">{{ typeLabel(row.type) }}</template>
                <template #cell-place="{ row }">{{ row.place_name ?? row.location_label ?? '—' }}</template>
                <template #cell-attendees="{ row }">{{ row.attendees_count }}<span v-if="row.capacity" class="text-slate-400"> / {{ row.capacity }}</span></template>
                <template #cell-status="{ row }">
                    <span class="px-2 py-1 text-xs font-semibold rounded-full" :class="row.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'">
                        {{ row.status === 'active' ? 'ACTIVA' : 'ARCHIVADA' }}
                    </span>
                </template>

                <template #cell-opciones="{ row }">
                    <div class="flex items-center justify-center gap-2">
                        <RouterLink :to="`/complementary-activities/${row.id}`" aria-label="Ver" title="Ver"
                            class="border p-1.5 rounded-md text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition">
                            <EyeIcon class="w-4 h-4" />
                        </RouterLink>
                        <button v-if="row.status === 'active'" @click="archive(row)" aria-label="Archivar" title="Archivar"
                            class="border p-1.5 rounded-md text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition">
                            <ArchiveBoxArrowDownIcon class="w-4 h-4" />
                        </button>
                        <button v-else @click="reopen(row)" aria-label="Reabrir" title="Reabrir"
                            class="border p-1.5 rounded-md text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition">
                            <ArrowUturnLeftIcon class="w-4 h-4" />
                        </button>
                        <button v-if="row.attendees_count === 0" @click="remove(row)" aria-label="Eliminar" title="Eliminar (sin alumnos)"
                            class="border p-1.5 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 transition">
                            <TrashIcon class="w-4 h-4" />
                        </button>
                    </div>
                </template>
            </DataTable>
        </section>

        <!-- Modal ventana general de inscripción (por periodo) -->
        <div v-if="showWindow" class="fixed inset-0 bg-black/30 flex items-center justify-center z-20 p-4" @click.self="showWindow = false">
            <div class="bg-white rounded-xl shadow-lg w-full max-w-md p-5 space-y-3">
                <h2 class="text-sm font-bold uppercase text-slate-500">Ventana general de inscripción</h2>
                <p class="text-[11px] text-slate-500">Periodo: <strong>{{ selectedPeriodName }}</strong></p>
                <p class="text-[11px] text-slate-400">Aplica a TODAS las actividades de ESTE periodo (el seleccionado arriba). Una actividad puede fijar su propia ventana que pisa ésta.</p>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-[10px] uppercase text-slate-400 mb-1">Abre</label>
                        <input v-model="windowForm.opens_at" type="datetime-local" class="w-full rounded-lg border-slate-300 text-sm" />
                    </div>
                    <div>
                        <label class="block text-[10px] uppercase text-slate-400 mb-1">Cierra</label>
                        <input v-model="windowForm.closes_at" type="datetime-local" class="w-full rounded-lg border-slate-300 text-sm" />
                    </div>
                    <div class="col-span-2">
                        <label class="block text-[10px] uppercase text-slate-400 mb-1">Máx. actividades por alumno en el periodo</label>
                        <input v-model.number="windowForm.max_per_period" type="number" min="0" max="50" class="w-full rounded-lg border-slate-300 text-sm" />
                        <p class="text-[10px] text-slate-400 mt-0.5">0 = sin límite. (SGIv2 usaba 3.)</p>
                    </div>
                </div>
                <div class="flex justify-end gap-2 pt-1">
                    <button @click="showWindow = false" class="px-4 py-2 rounded-lg border text-sm text-slate-500">Cancelar</button>
                    <button @click="saveWindow" :disabled="busy" class="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50">Guardar</button>
                </div>
            </div>
        </div>

        <!-- Modal alta -->
        <div v-if="showCreate" class="fixed inset-0 bg-black/30 flex items-center justify-center z-20 p-4" @click.self="showCreate = false">
            <div class="bg-white rounded-xl shadow-lg w-full max-w-lg p-5 space-y-3">
                <h2 class="text-sm font-bold uppercase text-slate-500">Nueva actividad</h2>
                <div class="grid sm:grid-cols-2 gap-3">
                    <div>
                        <label class="block text-xs font-semibold text-slate-500 mb-1">Tipo</label>
                        <select v-model="form.type" @change="onTypeChange" class="w-full rounded-lg border-slate-300 text-sm">
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
                        <input v-model="form.name" @change="onNamePicked" :list="nameCatalog.length ? 'ac-name-catalog' : undefined" class="w-full rounded-lg border-slate-300 text-sm" placeholder="p. ej. Taller de ajedrez" />
                        <datalist id="ac-name-catalog">
                            <option v-for="c in nameCatalog" :key="c.id" :value="c.name" />
                        </datalist>
                        <p v-if="nameCatalog.length" class="text-[10px] text-slate-400 mt-0.5">Elige del catálogo o escribe uno nuevo.</p>
                    </div>

                    <!-- Grupo (requerido para tutoría grupal) -->
                    <div class="sm:col-span-2 relative">
                        <label class="block text-xs font-semibold text-slate-500 mb-1">
                            Grupo <span v-if="form.type === 'group_tutoring'" class="text-rose-500">*</span>
                            <span v-else class="text-slate-400">(opcional)</span>
                        </label>
                        <div v-if="form.group_id" class="flex items-center gap-2 mb-1 text-sm">
                            <span class="px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold">{{ form.group_label }}</span>
                            <button @click="clearGroup" class="text-xs text-slate-400 hover:text-rose-500">cambiar</button>
                        </div>
                        <template v-else>
                            <input v-model="groupSearch" @input="searchGroups" class="w-full rounded-lg border-slate-300 text-sm" placeholder="Buscar grupo por nombre…" />
                            <ul v-if="groupResults.length" class="absolute z-10 bg-white border rounded-lg mt-1 w-full max-h-48 overflow-y-auto shadow">
                                <li v-for="g in groupResults" :key="g.id" @click="pickGroup(g)" class="px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer">
                                    {{ g.name }} <span class="text-slate-400">· {{ g.shift }}<span v-if="g.careers"> · {{ g.careers }}</span></span>
                                </li>
                            </ul>
                        </template>
                    </div>

                    <!-- Instructor / tutor -->
                    <div class="sm:col-span-2 relative">
                        <label class="block text-xs font-semibold text-slate-500 mb-1">
                            Instructor / tutor
                            <span v-if="form.type === 'group_tutoring'" class="text-slate-400">(será el tutor del grupo)</span>
                        </label>
                        <div v-if="form.instructor_user_id" class="flex items-center gap-2 mb-1 text-sm">
                            <span class="px-2 py-1 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 font-semibold">{{ form.instructor_label }}</span>
                            <button @click="clearInstructor" class="text-xs text-slate-400 hover:text-rose-500">cambiar</button>
                        </div>
                        <template v-else>
                            <input v-model="instructorSearch" @input="searchInstructors" class="w-full rounded-lg border-slate-300 text-sm" placeholder="Buscar empleado por nombre…" />
                            <ul v-if="instructorResults.length" class="absolute z-10 bg-white border rounded-lg mt-1 w-full max-h-48 overflow-y-auto shadow">
                                <li v-for="t in instructorResults" :key="t.value" @click="pickInstructor(t)" class="px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer">{{ t.label }}</li>
                            </ul>
                        </template>
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
                    <button @click="create" :disabled="busy || !form.type || !form.name || (!form.place_id && !form.location_label) || (form.type === 'group_tutoring' && !form.group_id)"
                        class="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50">Crear</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { EyeIcon, ArchiveBoxArrowDownIcon, ArrowUturnLeftIcon, TrashIcon } from '@heroicons/vue/24/outline'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import { useDataTableFetch } from '@/app/components/ui/datatable/useDataTableFetch'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'

const AC = API.AC_API
const toast = useToast()

const periods = ref<any[]>([])
const careers = ref<any[]>([])
const types = ref<any[]>([])
const periodId = ref<string>('')
const typeFilter = ref<string>('')
const busy = ref(false)

// ── Tabla paginada (DataTable del proyecto) ──────────────────────────────────
const columns: DataTableColumn[] = [
    { key: 'name',      label: 'ACTIVIDAD', field: 'name',    sortable: true, searchable: true },
    { key: 'type',      label: 'TIPO',      field: 'type',    sortable: true },
    { key: 'place',     label: 'LUGAR' },
    { key: 'credits',   label: 'CRÉDITOS',  field: 'credits', sortable: true, align: 'center' },
    { key: 'attendees', label: 'INSCRITOS', align: 'center' },
    { key: 'status',    label: 'ESTADO',    field: 'status',  sortable: true, align: 'center' },
    { key: 'opciones',  label: 'OPCIONES',  align: 'center' },
]
// period_id/type viajan como filtros extra (se fusionan en search[] del backend).
const extraSearch = computed<Record<string, any>>(() => {
    const s: Record<string, any> = {}
    if (periodId.value) s.period_id = Number(periodId.value)
    if (typeFilter.value) s.type = typeFilter.value
    return s
})
const { rows, loading, pagination, handleChange, fetchData, initialSearch } = useDataTableFetch<any>({
    endpoint: AC.activities,
    extraSearch,
})
function onFilterChange() {
    if (!periodId.value) { rows.value = []; pagination.value.total = 0; return }
    pagination.value.page = 1
    fetchData()
}

// ── Ventana GENERAL de inscripción (por periodo) ─────────────────────────────
const selectedPeriodName = computed(() => periods.value.find((p: any) => String(p.id) === String(periodId.value))?.name ?? '—')
const showWindow = ref(false)
const windowForm = reactive<{ opens_at: string | null; closes_at: string | null; max_per_period: number }>({ opens_at: null, closes_at: null, max_per_period: 3 })
const toLocal = (v: any) => (v ? String(v).replace(' ', 'T').substring(0, 16) : null)
const toIso = (v: string | null) => (v ? v.replace('T', ' ') + ':00' : null)
async function openWindow() {
    if (!periodId.value) return
    try {
        const { data } = await api.get(AC.enrollmentWindow, { params: { period_id: periodId.value } })
        windowForm.opens_at = toLocal(data?.opens_at)
        windowForm.closes_at = toLocal(data?.closes_at)
        windowForm.max_per_period = data?.max_per_period ?? 3
    } catch { windowForm.opens_at = null; windowForm.closes_at = null; windowForm.max_per_period = 3 }
    showWindow.value = true
}
async function saveWindow() {
    await act(async () => {
        await api.put(AC.enrollmentWindow, {
            period_id: Number(periodId.value),
            opens_at: toIso(windowForm.opens_at),
            closes_at: toIso(windowForm.closes_at),
            max_per_period: Number(windowForm.max_per_period) || 0,
        })
        toast.success('Ventana de inscripción guardada.')
        showWindow.value = false
    })
}

const showCreate = ref(false)
const form = reactive<any>({ type: '', name: '', career_id: null, group_id: null, group_label: '', instructor_user_id: null, instructor_label: '', place_id: null, place_label: '', location_label: '', capacity: null, credits: 0 })

// Catálogo de nombres estandarizados para el tipo seleccionado (autocompletar).
const nameCatalog = ref<any[]>([])
async function loadNameCatalog() {
    if (form.type !== 'complementaria' && form.type !== 'extraescolar') { nameCatalog.value = []; return }
    try {
        const { data } = await api.get(AC.activeActivityCatalog, { params: { category: form.type } })
        nameCatalog.value = data ?? []
    } catch { nameCatalog.value = [] }
}
function onTypeChange() {
    form.name = ''
    loadNameCatalog()
}
// Al elegir un nombre del catálogo, autollena los créditos sugeridos (editable).
function onNamePicked() {
    const hit = nameCatalog.value.find(c => c.name === form.name)
    if (hit && hit.default_credits != null) form.credits = hit.default_credits
}

const placeSearch = ref('')
const placeResults = ref<any[]>([])
let placeTimer: any = null

const groupSearch = ref('')
const groupResults = ref<any[]>([])
let groupTimer: any = null
const instructorSearch = ref('')
const instructorResults = ref<any[]>([])
let instructorTimer: any = null

function searchGroups() {
    clearTimeout(groupTimer)
    groupTimer = setTimeout(async () => {
        if (!periodId.value || groupSearch.value.trim().length < 2) { groupResults.value = []; return }
        const { data } = await api.get(AC.groups, { params: { period_id: periodId.value, career_id: form.career_id || undefined, q: groupSearch.value } })
        groupResults.value = data ?? []
    }, 300)
}
function pickGroup(g: any) {
    form.group_id = g.id; form.group_label = g.name
    // Autollena la carrera si el grupo tiene exactamente una.
    if (!form.career_id && Array.isArray(g.career_ids) && g.career_ids.length === 1) form.career_id = g.career_ids[0]
    groupResults.value = []; groupSearch.value = ''
}
function clearGroup() { form.group_id = null; form.group_label = '' }

function searchInstructors() {
    clearTimeout(instructorTimer)
    instructorTimer = setTimeout(async () => {
        if (instructorSearch.value.trim().length < 2) { instructorResults.value = []; return }
        const { data } = await api.get(AC.instructors, { params: { q: instructorSearch.value } })
        instructorResults.value = data ?? []
    }, 300)
}
function pickInstructor(t: any) {
    form.instructor_user_id = t.value; form.instructor_label = t.label
    instructorResults.value = []; instructorSearch.value = ''
}
function clearInstructor() { form.instructor_user_id = null; form.instructor_label = '' }

function typeLabel(v: string): string {
    return types.value.find(t => t.value === v)?.label ?? v
}

async function loadCatalog() {
    const { data } = await api.get(AC.catalog)
    periods.value = data.periods ?? []
    careers.value = data.careers ?? []
    types.value = data.types ?? []
}

function openCreate() {
    Object.assign(form, { type: '', name: '', career_id: null, group_id: null, group_label: '', instructor_user_id: null, instructor_label: '', place_id: null, place_label: '', location_label: '', capacity: null, credits: 0 })
    placeSearch.value = ''; placeResults.value = []
    groupSearch.value = ''; groupResults.value = []
    instructorSearch.value = ''; instructorResults.value = []
    nameCatalog.value = []
    // Si el usuario solo puede crear una categoría (encargado), autoselecciónala.
    if (types.value.length === 1) { form.type = types.value[0].value; onTypeChange() }
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
            group_id: form.group_id,
            instructor_user_id: form.instructor_user_id,
            place_id: form.place_id,
            location_label: form.place_id ? null : (form.location_label || null),
            capacity: form.capacity ? Number(form.capacity) : null,
            credits: Number(form.credits) || 0,
        })
        toast.success('Actividad creada.')
        showCreate.value = false
        await fetchData()
    })
}
// Archivar (reabrible) / Reabrir / Eliminar (solo sin alumnos registrados).
async function archive(a: any) {
    if (!confirm(`¿Archivar la actividad "${a.name}"? Podrás reabrirla después.`)) return
    await act(async () => {
        await api.post(AC.close(a.id), {})
        toast.success('Actividad archivada.')
        await fetchData()
    })
}
async function reopen(a: any) {
    await act(async () => {
        await api.post(AC.reopen(a.id), {})
        toast.success('Actividad reabierta.')
        await fetchData()
    })
}
async function remove(a: any) {
    if (!confirm(`¿Eliminar la actividad "${a.name}"? Esta acción no se puede deshacer.`)) return
    await act(async () => {
        await api.delete(AC.destroy(a.id))
        toast.success('Actividad eliminada.')
        await fetchData()
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
    if (periods.value.length) { periodId.value = String(periods.value[0].id); await fetchData() }
})
</script>
