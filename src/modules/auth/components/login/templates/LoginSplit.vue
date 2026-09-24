<template>
    <div class="min-h-screen flex flex-col md:flex-row" :style="typo" :class="imageSide === 'right' ? 'md:flex-row-reverse' : ''">
        <!-- Panel imagen/branding -->
        <div class="relative hidden md:flex items-center justify-center text-white p-10" :style="[panelBg, { flexBasis: imageBasis }]">
            <div v-if="overlay" :style="overlay"></div>
            <div class="relative text-center max-w-md">
                <img v-if="show.logos !== false && branding?.logo_url" :src="branding.logo_url" alt="" class="h-24 mx-auto object-contain mb-6" />
                <h1 class="text-3xl font-bold drop-shadow" :style="{ fontSize: titleSize }">{{ branding?.welcome_title || 'INSTITUTO TECNOLÓGICO SUPERIOR DE TIERRA BLANCA' }}</h1>
                <p v-if="show.subtitle !== false && branding?.welcome_subtitle" class="mt-3 text-white/90">{{ branding.welcome_subtitle }}</p>
            </div>
        </div>
        <!-- Panel formulario -->
        <div class="flex items-center justify-center p-6 md:p-10 bg-white flex-1" :style="{ flexBasis: formBasis }">
            <div class="w-full" :style="card" style="max-width: 26rem">
                <div class="flex items-center gap-3 mb-6">
                    <img v-if="show.tecnmLogo !== false" src="/img/TecNM.png" alt="TecNM" class="h-12 object-contain" />
                    <h2 class="text-lg font-semibold" :style="{ color: branding?.primary_color || '#1d4ed8' }">Iniciar sesión</h2>
                </div>
                <LoginForm :c="c" :config="config" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import LoginForm from '@/modules/auth/components/login/LoginForm.vue'
import type { LoginController } from '@/modules/auth/composables/useLoginController'
import type { CollegeBranding, LoginConfig } from '@/modules/auth/services/branding.service'
import { backgroundStyle, overlayStyle, cardStyle, rootTypography } from '@/modules/auth/components/login/loginStyle'

const props = defineProps<{ c: LoginController; branding: CollegeBranding | null; config: LoginConfig | null }>()
const show = computed(() => props.config?.show ?? {})
const imageSide = computed(() => props.config?.split?.imageSide ?? 'left')
const formRatio = computed(() => Math.min(80, Math.max(30, props.config?.split?.formRatio ?? 42)))
const formBasis = computed(() => `${formRatio.value}%`)
const imageBasis = computed(() => `${100 - formRatio.value}%`)
const panelBg = computed(() => backgroundStyle(props.branding, props.config))
const overlay = computed(() => overlayStyle(props.config))
const card = computed(() => cardStyle(props.config))
const typo = computed(() => rootTypography(props.config))
const titleSize = computed(() => props.config?.typography?.titleSize ? `${props.config!.typography!.titleSize}px` : undefined)
</script>
