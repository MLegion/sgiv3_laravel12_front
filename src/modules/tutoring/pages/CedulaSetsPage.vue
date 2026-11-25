<template>
    <div class="space-y-5">
        <div class="flex flex-wrap items-center justify-between gap-2">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Instrumento de Cédula</h1>
            <button @click="openNew" class="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold">+ Versión</button>
        </div>
        <p v-if="msg" class="text-sm px-4 py-2.5 rounded-lg" :class="msgError ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'">{{ msg }}</p>

        <DataTable :columns="columns" :rows="sets" hide-search caption="Versiones de cédula" empty-text="Sin versiones.">
            <template #cell-name="{ row }"><span class="font-semibold text-slate-700">{{ row.name }}</span></template>
            <template #cell-scope="{ row }"><span class="text-xs px-2 py-0.5 rounded-full" :class="row.is_global ? 'bg-slate-100 text-slate-500' : 'bg-sky-100 text-sky-700'">{{ row.is_global ? 'Global' : 'Plantel' }}</span></template>
            <template #cell-effective_from="{ row }"><span class="text-slate-500">{{ row.effective_from ?? '—' }}</span></template>
            <template #cell-fields_count="{ row }"><span class="text-slate-600">{{ row.fields_count }}</span></template>
            <template #cell-status="{ row }"><span class="px-2 py-0.5 rounded-full text-xs font-bold" :class="statusClass(row.status)">{{ statusLabel(row.status) }}</span></template>
            <template #cell-actions="{ row }">
                <button @click="edit(row.id)" class="text-xs text-slate-500 font-semibold mr-2">{{ row.is_global ? 'Ver' : 'Editar' }}</button>
                <button @click="clone(row.id)" class="text-xs text-blue-600 font-semibold mr-2">Clonar</button>
                <button v-if="!row.is_global && row.status === 'draft'" @click="publish(row.id)" class="text-xs text-emerald-600 font-semibold mr-2">Publicar</button>
                <button v-if="!row.is_global && row.status === 'published'" @click="archive(row.id)" class="text-xs text-amber-600 font-semibold mr-2">Archivar</button>
                <button v-if="!row.is_global && row.status === 'draft'" @click="destroy(row.id)" class="text-xs text-red-600 font-semibold">Eliminar</button>
            </template>
        </DataTable>

        <div v-if="editing" class="rounded-xl border bg-white p-5 space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
                <h2 class="text-sm font-bold text-slate-700 uppercase">{{ editing.name }} <span class="text-slate-400">({{ statusLabel(editing.status) }})</span></h2>
                <button @click="editing = null" class="text-xs text-slate-400">Cerrar</button>
            </div>
            <div class="space-y-2">
                <div v-for="(f, i) in editing.fields" :key="i" class="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                    <input v-model="f.code" :disabled="readonly" placeholder="CODE" aria-label="Código del campo" class="col-span-2 rounded-lg border-slate-300 text-xs uppercase" />
                    <input v-model="f.label" :disabled="readonly" placeholder="Etiqueta" aria-label="Etiqueta del campo" class="col-span-4 rounded-lg border-slate-300 text-xs" />
                    <select v-model="f.type" :disabled="readonly" aria-label="Tipo de campo" class="col-span-2 rounded-lg border-slate-300 text-xs">
                        <option value="text">Texto</option><option value="textarea">Párrafo</option><option value="number">Número</option><option value="boolean">Sí/No</option><option value="select">Lista</option>
                    </select>
                    <label class="col-span-2 text-xs flex items-center gap-1"><input type="checkbox" v-model="f.is_risk_flag" :disabled="readonly" /> Riesgo</label>
                    <label class="col-span-1 text-xs flex items-center gap-1"><input type="checkbox" v-model="f.is_required" :disabled="readonly" /> Req</label>
                    <button v-if="!readonly" @click="editing.fields.splice(i, 1)" aria-label="Eliminar campo" class="col-span-1 text-red-500 text-xs">✕</button>
                </div>
            </div>
            <div v-if="!readonly" class="flex items-center gap-2">
                <button @click="editing.fields.push({ code: '', label: '', type: 'text', is_required: false, is_risk_flag: false })" class="text-xs text-blue-600 font-semibold">+ Campo</button>
                <button @click="saveFields" class="ml-auto px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold">Guardar campos</button>
            </div>
            <p v-else class="text-xs text-slate-400">La versión global es de solo lectura. Clónala para personalizarla.</p>
        </div>

        <BaseModal v-model="showNew" title="Nueva versión" size="md">
            <div class="space-y-3">
                <input v-model="nf.name" placeholder="Nombre" aria-label="Nombre de la versión" class="w-full rounded-lg border-slate-300 text-sm" />
                <label class="block"><span class="text-xs font-semibold text-slate-500">Vigente desde</span><input v-model="nf.effective_from" type="date" class="mt-1 w-full rounded-lg border-slate-300 text-sm" /></label>
            </div>
            <template #footer>
                <button @click="showNew = false" class="px-4 py-2 rounded-lg border text-sm">Cancelar</button>
                <button @click="create" :disabled="!nf.name" class="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold disabled:opacity-50">Crear</button>
            </template>
        </BaseModal>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { CedulaSetSummary } from '@/modules/tutoring/types/tutoring.type'
import BaseModal from '@/app/components/ui/modal/BaseModal.vue'
import { usePrompt } from '@/app/composables/usePrompt'
import { useConfirm } from '@/app/composables/useConfirm'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'

const columns: DataTableColumn<CedulaSetSummary>[] = [
    { key: 'name', label: 'Versión' },
    { key: 'scope', label: 'Ámbito' },
    { key: 'effective_from', label: 'Vigente' },
    { key: 'fields_count', label: 'Campos' },
    { key: 'status', label: 'Estado' },
    { key: 'actions', label: '', align: 'right' },
]

const T = API.TUTORING_API
const { prompt } = usePrompt()
const { confirm } = useConfirm()
const sets = ref<CedulaSetSummary[]>([])
const editing = ref<any | null>(null)
const showNew = ref(false), msg = ref(''), msgError = ref(false)
const nf = reactive({ name: '', effective_from: '' })
const readonly = computed(() => editing.value?.is_global || editing.value?.status !== 'draft')

function statusClass(s: string) { return { draft: 'bg-slate-100 text-slate-600', published: 'bg-emerald-100 text-emerald-700', archived: 'bg-amber-100 text-amber-700' }[s] ?? 'bg-slate-100' }
function statusLabel(s: string) { return { draft: 'Borrador', published: 'Publicada', archived: 'Archivada' }[s] ?? s }
function flash(t: string, e = false) { msg.value = t; msgError.value = e; setTimeout(() => (msg.value = ''), 4000) }

async function fetchSets() { sets.value = (await api.get(T.cedulaSets.list)).data ?? [] }
function openNew() { nf.name = ''; nf.effective_from = ''; showNew.value = true }
async function create() { try { await api.post(T.cedulaSets.create, { name: nf.name, effective_from: nf.effective_from || null }); showNew.value = false; await fetchSets(); flash('Versión creada.') } catch (e: any) { flash(e?.response?.data?.message ?? 'Error', true) } }
async function edit(id: number) { const { data } = await api.get(T.cedulaSets.byId(id)); editing.value = { ...data, fields: (data.fields ?? []).map((f: any) => ({ ...f })) } }
async function saveFields() { try { await api.put(T.cedulaSets.saveFields(editing.value.id), { fields: editing.value.fields }); await edit(editing.value.id); await fetchSets(); flash('Campos guardados.') } catch (e: any) { flash(e?.response?.data?.message ?? 'Error', true) } }
async function publish(id: number) { await act(() => api.post(T.cedulaSets.publish(id), {}), 'Publicada.') }
async function archive(id: number) { await act(() => api.post(T.cedulaSets.archive(id), {}), 'Archivada.') }
async function destroy(id: number) { if (await confirm({ title: 'Eliminar borrador', message: '¿Eliminar borrador?', confirmText: 'Eliminar', variant: 'danger' })) await act(() => api.delete(T.cedulaSets.destroy(id)), 'Eliminada.') }
async function clone(id: number) { const name = await prompt({ title: 'Clonar cédula', label: 'Nombre de la copia', required: true, confirmText: 'Clonar' }); if (!name) return; await act(() => api.post(T.cedulaSets.clone(id), { name }), 'Clonada.') }
async function act(fn: () => Promise<any>, ok: string) { try { await fn(); editing.value = null; await fetchSets(); flash(ok) } catch (e: any) { flash(e?.response?.data?.message ?? 'Error', true) } }

onMounted(fetchSets)
</script>
