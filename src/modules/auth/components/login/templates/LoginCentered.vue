<template>
    <div class="relative min-h-screen flex p-4" :class="posClass" :style="[bg, typo]">
        <div v-if="overlay" :style="overlay"></div>
        <div class="relative w-full bg-white rounded-xl shadow-xl p-8 md:p-10" :style="card" style="max-width: 56rem">
            <!-- Header -->
            <div class="flex items-center justify-between mb-8 gap-4">
                <img v-if="show.tecnmLogo !== false" src="/img/TecNM.png" alt="TecNM" class="h-16 md:h-20 object-contain" />
                <h1 class="text-center text-lg md:text-xl font-semibold leading-snug" :style="{ color: branding?.primary_color || '#1d4ed8', fontSize: titleSize }">
                    <template v-if="branding?.welcome_title">
                        {{ branding.welcome_title }}
                        <span v-if="show.subtitle !== false && branding.welcome_subtitle" class="block text-sm font-normal text-gray-500 mt-1">{{ branding.welcome_subtitle }}</span>
                    </template>
                    <template v-else>INSTITUTO TECNOLÓGICO<br />SUPERIOR DE TIERRA BLANCA</template>
                </h1>
                <img v-if="show.logos !== false" :src="branding?.logo_url || '/img/ITSTB.jpg'" :alt="branding?.welcome_title || 'ITSTB'" class="h-16 md:h-20 object-contain" />
            </div>
            <!-- Body -->
            <div class="grid grid-cols-1 gap-8 items-center" :class="hasHero ? 'md:grid-cols-2' : ''">
                <div v-if="hasHero" class="flex justify-center">
                    <img :src="heroSrc" alt="" class="w-56 h-56 object-cover rounded-md border shadow-sm" />
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
import { backgroundStyle, overlayStyle, cardStyle, formPositionClass, rootTypography } from '@/modules/auth/components/login/loginStyle'

const props = defineProps<{ c: LoginController; branding: CollegeBranding | null; config: LoginConfig | null }>()
const show = computed(() => props.config?.show ?? {})
const bg = computed(() => backgroundStyle(props.branding, props.config))
const overlay = computed(() => overlayStyle(props.config))
const card = computed(() => cardStyle(props.config))
const posClass = computed(() => formPositionClass(props.config))
const typo = computed(() => rootTypography(props.config))
const titleSize = computed(() => props.config?.typography?.titleSize ? `${props.config!.typography!.titleSize}px` : undefined)
const hasHero = computed(() => props.config?.show?.hero !== false && !!(props.config?.background?.imageUrl || props.branding?.hero_url))
const heroSrc = computed(() => props.branding?.hero_url || '/img/anonimus.jpg')
</script>
