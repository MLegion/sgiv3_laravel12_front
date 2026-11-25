<template>
    <div class="space-y-4 max-w-4xl mx-auto pb-16">
        <div>
            <button class="text-sm text-slate-500 hover:text-slate-700" @click="goBack">&larr; Mi Docencia</button>
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Otros — evidencias libres</h1>
            <p class="text-sm text-slate-500">Sube archivos de evidencia libres, opcionalmente clasificados en una categoría.</p>
        </div>

        <SkeletonTable v-if="loading" :rows="5" :cols="4" />
        <template v-else>
            <!-- Subir -->
            <div class="bg-white border rounded-xl shadow-sm p-4 flex flex-wrap items-end gap-3">
                <div>
                    <label for="otros-bucket" class="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Categoría</label>
                    <select id="otros-bucket" v-model.number="bucketId" class="border rounded-lg px-3 py-2 text-sm">
                        <option :value="null">— sin categoría —</option>
                        <option v-for="b in buckets" :key="b.id" :value="b.id">{{ b.name }}</option>
                    </select>
                </div>
                <div class="flex-1 min-w-[160px]">
                    <label for="otros-label" class="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Etiqueta (opcional)</label>
                    <input id="otros-label" v-model="label" class="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Descripción breve…" />
                </div>
                <label class="inline-flex items-center gap-2 text-sm cursor-pointer px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                    :class="busy ? 'opacity-50 pointer-events-none' : ''">
                    <input type="file" class="hidden" accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx" @change="onFile" :disabled="busy" />
                    {{ busy ? 'Subiendo…' : 'Subir archivo' }}
                </label>
            </div>

            <!-- Archivos -->
            <DataTable :columns="columns" :rows="files" hide-search caption="Archivos de evidencia" empty-text="Sin archivos.">
                <template #cell-file="{ row: f }"><button class="text-blue-600 hover:underline truncate" @click="download(f)">{{ f.originalName }}</button></template>
                <template #cell-bucket="{ row: f }"><span class="text-slate-500">{{ bucketName(f.bucketId) }}</span></template>
                <template #cell-label="{ row: f }"><span class="text-slate-500">{{ f.label || '—' }}</span></template>
                <template #cell-actions="{ row: f }"><button class="text-red-500 hover:text-red-700" @click="remove(f)">✕</button></template>
            </DataTable>
        </template>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'
import SkeletonTable from '@/app/components/ui/SkeletonTable.vue'
import DataTable from '@/app/components/ui/datatable/DataTable.vue'
import type { DataTableColumn } from '@/app/components/ui/datatable/types'

interface Bucket { id: number; name: string }
interface OFile { id: number; bucketId: number | null; label: string | null; originalName: string; mime: string | null; size: number }

const columns: DataTableColumn<OFile>[] = [
    { key: 'file', label: 'Archivo' },
    { key: 'bucket', label: 'Categoría' },
    { key: 'label', label: 'Etiqueta' },
    { key: 'actions', label: '', align: 'right' },
]

const router = useRouter()
const toast = useToast()
const O = API.MIDOCENCIA_API.otros

const loading = ref(true)
const busy = ref(false)
const periodId = ref<number | null>(null)
const buckets = ref<Bucket[]>([])
const files = ref<OFile[]>([])
const bucketId = ref<number | null>(null)
const label = ref('')

function goBack() { router.push({ name: 'midocencia.my-distribution' }) }
function bucketName(id: number | null) { return id ? (buckets.value.find(b => b.id === id)?.name ?? '—') : '—' }

onMounted(load)

async function load() {
    loading.value = true
    try {
        const { data } = await api.get(O.index)
        periodId.value = data.periodId
        buckets.value = data.buckets ?? []
        files.value = data.files ?? []
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudo cargar.') }
    finally { loading.value = false }
}

async function onFile(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file || !periodId.value) return
    busy.value = true
    try {
        const form = new FormData()
        form.append('file', file)
        form.append('period_id', String(periodId.value))
        if (bucketId.value) form.append('bucket_id', String(bucketId.value))
        if (label.value.trim()) form.append('label', label.value.trim())
        await api.post(O.upload, form)
        toast.success('Archivo subido.')
        label.value = ''
        await load()
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudo subir.') }
    finally { busy.value = false; input.value = '' }
}

async function download(f: OFile) {
    try {
        const res = await api.get(O.download(f.id), { responseType: 'blob' })
        const url = URL.createObjectURL(res.data as Blob)
        const a = document.createElement('a'); a.href = url; a.download = f.originalName; a.click()
        URL.revokeObjectURL(url)
    } catch { toast.error('No se pudo descargar.') }
}

async function remove(f: OFile) {
    busy.value = true
    try { await api.delete(O.delete(f.id)); toast.success('Archivo eliminado.'); await load() }
    catch (e: any) { toast.error(e?.response?.data?.message ?? 'No se pudo eliminar.') }
    finally { busy.value = false }
}
</script>
