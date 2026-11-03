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
                    <div :class="types.length === 1 ? 'sm:col-span-2' : ''">
                        <label class="block text-xs font-semibold text-slate-500 mb-1">Tipo</label>
                        <select v-model="form.type" @change="onTypeChange" class="w-full rounded-lg border-slate-300 text-sm">
                            <option value="">Elegir…</option>
                            <option v-for="t in types" :key="t.value" :value="t.value">{{ t.label }}</option>
                        </select>
                    </div>
                    <!-- Nombre: del CATÁLOGO (complementaria/extraescolar) o libre (tutoría grupal) -->
                    <div class="sm:col-span-2">
                        <label class="block text-xs font-semibold text-slate-500 mb-1">Nombre</label>
                        <template v-if="usesCatalog">
                            <div class="flex items-center gap-2">
                                <select v-model="form.name" @change="onCatalogPick" class="flex-1 rounded-lg border-slate-300 text-sm">
                                    <option value="">Elige del catálogo…</option>
                                    <option v-for="c in nameCatalog" :key="c.id" :value="c.name">{{ c.name }}<span v-if="c.default_credits != null"> · {{ c.default_credits }} cr</span></option>
                                </select>
                                <button type="button" @click="openCatalogAdd" class="px-3 py-2 rounded-lg border text-xs font-semibold text-emerald-600 whitespace-nowrap">+ Nueva</button>
                            </div>
                            <p class="text-[10px] text-slate-400 mt-0.5">Elige del catálogo. Si falta, usa “+ Nueva” para agregarla al catálogo del plantel.</p>
                        </template>
                        <input v-else v-model="form.name" class="w-full rounded-lg border-slate-300 text-sm" placeholder="Nombre de la actividad" />
                    </div>

                    <!-- Grupo (solo tutoría grupal; la carrera se deriva del grupo) -->
                    <div v-if="form.type === 'group_tutoring'" class="sm:col-span-2">
                        <label class="block text-xs font-semibold text-slate-500 mb-1">Grupo <span class="text-rose-500">*</span></label>
                        <FormRemoteSelect
                            v-model="form.group_id"
                            :endpoint="AC.groups"
                            :params="{ period_id: periodId }"
                            item-value="id"
                            item-label="name"
                            :item-searchs="['name']"
                            placeholder="Buscar grupo por nombre…"
                            @update:model-value="form.place_id = null" />
                    </div>

                    <!-- Instructor / tutor -->
                    <div class="sm:col-span-2">
                        <label class="block text-xs font-semibold text-slate-500 mb-1">
                            Instructor / tutor <span v-if="form.type === 'group_tutoring'" class="text-slate-400">(será el tutor del grupo)</span>
                        </label>
                        <FormRemoteSelect
                            v-model="form.instructor_user_id"
                            :endpoint="AC.personnel"
                            :endpoint-by-id="AC.personnelById"
                            item-value="user_id"
                            item-label="full_name"
                            :item-searchs="['full_name']"
                            placeholder="Ver listado o buscar personal…" />
                    </div>

                    <!-- Lugar por defecto (limitado por el tipo) -->
                    <div class="sm:col-span-2">
                        <label class="block text-xs font-semibold text-slate-500 mb-1">Lugar por defecto (opcional)</label>
                        <FormRemoteSelect
                            :key="`place-${form.type}-${form.group_id ?? ''}`"
                            v-model="form.place_id"
                            :endpoint="AC.placePool"
                            :endpoint-by-id="AC.placeById"
                            :params="{ type: form.type, group_id: form.group_id ?? undefined }"
                            item-value="id"
                            item-label="name"
                            :item-searchs="['name']"
                            :disabled="!form.type || (form.type === 'group_tutoring' && !form.group_id)"
                            placeholder="Elegir aula de las permitidas…" />
                        <p class="text-[10px] text-slate-400 mt-0.5">Solo las aulas que corresponden al tipo (oferta de la carrera o lugares de la categoría). Se puede ajustar después.</p>
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
                    <button @click="create" :disabled="busy || !form.type || !form.name || (form.type === 'group_tutoring' && !form.group_id)"
                        class="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50">Crear</button>
                </div>
            </div>
        </div>

        <!-- Sub-modal: agregar al catálogo del plantel -->
        <div v-if="showCatalogAdd" class="fixed inset-0 bg-black/40 flex items-center justify-center z-30 p-4" @click.self="showCatalogAdd = false">
            <div class="bg-white rounded-xl shadow-lg w-full max-w-sm p-5 space-y-3">
                <h2 class="text-sm font-bold uppercase text-slate-500">Agregar al catálogo ({{ typeLabel(form.type) }})</h2>
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Nombre</label>
                    <input v-model="catalogAdd.name" class="w-full rounded-lg border-slate-300 text-sm" placeholder="p. ej. Taller de ajedrez" />
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Créditos sugeridos (opcional)</label>
                    <input v-model.number="catalogAdd.default_credits" type="number" min="0" max="50" class="w-full rounded-lg border-slate-300 text-sm" />
                </div>
                <p class="text-[10px] text-slate-400">Se guarda en el catálogo de este plantel (no global). Si ya existe, se reutiliza.</p>
                <div class="flex justify-end gap-2 pt-1">
                    <button @click="showCatalogAdd = false" class="px-4 py-2 rounded-lg border text-sm text-slate-500">Cancelar</button>
                    <button @click="saveCatalogAdd" :disabled="busy || !catalogAdd.name" class="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50">Agregar</button>
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
import FormRemoteSelect from '@/app/components/ui/form/FormRemoteSelect.vue'

const AC = API.AC_API
const toast = useToast()

const periods = ref<any[]>([])
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
const form = reactive<any>({ type: '', name: '', group_id: null, instructor_user_id: null, place_id: null, capacity: null, credits: 0 })

// El nombre se elige del CATÁLOGO para complementaria/extraescolar; libre para tutoría grupal.
const usesCatalog = computed(() => form.type === 'complementaria' || form.type === 'extraescolar')
const nameCatalog = ref<any[]>([])
async function loadNameCatalog() {
    if (!usesCatalog.value) { nameCatalog.value = []; return }
    try {
        const { data } = await api.get(AC.activeActivityCatalog, { params: { category: form.type } })
        nameCatalog.value = data?.items ?? data ?? []
    } catch { nameCatalog.value = [] }
}
function onTypeChange() {
    // El tipo limita grupo/lugar: se reinician al cambiarlo.
    form.name = ''
    form.group_id = null
    form.place_id = null
    loadNameCatalog()
}
// Al elegir un nombre del catálogo, autollena los créditos sugeridos (editable).
function onCatalogPick() {
    const hit = nameCatalog.value.find(c => c.name === form.name)
    if (hit && hit.default_credits != null) form.credits = hit.default_credits
}

// ── Sub-modal: agregar un nombre al catálogo del plantel (categoría = tipo) ──
const showCatalogAdd = ref(false)
const catalogAdd = reactive<{ name: string; default_credits: number | null }>({ name: '', default_credits: null })
function openCatalogAdd() { catalogAdd.name = ''; catalogAdd.default_credits = null; showCatalogAdd.value = true }
async function saveCatalogAdd() {
    await act(async () => {
        await api.post(AC.activityCatalog, {
            category: form.type,
            name: catalogAdd.name.trim(),
            default_credits: catalogAdd.default_credits === null || (catalogAdd.default_credits as any) === '' ? null : Number(catalogAdd.default_credits),
        })
        toast.success('Agregada al catálogo.')
        showCatalogAdd.value = false
        await loadNameCatalog()
        form.name = catalogAdd.name.trim()
        onCatalogPick()
    })
}

function typeLabel(v: string): string {
    return types.value.find(t => t.value === v)?.label ?? v
}

async function loadCatalog() {
    const { data } = await api.get(AC.catalog)
    periods.value = data.periods ?? []
    types.value = data.types ?? []
}

function openCreate() {
    Object.assign(form, { type: '', name: '', group_id: null, instructor_user_id: null, place_id: null, capacity: null, credits: 0 })
    nameCatalog.value = []
    // Si el usuario solo puede crear una categoría (encargado), autoselecciónala.
    if (types.value.length === 1) { form.type = types.value[0].value; onTypeChange() }
    showCreate.value = true
}

async function create() {
    await act(async () => {
        await api.post(AC.activities, {
            period_id: Number(periodId.value),
            type: form.type,
            name: form.name,
            group_id: form.group_id,
            instructor_user_id: form.instructor_user_id,
            place_id: form.place_id,
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
