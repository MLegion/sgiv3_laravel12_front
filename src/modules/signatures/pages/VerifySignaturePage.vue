<template>
    <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div class="w-full max-w-lg bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div class="px-6 py-5 border-b border-slate-100">
                <h1 class="text-lg font-semibold text-slate-800">Verificación de firma electrónica</h1>
                <p class="text-sm text-slate-500 mt-0.5">Folio <span class="font-mono">{{ folio }}</span></p>
            </div>

            <div class="p-6">
                <div v-if="loading" class="py-10 text-center text-slate-400 text-sm">Verificando…</div>

                <template v-else>
                    <!-- Estado -->
                    <div class="flex items-center gap-3 rounded-xl px-4 py-3" :class="badge.wrap">
                        <span class="inline-flex h-9 w-9 items-center justify-center rounded-full text-white" :class="badge.dot">
                            <svg v-if="status==='valida'" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                            <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.29 3.86l-8.48 14.7A1 1 0 002.67 20h18.66a1 1 0 00.86-1.44l-8.48-14.7a1 1 0 00-1.72 0z"/></svg>
                        </span>
                        <div>
                            <p class="font-semibold" :class="badge.text">{{ badge.label }}</p>
                            <p class="text-xs" :class="badge.text">{{ badge.hint }}</p>
                        </div>
                    </div>

                    <!-- Detalle -->
                    <dl v-if="data && status !== 'no_encontrada'" class="mt-6 space-y-3 text-sm">
                        <div class="flex justify-between gap-4">
                            <dt class="text-slate-400">Firmante</dt>
                            <dd class="text-slate-800 text-right">{{ data.signer_name || '—' }}<span v-if="data.signer_role" class="block text-xs text-slate-400">{{ data.signer_role }}</span></dd>
                        </div>
                        <div class="flex justify-between gap-4">
                            <dt class="text-slate-400">Propósito</dt>
                            <dd class="text-slate-800 text-right">{{ data.purpose || '—' }}</dd>
                        </div>
                        <div class="flex justify-between gap-4">
                            <dt class="text-slate-400">Fecha de firma</dt>
                            <dd class="text-slate-800 text-right">{{ formatDate(data.signed_at) }}</dd>
                        </div>
                        <div v-if="data.revoke_reason" class="flex justify-between gap-4">
                            <dt class="text-slate-400">Motivo de revocación</dt>
                            <dd class="text-rose-700 text-right">{{ data.revoke_reason }}</dd>
                        </div>
                        <div class="pt-3 border-t border-slate-100">
                            <dt class="text-slate-400 mb-1">Huella del documento (SHA-256)</dt>
                            <dd class="font-mono text-[11px] break-all text-slate-500">{{ data.document_hash }}</dd>
                        </div>
                    </dl>

                    <!-- Documento archivado (Capa B): se presenta el PDF exacto firmado -->
                    <a v-if="documentUrl" :href="documentUrl" target="_blank" rel="noopener"
                        class="mt-5 flex items-center justify-center gap-2 rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-900">
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 4H7a2 2 0 01-2-2V6a2 2 0 012-2h6l6 6v10a2 2 0 01-2 2z"/></svg>
                        Ver documento firmado
                    </a>

                    <!-- Contenido firmado para cotejo (solo con el token del QR) -->
                    <div v-if="data && data.content_visible && (snapshotScalars.length || snapshotTables.length)" class="mt-5 pt-5 border-t border-slate-100">
                        <h2 class="text-sm font-semibold text-slate-700 mb-1">Contenido firmado</h2>
                        <p class="text-xs text-slate-400 mb-3">Compara estos datos contra el documento que tienes en mano.</p>

                        <dl v-if="snapshotScalars.length" class="space-y-1.5 text-sm">
                            <div v-for="[k, v] in snapshotScalars" :key="k" class="flex justify-between gap-4">
                                <dt class="text-slate-400">{{ humanize(k) }}</dt>
                                <dd class="text-slate-800 text-right">{{ v === null || v === '' ? '—' : v }}</dd>
                            </div>
                        </dl>

                        <div v-for="t in snapshotTables" :key="t.key" class="mt-4">
                            <p class="text-xs font-semibold text-slate-500 mb-1">{{ humanize(t.key) }}</p>
                            <div class="overflow-x-auto rounded-lg border border-slate-100">
                                <table class="w-full text-[11px]">
                                    <thead class="bg-slate-50 text-slate-500">
                                        <tr><th v-for="c in t.cols" :key="c" class="px-2 py-1 text-left font-medium">{{ humanize(c) }}</th></tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="(row, i) in t.rows" :key="i" class="border-t border-slate-100">
                                            <td v-for="c in t.cols" :key="c" class="px-2 py-1 text-slate-700">{{ row[c] ?? '—' }}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <!-- Sin token: el veredicto es público, el contenido no -->
                    <p v-else-if="data && status !== 'no_encontrada' && !data.content_visible" class="mt-5 pt-5 border-t border-slate-100 text-xs text-slate-400">
                        Escanea el código QR del documento para ver su contenido y cotejarlo.
                    </p>
                </template>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'

const route = useRoute()
const folio = String(route.params.folio ?? '')
const token = String(route.query.t ?? '')

const loading = ref(true)
const status = ref<'valida' | 'alterada' | 'revocada' | 'no_encontrada'>('no_encontrada')
const data = ref<any>(null)

// URL pública del documento archivado (Capa B), solo si hay token y evidencia.
const documentUrl = computed(() =>
    token && data.value?.has_document ? API.SIGNATURES_API.documentUrl(folio, token) : null,
)

// Contenido firmado (para cotejo): campos escalares + tablas (arreglos de objetos).
function humanize(k: string): string {
    return k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
const snapshotScalars = computed<Array<[string, any]>>(() => {
    const s = data.value?.signed_snapshot
    if (!s || typeof s !== 'object') return []
    return Object.entries(s).filter(([k, v]) =>
        !k.startsWith('_') && (v === null || ['string', 'number', 'boolean'].includes(typeof v))) as Array<[string, any]>
})
const snapshotTables = computed<Array<{ key: string; rows: any[]; cols: string[] }>>(() => {
    const s = data.value?.signed_snapshot
    if (!s || typeof s !== 'object') return []
    const out: Array<{ key: string; rows: any[]; cols: string[] }> = []
    for (const [k, v] of Object.entries(s)) {
        if (Array.isArray(v) && v.length && typeof v[0] === 'object' && v[0]) {
            out.push({ key: k, rows: v as any[], cols: Object.keys(v[0] as object) })
        }
    }
    return out
})

const badge = computed(() => {
    switch (status.value) {
        case 'valida':
            return { wrap: 'bg-emerald-50', dot: 'bg-emerald-500', text: 'text-emerald-800', label: 'Firma VÁLIDA', hint: 'El documento coincide con lo firmado.' }
        case 'alterada':
            return { wrap: 'bg-amber-50', dot: 'bg-amber-500', text: 'text-amber-800', label: 'Documento ALTERADO', hint: 'El contenido cambió después de firmarse.' }
        case 'revocada':
            return { wrap: 'bg-rose-50', dot: 'bg-rose-500', text: 'text-rose-800', label: 'Firma REVOCADA', hint: 'La firma fue anulada.' }
        default:
            return { wrap: 'bg-slate-100', dot: 'bg-slate-400', text: 'text-slate-700', label: 'Folio no encontrado', hint: 'No existe una firma con este folio.' }
    }
})

function formatDate(iso: string | null): string {
    if (!iso) return '—'
    try { return new Date(iso).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' }) } catch { return iso }
}

onMounted(async () => {
    try {
        const { data: res } = await api.get(API.SIGNATURES_API.verify(folio, token))
        status.value = res.status
        data.value = res
    } catch (e: any) {
        status.value = e?.response?.data?.status ?? 'no_encontrada'
        data.value = e?.response?.data ?? null
    } finally {
        loading.value = false
    }
})
</script>
