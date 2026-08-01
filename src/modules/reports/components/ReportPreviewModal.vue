<template>
    <Teleport to="body">
        <div v-if="reportId != null" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60" @click.self="close">
            <div class="bg-white rounded-xl shadow-2xl w-[92vw] h-[92vh] flex flex-col overflow-hidden">
                <div class="px-5 py-3 bg-slate-800 text-white flex items-center justify-between shrink-0">
                    <h3 class="text-sm font-black uppercase truncate">Vista previa · {{ reportName }}</h3>
                    <div class="flex items-center gap-2">
                        <button v-if="rendered" type="button" class="px-3 py-1.5 text-xs font-bold rounded bg-emerald-500 hover:bg-emerald-600 uppercase" @click="downloadDocx">⬇ Descargar</button>
                        <button v-if="rendered" type="button" class="px-3 py-1.5 text-xs font-bold rounded bg-slate-600 hover:bg-slate-500 uppercase" @click="reset">← Parámetros</button>
                        <button type="button" class="px-3 py-1.5 text-xs font-bold rounded bg-slate-600 hover:bg-slate-500 uppercase" @click="close">Cerrar</button>
                    </div>
                </div>

                <div class="flex-1 min-h-0 bg-slate-200 relative overflow-auto">
                    <div v-if="loadingReport" class="absolute inset-0 flex items-center justify-center text-slate-500 text-sm">Cargando…</div>

                    <!-- Formulario de parámetros -->
                    <div v-else-if="!rendered" class="max-w-xl mx-auto p-6 space-y-4">
                        <p class="text-sm text-slate-500">Captura los parámetros para generar el reporte.</p>

                        <div v-if="requestParams.length" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div v-for="p in requestParams" :key="p.name">
                                <label class="block text-xs font-semibold text-slate-500 mb-1 uppercase">
                                    {{ p.name }}<span v-if="p.required" class="text-red-500"> *</span>
                                </label>
                                <input
                                    v-model="values[p.name]"
                                    :type="inputType(p.dataType)"
                                    class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                                    :placeholder="p.name"
                                />
                            </div>
                        </div>
                        <p v-else class="text-sm text-slate-400 italic">Este reporte no requiere parámetros.</p>

                        <div v-if="error" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{{ error }}</div>

                        <button
                            type="button"
                            :disabled="generating || !canGenerate"
                            class="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition inline-flex items-center gap-2"
                            @click="generate"
                        >
                            <svg v-if="generating" class="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                            {{ generating ? 'Generando…' : 'Generar' }}
                        </button>
                    </div>

                    <!-- Documento renderizado (docx-preview) -->
                    <div v-show="rendered" ref="previewHost" class="docx-preview-host p-6"></div>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useReportGenerator } from '@/modules/reports/composables/useReportGenerator'

interface ReqParam { name: string; dataType: string; required: boolean }

const props = defineProps<{ reportId: number | string | null }>()
const emit = defineEmits<{ close: [] }>()

const { preview, download } = useReportGenerator()

const reportName = ref('')
const loadingReport = ref(false)
const requestParams = ref<ReqParam[]>([])
const values = reactive<Record<string, string>>({})
const generating = ref(false)
const error = ref<string | null>(null)
const rendered = ref(false)
const previewHost = ref<HTMLElement | null>(null)

const canGenerate = computed(() => requestParams.value.every(p => !p.required || String(values[p.name] ?? '').trim() !== ''))

function inputType(dt: string): string {
    if (dt === 'int' || dt === 'integer' || dt === 'number' || dt === 'float') return 'number'
    if (dt === 'date') return 'date'
    return 'text'
}

function buildParams(): Record<string, unknown> {
    const params: Record<string, unknown> = {}
    for (const p of requestParams.value) {
        const v = values[p.name]
        if (v !== undefined && v !== '') params[p.name] = inputType(p.dataType) === 'number' ? Number(v) : v
    }
    return params
}

async function loadReport(id: number | string) {
    loadingReport.value = true
    error.value = null
    requestParams.value = []
    Object.keys(values).forEach(k => delete values[k])
    try {
        const [rep, daos] = await Promise.all([
            api.get(API.REPORTS_API.reports.byId(id)),
            api.get(API.REPORTS_API.daos.list + '?per_page=200'),
        ])
        reportName.value = rep.data?.name ?? rep.data?.code ?? String(id)
        const daoList: any[] = daos.data?.items ?? daos.data?.data ?? daos.data ?? []
        const linkedIds = new Set((rep.data?.daos ?? []).map((d: any) => d.id))
        const byName = new Map<string, ReqParam>()
        for (const dao of daoList) {
            if (!linkedIds.has(dao.id)) continue
            for (const p of (dao.parameters ?? [])) {
                const st = p.sourceType ?? p.source_type
                const name = p.name
                if (st !== 'request' || !name || byName.has(name)) continue
                byName.set(name, {
                    name,
                    dataType: p.dataType ?? p.data_type ?? 'string',
                    required: !!(p.isRequired ?? p.is_required),
                })
            }
        }
        requestParams.value = Array.from(byName.values())
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'No se pudo cargar el reporte.'
    } finally {
        loadingReport.value = false
    }
}

async function generate() {
    if (props.reportId == null || !previewHost.value) return
    generating.value = true
    error.value = null
    try {
        await preview({ reportId: props.reportId, params: buildParams() }, previewHost.value)
        rendered.value = true
    } catch (e: any) {
        error.value = e?.notAvailable
            ? 'El reporte no tiene plantilla o no está configurado.'
            : (e?.response?.data?.message ?? e?.message ?? 'No se pudo generar el reporte.')
    } finally {
        generating.value = false
    }
}

async function downloadDocx() {
    if (props.reportId == null) return
    try {
        await download({ reportId: props.reportId, params: buildParams() })
    } catch { /* ignore */ }
}

function reset() {
    rendered.value = false
    if (previewHost.value) previewHost.value.innerHTML = ''
}

function close() {
    reset()
    emit('close')
}

watch(() => props.reportId, (id) => {
    reset()
    if (id != null) loadReport(id)
}, { immediate: true })
</script>
