import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { CollegeAcademicPeriod } from '@/modules/school-services/types/college-academic-period.type'

export const useAdmissionPeriodStore = defineStore('admissionPeriod', () => {
    const selectedPeriodId  = ref<number | null>(null)
    const selectedPeriod    = ref<CollegeAcademicPeriod | null>(null)

    function select(period: CollegeAcademicPeriod | null) {
        selectedPeriod.value   = period
        selectedPeriodId.value = period?.academicPeriodId ?? null
    }

    function clear() {
        selectedPeriod.value   = null
        selectedPeriodId.value = null
    }

    return { selectedPeriodId, selectedPeriod, select, clear }
})
