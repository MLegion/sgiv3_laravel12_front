import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useCollegeStore } from '@/modules/auth/stores/college.store'
import { requestGoogleAccessToken } from '@/modules/auth/composables/useGoogleAuth'
import {
    resolveBrandingByShortname,
    resolveLoginDefault,
    applyBrandingCssVars,
    cacheBranding,
    type CollegeBranding,
    type CollegeBrandingResolved,
} from '@/modules/auth/services/branding.service'

/**
 * Cerebro del login: estado + lógica (branding, college, credenciales, MFA,
 * Google) compartido por TODAS las plantillas de login. Las plantillas solo
 * arman la disposición visual y usan este controlador vía props.
 */
export function useLoginController() {
    const authStore = useAuthStore()
    const collegeStore = useCollegeStore()
    const route = useRoute()
    const router = useRouter()

    const branding = ref<CollegeBranding | null>(null)
    const brandedCollegeLocked = ref(false)

    const brandedLogo = computed(() => branding.value?.logo_url ?? null)
    const brandedTitle = computed(() => branding.value?.welcome_title ?? null)
    const brandedSubtitle = computed(() => branding.value?.welcome_subtitle ?? null)
    const brandedHero = computed(() => branding.value?.hero_url ?? null)
    const primaryColor = computed(() => branding.value?.primary_color ?? '#4f46e5')

    const disabledBanner = computed(() => route.query.reason === 'disabled')

    const collegeId = ref<number | null>(null)
    const email = ref('')
    const password = ref('')
    const showPassword = ref(false)
    const googleLoading = ref(false)
    const submitting = ref(false)
    const rememberMe = ref(false)

    const errors = ref<{ college?: string; user?: string; password?: string; general?: string }>({})

    const googleDomain = computed(() => {
        const c: any = collegeStore.selectedCollege
        return c?.googleWorkspaceDomain || c?.google_workspace_domain || null
    })
    const googleClientId = computed(() => {
        const c: any = collegeStore.selectedCollege
        return c?.googleClientId || null
    })
    const googleReady = computed(() => !!googleDomain.value && !!googleClientId.value)

    async function onGoogleLogin() {
        errors.value = {}
        if (!collegeStore.selectedCollege) { errors.value.college = 'Selecciona una institución'; return }
        if (!googleReady.value) return
        try {
            googleLoading.value = true
            const { access_token } = await requestGoogleAccessToken(googleClientId.value!, googleDomain.value!)
            await authStore.loginWithGoogle({ accessToken: access_token, collegeId: collegeStore.selectedCollege.id })
        } catch (e: any) {
            errors.value.general = e?.response?.data?.message || e?.message || 'Error al iniciar sesión con Google.'
        } finally {
            googleLoading.value = false
        }
    }

    function onCollegeChange() {
        const college = collegeStore.colleges.find(c => c.id === collegeId.value)
        if (college) collegeStore.selectCollege(college)
    }

    async function submit() {
        errors.value = {}
        if (!collegeStore.selectedCollege) errors.value.college = 'Selecciona una institución'
        if (!email.value) errors.value.user = 'El usuario es obligatorio'
        if (!password.value) errors.value.password = 'La contraseña es obligatoria'
        if (Object.keys(errors.value).length > 0) return
        if (submitting.value) return
        submitting.value = true
        try {
            await authStore.login({
                email: email.value,
                password: password.value,
                collegeId: collegeStore.selectedCollege!.id,
                rememberMe: rememberMe.value,
            })
        } catch (error: any) {
            const data = error?.response?.data
            if (data?.code === 'USER_DISABLED') {
                errors.value.general = 'Tu cuenta fue deshabilitada por un administrador. Contacta al admin del plantel.'
                return
            }
            errors.value.general = 'Usuario o contraseña incorrectos'
        } finally {
            submitting.value = false
        }
    }

    onMounted(async () => {
        collegeStore.hydrate()
        collegeStore.loadColleges()
        if (collegeStore.selectedCollege) collegeId.value = collegeStore.selectedCollege.id

        const shortname = (route.params as any).shortname as string | undefined
        let resolved: CollegeBrandingResolved | null = null
        if (shortname) {
            resolved = await resolveBrandingByShortname(shortname)
            if (!resolved) { await router.replace('/auth/login'); return }
        } else {
            resolved = await resolveLoginDefault()
        }
        if (resolved) {
            branding.value = resolved.branding
            brandedCollegeLocked.value = true
            collegeId.value = resolved.college.id
            collegeStore.selectCollege({
                id: resolved.college.id, name: resolved.college.name, short_name: resolved.college.short_name,
            } as any)
            cacheBranding(resolved)
            applyBrandingCssVars(resolved.branding)
        }
    })

    return {
        authStore, collegeStore,
        branding, brandedCollegeLocked, brandedLogo, brandedTitle, brandedSubtitle, brandedHero, primaryColor,
        disabledBanner, collegeId, email, password, showPassword, googleLoading, submitting, rememberMe, errors,
        googleDomain, googleReady, onGoogleLogin, onCollegeChange, submit,
    }
}

export type LoginController = ReturnType<typeof useLoginController>
