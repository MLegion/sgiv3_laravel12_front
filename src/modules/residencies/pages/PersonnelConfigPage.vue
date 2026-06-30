<template>
    <div class="space-y-6">
        <h1 class="text-xl font-semibold text-slate-800 uppercase">Configuración de personal externo</h1>

        <!-- Puestos globales -->
        <section class="rounded-xl border bg-white p-5 space-y-3">
            <div class="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h2 class="text-sm font-bold text-slate-700 uppercase">Catálogo de puestos</h2>
                    <p class="text-xs text-slate-400">Puestos globales que se asignan al personal externo de las empresas.</p>
                </div>
                <div class="flex items-center gap-2">
                    <input v-model="search" placeholder="Buscar…" class="border rounded-md px-2 py-1 text-xs" @keyup.enter="loadPositions" />
                    <button type="button" class="text-sm px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700" @click="openNew">+ Nuevo puesto</button>
                </div>
            </div>

            <div v-if="loadingPos" class="text-sm text-slate-400">Cargando…</div>
            <p v-else-if="!positions.length" class="text-sm text-slate-400 italic">Sin puestos.</p>
            <ul v-else class="divide-y border rounded-lg">
                <li v-for="p in positions" :key="p.id" class="flex items-center justify-between px-4 py-2.5">
                    <div class="flex items-center gap-2">
                        <span class="text-sm text-slate-700">{{ p.name }}</span>
                        <span v-if="!p.is_active" class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">INACTIVO</span>
                    </div>
                    <button type="button" class="text-xs px-3 py-1 border rounded-md hover:bg-slate-50" @click="openEdit(p)">Editar</button>
                </li>
            </ul>
        </section>

        <!-- Ajustes -->
        <section class="rounded-xl border bg-white p-5 space-y-4">
            <div>
                <h2 class="text-sm font-bold text-slate-700 uppercase">Ajustes</h2>
                <p class="text-xs text-slate-400">Delegación de revisión y purga del personal no aceptado.</p>
            </div>
            <div v-if="settings" class="space-y-4 max-w-lg">
                <label class="flex items-start gap-3">
                    <input v-model="settings.delegateReview" type="checkbox" class="mt-0.5" />
                    <span class="text-sm text-slate-700">
                        Delegar la validación de personal al <strong>jefe de carrera</strong>
                        <span class="block text-xs text-slate-400">Si está activo, el jefe de carrera también puede aprobar/rechazar al personal externo (además del coordinador).</span>
                    </span>
                </label>
                <div class="grid sm:grid-cols-2 gap-3">
                    <label class="text-sm">
                        <span class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Purgar rechazados tras (días)</span>
                        <input v-model.number="settings.rejectedPurgeDays" type="number" min="1" max="365" class="border rounded-md px-3 py-2 text-sm w-full" />
                    </label>
                    <label class="text-sm">
                        <span class="block text-[11px] font-bold text-slate-500 uppercase mb-1">Purgar pendientes abandonados tras (días)</span>
                        <input v-model.number="settings.pendingPurgeDays" type="number" min="1" max="365" class="border rounded-md px-3 py-2 text-sm w-full" />
                    </label>
                </div>
                <button type="button" :disabled="savingSettings" class="text-sm px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50" @click="saveSettings">Guardar ajustes</button>
            </div>
        </section>

        <!-- Modal puesto -->
        <Teleport to="body">
            <div v-if="form.open" class="fixed inset-0 z-50 flex items-center justify-center">
                <div class="absolute inset-0 bg-black/40" @click="form.open = false" />
                <div class="relative bg-white rounded-xl shadow-lg w-full max-w-md p-6 space-y-4 z-10">
                    <h3 class="text-sm font-semibold text-slate-800">{{ form.id ? 'Editar puesto' : 'Nuevo puesto' }}</h3>
                    <input v-model="form.name" placeholder="Nombre del puesto" class="border rounded-md w-full px-3 py-2 text-sm uppercase placeholder:normal-case" />
                    <label class="flex items-center gap-2 text-sm text-slate-700"><input v-model="form.is_active" type="checkbox" /> Activo</label>
                    <p v-if="form.error" class="text-xs text-red-600">{{ form.error }}</p>
                    <div class="flex justify-end gap-2">
                        <button type="button" class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-100" @click="form.open = false">Cancelar</button>
                        <button type="button" :disabled="!form.name || form.saving" class="px-4 py-2 text-sm rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50" @click="savePosition">Guardar</button>
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
import { useToast } from '@/app/composables/useToast'
import type { ExternalJobPosition, PersonnelSettings } from '@/modules/residencies/types/residency.type'

const R = API.RESIDENCIES_API

/* ── Puestos ── */
const positions = ref<ExternalJobPosition[]>([])
const loadingPos = ref(false)
const search = ref('')

async function loadPositions() {
    loadingPos.value = true
    try {
        const { data } = await api.get(R.jobPositions.list, { params: { search: search.value || undefined } })
        positions.value = data ?? []
    } finally { loadingPos.value = false }
}

const form = reactive<{ open: boolean; id: number | null; name: string; is_active: boolean; saving: boolean; error: string | null }>({
    open: false, id: null, name: '', is_active: true, saving: false, error: null,
})
function openNew() { form.open = true; form.id = null; form.name = ''; form.is_active = true; form.error = null }
function openEdit(p: ExternalJobPosition) { form.open = true; form.id = p.id; form.name = p.name; form.is_active = p.is_active; form.error = null }

async function savePosition() {
    if (!form.name.trim()) return
    form.saving = true; form.error = null
    try {
        const payload = { name: form.name, is_active: form.is_active }
        if (form.id) await api.put(R.jobPositions.update(form.id), payload)
        else await api.post(R.jobPositions.create, payload)
        form.open = false
        await loadPositions()
        useToast().success('Puesto guardado.')
    } catch (e: any) {
        form.error = e?.response?.data?.message ?? 'No se pudo guardar.'
    } finally { form.saving = false }
}

/* ── Ajustes ── */
const settings = ref<PersonnelSettings | null>(null)
const savingSettings = ref(false)

async function loadSettings() {
    try { const { data } = await api.get(R.personnel.settings); settings.value = data }
    catch { settings.value = null }
}

async function saveSettings() {
    if (!settings.value) return
    savingSettings.value = true
    try {
        await api.put(R.personnel.settings, {
            delegate_review:     settings.value.delegateReview,
            rejected_purge_days: settings.value.rejectedPurgeDays,
            pending_purge_days:  settings.value.pendingPurgeDays,
        })
        useToast().success('Ajustes guardados.')
    } catch (e: any) {
        useToast().error(e?.response?.data?.message ?? 'No se pudieron guardar los ajustes.')
    } finally { savingSettings.value = false }
}

loadPositions()
loadSettings()
</script>
