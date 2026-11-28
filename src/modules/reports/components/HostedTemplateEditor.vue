<template>
    <div class="border rounded-xl bg-white shadow-sm overflow-hidden">
        <div class="px-5 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b flex items-center justify-between">
            <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
                <h3 class="text-sm font-black uppercase text-blue-900">Plantilla de reporte (Nubofi)</h3>
            </div>
            <div class="text-[10px] uppercase text-slate-500 font-semibold">Editor hosted</div>
        </div>

        <div class="p-5">
            <p v-if="error" class="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{{ error }}</p>

            <!-- Cerrado: botón para abrir el editor -->
            <div v-if="!open" class="space-y-3">
                <p class="text-sm text-slate-600">
                    Edita la plantilla en el editor hosted de Nubofi. Los cambios se guardan directamente en SGIv3.
                </p>
                <button
                    type="button"
                    :disabled="loading"
                    class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
                    @click="openEditor"
                >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    {{ loading ? 'Abriendo…' : 'Abrir editor de plantilla' }}
                </button>
            </div>

            <!-- Abierto: iframe del editor hosted -->
            <div v-else class="space-y-2">
                <div class="flex items-center justify-between">
                    <span class="text-xs text-slate-500">Sesión de edición activa</span>
                    <button type="button" class="text-xs text-slate-500 hover:text-red-600 font-semibold" @click="closeEditor">Cerrar editor</button>
                </div>
                <iframe
                    v-if="hostedUrl"
                    :src="hostedUrl"
                    class="w-full h-[70vh] rounded-lg border border-slate-200 bg-slate-50"
                    title="Editor de plantilla de reporte (Nubofi)"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                ></iframe>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'

const props = defineProps<{ reportId: string | number }>()
const emit = defineEmits<{ (e: 'saved'): void }>()

const open = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)
const hostedUrl = ref<string | null>(null)
let nubofiOrigin = ''

async function openEditor() {
    loading.value = true
    error.value = null
    try {
        const { data } = await api.post(API.REPORTS_API.reports.editorSession(props.reportId))
        hostedUrl.value = data?.hostedUrl ?? null
        if (!hostedUrl.value) throw new Error('empty')
        try { nubofiOrigin = new URL(hostedUrl.value).origin } catch { nubofiOrigin = '' }
        window.addEventListener('message', onMessage)
        open.value = true
    } catch (e: any) {
        error.value = e?.response?.data?.message
            ?? 'No se pudo abrir el editor de plantilla. Verifica que Nubofi esté configurado y disponible.'
    } finally {
        loading.value = false
    }
}

function closeEditor() {
    open.value = false
    hostedUrl.value = null
    window.removeEventListener('message', onMessage)
}

// Nubofi puede emitir un postMessage al guardar/cerrar; lo propagamos como 'saved'.
function onMessage(ev: MessageEvent) {
    if (nubofiOrigin && ev.origin !== nubofiOrigin) return
    const t = typeof ev.data === 'object' ? (ev.data?.type ?? ev.data?.event) : ev.data
    if (t === 'save' || t === 'saved' || t === 'document-saved') {
        emit('saved')
    }
}

onBeforeUnmount(() => window.removeEventListener('message', onMessage))
</script>
