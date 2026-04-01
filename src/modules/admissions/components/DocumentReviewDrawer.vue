<template>
    <Teleport to="body">
        <Transition
            enter-active-class="transition-opacity duration-200"
            leave-active-class="transition-opacity duration-200"
            enter-from-class="opacity-0"
            leave-to-class="opacity-0"
        >
            <div v-if="open" class="fixed top-16 inset-x-0 bottom-0 z-50 flex">
                <!-- Backdrop -->
                <div class="absolute inset-0 bg-black/40" @click="$emit('close')" />

                <!-- Drawer panel -->
                <div class="relative ml-auto flex h-full w-full max-w-4xl bg-white shadow-2xl flex-col">

                    <!-- Header -->
                    <div class="flex items-center justify-between border-b px-6 py-4 shrink-0">
                        <div>
                            <h2 class="text-sm font-bold uppercase tracking-widest text-slate-700">
                                Revisión de Documentos
                            </h2>
                            <p v-if="applicantName" class="text-xs text-slate-400 mt-0.5">{{ applicantName }}</p>
                        </div>
                        <button
                            class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                            @click="$emit('close')"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <!-- Body: list + preview -->
                    <div class="flex flex-1 overflow-hidden">

                        <!-- Document list (left) -->
                        <div class="w-64 shrink-0 border-r overflow-y-auto">
                            <div v-if="loadingDocs" class="flex items-center justify-center h-32 text-slate-400 text-sm">
                                Cargando...
                            </div>
                            <ul v-else class="divide-y">
                                <li
                                    v-for="doc in documents"
                                    :key="doc.id"
                                    class="flex flex-col gap-1 px-4 py-3 cursor-pointer hover:bg-slate-50 transition"
                                    :class="{ 'bg-blue-50': selected?.id === doc.id }"
                                    @click="selectDoc(doc)"
                                >
                                    <span class="text-xs font-semibold text-slate-700 leading-snug truncate">
                                        {{ doc.documentType?.name ?? `Tipo #${doc.documentTypeId}` }}
                                    </span>
                                    <span
                                        class="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full w-fit"
                                        :class="STATUS_DOC_CLASSES[doc.status] ?? 'bg-slate-100 text-slate-500'"
                                    >
                                        {{ STATUS_DOC_LABELS[doc.status] ?? doc.status }}
                                    </span>
                                </li>
                                <li v-if="documents.length === 0" class="px-4 py-6 text-xs text-slate-400 text-center">
                                    Sin documentos
                                </li>
                            </ul>
                        </div>

                        <!-- Preview + actions (right) -->
                        <div class="flex-1 flex flex-col overflow-hidden">
                            <!-- Empty state -->
                            <div v-if="!selected" class="flex flex-col items-center justify-center flex-1 text-slate-300 gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p class="text-sm">Selecciona un documento</p>
                            </div>

                            <template v-else>
                                <!-- Document info bar -->
                                <div class="flex items-center gap-3 border-b px-6 py-3 shrink-0 bg-slate-50">
                                    <div class="flex-1 min-w-0">
                                        <p class="text-sm font-semibold text-slate-700 truncate">{{ selected.originalName }}</p>
                                        <p class="text-xs text-slate-400">{{ selected.mimeType }} · {{ selected.sizeKb ? selected.sizeKb + ' KB' : '—' }}</p>
                                    </div>
                                    <span
                                        class="text-[11px] font-bold uppercase px-2 py-1 rounded-full shrink-0"
                                        :class="STATUS_DOC_CLASSES[selected.status] ?? 'bg-slate-100 text-slate-500'"
                                    >
                                        {{ STATUS_DOC_LABELS[selected.status] ?? selected.status }}
                                    </span>
                                </div>

                                <!-- Preview area -->
                                <div class="flex-1 overflow-auto bg-slate-100 flex items-center justify-center relative">
                                    <!-- Loading preview -->
                                    <div v-if="loadingPreview" class="absolute inset-0 flex items-center justify-center">
                                        <div class="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                                    </div>

                                    <!-- Image preview -->
                                    <img
                                        v-else-if="previewType === 'image' && previewBlobUrl"
                                        :src="previewBlobUrl"
                                        class="max-w-full max-h-full object-contain shadow"
                                        alt="Vista previa"
                                    />

                                    <!-- PDF preview -->
                                    <iframe
                                        v-else-if="previewType === 'pdf' && previewBlobUrl"
                                        :src="previewBlobUrl"
                                        class="w-full h-full border-0"
                                        title="Vista previa PDF"
                                    />

                                    <!-- Download fallback -->
                                    <div v-else-if="!loadingPreview" class="flex flex-col items-center gap-4 p-8 text-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="w-16 h-16 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                        </svg>
                                        <p class="text-sm text-slate-500">Este tipo de archivo no tiene vista previa</p>
                                        <button
                                            class="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                                            @click="downloadSelected"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                            DESCARGAR
                                        </button>
                                    </div>
                                </div>

                                <!-- Rejection reason (visible si fue rechazado) -->
                                <div v-if="selected.rejectionReason && selected.status === 'rejected'" class="border-t bg-red-50 px-6 py-3 text-sm text-red-700 shrink-0">
                                    <span class="font-semibold">Motivo de rechazo:</span> {{ selected.rejectionReason }}
                                </div>

                                <!-- Action bar -->
                                <div class="border-t px-6 py-4 shrink-0 flex flex-col gap-3">
                                    <!-- Rejection reason input (toggle) -->
                                    <div v-if="showRejectInput" class="flex flex-col gap-2">
                                        <label class="text-xs font-semibold text-slate-600 uppercase">Motivo de rechazo</label>
                                        <textarea
                                            v-model="rejectionReason"
                                            rows="3"
                                            maxlength="1000"
                                            placeholder="Describe por qué se rechaza este documento..."
                                            class="w-full text-sm border rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-red-400"
                                        />
                                    </div>

                                    <div class="flex items-center justify-between gap-2">
                                        <div class="flex gap-2">
                                            <!-- Approve -->
                                            <button
                                                class="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                                :disabled="submitting"
                                                @click="submitReview('approved')"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                                </svg>
                                                APROBAR
                                            </button>

                                            <!-- Reject toggle / confirm -->
                                            <button
                                                v-if="!showRejectInput"
                                                class="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                                :disabled="submitting"
                                                @click="showRejectInput = true"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                                RECHAZAR
                                            </button>
                                            <template v-else>
                                                <button
                                                    class="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                                    :disabled="submitting || !rejectionReason.trim()"
                                                    @click="submitReview('rejected')"
                                                >
                                                    CONFIRMAR RECHAZO
                                                </button>
                                                <button
                                                    class="px-3 py-2 text-sm rounded-lg border hover:bg-slate-50 transition"
                                                    @click="cancelReject"
                                                >
                                                    CANCELAR
                                                </button>
                                            </template>
                                        </div>

                                        <!-- Nav prev/next -->
                                        <div class="flex gap-1">
                                            <button
                                                class="border p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 transition"
                                                :disabled="selectedIndex <= 0"
                                                @click="navigateTo(selectedIndex - 1)"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                                                </svg>
                                            </button>
                                            <span class="text-xs text-slate-400 self-center px-1">{{ selectedIndex + 1 }} / {{ documents.length }}</span>
                                            <button
                                                class="border p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 transition"
                                                :disabled="selectedIndex >= documents.length - 1"
                                                @click="navigateTo(selectedIndex + 1)"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </template>
                        </div>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'

interface DocItem {
    id: number
    applicantId: number
    documentTypeId: number
    documentType?: { id: number; name: string } | null
    disk: string
    path: string | null
    originalName: string | null
    mimeType: string | null
    sizeKb: number | null
    status: string
    rejectionReason: string | null
    reviewedBy: number | null
    reviewedAt: string | null
}

const STATUS_DOC_LABELS: Record<string, string> = {
    pending:   'PENDIENTE',
    reviewing: 'EN REVISIÓN',
    approved:  'APROBADO',
    rejected:  'RECHAZADO',
}

const STATUS_DOC_CLASSES: Record<string, string> = {
    pending:   'bg-slate-100 text-slate-600',
    reviewing: 'bg-blue-100 text-blue-700',
    approved:  'bg-green-100 text-green-700',
    rejected:  'bg-red-100 text-red-700',
}

const props = defineProps<{
    open: boolean
    applicantId: number | null
    applicantName?: string | null
}>()

const emit = defineEmits<{
    close: []
    reviewed: []
}>()

const documents    = ref<DocItem[]>([])
const loadingDocs  = ref(false)
const selected     = ref<DocItem | null>(null)
const selectedIndex = ref(-1)

const previewType    = ref<'image' | 'pdf' | 'other' | null>(null)
const previewBlobUrl = ref<string | null>(null)
const loadingPreview = ref(false)

const showRejectInput = ref(false)
const rejectionReason = ref('')
const submitting      = ref(false)

function clearPreview() {
    if (previewBlobUrl.value) {
        URL.revokeObjectURL(previewBlobUrl.value)
        previewBlobUrl.value = null
    }
    previewType.value = null
}

onUnmounted(clearPreview)

async function loadDocuments() {
    if (!props.applicantId) return
    loadingDocs.value = true
    try {
        const res = await api.get(API.ADMISSIONS_API.applicantDocuments.list(props.applicantId))
        documents.value = res.data?.data ?? res.data ?? []
        if (documents.value.length > 0) {
            selectDoc(documents.value[0])
        } else {
            selected.value = null
            selectedIndex.value = -1
        }
    } catch (e) {
        console.error('[DocumentReviewDrawer] Error cargando documentos:', e)
    } finally {
        loadingDocs.value = false
    }
}

async function selectDoc(doc: DocItem) {
    if (selected.value?.id === doc.id) return
    cancelReject()
    clearPreview()
    selected.value = doc
    selectedIndex.value = documents.value.findIndex(d => d.id === doc.id)
    await loadPreview(doc)
}

async function loadPreview(doc: DocItem) {
    if (!doc.path) {
        previewType.value = 'other'
        return
    }
    const mime = (doc.mimeType ?? '').toLowerCase()
    if (mime.startsWith('image/')) {
        previewType.value = 'image'
    } else if (mime === 'application/pdf') {
        previewType.value = 'pdf'
    } else {
        previewType.value = 'other'
        return
    }

    loadingPreview.value = true
    try {
        const res = await api.get(
            API.ADMISSIONS_API.applicantDocuments.download(doc.applicantId, doc.id),
            { responseType: 'blob' }
        )
        previewBlobUrl.value = URL.createObjectURL(res.data)
    } catch (e) {
        console.error('[DocumentReviewDrawer] Error cargando preview:', e)
        previewType.value = 'other'
    } finally {
        loadingPreview.value = false
    }
}

async function downloadSelected() {
    if (!selected.value) return
    try {
        const res = await api.get(
            API.ADMISSIONS_API.applicantDocuments.download(selected.value.applicantId, selected.value.id),
            { responseType: 'blob' }
        )
        const url = URL.createObjectURL(res.data)
        const a = document.createElement('a')
        a.href = url
        a.download = selected.value.originalName ?? 'documento'
        a.click()
        URL.revokeObjectURL(url)
    } catch (e) {
        console.error('[DocumentReviewDrawer] Error descargando:', e)
    }
}

async function submitReview(status: 'approved' | 'rejected') {
    if (!selected.value || !props.applicantId) return
    submitting.value = true
    try {
        const res = await api.patch(
            API.ADMISSIONS_API.applicantDocuments.review(props.applicantId, selected.value.id),
            {
                status,
                rejection_reason: status === 'rejected' ? rejectionReason.value : null,
            }
        )
        // Update local doc status
        const updated = res.data
        const idx = documents.value.findIndex(d => d.id === selected.value!.id)
        if (idx !== -1) {
            documents.value[idx] = { ...documents.value[idx], ...updated }
        }
        selected.value = { ...selected.value, ...updated }
        cancelReject()
        emit('reviewed')

        // Auto-advance to next pending
        const nextPending = documents.value.findIndex(
            (d, i) => i > selectedIndex.value && d.status === 'pending'
        )
        if (nextPending !== -1) navigateTo(nextPending)
    } catch (e) {
        console.error('[DocumentReviewDrawer] Error enviando revisión:', e)
    } finally {
        submitting.value = false
    }
}

function navigateTo(index: number) {
    if (index < 0 || index >= documents.value.length) return
    selectDoc(documents.value[index])
}

function cancelReject() {
    showRejectInput.value = false
    rejectionReason.value = ''
}

watch(() => props.open, (val) => {
    if (val && props.applicantId) {
        loadDocuments()
    } else if (!val) {
        clearPreview()
        selected.value = null
        selectedIndex.value = -1
        documents.value = []
        cancelReject()
    }
})

watch(() => props.applicantId, (val) => {
    if (props.open && val) loadDocuments()
})
</script>
