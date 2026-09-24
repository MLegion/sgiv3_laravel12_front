<template>
    <div class="relative min-h-screen flex p-6" :class="posClass" :style="[bg, typo]">
        <div v-if="overlay" :style="overlay"></div>
        <div class="relative w-full" :style="card" style="max-width: 22rem">
            <div class="text-center mb-8">
                <img v-if="show.logos !== false" :src="branding?.logo_url || '/img/ITSTB.jpg'" alt="" class="h-14 mx-auto object-contain mb-4" />
                <h1 class="text-lg font-semibold" :style="{ color: branding?.primary_color || '#1d4ed8', fontSize: titleSize }">{{ branding?.welcome_title || 'Iniciar sesión' }}</h1>
            </div>
            <LoginForm :c="c" :config="config" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import LoginForm from '@/modules/auth/components/login/LoginForm.vue'
import type { LoginController } from '@/modules/auth/composables/useLoginController'
import type { CollegeBranding, LoginConfig } from '@/modules/auth/services/branding.service'
import { backgroundStyle, overlayStyle, cardStyle, formPositionClass, rootTypography } from '@/modules/auth/components/login/loginStyle'

const props = defineProps<{ c: LoginController; branding: CollegeBranding | null; config: LoginConfig | null }>()
const show = computed(() => props.config?.show ?? {})
// Minimalista: fondo por defecto color claro.
const bg = computed(() => backgroundStyle(props.branding, props.config?.background ? props.config : { ...(props.config ?? {}), background: { type: 'color', color: '#f8fafc' } }))
const overlay = computed(() => overlayStyle(props.config))
const card = computed(() => cardStyle(props.config))
const posClass = computed(() => formPositionClass(props.config))
const typo = computed(() => rootTypography(props.config))
const titleSize = computed(() => props.config?.typography?.titleSize ? `${props.config!.typography!.titleSize}px` : undefined)
</script>
