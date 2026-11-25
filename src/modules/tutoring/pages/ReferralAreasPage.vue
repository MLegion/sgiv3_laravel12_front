<template>
    <div class="space-y-5">
        <div class="flex flex-wrap items-center justify-between gap-2">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Áreas de Canalización</h1>
            <button @click="openNew" class="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold">+ Área</button>
        </div>
        <p v-if="msg" class="text-sm px-4 py-2.5 rounded-lg" :class="msgError ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'">{{ msg }}</p>

        <DataTable :columns="columns" :rows="areas" hide-search caption="Áreas de canalización" empty-text="Sin áreas.">
            <template #cell-name="{ row }">
                <p class="font-semibold text-slate-700">{{ row.name }}</p>
                <p class="text-xs text-slate-400">{{ row.description }}</p>
            </template>
            <template #cell-handler_role_code="{ row }">
                <span class="text-slate-600 text-xs">{{ row.handler_role_code ?? '— (genérico)' }}</span>
            </template>
            <template #cell-scope="{ row }">
                <span class="text-xs px-2 py-0.5 rounded-full" :class="row.is_global ? 'bg-slate-100 text-slate-500' : 'bg-sky-100 text-sky-700'">{{ row.is_global ? 'Global' : 'Plantel' }}</span>
            </template>
            <template #cell-is_active="{ row }">{{ row.is_active ? 'Sí' : 'No' }}</template>
            <template #cell-actions="{ row }">
                <template v-if="!row.is_global">
                    <button @click="edit(row)" class="text-xs text-slate-500 font-semibold mr-2">Editar</button>
                    <button @click="destroy(row.id)" class="text-xs text-red-600 font-semibold">Eliminar</button>
                </template>
                <span v-else class="text-xs text-slate-300">solo lectura</span>
            </template>
        </DataTable>

        <BaseModal v-model="showModal" :title="(form.id ? 'Editar' : 'Nueva') + ' área'" size="md">
            <div class="space-y-3">
                <input v-model="form.name" placeholder="Nombre" aria-label="Nombre del área" class="w-full rounded-lg border-slate-300 text-sm" />
                <textarea v-model="form.description" rows="2" placeholder="Descripción" aria-label="Descripción del área" class="w-full rounded-lg border-slate-300 text-sm"></textarea>
                <label class="block"><span class="text-xs font-semibold text-slate-500">Rol receptor (código, opcional)</span>
                    <input v-model="form.handler_role_code" placeholder="p. ej. TUTORING_REFERRAL_HANDLER" class="mt-1 w-full rounded-lg border-slate-300 text-sm" /></label>
                <label v-if="form.id" class="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" v-model="form.is_active" /> Activa</label>
                <p v-if="modalMsg" class="text-sm text-red-600">{{ modalMsg }}</p>
            </div>
            <template #footer>
                <button @click="showModal = false" class="px-4 py-2 rounded-lg border text-sm">Cancelar</button>
                <button @click="save" :disabled="!form.name" class="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold disabled:opacity-50">Guardar</button>
            </template>
        </BaseModal>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { ReferralArea } from '@/modules/tutoring/types/tutoring.type'
import BaseModal from '@/app/components/ui/modal/BaseModal.vue'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'
import { useConfirm } from '@/app/composables/useConfirm'

const T = API.TUTORING_API
const { confirm } = useConfirm()
const areas = ref<ReferralArea[]>([])
const columns: DataTableColumn<ReferralArea>[] = [
    { key: 'name', label: 'Área' },
    { key: 'handler_role_code', label: 'Rol receptor' },
    { key: 'scope', label: 'Ámbito' },
    { key: 'is_active', label: 'Activa' },
    { key: 'actions', label: '', align: 'right' },
]
const showModal = ref(false), msg = ref(''), msgError = ref(false), modalMsg = ref('')
const form = reactive<{ id: number | null; name: string; description: string; handler_role_code: string; is_active: boolean; sort_order: number }>({ id: null, name: '', description: '', handler_role_code: '', is_active: true, sort_order: 0 })

function flash(t: string, e = false) { msg.value = t; msgError.value = e; setTimeout(() => (msg.value = ''), 4000) }
async function fetchAreas() { areas.value = (await api.get(T.referralAreas.list, { params: { all: 1 } })).data ?? [] }
function openNew() { Object.assign(form, { id: null, name: '', description: '', handler_role_code: '', is_active: true, sort_order: 0 }); modalMsg.value = ''; showModal.value = true }
function edit(a: ReferralArea) { Object.assign(form, { id: a.id, name: a.name, description: a.description ?? '', handler_role_code: a.handler_role_code ?? '', is_active: a.is_active, sort_order: a.sort_order }); modalMsg.value = ''; showModal.value = true }
async function save() {
    modalMsg.value = ''
    const payload = { name: form.name, description: form.description || null, handler_role_code: form.handler_role_code || null, is_active: form.is_active, sort_order: form.sort_order }
    try { if (form.id) await api.put(T.referralAreas.update(form.id), payload); else await api.post(T.referralAreas.create, payload); showModal.value = false; await fetchAreas(); flash('Área guardada.') }
    catch (e: any) { modalMsg.value = e?.response?.data?.message ?? 'Error' }
}
async function destroy(id: number) { if (!await confirm({ title: 'Eliminar área', message: '¿Eliminar área?', confirmText: 'Eliminar', variant: 'danger' })) return; try { await api.delete(T.referralAreas.delete(id)); await fetchAreas(); flash('Área eliminada.') } catch (e: any) { flash(e?.response?.data?.message ?? 'Error', true) } }

onMounted(fetchAreas)
</script>
