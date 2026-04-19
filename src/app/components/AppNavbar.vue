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

            <div class="flex items-center gap-2">
                <div class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-xs">
                    S3
                </div>
                <span class="font-black text-slate-800 tracking-tighter text-lg hidden sm:inline-block">
                    SGI <span class="text-indigo-600">v3</span>
                </span>
            </div>
        </div>

        <!-- Lado Derecho: Usuario y Acciones -->
        <div class="flex items-center gap-2 md:gap-4">

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
                    class="w-10 h-10 rounded-2xl bg-slate-100 text-indigo-600 font-black flex items-center justify-center border-2 border-white shadow-sm hover:scale-105 transition-transform"
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
        <transition
            enter-active-class="transition ease-out duration-150"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition ease-in duration-100"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
        >
            <div
                v-if="confirmOpen"
                class="fixed inset-0 z-[110] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
                @click.self="confirmOpen = false"
            >
                <transition
                    enter-active-class="transition ease-out duration-200"
                    enter-from-class="opacity-0 scale-95 translate-y-2"
                    enter-to-class="opacity-100 scale-100 translate-y-0"
                    leave-active-class="transition ease-in duration-150"
                    leave-from-class="opacity-100 scale-100 translate-y-0"
                    leave-to-class="opacity-0 scale-95 translate-y-2"
                    appear
                >
                    <div
                        class="bg-white rounded-2xl shadow-2xl ring-1 ring-slate-200 w-full max-w-sm overflow-hidden"
                    >
                        <div class="p-6">
                            <div class="flex items-start gap-4">
                                <div
                                    class="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                                    :class="auth.isImpersonating ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'"
                                >
                                    <ArrowRightStartOnRectangleIcon class="w-5 h-5" />
                                </div>
                                <div class="min-w-0 flex-1">
                                    <h3 class="text-base font-bold text-slate-800">
                                        {{ auth.isImpersonating ? '¿Salir de la simulación?' : '¿Cerrar sesión?' }}
                                    </h3>
                                    <p class="text-sm text-slate-500 mt-1">
                                        <template v-if="auth.isImpersonating">
                                            Volverás a tu sesión original como
                                            <span class="font-semibold text-slate-700">{{ auth.impersonator?.name || 'superadmin' }}</span>.
                                        </template>
                                        <template v-else>
                                            Perderás acceso al sistema hasta que vuelvas a iniciar sesión.
                                        </template>
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div class="px-6 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-2">
                            <button
                                type="button"
                                :disabled="working"
                                class="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition disabled:opacity-60"
                                @click="confirmOpen = false"
                            >Cancelar</button>
                            <button
                                type="button"
                                :disabled="working"
                                class="px-4 py-2 text-sm font-bold text-white rounded-lg transition disabled:opacity-60"
                                :class="auth.isImpersonating ? 'bg-amber-600 hover:bg-amber-700' : 'bg-red-600 hover:bg-red-700'"
                                @click="confirmLogout"
                            >{{ working ? 'Procesando...' : (auth.isImpersonating ? 'Salir de Simulación' : 'Cerrar sesión') }}</button>
                        </div>
                    </div>
                </transition>
            </div>
        </transition>

    </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { Bars3BottomLeftIcon, UserCircleIcon, ArrowRightStartOnRectangleIcon } from '@heroicons/vue/24/outline'

const auth = useAuthStore()
defineEmits(['toggle-sidebar'])

const menuOpen = ref(false)
const confirmOpen = ref(false)
const working = ref(false)
const dropdownRef = ref<HTMLElement>()

function askLogout() {
    menuOpen.value = false
    confirmOpen.value = true
}

async function confirmLogout() {
    if (working.value) return
    working.value = true
    try {
        if (auth.isImpersonating) {
            await auth.stopImpersonation()
        } else {
            auth.logout()
        }
    } finally {
        working.value = false
        confirmOpen.value = false
    }
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
