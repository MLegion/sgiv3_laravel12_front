<template>
    <div class="relative min-h-screen flex p-6 md:p-12" :class="posClass" :style="[bg, typo]">
        <div v-if="overlay" :style="overlay"></div>
        <div class="relative w-full bg-white rounded-2xl shadow-2xl p-8" :style="card" style="max-width: 26rem">
            <div class="text-center mb-6">
                <img v-if="show.logos !== false" :src="branding?.logo_url || '/img/ITSTB.jpg'" alt="" class="h-16 mx-auto object-contain mb-3" />
                <h1 class="text-xl font-bold" :style="{ color: branding?.primary_color || '#1d4ed8', fontSize: titleSize }">{{ branding?.welcome_title || 'Bienvenido' }}</h1>
                <p v-if="show.subtitle !== false && branding?.welcome_subtitle" class="text-sm text-gray-500 mt-1">{{ branding.welcome_subtitle }}</p>
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
// En hero el fondo por defecto es imagen; si no hay config, forzamos imagen del hero.
const bg = computed(() => backgroundStyle(props.branding, props.config?.background ? props.config : { ...(props.config ?? {}), background: { type: 'image' } }))
const overlay = computed(() => overlayStyle(props.config ?? { background: { overlay: 0.35 } }))
const card = computed(() => cardStyle(props.config))
const posClass = computed(() => formPositionClass(props.config))
const typo = computed(() => rootTypography(props.config))
const titleSize = computed(() => props.config?.typography?.titleSize ? `${props.config!.typography!.titleSize}px` : undefined)
</script>
