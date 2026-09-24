<template>
    <div class="space-y-2.5">
        <div>
            <div class="text-[10px] text-gray-500 mb-0.5">Usuario o correo</div>
            <div class="h-8 rounded border border-gray-300 bg-white"></div>
        </div>
        <div>
            <div class="text-[10px] text-gray-500 mb-0.5">Contraseña</div>
            <div class="h-8 rounded border border-gray-300 bg-white"></div>
        </div>
        <div class="flex items-center justify-between text-[10px]" :style="{ color: linkColor }">
            <span class="text-gray-500">Recordarme</span>
            <span>Recuperar contraseña</span>
        </div>
        <div class="h-9 rounded flex items-center justify-center text-white text-[11px] font-semibold" :style="{ backgroundColor: buttonColor }">
            INGRESAR
        </div>
        <div v-if="showAspirantes" class="text-center text-[9px] text-gray-500 pt-0.5">
            ¿Eres aspirante? <span :style="{ color: linkColor }">Portal de inscripciones</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { LoginConfig } from '@/modules/auth/services/branding.service'

const props = defineProps<{ config?: LoginConfig | null; primary: string }>()
const buttonColor = computed(() => props.config?.colors?.button || props.primary)
const linkColor = computed(() => props.config?.colors?.link || props.primary)
const showAspirantes = computed(() => props.config?.show?.aspirantesLink !== false)
</script>
