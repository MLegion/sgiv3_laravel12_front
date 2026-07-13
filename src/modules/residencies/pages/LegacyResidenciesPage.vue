<template>
    <div class="space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-3">
            <div>
                <h1 class="text-xl font-semibold text-slate-800 uppercase">Histórico de Residencias</h1>
                <p class="text-xs text-slate-400">Expediente migrado del SGIv2 (solo lectura).</p>
            </div>
            <div class="flex items-center gap-2">
                <input v-model="search" placeholder="Buscar por control, nombre o empresa…"
                       class="border rounded-md px-2 py-1 text-xs w-64" @keyup.enter="reload" />
                <select v-model="statusFilter" class="border rounded-md px-2 py-1 text-xs" @change="reload">
                    <option value="">TODOS</option>
                    <option value="in_progress">EN PROCESO</option>
                    <option value="concluded">CONCLUIDA</option>
                    <option value="registered">REGISTRADA</option>
                    <option value="dropped">BAJA</option>
                </select>
            </div>
        </div>

        <div v-if="loading" class="text-sm text-slate-400">Cargando…</div>
        <div v-else-if="!rows.length" class="text-sm text-slate-400 italic">Sin registros.</div>

        <div v-else class="overflow-x-auto rounded-xl border bg-white">
            <table class="min-w-full text-sm">
                <thead class="bg-slate-50 text-[11px] uppercase text-slate-500">
                    <tr>
                        <th class="text-left px-4 py-2">No. control</th>
                        <th class="text-left px-4 py-2">Residente</th>
                        <th class="text-left px-4 py-2">Empresa</th>
                        <th class="text-left px-4 py-2">Opción</th>
                        <th class="text-center px-4 py-2">Estado</th>
                        <th class="text-center px-4 py-2">Docs</th>
                        <th class="px-4 py-2"></th>
                    </tr>
                </thead>
                <tbody class="divide-y">
                    <tr v-for="r in rows" :key="r.id" class="hover:bg-slate-50">
                        <td class="px-4 py-2 font-mono text-xs text-slate-600">{{ r.numControl ?? '—' }}</td>
                        <td class="px-4 py-2 text-slate-700">{{ r.studentName ?? '—' }}</td>
                        <td class="px-4 py-2 text-slate-500 text-xs">{{ r.companyName ?? '—' }}</td>
                        <td class="px-4 py-2 text-slate-500 text-xs">{{ r.projectOption ?? '—' }}</td>
                        <td class="px-4 py-2 text-center">
                            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold" :class="statusClass(r.status)">{{ statusLabel(r.status) }}</span>
                        </td>
                        <td class="px-4 py-2 text-center">
                            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                                  :class="r.documentsCount ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'">{{ r.documentsCount }}</span>
                        </td>
                        <td class="px-4 py-2 text-right">
                            <button type="button" class="text-xs px-3 py-1 border rounded-md hover:bg-slate-100" @click="open(r.id)">Ver</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Paginación -->
        <div v-if="!loading && rows.length" class="flex items-center justify-between text-xs text-slate-500">
            <span>{{ total }} registros · página {{ page }} de {{ lastPage }}</span>
            <div class="flex items-center gap-2">
                <button type="button" class="px-3 py-1 border rounded-md disabled:opacity-40" :disabled="page <= 1" @click="go(page - 1)">Anterior</button>
                <button type="button" class="px-3 py-1 border rounded-md disabled:opacity-40" :disabled="page >= lastPage" @click="go(page + 1)">Siguiente</button>
            </div>
        </div>

        <!-- Drawer detalle (panel ancho: datos + visor PDF embebido) -->
        <Teleport to="body">
            <div v-if="detail" class="fixed inset-0 z-[90] flex justify-end">
                <div class="absolute inset-0 bg-black/40" @click="closeDetail" />
                <div class="relative bg-white w-full max-w-6xl h-full z-10 flex flex-col">
                    <!-- Encabezado -->
                    <div class="flex items-start justify-between px-6 py-4 border-b shrink-0">
                        <div>
                            <h2 class="text-base font-bold text-slate-800">{{ detail.studentName ?? '—' }}</h2>
                            <p class="text-xs text-slate-400 font-mono">{{ detail.numControl ?? '—' }} · {{ detail.source }} #{{ detail.externalId }}</p>
                        </div>
                        <button type="button" class="text-slate-400 hover:text-slate-700 text-lg leading-none" @click="closeDetail">✕</button>
                    </div>

                    <!-- Cuerpo en dos columnas -->
                    <div class="flex-1 flex min-h-0">
                        <!-- Columna izquierda: datos + lista de documentos -->
                        <div class="w-[360px] shrink-0 border-r overflow-y-auto p-5 space-y-4">
                            <dl class="grid grid-cols-3 gap-y-2 text-sm">
                                <dt class="text-[11px] font-bold text-slate-400 uppercase col-span-1 self-center">Empresa</dt>
                                <dd class="col-span-2 text-slate-700">{{ detail.companyName ?? '—' }}<span v-if="detail.companyRfc" class="text-xs text-slate-400"> · {{ detail.companyRfc }}</span></dd>
                                <dt class="text-[11px] font-bold text-slate-400 uppercase col-span-1 self-center">Lugar</dt>
                                <dd class="col-span-2 text-slate-700">{{ detail.place ?? '—' }}</dd>
                                <dt class="text-[11px] font-bold text-slate-400 uppercase col-span-1 self-center">Opción</dt>
                                <dd class="col-span-2 text-slate-700">{{ detail.projectOption ?? '—' }}</dd>
                                <dt class="text-[11px] font-bold text-slate-400 uppercase col-span-1">Proyecto</dt>
                                <dd class="col-span-2 text-slate-700">{{ detail.projectTitle ?? '—' }}</dd>
                                <dt class="text-[11px] font-bold text-slate-400 uppercase col-span-1 self-center">Asesor interno</dt>
                                <dd class="col-span-2 text-slate-700">{{ detail.internalAdvisorName ?? '—' }}</dd>
                                <dt class="text-[11px] font-bold text-slate-400 uppercase col-span-1 self-center">Asesor externo</dt>
                                <dd class="col-span-2 text-slate-700">{{ detail.externalAdvisorName ?? '—' }}</dd>
                                <dt class="text-[11px] font-bold text-slate-400 uppercase col-span-1 self-center">Periodo</dt>
                                <dd class="col-span-2 text-slate-700">{{ detail.periodLabel ?? '—' }}</dd>
                                <dt class="text-[11px] font-bold text-slate-400 uppercase col-span-1 self-center">Estado</dt>
                                <dd class="col-span-2"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold" :class="statusClass(detail.status)">{{ statusLabel(detail.status) }}</span></dd>
                            </dl>

                            <div>
                                <div class="flex items-center justify-between mb-2 gap-2">
                                    <h3 class="text-[11px] font-bold text-slate-400 uppercase">Documentos ({{ detail.documents.length }})</h3>
                                    <button v-if="detail.documents.length" type="button" :disabled="zipBusy"
                                            class="text-xs px-2.5 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 shrink-0"
                                            @click="downloadZip">
                                        {{ zipBusy ? 'Empaquetando…' : 'Descargar todo (ZIP)' }}
                                    </button>
                                </div>
                                <p v-if="!detail.documents.length" class="text-xs text-slate-400 italic">Sin documentos migrados.</p>
                                <ul v-else class="space-y-1.5">
                                    <li v-for="d in detail.documents" :key="d.id"
                                        class="rounded-lg border px-3 py-2 text-sm cursor-pointer transition-colors"
                                        :class="selectedDocId === d.id ? 'border-blue-400 bg-blue-50' : 'hover:bg-slate-50'"
                                        @click="viewDoc(d.id)">
                                        <div class="flex items-center justify-between gap-2">
                                            <div class="min-w-0">
                                                <p class="font-medium text-slate-700 truncate">{{ d.originalName ?? d.code }}</p>
                                                <p class="text-[11px] text-slate-400">{{ d.code }}<span v-if="d.sizeKb"> · {{ d.sizeKb }} KB</span></p>
                                            </div>
                                            <span class="text-[11px] shrink-0" :class="selectedDocId === d.id ? 'text-blue-600 font-semibold' : 'text-slate-400'">
                                                {{ viewingId === d.id ? '…' : (selectedDocId === d.id ? 'Viendo' : 'Ver') }}
                                            </span>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <!-- Columna derecha: visor PDF embebido -->
                        <div class="flex-1 min-w-0 bg-slate-100 relative flex items-center justify-center">
                            <div v-if="previewLoading" class="absolute inset-0 flex items-center justify-center">
                                <div class="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                            </div>
                            <iframe v-else-if="previewUrl" :src="previewUrl" class="w-full h-full border-0" title="Vista previa del documento" />
                            <div v-else class="flex flex-col items-center gap-3 p-8 text-center text-slate-400">
                                <svg xmlns="http://www.w3.org/2000/svg" class="w-16 h-16 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                <p class="text-sm">Selecciona un documento de la lista para verlo aquí.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import type { LegacyResidencyRow, LegacyResidencyDetail } from '@/modules/residencies/types/residency.type'

const R = API.RESIDENCIES_API

const loading = ref(false)
const rows = ref<LegacyResidencyRow[]>([])
const total = ref(0)
const page = ref(1)
const lastPage = ref(1)
const search = ref('')
const statusFilter = ref('')

const detail = ref<LegacyResidencyDetail | null>(null)
const zipBusy = ref(false)
const viewingId = ref<number | null>(null)

// Visor PDF embebido
const previewUrl = ref<string | null>(null)
const previewLoading = ref(false)
const selectedDocId = ref<number | null>(null)

async function fetchData() {
    loading.value = true
    try {
        const { data } = await api.get(R.legacy.list, {
            params: { search: search.value || undefined, status: statusFilter.value || undefined, page: page.value, per_page: 20 },
        })
        rows.value = data.items ?? []
        total.value = data.total ?? 0
        lastPage.value = data.lastPage ?? 1
    } finally { loading.value = false }
}
function reload() { page.value = 1; fetchData() }
function go(p: number) { page.value = p; fetchData() }

async function open(id: number) {
    resetPreview()
    const { data } = await api.get(R.legacy.byId(id))
    detail.value = data
    // Muestra el primer documento automáticamente para no dejar el visor vacío.
    if (data?.documents?.length) viewDoc(data.documents[0].id)
}

function resetPreview() {
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
    selectedDocId.value = null
}

function closeDetail() {
    resetPreview()
    detail.value = null
}

/** Carga un documento (blob autenticado) y lo muestra en el visor embebido — sin abrir pestaña nueva. */
async function viewDoc(id: number) {
    viewingId.value = id
    previewLoading.value = true
    try {
        const res = await api.get(R.legacy.downloadDocument(id), { responseType: 'blob' })
        if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
        previewUrl.value = URL.createObjectURL(res.data as Blob)
        selectedDocId.value = id
    } finally {
        viewingId.value = null
        previewLoading.value = false
    }
}

/** Descarga TODOS los documentos del expediente empaquetados en un ZIP. */
async function downloadZip() {
    if (!detail.value) return
    zipBusy.value = true
    try {
        const res = await api.get(R.legacy.downloadAll(detail.value.id), { responseType: 'blob' })
        const url = URL.createObjectURL(res.data as Blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `residencia_${detail.value.numControl ?? detail.value.id}.zip`
        document.body.appendChild(a)
        a.click()
        a.remove()
        setTimeout(() => URL.revokeObjectURL(url), 10_000)
    } finally {
        zipBusy.value = false
    }
}

function statusLabel(s: string | null): string {
    return ({ in_progress: 'EN PROCESO', concluded: 'CONCLUIDA', registered: 'REGISTRADA', dropped: 'BAJA' } as Record<string, string>)[s ?? ''] ?? (s ? s.toUpperCase() : '—')
}
function statusClass(s: string | null): string {
    return ({
        in_progress: 'bg-amber-100 text-amber-700',
        concluded:   'bg-emerald-100 text-emerald-700',
        registered:  'bg-blue-100 text-blue-700',
        dropped:     'bg-red-100 text-red-700',
    } as Record<string, string>)[s ?? ''] ?? 'bg-slate-100 text-slate-500'
}

onBeforeUnmount(() => { if (previewUrl.value) URL.revokeObjectURL(previewUrl.value) })

fetchData()
</script>
