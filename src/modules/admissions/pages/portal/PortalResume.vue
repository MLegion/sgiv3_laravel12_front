<template>
    <div class="max-w-2xl mx-auto py-16">
        <LoadingOverlay :absolute="false" text="Abriendo tu expediente…" />
    </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import LoadingOverlay from '@/app/components/ui/LoadingOverlay.vue'

/**
 * Entrada del portal (/admissions/portal): reanuda al paso donde el aspirante
 * se quedó (último paso visitado, guardado por PortalStepper) y, si no hay,
 * al paso accionable según su estado. El gating del stepper corrige si el
 * paso recordado quedó bloqueado.
 */

const router = useRouter()

const STEP_NAMES = [
    'admissions.portal.personal',
    'admissions.portal.ext-personal',
    'admissions.portal.estudios',
    'admissions.portal.contactos',
    'admissions.portal.preventivos',
    'admissions.portal.otros',
    'admissions.portal.inscripcion',
    'admissions.portal.documentos',
    'admissions.portal.ficha',
    'admissions.portal.examen',
]

async function resolveTarget(): Promise<string> {
    // 1) Último paso visitado.
    const last = localStorage.getItem('portal:lastStep')
    if (last && STEP_NAMES.includes(last)) return last

    // 2) Paso accionable según el estado del aspirante.
    try {
        const { data } = await api.get(API.ADMISSIONS_API.portal.me)
        const status = data?.status ?? 0
        if (status >= 5) return 'admissions.portal.examen'
        if (status === 4) return 'admissions.portal.documentos'
        if (status === 3) return 'admissions.portal.inscripcion'
    } catch { /* fallback abajo */ }

    return 'admissions.portal.personal'
}

onMounted(async () => {
    const target = await resolveTarget()
    router.replace({ name: target })
})
</script>
