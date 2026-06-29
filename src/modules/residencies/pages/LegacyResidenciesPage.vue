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

        <!-- Drawer detalle -->
        <Teleport to="body">
            <div v-if="detail" class="fixed inset-0 z-50 flex justify-end">
                <div class="absolute inset-0 bg-black/40" @click="detail = null" />
                <div class="relative bg-white w-full max-w-md h-full overflow-y-auto p-6 space-y-4 z-10">
                    <div class="flex items-start justify-between">
                        <div>
                            <h2 class="text-base font-bold text-slate-800">{{ detail.studentName ?? '—' }}</h2>
                            <p class="text-xs text-slate-400 font-mono">{{ detail.numControl ?? '—' }} · {{ detail.source }} #{{ detail.externalId }}</p>
                        </div>
                        <button type="button" class="text-slate-400 hover:text-slate-700" @click="detail = null">✕</button>
                    </div>

                    <dl class="grid grid-cols-3 gap-y-2 text-sm">
                        <dt class="text-[11px] font-bold text-slate-400 uppercase col-span-1 self-center">Empresa</dt>
                        <dd class="col-span-2 text-slate-700">{{ detail.companyName ?? '—' }}<span v-if="detail.companyRfc" class="text-xs text-slate-400"> · {{ detail.companyRfc }}</span></dd>
                        <dt class="text-[11px] font-bold text-slate-400 uppercase col-span-1 self-center">Lugar</dt>
                        <dd class="col-span-2 text-slate-700">{{ detail.place ?? '—' }}</dd>
                        <dt class="text-[11px] font-bold text-slate-400 uppercase col-span-1 self-center">Opción</dt>
                        <dd class="col-span-2 text-slate-700">{{ detail.projectOption ?? '—' }}</dd>
                        <dt class="text-[11px] font-bold text-slate-400 uppercase col-span-1 self-center">Periodo</dt>
                        <dd class="col-span-2 text-slate-700">{{ detail.periodLabel ?? '—' }}</dd>
                        <dt class="text-[11px] font-bold text-slate-400 uppercase col-span-1 self-center">Estado</dt>
                        <dd class="col-span-2"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold" :class="statusClass(detail.status)">{{ statusLabel(detail.status) }}</span></dd>
                    </dl>

                    <div>
                        <h3 class="text-[11px] font-bold text-slate-400 uppercase mb-2">Documentos ({{ detail.documents.length }})</h3>
                        <p v-if="!detail.documents.length" class="text-xs text-slate-400 italic">Sin documentos migrados.</p>
                        <ul v-else class="space-y-1.5">
                            <li v-for="d in detail.documents" :key="d.id" class="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                                <div class="min-w-0">
                                    <p class="font-medium text-slate-700 truncate">{{ d.originalName ?? d.code }}</p>
                                    <p class="text-[11px] text-slate-400">{{ d.code }}<span v-if="d.sizeKb"> · {{ d.sizeKb }} KB</span></p>
                                </div>
                                <a :href="downloadUrl(d.id)" target="_blank" class="text-xs px-2 py-1 border rounded-md hover:bg-slate-100 shrink-0">Descargar</a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
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
    const { data } = await api.get(R.legacy.byId(id))
    detail.value = data
}
function downloadUrl(id: number) { return R.legacy.downloadDocument(id) }

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

fetchData()
</script>
