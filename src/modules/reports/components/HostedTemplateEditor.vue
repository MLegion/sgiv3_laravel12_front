<template>
    <div class="border rounded-xl bg-white shadow-sm overflow-hidden">
        <div class="px-5 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b flex items-center justify-between gap-3">
            <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <h3 class="text-sm font-black uppercase text-blue-900">Plantilla de reporte</h3>
                <span
                    class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                    :class="mode === 'edit' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'"
                >{{ mode === 'edit' ? 'Edición' : 'Solo lectura' }}</span>
            </div>

            <!-- Controles FUERA del documento de Nubofi -->
            <div class="flex items-center gap-2">
                <button
                    v-if="mode === 'view'"
                    type="button"
                    :disabled="loading"
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50"
                    @click="open('edit')"
                >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                    {{ loading ? 'Abriendo…' : 'Editar' }}
                </button>
                <button
                    v-else
                    type="button"
                    :disabled="loading"
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50"
                    @click="open('view')"
                >
                    {{ loading ? 'Cargando…' : 'Salir de edición' }}
                </button>
            </div>
        </div>

        <div class="p-5">
            <p v-if="error" class="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{{ error }}</p>

            <div v-if="loading && !hostedUrl" class="h-[70vh] flex items-center justify-center text-sm text-slate-400">
                Cargando documento…
            </div>

            <iframe
                v-if="hostedUrl"
                :key="hostedUrl"
                :src="hostedUrl"
                class="w-full h-[70vh] rounded-lg border border-slate-200 bg-slate-50"
                title="Plantilla de reporte (Nubofi)"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            ></iframe>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'

const props = defineProps<{ reportId: string | number }>()
const emit = defineEmits<{ (e: 'saved'): void }>()

const mode = ref<'view' | 'edit'>('view')
const loading = ref(false)
const error = ref<string | null>(null)
const hostedUrl = ref<string | null>(null)
let nubofiOrigin = ''

/** Abre la plantilla en el modo dado: 'view' (solo lectura) o 'edit' (editable). */
async function open(m: 'view' | 'edit') {
    loading.value = true
    error.value = null
    try {
        const { data } = await api.post(API.REPORTS_API.reports.editorSession(props.reportId), { mode: m })
        const url = data?.hostedUrl ?? null
        if (!url) throw new Error('empty')
        try { nubofiOrigin = new URL(url).origin } catch { nubofiOrigin = '' }
        window.addEventListener('message', onMessage)
        hostedUrl.value = url   // :key fuerza recarga del iframe con el nuevo token
        mode.value = m
    } catch (e: any) {
        error.value = e?.response?.data?.message
            ?? 'No se pudo abrir la plantilla. Verifica que Nubofi esté configurado y disponible.'
    } finally {
        loading.value = false
    }
}

// Nubofi puede emitir un postMessage al guardar; lo propagamos como 'saved'.
function onMessage(ev: MessageEvent) {
    if (nubofiOrigin && ev.origin !== nubofiOrigin) return
    const t = typeof ev.data === 'object' ? (ev.data?.type ?? ev.data?.event) : ev.data
    if (t === 'save' || t === 'saved' || t === 'document-saved') {
        emit('saved')
    }
}

onMounted(() => open('view'))   // por defecto: mostrar el documento en solo lectura
onBeforeUnmount(() => window.removeEventListener('message', onMessage))
</script>
