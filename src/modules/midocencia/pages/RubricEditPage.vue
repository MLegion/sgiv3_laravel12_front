<template>
    <div class="space-y-4 max-w-5xl mx-auto pb-16">
        <!-- Header -->
        <div class="flex items-center justify-between flex-wrap gap-3">
            <div>
                <button class="text-sm text-slate-500 hover:text-slate-700" @click="goBack">&larr; Volver</button>
                <h1 class="text-xl font-semibold text-slate-800">
                    Editar rúbrica<span v-if="rubric"> · {{ rubric.name }}</span>
                </h1>
                <p v-if="rubric" class="text-sm text-slate-500">
                    Borrador editable. Los cambios se guardan al instante.
                </p>
            </div>
        </div>

        <div v-if="loading" class="text-center py-12 text-slate-400">Cargando…</div>
        <div v-else-if="fatal" class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{{ fatal }}</div>

        <template v-else>
            <!-- Agregar criterio -->
            <div class="bg-white border rounded-xl shadow-sm p-4">
                <p class="text-sm font-semibold text-slate-700 mb-2">Agregar criterio</p>
                <div class="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
                    <div class="md:col-span-3">
                        <label class="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Rubro</label>
                        <select v-model.number="newCrit.rubricRubroId" class="w-full border rounded-lg px-2 py-1.5 text-sm">
                            <option :value="null" disabled>Elige…</option>
                            <option v-for="r in rubros" :key="r.id" :value="r.id">{{ r.name }}</option>
                        </select>
                    </div>
                    <div class="md:col-span-5">
                        <label class="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Nombre</label>
                        <input v-model="newCrit.name" class="w-full border rounded-lg px-2 py-1.5 text-sm" placeholder="Nombre del criterio" />
                    </div>
                    <div class="md:col-span-1">
                        <label class="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Mín</label>
                        <input v-model.number="newCrit.hoursMin" type="number" min="0" class="w-full border rounded-lg px-2 py-1.5 text-sm" />
                    </div>
                    <div class="md:col-span-1">
                        <label class="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Máx</label>
                        <input v-model.number="newCrit.hoursMax" type="number" min="0" class="w-full border rounded-lg px-2 py-1.5 text-sm" />
                    </div>
                    <div class="md:col-span-2">
                        <button
                            class="w-full px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                            :disabled="busy || !newCrit.rubricRubroId || !newCrit.name.trim()"
                            @click="addCriterion"
                        >Agregar</button>
                    </div>
                </div>
            </div>

            <div v-if="criteria.length === 0" class="text-center py-8 text-slate-400">
                Aún no hay criterios. Agrega el primero arriba.
            </div>

            <!-- Criterios -->
            <div v-for="crit in criteria" :key="crit.id" class="bg-white border rounded-xl shadow-sm">
                <!-- Cabecera del criterio (editable en línea) -->
                <div class="p-4 border-b">
                    <div class="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
                        <div class="md:col-span-3">
                            <label class="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Rubro</label>
                            <select v-model.number="crit.rubroId" class="w-full border rounded-lg px-2 py-1.5 text-sm">
                                <option v-for="r in rubros" :key="r.id" :value="r.id">{{ r.name }}</option>
                            </select>
                        </div>
                        <div class="md:col-span-5">
                            <label class="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Criterio</label>
                            <input v-model="crit.name" class="w-full border rounded-lg px-2 py-1.5 text-sm" />
                        </div>
                        <div class="md:col-span-1">
                            <label class="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Mín</label>
                            <input v-model.number="crit.hoursMin" type="number" min="0" class="w-full border rounded-lg px-2 py-1.5 text-sm" />
                        </div>
                        <div class="md:col-span-1">
                            <label class="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Máx</label>
                            <input v-model.number="crit.hoursMax" type="number" min="0" class="w-full border rounded-lg px-2 py-1.5 text-sm" />
                        </div>
                        <div class="md:col-span-2 flex gap-1">
                            <button class="flex-1 px-2 py-1.5 text-xs rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                                :disabled="busy" @click="saveCriterion(crit)">Guardar</button>
                            <button class="px-2 py-1.5 text-xs rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                                :disabled="busy" @click="removeCriterion(crit)">Eliminar</button>
                        </div>
                    </div>
                </div>

                <!-- Productos -->
                <div class="p-4 space-y-2">
                    <p class="text-[11px] font-semibold text-slate-400 uppercase">Productos</p>
                    <div v-for="prod in crit.products" :key="prod.id" class="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                        <input v-model="prod.name" class="md:col-span-8 border rounded-lg px-2 py-1.5 text-sm" />
                        <input v-model.number="prod.hoursMin" type="number" min="0" placeholder="propias mín" class="md:col-span-1 border rounded-lg px-2 py-1.5 text-sm" />
                        <input v-model.number="prod.hoursMax" type="number" min="0" placeholder="máx" class="md:col-span-1 border rounded-lg px-2 py-1.5 text-sm" />
                        <div class="md:col-span-2 flex gap-1">
                            <button class="flex-1 px-2 py-1 text-xs rounded bg-emerald-600 text-white hover:bg-emerald-700" :disabled="busy" @click="saveProduct(prod)">✓</button>
                            <button class="px-2 py-1 text-xs rounded bg-red-50 text-red-600 hover:bg-red-100" :disabled="busy" @click="removeProduct(crit, prod)">✕</button>
                        </div>
                    </div>
                    <!-- Agregar producto -->
                    <div class="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                        <input v-model="newProd[crit.id].name" placeholder="Nuevo producto…" class="md:col-span-8 border rounded-lg px-2 py-1.5 text-sm bg-slate-50" />
                        <input v-model.number="newProd[crit.id].hoursMin" type="number" min="0" placeholder="mín" class="md:col-span-1 border rounded-lg px-2 py-1.5 text-sm bg-slate-50" />
                        <input v-model.number="newProd[crit.id].hoursMax" type="number" min="0" placeholder="máx" class="md:col-span-1 border rounded-lg px-2 py-1.5 text-sm bg-slate-50" />
                        <button class="md:col-span-2 px-2 py-1.5 text-xs rounded-lg border border-blue-300 text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                            :disabled="busy || !newProd[crit.id].name.trim()" @click="addProduct(crit)">+ Producto</button>
                    </div>
                </div>

                <!-- Evidencias -->
                <div class="p-4 border-t space-y-2">
                    <p class="text-[11px] font-semibold text-slate-400 uppercase">Evidencias</p>
                    <div v-for="ev in crit.evidences" :key="ev.id" class="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                        <input v-model="ev.name" class="md:col-span-7 border rounded-lg px-2 py-1.5 text-sm" />
                        <select v-model.number="ev.productId" class="md:col-span-3 border rounded-lg px-2 py-1.5 text-sm">
                            <option :value="null">— a nivel criterio —</option>
                            <option v-for="p in crit.products" :key="p.id" :value="p.id">{{ truncate(p.name) }}</option>
                        </select>
                        <div class="md:col-span-2 flex gap-1">
                            <button class="flex-1 px-2 py-1 text-xs rounded bg-emerald-600 text-white hover:bg-emerald-700" :disabled="busy" @click="saveEvidence(ev)">✓</button>
                            <button class="px-2 py-1 text-xs rounded bg-red-50 text-red-600 hover:bg-red-100" :disabled="busy" @click="removeEvidence(crit, ev)">✕</button>
                        </div>
                    </div>
                    <!-- Agregar evidencia -->
                    <div class="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                        <input v-model="newEv[crit.id].name" placeholder="Nueva evidencia…" class="md:col-span-7 border rounded-lg px-2 py-1.5 text-sm bg-slate-50" />
                        <select v-model.number="newEv[crit.id].productId" class="md:col-span-3 border rounded-lg px-2 py-1.5 text-sm bg-slate-50">
                            <option :value="null">— a nivel criterio —</option>
                            <option v-for="p in crit.products" :key="p.id" :value="p.id">{{ truncate(p.name) }}</option>
                        </select>
                        <button class="md:col-span-2 px-2 py-1.5 text-xs rounded-lg border border-blue-300 text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                            :disabled="busy || !newEv[crit.id].name.trim()" @click="addEvidence(crit)">+ Evidencia</button>
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'
import { useConfirm } from '@/app/composables/useConfirm'
import type { RubricVersion, RubroOption } from '@/modules/midocencia/types/rubric.type'

interface EditProduct { id: number; name: string; hoursMin: number | null; hoursMax: number | null }
interface EditEvidence { id: number; productId: number | null; name: string }
interface EditCriterion {
    id: number; rubroId: number; name: string; hoursMin: number; hoursMax: number
    products: EditProduct[]; evidences: EditEvidence[]
}

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { confirm } = useConfirm()

const rubricId = Number(route.params.id)
const B = API.MIDOCENCIA_API.builder
const R = API.MIDOCENCIA_API.rubrics

const loading = ref(true)
const busy = ref(false)
const fatal = ref('')
const rubric = ref<RubricVersion | null>(null)
const rubros = ref<RubroOption[]>([])
const criteria = ref<EditCriterion[]>([])

const newCrit = reactive<{ rubricRubroId: number | null; name: string; hoursMin: number; hoursMax: number }>(
    { rubricRubroId: null, name: '', hoursMin: 1, hoursMax: 1 },
)
const newProd = reactive<Record<number, { name: string; hoursMin: number | null; hoursMax: number | null }>>({})
const newEv = reactive<Record<number, { name: string; productId: number | null }>>({})

onMounted(load)

async function load() {
    loading.value = true
    fatal.value = ''
    try {
        const [{ data: tree }, { data: rubroList }] = await Promise.all([
            api.get(R.tree(rubricId)),
            api.get(R.rubros),
        ])
        rubric.value = tree.rubric
        rubros.value = rubroList
        if (rubric.value?.status !== 'draft' || rubric.value?.collegeId === null) {
            fatal.value = 'Esta versión no es editable (debe ser un borrador de tu plantel). Duplícala primero.'
            criteria.value = []
            return
        }
        hydrate(tree.rubros)
    } catch (e: any) {
        fatal.value = e?.response?.data?.message ?? 'No se pudo cargar la rúbrica.'
    } finally {
        loading.value = false
    }
}

function hydrate(rubroGroups: any[]) {
    const flat: EditCriterion[] = []
    for (const g of rubroGroups) {
        for (const c of g.criteria) {
            flat.push({
                id: c.id, rubroId: g.id, name: c.name, hoursMin: c.hoursMin, hoursMax: c.hoursMax,
                products: c.products.map((p: any) => ({ id: p.id, name: p.name, hoursMin: p.hoursMin, hoursMax: p.hoursMax })),
                evidences: c.evidences.map((e: any) => ({ id: e.id, productId: e.productId, name: e.name })),
            })
            newProd[c.id] = { name: '', hoursMin: null, hoursMax: null }
            newEv[c.id] = { name: '', productId: null }
        }
    }
    criteria.value = flat
}

function truncate(s: string, n = 40): string { return s.length > n ? s.slice(0, n) + '…' : s }
function goBack() { router.push({ name: 'midocencia.rubric' }) }

async function run(fn: () => Promise<any>, okMsg: string) {
    busy.value = true
    try { await fn(); toast.success(okMsg); await load() }
    catch (e: any) { toast.error(e?.response?.data?.message ?? 'Ocurrió un error.') }
    finally { busy.value = false }
}

// ── Criterios ──
function addCriterion() {
    run(() => api.post(B.createCriterion(rubricId), {
        rubric_rubro_id: newCrit.rubricRubroId, name: newCrit.name,
        hours_min: newCrit.hoursMin, hours_max: newCrit.hoursMax,
    }).then(() => { newCrit.rubricRubroId = null; newCrit.name = ''; newCrit.hoursMin = 1; newCrit.hoursMax = 1 }),
    'Criterio agregado.')
}
function saveCriterion(c: EditCriterion) {
    run(() => api.put(B.updateCriterion(c.id), {
        rubric_rubro_id: c.rubroId, name: c.name, hours_min: c.hoursMin, hours_max: c.hoursMax,
    }), 'Criterio actualizado.')
}
async function removeCriterion(c: EditCriterion) {
    if (!await confirm({ title: 'Eliminar criterio', message: `Se eliminará "${truncate(c.name)}" con sus productos y evidencias.`, variant: 'danger' })) return
    run(() => api.delete(B.deleteCriterion(c.id)), 'Criterio eliminado.')
}

// ── Productos ──
function addProduct(c: EditCriterion) {
    const draft = newProd[c.id]
    run(() => api.post(B.createProduct(c.id), {
        name: draft.name, hours_min: draft.hoursMin, hours_max: draft.hoursMax,
    }), 'Producto agregado.')
}
function saveProduct(p: EditProduct) {
    run(() => api.put(B.updateProduct(p.id), { name: p.name, hours_min: p.hoursMin, hours_max: p.hoursMax }), 'Producto actualizado.')
}
async function removeProduct(_c: EditCriterion, p: EditProduct) {
    if (!await confirm({ title: 'Eliminar producto', message: `Se eliminará "${truncate(p.name)}".`, variant: 'danger' })) return
    run(() => api.delete(B.deleteProduct(p.id)), 'Producto eliminado.')
}

// ── Evidencias ──
function addEvidence(c: EditCriterion) {
    const draft = newEv[c.id]
    run(() => api.post(B.createEvidence(c.id), { name: draft.name, rubric_product_id: draft.productId }), 'Evidencia agregada.')
}
function saveEvidence(e: EditEvidence) {
    run(() => api.put(B.updateEvidence(e.id), { name: e.name, rubric_product_id: e.productId }), 'Evidencia actualizada.')
}
async function removeEvidence(_c: EditCriterion, e: EditEvidence) {
    if (!await confirm({ title: 'Eliminar evidencia', message: `Se eliminará "${truncate(e.name)}".`, variant: 'danger' })) return
    run(() => api.delete(B.deleteEvidence(e.id)), 'Evidencia eliminada.')
}
</script>
