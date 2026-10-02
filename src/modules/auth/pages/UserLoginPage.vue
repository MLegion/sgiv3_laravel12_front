<template>
    <!-- Gate anti-parpadeo: hasta resolver el branding no se pinta ninguna
         plantilla, así se evita mostrar el login por defecto y luego "saltar"
         a la plantilla real. En visitas repetidas el caché ya deja ready=true
         de entrada, por lo que este splash ni aparece. -->
    <div v-if="!c.ready.value" class="min-h-screen flex items-center justify-center bg-slate-50">
        <div class="h-8 w-8 rounded-full border-2 border-slate-300 border-t-slate-600 animate-spin"></div>
    </div>
    <component v-else :is="templateComponent" :c="c" :branding="c.branding.value" :config="loginConfig" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useLoginController } from '@/modules/auth/composables/useLoginController'
import LoginCentered from '@/modules/auth/components/login/templates/LoginCentered.vue'
import LoginSplit from '@/modules/auth/components/login/templates/LoginSplit.vue'
import LoginHero from '@/modules/auth/components/login/templates/LoginHero.vue'
import LoginMinimal from '@/modules/auth/components/login/templates/LoginMinimal.vue'
import LoginCustom from '@/modules/auth/components/login/templates/LoginCustom.vue'
import type { LoginTemplate, LoginConfig } from '@/modules/auth/services/branding.service'

const c = useLoginController()

const templates = {
    centered: LoginCentered,
    split: LoginSplit,
    hero: LoginHero,
    minimal: LoginMinimal,
    custom: LoginCustom,
}

const template = computed<LoginTemplate>(() => c.branding.value?.login_template ?? 'centered')
const templateComponent = computed(() => templates[template.value] ?? LoginCentered)
const loginConfig = computed<LoginConfig | null>(() => c.branding.value?.login_config ?? null)
</script>
