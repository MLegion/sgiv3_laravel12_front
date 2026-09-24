<template>
    <component :is="templateComponent" :c="c" :branding="c.branding.value" :config="loginConfig" />
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
