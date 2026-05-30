<template>
    <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        @click.self="cancel"
    >
        <div class="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] flex flex-col">
            <header class="px-5 py-3 border-b border-slate-200">
                <h2 class="text-base font-semibold text-slate-800">Programa de estudio</h2>
                <p class="text-xs text-slate-500 mt-0.5">
                    {{ subjectCode }} · {{ subjectName }}
                </p>
            </header>

            <div class="px-5 py-4 space-y-5 overflow-y-auto text-sm text-slate-700">
                <!-- Estado actual -->
                <section class="rounded-lg border p-3 text-xs"
                    :class="state.isLocal
                        ? 'bg-emerald-50 border-emerald-200'
                        : (state.url ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200')">
                    <div v-if="state.isLocal" class="space-y-1">
                        <p class="font-semibold text-emerald-800">Respaldado en el sistema</p>
                        <p v-if="state.sourceUrl" class="text-emerald-900 break-all">
                            Origen: {{ state.sourceUrl }}
                        </p>
                        <button class="mt-1 text-emerald-700 underline" @click="view">Ver PDF</button>
                    </div>
                    <div v-else-if="state.url" class="space-y-1">
                        <p class="font-semibold text-blue-800">Enlace externo</p>
                        <p class="text-blue-900 break-all">{{ state.url }}</p>
                        <button class="mt-1 text-blue-700 underline" @click="view">Abrir enlace</button>
                    </div>
                    <p v-else class="text-slate-500">Sin programa asignado.</p>
                </section>

                <!-- Subir PDF -->
                <section>
                    <label class="block text-[11px] uppercase tracking-wider text-slate-500 mb-1">
                        Subir PDF del programa
                    </label>
                    <input
                        ref="fileInput"
                        type="file"
                        accept="application/pdf,.pdf"
                        class="hidden"
                        @change="onFileChange"
                    />
                    <div class="flex items-center gap-2">
                        <button
                            type="button"
                            class="px-3 py-1.5 text-xs rounded border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                            :disabled="isBusy"
                            @click="pickFile"
                        >Seleccionar PDF…</button>
                        <span v-if="file" class="text-[11px] text-slate-500 truncate">{{ file.name }}</span>
                    </div>
                    <button
                        type="button"
                        class="mt-2 px-3 py-1.5 text-xs font-semibold rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                        :disabled="!file || isBusy"
                        @click="upload"
                    >{{ busy === 'upload' ? 'Subiendo…' : 'Subir PDF' }}</button>
                </section>

                <!-- Pegar URL externa -->
                <section>
                    <label class="block text-[11px] uppercase tracking-wider text-slate-500 mb-1">
                        O pegar URL externa
                    </label>
                    <input
                        v-model="urlInput"
                        type="url"
                        placeholder="https://..."
                        class="w-full border border-slate-300 rounded px-2 py-1.5 text-xs"
                        :disabled="isBusy"
                    />
                    <button
                        type="button"
                        class="mt-2 px-3 py-1.5 text-xs font-semibold rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                        :disabled="!urlInput.trim() || isBusy"
                        @click="saveUrl"
                    >{{ busy === 'url' ? 'Guardando…' : 'Guardar URL' }}</button>
                    <p class="text-[10px] text-slate-400 mt-1">Guardar una URL descarta cualquier copia local.</p>
                </section>

                <p v-if="error" class="text-xs text-rose-700">{{ error }}</p>
            </div>

            <footer class="px-5 py-3 border-t border-slate-200 flex justify-between gap-2">
                <button
                    type="button"
                    class="px-3 py-1.5 text-xs rounded text-rose-600 hover:bg-rose-50 disabled:opacity-40"
                    :disabled="(!state.isLocal && !state.url) || isBusy"
                    @click="remove"
                >{{ busy === 'remove' ? 'Quitando…' : 'Quitar programa' }}</button>
                <button
                    type="button"
                    class="px-3 py-1.5 text-xs rounded text-slate-600 hover:bg-slate-100"
                    :disabled="isBusy"
                    @click="cancel"
                >Cerrar</button>
            </footer>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { openSubjectProgram } from '@/modules/study-programs/composables/useSubjectProgram'

const props = defineProps<{
    modelValue:   boolean
    subjectId:    number
    subjectCode:  string
    subjectName:  string
    programUrl?:  string | null
    programIsLocal?: boolean
    programSourceUrl?: string | null
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', v: boolean): void
    (e: 'changed', v: { programUrl: string | null; programIsLocal: boolean; programSourceUrl: string | null }): void
}>()

const state = reactive({
    url:       props.programUrl ?? null,
    isLocal:   props.programIsLocal ?? false,
    sourceUrl: props.programSourceUrl ?? null,
})

const file      = ref<File | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const urlInput  = ref('')

function pickFile(): void {
    fileInput.value?.click()
}
const busy      = ref<'' | 'upload' | 'url' | 'remove'>('')
const isBusy    = computed(() => busy.value !== '')
const error    = ref('')

watch(() => props.modelValue, (v) => {
    if (v) {
        state.url       = props.programUrl ?? null
        state.isLocal   = props.programIsLocal ?? false
        state.sourceUrl = props.programSourceUrl ?? null
        file.value      = null
        urlInput.value  = ''
        error.value     = ''
        busy.value      = ''
    }
})

function onFileChange(e: Event): void {
    file.value = (e.target as HTMLInputElement).files?.[0] ?? null
}

function emitChanged(): void {
    emit('changed', { programUrl: state.url, programIsLocal: state.isLocal, programSourceUrl: state.sourceUrl })
}

function readError(e: unknown): string {
    const err = e as { response?: { data?: { message?: string; error?: string } } }
    return err.response?.data?.message ?? err.response?.data?.error ?? 'Ocurrió un error.'
}

async function upload(): Promise<void> {
    if (!file.value) return
    busy.value = 'upload'; error.value = ''
    try {
        const form = new FormData()
        form.append('file', file.value)
        // No fijamos Content-Type: axios añade el boundary del multipart por nosotros.
        await api.post(API.STUDY_PROGRAMS_API.subjectLinks.programFile(props.subjectId), form)
        state.isLocal = true; state.sourceUrl = null
        file.value = null
        emitChanged()
    } catch (e) {
        error.value = readError(e)
    } finally {
        busy.value = ''
    }
}

async function saveUrl(): Promise<void> {
    if (!urlInput.value.trim()) return
    busy.value = 'url'; error.value = ''
    try {
        await api.patch(API.STUDY_PROGRAMS_API.subjectLinks.setUrl(props.subjectId), {
            program_url: urlInput.value.trim(),
        })
        state.url = urlInput.value.trim(); state.isLocal = false; state.sourceUrl = null
        urlInput.value = ''
        emitChanged()
    } catch (e) {
        error.value = readError(e)
    } finally {
        busy.value = ''
    }
}

async function remove(): Promise<void> {
    busy.value = 'remove'; error.value = ''
    try {
        if (state.isLocal) {
            await api.delete(API.STUDY_PROGRAMS_API.subjectLinks.programFile(props.subjectId))
        } else {
            await api.patch(API.STUDY_PROGRAMS_API.subjectLinks.setUrl(props.subjectId), { program_url: null })
        }
        state.url = null; state.isLocal = false; state.sourceUrl = null
        emitChanged()
    } catch (e) {
        error.value = readError(e)
    } finally {
        busy.value = ''
    }
}

async function view(): Promise<void> {
    try {
        await openSubjectProgram(props.subjectId, state.isLocal, state.url)
    } catch (e) {
        error.value = readError(e)
    }
}

function cancel(): void {
    emit('update:modelValue', false)
}
</script>
