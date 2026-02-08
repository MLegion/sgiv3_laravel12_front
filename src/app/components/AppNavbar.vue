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

            <!-- Avatar con Menú -->
            <div class="flex items-center gap-3 pl-2 border-l border-slate-100">
                <button class="w-10 h-10 rounded-2xl bg-slate-100 text-indigo-600 font-black flex items-center justify-center border-2 border-white shadow-sm hover:scale-105 transition-transform">
                    {{ auth.userName?.charAt(0).toUpperCase() }}
                </button>

                <button
                    @click="logout"
                    class="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    title="Cerrar sesión"
                >
                    <PowerIcon class="w-5 h-5" />
                </button>
            </div>

        </div>

    </header>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/modules/auth/stores/auth.store';
import { Bars3BottomLeftIcon, PowerIcon } from '@heroicons/vue/24/outline';

const auth = useAuthStore();
defineEmits(['toggle-sidebar']);

function logout() {
    auth.logout();
}
</script>
