<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Configuración de Tutorías</h1>
            <p class="text-xs text-slate-400">Ventana de propuestas y materia de tutoría grupal (Cap. 15).</p>
        </div>

        <!-- Ventana de propuesta (por periodo) -->
        <section class="rounded-xl border bg-white p-4 space-y-3">
            <h2 class="text-sm font-bold uppercase text-slate-500">Ventana de propuesta individual</h2>
            <div class="grid sm:grid-cols-4 gap-3 items-end">
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Periodo</label>
                    <select v-model="win.period_id" @change="loadWindow" class="w-full rounded-lg border-slate-300 text-sm">
                        <option value="">Elegir…</option>
                        <option v-for="p in periods" :key="p.id" :value="p.id">{{ p.name }}</option>
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Abre</label>
                    <input v-model="win.opens_at" type="date" class="w-full rounded-lg border-slate-300 text-sm" />
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Cierra</label>
                    <input v-model="win.closes_at" type="date" class="w-full rounded-lg border-slate-300 text-sm" />
                </div>
                <label class="flex items-center gap-2 text-sm text-slate-600 pb-2">
                    <input type="checkbox" v-model="win.is_open" /> Abierta ahora (override)
                </label>
            </div>
            <button @click="saveWindow" :disabled="busy || !win.period_id" class="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50">Guardar ventana</button>
        </section>

        <!-- Límites / umbrales -->
        <section class="rounded-xl border bg-white p-4 space-y-3">
            <h2 class="text-sm font-bold uppercase text-slate-500">Límites y umbrales</h2>
            <div class="grid sm:grid-cols-4 gap-3 items-end">
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Semestres con tutoría grupal (X)</label>
                    <input v-model="limits.group_tutoring_max_semester" type="number" min="1" max="20" class="w-full rounded-lg border-slate-300 text-sm" />
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Cupo de tutorados por tutor (individual)</label>
                    <input v-model="limits.max_tutees_per_tutor" type="number" min="0" class="w-full rounded-lg border-slate-300 text-sm" placeholder="0 = sin límite" />
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Mín. recurses para sugerir riesgo</label>
                    <input v-model="limits.risk_min_repeat" type="number" min="1" class="w-full rounded-lg border-slate-300 text-sm" />
                </div>
                <button @click="saveLimits" :disabled="busy" class="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50">Guardar límites</button>
            </div>
        </section>

        <!-- Materia de tutoría grupal (por plantel, con historial) -->
        <section class="rounded-xl border bg-white p-4 space-y-3">
            <h2 class="text-sm font-bold uppercase text-slate-500">Materia de tutoría grupal</h2>
            <p class="text-xs text-slate-400">La materia vigente se anexa preseleccionada al paquete de los semestres iniciales (≤ X).</p>
            <div v-if="group.current" class="rounded-lg bg-slate-50 border p-3 text-sm">
                Vigente: <b>{{ group.current.subject_name }}</b>
                <span v-if="group.current.official_code" class="text-slate-400">({{ group.current.official_code }})</span>
                · obligatoria hasta semestre <b>{{ group.current.max_semester }}</b>
            </div>
            <div class="grid sm:grid-cols-4 gap-3 items-end">
                <div class="sm:col-span-4 relative">
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Materia de tutoría grupal</label>
                    <div v-if="group.form.subject_id" class="flex items-center gap-2 mb-1 text-sm">
                        <span class="px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold">{{ group.form.subject_label }}</span>
                        <button @click="clearSubject" class="text-xs text-slate-400 hover:text-rose-500">cambiar</button>
                    </div>
                    <input v-else v-model="subjectSearch" @input="searchSubjects" class="w-full rounded-lg border-slate-300 text-sm" placeholder="Buscar materia por nombre o clave…" />
                    <ul v-if="!group.form.subject_id && subjectResults.length" class="absolute z-10 bg-white border rounded-lg mt-1 w-full max-h-56 overflow-y-auto shadow">
                        <li v-for="s in subjectResults" :key="s.id" @click="pickSubject(s)" class="px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer">
                            <span class="font-semibold text-slate-700">{{ s.name }}</span>
                            <span v-if="s.official_code" class="text-slate-400"> · {{ s.official_code }}</span>
                        </li>
                    </ul>
                    <p v-if="!group.form.subject_id && subjectSearch.length >= 2 && !subjectResults.length" class="text-[11px] text-slate-400 mt-1">Sin coincidencias.</p>
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Vigente desde</label>
                    <input v-model="group.form.effective_from" type="date" class="w-full rounded-lg border-slate-300 text-sm" />
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Nota</label>
                    <input v-model="group.form.note" class="w-full rounded-lg border-slate-300 text-sm" placeholder="opcional" />
                </div>
            </div>
            <button @click="saveGroup" :disabled="busy || !group.form.subject_id || !group.form.effective_from"
                class="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50">Fijar materia vigente</button>

            <div v-if="group.history.length" class="pt-2">
                <h3 class="text-xs font-bold uppercase text-slate-400 mb-1">Historial</h3>
                <table class="w-full text-sm">
                    <thead><tr class="text-left text-[10px] uppercase text-slate-400 bg-slate-50 border-y">
                        <th class="px-3 py-1">Materia</th><th>X</th><th>Desde</th><th>Vigente</th><th>Nota</th>
                    </tr></thead>
                    <tbody>
                        <tr v-for="h in group.history" :key="h.id" class="border-b last:border-0">
                            <td class="px-3 py-1 text-slate-600">{{ h.subject_name }}</td>
                            <td class="text-slate-600">{{ h.max_semester }}</td>
                            <td class="text-slate-600">{{ h.effective_from }}</td>
                            <td>{{ h.is_active ? '✓' : '' }}</td>
                            <td class="text-slate-400">{{ h.note ?? '—' }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>

        <!-- Generar / regenerar tutorías grupales del periodo -->
        <section class="rounded-xl border bg-white p-4 space-y-3">
            <h2 class="text-sm font-bold uppercase text-slate-500">Generar tutorías grupales</h2>
            <p class="text-xs text-slate-400">Crea/sincroniza las tutorías grupales desde la asignación de docentes a la materia de tutoría. Se ejecuta solo al <b>liberar</b> la carga; este botón lo fuerza/regenera.</p>
            <div class="grid sm:grid-cols-3 gap-3 items-end">
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Periodo</label>
                    <select v-model="gen.period_id" class="w-full rounded-lg border-slate-300 text-sm">
                        <option value="">Elegir…</option>
                        <option v-for="p in periods" :key="p.id" :value="p.id">{{ p.name }}</option>
                    </select>
                </div>
                <button @click="runGenerate" :disabled="busy || !gen.period_id" class="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold disabled:opacity-50">Generar / regenerar</button>
            </div>
            <p v-if="gen.result" class="text-xs text-slate-600">{{ gen.result }}</p>
        </section>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'

const T = API.TUTORING_API
const toast = useToast()

const periods = ref<any[]>([])
const busy = ref(false)

const win = reactive({ period_id: '', opens_at: '', closes_at: '', is_open: false })
const limits = reactive({ max_tutees_per_tutor: 0, risk_min_repeat: 1, group_tutoring_max_semester: 1 })
const gen = reactive<{ period_id: string; result: string }>({ period_id: '', result: '' })

async function runGenerate() {
    await act(async () => {
        const { data } = await api.post(T.determination.generateGroup, { period_id: Number(gen.period_id) })
        gen.result = `Listo: ${data.created ?? 0} creadas, ${data.updated ?? 0} actualizadas, ${data.skipped ?? 0} sin cambios.`
        toast.success('Tutorías grupales generadas.')
    })
}
const group = reactive<{ current: any; history: any[]; form: { subject_id: number | null; subject_label: string; effective_from: string; note: string } }>({
    current: null, history: [], form: { subject_id: null, subject_label: '', effective_from: '', note: '' },
})

const subjectSearch = ref('')
const subjectResults = ref<any[]>([])
let subjectTimer: any = null

async function fetchOptions() {
    const { data } = await api.get(T.determination.catalog)
    periods.value = data.periods ?? []
}
function searchSubjects() {
    clearTimeout(subjectTimer)
    subjectTimer = setTimeout(async () => {
        if (subjectSearch.value.trim().length < 2) { subjectResults.value = []; return }
        const { data } = await api.get(T.determination.catalog, { params: { subject_search: subjectSearch.value } })
        subjectResults.value = data.subjects ?? []
    }, 300)
}
function pickSubject(s: any) {
    group.form.subject_id = s.id
    group.form.subject_label = s.official_code ? `${s.name} · ${s.official_code}` : s.name
    subjectResults.value = []; subjectSearch.value = ''
}
function clearSubject() {
    group.form.subject_id = null; group.form.subject_label = ''
}
async function loadWindow() {
    if (!win.period_id) return
    const { data } = await api.get(T.determination.window, { params: { period_id: win.period_id } })
    const w = data.window
    win.opens_at = w?.opens_at ? w.opens_at.substring(0, 10) : ''
    win.closes_at = w?.closes_at ? w.closes_at.substring(0, 10) : ''
    win.is_open = !!w?.is_open
}
async function saveWindow() {
    await act(async () => {
        await api.post(T.determination.window, {
            period_id: Number(win.period_id),
            opens_at: win.opens_at || null,
            closes_at: win.closes_at || null,
            is_open: win.is_open,
        })
        toast.success('Ventana guardada.')
    })
}

async function loadLimits() {
    const { data } = await api.get(T.determination.limits)
    limits.max_tutees_per_tutor = data.max_tutees_per_tutor ?? 0
    limits.risk_min_repeat = data.risk_min_repeat ?? 1
    limits.group_tutoring_max_semester = data.group_tutoring_max_semester ?? 1
}
async function saveLimits() {
    await act(async () => {
        await api.post(T.determination.limits, {
            max_tutees_per_tutor: Number(limits.max_tutees_per_tutor),
            risk_min_repeat: Number(limits.risk_min_repeat),
            group_tutoring_max_semester: Number(limits.group_tutoring_max_semester),
        })
        toast.success('Límites guardados.')
        await loadLimits()
    })
}

async function loadGroup() {
    const { data } = await api.get(T.determination.groupSubject)
    group.current = data.current ?? null
    group.history = data.history ?? []
    // Prellena el selector con la materia vigente (que se vea la seleccionada).
    if (group.current) {
        group.form.subject_id = group.current.subject_id
        group.form.subject_label = group.current.official_code
            ? `${group.current.subject_name} · ${group.current.official_code}`
            : group.current.subject_name
    }
}
async function saveGroup() {
    await act(async () => {
        await api.post(T.determination.groupSubject, {
            subject_id: Number(group.form.subject_id),
            effective_from: group.form.effective_from,
            note: group.form.note || null,
        })
        toast.success('Materia de tutoría grupal fijada.')
        group.form.note = ''
        await loadGroup()
    })
}

async function act(fn: () => Promise<void>) {
    busy.value = true
    try { await fn() }
    catch (e: any) { toast.error(e?.response?.data?.message ?? 'Operación no permitida.') }
    finally { busy.value = false }
}

onMounted(async () => { await Promise.all([fetchOptions(), loadGroup(), loadLimits()]) })
</script>
