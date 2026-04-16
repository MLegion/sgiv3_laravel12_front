<template>
    <div class="space-y-4">
        <!-- Modal: vista previa del PDF -->
        <Teleport to="body">
            <div v-if="previewModalOpen" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60" @click.self="closePreviewModal">
                <div class="bg-white rounded-xl shadow-2xl w-[95vw] h-[95vh] flex flex-col overflow-hidden">
                    <div class="px-5 py-3 bg-slate-800 text-white flex items-center justify-between flex-shrink-0">
                        <h3 class="text-sm font-black uppercase">Vista previa — {{ form.name || 'Reporte' }}</h3>
                        <div class="flex items-center gap-2">
                            <button
                                class="px-3 py-1.5 text-xs font-bold rounded bg-red-600 hover:bg-red-700 uppercase"
                                @click="downloadFromPreview"
                            >
                                ⬇ DESCARGAR PDF
                            </button>
                            <button
                                class="px-3 py-1.5 text-xs font-bold rounded bg-slate-600 hover:bg-slate-500 uppercase"
                                @click="closePreviewModal"
                            >
                                CERRAR
                            </button>
                        </div>
                    </div>
                    <div class="flex-1 bg-slate-200 overflow-hidden">
                        <iframe
                            v-if="previewUrl"
                            :src="previewUrl"
                            class="w-full h-full border-0"
                            title="Vista previa del reporte"
                        ></iframe>
                        <div v-else class="flex items-center justify-center h-full text-slate-500 text-sm">
                            Generando vista previa...
                        </div>
                    </div>
                </div>
            </div>
        </Teleport>

        <!-- Modal: parámetros antes de ejecutar -->
        <Teleport to="body">
            <div v-if="paramsModalOpen" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" @click.self="closeParamsModal">
                <div class="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
                    <div class="px-5 py-3 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
                        <h3 class="text-sm font-black uppercase text-blue-800">
                            Parámetros del reporte
                        </h3>
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
                            <div
                                v-for="p in reportRequestParams"
                                :key="'rp-' + p.name"
                                class="flex items-center gap-2"
                            >
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

                <!-- Toggle de estado -->
                <div class="flex items-center gap-2 px-3 py-1.5 border rounded-lg bg-white text-xs">
                    <span class="text-slate-500">Estado:</span>
                    <button type="button" @click="form.status = !form.status"
                        :class="['relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                                 form.status ? 'bg-green-500' : 'bg-slate-300']">
                        <span :class="['inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow',
                                       form.status ? 'translate-x-[18px]' : 'translate-x-0.5']" />
                    </button>
                    <span :class="form.status ? 'text-green-600 font-semibold' : 'text-slate-400'">
                        {{ form.status ? 'Activo' : 'Inactivo' }}
                    </span>
                </div>

                <!-- Exportaciones -->
                <template v-if="!loading">
                    <button type="button"
                        class="flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-lg hover:bg-sky-50 hover:border-sky-300 text-sky-700 font-semibold disabled:opacity-40"
                        :disabled="exporting"
                        title="Ver vista previa del reporte antes de descargar"
                        @click="exportReport('preview')">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3.5 h-3.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        VISTA PREVIA
                    </button>
                    <button type="button"
                        class="px-3 py-1.5 text-xs border rounded-lg hover:bg-red-50 hover:border-red-300 text-red-700 font-semibold disabled:opacity-40"
                        :disabled="exporting" @click="exportReport('pdf')">PDF</button>
                    <button type="button"
                        class="px-3 py-1.5 text-xs border rounded-lg hover:bg-blue-50 hover:border-blue-300 text-blue-700 font-semibold disabled:opacity-40"
                        :disabled="exporting" @click="exportReport('docx')">DOCX</button>
                    <button type="button"
                        class="px-3 py-1.5 text-xs border rounded-lg hover:bg-green-50 hover:border-green-300 text-green-700 font-semibold disabled:opacity-40"
                        :disabled="exporting || !hasTableNodes"
                        :title="hasTableNodes ? 'Exportar tablas a Excel' : 'El reporte no contiene tablas'"
                        @click="exportReport('xlsx')">XLSX</button>
                </template>

                <!-- Guardar -->
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

        <!-- Mensajes de error -->
        <p v-if="error" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{{ error }}</p>
        <p v-if="exportError" class="text-sm text-orange-600 bg-orange-50 border border-orange-200 rounded-lg px-4 py-2">{{ exportError }}</p>

        <div v-if="loading" class="text-center text-slate-400 py-16">Cargando...</div>

        <!-- Editor (ancho completo) -->
        <div v-else>
            <ReportEditor
                v-model="form.structure"
                :report-meta="reportMeta"
                :daos="form.daos"
                :available-daos="availableDaos"
                :live-preview="isLivePreview"
                @update:report-meta="onMetaUpdate"
                @update:daos="onDaosUpdate"
                @toggle-live-preview="onToggleLivePreview"
                @refresh-live-preview="onRefreshLivePreview" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import ReportEditor from '@/modules/reports/components/ReportEditor.vue'
import { renderTemplate } from '@/modules/reports/services/templateEngine'
import { exportToPdf, previewPdf } from '@/modules/reports/services/exportPdf'
import { exportToDocx } from '@/modules/reports/services/exportDocx'
import { exportToXlsx } from '@/modules/reports/services/exportXlsx'
import type { DataAccessObject } from '@/modules/reports/types/dao.type'
import type { DaoParameter, ParameterDataType } from '@/modules/reports/types/queryBuilder.type'
import type { Report } from '@/modules/reports/types/report.type'
import { parseStructure } from '@/modules/reports/types/report.type'

const route  = useRoute()
const router = useRouter()
const loading    = ref(true)
const submitting = ref(false)
const exporting  = ref(false)
const error       = ref<string | null>(null)
const exportError = ref<string | null>(null)
const availableDaos = ref<DataAccessObject[]>([])

const form = reactive({
    name:        '',
    code:        '',
    description: '',
    is_template: false,
    status:      true,
    structure:   '',
    daos:        [] as Array<{ id?: number; dao_id: number | null; var_name: string; pre_script: string | null; post_script: string | null }>,
})

const hasTableNodes = computed(() => {
    if (!form.structure) return false
    try {
        const s = parseStructure(form.structure)
        return (s.body.content ?? []).some((n: any) => n.type === 'table')
    } catch { return false }
})

const reportMeta = computed(() => ({
    name:        form.name,
    code:        form.code,
    description: form.description || null,
    isTemplate:  form.is_template,
}))

async function onMetaUpdate(meta: { name: string; code: string; description: string | null; isTemplate: boolean }) {
    form.name        = meta.name
    form.code        = meta.code
    form.description = meta.description ?? ''
    form.is_template = meta.isTemplate
    error.value = null
    try {
        await api.put(API.REPORTS_API.reports.update(route.params.id as string), {
            name:        form.name,
            code:        form.code || null,
            description: form.description || null,
            is_template: form.is_template,
            status:      form.status,
            structure:   form.structure || JSON.stringify({ type: 'doc', content: [] }),
            daos: form.daos
                .filter(d => d.dao_id && d.var_name)
                .map(d => ({ dao_id: d.dao_id, var_name: d.var_name, pre_script: d.pre_script, post_script: d.post_script })),
        })
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'Error al guardar metadatos.'
    }
}

function onDaosUpdate(updated: Array<{ dao_id: number | null; var_name: string; pre_script: string | null; post_script: string | null }>) {
    // Preserve backend id for existing DAOs (needed on submit)
    form.daos = updated.map(u => {
        const existing = form.daos.find(d => d.dao_id === u.dao_id)
        return {
            id:          existing?.id,
            dao_id:      u.dao_id,
            var_name:    u.var_name,
            pre_script:  u.pre_script ?? null,
            post_script: u.post_script ?? null,
        }
    })
}

async function loadData() {
    loading.value = true
    try {
        const [reportRes, daosRes] = await Promise.all([
            api.get(API.REPORTS_API.reports.byId(route.params.id as string)),
            api.get(API.REPORTS_API.daos.list + '?per_page=200'),
        ])
        const report: Report = reportRes.data
        // BaseRepository::paginate devuelve { items, total, page, perPage, lastPage }
        // Toleramos varios shapes por si cambia en el futuro
        const daosPayload = daosRes.data
        const daosList =
            Array.isArray(daosPayload) ? daosPayload
            : Array.isArray(daosPayload?.items) ? daosPayload.items
            : Array.isArray(daosPayload?.data) ? daosPayload.data
            : []
        availableDaos.value = daosList

        form.name        = report.name
        form.code        = report.code ?? ''
        form.description = report.description ?? ''
        form.is_template = report.isTemplate
        form.status      = report.status
        form.structure   = report.structure
        form.daos        = (report.daos ?? []).map(d => ({
            id:          d.id,
            dao_id:      d.id,
            var_name:    d.varName,
            pre_script:  d.preScript  ?? null,
            post_script: d.postScript ?? null,
        }))
    } finally {
        loading.value = false
    }
}

async function submit() {
    error.value = null
    submitting.value = true
    try {
        await api.put(API.REPORTS_API.reports.update(route.params.id as string), {
            name:        form.name,
            code:        form.code || null,
            description: form.description || null,
            is_template: form.is_template,
            status:      form.status,
            structure:   form.structure || JSON.stringify({ type: 'doc', content: [] }),
            daos: form.daos
                .filter(d => d.dao_id && d.var_name)
                .map(d => ({ dao_id: d.dao_id, var_name: d.var_name, pre_script: d.pre_script, post_script: d.post_script })),
        })
        error.value = null
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'Error al guardar.'
    } finally {
        submitting.value = false
    }
}

// ═══════════════════════════ Parámetros del reporte ═══════════════════════════

// Parámetros extraídos de los DAOs vinculados
// Solo tipo `request` — session/fixed el backend los resuelve automáticamente
// Se deduplican por `name` (si dos DAOs usan :teacher_id, se muestra un único input)
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
                // Si ya existe, marcar required si alguna ocurrencia lo pide
                const existing = byName.get(p.name)!
                existing.is_required = existing.is_required || p.is_required
            } else {
                byName.set(p.name, { ...p })
            }
        }
    }
    return Array.from(byName.values())
})

type ExportAction = 'pdf' | 'docx' | 'xlsx' | 'preview' | 'live-preview'

// Estado del modal de parámetros
const paramsModalOpen = ref(false)
const pendingExportFormat = ref<ExportAction | null>(null)
const reportParamValues = reactive<Record<string, string>>({})

// ═══════════════════════════ Vista con datos reales ═══════════════════════════

// Toggle "Vista con datos reales" — reemplaza temporalmente los chips {{ }}
// en el editor con los valores resueltos de los DAOs, para que el usuario
// vea los anchos reales antes de exportar. Al apagarlo se restaura el template.
const isLivePreview       = ref(false)
const liveTemplateBackup  = ref<string | null>(null)

function previewParamsKey(): string {
    return `reports:previewParams:${route.params.id}`
}

function loadCachedPreviewParams(): Record<string, string> | null {
    try {
        const raw = localStorage.getItem(previewParamsKey())
        return raw ? JSON.parse(raw) : null
    } catch { return null }
}

function saveCachedPreviewParams(values: Record<string, string>) {
    try { localStorage.setItem(previewParamsKey(), JSON.stringify(values)) } catch {}
}

function clearCachedPreviewParams() {
    try { localStorage.removeItem(previewParamsKey()) } catch {}
}

// Estado del modal de vista previa
const previewModalOpen = ref(false)
const previewUrl = ref<string | null>(null)

const pendingExportButtonLabel = computed(() => {
    switch (pendingExportFormat.value) {
        case 'preview':      return 'VER VISTA PREVIA'
        case 'pdf':          return 'EJECUTAR PDF'
        case 'docx':         return 'EJECUTAR DOCX'
        case 'xlsx':         return 'EJECUTAR XLSX'
        case 'live-preview': return 'CARGAR DATOS'
        default:             return 'EJECUTAR'
    }
})

function closeParamsModal() {
    paramsModalOpen.value = false
    pendingExportFormat.value = null
}

function closePreviewModal() {
    previewModalOpen.value = false
    // Liberar el blob URL para no dejar memory leak
    if (previewUrl.value) {
        URL.revokeObjectURL(previewUrl.value)
        previewUrl.value = null
    }
}

// Mapea parámetros que vienen del backend (camelCase/snake_case tolerante)
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

// ═══════════════════════════ Exportación ═══════════════════════════

/**
 * Punto de entrada desde los botones VISTA PREVIA / PDF / DOCX / XLSX.
 * - Si hay parámetros request, abre el modal y espera confirmación.
 * - Si no, ejecuta la acción directo.
 *
 * Los cuatro flujos necesitan los datos de los DAOs: PDF/DOCX renderizan
 * el template completo, XLSX extrae las tablas renderizadas (que dependen
 * de que los `@foreach` se hayan resuelto con datos reales), y la vista
 * previa usa exactamente la misma pipeline que PDF pero sin descargar.
 */
function exportReport(action: ExportAction) {
    // eslint-disable-next-line no-console
    console.log('[live-preview] exportReport action=', action, 'reqParamsCount=', reportRequestParams.value.length)
    exportError.value = null

    // Sin parámetros request → ejecutar directo
    if (reportRequestParams.value.length === 0) {
        // eslint-disable-next-line no-console
        console.log('[live-preview] no params, direct doAction')
        void doAction(action)
        return
    }

    // Para 'live-preview', si ya hay parámetros en cache saltamos el modal
    if (action === 'live-preview') {
        const cached = loadCachedPreviewParams()
        // eslint-disable-next-line no-console
        console.log('[live-preview] cache lookup =', cached)
        if (cached) {
            for (const p of reportRequestParams.value) {
                reportParamValues[p.name] = cached[p.name] ?? p.default_value ?? ''
            }
            void doAction(action)
            return
        }
    }

    // Inicializar valores con default si hay
    for (const p of reportRequestParams.value) {
        if (reportParamValues[p.name] === undefined) {
            reportParamValues[p.name] = p.default_value ?? ''
        }
    }
    pendingExportFormat.value = action
    paramsModalOpen.value = true
    // eslint-disable-next-line no-console
    console.log('[live-preview] modal opened. pending=', pendingExportFormat.value, 'open=', paramsModalOpen.value)
}

// Llamado desde el botón del modal de parámetros
async function runPendingExport() {
    const action = pendingExportFormat.value
    if (!action) return

    // Validar requeridos
    for (const p of reportRequestParams.value) {
        if (p.is_required && (reportParamValues[p.name] === '' || reportParamValues[p.name] == null)) {
            exportError.value = `Falta el parámetro requerido: ${p.name}`
            return
        }
    }

    // Cachear los params de vista con datos reales para no volver a pedirlos
    if (action === 'live-preview') {
        const toCache: Record<string, string> = {}
        for (const p of reportRequestParams.value) toCache[p.name] = reportParamValues[p.name] ?? ''
        saveCachedPreviewParams(toCache)
    }

    await doAction(action)
    if (!exportError.value) {
        closeParamsModal()
    }
}

/**
 * Ejecuta los DAOs del reporte con los parámetros dados y renderiza
 * el template. Devuelve el documento listo para exportación.
 */
async function executeAndRender() {
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

    const s = parseStructure(form.structure || '')
    return {
        header:     renderTemplate(s.header, context),
        body:       renderTemplate(s.body,   context),
        footer:     renderTemplate(s.footer, context),
        pageConfig: s.pageConfig,
    }
}

async function doAction(action: ExportAction) {
    exportError.value = null
    exporting.value   = true
    try {
        const rendered = await executeAndRender()
        const filename = form.name || 'reporte'

        switch (action) {
            case 'preview': {
                // Revocar URL previo si quedó
                if (previewUrl.value) {
                    URL.revokeObjectURL(previewUrl.value)
                    previewUrl.value = null
                }
                const url = await previewPdf(rendered.body, rendered.pageConfig, rendered.header, rendered.footer)
                previewUrl.value = url
                previewModalOpen.value = true
                break
            }
            case 'pdf':
                await exportToPdf(rendered.body, filename, rendered.pageConfig, rendered.header, rendered.footer)
                break
            case 'docx':
                await exportToDocx(rendered.body, filename, rendered.pageConfig, rendered.header, rendered.footer)
                break
            case 'xlsx':
                exportToXlsx(rendered.body, filename)
                break
            case 'live-preview': {
                // Reemplaza el contenido del editor con el doc ya renderizado
                // (chips `{{ }}` sustituidos por valores reales). Guardamos el
                // template original para poder restaurarlo al apagar el toggle.
                if (liveTemplateBackup.value === null) {
                    liveTemplateBackup.value = form.structure
                }
                const s = parseStructure(form.structure || '')
                const livePayload = {
                    version:    2,
                    pageConfig: s.pageConfig,
                    header:     rendered.header,
                    body:       rendered.body,
                    footer:     rendered.footer,
                }
                form.structure = JSON.stringify(livePayload)
                isLivePreview.value = true
                break
            }
        }
    } catch (e: any) {
        exportError.value = e?.response?.data?.error ?? e?.message ?? 'Error al exportar.'
    } finally {
        exporting.value = false
    }
}

// ═══════════════════════════ Handlers del toggle del editor ═══════════════════════════

function onToggleLivePreview() {
    // eslint-disable-next-line no-console
    console.log('[live-preview] onToggleLivePreview called. isLivePreview=', isLivePreview.value, 'daos=', form.daos?.length, 'requestParams=', reportRequestParams.value.length)
    if (isLivePreview.value) {
        // Apagar: restaurar el template original
        if (liveTemplateBackup.value !== null) {
            form.structure = liveTemplateBackup.value
            liveTemplateBackup.value = null
        }
        isLivePreview.value = false
        return
    }
    // Encender: abre params modal si no están cacheados, luego ejecuta
    exportReport('live-preview')
}

function onRefreshLivePreview() {
    // Limpia cache, si está encendido pide params de nuevo
    clearCachedPreviewParams()
    if (isLivePreview.value) {
        // Apagar antes para restaurar el template, luego encender para re-preguntar
        if (liveTemplateBackup.value !== null) {
            form.structure = liveTemplateBackup.value
            liveTemplateBackup.value = null
        }
        isLivePreview.value = false
    }
    exportReport('live-preview')
}

/**
 * Descarga el PDF desde el modal de vista previa.
 * Re-ejecuta toda la pipeline para garantizar frescura (por si los datos cambiaron).
 */
async function downloadFromPreview() {
    await doAction('pdf')
}

onMounted(loadData)

onBeforeUnmount(() => {
    // Liberar el blob URL si el usuario sale sin cerrar el modal
    if (previewUrl.value) {
        URL.revokeObjectURL(previewUrl.value)
        previewUrl.value = null
    }
})
</script>
