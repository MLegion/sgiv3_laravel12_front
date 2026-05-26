<template>
    <header class="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 shadow-sm z-[80] relative">

        <!-- Lado Izquierdo: Toggle y Logo -->
        <div class="flex items-center gap-4">
            <!-- Botón Hamburguesa (Solo Móvil/Tablet) -->
            <button
                @click="$emit('toggle-sidebar')"
                class="p-2 rounded-xl text-slate-500 hover:bg-slate-100 lg:hidden transition-colors"
            >
                <Bars3BottomLeftIcon class="w-6 h-6" />
            </button>

            <div class="flex items-center gap-3">
                <!-- Logo izquierdo: del branding si existe, sino SGI v3 default -->
                <img
                    v-if="branding.branding?.navbar_logo_left_url"
                    :src="branding.branding.navbar_logo_left_url"
                    alt="Logo"
                    class="h-9 w-auto object-contain"
                />
                <div
                    v-else
                    class="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-xs"
                    :style="{ backgroundColor: 'var(--brand-primary, #4f46e5)' }"
                >
                    S3
                </div>

                <!-- Texto del colegio (o fallback SGI v3) -->
                <span
                    v-if="branding.navbarTitle"
                    class="font-black text-slate-800 tracking-tight text-base hidden sm:inline-block truncate max-w-[280px]"
                >
                    {{ branding.navbarTitle }}
                </span>
                <span v-else class="font-black text-slate-800 tracking-tighter text-lg hidden sm:inline-block">
                    SGI <span :style="{ color: 'var(--brand-primary, #4f46e5)' }">v3</span>
                </span>

                <!-- Logo derecho (opcional, sólo si hay branding) -->
                <img
                    v-if="branding.branding?.navbar_logo_right_url"
                    :src="branding.branding.navbar_logo_right_url"
                    alt="Logo"
                    class="h-9 w-auto object-contain hidden sm:inline-block"
                />
            </div>
        </div>

        <!-- Lado Derecho: Usuario y Acciones -->
        <div class="flex items-center gap-2 md:gap-4">

            <!-- Campana de notificaciones -->
            <NotificationsBell />

            <!-- Información Usuario (Oculta en móviles muy pequeños) -->
            <div class="hidden md:block text-right">
                <p class="text-xs font-black text-slate-400 uppercase tracking-widest mb-0.5">Usuario</p>
                <p class="text-sm font-bold text-slate-700 truncate max-w-[150px]">
                    {{ auth.userName }}
                </p>
            </div>

            <!-- Avatar con Dropdown -->
            <div class="relative pl-2 border-l border-slate-100" ref="dropdownRef">
                <button
                    @click="menuOpen = !menuOpen"
                    class="w-10 h-10 rounded-2xl bg-slate-100 font-black flex items-center justify-center border-2 border-white shadow-sm hover:scale-105 transition-transform"
                    :style="{ color: 'var(--brand-primary, #4f46e5)' }"
                >
                    {{ auth.userName?.charAt(0).toUpperCase() }}
                </button>

                <!-- Dropdown Menu -->
                <transition
                    enter-active-class="transition ease-out duration-150"
                    enter-from-class="opacity-0 scale-95 -translate-y-1"
                    enter-to-class="opacity-100 scale-100 translate-y-0"
                    leave-active-class="transition ease-in duration-100"
                    leave-from-class="opacity-100 scale-100 translate-y-0"
                    leave-to-class="opacity-0 scale-95 -translate-y-1"
                >
                    <div
                        v-if="menuOpen"
                        class="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg ring-1 ring-slate-200 overflow-hidden"
                    >
                        <!-- Info usuario -->
                        <div class="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                            <p class="text-sm font-bold text-slate-800 truncate">{{ auth.userName }}</p>
                            <p class="text-xs text-slate-400 truncate">{{ auth.user?.email }}</p>
                        </div>

                        <!-- Opciones (solo employee/student) -->
                        <div v-if="auth.profileType && auth.profileType !== 'applicant'" class="py-1 border-b border-slate-100">
                            <router-link
                                to="/profile"
                                class="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                                @click="menuOpen = false"
                            >
                                <UserCircleIcon class="w-5 h-5 text-slate-400" />
                                Mi Perfil
                            </router-link>
                        </div>

                        <!-- Cerrar sesión / Salir de simulación -->
                        <div class="py-1">
                            <button
                                @click="askLogout"
                                class="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                                :class="auth.isImpersonating
                                    ? 'text-amber-700 hover:bg-amber-50'
                                    : 'text-slate-600 hover:bg-red-50 hover:text-red-600'"
                            >
                                <ArrowRightStartOnRectangleIcon class="w-5 h-5" :class="auth.isImpersonating ? 'text-amber-500' : 'text-slate-400'" />
                                {{ auth.isImpersonating ? 'Salir de Simulación' : 'Cerrar Sesión' }}
                            </button>
                        </div>
                    </div>
                </transition>
            </div>

        </div>

        <!-- Modal de confirmación de cierre de sesión -->
        <LogoutConfirmModal v-model="confirmOpen" />

    </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useBrandingStore } from '@/modules/auth/stores/branding.store'
import { Bars3BottomLeftIcon, UserCircleIcon, ArrowRightStartOnRectangleIcon } from '@heroicons/vue/24/outline'
import NotificationsBell from '@/modules/notifications/components/NotificationsBell.vue'
import LogoutConfirmModal from '@/app/components/LogoutConfirmModal.vue'

const auth = useAuthStore()
const branding = useBrandingStore()
defineEmits(['toggle-sidebar'])

const menuOpen = ref(false)
const confirmOpen = ref(false)
const dropdownRef = ref<HTMLElement>()

function askLogout() {
    menuOpen.value = false
    confirmOpen.value = true
}

function handleClickOutside(e: MouseEvent) {
    if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
        menuOpen.value = false
    }
}

onMounted(() => {
    document.addEventListener('click', handleClickOutside)
    auth.loadProfileType()
})
onUnmounted(() => document.removeEventListener('click', handleClickOutside))
</script>
