<template>
    <div class="bg-white border rounded-xl shadow-sm p-5 flex items-center justify-between gap-4">
        <div class="min-w-0">
            <div class="flex items-center gap-2">
                <span class="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{{ reportCode }}</span>
                <h3 class="text-sm font-bold text-slate-800 uppercase truncate">{{ label }}</h3>
            </div>
            <p v-if="description" class="text-xs text-slate-500 mt-1">{{ description }}</p>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0">
            <ReportGenerateButton
                :report-code="reportCode"
                :params="params"
                format="pdf"
                label="PDF"
                button-class="px-3 py-1.5 text-xs font-bold rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-40"
            />
            <ReportGenerateButton
                :report-code="reportCode"
                :params="params"
                format="docx"
                label="DOCX"
                button-class="px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import ReportGenerateButton from '@/modules/reports/components/ReportGenerateButton.vue'

defineProps<{
    reportCode:   string
    label:        string
    description?: string
    params:       Record<string, unknown>
}>()
</script>
