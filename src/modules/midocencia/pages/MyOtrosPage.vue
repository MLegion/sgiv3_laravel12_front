<template>
    <div class="space-y-4 max-w-4xl mx-auto pb-16">
        <div>
            <button class="text-sm text-slate-500 hover:text-slate-700" @click="goBack">&larr; Mi Docencia</button>
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Otros — evidencias libres</h1>
            <p class="text-sm text-slate-500">Sube archivos de evidencia libres, opcionalmente clasificados en una categoría.</p>
        </div>

        <div v-if="loading" class="text-center py-12 text-slate-400">Cargando…</div>
        <template v-else>
            <!-- Subir -->
            <div class="bg-white border rounded-xl shadow-sm p-4 flex flex-wrap items-end gap-3">
                <div>
                    <label class="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Categoría</label>
                    <select v-model.number="bucketId" class="border rounded-lg px-3 py-2 text-sm">
                        <option :value="null">— sin categoría —</option>
                        <option v-for="b in buckets" :key="b.id" :value="b.id">{{ b.name }}</option>
                    </select>
                </div>
                <div class="flex-1 min-w-[160px]">
                    <label class="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Etiqueta (opcional)</label>
                    <input v-model="label" class="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Descripción breve…" />
                </div>
                <label class="inline-flex items-center gap-2 text-sm cursor-pointer px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                    :class="busy ? 'opacity-50 pointer-events-none' : ''">
                    <input type="file" class="hidden" accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx" @change="onFile" :disabled="busy" />
                    {{ busy ? 'Subiendo…' : 'Subir archivo' }}
                </label>
            </div>

            <!-- Archivos -->
            <div class="bg-white border rounded-xl shadow-sm overflow-hidden">
                <table class="w-full text-sm">
                    <thead class="bg-slate-50 text-slate-500 text-xs uppercase">
                        <tr><th class="text-left px-4 py-2">Archivo</th><th class="text-left px-4 py-2">Categoría</th><th class="text-left px-4 py-2">Etiqueta</th><th class="px-4 py-2"></th></tr>
                    </thead>
                    <tbody class="divide-y">
                        <tr v-for="f in files" :key="f.id" class="hover:bg-slate-50">
                            <td class="px-4 py-2"><button class="text-blue-600 hover:underline truncate" @click="download(f)">{{ f.originalName }}</button></td>
                            <td class="px-4 py-2 text-slate-500">{{ bucketName(f.bucketId) }}</td>
                            <td class="px-4 py-2 text-slate-500">{{ f.label || '—' }}</td>
                            <td class="px-4 py-2 text-right"><button class="text-red-500 hover:text-red-700" @click="remove(f)">✕</button></td>
                        </tr>
                        <tr v-if="files.length === 0"><td colspan="4" class="px-4 py-4 text-center text-slate-400">Sin archivos.</td></tr>
                    </tbody>
                </table>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { useToast } from '@/app/composables/useToast'

interface Bucket { id: number; name: string }
interface OFile { id: number; bucketId: number | null; label: string | null; originalName: string; mime: string | null; size: number }

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
