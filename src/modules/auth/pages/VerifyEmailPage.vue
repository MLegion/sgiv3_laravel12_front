<template>
    <div
        class="min-h-screen flex items-center justify-center bg-cover bg-center"
        :style="backgroundStyle"
    >
        <div class="w-full max-w-md bg-white rounded-xl shadow-xl p-10 text-center space-y-5">

            <!-- Cargando -->
            <template v-if="loading">
                <div class="text-4xl animate-pulse">⏳</div>
                <p class="text-slate-500">Verificando tu correo...</p>
            </template>

            <!-- Éxito -->
            <template v-else-if="verified">
                <div class="text-5xl">✅</div>
                <h2 class="text-xl font-semibold text-slate-700">¡Correo verificado!</h2>
                <p class="text-slate-500">Tu cuenta está activa. Ya puedes iniciar sesión.</p>
                <router-link
                    to="/auth/login"
                    class="inline-block mt-4 px-6 py-3 bg-indigo-600 hover:bg-indigo-700
                           text-white font-semibold rounded-lg transition"
                >
                    Ir al inicio de sesión
                </router-link>
            </template>

            <!-- Ya verificado antes -->
            <template v-else-if="alreadyVerified">
                <div class="text-5xl">ℹ️</div>
                <h2 class="text-xl font-semibold text-slate-700">Correo ya verificado</h2>
                <p class="text-slate-500">Tu cuenta ya estaba verificada. Puedes iniciar sesión.</p>
                <router-link to="/auth/login" class="inline-block mt-4 text-indigo-600 hover:underline">
                    Ir al inicio de sesión
                </router-link>
            </template>

            <!-- Error -->
            <template v-else>
                <div class="text-5xl">❌</div>
                <h2 class="text-xl font-semibold text-slate-700">Enlace inválido</h2>
                <p class="text-slate-500">{{ errorMessage }}</p>
                <router-link to="/auth/login" class="inline-block mt-4 text-indigo-600 hover:underline">
                    Ir al inicio de sesión
                </router-link>
            </template>

        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/shared/services/api'
import ADMISSIONS_API from '@/modules/admissions/api/admissions.api'

const route          = useRoute()
const loading        = ref(true)
const verified       = ref(false)
const alreadyVerified = ref(false)
const errorMessage   = ref('El enlace de verificación es inválido o ha expirado.')

onMounted(async () => {
    const id   = route.query.id as string
    const hash = route.query.hash as string

    if (!id || !hash) {
        errorMessage.value = 'Parámetros inválidos en el enlace.'
        loading.value = false
        return
    }

    try {
        const { data } = await api.get(
            ADMISSIONS_API.api.portal.verifyEmail(id, hash)
        )
        if (data.alreadyVerified) {
            alreadyVerified.value = true
        } else {
            verified.value = true
        }
    } catch (err: any) {
        errorMessage.value = err?.response?.data?.message ?? 'Enlace inválido o expirado.'
    } finally {
        loading.value = false
    }
})

const backgroundStyle = { backgroundImage: "url('/img/background.png')" }
</script>
