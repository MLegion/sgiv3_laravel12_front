<template>
    <div class="space-y-4">
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
                @update:report-meta="onMetaUpdate"
                @update:daos="onDaosUpdate" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import ReportEditor from '@/modules/reports/components/ReportEditor.vue'
import { renderTemplate } from '@/modules/reports/services/templateEngine'
import { exportToPdf } from '@/modules/reports/services/exportPdf'
import { exportToDocx } from '@/modules/reports/services/exportDocx'
import { exportToXlsx } from '@/modules/reports/services/exportXlsx'
import type { DataAccessObject } from '@/modules/reports/types/dao.type'
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
    daos:        [] as Array<{ id?: number; dao_id: number | null; var_name: string }>,
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
                .map(d => ({ dao_id: d.dao_id, var_name: d.var_name })),
        })
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'Error al guardar metadatos.'
    }
}

function onDaosUpdate(updated: Array<{ dao_id: number | null; var_name: string }>) {
    // Preserve backend id for existing DAOs (needed on submit)
    form.daos = updated.map(u => {
        const existing = form.daos.find(d => d.dao_id === u.dao_id)
        return { id: existing?.id, dao_id: u.dao_id, var_name: u.var_name }
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
        availableDaos.value  = daosRes.data.data ?? daosRes.data

        form.name        = report.name
        form.code        = report.code ?? ''
        form.description = report.description ?? ''
        form.is_template = report.isTemplate
        form.status      = report.status
        form.structure   = report.structure
        form.daos        = (report.daos ?? []).map(d => ({
            id:       d.id,
            dao_id:   d.id,
            var_name: d.varName,
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
                .map(d => ({ dao_id: d.dao_id, var_name: d.var_name })),
        })
        error.value = null
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'Error al guardar.'
    } finally {
        submitting.value = false
    }
}

async function exportReport(format: 'pdf' | 'docx' | 'xlsx') {
    exportError.value = null
    exporting.value   = true
    try {
        // 1. Ejecutar todos los DAOs del reporte
        const context: Record<string, any> = {}
        for (const daoLink of form.daos) {
            if (!daoLink.dao_id || !daoLink.var_name) continue
            const { data } = await api.post(API.REPORTS_API.daos.execute(daoLink.dao_id), { params: {} })
            context[daoLink.var_name] = data.data
        }

        // 2. Renderizar template con los datos
        const s = parseStructure(form.structure || '')
        const rendered = {
            header: renderTemplate(s.header, context),
            body:   renderTemplate(s.body,   context),
            footer: renderTemplate(s.footer, context),
            pageConfig: s.pageConfig,
        }

        // 3. Exportar al formato elegido
        const filename = form.name || 'reporte'
        if (format === 'pdf')  exportToPdf(rendered.body, filename, rendered.pageConfig, rendered.header, rendered.footer)
        if (format === 'docx') await exportToDocx(rendered.body, filename, rendered.pageConfig, rendered.header, rendered.footer)
        if (format === 'xlsx') exportToXlsx(rendered.body, filename)

    } catch (e: any) {
        exportError.value = e?.response?.data?.error ?? e?.message ?? 'Error al exportar.'
    } finally {
        exporting.value = false
    }
}

onMounted(loadData)
</script>
