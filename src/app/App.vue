<script setup lang="ts">
import { RouterView } from 'vue-router'

/**
 * Componente raíz de SGI v3.
 * Mantiene una estructura mínima para delegar el diseño a los Layouts.
 */
</script>
<template>
    <RouterView />
</template>

<style>
/* Reset global para aplicaciones SPA de pantalla completa */
html, body, #app {
    height: 100%;
    width: 100%;
    margin: 0;
    padding: 0;
}

#app {
    font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

/* Transición suave entre SplashLayout y AppLayout */
.layout-fade-enter-active,
.layout-fade-leave-active {
    transition: opacity 0.25s ease;
}

.layout-fade-enter-from,
.layout-fade-leave-to {
    opacity: 0;
}
</style>
