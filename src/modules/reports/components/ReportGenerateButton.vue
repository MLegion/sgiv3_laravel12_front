<template>
    <div class="inline-block">
        <button
            type="button"
            :class="buttonClass ?? defaultButtonClass"
            :disabled="loading"
            @click="onClick"
        >
            <svg v-if="loading" class="w-3.5 h-3.5 animate-spin inline mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            {{ loading ? (loadingLabel ?? 'Generando...') : (label ?? defaultLabel) }}
        </button>

        <Teleport to="body">
            <div v-if="modalOpen" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60" @click.self="close">
                <div class="bg-white rounded-xl shadow-2xl w-[95vw] h-[95vh] flex flex-col overflow-hidden">
                    <div class="px-5 py-3 bg-indigo-800 text-white flex items-center justify-between flex-shrink-0">
                        <h3 class="text-sm font-black uppercase">
                            {{ modalTitle }}
                        </h3>
                        <div class="flex items-center gap-2">
                            <button class="px-3 py-1.5 text-xs font-bold rounded bg-emerald-500 hover:bg-emerald-600 uppercase" @click="downloadCurrent">
                                ⬇ DESCARGAR {{ format.toUpperCase() }}
                            </button>
                            <button class="px-3 py-1.5 text-xs font-bold rounded bg-slate-600 hover:bg-slate-500 uppercase" @click="close">
                                CERRAR
                            </button>
                        </div>
                    </div>
                    <div class="flex-1 bg-slate-200 overflow-auto p-6">
                        <!-- DOCX: render HTML via docx-preview -->
                        <div v-if="format === 'docx'" ref="docxHost" class="docx-preview-host"></div>

                        <!-- PDF: iframe con el blob -->
                        <iframe
                            v-else
                            :src="pdfBlobUrl ?? ''"
                            class="w-full h-full border-0 bg-white rounded shadow"
                            :title="modalTitle"
                        ></iframe>
                    </div>
                </div>
            </div>
        </Teleport>

        <p v-if="errorMessage" class="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">
            {{ errorMessage }}
        </p>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onBeforeUnmount } from 'vue'
import { useReportGenerator, type GenerateOptions } from '@/modules/reports/composables/useReportGenerator'

type Format = 'pdf' | 'docx'

const props = withDefaults(defineProps<{
    reportId:      number | string
    params?:       Record<string, unknown>
    format?:       Format
    label?:        string
    loadingLabel?: string
    filename?:     string
    buttonClass?:  string
}>(), {
    params:       () => ({}),
    format:       'pdf',
    label:        undefined,
    loadingLabel: undefined,
    filename:     undefined,
    buttonClass:  undefined,
})

const emit = defineEmits<{
    (e: 'generated', payload: { blob: Blob; filename: string }): void
    (e: 'error', message: string): void
}>()

const { loading, generate, generatePdf } = useReportGenerator()

const modalOpen      = ref(false)
const docxHost       = ref<HTMLElement | null>(null)
const pdfBlobUrl     = ref<string | null>(null)
const currentBlob    = ref<Blob | null>(null)
const currentName    = ref<string>('')
const errorMessage   = ref<string | null>(null)

const defaultLabel = computed(() => props.format === 'docx' ? 'Generar DOCX' : 'Generar PDF')
const defaultButtonClass = 'px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
const modalTitle = computed(() => `Vista previa — ${currentName.value || 'Reporte'}`)

async function onClick() {
    errorMessage.value = null
    const opts: GenerateOptions = {
        reportId: props.reportId,
        params:   props.params,
        filename: props.filename,
    }

    try {
        if (props.format === 'pdf') {
            const { blob, filename } = await generatePdf(opts)
            currentBlob.value = blob
            currentName.value = filename
            if (pdfBlobUrl.value) URL.revokeObjectURL(pdfBlobUrl.value)
            pdfBlobUrl.value = URL.createObjectURL(blob)
            modalOpen.value = true
            emit('generated', { blob, filename })
        } else {
            const { blob, filename, report } = await generate(opts)
            currentBlob.value = blob
            currentName.value = filename
            modalOpen.value = true
            await nextTick()
            if (docxHost.value) {
                const { renderAsync } = await import('docx-preview')
                docxHost.value.innerHTML = ''
                await renderAsync(blob, docxHost.value, undefined, {
                    className:    'docx-preview',
                    inWrapper:    true,
                    breakPages:   true,
                    experimental: true,
                    useBase64URL: true,
                })
            }
            emit('generated', { blob, filename })
            void report
        }
    } catch (e: any) {
        errorMessage.value = e?.message ?? 'Error al generar el reporte'
        emit('error', errorMessage.value!)
    }
}

function downloadCurrent() {
    if (!currentBlob.value) return
    const url = URL.createObjectURL(currentBlob.value)
    const a = document.createElement('a')
    a.href = url
    a.download = currentName.value
    a.click()
    URL.revokeObjectURL(url)
}

function close() {
    modalOpen.value = false
    if (docxHost.value) docxHost.value.innerHTML = ''
    if (pdfBlobUrl.value) {
        URL.revokeObjectURL(pdfBlobUrl.value)
        pdfBlobUrl.value = null
    }
}

onBeforeUnmount(() => {
    if (pdfBlobUrl.value) URL.revokeObjectURL(pdfBlobUrl.value)
})
</script>

<style>
.docx-preview-host .docx-wrapper { background: transparent; }
.docx-preview-host .docx {
    margin: 0 auto 16px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    background: white;
}
</style>
