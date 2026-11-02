<template>
    <div class="space-y-5">
        <div>
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Lugares por categoría</h1>
            <p class="text-xs text-slate-400">Habilita qué lugares del plantel puede usar cada categoría de actividad al armar su horario (como “lugar por carrera” pero para complementarias y extraescolares).</p>
        </div>

        <div class="flex items-center gap-2">
            <button v-for="c in CATEGORIES" :key="c.value" @click="selectCategory(c.value)"
                class="px-4 py-2 rounded-lg text-sm font-semibold border"
                :class="category === c.value ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-300'">
                {{ c.label }}
            </button>
        </div>

        <section class="rounded-xl border bg-white p-4 space-y-3">
            <div class="flex items-center justify-between">
                <h2 class="text-sm font-bold uppercase text-slate-500">Lugares ({{ selectedCount }} / {{ places.length }})</h2>
                <div class="flex items-center gap-2">
                    <button @click="toggleAll(true)" class="text-xs text-emerald-600 hover:underline">Todos</button>
                    <button @click="toggleAll(false)" class="text-xs text-slate-400 hover:underline">Ninguno</button>
                </div>
            </div>
            <p v-if="!places.length" class="text-sm text-slate-400">No hay lugares registrados en el plantel.</p>
            <div v-else class="grid sm:grid-cols-2 lg:grid-cols-3 gap-1 max-h-[480px] overflow-y-auto">
                <label v-for="p in places" :key="p.id" class="flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-slate-50 cursor-pointer">
                    <input type="checkbox" v-model="p.assigned" class="rounded border-slate-300 text-emerald-600" />
                    <span>{{ p.name }}<span v-if="p.building_name" class="text-[11px] text-slate-400"> · {{ p.building_name }}</span></span>
                </label>
            </div>
            <div class="pt-1">
                <button @click="save" :disabled="saving" class="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50">Guardar lugares</button>
            </div>
        </section>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'

const AC = API.AC_API
const toast = useToast()

const CATEGORIES = [
    { value: 'complementaria', label: 'Complementarias' },
    { value: 'extraescolar', label: 'Extraescolares' },
]
const category = ref('complementaria')
const places = ref<any[]>([])
const saving = ref(false)
const selectedCount = computed(() => places.value.filter(p => p.assigned).length)

async function load() {
    try {
        const { data } = await api.get(AC.categoryPlaces, { params: { category: category.value } })
        places.value = (data ?? []).map((p: any) => ({ ...p, assigned: !!p.assigned }))
    } catch { places.value = [] }
}
function selectCategory(c: string) { category.value = c; load() }
function toggleAll(v: boolean) { places.value.forEach(p => (p.assigned = v)) }
async function save() {
    saving.value = true
    try {
        await api.put(AC.categoryPlaces, { category: category.value, place_ids: places.value.filter(p => p.assigned).map(p => p.id) })
        toast.success('Lugares guardados.')
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudo guardar.') }
    finally { saving.value = false }
}

onMounted(load)
</script>
