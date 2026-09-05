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

const loading = ref(true)
const status = ref<'valida' | 'alterada' | 'revocada' | 'no_encontrada'>('no_encontrada')
const data = ref<any>(null)

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
        const { data: res } = await api.get(API.SIGNATURES_API.verify(folio))
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
