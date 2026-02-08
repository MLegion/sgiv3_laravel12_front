<template>
    <div
        :title="item.subject?.name"
        :class="[
            'group relative bg-white border-2 transition-all flex flex-col overflow-hidden h-full min-h-[160px]',
            isActiveLink ? 'border-blue-500 ring-2 ring-blue-100 z-10 scale-105 shadow-lg' : 'border-slate-300 shadow-sm hover:shadow-md',
            isPotentialReq ? 'border-dashed border-green-400 cursor-pointer hover:bg-green-50' : ''
        ]"
        @click="isPotentialReq ? $emit('select-as-req', item) : null"
    >
        <!-- Indicador de Requisito Asignado -->
        <div v-if="item.prerequisite_1_id && !isLinking" class="absolute top-0 left-0 bg-blue-600 text-white text-[7px] font-black px-1.5 py-0.5 rounded-br-lg z-20 uppercase">
            Con Requisito
        </div>

        <!-- Cuerpo: Nombre y Clave -->
        <div class="flex-grow flex flex-col justify-center items-center px-3 text-center py-2">
            <h4 class="text-[10px] font-black text-slate-800 leading-tight uppercase tracking-tight mb-2 italic line-clamp-2">
                {{ item.subject?.shortName || item.subject?.name }}
            </h4>
            <div class="text-[16px] font-medium text-slate-900 tracking-[0.15em] font-sans">
                {{ item.subject?.officialCode }}
            </div>
        </div>

        <!-- Tabla Técnica (HP, HT, CR) -->
        <div class="mt-auto border-t-2 border-slate-300">
            <div class="grid grid-cols-3 bg-white text-slate-800 font-bold border-b border-slate-100">
                <div class="py-1 flex flex-col items-center border-r-2 border-slate-300">
                    <span class="text-[7px] text-slate-400 font-black uppercase">hp</span>
                    <span class="text-xs leading-none">{{ item.subject?.hp || 0 }}</span>
                </div>
                <div class="py-1 flex flex-col items-center border-r-2 border-slate-300">
                    <span class="text-[7px] text-slate-400 font-black uppercase">ht</span>
                    <span class="text-xs leading-none">{{ item.subject?.ht || 0 }}</span>
                </div>
                <div class="py-1 flex flex-col items-center">
                    <span class="text-[7px] text-slate-400 font-black uppercase">cr</span>
                    <span class="text-xs leading-none">{{ item.subject?.credits || 0 }}</span>
                </div>
            </div>

            <!-- Acciones: Borrador, Hipervínculo y Flechas -->
            <div v-if="!isLinking" class="flex justify-center items-center gap-2 p-1.5 bg-slate-50">
                <!-- Borrador (Eliminar) -->
                <button
                    @click.stop="$emit('remove', item.id)"
                    class="p-1.5 border border-slate-300 rounded bg-white text-slate-500 hover:text-red-600 hover:border-red-200 transition-colors"
                    title="Quitar de la currícula"
                >
                    <TrashIcon class="w-4 h-4" />
                </button>

                <div class="w-[1px] h-4 bg-slate-200"></div>

                <!-- Hipervínculo (Requisitos) -->
                <button
                    @click.stop="$emit('link', item)"
                    class="p-1.5 border border-slate-300 rounded bg-white text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-colors"
                    title="Gestionar requisitos"
                >
                    <LinkIcon class="w-4 h-4" />
                </button>

                <!-- Flechas (Mover) -->
                <button
                    @click.stop="$emit('move', item)"
                    class="p-1.5 border border-slate-300 rounded bg-white text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-colors"
                    title="Actualizar periodo/nivel"
                >
                    <ArrowsUpDownIcon class="w-4 h-4" />
                </button>
            </div>

            <!-- Feedback visual en modo selección de requisitos -->
            <div v-if="isPotentialReq" class="bg-green-500 text-white text-[9px] py-1 text-center font-bold animate-pulse uppercase">
                Click para asignar
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import {
    TrashIcon,
    LinkIcon,
    ArrowsUpDownIcon
} from '@/shared/icons'

defineProps<{
    item: any,
    isLinking?: boolean,
    isActiveLink?: boolean,
    isPotentialReq?: boolean
}>()

defineEmits(['remove', 'link', 'move', 'select-as-req'])
</script>

<style scoped>
.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
</style>
