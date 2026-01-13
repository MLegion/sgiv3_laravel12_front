import { defineStore } from 'pinia'
import { fetchColleges } from '@/modules/auth/services/college.service'
import type { College } from '@/shared/types/college'

export const useCollegeStore = defineStore('college', {
    state: () => ({
        colleges: [] as College[],
        selectedCollege: null as College | null,
        loading: false,
    }),

    getters: {
        hasSelectedCollege: (state) => !!state.selectedCollege,
    },

    actions: {
        selectCollege(college: College) {
            this.selectedCollege = college
            localStorage.setItem('selected_college', JSON.stringify(college))
        },

        async loadColleges() {
            if (this.colleges.length) return

            this.loading = true
            try {
                this.colleges = await fetchColleges()
            } finally {
                this.loading = false
            }
        },

        hydrate() {
            const stored = localStorage.getItem('selected_college')
            if (stored) {
                this.selectedCollege = JSON.parse(stored)
            }
        },

        clear() {
            this.selectedCollege = null
            localStorage.removeItem('selected_college')
        },
    },
})
