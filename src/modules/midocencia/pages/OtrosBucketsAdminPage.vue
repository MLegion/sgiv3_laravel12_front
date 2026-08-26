<template>
    <div class="space-y-4 max-w-3xl mx-auto pb-16">
        <div>
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Categorías de "Otros"</h1>
            <p class="text-sm text-slate-500">
                Define las categorías (buckets) en las que los docentes clasifican sus evidencias
                libres. Son por periodo; puedes copiar las del periodo anterior.
            </p>
        </div>

        <div class="bg-white border rounded-xl shadow-sm p-4 flex flex-wrap items-end gap-3">
            <div class="w-72">
                <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Periodo</label>
                <FormRemoteSelect
                    v-model="periodId"
                    :endpoint="API.SCHOOL_SERVICES_API.collegeAcademicPeriods.list"
                    :params="{ order_by: 'actual_start_date', order_dir: 'desc', per_page: 100 }"
                    item-label="name" item-value="id"
                    placeholder="Selecciona un periodo…"
                    @update:model-value="load"
                />
            </div>
            <button
                v-if="periodId"
                class="text-sm border rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                :disabled="busy"
                @click="copyPrevious"
            >
                Copiar del periodo anterior
            </button>
        </div>

        <div v-if="loading" class="text-center py-12 text-slate-400">Cargando…</div>
        <div v-else-if="!periodId" class="text-center py-8 text-slate-400">Selecciona un periodo.</div>

        <template v-else>
            <div class="bg-white border rounded-xl shadow-sm overflow-hidden">
                <table class="w-full text-sm">
                    <thead class="bg-slate-50 text-slate-500 text-xs uppercase">
                        <tr>
                            <th class="text-left px-4 py-2 w-16">Orden</th>
                            <th class="text-left px-4 py-2">Categoría</th>
                            <th class="text-center px-4 py-2 w-24">Activa</th>
                            <th class="px-4 py-2 w-24"></th>
                        </tr>
                    </thead>
                    <tbody class="divide-y">
                        <tr v-for="b in buckets" :key="b.id" class="hover:bg-slate-50">
                            <td class="px-4 py-2">
                                <input
                                    type="number" min="0" v-model.number="b.sortOrder"
                                    class="w-16 border rounded px-2 py-1 text-sm"
                                    @change="save(b)"
                                />
                            </td>
                            <td class="px-4 py-2">
                                <input
                                    v-model="b.name"
                                    class="w-full border rounded px-2 py-1 text-sm"
                                    @change="save(b)"
                                />
                            </td>
                            <td class="px-4 py-2 text-center">
                                <input type="checkbox" v-model="b.status" @change="save(b)" />
                            </td>
                            <td class="px-4 py-2 text-right">
                                <button class="text-red-500 hover:text-red-700" @click="remove(b)">Eliminar</button>
                            </td>
                        </tr>
                        <tr v-if="buckets.length === 0">
                            <td colspan="4" class="px-4 py-4 text-center text-slate-400">Sin categorías. Agrega una abajo.</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Alta -->
            <div class="bg-white border rounded-xl shadow-sm p-4 flex flex-wrap items-end gap-3">
                <div class="flex-1 min-w-[200px]">
                    <label class="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Nueva categoría</label>
                    <input v-model="newName" class="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Nombre de la categoría…" @keyup.enter="add" />
                </div>
                <button
                    class="text-sm bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 disabled:opacity-50"
                    :disabled="busy || !newName.trim()"
                    @click="add"
                >
                    Agregar
                </button>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'
import FormRemoteSelect from '@/app/components/ui/form/FormRemoteSelect.vue'

interface Bucket { id: number; name: string; sortOrder: number; status: boolean }

const toast = useToast()
const O = API.MIDOCENCIA_API.otros

const periodId = ref<number | null>(null)
const buckets = ref<Bucket[]>([])
const loading = ref(false)
const busy = ref(false)
const newName = ref('')

async function load() {
    if (!periodId.value) { buckets.value = []; return }
    loading.value = true
    try {
        const { data } = await api.get(O.buckets, { params: { period_id: periodId.value } })
        buckets.value = data ?? []
    } catch (e: any) {
        toast.error(e?.response?.data?.message ?? 'No se pudieron cargar las categorías.')
        buckets.value = []
    } finally { loading.value = false }
}

async function add() {
    if (!newName.value.trim() || !periodId.value) return
    busy.value = true
    try {
        await api.post(O.buckets, {
            period_id: periodId.value,
            name: newName.value.trim(),
            sort_order: buckets.value.length,
        })
        newName.value = ''
        await load()
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudo agregar.') }
    finally { busy.value = false }
}

async function save(b: Bucket) {
    if (!b.name.trim()) { await load(); return }
    try {
        await api.put(O.bucket(b.id), { name: b.name.trim(), sort_order: b.sortOrder, status: b.status })
    } catch (e: any) {
        toast.error(e?.response?.data?.message ?? 'No se pudo guardar.')
        await load()
    }
}

async function remove(b: Bucket) {
    if (!confirm(`¿Eliminar la categoría "${b.name}"? Los archivos ya subidos quedan sin categoría.`)) return
    busy.value = true
    try { await api.delete(O.bucket(b.id)); await load() }
    catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudo eliminar.') }
    finally { busy.value = false }
}

async function copyPrevious() {
    if (!periodId.value) return
    busy.value = true
    try {
        const { data } = await api.post(O.bucketsCopy, { period_id: periodId.value })
        toast.success(data?.message ?? 'Categorías copiadas.')
        await load()
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudo copiar.') }
    finally { busy.value = false }
}
</script>
