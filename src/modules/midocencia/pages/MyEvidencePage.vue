<template>
    <div class="space-y-4 max-w-5xl mx-auto pb-16">
        <div>
            <button class="text-sm text-slate-500 hover:text-slate-700" @click="goBack">&larr; Mi Docencia</button>
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Mis evidencias</h1>
            <p class="text-sm text-slate-500">Instrumentación por grupo y archivos de evidencia de tu descarga.</p>
        </div>

        <!-- Tarjetas resumen -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="bg-white border rounded-xl shadow-sm p-4 flex items-center gap-4">
                <div class="w-11 h-11 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl">📘</div>
                <div>
                    <div class="text-xs uppercase tracking-wide text-slate-500">Instrumentaciones</div>
                    <div class="text-lg font-semibold text-slate-800">{{ instWithFile }} <span class="text-slate-400 font-normal">/ {{ instTotal }} grupos</span></div>
                </div>
            </div>
            <div class="bg-white border rounded-xl shadow-sm p-4 flex items-center gap-4">
                <div class="w-11 h-11 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xl">📎</div>
                <div>
                    <div class="text-xs uppercase tracking-wide text-slate-500">Evidencias</div>
                    <div class="text-lg font-semibold text-slate-800">{{ evWithFiles }} <span class="text-slate-400 font-normal">/ {{ evTotal }} evidencias</span></div>
                </div>
            </div>
        </div>

        <div v-if="loading" class="text-center py-12 text-slate-400">Cargando…</div>

        <template v-else>
            <!-- Pestañas -->
            <div class="flex flex-wrap gap-1 border-b border-slate-200">
                <button
                    v-for="t in tabs" :key="t.key"
                    class="px-4 py-2 text-sm font-medium rounded-t-lg -mb-px border-b-2 transition-colors"
                    :class="activeTab === t.key
                        ? 'border-blue-600 text-blue-700 bg-white'
                        : 'border-transparent text-slate-500 hover:text-slate-700'"
                    @click="activeTab = t.key">
                    {{ t.label }}
                    <span v-if="t.badge" class="ml-1 text-[11px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">{{ t.badge }}</span>
                </button>
            </div>

            <!-- Pestaña: Instrumentaciones -->
            <div v-if="activeTab === 'inst'" class="space-y-3">
                <div v-if="instItems.length === 0" class="text-center py-8 text-slate-400">No tienes grupos asignados en este periodo.</div>

                <div v-for="g in instItems" :key="g.teacherAssignmentId"
                     class="bg-white border border-slate-200 rounded-xl shadow-sm border-l-4 overflow-hidden"
                     :class="isInstrumented(g) ? 'border-l-emerald-400' : 'border-l-amber-400'">
                    <div class="px-4 pt-3 pb-2 flex items-start justify-between gap-3">
                        <div class="min-w-0">
                            <div class="font-bold text-slate-800 leading-tight">{{ g.grupo || 'Sin grupo' }}</div>
                            <div class="text-xs text-slate-500 uppercase truncate">
                                {{ g.materia }}<span v-if="g.carrera"> · {{ g.carrera }}</span>
                            </div>
                        </div>
                        <span v-if="isInstrumented(g)" class="shrink-0 inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                            <span>✓</span> Instrumentado
                        </span>
                        <span v-else class="shrink-0 inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
                            <span>🕐</span> Pendiente
                        </span>
                    </div>
                    <div class="px-4 pb-4 space-y-3">
                        <!-- Enlace al módulo teaching (cuando exista para el grupo) -->
                        <div v-if="g.teaching" class="flex items-center gap-2 text-sm bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                            <span class="text-emerald-600">✓</span>
                            <span class="text-emerald-800">Instrumentación registrada en el módulo de instrumentación
                                <span class="text-emerald-600">({{ teachingStatusLabel(g.teaching.status) }})</span>.
                            </span>
                        </div>

                        <!-- Excel subido -->
                        <div v-if="g.file" class="flex items-center justify-between gap-2 text-sm bg-slate-50 border rounded-lg px-3 py-2">
                            <button class="text-blue-600 hover:underline truncate flex items-center gap-2" @click="downloadInst(g.file)">
                                <span>📄</span>
                                <span class="truncate">{{ g.file.originalName }}</span>
                                <span class="text-slate-400 text-xs">{{ g.file.uploadedAt }}</span>
                            </button>
                            <button class="text-red-500 hover:text-red-700 shrink-0" title="Eliminar" @click="removeInst(g)">✕</button>
                        </div>

                        <!-- Dropzone -->
                        <label class="dropzone" :class="{ 'dropzone--over': dragKey === 'inst:' + g.teacherAssignmentId, 'dropzone--busy': busy }"
                               @dragover.prevent="dragKey = 'inst:' + g.teacherAssignmentId"
                               @dragleave.prevent="dragKey = ''"
                               @drop.prevent="onDrop($event, f => uploadInst(f, g.teacherAssignmentId))">
                            <input type="file" class="hidden" accept=".xls,.xlsx"
                                   @change="onPick($event, f => uploadInst(f, g.teacherAssignmentId))" :disabled="busy" />
                            <CloudIcon />
                            <div class="dz-title">{{ g.file ? 'Reemplazar instrumentación' : 'Subir instrumentación' }}</div>
                            <div class="dz-sub">Excel .xls o .xlsx · 1 archivo por grupo</div>
                        </label>
                    </div>
                </div>
            </div>

            <!-- Pestañas por rubro (evidencias) -->
            <div v-else-if="activeRubroGroup" class="space-y-3">
                <div v-if="!uploadable" class="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800 text-sm">
                    Podrás subir evidencias cuando envíes tu distribución a revisión.
                </div>

                <template v-for="crit in activeRubroGroup.criteria" :key="crit.detailId">
                    <div class="text-xs font-semibold uppercase tracking-wide text-slate-400 px-1 pt-1">{{ crit.criterion }}</div>
                    <div v-for="ev in crit.evidences" :key="ev.evidenceId"
                         class="bg-white border border-slate-200 rounded-xl shadow-sm border-l-4 overflow-hidden"
                         :class="ev.files.length ? 'border-l-emerald-400' : 'border-l-amber-400'">
                        <div class="px-4 pt-3 pb-2 flex items-start justify-between gap-3">
                            <div class="font-bold text-slate-800 leading-tight">{{ ev.name }}</div>
                            <span v-if="ev.files.length" class="shrink-0 inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                                <span>✓</span> {{ ev.files.length }} archivo{{ ev.files.length === 1 ? '' : 's' }}
                            </span>
                            <span v-else class="shrink-0 inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
                                <span>🕐</span> Pendiente
                            </span>
                        </div>
                        <div class="px-4 pb-4 space-y-3">
                            <ul v-if="ev.files.length" class="space-y-1">
                                <li v-for="f in ev.files" :key="f.id" class="flex items-center justify-between gap-2 text-sm bg-slate-50 border rounded-lg px-3 py-1.5">
                                    <button class="text-blue-600 hover:underline truncate" @click="downloadEv(f)">{{ f.originalName }}</button>
                                    <button class="text-red-500 hover:text-red-700 shrink-0" @click="removeEv(f)">✕</button>
                                </li>
                            </ul>
                            <label v-if="uploadable" class="dropzone"
                                   :class="{ 'dropzone--over': dragKey === 'ev:' + ev.evidenceId, 'dropzone--busy': busy }"
                                   @dragover.prevent="dragKey = 'ev:' + ev.evidenceId"
                                   @dragleave.prevent="dragKey = ''"
                                   @drop.prevent="onDrop($event, f => uploadEv(f, crit.detailId, ev.evidenceId))">
                                <input type="file" class="hidden" accept=".pdf,.jpg,.jpeg,.png,.gif"
                                       @change="onPick($event, f => uploadEv(f, crit.detailId, ev.evidenceId))" :disabled="busy" />
                                <CloudIcon />
                                <div class="dz-title">Arrastra o haz clic para subir</div>
                                <div class="dz-sub">PDF o imagen (JPG, PNG, GIF) · puedes subir varios</div>
                            </label>
                        </div>
                    </div>
                </template>
            </div>

            <!-- Pestaña: Otros -->
            <div v-else-if="activeTab === 'otros'" class="space-y-3">
                <div class="bg-white border rounded-xl shadow-sm p-4 space-y-3">
                    <div class="flex flex-wrap items-end gap-3">
                        <label class="text-sm text-slate-600">
                            Categoría
                            <select v-model="otrosBucketId" class="mt-1 block border rounded-lg px-2 py-1.5 text-sm min-w-[12rem]">
                                <option :value="null">— Sin categoría —</option>
                                <option v-for="b in otrosBuckets" :key="b.id" :value="b.id">{{ b.name }}</option>
                            </select>
                        </label>
                        <label class="text-sm text-slate-600 flex-1 min-w-[12rem]">
                            Descripción (opcional)
                            <input v-model="otrosLabel" type="text" maxlength="255" placeholder="Nombre del archivo"
                                   class="mt-1 block w-full border rounded-lg px-2 py-1.5 text-sm" />
                        </label>
                    </div>
                    <label class="dropzone" :class="{ 'dropzone--over': dragKey === 'otros', 'dropzone--busy': busy }"
                           @dragover.prevent="dragKey = 'otros'"
                           @dragleave.prevent="dragKey = ''"
                           @drop.prevent="onDrop($event, uploadOtros)">
                        <input type="file" class="hidden" @change="onPick($event, uploadOtros)" :disabled="busy" />
                        <CloudIcon />
                        <div class="dz-title">Arrastra o haz clic para subir</div>
                        <div class="dz-sub">Cualquier archivo · puedes subir varios</div>
                    </label>
                </div>

                <div v-if="otrosFiles.length === 0" class="text-center py-8 text-slate-400">Aún no has subido archivos en "Otros".</div>
                <ul v-else class="bg-white border rounded-xl shadow-sm divide-y">
                    <li v-for="f in otrosFiles" :key="f.id" class="flex items-center justify-between gap-2 px-4 py-2.5 text-sm">
                        <div class="min-w-0">
                            <button class="text-blue-600 hover:underline truncate" @click="downloadOtros(f)">
                                {{ f.label || f.originalName }}
                            </button>
                            <span v-if="f.bucketId" class="ml-2 text-[11px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">{{ bucketName(f.bucketId) }}</span>
                        </div>
                        <button class="text-red-500 hover:text-red-700 shrink-0" @click="removeOtros(f)">✕</button>
                    </li>
                </ul>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'

interface EvFile { id: number; originalName: string; mime: string | null; size: number }
interface Evidence { evidenceId: number; name: string; files: EvFile[] }
interface Criterion { detailId: number; criterion: string; rubro: string | null; rubroOrder: number; evidences: Evidence[] }

interface InstFile { id: number; originalName: string; mime: string | null; size: number; uploadedAt: string | null }
interface InstItem {
    teacherAssignmentId: number
    grupo: string | null
    materia: string | null
    carrera: string | null
    file: InstFile | null
    teaching: { id: number; status: string } | null
}

interface OtrosFile { id: number; bucketId: number | null; label: string | null; originalName: string; mime: string | null; size: number }
interface OtrosBucket { id: number; name: string }

// Icono de nube (subida) inline — mismo trazo que SGIv2.
const CloudIcon = () => h('svg', {
    class: 'dz-icon', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
    'stroke-width': '1.6', 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
}, [
    h('path', { d: 'M12 16V9m0 0-3 3m3-3 3 3' }),
    h('path', { d: 'M20 16.5A4.5 4.5 0 0 0 17.5 8h-1.05A7 7 0 1 0 5 15' }),
])

const router = useRouter()
const toast = useToast()
const E = API.MIDOCENCIA_API

const loading = ref(true)
const busy = ref(false)
const activeTab = ref<string>('inst')
const dragKey = ref('')

// Instrumentaciones
const instItems = ref<InstItem[]>([])
const instTotal = ref(0)
const instWithFile = ref(0)

// Evidencias
const status = ref('')
const uploadable = ref(false)
const criteria = ref<Criterion[]>([])

// Otros
const otrosBuckets = ref<OtrosBucket[]>([])
const otrosFiles = ref<OtrosFile[]>([])
const otrosPeriodId = ref<number | null>(null)
const otrosBucketId = ref<number | null>(null)
const otrosLabel = ref('')

function goBack() { router.push({ name: 'midocencia.my-distribution' }) }

// Agrupa los criterios por rubro (una pestaña por rubro), ordenadas por sort_order.
const rubroGroups = computed(() => {
    const map = new Map<string, { key: string; label: string; order: number; criteria: Criterion[] }>()
    for (const c of criteria.value) {
        const label = c.rubro || 'Sin rubro'
        const key = 'rubro:' + label
        if (!map.has(key)) map.set(key, { key, label, order: c.rubroOrder ?? 0, criteria: [] })
        map.get(key)!.criteria.push(c)
    }
    return [...map.values()].sort((a, b) => a.order - b.order || a.label.localeCompare(b.label))
})

const activeRubroGroup = computed(() => rubroGroups.value.find(g => g.key === activeTab.value) ?? null)

const evTotal = computed(() => criteria.value.reduce((n, c) => n + c.evidences.length, 0))
const evWithFiles = computed(() => criteria.value.reduce((n, c) => n + c.evidences.filter(e => e.files.length > 0).length, 0))

const tabs = computed(() => {
    const out: { key: string; label: string; badge?: string }[] = [
        { key: 'inst', label: 'Instrumentaciones', badge: `${instWithFile.value}/${instTotal.value}` },
    ]
    for (const g of rubroGroups.value) out.push({ key: g.key, label: g.label })
    out.push({ key: 'otros', label: 'Otros', badge: otrosFiles.value.length ? String(otrosFiles.value.length) : undefined })
    return out
})

function isInstrumented(g: InstItem) { return g.file !== null || g.teaching !== null }
function teachingStatusLabel(s: string) {
    const map: Record<string, string> = { draft: 'borrador', submitted: 'enviada', approved: 'aprobada', rejected: 'rechazada' }
    return map[s] ?? s
}
function bucketName(id: number) { return otrosBuckets.value.find(b => b.id === id)?.name ?? '' }

onMounted(load)

async function load() {
    loading.value = true
    try {
        const [inst, ev, otros] = await Promise.all([
            api.get(E.instrumentation.index),
            api.get(E.distribution.evidences),
            api.get(E.otros.index),
        ])
        instItems.value = inst.data.items ?? []
        instTotal.value = inst.data.total ?? 0
        instWithFile.value = inst.data.withFile ?? 0

        status.value = ev.data.status
        uploadable.value = !!ev.data.uploadable
        criteria.value = ev.data.criteria ?? []

        otrosBuckets.value = otros.data.buckets ?? []
        otrosFiles.value = otros.data.files ?? []
        otrosPeriodId.value = otros.data.periodId ?? null
    } catch (e: any) {
        toast.error(e?.response?.data?.message ?? 'No se pudieron cargar tus evidencias.')
    } finally { loading.value = false }
}

// ── Selección/arrastre genéricos ─────────────────────────────────────
function onPick(event: Event, up: (f: File) => Promise<void>) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (file) up(file)
    input.value = ''
}
function onDrop(event: DragEvent, up: (f: File) => Promise<void>) {
    dragKey.value = ''
    const file = event.dataTransfer?.files?.[0]
    if (file) up(file)
}

// ── Instrumentaciones ────────────────────────────────────────────────
async function uploadInst(file: File, taId: number) {
    busy.value = true
    try {
        const form = new FormData(); form.append('file', file)
        await api.post(E.instrumentation.upload(taId), form)
        toast.success('Instrumentación subida.')
        await load()
    } catch (e: any) {
        toast.error(e?.response?.data?.message ?? 'No se pudo subir la instrumentación.')
    } finally { busy.value = false }
}

async function downloadInst(f: InstFile) {
    try {
        const res = await api.get(E.instrumentation.download(f.id), { responseType: 'blob' })
        saveBlob(res.data as Blob, f.originalName)
    } catch { toast.error('No se pudo descargar el archivo.') }
}

async function removeInst(g: InstItem) {
    if (!g.file) return
    busy.value = true
    try {
        await api.delete(E.instrumentation.delete(g.file.id))
        toast.success('Instrumentación eliminada.')
        await load()
    } catch (e: any) {
        toast.error(e?.response?.data?.message ?? 'No se pudo eliminar.')
    } finally { busy.value = false }
}

// ── Evidencias ───────────────────────────────────────────────────────
async function uploadEv(file: File, detailId: number, evidenceId: number) {
    busy.value = true
    try {
        const form = new FormData(); form.append('file', file)
        await api.post(E.evidence.upload(detailId, evidenceId), form)
        toast.success('Archivo subido.')
        await load()
    } catch (e: any) {
        toast.error(e?.response?.data?.message ?? 'No se pudo subir el archivo.')
    } finally { busy.value = false }
}

async function downloadEv(f: EvFile) {
    try {
        const res = await api.get(E.evidence.download(f.id), { responseType: 'blob' })
        saveBlob(res.data as Blob, f.originalName)
    } catch { toast.error('No se pudo descargar el archivo.') }
}

async function removeEv(f: EvFile) {
    busy.value = true
    try {
        await api.delete(E.evidence.delete(f.id))
        toast.success('Archivo eliminado.')
        await load()
    } catch (e: any) {
        toast.error(e?.response?.data?.message ?? 'No se pudo eliminar.')
    } finally { busy.value = false }
}

// ── Otros ────────────────────────────────────────────────────────────
async function uploadOtros(file: File) {
    busy.value = true
    try {
        const form = new FormData(); form.append('file', file)
        if (otrosPeriodId.value) form.append('period_id', String(otrosPeriodId.value))
        if (otrosBucketId.value) form.append('bucket_id', String(otrosBucketId.value))
        if (otrosLabel.value.trim()) form.append('label', otrosLabel.value.trim())
        await api.post(E.otros.upload, form)
        toast.success('Archivo subido.')
        otrosLabel.value = ''
        await load()
    } catch (e: any) {
        toast.error(e?.response?.data?.message ?? 'No se pudo subir el archivo.')
    } finally { busy.value = false }
}

async function downloadOtros(f: OtrosFile) {
    try {
        const res = await api.get(E.otros.download(f.id), { responseType: 'blob' })
        saveBlob(res.data as Blob, f.originalName)
    } catch { toast.error('No se pudo descargar el archivo.') }
}

async function removeOtros(f: OtrosFile) {
    busy.value = true
    try {
        await api.delete(E.otros.delete(f.id))
        toast.success('Archivo eliminado.')
        await load()
    } catch (e: any) {
        toast.error(e?.response?.data?.message ?? 'No se pudo eliminar.')
    } finally { busy.value = false }
}

function saveBlob(blob: Blob, name: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = name; a.click()
    URL.revokeObjectURL(url)
}
</script>

<style scoped>
.dropzone {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    padding: 1.5rem 1rem;
    text-align: center;
    cursor: pointer;
    border: 2px dashed #cbd5e1;      /* slate-300 */
    border-radius: 0.75rem;
    background: #f8fafc;             /* slate-50 */
    color: #94a3b8;                  /* slate-400 */
    transition: background-color .15s, border-color .15s;
}
.dropzone:hover { border-color: #93c5fd; background: #eff6ff; } /* blue-300 / blue-50 */
.dropzone--over { border-color: #3b82f6; background: #dbeafe; } /* blue-500 / blue-100 */
.dropzone--busy { opacity: .55; pointer-events: none; }
.dz-icon { width: 2.5rem; height: 2.5rem; color: #94a3b8; }
.dz-title { font-weight: 600; color: #1d4ed8; }  /* blue-700 */
.dz-sub { font-size: .75rem; color: #94a3b8; }
</style>
