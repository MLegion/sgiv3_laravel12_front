<template>
    <div class="space-y-4 max-w-6xl mx-auto">
        <!-- Header -->
        <div class="flex items-center justify-between flex-wrap gap-3">
            <div>
                <h1 class="text-xl font-semibold text-slate-800 uppercase">Rúbrica de Función Académica</h1>
                <p class="text-sm text-slate-500">Criterios, productos y evidencias por versión. Solo lectura.</p>
            </div>
        </div>

        <!-- Selector de versión + acciones -->
        <div class="bg-white border rounded-xl shadow-sm p-4 space-y-3">
            <div class="flex flex-wrap items-end gap-3">
                <div class="w-96 max-w-full">
                    <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Versión</label>
                    <select
                        v-model.number="selectedId"
                        class="w-full border rounded-lg px-3 py-2 text-sm"
                        :disabled="loadingVersions || versions.length === 0"
                        @change="loadTree"
                    >
                        <option v-if="versions.length === 0" :value="null">
                            {{ loadingVersions ? 'Cargando…' : 'Sin versiones' }}
                        </option>
                        <option v-for="v in versions" :key="v.id" :value="v.id">
                            {{ v.name }} · {{ v.status === 'published' ? 'publicada' : 'borrador' }}
                        </option>
                    </select>
                </div>

                <span
                    v-if="current"
                    class="px-2 py-1 rounded-full text-xs font-semibold"
                    :class="current.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'"
                >
                    {{ current.status === 'published' ? 'Publicada' : 'Borrador' }}
                    <template v-if="current.collegeId === null"> · global</template>
                </span>
            </div>

            <!-- Acciones de gestión (solo autores/promotores) -->
            <div v-if="canManage" class="flex flex-wrap gap-2 pt-2 border-t">
                <button
                    class="px-3 py-1.5 text-sm rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    :disabled="busy || !selectedId"
                    @click="duplicateCurrent"
                >
                    Duplicar esta versión
                </button>
                <button
                    v-if="current && current.status === 'draft' && current.collegeId !== null"
                    class="px-3 py-1.5 text-sm rounded-lg bg-slate-700 text-white hover:bg-slate-800 disabled:opacity-50"
                    :disabled="busy || !selectedId"
                    @click="editCurrent"
                >
                    Editar criterios
                </button>
                <button
                    v-if="current && current.status === 'draft' && current.collegeId !== null"
                    class="px-3 py-1.5 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                    :disabled="busy"
                    @click="publishCurrent"
                >
                    Publicar
                </button>
                <button
                    v-if="current && current.status === 'published'"
                    class="px-3 py-1.5 text-sm rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
                    :disabled="busy"
                    @click="openAssignPeriod"
                >
                    Asignar a periodo
                </button>
            </div>
        </div>

        <!-- Estados -->
        <div v-if="loadingTree" class="text-center py-12 text-slate-400">Cargando rúbrica…</div>
        <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{{ error }}</div>
        <div v-else-if="!current" class="text-center py-12 text-slate-400">
            No hay ninguna versión de rúbrica para mostrar.
        </div>

        <!-- Árbol de la rúbrica (solo lectura) -->
        <div v-else class="space-y-4">
            <div v-for="rubro in rubros" :key="rubro.id" class="bg-white border rounded-xl shadow-sm overflow-hidden">
                <div class="px-4 py-2.5 bg-slate-800 text-white font-bold text-sm uppercase tracking-wide">
                    {{ rubro.name }}
                </div>

                <div class="divide-y">
                    <div v-for="crit in rubro.criteria" :key="crit.id" class="p-4">
                        <div class="flex items-start justify-between gap-3">
                            <h3 class="font-semibold text-slate-800">{{ crit.name }}</h3>
                            <span class="shrink-0 px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-semibold whitespace-nowrap">
                                {{ hoursLabel(crit.hoursMin, crit.hoursMax) }}
                            </span>
                        </div>

                        <!-- Productos -->
                        <div v-if="crit.products.length" class="mt-3 space-y-2">
                            <div
                                v-for="prod in crit.products"
                                :key="prod.id"
                                class="rounded-lg border border-slate-200 bg-slate-50/60 p-3"
                            >
                                <div class="flex items-start justify-between gap-3">
                                    <p class="text-sm text-slate-700">{{ prod.name }}</p>
                                    <span
                                        v-if="prod.hoursMin !== null"
                                        class="shrink-0 px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[11px] font-semibold whitespace-nowrap"
                                    >
                                        horas propias: {{ hoursLabel(prod.hoursMin, prod.hoursMax) }}
                                    </span>
                                </div>
                                <!-- Evidencias pareadas al producto -->
                                <ul v-if="evidencesFor(crit, prod.id).length" class="mt-2 space-y-1">
                                    <li
                                        v-for="ev in evidencesFor(crit, prod.id)"
                                        :key="ev.id"
                                        class="text-xs text-slate-500 flex gap-2"
                                    >
                                        <span class="text-slate-400">•</span>
                                        <span>{{ ev.name }}</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <!-- Evidencias a nivel criterio (sin producto) -->
                        <div v-if="evidencesFor(crit, null).length" class="mt-3">
                            <p class="text-[11px] font-semibold text-slate-400 uppercase mb-1">Evidencias</p>
                            <ul class="space-y-1">
                                <li
                                    v-for="ev in evidencesFor(crit, null)"
                                    :key="ev.id"
                                    class="text-xs text-slate-500 flex gap-2"
                                >
                                    <span class="text-slate-400">•</span>
                                    <span>{{ ev.name }}</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal: elegir periodo (para clonar del anterior o asignar) -->
        <div
            v-if="periodModal.open"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            @click.self="periodModal.open = false"
        >
            <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-5 space-y-4">
                <h3 class="text-lg font-semibold text-slate-800">{{ periodModal.title }}</h3>
                <p class="text-sm text-slate-500">{{ periodModal.hint }}</p>
                <FormRemoteSelect
                    v-model="periodModal.periodId"
                    :endpoint="API.SCHOOL_SERVICES_API.collegeAcademicPeriods.list"
                    :params="{ order_by: 'actual_start_date', order_dir: 'desc', per_page: 100 }"
                    item-label="name"
                    item-value="id"
                    label="Periodo"
                    placeholder="Selecciona un periodo…"
                />
                <div class="flex justify-end gap-2 pt-2">
                    <button
                        class="px-3 py-1.5 text-sm rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                        @click="periodModal.open = false"
                    >
                        Cancelar
                    </button>
                    <button
                        class="px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                        :disabled="busy || !periodModal.periodId"
                        @click="periodModal.confirm"
                    >
                        Aceptar
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'
import FormRemoteSelect from '@/app/components/ui/form/FormRemoteSelect.vue'
import type { RubricVersion, RubricRubro, RubricCriterion, RubricTree } from '@/modules/midocencia/types/rubric.type'

const toast = useToast()
const router = useRouter()

function editCurrent() {
    if (selectedId.value) router.push({ name: 'midocencia.rubric.edit', params: { id: selectedId.value } })
}

const versions = ref<RubricVersion[]>([])
const selectedId = ref<number | null>(null)
const rubros = ref<RubricRubro[]>([])
const current = ref<RubricVersion | null>(null)
const canManage = ref(false)

const loadingVersions = ref(false)
const loadingTree = ref(false)
const busy = ref(false)
const error = ref('')

const periodModal = reactive<{
    open: boolean
    title: string
    hint: string
    periodId: number | null
    confirm: () => void
}>({ open: false, title: '', hint: '', periodId: null, confirm: () => {} })

const R = API.MIDOCENCIA_API.rubrics

onMounted(async () => {
    await Promise.all([loadContext(), loadVersions()])
    if (versions.value.length) {
        selectedId.value = versions.value[0].id
        await loadTree()
    }
})

async function loadContext() {
    try {
        const { data } = await api.get(R.context)
        canManage.value = !!data.canManage
    } catch { canManage.value = false }
}

async function loadVersions() {
    loadingVersions.value = true
    try {
        const { data } = await api.get(R.list)
        versions.value = Array.isArray(data) ? data : (data.items ?? [])
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'No se pudieron cargar las versiones.'
    } finally {
        loadingVersions.value = false
    }
}

async function loadTree() {
    if (!selectedId.value) { current.value = null; rubros.value = []; return }
    loadingTree.value = true
    error.value = ''
    try {
        const { data } = await api.get(R.tree(selectedId.value)) as { data: RubricTree }
        current.value = data.rubric
        rubros.value = data.rubros ?? []
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'No se pudo cargar la rúbrica.'
        current.value = null
        rubros.value = []
    } finally {
        loadingTree.value = false
    }
}

function hoursLabel(min: number | null, max: number | null): string {
    if (min === null && max === null) return ''
    if (min === max) return `${min} hr`
    return `${min}–${max} hrs`
}

function evidencesFor(crit: RubricCriterion, productId: number | null) {
    return crit.evidences.filter(e => (e.productId ?? null) === productId)
}

async function afterMutation(newId?: number) {
    await loadVersions()
    if (newId) selectedId.value = newId
    else if (!versions.value.some(v => v.id === selectedId.value)) selectedId.value = versions.value[0]?.id ?? null
    await loadTree()
}

async function duplicateCurrent() {
    if (!selectedId.value) return
    busy.value = true
    try {
        const { data } = await api.post(R.clone(selectedId.value), {})
        toast.success('Versión duplicada como borrador.')
        await afterMutation(data.id)
    } catch (e: any) {
        toast.error(e?.response?.data?.message ?? 'No se pudo duplicar.')
    } finally { busy.value = false }
}

async function publishCurrent() {
    if (!selectedId.value) return
    busy.value = true
    try {
        await api.post(R.publish(selectedId.value), {})
        toast.success('Versión publicada.')
        await afterMutation(selectedId.value)
    } catch (e: any) {
        toast.error(e?.response?.data?.message ?? 'No se pudo publicar.')
    } finally { busy.value = false }
}

function openAssignPeriod() {
    if (!selectedId.value) return
    periodModal.periodId = null
    periodModal.title = 'Asignar a periodo'
    periodModal.hint = 'La versión seleccionada regirá en el periodo que elijas.'
    periodModal.confirm = async () => {
        if (!periodModal.periodId || !selectedId.value) return
        busy.value = true
        try {
            await api.post(R.assignPeriod(selectedId.value), { college_academic_period_id: periodModal.periodId })
            toast.success('Rúbrica asignada al periodo.')
            periodModal.open = false
        } catch (e: any) {
            toast.error(e?.response?.data?.message ?? 'No se pudo asignar.')
        } finally { busy.value = false }
    }
    periodModal.open = true
}
</script>
