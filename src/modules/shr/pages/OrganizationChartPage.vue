<template>
    <div class="max-w-5xl mx-auto space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">
                Organigrama institucional
            </h1>
        </div>

        <!-- Card -->
        <div
            class="bg-white border rounded-xl shadow-sm p-10
                   flex flex-col items-center justify-center
                   text-center space-y-4"
        >
            <!-- Icon -->
            <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-16 w-16 text-slate-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="1.5"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
            </svg>

            <!-- Title -->
            <h2 class="text-lg font-semibold text-slate-700">
                Módulo en construcción
            </h2>

            <!-- Description -->
            <p class="text-sm text-slate-500 max-w-md">
                El diseñador de organigrama se encuentra actualmente en desarrollo.
                Próximamente podrás estructurar áreas y puestos de manera visual
                para representar la organización institucional.
            </p>

            <!-- Hint -->
            <p class="text-xs text-slate-400">
                🚧 Esta funcionalidad estará disponible en una siguiente iteración.
            </p>
        </div>
    </div>
</template>

<script setup lang="ts">
// Página intencionalmente simple.
// El diseñador de organigrama se implementará en una siguiente iteración.
</script>
