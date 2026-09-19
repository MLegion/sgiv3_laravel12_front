<template>
    <div class="space-y-5">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Banco de Programas de Servicio Social</h1>
            <button @click="openNew" class="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold">+ Programa</button>
        </div>

        <div class="rounded-xl border bg-white overflow-hidden">
            <table class="w-full text-sm">
                <thead>
                    <tr class="text-left text-[10px] uppercase text-slate-400 bg-slate-50 border-b">
                        <th class="px-4 py-2">Programa</th><th>Dependencia</th><th>Carreras</th><th>Estado</th><th></th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="p in programs" :key="p.id" class="border-b last:border-0">
                        <td class="px-4 py-2">
                            <p class="font-semibold text-slate-700">{{ p.title }}</p>
                            <p class="text-xs text-slate-400">{{ p.is_internal ? 'Interno' : 'Externo' }}<span v-if="p.slots"> · {{ p.slots }} lugares</span></p>
                        </td>
                        <td class="text-slate-600">{{ p.company_name ?? '—' }}</td>
                        <td class="text-slate-600 text-xs">{{ p.careers.map(c => c.name).join(', ') || '—' }}</td>
                        <td><span class="px-2 py-0.5 rounded-full text-xs font-bold" :class="statusClass(p.status)">{{ statusLabel(p.status) }}</span></td>
                        <td class="text-right px-4">
                            <button @click="edit(p)" class="text-xs text-slate-500 font-semibold mr-2">Editar</button>
                            <button v-if="p.status !== 'published'" @click="publish(p.id)" class="text-xs text-emerald-600 font-semibold mr-2">Publicar</button>
                            <button v-if="p.status === 'published'" @click="close(p.id)" class="text-xs text-red-600 font-semibold">Cerrar</button>
                        </td>
                    </tr>
                    <tr v-if="!programs.length"><td colspan="5" class="px-4 py-6 text-center text-slate-400">Sin programas.</td></tr>
                </tbody>
            </table>
        </div>

        <!-- Modal -->
        <div v-if="showModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" @click.self="showModal = false">
            <div class="bg-white rounded-xl p-5 w-full max-w-lg space-y-3">
                <h2 class="text-sm font-bold text-slate-700 uppercase">{{ form.id ? 'Editar' : 'Nuevo' }} programa</h2>
                <label class="block">
                    <span class="text-xs font-semibold text-slate-500">Título</span>
                    <input v-model="form.title" type="text" class="mt-1 w-full rounded-lg border-slate-300 text-sm" maxlength="255" />
                </label>
                <label class="block">
                    <span class="text-xs font-semibold text-slate-500">Descripción</span>
                    <textarea v-model="form.description" rows="2" class="mt-1 w-full rounded-lg border-slate-300 text-sm"></textarea>
                </label>
                <div class="grid grid-cols-2 gap-3">
                    <label class="block">
                        <span class="text-xs font-semibold text-slate-500">Dependencia</span>
                        <select v-model="form.company_id" class="mt-1 w-full rounded-lg border-slate-300 text-sm">
                            <option :value="null">— Ninguna / interno —</option>
                            <option v-for="d in dependencies" :key="d.id" :value="d.id">{{ d.name }}</option>
                        </select>
                    </label>
                    <label class="block">
                        <span class="text-xs font-semibold text-slate-500">Lugares</span>
                        <input v-model.number="form.slots" type="number" min="1" class="mt-1 w-full rounded-lg border-slate-300 text-sm" />
                    </label>
                </div>
                <label class="flex items-center gap-2 text-sm text-slate-600">
                    <input v-model="form.is_internal" type="checkbox" class="rounded border-slate-300" /> Programa interno del Instituto
                </label>
                <label class="block">
                    <span class="text-xs font-semibold text-slate-500">Carreras</span>
                    <select v-model="form.career_ids" multiple class="mt-1 w-full rounded-lg border-slate-300 text-sm h-28">
                        <option v-for="c in careers" :key="c.id" :value="c.id">{{ c.name }}</option>
                    </select>
                </label>
                <p v-if="modalMsg" class="text-sm text-red-600">{{ modalMsg }}</p>
                <div class="flex justify-end gap-2">
                    <button @click="showModal = false" class="px-4 py-2 rounded-lg border text-sm">Cancelar</button>
                    <button @click="save" :disabled="!form.title || saving" class="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold disabled:opacity-50">Guardar</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { SocialServiceProgram, DependencyOption } from '@/modules/social-service/types/social-service.type'

const S = API.SOCIAL_SERVICE_API

const programs = ref<SocialServiceProgram[]>([])
const dependencies = ref<DependencyOption[]>([])
const careers = ref<any[]>([])
const showModal = ref(false)
const saving = ref(false)
const modalMsg = ref('')

const form = reactive({ id: null as number | null, title: '', description: '', required_profile: '', company_id: null as number | null, is_internal: false, slots: null as number | null, career_ids: [] as number[] })

function statusClass(s: string) { return { draft: 'bg-slate-100 text-slate-600', published: 'bg-emerald-100 text-emerald-700', closed: 'bg-red-100 text-red-700' }[s] ?? 'bg-slate-100' }
function statusLabel(s: string) { return { draft: 'Borrador', published: 'Publicado', closed: 'Cerrado' }[s] ?? s }

async function fetchAll() {
    const [pr, dep, car] = await Promise.all([
        api.get(S.programs.list),
        api.get(S.dependencies),
        api.get(API.SUPERADMIN_API.careers.list, { params: { per_page: 200 } }),
    ])
    programs.value = pr.data ?? []
    dependencies.value = dep.data ?? []
    careers.value = car.data.data ?? car.data ?? []
}

function openNew() {
    Object.assign(form, { id: null, title: '', description: '', required_profile: '', company_id: null, is_internal: false, slots: null, career_ids: [] })
    modalMsg.value = ''
    showModal.value = true
}
function edit(p: SocialServiceProgram) {
    Object.assign(form, {
        id: p.id, title: p.title, description: p.description ?? '', required_profile: p.required_profile ?? '',
        company_id: p.company_id, is_internal: p.is_internal, slots: p.slots, career_ids: p.careers.map(c => c.id),
    })
    modalMsg.value = ''
    showModal.value = true
}

async function save() {
    saving.value = true
    modalMsg.value = ''
    try {
        const payload = { title: form.title, description: form.description || null, required_profile: form.required_profile || null, company_id: form.company_id, is_internal: form.is_internal, slots: form.slots, career_ids: form.career_ids }
        if (form.id) await api.put(S.programs.update(form.id), payload)
        else await api.post(S.programs.create, payload)
        showModal.value = false
        await fetchAll()
    } catch (e: any) { modalMsg.value = e?.response?.data?.message ?? 'No se pudo guardar.' } finally { saving.value = false }
}

async function publish(id: number) { await api.post(S.programs.publish(id), {}); await fetchAll() }
async function close(id: number) { await api.post(S.programs.close(id), {}); await fetchAll() }

onMounted(fetchAll)
</script>
