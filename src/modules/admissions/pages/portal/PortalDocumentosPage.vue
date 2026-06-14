<template>
    <div>
        <div class="max-w-4xl space-y-6">
        <PortalStepper />
            <h1 class="text-xl font-semibold text-slate-800">CARGA DE DOCUMENTOS</h1>

        <div v-if="loading" class="text-sm text-slate-400 py-8 text-center">Cargando...</div>

        <!-- Sin preficha: bloquear acceso -->
        <div
            v-else-if="applicantStatus < STATUS_FICHA"
            class="bg-amber-50 border border-amber-300 rounded-xl p-10 text-center space-y-2"
        >
            <svg class="w-12 h-12 text-amber-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <p class="text-amber-800 font-bold text-base uppercase tracking-wide">
                REQUIERE OBTENER LA PREFICHA PARA PODER CONTINUAR
            </p>
            <p class="text-sm text-amber-600">
                Complete los campos requeridos en <strong>Mi Expediente</strong> y obtenga su Preficha para poder cargar sus documentos.
            </p>
            <router-link
                :to="{ name: 'admissions.portal.inscripcion' }"
                class="inline-flex items-center gap-2 mt-3 px-5 py-2.5 text-sm font-bold rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition"
            >
                IR A PREFICHA
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
            </router-link>
        </div>

        <!-- Con preficha (FICHA o superior) -->
        <template v-else>
            <PortalHelpDrawer title="Cómo cargar tus Documentos">
                <div class="rounded-lg bg-blue-50 border border-blue-200 p-3 text-blue-800 text-xs">
                    Sube aquí los documentos que se te solicitan. Hazlo antes de la <strong>fecha y hora límite</strong> que aparece en la parte superior.
                </div>
                <div class="space-y-2">
                    <p class="font-semibold text-slate-800">1. Identifica cada documento</p>
                    <p class="text-xs text-slate-500">Cada tarjeta corresponde a un documento. Los marcados como <span class="font-semibold text-red-600">OBLIGATORIO</span> debes subirlos todos; los <span class="font-semibold">OPCIONALES</span> solo si aplican. Lee las instrucciones en amarillo de cada tarjeta.</p>
                </div>
                <div class="space-y-2">
                    <p class="font-semibold text-slate-800">2. Sube el archivo</p>
                    <p class="text-xs text-slate-500">Presiona <span class="font-semibold">SUBIR</span> y elige el archivo desde tu dispositivo. Respeta los formatos permitidos (por ejemplo PDF o imagen) y que se vea legible.</p>
                </div>
                <div class="space-y-2">
                    <p class="font-semibold text-slate-800">3. Verifica con VER</p>
                    <p class="text-xs text-slate-500">Después de subir, usa el botón <span class="font-semibold">VER</span> para revisar que el archivo se cargó correctamente. Si te equivocaste, presiona <span class="font-semibold">REEMPLAZAR</span>.</p>
                </div>
                <div class="space-y-2">
                    <p class="font-semibold text-slate-800">4. Revisa el estado</p>
                    <p class="text-xs text-slate-500">
                        <span class="font-semibold text-green-600">Aprobado</span>: validado, ya no se puede cambiar.
                        <span class="font-semibold text-amber-600">En Revisión</span>: lo estamos revisando.
                        <span class="font-semibold text-red-600">Rechazado</span>: debes subirlo de nuevo corregido.
                    </p>
                </div>
                <div class="rounded-lg bg-amber-50 border border-amber-200 p-3 text-amber-800 text-xs">
                    No necesitas un botón de guardar: cada documento se registra al subirlo. Asegúrate de que <strong>todos los obligatorios</strong> queden cargados.
                </div>
            </PortalHelpDrawer>

            <!-- Sección informativa -->
            <div class="bg-white border rounded-xl shadow-sm overflow-hidden">
                <div class="border-l-4 border-blue-500 px-6 py-3 bg-slate-50">
                    <h2 class="text-sm font-bold text-slate-600 uppercase tracking-wide">Carga de Documentos</h2>
                </div>
                <div class="p-6 space-y-4 text-sm">
                    <!-- Fila 1 -->
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                            <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Periodo</p>
                            <p class="font-semibold text-slate-800">{{ applicantData?.academicPeriod?.shortName ?? applicantData?.academicPeriod?.name ?? '—' }}</p>
                        </div>
                        <div>
                            <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Correo</p>
                            <p class="font-semibold text-slate-800 truncate">{{ applicantData?.email ?? '—' }}</p>
                        </div>
                        <div>
                            <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Campus</p>
                            <p class="font-semibold text-slate-800">{{ applicantData?.college?.name ?? '—' }}</p>
                        </div>
                        <div>
                            <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Modalidad</p>
                            <p class="font-semibold text-slate-800 uppercase">{{ offerModality }}</p>
                        </div>
                    </div>

                    <hr class="border-slate-100" />

                    <!-- Fila 2: Aspirante -->
                    <div>
                        <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Aspirante</p>
                        <p class="font-bold text-slate-800 text-base uppercase">{{ fullName }}</p>
                    </div>

                    <hr class="border-slate-100" />

                    <!-- Fila 3 -->
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                        <div>
                            <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Primera Opción</p>
                            <p class="font-semibold text-slate-800 uppercase">{{ offerCareer }}</p>
                        </div>
                        <div>
                            <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Preficha</p>
                            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-blue-600 text-white font-mono tracking-widest">
                                {{ applicantData?.preApplicationFolio ?? '—' }}
                            </span>
                        </div>
                        <div>
                            <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Fecha y Hora Límite</p>
                            <p class="font-semibold text-slate-800">{{ endsAt ?? '—' }}</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Sección de documentos -->
            <div class="space-y-4">
                <div class="border-l-4 border-blue-500 pl-3">
                    <h2 class="text-base font-bold text-slate-700 uppercase tracking-wide">Documentos Requeridos</h2>
                </div>

                <!-- Banner de estado global de la revisión -->
                <div
                    v-if="!loadingDocs && docStats.total > 0"
                    class="rounded-xl border p-4 flex items-start gap-3"
                    :class="{
                        'bg-emerald-50 border-emerald-200': overallState === 'approved',
                        'bg-red-50 border-red-200':         overallState === 'rejected',
                        'bg-amber-50 border-amber-200':     overallState === 'review',
                        'bg-blue-50 border-blue-200':       overallState === 'incomplete',
                    }"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6 shrink-0 mt-0.5"
                         :class="{
                            'text-emerald-500': overallState === 'approved',
                            'text-red-500':     overallState === 'rejected',
                            'text-amber-500':   overallState === 'review',
                            'text-blue-500':    overallState === 'incomplete',
                         }">
                        <path v-if="overallState === 'approved'" fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" />
                        <path v-else-if="overallState === 'review'" fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clip-rule="evenodd" />
                        <path v-else fill-rule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clip-rule="evenodd" />
                    </svg>
                    <div class="min-w-0 flex-1">
                        <p class="text-sm font-bold"
                           :class="{
                                'text-emerald-800': overallState === 'approved',
                                'text-red-800':     overallState === 'rejected',
                                'text-amber-800':   overallState === 'review',
                                'text-blue-800':    overallState === 'incomplete',
                           }">{{ bannerTitle }}</p>
                        <p class="text-xs mt-0.5 text-slate-600">{{ bannerMessage }}</p>

                        <!-- Lista de documentos por corregir, con su motivo -->
                        <ul v-if="overallState === 'rejected'" class="mt-2 space-y-1">
                            <li v-for="s in rejectedSlots" :key="s.documentTypeId" class="text-xs text-red-700">
                                <span class="font-semibold">{{ s.name }}</span>
                                <span v-if="s.doc?.rejectionReason"> — {{ s.doc.rejectionReason }}</span>
                            </li>
                        </ul>

                        <!-- Contador de avance -->
                        <p class="text-[11px] font-semibold mt-2 text-slate-500">
                            {{ docStats.approved }} de {{ docStats.total }} documentos obligatorios aprobados
                        </p>
                    </div>
                </div>

                <div v-if="loadingDocs" class="text-sm text-slate-400 py-4 text-center">Cargando documentos...</div>
                <div v-else-if="docSlots.length === 0" class="text-sm text-slate-400 italic text-center py-4">
                    No hay documentos requeridos configurados.
                </div>
                <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div
                        v-for="slot in docSlots"
                        :key="slot.documentTypeId"
                        class="border rounded-xl overflow-hidden shadow-sm"
                    >
                        <!-- Encabezado -->
                        <div class="bg-blue-600 text-white text-center font-bold text-sm py-2.5 px-3 uppercase tracking-wide">
                            {{ slot.name }}
                        </div>
                        <!-- Etiqueta obligatorio/opcional -->
                        <div class="flex justify-center py-1.5 border-b border-slate-100">
                            <span
                                v-if="slot.isRequired"
                                class="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-red-100 text-red-600"
                            >OBLIGATORIO</span>
                            <span
                                v-else
                                class="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-slate-100 text-slate-500"
                            >OPCIONAL</span>
                        </div>

                        <!-- Cuerpo -->
                        <div class="bg-white p-4 flex flex-col items-center gap-3">
                            <!-- Instrucciones -->
                            <div
                                v-if="slot.instructions"
                                class="w-full bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-xs text-center text-slate-700 uppercase font-medium leading-relaxed"
                            >
                                {{ slot.instructions }}
                            </div>

                            <!-- Botones de acción -->
                            <div class="flex flex-wrap justify-center gap-2">
                                <!-- Subir / Reemplazar -->
                                <button
                                    v-if="slot.doc?.status !== 'approved'"
                                    type="button"
                                    :disabled="uploading === slot.documentTypeId"
                                    class="px-4 py-2 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors uppercase disabled:opacity-50 disabled:cursor-wait"
                                    @click="triggerUpload(slot.documentTypeId, slot.acceptsFormats)"
                                >
                                    <span v-if="uploading === slot.documentTypeId">SUBIENDO...</span>
                                    <span v-else>{{ slot.doc?.status === 'rejected' ? 'CORREGIR' : (slot.doc ? 'REEMPLAZAR' : 'SUBIR') }} {{ slot.name }}</span>
                                </button>

                                <!-- Ver documento (solo si hay uno subido) -->
                                <button
                                    v-if="slot.doc"
                                    type="button"
                                    :disabled="loadingPreview === slot.doc.id"
                                    class="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors uppercase disabled:opacity-50 disabled:cursor-wait"
                                    @click="openDoc(slot.doc)"
                                >
                                    <svg v-if="loadingPreview !== slot.doc.id" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <svg v-else class="animate-spin w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                                    </svg>
                                    <span>{{ loadingPreview === slot.doc.id ? 'CARGANDO...' : 'VER' }}</span>
                                </button>
                            </div>

                            <!-- Estado -->
                            <div class="flex flex-col items-center gap-1">
                                <!-- Aprobado -->
                                <template v-if="slot.doc?.status === 'approved'">
                                    <svg class="w-7 h-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                                    </svg>
                                    <span class="text-[10px] font-semibold text-green-600 uppercase">Aprobado</span>
                                </template>
                                <!-- En revisión -->
                                <template v-else-if="slot.doc?.status === 'pending'">
                                    <svg class="w-7 h-7 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z"/>
                                    </svg>
                                    <span class="text-[10px] font-semibold text-amber-600 uppercase">En Revisión</span>
                                </template>
                                <!-- Rechazado o sin subir -->
                                <template v-else>
                                    <svg class="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                                    </svg>
                                    <span v-if="slot.doc?.status === 'rejected'" class="text-[10px] font-semibold text-red-600 uppercase">Rechazado</span>
                                </template>
                            </div>

                            <!-- Motivo de rechazo -->
                            <div
                                v-if="slot.doc?.status === 'rejected' && slot.doc?.rejectionReason"
                                class="w-full bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-[11px] text-red-700 text-center"
                            >
                                <span class="font-semibold">Motivo del rechazo:</span> {{ slot.doc.rejectionReason }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <p v-if="error" class="text-xs text-red-600">{{ error }}</p>
            <p v-if="success" class="text-xs text-green-600">{{ success }}</p>
        </template>
    </div>

    <!-- Modal de previsualización -->
    <Teleport to="body">
        <Transition
            enter-active-class="transition-opacity duration-150"
            enter-from-class="opacity-0"
            leave-active-class="transition-opacity duration-150"
            leave-to-class="opacity-0"
        >
            <div
                v-if="previewModal"
                class="fixed inset-0 z-[100] flex flex-col bg-black/80"
                @click.self="closePreview"
            >
                <!-- Barra superior -->
                <div class="flex items-center justify-between px-4 py-3 bg-slate-900 text-white text-sm shrink-0 border-b border-white/10">
                    <span class="font-semibold truncate max-w-xs text-slate-200">{{ previewName }}</span>
                    <div class="flex items-center gap-2">
                        <!-- Botón descargar -->
                        <button
                            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition text-xs font-semibold uppercase text-white"
                            @click="downloadDirect"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                            Descargar
                        </button>
                        <!-- Cerrar — botón visible y con texto -->
                        <button
                            class="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 transition text-xs font-bold uppercase text-white"
                            @click="closePreview"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Cerrar
                        </button>
                    </div>
                </div>

                <!-- Contenido -->
                <div class="flex-1 flex items-center justify-center overflow-hidden p-4">
                    <!-- Imagen -->
                    <img
                        v-if="previewIsImage"
                        :src="previewUrl!"
                        class="max-w-full max-h-full object-contain rounded shadow-lg"
                        :alt="previewName"
                    />
                    <!-- PDF -->
                    <iframe
                        v-else-if="previewIsPdf"
                        :src="previewUrl!"
                        class="w-full h-full rounded bg-white"
                        :title="previewName"
                    />
                </div>
            </div>
        </Transition>
    </Teleport>
    </div>
</template>

<script setup lang="ts">
import PortalStepper from '@/modules/admissions/components/PortalStepper.vue'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import PortalHelpDrawer from './PortalHelpDrawer.vue'
import type { ApplicantDocument } from '@/modules/admissions/types/applicant-document.type'

const STATUS_FICHA = 4

// MIME types que el navegador puede mostrar inline
const PREVIEWABLE_IMAGES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp', 'image/tiff']
const PREVIEWABLE_PDF    = ['application/pdf']

function isPreviewable(mimeType: string | null): boolean {
    if (!mimeType) return false
    return PREVIEWABLE_IMAGES.includes(mimeType) || PREVIEWABLE_PDF.includes(mimeType)
}

interface DocSlot {
    documentTypeId: number
    name:           string
    instructions:   string | null
    isRequired:     boolean
    acceptsFormats: string[] | null
    uploaded:       boolean
    doc:            ApplicantDocument | null
}

const loading       = ref(true)
const loadingDocs   = ref(false)
const error         = ref<string | null>(null)
const success       = ref<string | null>(null)
const uploading     = ref<number | null>(null)
const applicantData = ref<any>(null)
const endsAt        = ref<string | null>(null)
const docSlots      = ref<DocSlot[]>([])

// ── Previsualización ──────────────────────────────────────────────────────────
const previewModal  = ref(false)
const previewUrl    = ref<string | null>(null)
const previewMime   = ref<string | null>(null)
const previewName   = ref<string>('')
const loadingPreview = ref<number | null>(null)   // ID del doc en carga
let   currentDownloadUrl: string | null = null     // para download directo

const previewIsImage = computed(() => previewMime.value !== null && PREVIEWABLE_IMAGES.includes(previewMime.value))
const previewIsPdf   = computed(() => previewMime.value === 'application/pdf')

const applicantStatus = computed(() => applicantData.value?.status ?? 0)

/* ── Estado de la revisión de documentos (Fase A) ─────────────────────────── */
const requiredSlots = computed(() => docSlots.value.filter(s => s.isRequired))
const rejectedSlots = computed(() => requiredSlots.value.filter(s => s.doc?.status === 'rejected'))

const docStats = computed(() => {
    const req = requiredSlots.value
    return {
        total:    req.length,
        approved: req.filter(s => s.doc?.status === 'approved').length,
        rejected: req.filter(s => s.doc?.status === 'rejected').length,
        pending:  req.filter(s => s.doc?.status === 'pending').length,
        missing:  req.filter(s => !s.doc).length,
    }
})

/** approved | rejected | review | incomplete (según los obligatorios). */
const overallState = computed<'approved' | 'rejected' | 'review' | 'incomplete'>(() => {
    const s = docStats.value
    if (s.approved === s.total && s.total > 0) return 'approved'
    if (s.rejected > 0)                        return 'rejected'
    if (s.missing > 0)                         return 'incomplete'
    return 'review' // todos subidos, ninguno rechazado, alguno en revisión
})

const bannerTitle = computed(() => ({
    approved:   '✅ Documentos aprobados',
    rejected:   '⚠️ Tienes documentos por corregir',
    review:     '🕓 Tus documentos están en revisión',
    incomplete: 'Aún te faltan documentos obligatorios',
}[overallState.value]))

const bannerMessage = computed(() => {
    const s = docStats.value
    switch (overallState.value) {
        case 'approved':   return 'Todos tus documentos obligatorios fueron aprobados. Ya puedes continuar con tu proceso.'
        case 'rejected':   return `Corrige y vuelve a subir ${s.rejected} documento(s). Revisa el motivo de cada uno:`
        case 'review':     return 'Recibimos tus documentos y los estamos revisando. Te avisaremos cuando termine la revisión.'
        case 'incomplete': return `Sube los ${s.missing} documento(s) obligatorio(s) que faltan para iniciar tu revisión.`
        default:           return ''
    }
})

const fullName = computed(() => {
    const d = applicantData.value
    if (!d) return '—'
    return [d.names, d.firstSurname, d.secondSurname].filter(Boolean).join(' ')
})

const offerModality = computed(() =>
    applicantData.value?.offerOption1?.modality?.name ?? '—'
)
const offerCareer = computed(() =>
    applicantData.value?.offerOption1?.career?.name ?? '—'
)

async function fetchAll() {
    loading.value = true
    error.value   = null
    try {
        const { data } = await api.get(API.ADMISSIONS_API.portal.me)
        applicantData.value = data

        if (data.status >= STATUS_FICHA) {
            loadingDocs.value = true
            const [configRes, docsRes] = await Promise.all([
                api.get(API.ADMISSIONS_API.portal.prefichaConfig),
                api.get(API.ADMISSIONS_API.portal.documents),
            ])
            endsAt.value = configRes.data.endsAt ?? null

            const required: any[]            = docsRes.data.required ?? []
            const uploaded: ApplicantDocument[] = docsRes.data.uploaded ?? []
            const byType: Record<number, ApplicantDocument> = {}
            uploaded.forEach(d => { byType[d.documentTypeId] = d })

            docSlots.value = required.map(r => ({
                documentTypeId: r.documentTypeId,
                name:           r.name,
                instructions:   r.instructions ?? null,
                isRequired:     r.isRequired,
                acceptsFormats: r.acceptsFormats ?? null,
                uploaded:       r.uploaded,
                doc:            byType[r.documentTypeId] ?? null,
            }))
        }
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'Error al cargar los datos.'
    } finally {
        loading.value     = false
        loadingDocs.value = false
    }
}

function triggerUpload(documentTypeId: number, acceptsFormats: string[] | null) {
    const input = document.createElement('input')
    input.type = 'file'
    if (acceptsFormats?.length) {
        input.accept = acceptsFormats.map(f => `.${f.replace(/^\./, '')}`).join(',')
    }
    input.onchange = (e) => uploadDoc(e, documentTypeId)
    input.click()
}

async function uploadDoc(event: Event, documentTypeId: number) {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (!file) return
    error.value   = null
    success.value = null
    uploading.value = documentTypeId
    try {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('document_type_id', String(documentTypeId))
        await api.post(API.ADMISSIONS_API.portal.upload, fd)
        // Actualiza SOLO el slot que cambió (sin recargar toda la página).
        await refreshSlot(documentTypeId)
        success.value = 'Documento subido correctamente.'
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'Error al subir el documento.'
    } finally {
        uploading.value = null
    }
}

/** Refresca en su lugar únicamente el documento del slot indicado. */
async function refreshSlot(documentTypeId: number) {
    const { data } = await api.get(API.ADMISSIONS_API.portal.documents)
    const uploaded: ApplicantDocument[] = data?.uploaded ?? []
    const found = uploaded.find(d => d.documentTypeId === documentTypeId) ?? null
    const i = docSlots.value.findIndex(s => s.documentTypeId === documentTypeId)
    if (i !== -1) docSlots.value[i] = { ...docSlots.value[i], doc: found }
}

// ── Lógica de previsualización / descarga ─────────────────────────────────────

async function openDoc(doc: ApplicantDocument) {
    const downloadUrl = API.ADMISSIONS_API.portal.download(doc.id)
    currentDownloadUrl = downloadUrl

    if (!isPreviewable(doc.mimeType)) {
        // No previsualizable → descargar directamente
        triggerDownload(downloadUrl, doc.originalName)
        return
    }

    loadingPreview.value = doc.id
    try {
        const response = await api.get(downloadUrl, { responseType: 'blob' })
        const blob     = new Blob([response.data], { type: doc.mimeType ?? response.data.type })
        const url      = URL.createObjectURL(blob)

        // Limpiar URL anterior si existía
        if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)

        previewUrl.value  = url
        previewMime.value = doc.mimeType
        previewName.value = doc.originalName
        previewModal.value = true
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'Error al cargar el documento.'
    } finally {
        loadingPreview.value = null
    }
}

function closePreview() {
    previewModal.value = false
    if (previewUrl.value) {
        URL.revokeObjectURL(previewUrl.value)
        previewUrl.value = null
    }
    previewMime.value  = null
    previewName.value  = ''
}

function downloadDirect() {
    if (!currentDownloadUrl || !previewName.value) return
    triggerDownload(currentDownloadUrl, previewName.value)
}

function triggerDownload(url: string, filename: string) {
    const a    = document.createElement('a')
    a.href     = url
    a.download = filename
    a.target   = '_blank'
    a.rel      = 'noopener'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
}

// Cerrar modal con Escape
function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape' && previewModal.value) closePreview()
}

onMounted(() => {
    fetchAll()
    window.addEventListener('keydown', onKeyDown)
})

onUnmounted(() => {
    window.removeEventListener('keydown', onKeyDown)
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
})
</script>
