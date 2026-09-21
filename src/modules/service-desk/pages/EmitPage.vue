<template>
    <div class="space-y-5 max-w-3xl">
        <h1 class="text-xl font-semibold text-slate-800 uppercase">Emitir constancia</h1>

        <!-- Buscar alumno -->
        <div class="rounded-xl border bg-white p-4 space-y-3">
            <label class="block"><span class="text-xs font-semibold text-slate-500">Buscar alumno (nombre o núm. control)</span>
                <input v-model="q" @input="search" placeholder="Escribe para buscar…" class="mt-1 w-full rounded-lg border-slate-300 text-sm" />
            </label>
            <div v-if="results.length && !summary" class="border rounded-lg max-h-48 overflow-auto text-sm">
                <div v-for="s in results" :key="s.id" @click="pick(s)" class="px-3 py-2 hover:bg-slate-50 cursor-pointer">
                    <span class="font-semibold text-slate-700">{{ s.full_name ?? (s.names + ' ' + (s.first_surname ?? '')) }}</span>
                    <span class="text-xs text-slate-400"> · {{ s.num_control }}</span>
                </div>
            </div>
        </div>

        <!-- Resumen del alumno + emisión -->
        <div v-if="summary" class="rounded-xl border bg-white p-5 space-y-4">
            <div class="flex justify-between items-start">
                <div>
                    <div class="font-semibold text-slate-800">{{ summary.full_name }}</div>
                    <div class="text-xs text-slate-400">{{ summary.num_control }} · {{ summary.career_name ?? '—' }}</div>
                </div>
                <button @click="clear" class="text-xs text-slate-500">cambiar alumno</button>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div><div class="text-[10px] uppercase text-slate-400">Estatus</div>{{ summary.status_name ?? '—' }}</div>
                <div><div class="text-[10px] uppercase text-slate-400">Semestre</div>{{ summary.semester ?? '—' }}</div>
                <div><div class="text-[10px] uppercase text-slate-400">Promedio</div>{{ summary.promedio ?? 'N/D' }}</div>
                <div><div class="text-[10px] uppercase text-slate-400">Créditos</div>{{ summary.creditos }}</div>
            </div>

            <div class="border-t pt-3">
                <span class="text-xs font-semibold text-slate-500">Documento a emitir</span>
                <div class="grid sm:grid-cols-2 gap-2 mt-2">
                    <label v-for="d in documents" :key="d.code" class="flex items-start gap-2 rounded-lg border p-2 cursor-pointer" :class="docCode === d.code ? 'border-blue-500 bg-blue-50' : 'border-slate-200'">
                        <input type="radio" :value="d.code" v-model="docCode" class="mt-1" />
                        <span><span class="text-sm font-semibold text-slate-700">{{ d.name }}</span><br><span class="text-xs text-slate-400">{{ d.description }}</span></span>
                    </label>
                </div>
            </div>

            <div v-if="selectedDoc?.is_controlled" class="border-t pt-3">
                <span class="text-xs font-semibold text-slate-500">Datos de control del certificado (opcional)</span>
                <div class="grid grid-cols-3 gap-2 mt-2">
                    <input v-model="control.number" placeholder="No. de certificado" class="rounded-lg border-slate-300 text-sm" />
                    <input v-model="control.book" placeholder="Libro" class="rounded-lg border-slate-300 text-sm" />
                    <input v-model="control.sheet" placeholder="Foja" class="rounded-lg border-slate-300 text-sm" />
                </div>
            </div>

            <p v-if="msg" class="text-sm" :class="msgError ? 'text-red-600' : 'text-emerald-600'">{{ msg }}</p>
            <div class="flex justify-end">
                <button @click="emit" :disabled="!docCode || busy" class="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold disabled:opacity-50">Emitir</button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { DeskDocument, StudentSummary } from '@/modules/service-desk/types/service-desk.type'
import { openDocument } from '@/modules/service-desk/pages/openDocument'

const D = API.SERVICE_DESK_API
const SS = API.SCHOOL_SERVICES_API

const q = ref(''), results = ref<any[]>([])
const summary = ref<StudentSummary | null>(null)
const documents = ref<DeskDocument[]>([])
const docCode = ref('')
const control = reactive({ number: '', book: '', sheet: '' })
const busy = ref(false), msg = ref(''), msgError = ref(false)
let timer: any = null

const selectedDoc = computed(() => documents.value.find(d => d.code === docCode.value) || null)

function search() {
    clearTimeout(timer)
    if (q.value.trim().length < 2) { results.value = []; return }
    timer = setTimeout(async () => {
        const { data } = await api.get(SS.students.list, { params: { 'search[num_control]': q.value, per_page: 8 } })
        results.value = data.data ?? data ?? []
    }, 300)
}
async function pick(s: any) {
    results.value = []; msg.value = ''
    summary.value = (await api.get(D.studentSummary(s.id))).data
}
function clear() { summary.value = null; docCode.value = ''; q.value = ''; msg.value = ''; Object.assign(control, { number: '', book: '', sheet: '' }) }

async function emit() {
    if (!summary.value) return
    busy.value = true; msg.value = ''; msgError.value = false
    try {
        const { data } = await api.post(D.emit, {
            student_id: summary.value.student_id, document_code: docCode.value,
            control_number: control.number || null, control_book: control.book || null, control_sheet: control.sheet || null,
        })
        msg.value = `Emitido con folio ${data.folio ?? 's/f'}. Abriendo documento…`
        await openDocument(data.id)
    } catch (e: any) { msg.value = e?.response?.data?.message ?? 'No se pudo emitir.'; msgError.value = true }
    finally { busy.value = false }
}

onMounted(async () => { documents.value = (await api.get(D.documents)).data ?? [] })
</script>
