<template>
    <div class="space-y-5">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Seguimientos por revisar</h1>
            <p class="text-xs text-slate-400">Hitos del PAT entregados por los tutores (Cap. 15).</p>
        </div>

        <div class="rounded-xl border bg-white overflow-hidden">
            <table class="w-full text-sm">
                <thead><tr class="text-left text-[10px] uppercase text-slate-400 bg-slate-50 border-b">
                    <th class="px-4 py-2">Tutor</th><th>Ámbito</th><th>Carrera</th><th>Hito</th><th>Entregado</th><th></th>
                </tr></thead>
                <tbody>
                    <tr v-for="r in rows" :key="r.id" class="border-b last:border-0 hover:bg-slate-50">
                        <td class="px-4 py-2 font-semibold text-slate-700">{{ r.tutor_name }}</td>
                        <td class="text-slate-600">{{ r.scope === 'grupal' ? 'Grupal' : 'Individual' }}</td>
                        <td class="text-slate-600">{{ r.career_name ?? '—' }}</td>
                        <td class="text-slate-600">{{ r.stage_label }}</td>
                        <td class="text-slate-500 text-xs">{{ fmt(r.submitted_at) }}</td>
                        <td class="pr-3 text-right whitespace-nowrap">
                            <router-link :to="`/tutoring/assignments/${r.assignment_id}/followups`" class="px-2 py-1 rounded border text-[11px] text-slate-600">Ver</router-link>
                            <button @click="review(r)" :disabled="busy" class="px-2 py-1 rounded bg-emerald-600 text-white text-[11px] font-semibold ml-1 disabled:opacity-50">Revisar</button>
                        </td>
                    </tr>
                    <tr v-if="!rows.length"><td colspan="6" class="px-4 py-6 text-center text-slate-400">Sin hitos por revisar.</td></tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'

const T = API.TUTORING_API
const toast = useToast()
const rows = ref<any[]>([])
const busy = ref(false)

function fmt(d: string | null) { return d ? new Date(d).toLocaleDateString() : '—' }

async function load() {
    const { data } = await api.get(T.followups.pending)
    rows.value = data.data ?? []
}
async function review(r: any) {
    busy.value = true
    try {
        await api.post(T.followups.review(r.id))
        toast.success('Hito revisado.')
        await load()
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'Operación no permitida.') }
    finally { busy.value = false }
}

onMounted(load)
</script>
