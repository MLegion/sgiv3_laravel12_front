<template>
    <div class="space-y-4 max-w-4xl">
        <h1 class="text-xl font-semibold text-slate-800 uppercase">Mis Residentes</h1>

        <div v-if="loading" class="text-sm text-slate-400">Cargando…</div>
        <div v-else-if="!rows.length" class="rounded-lg border bg-slate-50 px-4 py-6 text-sm text-slate-500">
            Aún no tienes residentes asignados como asesor interno.
        </div>

        <ul v-else class="space-y-3">
            <li v-for="r in rows" :key="r.id" class="rounded-xl border bg-white p-4 space-y-3">
                <div class="flex items-start justify-between gap-3">
                    <div>
                        <p class="text-sm font-bold text-slate-700">{{ r.studentName ?? '—' }}</p>
                        <p class="text-[10px] font-mono text-slate-400">{{ r.numControl }}</p>
                        <p class="text-xs text-slate-500 mt-1">{{ r.career ?? '—' }}</p>
                    </div>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold" :class="statusClass(r.status)">{{ statusLabel(r.status) }}</span>
                </div>

                <div class="grid sm:grid-cols-2 gap-2 text-sm">
                    <div>
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Empresa</p>
                        <p class="text-slate-700">{{ r.company ?? '—' }}</p>
                    </div>
                    <div>
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Proyecto</p>
                        <p class="text-slate-700">{{ r.project ?? r.projectTitle ?? '—' }}</p>
                    </div>
                </div>

                <button type="button" class="text-xs px-3 py-1.5 border rounded-md hover:bg-slate-50" @click="toggleDocs(r)">
                    {{ openId === r.id ? 'Ocultar' : 'Documentos y evaluación' }}
                </button>

                <div v-if="openId === r.id" class="border-t pt-3 space-y-4">
                    <ul class="space-y-1.5">
                        <li v-for="d in docs" :key="d.typeId" class="flex items-center justify-between text-sm">
                            <span class="text-slate-700">{{ d.name }}</span>
                            <div class="flex items-center gap-2">
                                <a v-if="d.document" :href="downloadUrl(d.document.id)" target="_blank" class="text-xs px-2 py-1 border rounded-md hover:bg-slate-100">Ver</a>
                                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold" :class="approvalClass(d.document?.status ?? null)">
                                    {{ approvalLabel(d.document?.status ?? null) }}
                                </span>
                            </div>
                        </li>
                    </ul>

                    <ResidencyEvaluationCard :residency-id="r.id" :can-confirm="false" />
                </div>
            </li>
        </ul>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import ResidencyEvaluationCard from '@/modules/residencies/components/ResidencyEvaluationCard.vue'
import type { Residency, ResidencyDocumentChecklistItem, ResidencyStatus, ApprovalStatus } from '@/modules/residencies/types/residency.type'

const R = API.RESIDENCIES_API

const loading = ref(true)
const rows = ref<Residency[]>([])
const openId = ref<number | null>(null)
const docs = ref<ResidencyDocumentChecklistItem[]>([])

async function load() {
    loading.value = true
    try {
        const { data } = await api.get(R.residency.myAdvisees, { params: { per_page: 100 } })
        rows.value = data.items ?? []
    } finally { loading.value = false }
}

async function toggleDocs(r: Residency) {
    if (openId.value === r.id) { openId.value = null; return }
    openId.value = r.id
    docs.value = []
    const { data } = await api.get(R.documents.forResidency(r.id))
    docs.value = data ?? []
}

function downloadUrl(id: number) { return R.documents.download(id) }

function statusLabel(s: ResidencyStatus): string {
    return ({ registered: 'REGISTRADO', in_progress: 'EN PROCESO', concluded: 'CONCLUIDO', dropped: 'BAJA' } as Record<string, string>)[s] ?? s.toUpperCase()
}
function statusClass(s: ResidencyStatus): string {
    return ({
        registered:  'bg-blue-100 text-blue-700',
        in_progress: 'bg-indigo-100 text-indigo-700',
        concluded:   'bg-emerald-100 text-emerald-700',
        dropped:     'bg-slate-200 text-slate-500',
    } as Record<string, string>)[s] ?? 'bg-slate-100 text-slate-600'
}
function approvalLabel(s: ApprovalStatus | null): string {
    return ({ pending: 'PENDIENTE', approved: 'APROBADO', rejected: 'RECHAZADO' } as Record<string, string>)[s ?? ''] ?? 'SIN SUBIR'
}
function approvalClass(s: ApprovalStatus | null): string {
    return ({
        pending:  'bg-amber-100 text-amber-700',
        approved: 'bg-emerald-100 text-emerald-700',
        rejected: 'bg-red-100 text-red-700',
    } as Record<string, string>)[s ?? ''] ?? 'bg-slate-100 text-slate-500'
}

load()
</script>
