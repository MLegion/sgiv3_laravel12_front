<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between flex-wrap gap-2">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Constancias MOOC por validar</h1>
            <select v-model="status" @change="load" aria-label="Filtrar por estado" class="rounded-lg border-slate-300 text-sm">
                <option value="submitted">Pendientes</option>
                <option value="validated">Validadas</option>
                <option value="rejected">Rechazadas</option>
            </select>
        </div>

        <section class="rounded-xl border bg-white p-4">
            <DataTable :columns="moocColumns" :rows="rows" hide-search caption="Constancias MOOC por validar" empty-text="Sin constancias en este estado.">
                <template #cell-student="{ row: c }"><span class="text-slate-700">{{ c.student_name }}<span class="block text-[10px] text-slate-400">{{ c.num_control }}</span></span></template>
                <template #cell-course="{ row: c }"><span class="text-slate-600">{{ c.course_name }}<span v-if="c.folio" class="block text-[10px] text-slate-400">Folio: {{ c.folio }}</span></span></template>
                <template #cell-platform="{ row: c }"><span class="text-slate-500">{{ c.platform_name }}</span></template>
                <template #cell-hours="{ row: c }"><span class="text-slate-500">{{ c.hours ?? '—' }}</span></template>
                <template #cell-certificate="{ row: c }"><a v-if="c.certificate_path" :href="certUrl(c.certificate_path)" target="_blank" class="text-emerald-600 hover:underline">ver</a><span v-else class="text-slate-300">—</span></template>
                <template #cell-actions="{ row: c }">
                    <template v-if="status === 'submitted'">
                        <button @click="openValidate(c)" class="text-xs text-emerald-600 hover:underline">validar</button>
                        <button @click="reject(c)" class="ml-3 text-xs text-slate-400 hover:text-rose-500">rechazar</button>
                    </template>
                    <span v-else-if="status === 'validated'" class="text-[11px] text-emerald-600">{{ c.credits }} créditos</span>
                </template>
            </DataTable>
        </section>

        <BaseModal v-if="validating" v-model="validatingOpen" title="Validar constancia" size="md">
            <div class="space-y-3">
                <p class="text-sm text-slate-600">{{ validating.student_name }} · {{ validating.course_name }}</p>
                <div>
                    <label for="mooc-validate-credits" class="block text-xs font-semibold text-slate-500 mb-1">Créditos a otorgar</label>
                    <input id="mooc-validate-credits" v-model="credits" type="number" min="1" max="50" class="w-full rounded-lg border-slate-300 text-sm" />
                </div>
                <div>
                    <label for="mooc-validate-note" class="block text-xs font-semibold text-slate-500 mb-1">Nota (opcional)</label>
                    <input id="mooc-validate-note" v-model="note" class="w-full rounded-lg border-slate-300 text-sm" />
                </div>
            </div>
            <template #footer>
                <button @click="validating = null" class="px-4 py-2 rounded-lg border text-sm text-slate-500">Cancelar</button>
                <button @click="doValidate" :disabled="busy || !credits" class="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50">Validar</button>
            </template>
        </BaseModal>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'
import { usePrompt } from '@/app/composables/usePrompt'
import BaseModal from '@/app/components/ui/modal/BaseModal.vue'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'

const AC = API.AC_API
const toast = useToast()
const { prompt } = usePrompt()
const rows = ref<any[]>([])
const moocColumns: DataTableColumn<any>[] = [
    { key: 'student', label: 'Alumno' },
    { key: 'course', label: 'Curso' },
    { key: 'platform', label: 'Plataforma' },
    { key: 'hours', label: 'Horas' },
    { key: 'certificate', label: 'Constancia' },
    { key: 'actions', label: '', align: 'right' },
]
const status = ref('submitted')
const busy = ref(false)
const validating = ref<any>(null)
const validatingOpen = computed({ get: () => validating.value !== null, set: (v: boolean) => { if (!v) validating.value = null } })
const credits = ref<number | null>(null)
const note = ref('')

function certUrl(path: string) {
    return path.startsWith('http') ? path : `/storage/${path}`
}

async function load() {
    const { data } = await api.get(AC.moocInbox, { params: { status: status.value } })
    rows.value = data ?? []
}
function openValidate(c: any) { validating.value = c; credits.value = null; note.value = '' }
async function doValidate() {
    busy.value = true
    try {
        await api.post(AC.moocValidate(validating.value.id), { credits: Number(credits.value), note: note.value || null })
        toast.success('Constancia validada.')
        validating.value = null
        await load()
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudo validar.') }
    finally { busy.value = false }
}
async function reject(c: any) {
    const n = await prompt({ title: 'Rechazar constancia', label: 'Motivo del rechazo (opcional)', inputType: 'textarea' })
    if (n === null) return
    try {
        await api.post(AC.moocReject(c.id), { note: n || null })
        toast.success('Constancia rechazada.')
        await load()
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudo rechazar.') }
}

onMounted(load)
</script>
