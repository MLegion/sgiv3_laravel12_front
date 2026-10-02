<template>
    <div v-if="requiredContexts.length" class="mt-4 space-y-4 rounded-lg border border-amber-200 bg-amber-50/50 p-4">
        <p class="text-xs font-semibold uppercase tracking-wide text-amber-700">
            Contexto por defecto del rol
        </p>
        <p class="text-xs text-amber-700/80 -mt-2">
            Este rol requiere contexto. Lo definido aquí se aplica al asignar el puesto o al
            propagar el rol; puede sobrescribirse por el contexto de cada empleado.
        </p>

        <!-- MODO OFERTA: carrera + modalidad → se eligen pares (modalidad → carrera) -->
        <div v-if="offerMode" class="space-y-1.5">
            <label class="block text-xs font-semibold text-slate-600 uppercase">
                Ofertas que gestiona <span class="text-red-500">*</span>
            </label>
            <p class="text-xs text-slate-400 -mt-1">
                Cada oferta es una modalidad + carrera. Marca las que este rol podrá gestionar.
            </p>
            <div v-if="loadingOffers" class="text-xs text-slate-400">Cargando ofertas…</div>
            <div v-else class="grid grid-cols-1 gap-1.5 max-h-56 overflow-y-auto border rounded-lg p-2 bg-white">
                <label
                    v-for="o in offers"
                    :key="o.offer_id"
                    class="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-50 cursor-pointer"
                >
                    <input
                        type="checkbox"
                        :checked="isPairChecked(o.modality_id, o.career_id)"
                        class="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        @change="togglePair(o.modality_id, o.career_id, ($event.target as HTMLInputElement).checked)"
                    />
                    <span class="text-sm text-slate-700">{{ o.label }}</span>
                </label>
                <p v-if="!offers.length" class="text-xs text-slate-400">
                    No hay oferta educativa activa en el plantel. Crea/activa ofertas para poder asignar este rol.
                </p>
            </div>
            <p v-if="selectedPairs.length" class="text-xs text-blue-600 font-semibold">
                {{ selectedPairs.length }} oferta(s) seleccionada(s)
            </p>
        </div>

        <!-- MODO PLANO: un solo contexto (campus, etc.) -->
        <template v-else>
            <div v-for="ctx in requiredContexts" :key="ctx.alias" class="space-y-1.5">
                <label class="block text-xs font-semibold text-slate-600 uppercase">
                    {{ aliasLabel(ctx.alias) }}
                    <span v-if="ctx.is_required" class="text-red-500">*</span>
                </label>

                <div v-if="loading[ctx.alias]" class="text-xs text-slate-400">Cargando…</div>

                <div
                    v-else-if="ctx.is_multiple"
                    class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-44 overflow-y-auto border rounded-lg p-2 bg-white"
                >
                    <label
                        v-for="opt in options[ctx.alias] || []"
                        :key="opt.id"
                        class="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-50 cursor-pointer"
                    >
                        <input
                            type="checkbox"
                            :value="opt.id"
                            :checked="isChecked(ctx.alias, opt.id)"
                            class="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            @change="toggleMulti(ctx.alias, opt.id, ($event.target as HTMLInputElement).checked)"
                        />
                        <span class="text-sm text-slate-700">{{ opt.name }}</span>
                    </label>
                    <p v-if="!(options[ctx.alias] || []).length" class="text-xs text-slate-400 col-span-2">
                        Sin opciones disponibles
                    </p>
                </div>

                <select
                    v-else
                    class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    :value="singleValue(ctx.alias)"
                    @change="setSingle(ctx.alias, ($event.target as HTMLSelectElement).value)"
                >
                    <option value="">Seleccionar…</option>
                    <option v-for="opt in options[ctx.alias] || []" :key="opt.id" :value="opt.id">
                        {{ opt.name }}
                    </option>
                </select>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'

interface RequiredContext {
    alias: string
    is_required: boolean
    is_multiple: boolean
}
interface Option { id: number; name: string }
interface OfferOption { offer_id: number; modality_id: number; career_id: number; label: string }
interface Pair { modality: number; career: number }

const props = defineProps<{
    requiredContexts: RequiredContext[]
    modelValue: Record<string, any> | null
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', v: Record<string, any> | null): void
}>()

/* -------------------------------------------------------------------------- */
/* MODO OFERTA (carrera + modalidad) → pares                                   */
/* -------------------------------------------------------------------------- */
const offerMode = computed(() => {
    const aliases = props.requiredContexts.map(c => c.alias)
    return aliases.includes('career') && aliases.includes('modality')
})

const offers = ref<OfferOption[]>([])
const loadingOffers = ref(false)

const selectedPairs = computed<Pair[]>(() => {
    const p = props.modelValue?.pairs
    return Array.isArray(p) ? p : []
})

async function fetchOffers() {
    loadingOffers.value = true
    try {
        const { data } = await api.get(API.SHR_API.jobPosition.offerOptions)
        offers.value = (data.items ?? []) as OfferOption[]
    } catch {
        offers.value = []
    } finally {
        loadingOffers.value = false
    }
}

function isPairChecked(modality: number, career: number): boolean {
    return selectedPairs.value.some(p => p.modality === modality && p.career === career)
}
function togglePair(modality: number, career: number, checked: boolean) {
    const list = selectedPairs.value.filter(p => !(p.modality === modality && p.career === career))
    if (checked) list.push({ modality, career })
    emit('update:modelValue', list.length ? { pairs: list } : null)
}

/* -------------------------------------------------------------------------- */
/* MODO PLANO (un solo contexto: campus, etc.)                                 */
/* -------------------------------------------------------------------------- */
const options = reactive<Record<string, Option[]>>({})
const loading = reactive<Record<string, boolean>>({})

function aliasLabel(alias: string): string {
    return { career: 'Carreras', campus: 'Campus', modality: 'Modalidades' }[alias] ?? alias
}

async function fetchOptions(alias: string) {
    loading[alias] = true
    try {
        const { data } = await api.get(API.SHR_API.jobPosition.contextOptions(alias))
        options[alias] = (data.items ?? []) as Option[]
    } catch {
        options[alias] = []
    } finally {
        loading[alias] = false
    }
}

/* -------------------------------------------------------------------------- */
/* CARGA SEGÚN EL ROL SELECCIONADO                                             */
/* -------------------------------------------------------------------------- */
watch(
    () => props.requiredContexts,
    (list) => {
        if (offerMode.value) {
            fetchOffers()
            // Migra formato viejo {career:[],modality:[]} → pares (producto), una sola vez.
            migrateFlatToPairsIfNeeded()
        } else {
            for (const c of list) fetchOptions(c.alias)
            prune(list.map(c => c.alias))
        }
    },
    { immediate: true, deep: true },
)

/** Si venía en formato plano (career[]+modality[]), lo convierte a pares. */
function migrateFlatToPairsIfNeeded() {
    const v = props.modelValue
    if (!v || Array.isArray(v.pairs)) return
    const careers = Array.isArray(v.career) ? v.career : (v.career ? [v.career] : [])
    const mods = Array.isArray(v.modality) ? v.modality : (v.modality ? [v.modality] : [])
    if (!careers.length || !mods.length) return
    const pairs: Pair[] = []
    for (const m of mods) for (const c of careers) pairs.push({ modality: m, career: c })
    emit('update:modelValue', { pairs })
}

function prune(allowed: string[]) {
    const v = { ...(props.modelValue ?? {}) }
    let changed = false
    for (const k of Object.keys(v)) {
        if (! allowed.includes(k)) { delete v[k]; changed = true }
    }
    if (changed) emit('update:modelValue', Object.keys(v).length ? v : null)
}

/* --- múltiple (modo plano) --- */
function isChecked(alias: string, id: number): boolean {
    const val = props.modelValue?.[alias]
    return Array.isArray(val) && val.includes(id)
}
function toggleMulti(alias: string, id: number, checked: boolean) {
    const v = { ...(props.modelValue ?? {}) }
    const arr = Array.isArray(v[alias]) ? [...(v[alias] as number[])] : []
    const idx = arr.indexOf(id)
    if (checked && idx === -1) arr.push(id)
    if (! checked && idx !== -1) arr.splice(idx, 1)
    if (arr.length) v[alias] = arr
    else delete v[alias]
    emit('update:modelValue', Object.keys(v).length ? v : null)
}

/* --- único (modo plano) --- */
function singleValue(alias: string): string {
    const val = props.modelValue?.[alias]
    return val != null && ! Array.isArray(val) ? String(val) : ''
}
function setSingle(alias: string, raw: string) {
    const v = { ...(props.modelValue ?? {}) }
    const id = parseInt(raw, 10)
    if (id > 0) v[alias] = id
    else delete v[alias]
    emit('update:modelValue', Object.keys(v).length ? v : null)
}
</script>
