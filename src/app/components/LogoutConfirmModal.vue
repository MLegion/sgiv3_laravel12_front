<template>
    <Teleport to="body">
        <!-- Modal de confirmación de cierre de sesión -->
        <transition
            enter-active-class="transition ease-out duration-150"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition ease-in duration-100"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
        >
            <div
                v-if="modelValue"
                class="fixed inset-0 z-[110] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
                @click.self="close"
            >
                <transition
                    enter-active-class="transition ease-out duration-200"
                    enter-from-class="opacity-0 scale-95 translate-y-2"
                    enter-to-class="opacity-100 scale-100 translate-y-0"
                    leave-active-class="transition ease-in duration-150"
                    leave-from-class="opacity-100 scale-100 translate-y-0"
                    leave-to-class="opacity-0 scale-95 translate-y-2"
                    appear
                >
                    <div
                        class="bg-white rounded-2xl shadow-2xl ring-1 ring-slate-200 w-full max-w-sm overflow-hidden"
                    >
                        <div class="p-6">
                            <div class="flex items-start gap-4">
                                <div
                                    class="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                                    :class="auth.isImpersonating ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'"
                                >
                                    <ArrowRightStartOnRectangleIcon class="w-5 h-5" />
                                </div>
                                <div class="min-w-0 flex-1">
                                    <h3 class="text-base font-bold text-slate-800">
                                        {{ auth.isImpersonating ? '¿Salir de la simulación?' : '¿Cerrar sesión?' }}
                                    </h3>
                                    <p class="text-sm text-slate-500 mt-1">
                                        <template v-if="auth.isImpersonating">
                                            Volverás a tu sesión original como
                                            <span class="font-semibold text-slate-700">{{ auth.impersonator?.name || 'superadmin' }}</span>.
                                        </template>
                                        <template v-else>
                                            Perderás acceso al sistema hasta que vuelvas a iniciar sesión.
                                        </template>
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div class="px-6 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-2">
                            <button
                                type="button"
                                :disabled="working"
                                class="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition disabled:opacity-60"
                                @click="close"
                            >Cancelar</button>
                            <button
                                type="button"
                                :disabled="working"
                                class="px-4 py-2 text-sm font-bold text-white rounded-lg transition disabled:opacity-60"
                                :class="auth.isImpersonating ? 'bg-amber-600 hover:bg-amber-700' : 'bg-red-600 hover:bg-red-700'"
                                @click="confirmLogout"
                            >{{ working ? 'Procesando...' : (auth.isImpersonating ? 'Salir de Simulación' : 'Cerrar sesión') }}</button>
                        </div>
                    </div>
                </transition>
            </div>
        </transition>
    </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { ArrowRightStartOnRectangleIcon } from '@heroicons/vue/24/outline'

defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [boolean] }>()

const auth = useAuthStore()
const working = ref(false)

function close() {
    emit('update:modelValue', false)
}

async function confirmLogout() {
    if (working.value) return
    working.value = true
    try {
        if (auth.isImpersonating) {
            await auth.stopImpersonation()
        } else {
            auth.logout()
        }
    } finally {
        working.value = false
        emit('update:modelValue', false)
    }
}
</script>
