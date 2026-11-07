<template>
    <div class="p-4 md:p-6 max-w-7xl mx-auto">
        <div class="flex items-center justify-between gap-3 mb-1">
            <h1 class="text-xl font-semibold text-slate-800">Diagnóstico por grupo</h1>
            <div class="flex items-center gap-2">
                <button @click="$router.back()" class="px-3 py-2 rounded-lg border border-slate-300 text-slate-600 text-sm hover:bg-slate-50">← Volver</button>
                <button @click="exportPdf" :disabled="exporting || !rows.length"
                    class="px-4 py-2 rounded-lg bg-rose-600 text-white text-sm font-medium disabled:opacity-50 flex items-center gap-1.5">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6M9 17h3"/></svg>
                    {{ exporting ? 'Generando…' : 'PDF' }}
                </button>
            </div>
        </div>
        <p class="text-sm text-slate-500 mb-4">
            <span v-if="head.tutor"><b>Tutor(a):</b> {{ head.tutor }} · </span>
            <span v-if="head.programa"><b>Programa:</b> {{ head.programa }} · </span>
            <span v-if="head.grupo"><b>Grupo:</b> {{ head.grupo }} · </span>
            <span>{{ head.con_puntaje }}/{{ head.total_tutorados }} con diagnóstico capturado</span>
        </p>

        <div v-if="loading" class="text-sm text-slate-500">Cargando…</div>
        <div v-else-if="!rows.length" class="text-sm text-slate-500">
            Este grupo no tiene tutorados con cédula/diagnóstico capturado.
        </div>

        <template v-else>
            <!-- Tabla consolidada -->
            <div class="overflow-x-auto rounded-xl border border-slate-200 mb-6">
                <table class="min-w-full text-xs">
                    <thead class="bg-slate-50 text-slate-600">
                        <tr>
                            <th class="px-2 py-2 text-left">No. Control</th>
                            <th class="px-2 py-2 text-left">Estudiante</th>
                            <th class="px-2 py-2 text-center">Sexo</th>
                            <th class="px-2 py-2 text-center">Edad</th>
                            <th class="px-2 py-2 text-center">Prom. bach.</th>
                            <th class="px-2 py-2 text-center">Organización</th>
                            <th class="px-2 py-2 text-center">Técnicas</th>
                            <th class="px-2 py-2 text-center">Motivación</th>
                            <th class="px-2 py-2 text-center">Habilidades (total)</th>
                            <th class="px-2 py-2 text-center">Asertividad</th>
                            <th class="px-2 py-2 text-center">Autoestima</th>
                            <th class="px-2 py-2 text-center">Estilo</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        <tr v-for="r in rows" :key="r.num_control" class="hover:bg-slate-50/60">
                            <td class="px-2 py-1.5 font-mono">{{ r.num_control }}</td>
                            <td class="px-2 py-1.5">{{ r.nombre }}</td>
                            <td class="px-2 py-1.5 text-center">{{ r.sexo || '—' }}</td>
                            <td class="px-2 py-1.5 text-center">{{ r.edad ?? '—' }}</td>
                            <td class="px-2 py-1.5 text-center">{{ r.promedio_bach ?? '—' }}</td>
                            <td class="px-2 py-1.5 text-center"><ScoreCell :score="r.hab_org" :cat="r.hab_org_cat" /></td>
                            <td class="px-2 py-1.5 text-center"><ScoreCell :score="r.hab_tec" :cat="r.hab_tec_cat" /></td>
                            <td class="px-2 py-1.5 text-center"><ScoreCell :score="r.hab_mot" :cat="r.hab_mot_cat" /></td>
                            <td class="px-2 py-1.5 text-center"><ScoreCell :score="r.hab_total" :cat="r.hab_total_cat" strong /></td>
                            <td class="px-2 py-1.5 text-center">{{ r.asertividad || '—' }}</td>
                            <td class="px-2 py-1.5 text-center">{{ r.autoestima || '—' }}</td>
                            <td class="px-2 py-1.5 text-center">{{ r.estilo || '—' }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Porcentajes por categoría (total de Habilidades) -->
            <h2 class="text-sm font-semibold text-slate-700 mb-2">Distribución por nivel de Habilidades de Estudio</h2>
            <div class="rounded-xl border border-slate-200 divide-y divide-slate-100 max-w-xl">
                <div v-for="p in percentages" :key="p.categoria" class="flex items-center gap-3 px-3 py-2">
                    <span class="w-52 text-xs" :class="catClass(p.categoria)">{{ p.categoria }}</span>
                    <div class="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                        <div class="h-full rounded-full bg-indigo-500" :style="{ width: p.pct + '%' }"></div>
                    </div>
                    <span class="w-20 text-right text-xs text-slate-600">{{ p.n }} ({{ p.pct }}%)</span>
                </div>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, h, defineComponent } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'

const props = defineProps<{ id: string | number }>()
const toast = useToast()
const T = API.TUTORING_API

interface Row {
    num_control: string; nombre: string; sexo?: string | null; edad?: number | null; promedio_bach?: number | null
    hab_org?: number | null; hab_org_cat?: string | null; hab_tec?: number | null; hab_tec_cat?: string | null
    hab_mot?: number | null; hab_mot_cat?: string | null; hab_total?: number | null; hab_total_cat?: string | null
    asertividad?: string | null; autoestima?: string | null; estilo?: string | null
}
interface Pct { categoria: string; n: number; pct: number }

const loading = ref(false)
const exporting = ref(false)
const rows = ref<Row[]>([])
const percentages = ref<Pct[]>([])
const head = reactive<{ tutor: string; programa: string; grupo: string; total_tutorados: number; con_puntaje: number }>(
    { tutor: '', programa: '', grupo: '', total_tutorados: 0, con_puntaje: 0 })

// Color por nivel: bajos en rojo, medios en ámbar/slate, altos en verde.
function catClass(cat?: string | null): string {
    if (!cat) return 'text-slate-400'
    if (['MUY BAJO', 'BAJO', 'POR DEBAJO DEL PROMEDIO'].includes(cat)) return 'text-rose-600'
    if (['PROMEDIO BAJO', 'PROMEDIO'].includes(cat)) return 'text-amber-600'
    return 'text-emerald-600'
}

// Celda puntaje + categoría (inline, reutilizable en tabla).
const ScoreCell = defineComponent({
    props: { score: { type: [Number, null] as any, default: null }, cat: { type: [String, null] as any, default: null }, strong: Boolean },
    setup(p) {
        return () => p.cat == null && p.score == null
            ? h('span', { class: 'text-slate-300' }, '—')
            : h('span', { class: ['inline-flex flex-col leading-tight', p.strong ? 'font-semibold' : ''] }, [
                h('span', p.score == null ? '' : String(p.score)),
                h('span', { class: ['text-[10px]', catClass(p.cat)] }, p.cat ?? ''),
            ])
    },
})

async function load() {
    loading.value = true
    try {
        const { data } = await api.get(T.assignments.diagnostico(props.id))
        rows.value = data.rows ?? []
        percentages.value = data.percentages ?? []
        head.tutor = data.tutor ?? ''
        head.programa = data.programa ?? ''
        head.grupo = data.grupo ?? ''
        head.total_tutorados = data.total_tutorados ?? 0
        head.con_puntaje = data.con_puntaje ?? 0
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudo cargar el diagnóstico.') }
    finally { loading.value = false }
}

function esc(s: unknown): string {
    return String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!))
}

function buildPdfHtml(): string {
    const th = (t: string) => `<th style="border:1px solid #475569;padding:3px 4px;background:#e2e8f0;font-size:9px;">${t}</th>`
    const td = (t: string, c?: string) => `<td style="border:1px solid #94a3b8;padding:3px 4px;font-size:9px;text-align:center;${c ? `color:${c};` : ''}">${t}</td>`
    const colorOf = (cat?: string | null): string => {
        if (!cat) return '#94a3b8'
        if (['MUY BAJO', 'BAJO', 'POR DEBAJO DEL PROMEDIO'].includes(cat)) return '#e11d48'
        if (['PROMEDIO BAJO', 'PROMEDIO'].includes(cat)) return '#d97706'
        return '#059669'
    }
    const cell = (score: number | null | undefined, cat?: string | null) =>
        td(`${score ?? ''}${cat ? `<br><span style="font-size:7px">${esc(cat)}</span>` : (score == null ? '—' : '')}`, colorOf(cat))

    let html = `<div style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
        <div style="text-align:center;font-size:12px;font-weight:bold;">DIAGNÓSTICO DE TUTORÍAS — POR GRUPO</div>
        <div style="font-size:10px;margin:4px 0 8px;"><b>Tutor(a):</b> ${esc(head.tutor)} &nbsp;·&nbsp; <b>Programa:</b> ${esc(head.programa) || '—'} &nbsp;·&nbsp; <b>Grupo:</b> ${esc(head.grupo) || '—'}</div>
        <table style="border-collapse:collapse;width:100%;">
        <thead><tr>${th('No. CONTROL')}${th('ESTUDIANTE')}${th('SEXO')}${th('EDAD')}${th('PROM. BACH.')}${th('ORGANIZACIÓN')}${th('TÉCNICAS')}${th('MOTIVACIÓN')}${th('HABILIDADES')}${th('ASERTIVIDAD')}${th('AUTOESTIMA')}${th('ESTILO')}</tr></thead><tbody>`
    for (const r of rows.value) {
        html += `<tr>${td(esc(r.num_control))}<td style="border:1px solid #94a3b8;padding:3px 4px;font-size:9px;">${esc(r.nombre)}</td>${td(esc(r.sexo || '—'))}${td(r.edad != null ? esc(r.edad) : '—')}${td(r.promedio_bach != null ? esc(r.promedio_bach) : '—')}${cell(r.hab_org, r.hab_org_cat)}${cell(r.hab_tec, r.hab_tec_cat)}${cell(r.hab_mot, r.hab_mot_cat)}${cell(r.hab_total, r.hab_total_cat)}${td(esc(r.asertividad || '—'))}${td(esc(r.autoestima || '—'))}${td(esc(r.estilo || '—'))}</tr>`
    }
    html += `</tbody></table>`
    html += `<div style="font-size:10px;font-weight:bold;margin:10px 0 4px;">Distribución por nivel de Habilidades de Estudio</div><table style="border-collapse:collapse;">`
    for (const p of percentages.value) {
        html += `<tr>${td(esc(p.categoria), colorOf(p.categoria))}${td(String(p.n))}${td(p.pct + '%')}</tr>`
    }
    html += `</table><div style="font-size:8px;color:#64748b;margin-top:6px;">Documento informativo generado por el sistema.</div></div>`
    return html
}

async function exportPdf() {
    if (!rows.value.length) return
    exporting.value = true
    try {
        // @ts-ignore — html2pdf.js no tiene types oficiales
        const { default: html2pdf } = await import('html2pdf.js')
        const host = document.createElement('div')
        host.style.cssText = 'position:absolute;left:-99999px;top:0;width:1050px;'
        host.innerHTML = buildPdfHtml()
        document.body.appendChild(host)
        try {
            await html2pdf().set({
                margin:      [8, 8, 8, 8],
                filename:    `diagnostico-${head.grupo || 'grupo'}.pdf`,
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
