<template>
    <div class="min-h-screen flex items-center justify-center" :style="backgroundStyle">
        <div class="text-center space-y-4 bg-white p-8 rounded-lg shadow-lg w-80">

            <!-- Título -->
            <div
                class="text-2xl font-semibold"
                :class="hasError ? 'text-amber-600' : 'text-slate-500'"
            >
                {{ title }}
            </div>

            <!-- Mensaje -->
            <div class="text-sm" :class="hasError ? 'text-amber-500' : 'text-slate-400'">
                {{ message }}
            </div>

            <!-- Spinner -->
            <div
                v-if="!hasError"
                class="animate-spin w-8 h-8 border-4 border-indigo-500
                       border-t-transparent rounded-full mx-auto"
            />

            <!-- Icono warning -->
            <div v-else class="text-4xl text-amber-500">
                ⚠️
            </div>

        </div>
    </div>
</template>

<script setup lang="ts">
const backgroundStyle = {
    backgroundImage: "url('/img/background.png')",
}

import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store.ts'
import { useMenuStore } from '@/app/stores/menu.store'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import router from '@/app/router'

const auth = useAuthStore()
const menu = useMenuStore()

/* ---------- UI state ---------- */
const hasError = ref(false)
const title = ref('Entrando al sistema')
const message = ref('Por favor espere…')

const REDIRECT_KEY     = 'post_splash_redirect'
const VERIFY_EMAIL_PATH = '/admissions/portal/verify-email'

onMounted(async () => {
    if (!auth.token) {
        auth.clearSession()
        return router.replace('/auth/login')
    }

    // 1️⃣ Asegurar sesión
    if (!auth.hydrated) {
        await auth.hydrate()
    }
    try {
        // 2️⃣ Cargar menú (CLAVE)
        await menu.loadMenu()
    } catch (error) {
        console.error('Error cargando menú:', error)
        hasError.value = true
        title.value = 'Advertencia'
        message.value = 'No fue posible cargar la información del sistema.'
        sessionStorage.removeItem(REDIRECT_KEY)
        auth.clearSession()
        menu.clearMenu()
        await new Promise(resolve => setTimeout(resolve, 4000))
        router.replace('/auth/login')
        return
    }

    // 3️⃣ Si el usuario es ASPIRANTE, verificar estado del correo antes de entrar
    const isApplicant = menu.menus.some(m => m.code === 'adm.portal')
    if (isApplicant && auth.emailVerified === null) {
        try {
            const { data } = await api.get(API.ADMISSIONS_API.portal.emailStatus)
            // Solo bloquear si el periodo REQUIERE verificación Y el email no está verificado
            auth.emailVerified = data.emailVerified || !data.requiresVerification
        } catch {
            auth.emailVerified = true // Si falla, dejamos pasar; el middleware BE bloqueará
        }
    }

    // 4️⃣ UX pause
    await new Promise(resolve => setTimeout(resolve, 500))

    // 5️⃣ Entrar a la app (o a verificación si el correo no está verificado)
    if (auth.emailVerified === false) {
        sessionStorage.removeItem(REDIRECT_KEY)
        return router.replace(VERIFY_EMAIL_PATH)
    }

    const redirect = sessionStorage.getItem(REDIRECT_KEY) || '/'
    sessionStorage.removeItem(REDIRECT_KEY)
    router.replace(redirect)
})
</script>
