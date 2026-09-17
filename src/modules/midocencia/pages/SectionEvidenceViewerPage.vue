<template>
    <div class="space-y-4 max-w-5xl mx-auto pb-16">
        <div>
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Evidencias por sección</h1>
            <p class="text-sm text-slate-500">
                Evidencias de tu(s) sección(es)<span v-if="sectionTitles.length">: <strong>{{ sectionTitles.join(', ') }}</strong></span>.
            </p>
        </div>

        <div class="bg-white border rounded-xl shadow-sm p-4 flex flex-wrap items-end gap-3">
            <div class="w-72">
                <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Periodo</label>
                <FormRemoteSelect
                    v-model="periodId"
                    :endpoint="API.SCHOOL_SERVICES_API.collegeAcademicPeriods.list"
                    :params="{ order_by: 'actual_start_date', order_dir: 'desc', per_page: 100 }"
                    item-label="name" item-value="id"
                    placeholder="Selecciona un periodo…"
                    @update:model-value="loadEvidences"
                />
            </div>
            <input v-model="search" placeholder="Buscar docente…" class="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px]" />
        </div>

        <!-- Pestañas: una por sección (rubro). Con una sola sección no se muestran. -->
        <div v-if="periodId && sections.length > 1" class="flex flex-wrap gap-2">
            <button
                v-for="(s, i) in sections" :key="s.rubroId"
                class="px-3.5 py-1.5 rounded-full text-sm font-semibold border transition"
                :class="i === activeTab ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-300'"
                @click="activeTab = i"
            >
                {{ s.title }}
                <span class="ml-1 text-xs opacity-70">({{ s.teachers.length }})</span>
            </button>
        </div>

        <div v-if="loading" class="text-center py-12 text-slate-400">Cargando…</div>
        <div v-else-if="!periodId" class="text-center py-8 text-slate-400">Selecciona un periodo.</div>
        <div v-else-if="!sections.length" class="text-center py-8 text-slate-400">No tienes secciones asignadas.</div>
        <div v-else-if="filtered.length === 0" class="text-center py-8 text-slate-400">Sin evidencias en esta sección para el periodo.</div>

        <div v-else class="space-y-3">
            <div v-for="t in filtered" :key="t.teacherId" class="bg-white border rounded-xl shadow-sm overflow-hidden">
                <button class="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-50" @click="toggle(t.teacherId)">
                    <span class="font-semibold text-slate-800">{{ t.teacherName }}</span>
                    <span class="text-xs text-slate-400">{{ fileCount(t) }} archivo(s) · {{ open.has(t.teacherId) ? '▲' : '▼' }}</span>
                </button>
                <div v-if="open.has(t.teacherId)" class="border-t divide-y">
                    <div v-for="(c,ci) in t.criteria" :key="ci" class="p-4">
                        <p class="text-sm font-medium text-slate-700 mb-2">{{ c.criterion }}</p>
                        <ul class="space-y-1">
                            <li v-for="f in c.files" :key="f.id" class="flex items-center justify-between text-xs bg-slate-50 rounded px-2 py-1">
                                <span class="truncate"><span class="text-slate-400">{{ f.evidence }}:</span> {{ f.originalName }}</span>
                                <button class="text-blue-600 hover:underline ml-2 shrink-0" @click="download(f)">Descargar</button>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'
import FormRemoteSelect from '@/app/components/ui/form/FormRemoteSelect.vue'

interface EvFile { id: number; evidence: string; originalName: string; mime: string | null }
interface Crit { criterion: string; files: EvFile[] }
interface Teacher { teacherId: number; teacherName: string; criteria: Crit[] }
interface Section { rubroId: number; title: string; teachers: Teacher[] }

const toast = useToast()
const S = API.MIDOCENCIA_API.sections

const periodId = ref<number | null>(null)
const sections = ref<Section[]>([])
const activeTab = ref(0)
const loading = ref(false)
const search = ref('')
const open = ref<Set<number>>(new Set())

const sectionTitles = computed(() => sections.value.map(s => s.title))
const activeTeachers = computed<Teacher[]>(() => sections.value[activeTab.value]?.teachers ?? [])

const filtered = computed(() => {
    const q = search.value.trim().toLowerCase()
    if (!q) return activeTeachers.value
    return activeTeachers.value.filter(t => t.teacherName.toLowerCase().includes(q))
})

function fileCount(t: Teacher) { return t.criteria.reduce((a, c) => a + c.files.length, 0) }
function toggle(id: number) { open.value.has(id) ? open.value.delete(id) : open.value.add(id); open.value = new Set(open.value) }

onMounted(() => { /* las secciones se cargan al elegir periodo */ })

async function loadEvidences() {
    if (!periodId.value) { sections.value = []; return }
    loading.value = true
    try {
        const { data } = await api.get(S.evidences, { params: { period_id: periodId.value } })
        sections.value = data.sections ?? []
        if (activeTab.value >= sections.value.length) activeTab.value = 0
        open.value = new Set()
    } catch (e: any) {
        toast.error(e?.response?.data?.message ?? 'No se pudieron cargar las evidencias.')
        sections.value = []
    } finally { loading.value = false }
}

async function download(f: EvFile) {
    try {
        const res = await api.get(S.download(f.id), { responseType: 'blob' })
        const url = URL.createObjectURL(res.data as Blob)
        const a = document.createElement('a')
        a.href = url; a.download = f.originalName; a.click()
        URL.revokeObjectURL(url)
    } catch { toast.error('No se pudo descargar.') }
}
</script>
