<template>
    <!-- Estado estándar cuando una fase/proceso no está abierto para el alumno.
         Mismo diseño que "Mis Altas y Bajas" (card con ícono reloj ámbar). -->
    <div class="bg-white border border-slate-200 rounded-xl shadow-sm p-10 text-center">
        <div class="mx-auto w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
        </div>
        <h2 class="text-lg font-bold text-slate-700 uppercase">{{ title }}</h2>
        <p class="text-sm text-slate-500 mt-2 max-w-md mx-auto">{{ message }}</p>
        <p v-if="hint" class="text-xs text-amber-600 mt-2">{{ hint }}</p>
    </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
    /** Título principal (p.ej. "Fase no disponible"). */
    title?: string
    /** Mensaje explicativo de por qué no está abierta la fase. */
    message?: string
    /** Línea de ayuda opcional (más pequeña, en ámbar). */
    hint?: string
}>(), {
    title: 'Fase no disponible',
    message: 'Esta fase no está abierta en este momento.',
    hint: '',
})
</script>
