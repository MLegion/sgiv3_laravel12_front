<template>
    <div class="space-y-5">
        <!-- Modal: vista previa docx-preview -->
        <Teleport to="body">
            <div v-if="docxPreviewOpen" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60" @click.self="closeDocxPreview">
                <div class="bg-white rounded-xl shadow-2xl w-[95vw] h-[95vh] flex flex-col overflow-hidden">
                    <div class="px-5 py-3 bg-indigo-800 text-white flex items-center justify-between flex-shrink-0">
                        <h3 class="text-sm font-black uppercase">Vista previa — {{ form.name || 'Reporte' }}</h3>
                        <div class="flex items-center gap-2">
                            <button class="px-3 py-1.5 text-xs font-bold rounded bg-blue-600 hover:bg-blue-700 uppercase" @click="downloadGeneratedDocx">
                                ⬇ DESCARGAR DOCX
                            </button>
                            <button class="px-3 py-1.5 text-xs font-bold rounded bg-red-600 hover:bg-red-700 uppercase" @click="printGeneratedDocx">
                                🖨 IMPRIMIR / PDF
                            </button>
                            <button class="px-3 py-1.5 text-xs font-bold rounded bg-slate-600 hover:bg-slate-500 uppercase" @click="closeDocxPreview">
                                CERRAR
                            </button>
                        </div>
                    </div>
                    <div class="flex-1 bg-slate-200 overflow-auto p-6">
                        <div ref="docxPreviewHost" class="docx-preview-host"></div>
                    </div>
                </div>
            </div>
        </Teleport>

        <!-- Modal: parámetros antes de ejecutar -->
        <Teleport to="body">
            <div v-if="paramsModalOpen" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" @click.self="closeParamsModal">
                <div class="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
                    <div class="px-5 py-3 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
                        <h3 class="text-sm font-black uppercase text-blue-800">Parámetros del reporte</h3>
                        <button class="text-slate-400 hover:text-slate-600 text-xl leading-none" @click="closeParamsModal">×</button>
                    </div>
                    <div class="p-5 space-y-3">
                        <p class="text-[11px] text-slate-500">
                            Completa los valores para ejecutar los DAOs vinculados.
                            Los parámetros de tipo <strong>session</strong> y <strong>fixed</strong> se resuelven automáticamente.
                        </p>
                        <div v-if="reportRequestParams.length === 0" class="p-4 text-center text-[11px] text-slate-400 italic border border-dashed border-slate-200 rounded">
                            No hay parámetros que completar.
                        </div>
                        <div v-else class="space-y-2">
                            <div v-for="p in reportRequestParams" :key="'rp-' + p.name" class="flex items-center gap-2">
                                <label class="text-[11px] font-mono font-bold text-slate-700 w-36 truncate flex items-center gap-1">
                                    :{{ p.name }}
                                    <span v-if="p.is_required" class="text-red-500">*</span>
                                </label>
                                <input
                                    :value="reportParamValues[p.name] ?? ''"
                                    :type="inputTypeForDataType(p.data_type)"
                                    :placeholder="p.data_type"
                                    class="flex-1 px-2 py-1 text-xs border rounded font-mono"
                                    @input="reportParamValues[p.name] = ($event.target as HTMLInputElement).value"
                                />
                                <span class="text-[9px] uppercase font-bold text-slate-400 w-14 text-right">{{ p.data_type }}</span>
                            </div>
                        </div>
                    </div>
                    <div class="px-5 py-3 bg-slate-50 border-t flex justify-end gap-2">
                        <button class="px-4 py-2 text-xs font-bold rounded-lg border hover:bg-white uppercase" @click="closeParamsModal">
                            CANCELAR
                        </button>
                        <button
                            class="px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 uppercase disabled:opacity-50"
                            :disabled="exporting"
                            @click="runPendingExport"
                        >
                            {{ exporting ? 'EJECUTANDO...' : ('▶ ' + pendingExportButtonLabel) }}
                        </button>
                    </div>
                </div>
            </div>
        </Teleport>

        <!-- Barra superior -->
        <div class="flex items-center justify-between gap-2 flex-wrap">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Editar Reporte</h1>
            <div class="flex items-center gap-2 flex-wrap">
                <div
                    class="flex items-center gap-2 px-3 py-1.5 border rounded-lg bg-white text-xs"
                    :title="!templateState.hasTemplate ? 'Debes subir una plantilla Word antes de activar el reporte.' : ''"
                >
                    <span class="text-slate-500">Estado:</span>
                    <button type="button"
                        :disabled="!templateState.hasTemplate"
                        @click="toggleStatus"
                        :class="['relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                                 form.status ? 'bg-green-500' : 'bg-slate-300',
                                 !templateState.hasTemplate ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer']">
                        <span :class="['inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow',
                                       form.status ? 'translate-x-[18px]' : 'translate-x-0.5']" />
                    </button>
                    <span :class="form.status ? 'text-green-600 font-semibold' : 'text-slate-400'">
                        {{ form.status ? 'Activo' : 'Inactivo' }}
                    </span>
                </div>

                <template v-if="!loading && templateState.hasTemplate">
                    <button type="button"
                        class="flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-lg hover:bg-sky-50 hover:border-sky-300 text-sky-700 font-semibold disabled:opacity-40"
                        :disabled="exporting"
                        @click="exportReport('preview')">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3.5 h-3.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        VISTA PREVIA
                    </button>
                    <button type="button"
                        class="px-3 py-1.5 text-xs border rounded-lg hover:bg-blue-50 hover:border-blue-300 text-blue-700 font-semibold disabled:opacity-40"
                        :disabled="exporting" @click="exportReport('docx')">DOCX</button>
                    <button type="button"
                        class="px-3 py-1.5 text-xs border rounded-lg hover:bg-red-50 hover:border-red-300 text-red-700 font-semibold disabled:opacity-40"
                        :disabled="exporting" @click="exportReport('pdf')">PDF</button>
                </template>

                <button type="button"
                    class="flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold disabled:opacity-50"
                    :disabled="submitting" @click="submit">
                    <svg v-if="submitting" class="w-3.5 h-3.5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    GUARDAR
                </button>

                <button class="px-3 py-1.5 text-sm border rounded-lg hover:bg-slate-50" @click="router.back()">REGRESAR</button>
            </div>
        </div>

        <p v-if="error" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{{ error }}</p>
        <p v-if="exportError" class="text-sm text-orange-600 bg-orange-50 border border-orange-200 rounded-lg px-4 py-2">{{ exportError }}</p>
        <div v-if="!loading && !templateState.hasTemplate" class="flex items-start gap-2 text-sm bg-amber-50 border border-amber-300 rounded-lg px-4 py-3">
            <svg class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <div>
                <p class="font-bold text-amber-900">Plantilla requerida</p>
                <p class="text-[12px] text-amber-800">Este reporte no se podrá activar ni generar hasta que subas una plantilla Word (.docx). Sube el archivo en el panel de la derecha.</p>
            </div>
        </div>

        <div v-if="loading" class="text-center text-slate-400 py-16">Cargando...</div>

        <div v-else class="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <!-- Columna izquierda: metadatos -->
            <div class="space-y-5 xl:col-span-1">
                <div class="bg-white border rounded-xl shadow-sm p-5 space-y-4">
                    <h2 class="text-sm font-black uppercase text-slate-700">Información general</h2>
                    <FormInput label="NOMBRE" v-model="form.name" required />
                    <FormInput label="CÓDIGO" v-model="form.code" />
                    <FormInput label="DESCRIPCIÓN" v-model="form.description" />
                    <FormSwitch label="ES PLANTILLA" v-model="form.is_template" />
                </div>

                <ReportDaoManager
                    :linked="form.daos"
                    :available-daos="availableDaos"
                    @update="onDaosUpdate"
                />
            </div>

            <!-- Columna derecha: plantilla -->
            <div class="xl:col-span-2">
                <ReportTemplatePanel
                    :report-id="route.params.id as string"
                    :has-template="templateState.hasTemplate"
                    :template-original-name="templateState.templateOriginalName"
                    @update="onTemplateUpdate"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import FormInput from '@/app/components/ui/form/FormInput.vue'
import FormSwitch from '@/app/components/ui/form/FormSwitch.vue'
import ReportTemplatePanel from '@/modules/reports/components/ReportTemplatePanel.vue'
import ReportDaoManager, { type LinkedDao } from '@/modules/reports/components/ReportDaoManager.vue'
import { fillDocxTemplate } from '@/modules/reports/services/docxGenerator'
import { renderAsync } from 'docx-preview'
import type { DataAccessObject } from '@/modules/reports/types/dao.type'
import type { DaoParameter, ParameterDataType } from '@/modules/reports/types/queryBuilder.type'
import type { Report } from '@/modules/reports/types/report.type'

const route  = useRoute()
const router = useRouter()

const loading     = ref(true)
const submitting  = ref(false)
const exporting   = ref(false)
const error       = ref<string | null>(null)
const exportError = ref<string | null>(null)
const availableDaos = ref<DataAccessObject[]>([])

const form = reactive({
    name:        '',
    code:        '',
    description: '',
    is_template: false,
    status:      true,
    daos:        [] as LinkedDao[],
})

const templateState = reactive({
    hasTemplate:          false,
    templateOriginalName: null as string | null,
})

function onTemplateUpdate(p: { hasTemplate: boolean; templateOriginalName: string | null }) {
    templateState.hasTemplate          = p.hasTemplate
    templateState.templateOriginalName = p.templateOriginalName
    if (!p.hasTemplate) form.status = false
}

function toggleStatus() {
    if (!templateState.hasTemplate) return
    form.status = !form.status
}

function onDaosUpdate(updated: LinkedDao[]) {
    form.daos = updated
}

async function loadData() {
    loading.value = true
    try {
        const [reportRes, daosRes] = await Promise.all([
            api.get(API.REPORTS_API.reports.byId(route.params.id as string)),
            api.get(API.REPORTS_API.daos.list + '?per_page=200'),
        ])
        const report: Report = reportRes.data
        const daosPayload = daosRes.data
        availableDaos.value =
            Array.isArray(daosPayload) ? daosPayload
            : Array.isArray(daosPayload?.items) ? daosPayload.items
            : Array.isArray(daosPayload?.data) ? daosPayload.data
            : []

        form.name        = report.name
        form.code        = report.code ?? ''
        form.description = report.description ?? ''
        form.is_template = report.isTemplate
        form.status      = report.status
        form.daos        = (report.daos ?? []).map(d => ({
            id:          d.id,
            dao_id:      d.id,
            var_name:    d.varName,
            pre_script:  d.preScript  ?? null,
            post_script: d.postScript ?? null,
        }))
        templateState.hasTemplate          = Boolean(report.hasTemplate ?? report.templatePath)
        templateState.templateOriginalName = report.templateOriginalName ?? null
    } finally {
        loading.value = false
    }
}

async function submit(forceActivate = false) {
    error.value = null
    submitting.value = true
    try {
        await api.put(API.REPORTS_API.reports.update(route.params.id as string), {
            name:        form.name,
            code:        form.code || null,
            description: form.description || null,
            is_template: form.is_template,
            status:      form.status,
            force_activate: forceActivate,
            daos: form.daos
                .filter(d => d.dao_id && d.var_name)
                .map(d => ({ dao_id: d.dao_id, var_name: d.var_name, pre_script: d.pre_script, post_script: d.post_script })),
        })
    } catch (e: any) {
        const errors = e?.response?.data?.errors
        if (errors?._conflict && errors?.status) {
            const msg = Array.isArray(errors.status) ? errors.status[0] : errors.status
            if (confirm(msg)) {
                await submit(true)
                return
            }
            error.value = null
            submitting.value = false
            return
        }
        error.value = e?.response?.data?.message ?? errors?.status?.[0] ?? 'Error al guardar.'
    } finally {
        submitting.value = false
    }
}

// ═══════════════════════════ Parámetros y exportación ═══════════════════════════

const reportRequestParams = computed<DaoParameter[]>(() => {
    const byName = new Map<string, DaoParameter>()
    for (const daoLink of form.daos) {
        if (!daoLink.dao_id) continue
        const dao = availableDaos.value.find(d => d.id === daoLink.dao_id)
        if (!dao) continue
        const params = normalizeDaoParameters(dao.parameters ?? [])
        for (const p of params) {
            if (p.source_type !== 'request' || !p.name) continue
            if (byName.has(p.name)) {
                const existing = byName.get(p.name)!
                existing.is_required = existing.is_required || p.is_required
            } else {
                byName.set(p.name, { ...p })
            }
        }
    }
    return Array.from(byName.values())
})

type ExportAction = 'pdf' | 'docx' | 'preview'

const paramsModalOpen = ref(false)
const pendingExportFormat = ref<ExportAction | null>(null)
const reportParamValues = reactive<Record<string, string>>({})

const docxPreviewOpen   = ref(false)
const docxPreviewHost   = ref<HTMLElement | null>(null)
const generatedDocxBlob = ref<Blob | null>(null)
const generatedFilename = ref<string>('reporte.docx')

const pendingExportButtonLabel = computed(() => {
    switch (pendingExportFormat.value) {
        case 'preview': return 'VER VISTA PREVIA'
        case 'pdf':     return 'GENERAR PDF'
        case 'docx':    return 'GENERAR DOCX'
        default:        return 'EJECUTAR'
    }
})

function closeParamsModal() {
    paramsModalOpen.value = false
    pendingExportFormat.value = null
}

function closeDocxPreview() {
    docxPreviewOpen.value = false
    if (docxPreviewHost.value) docxPreviewHost.value.innerHTML = ''
    generatedDocxBlob.value = null
}

function downloadGeneratedDocx() {
    if (!generatedDocxBlob.value) return
    const url = URL.createObjectURL(generatedDocxBlob.value)
    const a = document.createElement('a')
    a.href = url
    a.download = generatedFilename.value
    a.click()
    URL.revokeObjectURL(url)
}

function printGeneratedDocx() {
    if (!docxPreviewHost.value) return
    const w = window.open('', '_blank', 'width=900,height=1100')
    if (!w) return
    w.document.write(`<!doctype html><html><head><title>${generatedFilename.value}</title>
        <style>
            body { margin: 0; font-family: 'Calibri', sans-serif; }
            .docx-wrapper { background: transparent; }
            .docx { margin: 0 auto 12px; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.15); }
            @media print {
                body { background: white; }
                .docx { box-shadow: none; margin: 0; }
            }
        </style>
        </head><body>${docxPreviewHost.value.innerHTML}</body></html>`)
    w.document.close()
    w.focus()
    setTimeout(() => { w.print() }, 300)
}

function normalizeDaoParameters(raw: any[]): DaoParameter[] {
    return (raw ?? []).map((p: any): DaoParameter => ({
        id:            p.id,
        name:          p.name,
        source_type:   p.sourceType ?? p.source_type,
        source_key:    p.sourceKey ?? p.source_key ?? null,
        data_type:     p.dataType ?? p.data_type ?? 'string',
        default_value: p.defaultValue ?? p.default_value ?? null,
        is_required:   p.isRequired ?? p.is_required ?? true,
        position:      p.position ?? 0,
    }))
}

function inputTypeForDataType(dt: ParameterDataType): string {
    switch (dt) {
        case 'int':
        case 'float':    return 'number'
        case 'date':     return 'date'
        case 'datetime': return 'datetime-local'
        default:         return 'text'
    }
}

function castParamValue(raw: string, dt: ParameterDataType): unknown {
    if (raw === '' || raw == null) return null
    switch (dt) {
        case 'int':   return parseInt(raw, 10)
        case 'float': return parseFloat(raw)
        case 'bool':  return raw === 'true' || raw === '1'
        default:      return raw
    }
}

function exportReport(action: ExportAction) {
    if (!templateState.hasTemplate) {
        exportError.value = 'Sube una plantilla Word antes de generar el reporte.'
        return
    }
    exportError.value = null

    if (reportRequestParams.value.length === 0) {
        void doAction(action)
        return
    }

    for (const p of reportRequestParams.value) {
        if (reportParamValues[p.name] === undefined) {
            reportParamValues[p.name] = p.default_value ?? ''
        }
    }
    pendingExportFormat.value = action
    paramsModalOpen.value = true
}

async function runPendingExport() {
    const action = pendingExportFormat.value
    if (!action) return

    for (const p of reportRequestParams.value) {
        if (p.is_required && (reportParamValues[p.name] === '' || reportParamValues[p.name] == null)) {
            exportError.value = `Falta el parámetro requerido: ${p.name}`
            return
        }
    }

    await doAction(action)
    if (!exportError.value) closeParamsModal()
}

async function executeContext() {
    const execParams: Record<string, unknown> = {}
    for (const p of reportRequestParams.value) {
        const raw = reportParamValues[p.name] ?? ''
        execParams[p.name] = castParamValue(raw, p.data_type)
    }
    const context: Record<string, any> = {}
    const reportId = route.params.id
    for (const daoLink of form.daos) {
        if (!daoLink.dao_id || !daoLink.var_name) continue
        const { data } = await api.post(
            API.REPORTS_API.daos.execute(daoLink.dao_id),
            { params: execParams, report_id: reportId },
        )
        context[daoLink.var_name] = data.data
    }
    // eslint-disable-next-line no-console
    console.log('[report-context]', JSON.parse(JSON.stringify(context)))
    return context
}

async function doAction(action: ExportAction) {
    exportError.value = null
    exporting.value   = true
    try {
        const filename = form.name || 'reporte'
        const context  = await executeContext()

        const tplRes  = await api.get(API.REPORTS_API.reports.template(route.params.id as string), { responseType: 'blob' })
        const tplBlob: Blob = tplRes.data

        const filled = await fillDocxTemplate(tplBlob, context)
        generatedDocxBlob.value = filled
        generatedFilename.value = `${filename}.docx`

        if (action === 'docx') {
            const url = URL.createObjectURL(filled)
            const a = document.createElement('a')
            a.href = url
            a.download = generatedFilename.value
            a.click()
            URL.revokeObjectURL(url)
            return
        }

        docxPreviewOpen.value = true
        await new Promise<void>((r) => requestAnimationFrame(() => r()))
        if (!docxPreviewHost.value) return
        docxPreviewHost.value.innerHTML = ''
        await renderAsync(filled, docxPreviewHost.value, undefined, {
            className:    'docx-preview',
            inWrapper:    true,
            breakPages:   true,
            experimental: true,
            useBase64URL: true,
        })

        if (action === 'pdf') {
            setTimeout(() => printGeneratedDocx(), 250)
        }
    } catch (e: any) {
        exportError.value = e?.response?.data?.message ?? e?.message ?? 'Error al exportar.'
    } finally {
        exporting.value = false
    }
}

onMounted(loadData)
</script>

<style>
.docx-preview-host .docx-wrapper { background: transparent; }
.docx-preview-host .docx {
    margin: 0 auto 16px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    background: white;
}
</style>
