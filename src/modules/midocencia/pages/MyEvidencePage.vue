<template>
    <div class="space-y-4 max-w-4xl mx-auto pb-16">
        <div>
            <button class="text-sm text-slate-500 hover:text-slate-700" @click="goBack">&larr; Mi Docencia</button>
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Mis evidencias</h1>
            <p class="text-sm text-slate-500">Sube los archivos (PDF o imagen) de cada evidencia seleccionada en tu distribución.</p>
        </div>

        <div v-if="loading" class="text-center py-12 text-slate-400">Cargando…</div>
        <div v-else-if="status === 'none'" class="text-center py-8 text-slate-400">Aún no tienes una distribución.</div>
        <div v-else-if="!uploadable" class="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800">
            Podrás subir evidencias cuando envíes tu distribución a revisión.
        </div>

        <template v-else>
            <div v-if="criteria.length === 0" class="text-center py-8 text-slate-400">No hay evidencias seleccionadas en tu distribución.</div>

            <div v-for="crit in criteria" :key="crit.detailId" class="bg-white border rounded-xl shadow-sm overflow-hidden">
                <div class="px-4 py-2.5 bg-slate-800 text-white font-semibold text-sm">{{ crit.criterion }}</div>
                <div class="divide-y">
                    <div v-for="ev in crit.evidences" :key="ev.evidenceId" class="p-4">
                        <p class="text-sm text-slate-700 mb-2">{{ ev.name }}</p>
                        <ul class="space-y-1 mb-2">
                            <li v-for="f in ev.files" :key="f.id" class="flex items-center justify-between text-xs bg-slate-50 rounded px-2 py-1">
                                <button class="text-blue-600 hover:underline truncate" @click="download(f)">{{ f.originalName }}</button>
                                <button class="text-red-500 hover:text-red-700 ml-2 shrink-0" @click="remove(f)">✕</button>
                            </li>
                            <li v-if="ev.files.length === 0" class="text-xs text-slate-400">Sin archivos.</li>
                        </ul>
                        <label class="inline-flex items-center gap-2 text-xs cursor-pointer text-blue-700 hover:underline">
                            <input type="file" class="hidden" accept=".pdf,.jpg,.jpeg,.png,.gif"
                                   @change="onFile($event, crit.detailId, ev.evidenceId)" :disabled="busy" />
                            + Subir archivo
                        </label>
                    </div>
                </div>
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

interface EvFile { id: number; originalName: string; mime: string | null; size: number }
interface Evidence { evidenceId: number; name: string; files: EvFile[] }
interface Criterion { detailId: number; criterion: string; evidences: Evidence[] }

const router = useRouter()
const toast = useToast()
const E = API.MIDOCENCIA_API

const loading = ref(true)
const busy = ref(false)
const status = ref('')
const uploadable = ref(false)
const criteria = ref<Criterion[]>([])

function goBack() { router.push({ name: 'midocencia.my-distribution' }) }

onMounted(load)

async function load() {
    loading.value = true
    try {
        const { data } = await api.get(E.distribution.evidences)
        status.value = data.status
        uploadable.value = !!data.uploadable
        criteria.value = data.criteria ?? []
    } catch (e: any) {
        toast.error(e?.response?.data?.message ?? 'No se pudieron cargar tus evidencias.')
    } finally { loading.value = false }
}

async function onFile(event: Event, detailId: number, evidenceId: number) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    busy.value = true
    try {
        const form = new FormData()
        form.append('file', file)
        await api.post(E.evidence.upload(detailId, evidenceId), form)
        toast.success('Archivo subido.')
        await load()
    } catch (e: any) {
        toast.error(e?.response?.data?.message ?? 'No se pudo subir el archivo.')
    } finally { busy.value = false; input.value = '' }
}

async function download(f: EvFile) {
    try {
        const res = await api.get(E.evidence.download(f.id), { responseType: 'blob' })
        const url = URL.createObjectURL(res.data as Blob)
        const a = document.createElement('a')
        a.href = url; a.download = f.originalName; a.click()
        URL.revokeObjectURL(url)
    } catch { toast.error('No se pudo descargar el archivo.') }
}

async function remove(f: EvFile) {
    busy.value = true
    try {
        await api.delete(E.evidence.delete(f.id))
        toast.success('Archivo eliminado.')
        await load()
    } catch (e: any) {
        toast.error(e?.response?.data?.message ?? 'No se pudo eliminar.')
    } finally { busy.value = false }
}
</script>
