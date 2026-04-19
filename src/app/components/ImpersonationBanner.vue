<template>
    <div
        v-if="auth.isImpersonating"
        class="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-b-2 border-amber-700 shadow-md z-[90] relative"
    >
        <div class="px-4 md:px-6 py-2 flex items-center justify-between gap-4 max-w-[1920px] mx-auto">
            <div class="flex items-center gap-3 min-w-0">
                <EyeIcon class="w-5 h-5 flex-shrink-0" />
                <div class="min-w-0">
                    <p class="text-xs font-black uppercase tracking-widest leading-tight opacity-90">
                        Modo Simulación
                    </p>
                    <p class="text-sm font-semibold truncate">
                        Viendo la sesión de
                        <span class="font-black">{{ auth.userName }}</span>
                        <span v-if="auth.user?.email" class="text-amber-100 font-medium">
                            ({{ auth.user.email }})
                        </span>
                        <span v-if="auth.impersonator" class="ml-2 text-amber-100 text-xs font-medium">
                            — iniciado por {{ auth.impersonator.name }}
                        </span>
                    </p>
                </div>
            </div>

            <div class="flex items-center gap-3 flex-shrink-0">
                <span
                    v-if="remainingMinutes !== null"
                    class="hidden sm:inline-block text-xs font-medium bg-white/20 px-2 py-1 rounded-lg"
                >
                    Expira en {{ remainingMinutes }} min
                </span>
                <button
                    @click="handleStop"
                    :disabled="stopping"
                    class="flex items-center gap-1.5 px-3 py-1.5 bg-white text-orange-600 font-bold text-sm rounded-lg hover:bg-amber-50 disabled:opacity-60 transition shadow-sm"
                >
                    <ArrowLeftOnRectangleIcon class="w-4 h-4" />
                    <span class="hidden sm:inline">{{ stopping ? 'Saliendo...' : 'Salir de Simulación' }}</span>
                    <span class="sm:hidden">Salir</span>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { EyeIcon, ArrowLeftOnRectangleIcon } from '@heroicons/vue/24/outline'

const auth = useAuthStore()
const stopping = ref(false)
const now = ref(Date.now())
let tickerId: number | null = null

onMounted(() => {
    tickerId = window.setInterval(() => {
        now.value = Date.now()
    }, 30_000)
})

onUnmounted(() => {
    if (tickerId !== null) window.clearInterval(tickerId)
})

const remainingMinutes = computed<number | null>(() => {
    if (!auth.impersonationExpiresAt) return null
    const expiresMs = new Date(auth.impersonationExpiresAt).getTime()
    const diffMs = expiresMs - now.value
    if (diffMs <= 0) return 0
    return Math.max(1, Math.round(diffMs / 60_000))
})

async function handleStop() {
    if (stopping.value) return
    stopping.value = true
    try {
        await auth.stopImpersonation()
    } finally {
        stopping.value = false
    }
}
</script>
