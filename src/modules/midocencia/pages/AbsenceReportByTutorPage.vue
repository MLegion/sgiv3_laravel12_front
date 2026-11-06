<template>
    <div class="p-4 md:p-6 max-w-6xl mx-auto">
        <h1 class="text-xl font-semibold text-slate-800">Reporte de estudiantes ausentes por tutor</h1>
        <p class="text-sm text-slate-500 mb-4">Alumnos tutorados con ausencias registradas por sus docentes en el periodo activo.</p>

        <div class="flex flex-wrap items-end gap-3 mb-4">
            <!-- Modo -->
            <div class="inline-flex rounded-lg border border-slate-200 overflow-hidden text-sm">
                <button @click="setMode('summary')" :class="mode === 'summary' ? 'bg-slate-700 text-white' : 'bg-white text-slate-600'" class="px-3 py-2">Resumen por estudiante</button>
                <button @click="setMode('detail')" :class="mode === 'detail' ? 'bg-slate-700 text-white' : 'bg-white text-slate-600'" class="px-3 py-2 border-l border-slate-200">Detalle</button>
            </div>
            <div>
                <label class="block text-xs font-medium text-slate-600">Desde</label>
                <input type="date" v-model="from" class="mt-1 rounded-lg border-slate-300 text-sm" />
            </div>
            <div>
                <label class="block text-xs font-medium text-slate-600">Hasta</label>
                <input type="date" v-model="to" class="mt-1 rounded-lg border-slate-300 text-sm" />
            </div>
            <button @click="load" class="px-4 py-2 rounded-lg bg-slate-700 text-white text-sm font-medium">Filtrar</button>
            <button @click="exportPdf" :disabled="exporting"
                class="px-4 py-2 rounded-lg bg-rose-600 text-white text-sm font-medium disabled:opacity-50 flex items-center gap-1.5">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6M9 17h3"/></svg>
                {{ exporting ? 'Generando…' : 'PDF informativo' }}
            </button>
        </div>

        <!-- RESUMEN: conteo por alumno -->
        <DataTable v-if="mode === 'summary'"
            :columns="summaryColumns"
            :rows="pagedSummary"
            :loading="loading"
            :pagination="{ page, perPage, total: filteredSummary.length }"
            :exportable="['csv', 'xlsx']"
            search-placeholder="Buscar tutor o estudiante…"
            empty-text="Sin ausencias registradas en el periodo."
            @change="onTableChange"
        >
            <template #cell-num_control="{ row }"><span class="font-mono text-xs">{{ row.num_control }}</span></template>
            <template #cell-ausencias="{ row }"><span class="font-semibold text-rose-600">{{ row.ausencias }}</span></template>
            <template #cell-retardos="{ row }"><span class="font-semibold text-amber-600">{{ row.retardos }}</span></template>
            <template #cell-justificados="{ row }"><span class="font-semibold text-sky-600">{{ row.justificados }}</span></template>
            <template #cell-total="{ row }"><span class="font-bold">{{ row.total }}</span></template>
        </DataTable>

        <!-- DETALLE: fila por ausencia (con fecha y motivo) -->
        <DataTable v-else
            :columns="detailColumns"
            :rows="pagedDetail"
            :loading="loading"
            :pagination="{ page, perPage, total: filteredDetail.length }"
            :exportable="['csv', 'xlsx']"
            search-placeholder="Buscar tutor o estudiante…"
            empty-text="Sin ausencias registradas en el periodo."
            @change="onTableChange"
        >
            <template #cell-num_control="{ row }"><span class="font-mono text-xs">{{ row.num_control }}</span></template>
            <template #cell-grupo_sem="{ row }"><span class="text-xs">{{ row.grupo }}{{ row.semestre ? ` · ${row.semestre}º` : '' }}</span></template>
            <template #cell-telefono="{ row }"><span class="text-xs">{{ row.telefono || '—' }}</span></template>
            <template #cell-correo="{ row }"><span class="text-xs">{{ row.correo || '—' }}</span></template>
            <template #cell-docente="{ row }"><span class="text-xs">{{ row.docente || '—' }}</span></template>
            <template #cell-status="{ row }">
                <span class="px-2 py-0.5 rounded-full text-xs"
                    :class="row.status === 'absent' ? 'bg-rose-100 text-rose-700' : row.status === 'late' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'">
                    {{ statusLabel(row.status) }}
                </span>
            </template>
        </DataTable>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import type { DataTableColumn, DataTableChangeEvent } from '@/app/components/ui/datatable/types'

const toast = useToast()
const GA = API.MIDOCENCIA_API.groupAttendance

interface DetailRow { tutor: string; programa?: string; semestre?: number | null; num_control: string; nombre: string; materia: string; grupo: string; fecha: string; telefono?: string | null; correo?: string | null; docente?: string | null; status: string; motivo?: string }
interface SummaryRow { tutor: string; num_control: string; nombre: string; ausencias: number; retardos: number; justificados: number; total: number }

const mode = ref<'summary' | 'detail'>('summary')
const detailRows = ref<DetailRow[]>([])
const summaryRows = ref<SummaryRow[]>([])
const from = ref<string>('')
const to = ref<string>('')
const loading = ref(false)

const page = ref(1)
const perPage = ref(25)
const term = ref('')

const summaryColumns: DataTableColumn<SummaryRow>[] = [
    { key: 'tutor', label: 'Tutor', searchable: true },
    { key: 'num_control', label: 'No. Control', searchable: true },
    { key: 'nombre', label: 'Estudiante', searchable: true },
    { key: 'ausencias', label: 'Ausencias', align: 'center' },
    { key: 'retardos', label: 'Retardos', align: 'center' },
    { key: 'justificados', label: 'Justificados', align: 'center' },
    { key: 'total', label: 'Total', align: 'center' },
]
const detailColumns: DataTableColumn<DetailRow>[] = [
    { key: 'tutor', label: 'Tutor', searchable: true },
    { key: 'programa', label: 'Programa' },
    { key: 'fecha', label: 'Fecha' },
    { key: 'num_control', label: 'No. Control', searchable: true },
    { key: 'nombre', label: 'Estudiante', searchable: true },
    { key: 'materia', label: 'Materia' },
    { key: 'grupo_sem', label: 'Grupo y sem.' },
    { key: 'telefono', label: 'Teléfono' },
    { key: 'correo', label: 'Correo' },
    { key: 'status', label: 'Estado' },
    { key: 'motivo', label: 'Observaciones' },
    { key: 'docente', label: 'Docente que reporta' },
]

function matches(r: { tutor: string; nombre: string; num_control: string }): boolean {
    const t = term.value.trim().toLowerCase()
    if (!t) return true
    return r.tutor.toLowerCase().includes(t) || r.nombre.toLowerCase().includes(t) || (r.num_control ?? '').toLowerCase().includes(t)
}
const filteredSummary = computed(() => summaryRows.value.filter(matches))
const filteredDetail = computed(() => detailRows.value.filter(matches))
const pagedSummary = computed(() => filteredSummary.value.slice((page.value - 1) * perPage.value, page.value * perPage.value))
const pagedDetail = computed(() => filteredDetail.value.slice((page.value - 1) * perPage.value, page.value * perPage.value))

function onTableChange(e: DataTableChangeEvent) {
    page.value = e.page
    perPage.value = e.perPage
    if (e.search !== undefined) {
        term.value = typeof e.search === 'string' ? e.search : (Object.values(e.search)[0] ?? '')
        page.value = 1
    }
}
function setMode(m: 'summary' | 'detail') { mode.value = m; page.value = 1; load() }
function statusLabel(s: string): string {
    return s === 'absent' ? 'Ausente' : s === 'late' ? 'Retardo' : s === 'excused' ? 'Justificado' : s
}

async function load() {
    loading.value = true
    page.value = 1
    try {
        const params = { from: from.value || null, to: to.value || null }
        if (mode.value === 'summary') {
            const { data } = await api.get(GA.absenceSummary, { params })
            summaryRows.value = data
        } else {
            const { data } = await api.get(GA.absenceReport, { params })
            detailRows.value = data
        }
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudo cargar el reporte.') }
    finally { loading.value = false }
}

// --- PDF informativo (para el encargado de tutorías), agrupado por tutor ---
const exporting = ref(false)

function esc(s: unknown): string {
    return String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!))
}
function fmtDate(s: string): string { return s ? String(s).slice(0, 10) : '' }

function buildPdfHtml(rows: DetailRow[]): string {
    // Agrupa por tutor (eje principal del reporte), conservando el orden recibido.
    const groups = new Map<string, DetailRow[]>()
    for (const r of rows) {
        const key = r.tutor || '(Sin tutor)'
        if (!groups.has(key)) groups.set(key, [])
        groups.get(key)!.push(r)
    }
    const rango = from.value || to.value
        ? `Del ${esc(from.value || '…')} al ${esc(to.value || '…')}`
        : 'Periodo activo'
    const th = (t: string, w?: string) => `<th style="border:1px solid #475569;padding:3px 4px;background:#e2e8f0;font-size:9px;text-align:left;${w ? `width:${w};` : ''}">${t}</th>`
    const td = (t: string) => `<td style="border:1px solid #94a3b8;padding:3px 4px;font-size:9px;vertical-align:top;">${t}</td>`

    let html = `<div style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;">`
    let first = true
    for (const [tutor, list] of groups) {
        const programa = list.find(r => r.programa)?.programa || ''
        html += `<div style="${first ? '' : 'page-break-before:always;'}padding:4px 0 10px;">`
        first = false
        html += `<div style="text-align:center;">
            <div style="font-size:12px;font-weight:bold;">REPORTE DE ESTUDIANTES AUSENTES POR TUTORES Y TUTORAS</div>
            <div style="font-size:10px;">${esc(rango)}</div>
        </div>`
        html += `<div style="font-size:10px;margin:6px 0 4px;">
            <b>Tutor(a):</b> ${esc(tutor)} &nbsp;·&nbsp; <b>Programa educativo:</b> ${esc(programa) || '—'}
        </div>`
        html += `<table style="border-collapse:collapse;width:100%;table-layout:fixed;">
            <thead><tr>
            ${th('NO.', '3%')}${th('FECHA', '7%')}${th('No. CONTROL', '8%')}${th('NOMBRE DEL ESTUDIANTE', '15%')}${th('MATERIA', '12%')}${th('GRUPO Y SEM.', '7%')}${th('TELÉFONO', '7%')}${th('CORREO', '11%')}${th('OBSERVACIONES (MOTIVO)', '10%')}${th('DOCENTE QUE REPORTA', '10%')}${th('ACCIONES')}${th('RESULTADOS')}
            </tr></thead><tbody>`
        list.forEach((r, i) => {
            const grupoSem = `${esc(r.grupo)}${r.semestre ? ' · ' + esc(r.semestre) + 'º' : ''}`
            html += `<tr>${td(String(i + 1))}${td(esc(fmtDate(r.fecha)))}${td(esc(r.num_control))}${td(esc(r.nombre))}${td(esc(r.materia))}${td(grupoSem)}${td(esc(r.telefono || ''))}${td(esc(r.correo || ''))}${td(esc(r.motivo || ''))}${td(esc(r.docente || ''))}${td('')}${td('')}</tr>`
        })
        html += `</tbody></table>`
        html += `<div style="font-size:8px;color:#64748b;margin-top:4px;">Documento informativo generado por el sistema · las columnas Acciones y Resultados las registra el tutor(a).</div>`
        html += `</div>`
    }
    html += `</div>`
    return html
}

async function exportPdf() {
    exporting.value = true
    try {
        // El PDF siempre usa el detalle por ausencia (no el resumen).
        let rows = detailRows.value
        if (mode.value === 'summary' || !rows.length) {
            const { data } = await api.get(GA.absenceReport, { params: { from: from.value || null, to: to.value || null } })
            rows = data; detailRows.value = data
        }
        if (!rows.length) { toast.info('No hay ausencias para exportar en el rango seleccionado.'); return }
        // @ts-ignore — html2pdf.js no tiene types oficiales
        const { default: html2pdf } = await import('html2pdf.js')
        const host = document.createElement('div')
        host.style.cssText = 'position:absolute;left:-99999px;top:0;width:1050px;'
        host.innerHTML = buildPdfHtml(rows)
        document.body.appendChild(host)
        try {
            await html2pdf().set({
                margin:      [8, 8, 8, 8],
                filename:    'reporte-ausentes-por-tutor.pdf',
                image:       { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF:       { unit: 'mm', format: 'letter', orientation: 'landscape' },
                pagebreak:   { mode: ['css', 'legacy'] },
            } as any).from(host).save()
        } finally { document.body.removeChild(host) }
    } catch (e: any) { toast.error('No se pudo generar el PDF.') }
    finally { exporting.value = false }
}

onMounted(load)
</script>
