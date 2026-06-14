<template>
    <div class="max-w-4xl mx-auto space-y-5">
        <div v-if="loading" class="py-16">
            <LoadingOverlay :absolute="false" text="Cargando tu proceso…" />
        </div>

        <template v-else>
            <!-- Hero: saludo + identidad -->
            <section class="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                <p class="text-xs font-black text-slate-400 uppercase tracking-widest">Proceso de Admisión</p>
                <h1 class="text-2xl font-bold text-slate-800 mt-1">Hola, {{ firstName }} 👋</h1>
                <div class="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                    <p v-if="me?.preApplicationFolio"><span class="text-slate-400">Folio:</span> <span class="font-mono font-bold text-slate-700">{{ me.preApplicationFolio }}</span></p>
                    <p v-if="periodLabel"><span class="text-slate-400">Periodo:</span> <span class="font-semibold text-slate-700">{{ periodLabel }}</span></p>
                    <p v-if="me?.college?.name"><span class="text-slate-400">Plantel:</span> <span class="font-semibold text-slate-700">{{ me.college.name }}</span></p>
                </div>
            </section>

            <!-- Timeline del proceso -->
            <section class="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                <p class="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Tu avance</p>
                <ol class="grid items-start" :style="{ gridTemplateColumns: gridCols }">
                    <template v-for="(s, i) in STAGES" :key="s">
                        <li class="contents">
                            <div class="flex flex-col items-center gap-1.5 text-center">
                                <span
                                    class="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold shrink-0"
                                    :class="stageClass(i)"
                                >
                                    <svg v-if="i < currentStage" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="h-4 w-4">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                    </svg>
                                    <template v-else>{{ i + 1 }}</template>
                                </span>
                                <span class="text-[10px] font-semibold uppercase tracking-wide leading-tight"
                                      :class="i === currentStage ? 'text-blue-600' : (i < currentStage ? 'text-emerald-600' : 'text-slate-400')">
                                    {{ s }}
                                </span>
                            </div>
                            <span
                                v-if="i < STAGES.length - 1"
                                aria-hidden="true"
                                class="h-0.5 w-full rounded-full mt-4"
                                :class="i < currentStage ? 'bg-emerald-400' : 'bg-slate-200'"
                            />
                        </li>
                    </template>
                </ol>
            </section>

            <!-- Tu siguiente paso -->
            <section
                class="rounded-2xl border p-6"
                :class="nextStep.tone === 'success' ? 'bg-emerald-50 border-emerald-200'
                      : nextStep.tone === 'danger'  ? 'bg-red-50 border-red-200'
                      : nextStep.tone === 'review'  ? 'bg-amber-50 border-amber-200'
                      : 'bg-blue-50 border-blue-200'"
            >
                <p class="text-[11px] font-black uppercase tracking-widest mb-1"
                   :class="nextStep.tone === 'success' ? 'text-emerald-500'
                         : nextStep.tone === 'danger'  ? 'text-red-500'
                         : nextStep.tone === 'review'  ? 'text-amber-500'
                         : 'text-blue-500'">Tu siguiente paso</p>
                <h2 class="text-lg font-bold text-slate-800">{{ nextStep.title }}</h2>
                <p class="text-sm text-slate-600 mt-1">{{ nextStep.message }}</p>
                <router-link
                    v-if="nextStep.ctaRoute"
                    :to="{ name: nextStep.ctaRoute }"
                    class="inline-flex items-center gap-2 mt-4 px-5 py-2.5 text-sm font-bold rounded-lg text-white transition"
                    :class="nextStep.tone === 'success' ? 'bg-emerald-600 hover:bg-emerald-700'
                          : nextStep.tone === 'danger'  ? 'bg-red-600 hover:bg-red-700'
                          : 'bg-blue-600 hover:bg-blue-700'"
                >
                    {{ nextStep.ctaLabel }}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                </router-link>
            </section>

            <!-- Respuesta a tus documentos (cuando aplica) -->
            <section v-if="showDocs" class="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                <div class="flex items-center justify-between gap-3 mb-3">
                    <p class="text-[11px] font-black text-slate-400 uppercase tracking-widest">Revisión de tus documentos</p>
                    <span class="text-xs font-semibold text-slate-500">{{ docStats.approved }} de {{ docStats.total }} aprobados</span>
                </div>

                <div v-if="docStats.rejectedItems.length" class="space-y-2">
                    <p class="text-sm font-semibold text-red-700">Te regresaron {{ docStats.rejectedItems.length }} documento(s) para corregir:</p>
                    <ul class="space-y-1">
                        <li v-for="r in docStats.rejectedItems" :key="r.name" class="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                            <span class="font-semibold">{{ r.name }}</span><span v-if="r.reason"> — {{ r.reason }}</span>
                        </li>
                    </ul>
                </div>
                <p v-else-if="docStats.approved === docStats.total && docStats.total > 0" class="text-sm text-emerald-700">
                    ✅ Todos tus documentos fueron aprobados.
                </p>
                <p v-else-if="docStats.pending > 0" class="text-sm text-amber-700">
                    🕓 Tienes {{ docStats.pending }} documento(s) en revisión. Te avisaremos cuando terminemos.
                </p>
                <p v-else class="text-sm text-slate-500">
                    Aún te faltan {{ docStats.missing }} documento(s) obligatorio(s) por subir.
                </p>

                <router-link :to="{ name: 'admissions.portal.documentos' }" class="inline-flex items-center gap-1 mt-3 text-sm font-semibold text-blue-600 hover:text-blue-800">
                    Ir a Documentos
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                </router-link>
            </section>
        </template>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import LoadingOverlay from '@/app/components/ui/LoadingOverlay.vue'

const STATUS = { POR_VERIFICAR: 1, PROSPECTO: 2, PREFICHA: 3, FICHA: 4, CON_RESULTADO: 5, ADMITIDO: 6, INSCRITO: 7 }
const STAGES = ['Registro', 'Expediente', 'Preficha', 'Documentos', 'Resultado', 'Admisión']

const loading   = ref(true)
const me        = ref<any | null>(null)
const documents = ref<any | null>(null)

const status = computed<number>(() => me.value?.status ?? 0)
const firstName = computed(() => me.value?.names?.split(' ')[0] ?? me.value?.names ?? 'aspirante')
const periodLabel = computed(() => me.value?.academicPeriod?.shortName ?? me.value?.academicPeriod?.name ?? null)

const gridCols = computed(() => 'auto' + ' minmax(0, 1fr) auto'.repeat(STAGES.length - 1))

const currentStage = computed(() => {
    const s = status.value
    if (s <= STATUS.POR_VERIFICAR) return 0
    if (s === STATUS.PROSPECTO)    return 1
    if (s === STATUS.PREFICHA)     return 2
    if (s === STATUS.FICHA)        return 3
    if (s === STATUS.CON_RESULTADO)return 4
    return 5 // ADMITIDO / INSCRITO
})

function stageClass(i: number): string {
    if (i < currentStage.value)   return 'bg-emerald-500 text-white'
    if (i === currentStage.value) return 'bg-blue-600 text-white ring-2 ring-blue-200'
    return 'bg-slate-100 text-slate-400'
}

const showDocs = computed(() => status.value >= STATUS.FICHA && (documents.value?.required?.length ?? 0) > 0)

const docStats = computed(() => {
    const req: any[] = (documents.value?.required ?? []).filter((r: any) => r.isRequired)
    const uploaded: any[] = documents.value?.uploaded ?? []
    const byType: Record<number, any> = {}
    uploaded.forEach(u => { byType[u.documentTypeId] = u })
    const rejectedItems = req
        .filter(r => byType[r.documentTypeId]?.status === 'rejected')
        .map(r => ({ name: r.name, reason: byType[r.documentTypeId]?.rejectionReason ?? null }))
    return {
        total:    req.length,
        approved: req.filter(r => byType[r.documentTypeId]?.status === 'approved').length,
        pending:  req.filter(r => byType[r.documentTypeId]?.status === 'pending').length,
        missing:  req.filter(r => !byType[r.documentTypeId]).length,
        rejected: rejectedItems.length,
        rejectedItems,
    }
})

interface NextStep { title: string; message: string; ctaLabel?: string; ctaRoute?: string; tone: 'info' | 'success' | 'danger' | 'review' }

const nextStep = computed<NextStep>(() => {
    const s = status.value
    if (s <= STATUS.POR_VERIFICAR) {
        return { title: 'Verifica tu correo electrónico', message: 'Revisa tu bandeja de entrada y confirma tu correo para continuar con tu registro.', tone: 'info' }
    }
    if (s === STATUS.PROSPECTO) {
        return { title: 'Completa tu expediente', message: 'Llena y guarda todas las secciones de Mi Expediente. Tu preficha se generará automáticamente al completarlo.', ctaLabel: 'Ir a Mi Expediente', ctaRoute: 'admissions.portal.personal', tone: 'info' }
    }
    if (s === STATUS.PREFICHA) {
        return { title: 'Obtén tu preficha', message: 'Selecciona tu(s) opción(es) de carrera y obtén tu preficha.', ctaLabel: 'Ir a Preficha', ctaRoute: 'admissions.portal.inscripcion', tone: 'info' }
    }
    if (s === STATUS.FICHA) {
        if (docStats.value.rejected > 0)
            return { title: `Tienes ${docStats.value.rejected} documento(s) por corregir`, message: 'Algunos documentos fueron rechazados. Revisa el motivo y vuelve a subirlos.', ctaLabel: 'Corregir documentos', ctaRoute: 'admissions.portal.documentos', tone: 'danger' }
        if (docStats.value.missing > 0)
            return { title: 'Sube tus documentos', message: `Te faltan ${docStats.value.missing} documento(s) obligatorio(s) por cargar.`, ctaLabel: 'Ir a Documentos', ctaRoute: 'admissions.portal.documentos', tone: 'info' }
        if (docStats.value.pending > 0)
            return { title: 'Tus documentos están en revisión', message: 'Recibimos tus documentos y los estamos revisando. Te avisaremos cuando terminemos.', tone: 'review' }
        return { title: '¡Documentos aprobados!', message: 'Todos tus documentos fueron aprobados. Continúa con tu examen de admisión.', ctaLabel: 'Ir a Examen', ctaRoute: 'admissions.portal.examen', tone: 'success' }
    }
    if (s === STATUS.CON_RESULTADO) {
        return { title: 'Tus resultados están disponibles', message: 'Ya puedes consultar el resultado de tu examen de admisión.', ctaLabel: 'Ver resultado', ctaRoute: 'admissions.portal.examen', tone: 'success' }
    }
    if (s === STATUS.ADMITIDO) {
        return { title: '¡Felicidades, fuiste admitido! 🎉', message: 'Servicios Escolares te contactará para tu inscripción y la asignación de tu grupo.', tone: 'success' }
    }
    return { title: 'Estás inscrito', message: 'Tu proceso de admisión concluyó. ¡Bienvenido!', tone: 'success' }
})

const STEP_NAMES = [
    'admissions.portal.personal', 'admissions.portal.ext-personal', 'admissions.portal.estudios',
    'admissions.portal.contactos', 'admissions.portal.preventivos', 'admissions.portal.otros',
    'admissions.portal.inscripcion', 'admissions.portal.documentos', 'admissions.portal.ficha',
    'admissions.portal.examen',
]

/**
 * Siembra el paso de reanudación según el estado (cross-device): así, si el
 * aspirante llega al portal por el menú "Mi Expediente" desde un equipo nuevo,
 * PortalResume lo dirige al paso accionable. Solo siembra si NO hay uno ya
 * guardado, para no pisar la sección exacta que el stepper recuerda al navegar.
 */
function seedResumeStep() {
    const existing = localStorage.getItem('portal:lastStep')
    if (existing && STEP_NAMES.includes(existing)) return
    const s = status.value
    const step = s >= STATUS.CON_RESULTADO ? 'admissions.portal.examen'
        : s === STATUS.FICHA    ? 'admissions.portal.documentos'
        : s === STATUS.PREFICHA ? 'admissions.portal.inscripcion'
        : 'admissions.portal.personal'
    localStorage.setItem('portal:lastStep', step)
}

async function load() {
    loading.value = true
    try {
        const { data } = await api.get(API.ADMISSIONS_API.portal.me)
        me.value = data
        if ((data?.status ?? 0) >= STATUS.FICHA) {
            try {
                const docs = await api.get(API.ADMISSIONS_API.portal.documents)
                documents.value = docs.data
            } catch { /* sin documentos aún */ }
        }
        seedResumeStep()
    } catch { /* fuera del flujo */ } finally {
        loading.value = false
    }
}

onMounted(load)
</script>
