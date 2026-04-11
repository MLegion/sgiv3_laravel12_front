<template>
    <div class="max-w-lg space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Eliminar Docente</h1>
            <button class="px-3 py-2 text-sm border rounded-lg hover:bg-slate-50" @click="router.back()">REGRESAR</button>
        </div>

        <div class="bg-white border rounded-xl shadow-sm p-6 space-y-4">
            <div v-if="loading" class="flex justify-center py-8">
                <div class="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>

            <template v-else>
                <p class="text-sm text-slate-700">
                    ¿Estás seguro de que deseas eliminar al docente <strong>{{ name }}</strong>?
                    Esta acción no se puede deshacer.
                </p>

                <div v-if="error" class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{{ error }}</div>

                <div class="flex justify-end gap-2 pt-4 border-t">
                    <button type="button" class="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50" @click="router.back()">CANCELAR</button>
                    <button type="button"
                        class="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                        :disabled="deleting"
                        @click="confirm">
                        {{ deleting ? 'ELIMINANDO...' : 'ELIMINAR' }}
                    </button>
                </div>
            </template>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { teacherFullName } from '@/modules/sca/types/teacher.type'

const router  = useRouter()
const route   = useRoute()
const id      = route.params.id as string
const loading = ref(true)
const deleting = ref(false)
const error   = ref('')
const name    = ref('')

onMounted(async () => {
    try {
        const res = await api.get(API.SCA_API.teachers.byId(id))
        name.value = teacherFullName(res.data)
    } catch {
        error.value = 'No se pudo cargar el docente.'
    } finally {
        loading.value = false
    }
})

async function confirm() {
    deleting.value = true
    error.value = ''
    try {
        await api.delete(API.SCA_API.teachers.delete(id))
        router.push({ name: 'sca.teachers' })
    } catch (e: any) {
        error.value = e?.response?.data?.message ?? 'Error al eliminar.'
        deleting.value = false
    }
}
</script>
