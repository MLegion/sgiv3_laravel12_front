<template>
    <div class="max-w-4xl space-y-4">
        <h1 class="text-xl font-semibold text-slate-800">FICHA</h1>

        <PortalHelpDrawer title="Cómo obtener tu Preficha">
            <div class="rounded-lg bg-blue-50 border border-blue-200 p-3 text-blue-800 text-xs">
                Tu <strong>preficha</strong> se genera automáticamente una vez que completes y <strong>guardes</strong> toda tu información de aspirante.
            </div>
            <div class="space-y-2">
                <p class="font-semibold text-slate-800">1. Completa y guarda cada sección</p>
                <p class="text-xs text-slate-500">Llena y presiona <span class="font-semibold">Guardar</span> en: <span class="font-semibold">Información General</span>, <span class="font-semibold">Datos Personales</span>, <span class="font-semibold">Último Nivel de Estudio</span>, <span class="font-semibold">Contactos</span>, <span class="font-semibold">Datos Preventivos</span> y <span class="font-semibold">Otros Datos</span>.</p>
            </div>
            <div class="space-y-2">
                <p class="font-semibold text-slate-800">2. Sube tus documentos</p>
                <p class="text-xs text-slate-500">En la sección <span class="font-semibold">Documentos</span> carga los archivos requeridos. Revisa que no falte ninguno marcado como obligatorio.</p>
            </div>
            <div class="space-y-2">
                <p class="font-semibold text-slate-800">3. Revisa los campos requeridos</p>
                <p class="text-xs text-slate-500">El aviso de <span class="font-semibold">campos requeridos</span> en cada sección te indica qué falta. Mientras haya pendientes, la preficha no podrá generarse.</p>
            </div>
            <div class="rounded-lg bg-amber-50 border border-amber-200 p-3 text-amber-800 text-xs">
                Cuando toda tu información esté completa y guardada, tu <strong>preficha</strong> aparecerá aquí lista para descargar e imprimir.
            </div>
        </PortalHelpDrawer>

        <div class="bg-white border rounded-xl shadow-sm p-10 text-center text-slate-400 text-sm">
            Próximamente...
        </div>
    </div>
</template>

<script setup lang="ts">
import PortalHelpDrawer from './PortalHelpDrawer.vue'
</script>
