<template>
    <div class="space-y-5">
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-xl font-semibold text-slate-800 uppercase">Seguimientos del PAT</h1>
                <p class="text-xs text-slate-400" v-if="data">{{ data.assignment.tutor_name }} · {{ data.assignment.scope === 'grupal' ? 'Grupal' : 'Individual' }} · {{ data.assignment.period_name }}</p>
            </div>
            <router-link :to="`/tutoring/assignments/${id}`" class="text-xs text-slate-500 hover:text-slate-700">← Volver a la asignación</router-link>
        </div>

        <!-- Línea de hitos -->
        <div class="rounded-xl border bg-white overflow-hidden">
            <table class="w-full text-sm">
                <thead><tr class="text-left text-[10px] uppercase text-slate-400 bg-slate-50 border-b">
                    <th class="px-4 py-2">Hito</th><th>Estado</th><th>Entregado</th><th>Revisado</th><th></th>
                </tr></thead>
                <tbody>
                    <tr v-for="s in (data?.stages ?? [])" :key="s.stage" class="border-b last:border-0 hover:bg-slate-50">
                        <td class="px-4 py-2 font-semibold text-slate-700">
                            {{ s.label }}
                            <span v-if="s.overdue" class="ml-1 text-[10px] text-rose-500 font-bold">· vencido</span>
                        </td>
                        <td><FStatus :status="s.status" /></td>
                        <td class="text-slate-500 text-xs">{{ fmt(s.submitted_at) }}</td>
                        <td class="text-slate-500 text-xs">{{ fmt(s.reviewed_at) }}</td>
                        <td class="pr-3 text-right">
                            <button @click="openSubmit(s)" class="px-3 py-1 rounded-lg border text-xs font-semibold text-slate-600 hover:bg-slate-100">
                                {{ s.status === 'pending' ? 'Entregar' : 'Actualizar' }}
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Modal entregar hito -->
        <div v-if="submit.open" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" @click.self="submit.open = false">
            <div class="bg-white rounded-xl p-5 w-full max-w-lg space-y-3">
                <div class="flex items-center justify-between">
                    <h3 class="text-sm font-bold text-slate-700 uppercase">{{ submit.label }}</h3>
                    <button @click="submit.open = false" class="text-slate-400 hover:text-slate-600">✕</button>
                </div>
                <label class="block text-xs font-semibold text-slate-500 mb-1">Contenido / observaciones</label>
                <textarea v-model="submit.notes" rows="5" class="w-full rounded-lg border-slate-300 text-sm" placeholder="Describe el avance / resultados de este hito…"></textarea>
                <div class="flex justify-end">
                    <button @click="doSubmit" :disabled="busy || !submit.notes.trim()" class="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50">Entregar</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, h, defineComponent } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'

const props = defineProps<{ id: string | number }>()
const T = API.TUTORING_API
const toast = useToast()

const FStatus = defineComponent({
    props: { status: String },
    setup: (p) => {
        const map: Record<string, [string, string]> = {
            pending: ['bg-amber-100 text-amber-700', 'Pendiente'],
            submitted: ['bg-blue-100 text-blue-700', 'Entregado'],
            reviewed: ['bg-emerald-100 text-emerald-700', 'Revisado'],
        }
        return () => h('span', { class: ['px-2 py-0.5 rounded-full text-[11px] font-bold', (map[p.status ?? ''] ?? map.pending)[0]] }, (map[p.status ?? ''] ?? map.pending)[1])
    },
})

const data = ref<any>(null)
const busy = ref(false)
const submit = reactive<{ open: boolean; stage: string; label: string; notes: string }>({ open: false, stage: '', label: '', notes: '' })

function fmt(d: string | null) { return d ? new Date(d).toLocaleDateString() : '—' }

async function load() {
    const { data: res } = await api.get(T.followups.forAssignment(props.id))
    data.value = res
}

function openSubmit(s: any) {
    submit.stage = s.stage
    submit.label = s.label
    submit.notes = (s.payload && s.payload.notes) ? s.payload.notes : ''
    submit.open = true
}
async function doSubmit() {
    busy.value = true
    try {
        await api.post(T.followups.submit(props.id), { stage: submit.stage, payload: { notes: submit.notes.trim() } })
        submit.open = false
        toast.success('Hito entregado.')
        await load()
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'Operación no permitida.') }
    finally { busy.value = false }
}

onMounted(load)
</script>
