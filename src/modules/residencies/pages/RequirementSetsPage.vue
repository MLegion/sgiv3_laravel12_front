<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-3">
            <div>
                <h1 class="text-xl font-semibold text-slate-800 uppercase">Requisitos de documentos</h1>
                <p class="text-xs text-slate-400">Define qué documentos se le piden a cada generación de residentes. Una versión publicada no se edita: clónala para cambiarla.</p>
            </div>
            <button type="button" class="text-sm px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700" @click="openCreate">+ Nueva versión</button>
        </div>

        <div v-if="loading" class="text-sm text-slate-400">Cargando…</div>
        <ul v-else class="space-y-2">
            <li v-for="s in sets" :key="s.id" class="rounded-xl border bg-white p-4 flex items-center justify-between gap-3">
                <div class="min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                        <p class="text-sm font-bold text-slate-700">{{ s.name }}</p>
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold" :class="statusClass(s.status)">{{ statusLabel(s.status) }}</span>
                        <span v-if="s.isGlobal" class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">GLOBAL</span>
                    </div>
                    <p class="text-xs text-slate-400">{{ s.itemsCount }} documentos · vigente desde {{ s.effectiveFrom ?? '—' }}</p>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                    <button type="button" class="text-xs px-3 py-1.5 border rounded-md hover:bg-slate-50" @click="open(s.id)">{{ s.editable ? 'Editar' : 'Ver' }}</button>
                    <button type="button" class="text-xs px-3 py-1.5 border rounded-md hover:bg-slate-50" @click="openClone(s)">Clonar</button>
                </div>
            </li>
        </ul>

        <!-- Editor / detalle -->
        <Teleport to="body">
            <div v-if="detail" class="fixed inset-0 z-50 flex justify-end">
                <div class="absolute inset-0 bg-black/40" @click="detail = null" />
                <div class="relative bg-white w-full max-w-2xl h-full overflow-y-auto p-6 space-y-5 z-10">
                    <div class="flex items-start justify-between">
                        <h2 class="text-base font-bold text-slate-800">{{ detail.name }}
                            <span class="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold align-middle" :class="statusClass(detail.status)">{{ statusLabel(detail.status) }}</span>
                        </h2>
                        <button type="button" class="text-slate-400 hover:text-slate-700" @click="detail = null">✕</button>
                    </div>

                    <p v-if="!detail.editable" class="text-xs bg-amber-50 text-amber-700 rounded-md px-3 py-2">
                        {{ detail.isGlobal ? 'Versión global (referencia): no editable desde el colegio. Clónala para tener una versión propia.' : 'Versión publicada: no editable. Clónala para hacer cambios.' }}
                    </p>

                    <!-- Metadatos -->
                    <div class="grid sm:grid-cols-2 gap-3">
                        <label class="text-sm">
                            <span class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Nombre</span>
                            <input v-model="detail.name" :disabled="!detail.editable" class="border rounded-md px-3 py-2 text-sm w-full uppercase disabled:bg-slate-50" />
                        </label>
                        <label class="text-sm">
                            <span class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Vigente desde</span>
                            <input v-model="detail.effectiveFrom" type="date" :disabled="!detail.editable" class="border rounded-md px-3 py-2 text-sm w-full disabled:bg-slate-50" />
                        </label>
                    </div>

                    <!-- Items -->
                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <h3 class="text-[11px] font-bold text-slate-500 uppercase">Documentos ({{ detail.items.length }})</h3>
                            <button v-if="detail.editable" type="button" class="text-xs px-2 py-1 border rounded-md hover:bg-slate-50" @click="addItem">+ Documento</button>
                        </div>
                        <table class="min-w-full text-sm border rounded-lg overflow-hidden">
                            <thead class="bg-slate-50 text-[10px] uppercase text-slate-500">
                                <tr>
                                    <th class="text-left px-2 py-1.5">Código</th>
                                    <th class="text-left px-2 py-1.5">Nombre</th>
                                    <th class="text-left px-2 py-1.5">Tipo</th>
                                    <th class="text-center px-2 py-1.5">Oblig.</th>
                                    <th v-if="detail.editable" class="px-2 py-1.5"></th>
                                </tr>
                            </thead>
                            <tbody class="divide-y">
                                <tr v-for="(it, idx) in detail.items" :key="idx">
                                    <td class="px-2 py-1"><input v-model="it.code" :disabled="!detail.editable" placeholder="VIGENCIA_IMSS" class="border rounded px-2 py-1 text-xs w-36 uppercase disabled:bg-slate-50 disabled:border-transparent" /></td>
                                    <td class="px-2 py-1"><input v-model="it.name" :disabled="!detail.editable" placeholder="Nombre del documento" class="border rounded px-2 py-1 text-xs w-full uppercase disabled:bg-slate-50 disabled:border-transparent" /></td>
                                    <td class="px-2 py-1">
                                        <select v-model="it.kind" :disabled="!detail.editable" class="border rounded px-1 py-1 text-xs disabled:bg-slate-50 disabled:border-transparent">
                                            <option value="upload">Sube el residente</option>
                                            <option value="generated">Lo genera el sistema</option>
                                        </select>
                                    </td>
                                    <td class="px-2 py-1 text-center"><input v-model="it.isRequired" type="checkbox" :disabled="!detail.editable" /></td>
                                    <td v-if="detail.editable" class="px-2 py-1 text-right"><button type="button" class="text-red-500 hover:text-red-700 text-xs" @click="detail.items.splice(idx, 1)">Quitar</button></td>
                                </tr>
                                <tr v-if="!detail.items.length"><td :colspan="detail.editable ? 5 : 4" class="px-2 py-3 text-center text-xs text-slate-400 italic">Sin documentos.</td></tr>
                            </tbody>
                        </table>
                    </div>

                    <p v-if="msg" class="text-xs" :class="msgError ? 'text-red-600' : 'text-emerald-600'">{{ msg }}</p>

                    <!-- Acciones -->
                    <div v-if="detail.editable" class="flex items-center gap-2 border-t pt-4">
                        <button type="button" :disabled="saving" class="text-sm px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50" @click="save">Guardar</button>
                        <button type="button" :disabled="saving" class="text-sm px-3 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50" @click="publish">Publicar</button>
                        <span class="text-[11px] text-slate-400">Publicar la deja vigente (e inmutable) desde su fecha.</span>
                    </div>
                    <div v-else-if="detail.status === 'published' && !detail.isGlobal" class="border-t pt-4">
                        <button type="button" class="text-sm px-3 py-2 border border-red-200 text-red-600 rounded-md hover:bg-red-50" @click="archive">Archivar versión</button>
                    </div>
                </div>
            </div>
        </Teleport>

        <!-- Modal crear/clonar -->
        <Teleport to="body">
            <div v-if="form.open" class="fixed inset-0 z-50 flex items-center justify-center">
                <div class="absolute inset-0 bg-black/40" @click="form.open = false" />
                <div class="relative bg-white rounded-xl shadow-lg w-full max-w-md p-6 space-y-4 z-10">
                    <h3 class="text-sm font-semibold text-slate-800">{{ form.cloneFrom ? `Clonar "${form.cloneFrom}"` : 'Nueva versión de requisitos' }}</h3>
                    <input v-model="form.name" placeholder="Nombre (p. ej. REQUISITOS GENERACIÓN 2026)" class="border rounded-md w-full px-3 py-2 text-sm uppercase placeholder:normal-case" />
                    <label class="block text-sm">
                        <span class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Vigente desde</span>
                        <input v-model="form.effectiveFrom" type="date" class="border rounded-md w-full px-3 py-2 text-sm" />
                    </label>
                    <p v-if="form.error" class="text-xs text-red-600">{{ form.error }}</p>
                    <div class="flex justify-end gap-2">
                        <button type="button" class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-100" @click="form.open = false">Cancelar</button>
                        <button type="button" :disabled="form.saving" class="px-4 py-2 text-sm rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50" @click="submitForm">{{ form.cloneFrom ? 'Clonar' : 'Crear' }}</button>
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
import type { RequirementSetRow, RequirementSetDetail } from '@/modules/residencies/types/residency.type'

const R = API.RESIDENCIES_API

const loading = ref(false)
const sets = ref<RequirementSetRow[]>([])
const detail = ref<RequirementSetDetail | null>(null)
const saving = ref(false)
const msg = ref<string | null>(null)
const msgError = ref(false)

const form = reactive<{ open: boolean; name: string; effectiveFrom: string; cloneFrom: string | null; cloneId: number | null; saving: boolean; error: string | null }>({
    open: false, name: '', effectiveFrom: '', cloneFrom: null, cloneId: null, saving: false, error: null,
})

async function load() {
    loading.value = true
    try {
        const { data } = await api.get(R.requirementSets.list)
        sets.value = data ?? []
    } finally { loading.value = false }
}

async function open(id: number) {
    msg.value = null
    const { data } = await api.get(R.requirementSets.byId(id))
    detail.value = data
}

function addItem() {
    detail.value?.items.push({
        code: '', name: '', shortName: null, description: null, kind: 'upload',
        generatedReportCode: null, acceptsFormats: ['pdf'], maxSizeKb: 10240, isRequired: true, sortOrder: 0,
    })
}

async function save() {
    if (!detail.value) return
    saving.value = true; msg.value = null
    try {
        await api.put(R.requirementSets.update(detail.value.id), {
            name: detail.value.name, effective_from: detail.value.effectiveFrom, notes: detail.value.notes,
        })
        await api.put(R.requirementSets.saveItems(detail.value.id), {
            items: detail.value.items.map(i => ({
                code: i.code, name: i.name, short_name: i.shortName, kind: i.kind,
                generated_report_code: i.generatedReportCode, max_size_kb: i.maxSizeKb, is_required: i.isRequired,
            })),
        })
        msgError.value = false; msg.value = 'Cambios guardados.'
        await load()
    } catch (e: any) {
        msgError.value = true; msg.value = e?.response?.data?.message ?? 'No se pudo guardar.'
    } finally { saving.value = false }
}

async function publish() {
    if (!detail.value) return
    saving.value = true; msg.value = null
    try {
        await save()
        const { data } = await api.post(R.requirementSets.publish(detail.value.id), {})
        detail.value = data
        msgError.value = false; msg.value = 'Versión publicada.'
        await load()
    } catch (e: any) {
        msgError.value = true; msg.value = e?.response?.data?.message ?? 'No se pudo publicar.'
    } finally { saving.value = false }
}

async function archive() {
    if (!detail.value) return
    try {
        const { data } = await api.post(R.requirementSets.archive(detail.value.id), {})
        detail.value = data
        await load()
    } catch (e: any) {
        msgError.value = true; msg.value = e?.response?.data?.message ?? 'No se pudo archivar.'
    }
}

function openCreate() {
    form.open = true; form.name = ''; form.effectiveFrom = ''; form.cloneFrom = null; form.cloneId = null; form.error = null
}
function openClone(s: RequirementSetRow) {
    form.open = true; form.name = `${s.name} (COPIA)`; form.effectiveFrom = ''; form.cloneFrom = s.name; form.cloneId = s.id; form.error = null
}
async function submitForm() {
    if (!form.name.trim()) { form.error = 'El nombre es obligatorio.'; return }
    form.saving = true; form.error = null
    try {
        const payload = { name: form.name, effective_from: form.effectiveFrom || null }
        const { data } = form.cloneId
            ? await api.post(R.requirementSets.clone(form.cloneId), payload)
            : await api.post(R.requirementSets.create, payload)
        form.open = false
        await load()
        detail.value = data
    } catch (e: any) {
        form.error = e?.response?.data?.message ?? 'No se pudo crear.'
    } finally { form.saving = false }
}

function statusLabel(s: string): string {
    return ({ draft: 'BORRADOR', published: 'PUBLICADA', archived: 'ARCHIVADA' } as Record<string, string>)[s] ?? s.toUpperCase()
}
function statusClass(s: string): string {
    return ({
        draft:     'bg-amber-100 text-amber-700',
        published: 'bg-emerald-100 text-emerald-700',
        archived:  'bg-slate-200 text-slate-500',
    } as Record<string, string>)[s] ?? 'bg-slate-100 text-slate-500'
}

load()
</script>
