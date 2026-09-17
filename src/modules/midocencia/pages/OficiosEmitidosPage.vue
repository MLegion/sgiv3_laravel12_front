<template>
    <div class="space-y-4 max-w-5xl mx-auto pb-16">
        <div>
            <h1 class="text-xl font-semibold text-slate-800">Oficios Emitidos</h1>
            <p class="text-sm text-slate-500">
                Oficios de función académica ya aprobados (con folio). Selecciona un periodo, busca por docente o folio,
                y genera el documento para verlo o imprimirlo.
            </p>
        </div>

        <!-- Filtros -->
        <div class="bg-white border rounded-xl shadow-sm p-4 flex flex-wrap items-end gap-3">
            <div class="w-72">
                <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Periodo</label>
                <select
                    v-model="periodId"
                    class="w-full h-9 px-2 border border-slate-300 rounded-lg text-sm"
                    @change="loadOficios"
                >
                    <option :value="null" disabled>Selecciona un periodo…</option>
                    <option v-for="p in periods" :key="p.id" :value="p.id">{{ p.name }}</option>
                </select>
            </div>
            <div class="flex-1 min-w-56">
                <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Buscar</label>
                <input
                    v-model="search"
                    type="text"
                    placeholder="Docente o folio…"
                    class="w-full h-9 px-3 border border-slate-300 rounded-lg text-sm"
                />
            </div>
        </div>

        <div v-if="!periods.length && !loading" class="text-center py-8 text-slate-400">
            Aún no hay oficios emitidos en tu plantel.
        </div>

        <div v-else-if="periodId" class="bg-white border rounded-xl shadow-sm p-4">
            <div v-if="loading" class="py-8 text-center text-slate-400">Cargando…</div>
            <div v-else-if="!filtered.length" class="py-8 text-center text-slate-400">No hay oficios que mostrar.</div>
            <table v-else class="w-full text-sm">
                <thead>
                    <tr class="text-left text-xs font-semibold uppercase text-slate-500 border-b">
                        <th class="py-2 pr-3">Docente</th>
                        <th class="py-2 pr-3 w-32">Folio</th>
                        <th class="py-2 pr-3 w-20">Horas</th>
                        <th class="py-2 pr-3 w-32">Aprobado</th>
                        <th class="py-2 w-28"></th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="o in filtered" :key="o.id" class="border-b last:border-0">
                        <td class="py-2 pr-3 font-medium text-slate-700">{{ o.teacherName ?? '—' }}</td>
                        <td class="py-2 pr-3 font-mono text-slate-600">{{ o.folio ?? '—' }}</td>
                        <td class="py-2 pr-3 text-slate-600">{{ o.hours }}</td>
                        <td class="py-2 pr-3 text-slate-500">{{ fmtDate(o.approvedAt) }}</td>
                        <td class="py-2 text-right">
                            <button
                                type="button"
                                class="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                                :disabled="busyId === o.id"
                                @click="verOficio(o)"
                            >
                                {{ busyId === o.id ? 'Generando…' : 'Ver oficio' }}
                            </button>
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
import { useReportGenerator } from '@/modules/reports/composables/useReportGenerator'

interface Period { id: number; name: string }
interface Oficio {
    id: number
    teacherId: number
    teacherName: string | null
    folio: string | null
    hours: number
    approvedAt: string | null
}

const toast = useToast()
const A = API.MIDOCENCIA_API.oficios
const { generateFromContext, convertToPdf } = useReportGenerator()

const periods = ref<Period[]>([])
const periodId = ref<number | null>(null)
const oficios = ref<Oficio[]>([])
const search = ref('')
const loading = ref(false)
const busyId = ref<number | null>(null)

const filtered = computed(() => {
    const q = search.value.trim().toUpperCase()
    if (!q) return oficios.value
    return oficios.value.filter(o =>
        (o.teacherName || '').toUpperCase().includes(q) || (o.folio || '').toUpperCase().includes(q),
    )
})

onMounted(async () => {
    try {
        const { data } = await api.get(A.periods)
        periods.value = data ?? []
        if (periods.value.length) {
            periodId.value = periods.value[0].id
            await loadOficios()
        }
    } catch (e: any) {
        toast.error(e?.response?.data?.message ?? 'No se pudieron cargar los periodos.')
    }
})

async function loadOficios() {
    if (!periodId.value) { oficios.value = []; return }
    loading.value = true
    try {
        const { data } = await api.get(A.list, { params: { period_id: periodId.value } })
        oficios.value = data ?? []
    } catch (e: any) {
        toast.error(e?.response?.data?.message ?? 'No se pudieron cargar los oficios.')
        oficios.value = []
    } finally {
        loading.value = false
    }
}

async function verOficio(o: Oficio) {
    busyId.value = o.id
    try {
        const { data } = await api.get(A.context(o.id))
        const { blob } = await generateFromContext({
            reportCode: data.reportCode,
            context: data.context,
            filename: `OFICIO_FUNCION_ACADEMICA_${o.folio ?? o.id}`,
        })
        const pdf = await convertToPdf(blob, 'OFICIO_FUNCION_ACADEMICA.docx')
        const url = URL.createObjectURL(pdf)
        window.open(url, '_blank')
        // El navegador conserva la pestaña; liberamos el objeto tras un margen.
        setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (e: any) {
        toast.error(e?.response?.data?.message ?? 'No se pudo generar el oficio.')
    } finally {
        busyId.value = null
    }
}

function fmtDate(iso: string | null): string {
    if (!iso) return '—'
    try { return new Date(iso).toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' }) }
    catch { return iso.substring(0, 10) }
}
</script>
