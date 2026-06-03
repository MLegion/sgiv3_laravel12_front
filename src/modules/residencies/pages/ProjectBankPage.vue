<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-3">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Banco de Proyectos</h1>
            <div class="flex items-center gap-2">
                <input v-model="search" placeholder="Buscar…" class="border rounded-md px-2 py-1 text-xs" @keyup.enter="fetchData" />
                <select v-model="statusFilter" class="border rounded-md px-2 py-1 text-xs" @change="fetchData">
                    <option value="">Todos</option>
                    <option value="draft">BORRADOR</option>
                    <option value="published">PUBLICADO</option>
                    <option value="closed">CERRADO</option>
                </select>
                <button type="button" class="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700" @click="openForm()">+ Nuevo</button>
            </div>
        </div>

        <div v-if="loading" class="text-sm text-slate-400">Cargando…</div>
        <div v-else-if="!projects.length" class="text-sm text-slate-400 italic">Sin proyectos.</div>

        <ul v-else class="space-y-3">
            <li v-for="p in projects" :key="p.id" class="rounded-xl border bg-white p-4 flex items-start justify-between gap-3">
                <div>
                    <div class="flex items-center gap-2">
                        <p class="text-sm font-bold text-slate-700">{{ p.title }}</p>
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold" :class="statusClass(p.status)">{{ statusLabel(p.status) }}</span>
                    </div>
                    <p class="text-xs text-slate-500">{{ p.company }} · {{ p.available }} de {{ p.slots }} lugares</p>
                    <p class="text-[11px] text-slate-400">{{ p.careers.map(c => c.name).join(', ') }}</p>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                    <button type="button" class="text-xs px-2 py-1 border rounded-md hover:bg-slate-50" @click="openForm(p)">Editar</button>
                    <button v-if="p.status !== 'published'" type="button" class="text-xs px-2 py-1 bg-emerald-600 text-white rounded-md hover:bg-emerald-700" @click="publish(p.id)">Publicar</button>
                    <button v-if="p.status !== 'closed'" type="button" class="text-xs px-2 py-1 bg-slate-600 text-white rounded-md hover:bg-slate-700" @click="close(p.id)">Cerrar</button>
                </div>
            </li>
        </ul>

        <!-- Modal formulario -->
        <Teleport to="body">
            <div v-if="form.open" class="fixed inset-0 z-50 flex items-center justify-center">
                <div class="absolute inset-0 bg-black/40" @click="form.open = false" />
                <div class="relative bg-white rounded-xl shadow-lg w-full max-w-lg p-6 space-y-3 z-10 max-h-[90vh] overflow-y-auto">
                    <h3 class="text-sm font-semibold text-slate-800">{{ form.id ? 'Editar' : 'Nuevo' }} proyecto</h3>

                    <input v-model="form.title" placeholder="Título *" class="border rounded-md w-full px-3 py-2 text-sm" />
                    <textarea v-model="form.description" rows="2" placeholder="Descripción" class="border rounded-md w-full px-3 py-2 text-sm"></textarea>
                    <textarea v-model="form.required_profile" rows="2" placeholder="Perfil requerido" class="border rounded-md w-full px-3 py-2 text-sm"></textarea>

                    <label class="flex items-center gap-2 text-sm text-slate-600">
                        <input type="checkbox" v-model="form.is_internal" /> Proyecto interno (de la institución)
                    </label>

                    <select v-if="!form.is_internal" v-model.number="form.company_id" class="border rounded-md w-full px-3 py-2 text-sm">
                        <option :value="null">— Empresa aprobada —</option>
                        <option v-for="c in companies" :key="c.id" :value="c.id">{{ c.name }}</option>
                    </select>

                    <div>
                        <label class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Carreras *</label>
                        <div class="border rounded-md p-2 max-h-36 overflow-y-auto space-y-1">
                            <label v-for="c in careers" :key="c.id" class="flex items-center gap-2 text-sm">
                                <input type="checkbox" :value="c.id" v-model="form.career_ids" /> {{ c.name }}
                            </label>
                        </div>
                    </div>

                    <input v-model.number="form.slots" type="number" min="1" placeholder="Lugares" class="border rounded-md w-full px-3 py-2 text-sm" />

                    <p v-if="form.error" class="text-xs text-red-600">{{ form.error }}</p>
                    <div class="flex justify-end gap-2 pt-2">
                        <button type="button" class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-100" @click="form.open = false">Cancelar</button>
                        <button type="button" class="px-4 py-2 text-sm rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                            :disabled="form.saving" @click="save">{{ form.saving ? 'Guardando…' : 'Guardar' }}</button>
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { ResidencyProject, ProjectBankStatus, Company, ProjectCareerRef } from '@/modules/residencies/types/residency.type'

const R = API.RESIDENCIES_API

const loading = ref(false)
const projects = ref<ResidencyProject[]>([])
const statusFilter = ref('')
const search = ref('')

const companies = ref<Company[]>([])
const careers = ref<ProjectCareerRef[]>([])

const form = reactive<{
    open: boolean; saving: boolean; error: string | null; id: number | null
    title: string; description: string; required_profile: string
    is_internal: boolean; company_id: number | null; slots: number; career_ids: number[]
}>({
    open: false, saving: false, error: null, id: null,
    title: '', description: '', required_profile: '', is_internal: false, company_id: null, slots: 1, career_ids: [],
})

async function fetchData() {
    loading.value = true
    try {
        const { data } = await api.get(R.projects.list, {
            params: { status: statusFilter.value || undefined, search: search.value || undefined, per_page: 100 },
        })
        projects.value = data.items ?? []
    } finally { loading.value = false }
}

async function loadPickers() {
    try {
        const { data } = await api.get(R.companies.options)
        companies.value = data ?? []
    } catch { companies.value = [] }
    try {
        const { data } = await api.get(API.SUPERADMIN_API.careers.list, { params: { per_page: 200 } })
        careers.value = (data.items ?? data ?? []).map((c: any) => ({ id: c.id, name: c.name }))
    } catch { careers.value = [] }
}

function openForm(p?: ResidencyProject) {
    form.open = true; form.error = null
    if (p) {
        form.id = p.id; form.title = p.title; form.description = p.description ?? ''; form.required_profile = p.requiredProfile ?? ''
        form.is_internal = p.isInternal; form.company_id = p.companyId; form.slots = p.slots
        form.career_ids = p.careers.map(c => c.id)
    } else {
        form.id = null; form.title = ''; form.description = ''; form.required_profile = ''
        form.is_internal = false; form.company_id = null; form.slots = 1; form.career_ids = []
    }
}

async function save() {
    if (!form.title.trim()) { form.error = 'El título es obligatorio.'; return }
    if (!form.career_ids.length) { form.error = 'Selecciona al menos una carrera.'; return }
    if (!form.is_internal && !form.company_id) { form.error = 'Selecciona la empresa o marca interno.'; return }
    form.saving = true; form.error = null
    const payload = {
        title: form.title, description: form.description || null, required_profile: form.required_profile || null,
        is_internal: form.is_internal, company_id: form.is_internal ? null : form.company_id,
        slots: form.slots, career_ids: form.career_ids,
    }
    try {
        if (form.id) await api.put(R.projects.update(form.id), payload)
        else await api.post(R.projects.create, payload)
        form.open = false
        await fetchData()
    } catch (e: any) {
        form.error = e?.response?.data?.message ?? 'No se pudo guardar.'
    } finally { form.saving = false }
}

async function publish(id: number) { await api.post(R.projects.publish(id), {}); await fetchData() }
async function close(id: number) { await api.post(R.projects.close(id), {}); await fetchData() }

function statusLabel(s: ProjectBankStatus): string {
    return ({ draft: 'BORRADOR', published: 'PUBLICADO', closed: 'CERRADO' } as Record<string, string>)[s] ?? s.toUpperCase()
}
function statusClass(s: ProjectBankStatus): string {
    return ({
        draft:     'bg-slate-100 text-slate-600',
        published: 'bg-emerald-100 text-emerald-700',
        closed:    'bg-slate-200 text-slate-500',
    } as Record<string, string>)[s] ?? 'bg-slate-100 text-slate-600'
}

fetchData()
loadPickers()
</script>
