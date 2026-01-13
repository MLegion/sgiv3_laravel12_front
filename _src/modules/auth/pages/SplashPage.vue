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
import { useAuthStore } from '@/modules/auth/auth.store.ts'
import { useMenuStore } from '@/modules/user/menu.store'
import router from '@/app/router'

const auth = useAuthStore()
const menu = useMenuStore()

/* ---------- UI state ---------- */
const hasError = ref(false)
const title = ref('Entrando al sistema')
const message = ref('Por favor espere…')

onMounted(async () => {
    // 1️⃣ Asegurar sesión
    if (!auth.hydrated) {
        await auth.hydrate()
    }
    try {
        // 2️⃣ Cargar menú (CLAVE)
        await menu.loadMenus()
    } catch (error) {
        console.error('Error cargando menú:', error)
        // ⚠️ Estado visual de advertencia
        hasError.value = true
        title.value = 'Advertencia'
        message.value = 'No fue posible cargar la información del sistema.'

        auth.clearSession()
        // ⏳ Dar tiempo a leer el mensaje
        await new Promise(resolve => setTimeout(resolve, 4000))

        // 🔁 Redirigir a login
        router.replace('/auth/login')
    }


    // 3️⃣ UX pause
    await new Promise(resolve => setTimeout(resolve, 3000))

    // 4️⃣ Entrar a la app
    router.replace('/')
})
</script>
