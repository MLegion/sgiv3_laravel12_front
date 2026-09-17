<template>
    <div class="space-y-4 max-w-5xl mx-auto pb-16">
        <div>
            <h1 class="text-xl font-semibold text-slate-800">Tipos de Descarga</h1>
            <p class="text-sm text-slate-500">
                Asocia cada tipo de hora de descarga a un <strong>rubro</strong> de la rúbrica y, si quieres,
                a un <strong>criterio</strong> concreto. Con criterio, el tipo absorbe sólo las horas de ese criterio.
                Los cambios se guardan al momento.
            </p>
        </div>

        <div class="bg-white border rounded-xl shadow-sm p-4">
            <div class="mb-3">
                <input
                    v-model="search"
                    type="text"
                    placeholder="Buscar tipo…"
                    class="w-full sm:w-72 h-9 px-3 border border-slate-300 rounded-lg text-sm"
                />
            </div>

            <div v-if="loading" class="py-8 text-center text-slate-400">Cargando…</div>

            <div v-else-if="!filtered.length" class="py-8 text-center text-slate-400">
                No hay tipos de hora de descarga activos en este plantel.
            </div>

            <table v-else class="w-full text-sm">
                <thead>
                    <tr class="text-left text-xs font-semibold uppercase text-slate-500 border-b">
                        <th class="py-2 pr-3">Tipo de descarga</th>
                        <th class="py-2 pr-3 w-56">Rubro</th>
                        <th class="py-2 pr-3 w-72">Criterio (opcional)</th>
                        <th class="py-2 w-10"></th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="t in filtered" :key="t.id" class="border-b last:border-0">
                        <td class="py-2 pr-3">
                            <span class="font-medium text-slate-700">{{ t.name }}</span>
                            <span v-if="t.shortName" class="text-slate-400 ml-1">· {{ t.shortName }}</span>
                        </td>
                        <td class="py-2 pr-3">
                            <select
                                v-model="t.rubricRubroId"
                                class="w-full h-9 px-2 border border-slate-300 rounded-lg text-sm"
                                @change="onRubroChange(t)"
                            >
                                <option :value="null">— Sin asignar —</option>
                                <option v-for="r in rubros" :key="r.id" :value="r.id">{{ r.name }}</option>
                            </select>
                        </td>
                        <td class="py-2 pr-3">
                            <select
                                v-model="t.rubricCriterionId"
                                class="w-full h-9 px-2 border border-slate-300 rounded-lg text-sm disabled:bg-slate-50 disabled:text-slate-400"
                                :disabled="!t.rubricRubroId"
                                @change="save(t)"
                            >
                                <option :value="null">— Todo el rubro —</option>
                                <option v-for="c in criteriaFor(t.rubricRubroId)" :key="c.id" :value="c.id">{{ c.name }}</option>
                            </select>
                        </td>
                        <td class="py-2 text-center">
                            <span v-if="savingId === t.id" class="text-slate-400 text-xs">…</span>
                            <span v-else-if="savedId === t.id" class="text-emerald-600 text-xs">✓</span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'

interface DescargaType {
    id: number
    name: string
    shortName: string | null
    rubricRubroId: number | null
    rubricCriterionId: number | null
}
interface Rubro { id: number; name: string }
interface Criterion { id: number; name: string; rubricRubroId: number | null }

const toast = useToast()
const A = API.MIDOCENCIA_API.descargaTypes

const loading = ref(true)
const types = ref<DescargaType[]>([])
const rubros = ref<Rubro[]>([])
const criteria = ref<Criterion[]>([])
const search = ref('')
const savingId = ref<number | null>(null)
const savedId = ref<number | null>(null)

const filtered = computed(() => {
    const q = search.value.trim().toUpperCase()
    if (!q) return types.value
    return types.value.filter(t => (t.name || '').toUpperCase().includes(q) || (t.shortName || '').toUpperCase().includes(q))
})

function criteriaFor(rubroId: number | null): Criterion[] {
    if (!rubroId) return []
    return criteria.value.filter(c => c.rubricRubroId === rubroId)
}

onMounted(load)

async function load() {
    loading.value = true
    try {
        const { data } = await api.get(A.list)
        types.value = data.types ?? []
        rubros.value = data.rubros ?? []
        criteria.value = data.criteria ?? []
    } catch (e: any) {
        toast.error(e?.response?.data?.message ?? 'No se pudieron cargar los tipos de descarga.')
    } finally {
        loading.value = false
    }
}

// Al cambiar el rubro, el criterio anterior deja de ser válido: se limpia.
function onRubroChange(t: DescargaType) {
    t.rubricCriterionId = null
    save(t)
}

async function save(t: DescargaType) {
    savingId.value = t.id
    savedId.value = null
    try {
        await api.put(A.update(t.id), {
            rubric_rubro_id: t.rubricRubroId,
            rubric_criterion_id: t.rubricCriterionId,
        })
        savedId.value = t.id
        setTimeout(() => { if (savedId.value === t.id) savedId.value = null }, 1500)
    } catch (e: any) {
        toast.error(e?.response?.data?.message ?? 'No se pudo guardar el cambio.')
        await load()
    } finally {
        savingId.value = null
    }
}
</script>
