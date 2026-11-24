<template>
    <div class="space-y-5">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Requisitos de Documentos</h1>
            <button @click="openNew" class="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold">+ Versión</button>
        </div>

        <p v-if="msg" class="text-sm px-4 py-2.5 rounded-lg" :class="msgError ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'">{{ msg }}</p>

        <div class="rounded-xl border bg-white overflow-hidden">
            <div role="region" aria-label="Requisitos de Documentos" tabindex="0" class="overflow-x-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-400">
            <table class="w-full text-sm">
                <caption class="sr-only">Requisitos de Documentos</caption>
                <thead>
                    <tr class="text-left text-[10px] uppercase text-slate-400 bg-slate-50 border-b">
                        <th scope="col" class="px-4 py-2">Versión</th><th scope="col">Ámbito</th><th scope="col">Vigente desde</th><th scope="col">Docs</th><th scope="col">Estado</th><th scope="col"></th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="s in sets" :key="s.id" class="border-b last:border-0">
                        <td class="px-4 py-2 font-semibold text-slate-700">{{ s.name }}</td>
                        <td><span class="text-xs px-2 py-0.5 rounded-full" :class="s.is_global ? 'bg-slate-100 text-slate-500' : 'bg-sky-100 text-sky-700'">{{ s.is_global ? 'Global' : 'Plantel' }}</span></td>
                        <td class="text-slate-500">{{ s.effective_from ?? '—' }}</td>
                        <td class="text-slate-600">{{ s.items_count }}</td>
                        <td><span class="px-2 py-0.5 rounded-full text-xs font-bold" :class="statusClass(s.status)">{{ statusLabel(s.status) }}</span></td>
                        <td class="text-right px-4 whitespace-nowrap">
                            <button @click="edit(s.id)" class="text-xs text-slate-500 font-semibold mr-2">{{ s.is_global ? 'Ver' : 'Editar' }}</button>
                            <button @click="clone(s.id)" class="text-xs text-blue-600 font-semibold mr-2">Clonar</button>
                            <button v-if="!s.is_global && s.status === 'draft'" @click="publish(s.id)" class="text-xs text-emerald-600 font-semibold mr-2">Publicar</button>
                            <button v-if="!s.is_global && s.status === 'published'" @click="archive(s.id)" class="text-xs text-amber-600 font-semibold mr-2">Archivar</button>
                            <button v-if="!s.is_global && s.status === 'draft'" @click="destroy(s.id)" class="text-xs text-red-600 font-semibold">Eliminar</button>
                        </td>
                    </tr>
                    <tr v-if="!sets.length"><td colspan="6" class="px-4 py-6 text-center text-slate-400">Sin versiones.</td></tr>
                </tbody>
            </table>
            </div>
        </div>

        <!-- Editor de versión -->
        <div v-if="editing" class="rounded-xl border bg-white p-5 space-y-4">
            <div class="flex items-center justify-between">
                <h2 class="text-sm font-bold text-slate-700 uppercase">{{ editing.name }} <span class="text-slate-400">({{ statusLabel(editing.status) }})</span></h2>
                <button @click="editing = null" class="text-xs text-slate-400">Cerrar</button>
            </div>

            <div class="space-y-2">
                <div v-for="(it, idx) in editing.items" :key="idx" class="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                    <input v-model="it.code" :disabled="readonly" placeholder="CODE" aria-label="Código del documento" class="col-span-2 rounded-lg border-slate-300 text-xs uppercase" />
                    <input v-model="it.name" :disabled="readonly" placeholder="Nombre" aria-label="Nombre del documento" class="col-span-4 rounded-lg border-slate-300 text-xs" />
                    <select v-model="it.kind" :disabled="readonly" aria-label="Tipo de documento" class="col-span-2 rounded-lg border-slate-300 text-xs">
                        <option value="upload">Subida</option>
                        <option value="generated">Generado</option>
                    </select>
                    <input v-model="it.generated_report_code" :disabled="readonly || it.kind !== 'generated'" placeholder="Report code" aria-label="Código del reporte generado" class="col-span-3 rounded-lg border-slate-300 text-xs" />
                    <button v-if="!readonly" @click="editing.items.splice(idx, 1)" class="col-span-1 text-red-500 text-xs">✕</button>
                </div>
            </div>
            <div v-if="!readonly" class="flex items-center gap-2">
                <button @click="addItem" class="text-xs text-blue-600 font-semibold">+ Documento</button>
                <button @click="saveItems" :disabled="saving" class="ml-auto px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold disabled:opacity-50">Guardar documentos</button>
            </div>
            <p v-else class="text-xs text-slate-400">La versión global es de solo lectura. Clónala para personalizarla en tu plantel.</p>
        </div>

        <!-- Modal nueva versión -->
        <BaseModal v-model="showNew" title="Nueva versión" size="md">
            <div class="space-y-3">
                <input v-model="newForm.name" placeholder="Nombre de la versión" aria-label="Nombre de la versión" class="w-full rounded-lg border-slate-300 text-sm" />
                <label class="block">
                    <span class="text-xs font-semibold text-slate-500">Vigente desde</span>
                    <input v-model="newForm.effective_from" type="date" class="mt-1 w-full rounded-lg border-slate-300 text-sm" />
                </label>
            </div>
            <template #footer>
                <button @click="showNew = false" class="px-4 py-2 rounded-lg border text-sm">Cancelar</button>
                <button @click="create" :disabled="!newForm.name || saving" class="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold disabled:opacity-50">Crear</button>
            </template>
        </BaseModal>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { RequirementSetSummary } from '@/modules/social-service/types/social-service.type'
import BaseModal from '@/app/components/ui/modal/BaseModal.vue'
import { usePrompt } from '@/app/composables/usePrompt'
import { useConfirm } from '@/app/composables/useConfirm'

const { prompt } = usePrompt()
const { confirm } = useConfirm()
const S = API.SOCIAL_SERVICE_API

const sets = ref<RequirementSetSummary[]>([])
const editing = ref<any | null>(null)
const showNew = ref(false)
const saving = ref(false)
const msg = ref('')
const msgError = ref(false)
const newForm = reactive({ name: '', effective_from: '' })

const readonly = computed(() => editing.value?.is_global || editing.value?.status !== 'draft')

function statusClass(s: string) { return { draft: 'bg-slate-100 text-slate-600', published: 'bg-emerald-100 text-emerald-700', archived: 'bg-amber-100 text-amber-700' }[s] ?? 'bg-slate-100' }
function statusLabel(s: string) { return { draft: 'Borrador', published: 'Publicada', archived: 'Archivada' }[s] ?? s }
function flash(t: string, err = false) { msg.value = t; msgError.value = err; setTimeout(() => (msg.value = ''), 4000) }

async function fetchSets() { sets.value = (await api.get(S.requirementSets.list)).data ?? [] }

function openNew() { newForm.name = ''; newForm.effective_from = ''; showNew.value = true }

async function create() {
    saving.value = true
    try {
        await api.post(S.requirementSets.create, { name: newForm.name, effective_from: newForm.effective_from || null })
        showNew.value = false
        await fetchSets()
        flash('Versión creada.')
    } catch (e: any) { flash(e?.response?.data?.message ?? 'No se pudo crear.', true) } finally { saving.value = false }
}

async function edit(id: number) {
    const { data } = await api.get(S.requirementSets.byId(id))
    editing.value = { ...data, items: (data.items ?? []).map((i: any) => ({ ...i })) }
}

function addItem() { editing.value.items.push({ code: '', name: '', kind: 'upload', generated_report_code: null, is_required: true }) }

async function saveItems() {
    saving.value = true
    try {
        await api.put(S.requirementSets.saveItems(editing.value.id), { items: editing.value.items })
        await edit(editing.value.id)
        await fetchSets()
        flash('Documentos guardados.')
    } catch (e: any) { flash(e?.response?.data?.message ?? 'No se pudo guardar.', true) } finally { saving.value = false }
}

async function publish(id: number) { await act(() => api.post(S.requirementSets.publish(id), {}), 'Versión publicada.') }
async function archive(id: number) { await act(() => api.post(S.requirementSets.archive(id), {}), 'Versión archivada.') }
async function destroy(id: number) { if (await confirm({ title: 'Eliminar versión', message: '¿Eliminar esta versión en borrador?', confirmText: 'Eliminar', variant: 'danger' })) await act(() => api.delete(S.requirementSets.destroy(id)), 'Versión eliminada.') }

async function clone(id: number) {
    const name = await prompt({ title: 'Clonar versión', label: 'Nombre de la nueva versión (copia)', inputType: 'text', required: true, confirmText: 'Clonar' })
    if (!name) return
    await act(() => api.post(S.requirementSets.clone(id), { name }), 'Versión clonada.')
}

async function act(fn: () => Promise<any>, ok: string) {
    saving.value = true
    try { await fn(); editing.value = null; await fetchSets(); flash(ok) }
    catch (e: any) { flash(e?.response?.data?.message ?? 'La operación falló.', true) }
    finally { saving.value = false }
}

onMounted(fetchSets)
</script>
