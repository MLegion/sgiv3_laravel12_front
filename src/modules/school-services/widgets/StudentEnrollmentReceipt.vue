<template>
    <div class="h-full flex flex-col text-xs">
        <div v-if="loading && !data" class="text-slate-400 italic">Cargando…</div>

        <div v-else-if="!data?.hasEnrollment" class="flex-1 flex items-center justify-center text-slate-400 italic text-center">
            No tienes inscripción registrada todavía.
        </div>

        <div v-else-if="data?.student" class="flex-1 flex flex-col gap-2">
            <div class="text-[10px] uppercase tracking-wide text-slate-500">Número de Control</div>
            <div class="font-mono font-bold text-2xl text-emerald-700 leading-none">
                {{ data.student.numControl }}
            </div>

            <div class="text-[11px] text-slate-700 font-semibold leading-tight" :title="data.student.fullName">
                {{ data.student.fullName }}
            </div>

            <div class="text-[10px] text-slate-500 space-y-0.5">
                <div><span class="font-semibold text-slate-600">{{ data.student.careerName }}</span></div>
                <div>{{ data.student.modalityName }} · {{ data.student.periodName }}</div>
            </div>

            <button
                class="mt-auto inline-flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-semibold rounded bg-blue-100 text-blue-800 hover:bg-blue-200 disabled:opacity-50 transition"
                :disabled="downloading"
                @click="downloadProof"
            >
                <ArrowDownTrayIcon class="w-3.5 h-3.5" />
                {{ downloading ? 'Generando…' : 'Descargar comprobante' }}
            </button>

            <div v-if="errorMsg" class="text-[10px] text-rose-600">{{ errorMsg }}</div>
        </div>
    </div>

    <FormatUnavailableModal
        v-if="formatUnavailableOpen"
        v-model="formatUnavailableOpen"
        :code="formatUnavailableInfo.code"
        :reason="formatUnavailableInfo.reason"
    />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ArrowDownTrayIcon } from '@heroicons/vue/24/outline'
import {
    useReportGenerator,
    ReportFormatUnavailableError,
    type ReportUnavailableReason,
} from '@/modules/reports/composables/useReportGenerator'
import { ReportCode } from '@/modules/reports/types/reportCodes'
import FormatUnavailableModal from '@/modules/reports/components/FormatUnavailableModal.vue'

interface StudentInfo {
    studentId:    number
    numControl:   string
    fullName:     string
    careerName:   string
    modalityName: string
    periodName:   string
}
interface Payload {
    hasEnrollment: boolean
    student:       StudentInfo | null
}

const props = defineProps<{
    data:    Payload | null
    loading: boolean
    error:   unknown
}>()

const { generatePdf } = useReportGenerator()
const downloading           = ref(false)
const errorMsg              = ref('')
const formatUnavailableOpen = ref(false)
const formatUnavailableInfo = ref<{ code: string; reason: ReportUnavailableReason }>({ code: '', reason: 'missing' })

async function downloadProof(): Promise<void> {
    if (!props.data?.student) return
    downloading.value = true
    errorMsg.value    = ''
    try {
        const { blob, filename } = await generatePdf({
            reportCode: ReportCode.INITIAL_ENROLLMENT_PROOF,
            params:     { student_id: props.data.student.studentId },
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.click()
        URL.revokeObjectURL(url)
    } catch (e: any) {
        if (e instanceof ReportFormatUnavailableError) {
            formatUnavailableInfo.value = { code: e.code, reason: e.reason }
            formatUnavailableOpen.value = true
        } else {
            errorMsg.value = e?.message ?? 'No se pudo generar el comprobante.'
        }
    } finally {
        downloading.value = false
    }
}
</script>
