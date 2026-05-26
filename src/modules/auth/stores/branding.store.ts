import { defineStore } from 'pinia'
import {
    type CollegeBranding,
    type CollegeBrandingResolved,
    readCachedBranding,
    cacheBranding,
    applyBrandingCssVars,
    resolveBrandingByCollegeId,
} from '@/modules/auth/services/branding.service'

/**
 * Estado reactivo del branding del college activo. Se hidrata desde el cache
 * en localStorage y se refresca tras login o cuando la BrandingPage guarda
 * cambios (vía setBranding).
 */
export const useBrandingStore = defineStore('branding', {
    state: () => ({
        college: null as CollegeBrandingResolved['college'] | null,
        branding: null as CollegeBranding | null,
        hydrated: false,
    }),

    getters: {
        isBranded(state): boolean {
            return !!state.branding
        },
        navbarTitle(state): string | null {
            return state.branding?.navbar_title || state.college?.name || null
        },
    },

    actions: {
        hydrate() {
            if (this.hydrated) return
            const cached = readCachedBranding()
            if (cached) {
                this.college = cached.college
                this.branding = cached.branding
                applyBrandingCssVars(cached.branding)
            }
            this.hydrated = true
        },

        async loadFromCollegeId(collegeId: number) {
            const resolved = await resolveBrandingByCollegeId(collegeId)
            if (resolved) {
                this.setResolved(resolved)
            }
        },

        setResolved(payload: CollegeBrandingResolved | null) {
            if (!payload) {
                this.college = null
                this.branding = null
                cacheBranding(null)
                applyBrandingCssVars(null)
                return
            }
            this.college = payload.college
            this.branding = payload.branding
            cacheBranding(payload)
            applyBrandingCssVars(payload.branding)
        },

        /** Solo actualiza el branding manteniendo el college (post-update admin). */
        setBranding(branding: CollegeBranding) {
            this.branding = branding
            if (this.college) {
                cacheBranding({ college: this.college, branding })
            }
            applyBrandingCssVars(branding)
        },

        clear() {
            this.college = null
            this.branding = null
            this.hydrated = false
            cacheBranding(null)
            applyBrandingCssVars(null)
        },
    },
})
