<template>
    <div class="flex flex-col h-[calc(100vh-7rem)] min-h-[560px]">
        <!-- barra superior -->
        <div class="flex items-center justify-between gap-3 px-4 py-2.5 bg-slate-800 text-white rounded-t-xl shrink-0">
            <div class="min-w-0">
                <h1 class="text-sm font-black uppercase truncate">Afinar plantilla · {{ reportName }}</h1>
                <p class="text-[11px] text-slate-300">Ajusta y mira el resultado con datos de ejemplo, en vivo.</p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
                <button type="button" class="px-3 py-1.5 text-xs font-bold rounded bg-slate-600 hover:bg-slate-500 uppercase" @click="reset">Restablecer</button>
                <button type="button" :disabled="saving" class="px-3 py-1.5 text-xs font-bold rounded bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 uppercase" @click="save">
                    {{ saving ? 'Guardando…' : 'Guardar plantilla' }}
                </button>
                <button type="button" class="px-3 py-1.5 text-xs font-bold rounded bg-slate-600 hover:bg-slate-500 uppercase" @click="goBack">Cerrar</button>
            </div>
        </div>

        <div v-if="!builder" class="flex-1 flex items-center justify-center bg-slate-100 rounded-b-xl text-slate-500 text-sm">
            Este reporte no tiene afinador visual disponible.
        </div>

        <div v-else class="flex-1 min-h-0 flex bg-slate-200 rounded-b-xl overflow-hidden">
            <!-- panel de controles -->
            <aside class="w-80 shrink-0 bg-white border-r border-slate-200 overflow-y-auto p-4 space-y-5">
                <div v-for="group in groups" :key="group.name" class="space-y-3">
                    <h2 class="text-[11px] font-black uppercase tracking-wide text-slate-400 border-b border-slate-100 pb-1">{{ group.name }}</h2>

                    <div v-for="ctl in group.controls" :key="ctl.key" class="space-y-1">
                        <!-- number -->
                        <template v-if="ctl.type === 'number'">
                            <label class="flex items-center justify-between text-xs font-semibold text-slate-600">
                                <span>{{ ctl.label }}</span>
                                <span class="text-slate-400 font-mono">{{ config[ctl.key] }}{{ ctl.unit ? ' ' + ctl.unit : '' }}</span>
                            </label>
                            <div class="flex items-center gap-2">
                                <input type="range" class="flex-1 accent-blue-600" :min="ctl.min" :max="ctl.max" :step="ctl.step ?? 1"
                                    :value="config[ctl.key]" @input="setNum(ctl.key, ($event.target as HTMLInputElement).value)" />
                                <input type="number" class="w-16 rounded border border-slate-200 px-1.5 py-1 text-xs" :min="ctl.min" :max="ctl.max" :step="ctl.step ?? 1"
                                    :value="config[ctl.key]" @input="setNum(ctl.key, ($event.target as HTMLInputElement).value)" />
                            </div>
                        </template>

                        <!-- text -->
                        <template v-else-if="ctl.type === 'text'">
                            <label class="block text-xs font-semibold text-slate-600">{{ ctl.label }}</label>
                            <input type="text" class="w-full rounded border border-slate-200 px-2 py-1.5 text-xs"
                                :value="config[ctl.key]" @input="setText(ctl.key, ($event.target as HTMLInputElement).value)" />
                        </template>

                        <!-- widthArray -->
                        <template v-else-if="ctl.type === 'widthArray'">
                            <label class="flex items-center justify-between text-xs font-semibold text-slate-600">
                                <span>{{ ctl.label }}</span>
                                <span class="font-mono text-[10px]" :class="widthSum(ctl.key) > 9100 ? 'text-red-500' : 'text-slate-400'">Σ {{ widthSum(ctl.key) }}</span>
                            </label>
                            <div class="grid grid-cols-2 gap-1.5">
                                <div v-for="(col, i) in ctl.columns" :key="i" class="flex items-center gap-1">
                                    <span class="w-14 text-[10px] text-slate-400 truncate" :title="col">{{ col }}</span>
                                    <input type="number" class="w-full rounded border border-slate-200 px-1 py-0.5 text-[11px]" min="120" step="20"
                                        :value="(config[ctl.key] as number[])[i]" @input="setWidth(ctl.key, i, ($event.target as HTMLInputElement).value)" />
                                </div>
                            </div>
                            <p v-if="widthSum(ctl.key) > 9100" class="text-[10px] text-red-500">Excede el ancho útil (~9026 twips); la tabla se saldrá del margen.</p>
                        </template>
                    </div>
                </div>
            </aside>

            <!-- vista previa -->
            <div class="flex-1 min-h-0 relative overflow-auto">
                <div v-if="error" class="absolute inset-x-0 top-0 z-10 bg-red-50 border-b border-red-200 text-red-700 text-xs px-4 py-2">{{ error }}</div>
                <div v-if="saved" class="absolute inset-x-0 top-0 z-10 bg-emerald-50 border-b border-emerald-200 text-emerald-700 text-xs px-4 py-2">Plantilla guardada. El reporte ya usa este diseño.</div>
                <div v-if="!firstRenderDone" class="absolute inset-0 flex items-center justify-center text-slate-500 text-sm">Generando vista previa con datos de ejemplo…</div>
                <div ref="previewHost" class="docx-preview-host p-6"></div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { fillDocxTemplate, DOCX_MIME } from '@/modules/reports/services/docxGenerator'
import { getTemplateBuilder } from '@/modules/reports/templateBuilders'
import type { TemplateBuilder } from '@/modules/reports/templateBuilders'

const route  = useRoute()
const router = useRouter()
const reportId = route.params.id as string

const reportName = ref<string>(String(reportId))
const builder = ref<TemplateBuilder | undefined>(undefined)
const config = reactive<Record<string, unknown>>({})
const previewHost = ref<HTMLElement | null>(null)
const error = ref<string | null>(null)
const saving = ref(false)
const saved = ref(false)
const firstRenderDone = ref(false)

const storageKey = computed(() => `reportTuner:${builder.value?.code ?? reportId}`)

const groups = computed(() => {
    const b = builder.value
    if (!b) return []
    const order: string[] = []
    const map = new Map<string, TemplateBuilder['controls']>()
    for (const c of b.controls) {
        const g = c.group ?? 'General'
        if (!map.has(g)) { map.set(g, []); order.push(g) }
        map.get(g)!.push(c)
    }
    return order.map((name) => ({ name, controls: map.get(name)! }))
})

function widthSum(key: string): number {
    const arr = config[key] as number[] | undefined
    return Array.isArray(arr) ? arr.reduce((a, b) => a + (Number(b) || 0), 0) : 0
}

/* ── mutadores + re-render debounced ── */
let timer: ReturnType<typeof setTimeout> | null = null
function scheduleRender() {
    saved.value = false
    if (timer) clearTimeout(timer)
    timer = setTimeout(render, 200)
    persist()
}
function setNum(key: string, val: string) { config[key] = Number(val); scheduleRender() }
function setText(key: string, val: string) { config[key] = val; scheduleRender() }
function setWidth(key: string, i: number, val: string) {
    const arr = (config[key] as number[]).slice()
    arr[i] = Math.max(120, Number(val) || 0)
    config[key] = arr
    scheduleRender()
}

function persist() {
    try { localStorage.setItem(storageKey.value, JSON.stringify(config)) } catch { /* ignore */ }
}

async function render() {
    if (!builder.value) return
    // el host vive en un v-else; puede no estar montado aún en el primer render
    if (!previewHost.value) { await nextTick() }
    if (!previewHost.value) return
    error.value = null
    try {
        const bytes = builder.value.build(JSON.parse(JSON.stringify(config)))
        const tpl   = new Blob([bytes], { type: DOCX_MIME })
        const filled = await fillDocxTemplate(tpl, builder.value.sampleData)
        const { renderAsync } = await import('docx-preview')
        previewHost.value.innerHTML = ''
        await renderAsync(filled, previewHost.value, undefined, {
            className: 'docx-preview', inWrapper: true, breakPages: true, experimental: true, useBase64URL: true,
        })
        firstRenderDone.value = true
    } catch (e: unknown) {
        error.value = (e as Error)?.message ?? 'No se pudo generar la vista previa.'
    }
}

async function save() {
    if (!builder.value) return
    saving.value = true
    error.value = null
    try {
        const bytes = builder.value.build(JSON.parse(JSON.stringify(config)))
        const file  = new File([bytes], `${builder.value.code}.docx`, { type: DOCX_MIME })
        const form  = new FormData()
        form.append('template', file)
        await api.post(API.REPORTS_API.reports.template(reportId), form, { headers: { 'Content-Type': 'multipart/form-data' } })
        saved.value = true
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? e?.response?.data?.errors?.template?.[0] ?? 'No se pudo guardar la plantilla.'
    } finally {
        saving.value = false
    }
}

function applyConfig(source: Record<string, unknown>) {
    Object.keys(config).forEach((k) => delete config[k])
    Object.assign(config, JSON.parse(JSON.stringify(source)))
}

function reset() {
    if (!builder.value) return
    applyConfig(builder.value.defaultConfig)
    try { localStorage.removeItem(storageKey.value) } catch { /* ignore */ }
    scheduleRender()
}

function goBack() {
    router.push({ name: 'reports.reports' })
}

onMounted(async () => {
    try {
        const { data } = await api.get(API.REPORTS_API.reports.byId(reportId))
        const rep = data?.data ?? data
        reportName.value = rep?.name ?? rep?.code ?? String(reportId)
        builder.value = getTemplateBuilder(rep?.code)
    } catch {
        builder.value = undefined
    }
    if (builder.value) {
        let initial: Record<string, unknown> = builder.value.defaultConfig
        try {
            const raw = localStorage.getItem(storageKey.value)
            if (raw) initial = { ...builder.value.defaultConfig, ...JSON.parse(raw) }
        } catch { /* ignore */ }
        applyConfig(initial)
        await nextTick()   // asegura que el host (v-else) ya esté montado
        render()
    }
})

watch(() => route.params.id, () => { /* la ruta es dedicada por reporte; recarga si cambia */ })
</script>
