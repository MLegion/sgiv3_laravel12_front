<template>
    <div class="border rounded-xl bg-white shadow-sm overflow-hidden">
        <div class="px-5 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b flex items-center justify-between">
            <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <h3 class="text-sm font-black uppercase text-blue-900">Plantilla Word (.docx)</h3>
            </div>
            <div class="text-[10px] uppercase text-slate-500 font-semibold">
                Nuevo pipeline
            </div>
        </div>

        <div class="p-5">
            <p v-if="error" class="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{{ error }}</p>

            <!-- Estado: sin plantilla -->
            <div v-if="!hasTemplate && !busy" class="space-y-3">
                <div
                    class="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50 hover:bg-blue-50 hover:border-blue-400 transition-colors cursor-pointer"
                    @click="openPicker"
                    @dragover.prevent="dragOver = true"
                    @dragleave.prevent="dragOver = false"
                    @drop.prevent="onDrop"
                    :class="{ 'bg-blue-100 border-blue-500': dragOver }"
                >
                    <svg class="mx-auto w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                    </svg>
                    <p class="mt-2 text-sm font-semibold text-slate-700">
                        Arrastra aquí tu plantilla Word o haz clic para seleccionar
                    </p>
                    <p class="text-[11px] text-slate-500 mt-1">Solo archivos .docx — máx. 10 MB</p>
                </div>

                <div class="bg-amber-50 border border-amber-200 rounded-lg p-3 text-[11px] text-amber-800">
                    <p class="font-bold uppercase mb-1">Cómo usar placeholders en Word</p>
                    <ul class="list-disc pl-5 space-y-0.5 font-mono">
                        <li><code>{alumno.nombre}</code> — variable simple</li>
                        <li><code>{#materias}</code> ... <code>{/materias}</code> — loop sobre array</li>
                        <li>Dentro del loop, <code>{clave}</code>, <code>{nombre}</code>, etc.</li>
                    </ul>
                </div>
            </div>

            <!-- Estado: con plantilla -->
            <div v-if="hasTemplate && !busy" class="space-y-3">
                <div class="flex items-center justify-between gap-3 p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200">
                    <div class="flex items-center gap-3 min-w-0">
                        <div class="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0">
                            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                        </div>
                        <div class="min-w-0">
                            <p class="text-sm font-bold text-emerald-900 truncate">{{ templateName || 'plantilla.docx' }}</p>
                            <p class="text-[11px] text-emerald-700">Plantilla cargada</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2 flex-shrink-0">
                        <button class="px-3 py-1.5 text-xs font-bold rounded border border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-100" @click="download">
                            ⬇ DESCARGAR
                        </button>
                        <button class="px-3 py-1.5 text-xs font-bold rounded border border-blue-300 bg-white text-blue-700 hover:bg-blue-100" @click="openPicker">
                            REEMPLAZAR
                        </button>
                        <button class="px-3 py-1.5 text-xs font-bold rounded border border-red-300 bg-white text-red-700 hover:bg-red-100" @click="remove">
                            ELIMINAR
                        </button>
                    </div>
                </div>

                <!-- Preview (auto) -->
                <div>
                    <div class="flex items-center justify-between mb-2">
                        <p class="text-[11px] font-bold uppercase text-slate-600">Vista previa</p>
                        <button
                            class="px-3 py-1 text-xs font-semibold rounded border hover:bg-slate-50 text-slate-700"
                            @click="loadPreview"
                            :disabled="busy"
                            title="Recargar vista previa"
                        >
                            🔄 RECARGAR
                        </button>
                    </div>
                    <div
                        ref="previewContainer"
                        class="border rounded-lg bg-slate-50 p-4 max-h-[600px] overflow-auto docx-preview-host"
                    >
                        <div v-if="!previewLoaded && !previewing" class="text-center text-[11px] text-slate-400 py-10 italic">
                            Cargando vista previa...
                        </div>
                    </div>
                </div>
            </div>

            <!-- Loading -->
            <div v-if="busy" class="py-6 text-center">
                <svg class="animate-spin mx-auto w-6 h-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                <p class="mt-2 text-xs text-slate-500">{{ busyMessage }}</p>
            </div>

            <input ref="fileInput" type="file" accept=".docx" class="hidden" @change="onFileSelected" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { renderAsync } from 'docx-preview'

const props = defineProps<{
    reportId:              number | string
    templateOriginalName?: string | null
    hasTemplate:           boolean
}>()

const emit = defineEmits<{
    (e: 'update', payload: { hasTemplate: boolean; templateOriginalName: string | null }): void
}>()

const fileInput        = ref<HTMLInputElement | null>(null)
const previewContainer = ref<HTMLElement | null>(null)
const error            = ref<string | null>(null)
const dragOver         = ref(false)
const busy             = ref(false)
const busyMessage      = ref('')
const previewLoaded    = ref(false)
const previewing       = ref(false)

const hasTemplate  = computed(() => props.hasTemplate)
const templateName = computed(() => props.templateOriginalName)

function openPicker() { fileInput.value?.click() }

function onFileSelected(ev: Event) {
    const input = ev.target as HTMLInputElement
    const file = input.files?.[0]
    if (file) void upload(file)
    input.value = ''
}

function onDrop(ev: DragEvent) {
    dragOver.value = false
    const file = ev.dataTransfer?.files?.[0]
    if (file) void upload(file)
}

function validate(file: File): string | null {
    if (!file.name.toLowerCase().endsWith('.docx')) return 'Solo se admiten archivos .docx'
    if (file.size > 10 * 1024 * 1024) return 'El archivo excede 10 MB'
    return null
}

async function upload(file: File) {
    error.value = null
    const v = validate(file)
    if (v) { error.value = v; return }

    busy.value = true
    busyMessage.value = 'Subiendo plantilla...'
    try {
        const form = new FormData()
        form.append('template', file)
        const { data } = await api.post(API.REPORTS_API.reports.template(props.reportId), form, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
        emit('update', {
            hasTemplate:          Boolean(data?.hasTemplate ?? data?.templatePath),
            templateOriginalName: data?.templateOriginalName ?? file.name,
        })
        // Liberar busy antes de cargar el preview: el contenedor del preview
        // está dentro de v-if="hasTemplate && !busy", así que si sigue true
        // el ref no existe cuando renderAsync intenta pintar.
        busy.value = false
        await nextTick()
        await loadPreview()
    } catch (e: any) {
        error.value = e?.response?.data?.errors?.template?.[0]
                   ?? e?.response?.data?.message
                   ?? 'Error al subir la plantilla'
        busy.value = false
    }
}

async function download() {
    error.value = null
    try {
        const res = await api.get(API.REPORTS_API.reports.template(props.reportId), { responseType: 'blob' })
        const blob = res.data as Blob
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = templateName.value || 'plantilla.docx'
        a.click()
        URL.revokeObjectURL(url)
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'Error al descargar la plantilla'
    }
}

async function remove() {
    if (!confirm('¿Eliminar la plantilla asociada a este reporte?')) return
    error.value = null
    busy.value = true
    busyMessage.value = 'Eliminando plantilla...'
    try {
        const { data } = await api.delete(API.REPORTS_API.reports.template(props.reportId))
        emit('update', {
            hasTemplate:          Boolean(data?.hasTemplate ?? data?.templatePath),
            templateOriginalName: data?.templateOriginalName ?? null,
        })
        clearPreview()
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'Error al eliminar la plantilla'
    } finally {
        busy.value = false
    }
}

async function loadPreview() {
    if (!props.hasTemplate) return
    error.value = null
    previewing.value = true
    try {
        const res = await api.get(API.REPORTS_API.reports.template(props.reportId), { responseType: 'blob' })
        const blob = res.data as Blob
        await nextTick()
        if (!previewContainer.value) return
        previewContainer.value.innerHTML = ''
        await renderAsync(blob, previewContainer.value, undefined, {
            className:    'docx-preview',
            inWrapper:    true,
            ignoreWidth:  false,
            ignoreHeight: false,
            breakPages:   true,
            experimental: true,
            useBase64URL: true,
        })
        previewLoaded.value = true
    } catch (e: any) {
        previewLoaded.value = false
        error.value = e?.message ?? 'Error al renderizar la vista previa'
    } finally {
        previewing.value = false
    }
}

function clearPreview() {
    if (previewContainer.value) previewContainer.value.innerHTML = ''
    previewLoaded.value = false
}

onMounted(() => {
    if (props.hasTemplate) void loadPreview()
})

watch(() => props.hasTemplate, (has) => {
    if (has) void loadPreview()
    else clearPreview()
})
</script>

<style scoped>
.docx-preview-host :deep(.docx-wrapper) { background: transparent; }
.docx-preview-host :deep(.docx) {
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    margin-bottom: 12px;
}
</style>
