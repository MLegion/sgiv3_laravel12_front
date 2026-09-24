<template>
    <div class="login-custom-root" :style="typo">
        <!-- HTML personalizado saneado -->
        <div ref="host" class="login-custom-host" v-html="safeHtml"></div>

        <!-- El formulario real (Vue) se teletransporta al marcador [data-login-form].
             Si el HTML no incluye el marcador, cae a un contenedor centrado. -->
        <Teleport v-if="formTarget" :to="formTarget">
            <div class="login-custom-form" :style="card">
                <LoginForm :c="c" :config="config" />
            </div>
        </Teleport>
        <div v-else class="login-custom-fallback">
            <div class="w-full bg-white rounded-xl shadow-xl p-8" :style="card" style="max-width: 24rem">
                <LoginForm :c="c" :config="config" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import LoginForm from '@/modules/auth/components/login/LoginForm.vue'
import { sanitizeLoginHtml } from '@/modules/auth/components/login/sanitizeLoginHtml'
import { cardStyle, rootTypography } from '@/modules/auth/components/login/loginStyle'
import type { LoginController } from '@/modules/auth/composables/useLoginController'
import type { CollegeBranding, LoginConfig } from '@/modules/auth/services/branding.service'

const props = defineProps<{ c: LoginController; branding: CollegeBranding | null; config: LoginConfig | null }>()

const host = ref<HTMLElement | null>(null)
const formTarget = ref<HTMLElement | null>(null)

const card = computed(() => cardStyle(props.config))
const typo = computed(() => rootTypography(props.config))

/** Interpola marcadores {{ ... }} de branding en el HTML antes de sanear. */
function interpolate(raw: string): string {
    const b = props.branding
    const map: Record<string, string> = {
        title: b?.welcome_title || '',
        subtitle: b?.welcome_subtitle || '',
        logo: b?.logo_url || '',
        hero: b?.hero_url || '',
        primary: b?.primary_color || '#1d4ed8',
        tecnm: '/img/TecNM.png',
    }
    return raw.replace(/\{\{\s*([a-zA-Z_]+)\s*\}\}/g, (_m, key) => map[key] ?? '')
}

const safeHtml = computed(() => sanitizeLoginHtml(interpolate(props.config?.customHtml || '')))

async function locateTarget() {
    await nextTick()
    formTarget.value = host.value?.querySelector('[data-login-form]') as HTMLElement | null
}

onMounted(locateTarget)
watch(safeHtml, locateTarget)
</script>

<style scoped>
.login-custom-root { min-height: 100vh; }
.login-custom-host { min-height: 100vh; }
.login-custom-fallback { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; padding: 1rem; }
</style>
