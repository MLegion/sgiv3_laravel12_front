<template>
    <!-- Preview presentacional y AUTOCONTENIDO: sin min-h-screen, sin position:fixed,
         sin componentes reales con efectos. No puede tumbar la app. -->
    <div class="lp-root" :style="typo">
        <!-- CENTERED -->
        <div v-if="template === 'centered'" class="lp-screen" :class="posClass" :style="bg">
            <div v-if="overlay" :style="overlay"></div>
            <div class="lp-card relative bg-white shadow-xl" :style="card" style="max-width: 460px; width: 92%">
                <div class="flex items-center justify-between mb-3 gap-2">
                    <img v-if="show.tecnmLogo !== false" src="/img/TecNM.png" class="h-8 object-contain" />
                    <div class="text-center text-[12px] font-semibold leading-tight" :style="{ color: primary }">{{ title }}</div>
                    <img v-if="show.logos !== false" :src="logo" class="h-8 object-contain" />
                </div>
                <LoginFormMock :config="config" :primary="primary" />
            </div>
        </div>

        <!-- SPLIT -->
        <div v-else-if="template === 'split'" class="lp-screen" :class="imageSide === 'right' ? 'flex-row-reverse' : ''" style="display:flex">
            <div class="relative flex items-center justify-center text-white p-4" :style="[panelBg, { flexBasis: (100 - formRatio) + '%' }]">
                <div v-if="overlay" :style="overlay"></div>
                <div class="relative text-center">
                    <img v-if="show.logos !== false && branding?.logo_url" :src="logo" class="h-10 mx-auto object-contain mb-2" />
                    <div class="text-sm font-bold drop-shadow">{{ title }}</div>
                </div>
            </div>
            <div class="bg-white flex items-center justify-center p-4" :style="{ flexBasis: formRatio + '%' }">
                <div class="w-full" :style="card" style="max-width: 300px">
                    <div class="text-[12px] font-semibold mb-2" :style="{ color: primary }">Iniciar sesión</div>
                    <LoginFormMock :config="config" :primary="primary" />
                </div>
            </div>
        </div>

        <!-- HERO -->
        <div v-else-if="template === 'hero'" class="lp-screen" :class="posClass" :style="heroBg">
            <div v-if="heroOverlay" :style="heroOverlay"></div>
            <div class="lp-card relative bg-white shadow-2xl" :style="card" style="max-width: 300px; width: 80%">
                <div class="text-center mb-2">
                    <img v-if="show.logos !== false" :src="logo" class="h-9 mx-auto object-contain mb-1" />
                    <div class="text-sm font-bold" :style="{ color: primary }">{{ title }}</div>
                </div>
                <LoginFormMock :config="config" :primary="primary" />
            </div>
        </div>

        <!-- MINIMAL -->
        <div v-else-if="template === 'minimal'" class="lp-screen" :class="posClass" :style="minimalBg">
            <div class="lp-card relative" :style="card" style="max-width: 260px; width: 78%">
                <div class="text-center mb-3">
                    <img v-if="show.logos !== false" :src="logo" class="h-8 mx-auto object-contain mb-2" />
                    <div class="text-[12px] font-semibold" :style="{ color: primary }">{{ title }}</div>
                </div>
                <LoginFormMock :config="config" :primary="primary" />
            </div>
        </div>

        <!-- CUSTOM -->
        <div v-else class="lp-screen lp-custom" v-html="customHtml"></div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import LoginFormMock from '@/modules/college/components/preview/LoginFormMock.vue'
import { sanitizeLoginHtml } from '@/modules/auth/components/login/sanitizeLoginHtml'
import { backgroundStyle, overlayStyle, cardStyle, formPositionClass, rootTypography } from '@/modules/auth/components/login/loginStyle'
import type { CollegeBranding, LoginConfig, LoginTemplate } from '@/modules/auth/services/branding.service'

const props = defineProps<{
    template: LoginTemplate
    branding: CollegeBranding | null
    config: LoginConfig | null
    collegeName?: string | null
}>()

const primary = computed(() => props.branding?.primary_color || '#4f46e5')
const title = computed(() => props.branding?.welcome_title || props.collegeName || 'Colegio')
const logo = computed(() => props.branding?.logo_url || '/img/ITSTB.jpg')
const show = computed(() => props.config?.show ?? {})

const bg = computed(() => backgroundStyle(props.branding, props.config))
const overlay = computed(() => overlayStyle(props.config))
const card = computed(() => cardStyle(props.config))
const posClass = computed(() => formPositionClass(props.config))
const typo = computed(() => rootTypography(props.config))

const imageSide = computed(() => props.config?.split?.imageSide ?? 'left')
const formRatio = computed(() => Math.min(70, Math.max(30, props.config?.split?.formRatio ?? 42)))
const panelBg = computed(() => backgroundStyle(props.branding, props.config))

// Hero: fondo por defecto = imagen; overlay por defecto suave.
const heroBg = computed(() => backgroundStyle(props.branding, props.config?.background ? props.config : { ...(props.config ?? {}), background: { type: 'image' } }))
const heroOverlay = computed(() => overlayStyle(props.config ?? { background: { overlay: 0.35 } }) ?? { position: 'absolute', inset: '0', backgroundColor: '#000', opacity: '0.35' })

// Minimal: fondo por defecto claro.
const minimalBg = computed(() => backgroundStyle(props.branding, props.config?.background ? props.config : { ...(props.config ?? {}), background: { type: 'color', color: '#f8fafc' } }))

function interpolate(raw: string): string {
    const b = props.branding
    const map: Record<string, string> = {
        title: b?.welcome_title || '', subtitle: b?.welcome_subtitle || '',
        logo: b?.logo_url || '', hero: b?.hero_url || '', primary: primary.value, tecnm: '/img/TecNM.png',
    }
    return raw.replace(/\{\{\s*([a-zA-Z_]+)\s*\}\}/g, (_m, k) => map[k] ?? '')
}
const customHtml = computed(() => sanitizeLoginHtml(interpolate(props.config?.customHtml || '')))
</script>

<style scoped>
.lp-root { width: 100%; height: 100%; }
/* La "pantalla" ocupa el alto de la caja (fijo por el contenedor); nunca 100vh. */
.lp-screen {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    padding: 12px;
    overflow: hidden;
}
.lp-card { border-radius: 14px; padding: 16px; }
/* El HTML personalizado se recorta al preview; se le baja el min-height a 100%. */
.lp-custom { display: block; padding: 0; }
.lp-custom :deep(.min-h-screen), .lp-custom :deep([class*="min-h-"]) { min-height: 100% !important; }
.lp-custom :deep(.fixed) { position: absolute !important; }
.lp-custom :deep([data-login-form]) {
    min-height: 90px;
    border: 2px dashed rgba(100,116,139,.5);
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
}
.lp-custom :deep([data-login-form])::before {
    content: 'Formulario de acceso';
    font-size: 11px; color: rgba(100,116,139,.9);
}
</style>
