<template>
    <div class="space-y-4 max-w-5xl mx-auto pb-16">
        <div>
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Instrumentaciones</h1>
            <p class="text-sm text-slate-500">
                Instrumentaciones didácticas del plantel<span v-if="onlyBasics"> — <strong>solo Ciencias Básicas</strong></span>.
                Descarga el formato oficial (XLSX) de cada una.
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
                    @update:model-value="load"
                />
            </div>
            <div class="w-48">
                <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Estado</label>
                <select v-model="status" class="w-full border rounded-lg px-3 py-2 text-sm" @change="load">
                    <option value="">Todos</option>
                    <option value="draft">Borrador</option>
                    <option value="submitted">Enviada</option>
                    <option value="approved">Aprobada</option>
                    <option value="rejected">Rechazada</option>
                </select>
            </div>
            <input v-model="search" placeholder="Buscar docente o materia…" class="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px]" />
        </div>

        <div v-if="loading" class="text-center py-12 text-slate-400">Cargando…</div>
        <div v-else-if="!periodId" class="text-center py-8 text-slate-400">Selecciona un periodo.</div>
        <div v-else-if="filtered.length === 0" class="text-center py-8 text-slate-400">Sin instrumentaciones para este periodo.</div>

        <div v-else class="space-y-3">
            <div v-for="t in filtered" :key="t.teacherId" class="bg-white border rounded-xl shadow-sm overflow-hidden">
                <button class="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-50" @click="toggle(t.teacherId)">
                    <span class="font-semibold text-slate-800">{{ t.teacherName }}</span>
                    <span class="text-xs text-slate-400">{{ t.instrumentations.length }} instrumentación(es) · {{ open.has(t.teacherId) ? '▲' : '▼' }}</span>
                </button>
                <div v-if="open.has(t.teacherId)" class="border-t divide-y">
                    <div v-for="i in t.instrumentations" :key="i.id" class="p-4 flex items-center justify-between gap-3">
                        <div class="min-w-0">
                            <p class="text-sm font-medium text-slate-700 truncate">
                                {{ i.subject }}
                                <span class="text-slate-400 font-normal">({{ i.subjectCode }})</span>
                                <span v-if="i.isBasic" class="ml-1 text-[10px] uppercase bg-emerald-100 text-emerald-700 rounded px-1.5 py-0.5">Básicas</span>
                            </p>
                            <p class="text-xs text-slate-400">
                                Grupo {{ i.group || '—' }} ·
                                <span :class="statusClass(i.status)">{{ statusLabel(i.status) }}</span>
                                <span v-if="i.elaboratedAt"> · elaborada {{ String(i.elaboratedAt).slice(0, 10) }}</span>
                            </p>
                        </div>
                        <button
                            class="shrink-0 text-xs bg-blue-600 text-white rounded-lg px-3 py-1.5 hover:bg-blue-700 disabled:opacity-50"
                            :disabled="downloading === i.id"
                            @click="downloadXlsx(i.id)"
                        >
                            {{ downloading === i.id ? 'Generando…' : 'Descargar XLSX' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'
import FormRemoteSelect from '@/app/components/ui/form/FormRemoteSelect.vue'

interface Instr {
    id: number
    subject: string
    subjectCode: string
    group: string | null
    status: string
    isBasic: boolean
    elaboratedAt: string | null
    submittedAt: string | null
    approvedAt: string | null
}
interface Teacher { teacherId: number; teacherName: string; instrumentations: Instr[] }

const toast = useToast()
const S = API.MIDOCENCIA_API.sections

const periodId = ref<number | null>(null)
const status = ref('')
const search = ref('')
const onlyBasics = ref(false)
const teachers = ref<Teacher[]>([])
const loading = ref(false)
const downloading = ref<number | null>(null)
const open = ref<Set<number>>(new Set())

const filtered = computed(() => {
    const q = search.value.trim().toLowerCase()
    if (!q) return teachers.value
    return teachers.value
        .map(t => ({
            ...t,
            instrumentations: t.instrumentations.filter(i =>
                t.teacherName.toLowerCase().includes(q)
                || i.subject.toLowerCase().includes(q)
                || (i.subjectCode ?? '').toLowerCase().includes(q),
            ),
        }))
        .filter(t => t.teacherName.toLowerCase().includes(q) || t.instrumentations.length > 0)
})

function toggle(id: number) { open.value.has(id) ? open.value.delete(id) : open.value.add(id); open.value = new Set(open.value) }

function statusLabel(s: string): string {
    return { draft: 'Borrador', submitted: 'Enviada', approved: 'Aprobada', rejected: 'Rechazada' }[s] ?? s
}
function statusClass(s: string): string {
    return {
        draft: 'text-slate-500', submitted: 'text-amber-600',
        approved: 'text-emerald-600', rejected: 'text-red-600',
    }[s] ?? 'text-slate-500'
}

async function load() {
    if (!periodId.value) { teachers.value = []; return }
    loading.value = true
    try {
        const { data } = await api.get(S.instrumentations, {
            params: { period_id: periodId.value, status: status.value || undefined },
        })
        teachers.value = data.teachers ?? []
        onlyBasics.value = !!data.onlyBasics
    } catch (e: any) {
        toast.error(e?.response?.data?.message ?? 'No se pudieron cargar las instrumentaciones.')
        teachers.value = []
    } finally { loading.value = false }
}

async function downloadXlsx(id: number) {
    downloading.value = id
    try {
        const { data } = await api.get(S.instrumentation(id))
        const { buildInstrumentacionExportData } = await import('@/modules/teaching/export/buildExportData')
        const { downloadInstrumentacionXlsx } = await import('@/modules/teaching/export/downloadInstrumentacion')
        await downloadInstrumentacionXlsx(buildInstrumentacionExportData(data.instrumentation, data.context ?? {}))
    } catch (e: any) {
        toast.error(e?.response?.data?.message ?? 'No se pudo generar el documento.')
    } finally { downloading.value = null }
}
</script>
