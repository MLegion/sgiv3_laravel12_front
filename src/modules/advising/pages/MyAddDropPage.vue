<template>
    <div class="space-y-4 max-w-7xl">
        <div class="flex items-center justify-between flex-wrap gap-3">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Mis Altas y Bajas</h1>
            <RouterLink :to="{ name: 'advising.my-advising' }" class="text-xs text-slate-600 hover:underline">
                ← Volver a Mi Asesoría
            </RouterLink>
        </div>

        <div class="bg-white border border-slate-200 rounded-xl shadow-sm p-10 text-center">
            <div class="mx-auto w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
            </div>
            <h2 class="text-lg font-bold text-slate-700 uppercase">Próximamente</h2>
            <p class="text-sm text-slate-500 mt-2 max-w-md mx-auto">
                Esta sección estará disponible cuando la fase de
                <strong>Altas y Bajas</strong> se habilite por tu coordinación.
                Aquí podrás solicitar cambios sobre las materias y grupos que confirmaste en tu reinscripción.
            </p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>
