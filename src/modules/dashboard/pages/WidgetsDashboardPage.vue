<template>
    <div class="space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
            <h1 class="text-2xl font-semibold">
                Bienvenido, {{ userName }}
            </h1>

            <button
                class="inline-flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                @click="catalogOpen = true"
            >
                <PlusIcon class="w-4 h-4" />
                Agregar widget
            </button>
        </div>

        <div v-if="store.loadingActive && store.active.length === 0" class="flex justify-center p-10">
            <ArrowPathIcon class="w-8 h-8 animate-spin text-slate-400" />
        </div>

        <div
            v-else-if="store.active.length === 0"
            class="border-2 border-dashed border-slate-300 rounded-xl p-10 text-center"
        >
            <div class="flex justify-center text-slate-400 mb-3">
                <Squares2X2Icon class="w-12 h-12" />
            </div>
            <p class="text-slate-600 text-sm">
                Tu dashboard está vacío.
            </p>
            <p class="text-slate-500 text-xs mt-1">
                Agrega widgets desde el catálogo para personalizar tu vista de inicio.
            </p>
            <button
                class="mt-4 inline-flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                @click="catalogOpen = true"
            >
                <PlusIcon class="w-4 h-4" />
                Explorar widgets disponibles
            </button>
        </div>

        <div v-else class="grid grid-cols-12 gap-4">
            <WidgetCard
                v-for="w in store.active"
                :key="w.id"
                :widget="w"
                @remove="onRemove"
            />
        </div>

        <WidgetCatalogModal v-model="catalogOpen" />
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useToast } from '@/app/composables/useToast'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { useDashboardStore } from '@/modules/dashboard/stores/dashboard.store'
import WidgetCard from '@/modules/dashboard/components/WidgetCard.vue'
import WidgetCatalogModal from '@/modules/dashboard/components/WidgetCatalogModal.vue'
import { PlusIcon, ArrowPathIcon, Squares2X2Icon } from '@heroicons/vue/24/outline'

const auth        = useAuthStore()
const store       = useDashboardStore()
const userName    = auth.userName
const catalogOpen = ref(false)

onMounted(() => { store.loadActive() })

async function onRemove(id: string): Promise<void> {
    try {
        await store.remove(id)
        useToast().success('Widget quitado del tablero.')
    } catch (e: any) {
        useToast().error(e?.response?.data?.message ?? 'No se pudo quitar el widget.')
    }
}
</script>
