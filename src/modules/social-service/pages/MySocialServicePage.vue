<template>
    <div class="space-y-5">
        <h1 class="text-xl font-semibold text-slate-800 uppercase">Mi Servicio Social</h1>

        <div v-if="loading" class="text-sm text-slate-400">Cargando…</div>

        <div v-else-if="!record" class="rounded-lg border bg-amber-50 border-amber-200 px-4 py-6 text-sm text-amber-800">
            No tienes un servicio social registrado. El Depto. de Gestión Tecnológica te dará de alta cuando corresponda.
        </div>

        <template v-else>
            <!-- Encabezado -->
            <div class="rounded-xl border bg-white p-5 grid sm:grid-cols-3 gap-4">
                <div>
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Estado</p>
                    <span class="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold" :class="statusClass(record.status)">
                        {{ STATUS_LABELS[record.status] }}
                    </span>
                </div>
                <div>
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Dependencia</p>
                    <p class="text-sm text-slate-700">{{ record.company_name ?? '—' }}</p>
                </div>
                <div>
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Avance de horas</p>
                    <p class="text-sm font-bold text-blue-600">{{ record.accumulated_hours }} / {{ record.required_hours }} h ({{ record.progress_percent }}%)</p>
                    <div class="mt-1 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div class="h-full bg-blue-500 transition-all" :style="{ width: `${record.progress_percent}%` }"></div>
                    </div>
                </div>
            </div>

            <p v-if="msg" class="text-sm px-4 py-2.5 rounded-lg" :class="msgError ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'">{{ msg }}</p>

            <div v-if="isPending" class="rounded-xl border bg-slate-50 border-slate-200 px-4 py-3 text-sm text-slate-600">
                Tu servicio social aún no ha sido <strong>activado</strong> por el coordinador. En cuanto lo active podrás capturar tu dependencia y programa.
            </div>
            <div v-else-if="!record.processOpen" class="rounded-xl border bg-slate-50 border-slate-200 px-4 py-3 text-sm text-slate-600 flex items-start gap-2">
                <span class="text-slate-400">🔒</span>
                <p>El periodo ya no está activo; tu información es de <strong>solo lectura</strong>. Solicita una excepción a tu coordinador.</p>
            </div>

            <!-- Captura de proceso -->
            <div v-if="canEdit" class="rounded-xl border bg-white p-5 space-y-4">
                <h2 class="text-sm font-bold text-slate-700 uppercase">Datos del servicio</h2>
                <div class="grid sm:grid-cols-2 gap-4">
                    <label class="block">
                        <span class="text-xs font-semibold text-slate-500">Dependencia receptora</span>
                        <select v-model="form.company_id" class="mt-1 w-full rounded-lg border-slate-300 text-sm">
                            <option :value="null">— Selecciona —</option>
                            <option v-for="d in dependencies" :key="d.id" :value="d.id">{{ d.name }}</option>
                        </select>
                    </label>
                    <label class="block">
                        <span class="text-xs font-semibold text-slate-500">Programa (del banco)</span>
                        <select v-model="form.program_id" class="mt-1 w-full rounded-lg border-slate-300 text-sm">
                            <option :value="null">— Ninguno / capturar título —</option>
                            <option v-for="p in programs" :key="p.id" :value="p.id">{{ p.title }}</option>
                        </select>
                    </label>
                    <label class="block sm:col-span-2">
                        <span class="text-xs font-semibold text-slate-500">Título del programa (si no está en el banco)</span>
                        <input v-model="form.program_title" type="text" class="mt-1 w-full rounded-lg border-slate-300 text-sm" maxlength="255" />
                    </label>
                    <label class="block">
                        <span class="text-xs font-semibold text-slate-500">Fecha de inicio</span>
                        <input v-model="form.started_at" type="date" class="mt-1 w-full rounded-lg border-slate-300 text-sm" />
                    </label>
                    <label class="block">
                        <span class="text-xs font-semibold text-slate-500">Fecha estimada de término</span>
                        <input v-model="form.expected_end_at" type="date" class="mt-1 w-full rounded-lg border-slate-300 text-sm" />
                    </label>
                </div>
                <div class="flex justify-end">
                    <button @click="save" :disabled="saving" class="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold disabled:opacity-50">Guardar</button>
                </div>
            </div>

            <!-- Reportes de avance -->
            <div class="rounded-xl border bg-white p-5 space-y-4">
                <div class="flex items-center justify-between">
                    <h2 class="text-sm font-bold text-slate-700 uppercase">Reportes de avance</h2>
                    <span class="text-xs text-slate-400" v-if="record.normativa">{{ record.normativa.report_count }} reportes previstos</span>
                </div>

                <table class="w-full text-sm">
                    <thead>
                        <tr class="text-left text-[10px] uppercase text-slate-400 border-b">
                            <th class="py-2">#</th><th>Periodo</th><th>Horas</th><th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="r in reports" :key="r.id" class="border-b last:border-0">
                            <td class="py-2 font-semibold">{{ r.report_number }}</td>
                            <td class="text-slate-500">{{ r.period_start ?? '—' }} → {{ r.period_end ?? '—' }}</td>
                            <td>{{ r.hours }} h</td>
                            <td>
                                <span class="px-2 py-0.5 rounded-full text-xs font-bold" :class="reportClass(r.status)">{{ reportLabel(r.status) }}</span>
                                <span v-if="r.status === 'rejected' && r.rejection_reason" class="ml-2 text-xs text-red-500">{{ r.rejection_reason }}</span>
                            </td>
                        </tr>
                        <tr v-if="!reports.length"><td colspan="4" class="py-3 text-center text-slate-400">Sin reportes.</td></tr>
                    </tbody>
                </table>

                <!-- Nuevo reporte -->
                <div v-if="canEdit" class="border-t pt-4 grid sm:grid-cols-5 gap-3 items-end">
                    <label class="block">
                        <span class="text-xs font-semibold text-slate-500">Reporte #</span>
                        <input v-model.number="reportForm.report_number" type="number" min="1" class="mt-1 w-full rounded-lg border-slate-300 text-sm" />
                    </label>
                    <label class="block">
                        <span class="text-xs font-semibold text-slate-500">Del</span>
                        <input v-model="reportForm.period_start" type="date" class="mt-1 w-full rounded-lg border-slate-300 text-sm" />
                    </label>
                    <label class="block">
                        <span class="text-xs font-semibold text-slate-500">Al</span>
                        <input v-model="reportForm.period_end" type="date" class="mt-1 w-full rounded-lg border-slate-300 text-sm" />
                    </label>
                    <label class="block">
                        <span class="text-xs font-semibold text-slate-500">Horas</span>
                        <input v-model.number="reportForm.hours" type="number" min="1" class="mt-1 w-full rounded-lg border-slate-300 text-sm" />
                    </label>
                    <button @click="submitReport" :disabled="saving" class="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50">Enviar</button>
                    <label class="block sm:col-span-5">
                        <span class="text-xs font-semibold text-slate-500">Actividades</span>
                        <textarea v-model="reportForm.activities" rows="2" class="mt-1 w-full rounded-lg border-slate-300 text-sm"></textarea>
                    </label>
                </div>
            </div>

            <!-- Documentos -->
            <div class="rounded-xl border bg-white p-5 space-y-3">
                <h2 class="text-sm font-bold text-slate-700 uppercase">Documentos</h2>
                <div v-for="d in documents" :key="d.code" class="flex items-center justify-between border-b last:border-0 py-2">
                    <div>
                        <p class="text-sm font-semibold text-slate-700">{{ d.name }}
                            <span v-if="d.kind === 'generated'" class="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-violet-100 text-violet-700">lo genera el sistema</span>
                        </p>
                        <p v-if="d.document" class="text-xs">
                            <span class="px-2 py-0.5 rounded-full font-bold" :class="reportClass(d.document.status)">{{ reportLabel(d.document.status) }}</span>
                            <span v-if="d.document.rejection_reason" class="ml-2 text-red-500">{{ d.document.rejection_reason }}</span>
                        </p>
                        <p v-else class="text-xs text-slate-400">Sin subir</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <button v-if="d.document" @click="viewDoc(d.document.id)" class="text-xs text-blue-600 font-semibold">Ver</button>
                        <label v-if="canEdit && d.kind === 'upload'" class="text-xs text-slate-600 font-semibold cursor-pointer">
                            {{ d.document ? 'Reemplazar' : 'Subir' }}
                            <input type="file" class="hidden" @change="uploadDoc($event, d.code)" />
                        </label>
                    </div>
                </div>
                <p v-if="!documents.length" class="text-sm text-slate-400">No hay documentos requeridos configurados.</p>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { STATUS_LABELS, type SocialServiceRecord, type SocialServiceReport, type SocialServiceProgram, type DependencyOption, type DocumentChecklistItem } from '@/modules/social-service/types/social-service.type'

const S = API.SOCIAL_SERVICE_API

const loading = ref(true)
const saving = ref(false)
const record = ref<SocialServiceRecord | null>(null)
const reports = ref<SocialServiceReport[]>([])
const documents = ref<DocumentChecklistItem[]>([])
const dependencies = ref<DependencyOption[]>([])
const programs = ref<SocialServiceProgram[]>([])
const msg = ref('')
const msgError = ref(false)

const form = ref({ company_id: null as number | null, program_id: null as number | null, program_title: '', started_at: '', expected_end_at: '' })
const reportForm = ref({ report_number: 1, period_start: '', period_end: '', hours: null as number | null, activities: '' })

const isPending = computed(() => record.value?.status === 'pending_activation')
const canEdit = computed(() => !!record.value && !isPending.value && record.value.processOpen && record.value.status !== 'concluded' && record.value.status !== 'dropped')

function statusClass(s: string) {
    return { pending_activation: 'bg-amber-100 text-amber-700', registered: 'bg-sky-100 text-sky-700', in_progress: 'bg-blue-100 text-blue-700', pending_release: 'bg-indigo-100 text-indigo-700', concluded: 'bg-emerald-100 text-emerald-700', dropped: 'bg-slate-200 text-slate-500' }[s] ?? 'bg-slate-100'
}
function reportClass(s: string) {
    return { pending: 'bg-amber-100 text-amber-700', approved: 'bg-emerald-100 text-emerald-700', rejected: 'bg-red-100 text-red-700' }[s] ?? 'bg-slate-100'
}
function reportLabel(s: string) {
    return { pending: 'Por revisar', approved: 'Aprobado', rejected: 'Rechazado' }[s] ?? s
}
function flash(text: string, error = false) { msg.value = text; msgError.value = error; setTimeout(() => (msg.value = ''), 4000) }

async function load() {
    loading.value = true
    try {
        const { data } = await api.get(S.me.get)
        record.value = data && data.id ? data : null
        if (record.value) {
            form.value = {
                company_id: record.value.company_id,
                program_id: record.value.program_id,
                program_title: record.value.program_title ?? '',
                started_at: record.value.started_at ?? '',
                expected_end_at: record.value.expected_end_at ?? '',
            }
            reportForm.value.report_number = reports.value.length + 1
            const [rep, dep, prog, docs] = await Promise.all([
                api.get(S.me.reports),
                api.get(S.dependencies),
                api.get(S.availablePrograms),
                api.get(S.me.documents),
            ])
            reports.value = rep.data ?? []
            dependencies.value = dep.data ?? []
            programs.value = prog.data ?? []
            documents.value = docs.data ?? []
            reportForm.value.report_number = reports.value.length + 1
        }
    } finally {
        loading.value = false
    }
}

async function save() {
    saving.value = true
    try {
        await api.put(S.me.update, {
            company_id: form.value.company_id,
            program_id: form.value.program_id,
            program_title: form.value.program_title || null,
            started_at: form.value.started_at || null,
            expected_end_at: form.value.expected_end_at || null,
        })
        await load()
        flash('Datos guardados.')
    } catch (e: any) {
        flash(e?.response?.data?.message ?? 'No se pudo guardar.', true)
    } finally {
        saving.value = false
    }
}

async function submitReport() {
    if (!reportForm.value.hours) { flash('Indica las horas del reporte.', true); return }
    saving.value = true
    try {
        await api.post(S.me.submitReport, {
            report_number: reportForm.value.report_number,
            period_start: reportForm.value.period_start || null,
            period_end: reportForm.value.period_end || null,
            hours: reportForm.value.hours,
            activities: reportForm.value.activities || null,
        })
        reportForm.value = { report_number: 1, period_start: '', period_end: '', hours: null, activities: '' }
        await load()
        flash('Reporte enviado.')
    } catch (e: any) {
        flash(e?.response?.data?.message ?? 'No se pudo enviar el reporte.', true)
    } finally {
        saving.value = false
    }
}

async function uploadDoc(e: Event, code: string) {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    saving.value = true
    try {
        const fd = new FormData()
        fd.append('code', code)
        fd.append('file', file)
        await api.post(S.me.uploadDocument, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        await load()
        flash('Documento subido.')
    } catch (e: any) {
        flash(e?.response?.data?.message ?? 'No se pudo subir el documento.', true)
    } finally {
        saving.value = false
        input.value = ''
    }
}

async function viewDoc(id: number) {
    const { data } = await api.get(S.me.downloadDocument(id), { responseType: 'blob' })
    window.open(URL.createObjectURL(data), '_blank')
}

onMounted(load)
</script>
