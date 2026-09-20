<template>
    <div class="space-y-5">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Seguimiento de Egresados</h1>
            <button @click="openNew" class="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold">+ Nueva oleada</button>
        </div>

        <div class="rounded-xl border bg-white p-4 flex gap-3">
            <select v-model="filters.status" class="rounded-lg border-slate-300 text-sm">
                <option value="">Todas</option>
                <option value="draft">Borrador</option><option value="open">Abiertas</option><option value="closed">Cerradas</option>
            </select>
            <button @click="fetchList" class="px-4 py-2 rounded-lg border text-sm font-semibold text-slate-600">Filtrar</button>
        </div>

        <div class="rounded-xl border bg-white overflow-hidden">
            <table class="w-full text-sm">
                <thead><tr class="text-left text-[10px] uppercase text-slate-400 bg-slate-50 border-b">
                    <th class="px-4 py-2">Oleada</th><th>Carrera</th><th>Invitadas</th><th>Enviadas</th><th>Respondidas</th><th>Estado</th>
                </tr></thead>
                <tbody>
                    <tr v-for="w in rows" :key="w.id" @click="goDetail(w.id)" class="border-b last:border-0 hover:bg-slate-50 cursor-pointer">
                        <td class="px-4 py-2"><div class="font-semibold text-slate-700">{{ w.name }}</div><div class="text-xs text-slate-400">{{ w.form_slug }}</div></td>
                        <td class="text-slate-600">{{ w.career_name ?? 'Todas' }}</td>
                        <td class="text-slate-600">{{ w.counts?.invited ?? 0 }}</td>
                        <td class="text-slate-600">{{ w.counts?.sent ?? 0 }}</td>
                        <td class="text-slate-600">{{ w.counts?.responded ?? 0 }}</td>
                        <td><span class="px-2 py-0.5 rounded-full text-xs font-bold" :class="statusClass(w.status)">{{ statusLabel(w.status) }}</span></td>
                    </tr>
                    <tr v-if="!rows.length"><td colspan="6" class="px-4 py-6 text-center text-slate-400">Sin oleadas.</td></tr>
                </tbody>
            </table>
        </div>

        <!-- Modal nueva oleada -->
        <div v-if="showNew" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" @click.self="showNew = false">
            <div class="bg-white rounded-xl p-5 w-full max-w-lg space-y-3 max-h-[92vh] overflow-auto">
                <h2 class="text-sm font-bold text-slate-700 uppercase">Nueva oleada</h2>
                <label class="block"><span class="text-xs font-semibold text-slate-500">Nombre</span>
                    <input v-model="form.name" class="mt-1 w-full rounded-lg border-slate-300 text-sm" /></label>
                <label class="block"><span class="text-xs font-semibold text-slate-500">Formulario en sgi_forms (slug)</span>
                    <input v-model="form.form_slug" placeholder="p. ej. seguimiento-egresados-2024" class="mt-1 w-full rounded-lg border-slate-300 text-sm" /></label>
                <label class="block"><span class="text-xs font-semibold text-slate-500">Descripción (opcional)</span>
                    <textarea v-model="form.description" rows="2" class="mt-1 w-full rounded-lg border-slate-300 text-sm"></textarea></label>

                <div class="border-t pt-3">
                    <p class="text-xs font-bold text-slate-500 uppercase mb-2">Cohorte objetivo</p>
                    <span class="text-xs font-semibold text-slate-500">Estatus del egresado</span>
                    <div class="flex flex-wrap gap-2 mt-1 mb-2">
                        <label v-for="s in options.statuses" :key="s.id" class="inline-flex items-center gap-1 text-sm">
                            <input type="checkbox" :value="s.id" v-model="form.target_status_ids" @change="doPreview" /> {{ s.name }}
                        </label>
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <label class="block"><span class="text-xs font-semibold text-slate-500">Carrera (opcional)</span>
                            <select v-model="form.career_id" @change="doPreview" class="mt-1 w-full rounded-lg border-slate-300 text-sm">
                                <option :value="null">Todas</option>
                                <option v-for="c in options.careers" :key="c.id" :value="c.id">{{ c.name }}</option>
                            </select></label>
                        <label class="block"><span class="text-xs font-semibold text-slate-500">Periodo de egreso (opcional)</span>
                            <select v-model="form.exit_period_id" @change="doPreview" class="mt-1 w-full rounded-lg border-slate-300 text-sm">
                                <option :value="null">Todos</option>
                                <option v-for="p in options.periods" :key="p.id" :value="p.id">{{ p.name }}</option>
                            </select></label>
                    </div>
                    <div v-if="preview" class="mt-2 rounded-lg bg-slate-50 border p-2 text-sm text-slate-600">
                        <b>{{ preview.total }}</b> egresados en la cohorte · <b>{{ preview.with_email }}</b> con correo.
                        <div v-if="preview.sample.length" class="text-xs text-slate-400 mt-1">Ej.: {{ preview.sample.slice(0,4).join(' · ') }}</div>
                    </div>
                </div>

                <p v-if="modalMsg" class="text-sm text-red-600">{{ modalMsg }}</p>
                <div class="flex justify-end gap-2">
                    <button @click="showNew = false" class="px-4 py-2 rounded-lg border text-sm">Cancelar</button>
                    <button @click="create" :disabled="!canCreate || saving" class="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold disabled:opacity-50">Crear</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { GraduateWave, CohortPreview } from '@/modules/graduate-tracking/types/graduate-tracking.type'
import { statusLabel, statusClass } from '@/modules/graduate-tracking/pages/status'

const G = API.GRADUATE_TRACKING_API
const router = useRouter()

const rows = ref<GraduateWave[]>([])
const options = reactive<{ careers: any[]; periods: any[]; statuses: any[] }>({ careers: [], periods: [], statuses: [] })
const filters = reactive({ status: '' })

const showNew = ref(false), saving = ref(false), modalMsg = ref('')
const form = reactive({ name: '', form_slug: '', description: '', target_status_ids: [] as number[], career_id: null as number | null, exit_period_id: null as number | null })
const preview = ref<CohortPreview | null>(null)
let previewTimer: any = null

const canCreate = computed(() => form.name.trim() !== '' && form.form_slug.trim() !== '' && form.target_status_ids.length > 0)

function goDetail(id: number) { router.push({ name: 'graduate-tracking.wave-detail', params: { id } }) }

async function fetchList() {
    const { data } = await api.get(G.waves.list, { params: { status: filters.status || undefined, per_page: 50 } })
    rows.value = data.data ?? []
}
async function fetchOptions() {
    const { data } = await api.get(G.waves.filterOptions)
    options.careers = data.careers ?? []; options.periods = data.periods ?? []; options.statuses = data.statuses ?? []
}
function openNew() {
    Object.assign(form, { name: '', form_slug: '', description: '', target_status_ids: [], career_id: null, exit_period_id: null })
    preview.value = null; modalMsg.value = ''; showNew.value = true
}
function doPreview() {
    clearTimeout(previewTimer)
    if (!form.target_status_ids.length) { preview.value = null; return }
    previewTimer = setTimeout(async () => {
        const { data } = await api.post(G.waves.previewCohort, {
            target_status_ids: form.target_status_ids, career_id: form.career_id, exit_period_id: form.exit_period_id,
        })
        preview.value = data
    }, 300)
}
async function create() {
    saving.value = true; modalMsg.value = ''
    try {
        const { data } = await api.post(G.waves.create, {
            name: form.name, form_slug: form.form_slug, description: form.description || null,
            target_status_ids: form.target_status_ids, career_id: form.career_id, exit_period_id: form.exit_period_id,
        })
        showNew.value = false
        goDetail(data.id)
    } catch (e: any) { modalMsg.value = e?.response?.data?.message ?? 'No se pudo crear.' }
    finally { saving.value = false }
}

onMounted(async () => { await Promise.all([fetchOptions(), fetchList()]) })
</script>
