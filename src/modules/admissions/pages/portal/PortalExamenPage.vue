<template>
    <div class="max-w-3xl space-y-4">
        <h1 class="text-xl font-semibold text-slate-800 print:hidden">EXAMEN DE ADMISIÓN</h1>

        <div v-if="loading" class="bg-white border rounded-xl shadow-sm p-10 text-center text-slate-400 text-sm">
            Cargando...
        </div>

        <!-- Modo ONLINE -->
        <div
            v-else-if="pass?.mode === 'online'"
            class="bg-white border rounded-xl shadow-sm p-10 text-center space-y-2"
        >
            <PencilSquareIcon class="w-12 h-12 mx-auto text-slate-300" />
            <p class="text-sm text-slate-700 font-semibold uppercase">Examen en línea</p>
            <p class="text-sm text-slate-500">
                El examen de admisión se aplica desde este portal. Próximamente verás aquí el botón para iniciar.
            </p>
        </div>

        <!-- PRESENCIAL / MIXTO sin asignación -->
        <div
            v-else-if="pass?.status === 'PENDING'"
            class="bg-amber-50 border border-amber-200 rounded-xl p-10 text-center space-y-3"
        >
            <ClockIcon class="w-12 h-12 mx-auto text-amber-400" />
            <p class="text-base font-bold text-amber-800 uppercase tracking-wide">Pendiente de asignar</p>
            <p class="text-sm text-amber-700 max-w-md mx-auto">
                {{ pass?.message || 'Tu sesión se publicará próximamente. Vuelve a esta sección cuando se libere la logística del examen presencial.' }}
            </p>
        </div>

        <!-- PRESENCIAL / MIXTO con sesión asignada → Pase -->
        <div v-else-if="pass?.session" class="space-y-3 print:space-y-2">
            <div class="flex justify-end print:hidden">
                <button
                    class="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-slate-800 text-white hover:bg-slate-900"
                    @click="onPrint"
                >
                    <PrinterIcon class="w-4 h-4" />
                    IMPRIMIR PASE
                </button>
            </div>

            <div class="bg-white border-2 border-slate-300 rounded-xl shadow-sm overflow-hidden print:shadow-none print:border-black">
                <!-- Encabezado -->
                <div class="bg-blue-600 text-white px-6 py-4 print:bg-black">
                    <p class="text-[10px] font-bold uppercase tracking-widest opacity-80">Pase de Examen de Admisión</p>
                    <h2 class="text-lg font-bold uppercase tracking-wide mt-0.5">
                        {{ applicant?.college?.name || 'Plantel' }}
                    </h2>
                    <p v-if="applicant?.academicPeriod" class="text-xs opacity-90 mt-0.5">
                        {{ applicant.academicPeriod.shortName || applicant.academicPeriod.name }}
                    </p>
                </div>

                <div class="p-6 space-y-4">
                    <div>
                        <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Aspirante</p>
                        <p class="text-lg font-bold text-slate-800 uppercase">{{ fullName }}</p>
                        <p class="text-xs text-slate-500 mt-0.5">
                            Folio:
                            <span class="font-mono font-bold text-slate-800">{{ applicant?.preApplicationFolio || '—' }}</span>
                        </p>
                    </div>

                    <hr class="border-slate-100" />

                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                            <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Fecha</p>
                            <p class="font-bold text-slate-800">{{ formatLongDate(pass.session.date) }}</p>
                        </div>
                        <div>
                            <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Hora</p>
                            <p class="font-bold text-slate-800">
                                {{ pass.session.startTime?.slice(0, 5) }}
                                <span class="text-slate-400">a</span>
                                {{ pass.session.endTime?.slice(0, 5) }}
                            </p>
                        </div>
                        <div>
                            <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Aula</p>
                            <p class="font-bold text-slate-800">{{ pass.session.place?.name || '—' }}</p>
                            <p v-if="pass.session.place?.shortName" class="text-[10px] text-slate-400">
                                ({{ pass.session.place.shortName }})
                            </p>
                        </div>
                        <div>
                            <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Asiento</p>
                            <p class="font-bold text-slate-800">{{ pass.session.seatNumber ?? '—' }}</p>
                        </div>
                    </div>

                    <div v-if="pass.session.place?.building || pass.session.campus" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div v-if="pass.session.place?.building">
                            <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Edificio</p>
                            <p class="font-medium text-slate-700">{{ pass.session.place.building.name || '—' }}</p>
                        </div>
                        <div v-if="pass.session.campus">
                            <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Campus</p>
                            <p class="font-medium text-slate-700">{{ pass.session.campus.name }}</p>
                            <p v-if="pass.session.campus.address" class="text-[11px] text-slate-500 italic">
                                {{ pass.session.campus.address }}
                            </p>
                        </div>
                    </div>

                    <hr class="border-slate-100" />

                    <!-- Código QR para verificación de asistencia -->
                    <div v-if="qrDataUrl" class="flex flex-col items-center gap-2 py-2">
                        <p class="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Código de asistencia</p>
                        <img :src="qrDataUrl" alt="QR de asistencia" class="w-44 h-44 border border-slate-200 rounded-md" />
                        <p class="text-[10px] text-slate-400 italic text-center max-w-xs">
                            Muéstralo al cuidador el día del examen para registrar tu asistencia.
                        </p>
                    </div>

                    <hr class="border-slate-100" />

                    <div class="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5">
                        <p class="text-[11px] font-semibold text-slate-700 uppercase tracking-wide">Recordatorios</p>
                        <ul class="text-[11px] text-slate-600 space-y-1 list-disc list-inside">
                            <li>Presenta este pase impreso o desde tu dispositivo el día del examen.</li>
                            <li>Llega al menos 30 minutos antes con identificación oficial vigente.</li>
                            <li>Lleva lápiz, goma y sacapuntas. Sin alimentos ni dispositivos electrónicos en el aula.</li>
                            <li>Si la información cambia, se publicará una actualización en este mismo apartado.</li>
                        </ul>
                    </div>

                    <p class="text-[10px] text-slate-400 italic text-center">
                        Generado el {{ todayLabel }} · Sesión #{{ pass.session.id }}
                    </p>
                </div>
            </div>
        </div>

        <p v-if="error" class="text-xs text-red-600">{{ error }}</p>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ClockIcon, PencilSquareIcon, PrinterIcon } from '@heroicons/vue/24/outline'
import QRCode from 'qrcode'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'

interface PassResponse {
    status: 'PENDING' | 'CONFIRMED'
    mode:   'online' | 'presencial' | 'mixto'
    message?: string
    session?: {
        id:         number
        date:       string
        startTime:  string
        endTime:    string
        status:     string
        seatNumber: number | null
        place: {
            id:        number
            name:      string
            shortName: string | null
            building:  { id: number; name: string | null } | null
        } | null
        campus: { id: number; name: string; address: string | null } | null
    } | null
}

const pass = ref<PassResponse | null>(null)
const applicant = ref<any>(null)
const loading = ref(true)
const error   = ref<string | null>(null)
const qrDataUrl = ref<string | null>(null)

const fullName = computed(() => {
    const a = applicant.value
    if (!a) return '—'
    return [a.names, a.firstSurname, a.secondSurname].filter(Boolean).join(' ')
})

const todayLabel = computed(() =>
    new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }),
)

function formatLongDate(s: string): string {
    if (!s) return '—'
    return new Date(s).toLocaleDateString('es-MX', {
        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    })
}

async function load() {
    loading.value = true
    error.value   = null
    try {
        const [passRes, meRes] = await Promise.all([
            api.get<PassResponse>(API.ADMISSIONS_API.portalExamPass),
            api.get(API.ADMISSIONS_API.portal.me),
        ])
        pass.value      = passRes.data
        applicant.value = meRes.data

        // Si hay sesión asignada, generar el QR de asistencia
        if (passRes.data?.session) {
            await loadQr()
        }
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'No se pudo cargar el pase de examen.'
    } finally {
        loading.value = false
    }
}

async function loadQr() {
    try {
        const { data } = await api.get<{ token?: string }>(API.ADMISSIONS_API.portalExamPassToken)
        if (data?.token) {
            qrDataUrl.value = await QRCode.toDataURL(data.token, {
                errorCorrectionLevel: 'M',
                margin: 1,
                width: 320,
                color: { dark: '#000000', light: '#ffffff' },
            })
        }
    } catch {
        qrDataUrl.value = null
    }
}

function onPrint() {
    window.print()
}

onMounted(load)
</script>

<style>
/*
 * Estilo NO scoped: se aplica globalmente sólo mientras esta página está
 * montada. Esconde el chrome del layout (sidebar/navbar/breadcrumbs) y
 * deja visible únicamente la tarjeta del pase, ocupando toda la página.
 */
@media print {
    @page {
        size: A4 portrait;
        margin: 12mm;
    }

    /* Conservar los fondos/bordes de color en la impresión */
    *, *::before, *::after {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
    }

    /* Ocultar todo el chrome de la app */
    body > *:not(#app),
    aside,
    nav,
    header,
    .print\:hidden {
        display: none !important;
    }

    /* Reset del layout: el contenedor scrolleable estorba al imprimir */
    html, body, #app, main {
        height: auto !important;
        overflow: visible !important;
        background: #fff !important;
    }
    main, main > div, main > div > div {
        padding: 0 !important;
        margin: 0 !important;
        max-width: none !important;
        overflow: visible !important;
    }

    /* La tarjeta del pase a tamaño completo */
    .max-w-3xl {
        max-width: none !important;
    }
}
</style>
