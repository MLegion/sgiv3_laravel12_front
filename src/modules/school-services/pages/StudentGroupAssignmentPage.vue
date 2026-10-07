<template>
    <div class="space-y-4">
        <div>
            <h1 class="text-xl font-semibold text-slate-800 uppercase">Asignación de Nuevo Ingreso</h1>
            <p class="text-sm text-slate-500 mt-1">
                Asigna los estudiantes de nuevo ingreso a los grupos de su primer semestre. Para reinscripción usa la pantalla correspondiente.
            </p>
        </div>

        <!-- Filtros de cohorte (nuevo ingreso = siempre semestre 1) -->
        <div class="bg-white rounded-xl border border-slate-200 p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
                <label class="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Periodo</label>
                <select v-model="filters.collegeAcademicPeriodId" class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                    <option :value="null">-- Selecciona --</option>
                    <option v-for="p in periods" :key="p.id" :value="p.id">
                        {{ p.academicPeriod?.name || p.academic_period?.name || `Periodo ${p.id}` }}
                    </option>
                </select>
            </div>
            <div>
                <label class="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Plan de Estudio</label>
                <select v-model="filters.studyPlanId" class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                    <option :value="null">-- Selecciona --</option>
                    <option v-for="sp in studyPlans" :key="sp.id" :value="sp.id">{{ sp.name }}</option>
                </select>
            </div>
            <div>
                <label class="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Modalidad</label>
                <select v-model="filters.modalityId" class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                    <option :value="null">-- Selecciona --</option>
                    <option v-for="m in modalities" :key="m.id" :value="m.id">
                        {{ (m.campus?.name ?? '') + ' — ' + (m.modalityType?.name ?? '') }}
                    </option>
                </select>
            </div>
            <div class="flex items-end">
                <button
                    :disabled="!canLoad || loading"
                    class="w-full px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
                    @click="loadCohort"
                >{{ loading ? 'Cargando...' : 'Cargar Cohorte' }}</button>
            </div>
        </div>

        <div v-if="banner.message" class="text-sm px-4 py-3 rounded-lg border"
            :class="banner.ok ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'">
            {{ banner.message }}
        </div>

        <!-- Resultado de la última asignación masiva.
             Compacto y COLAPSADO por defecto. El sobrecupo (grupo lleno) es un
             resultado esperado → tono ámbar, no error rojo. El detalle agrupado
             por motivo vive detrás de "Ver detalle". -->
        <div v-if="lastFailures.length" class="text-sm rounded-lg border"
            :class="failuresAreCapacityOnly ? 'border-amber-200 bg-amber-50' : 'border-red-200 bg-red-50'">
            <div class="flex items-center gap-3 px-4 py-3">
                <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5 flex-shrink-0"
                    :class="failuresAreCapacityOnly ? 'text-amber-500' : 'text-red-500'">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clip-rule="evenodd" />
                </svg>
                <div class="flex-1 min-w-0">
                    <p class="font-semibold" :class="failuresAreCapacityOnly ? 'text-amber-800' : 'text-red-700'">
                        {{ lastFailures.length }} estudiante{{ lastFailures.length === 1 ? '' : 's' }}
                        {{ failuresAreCapacityOnly ? 'no cupieron en el grupo' : 'no se pudieron asignar' }}
                        <span v-if="lastAssigned > 0" class="font-normal"
                            :class="failuresAreCapacityOnly ? 'text-amber-600' : 'text-red-500'">
                            · {{ lastAssigned }} sí se asignaron
                        </span>
                    </p>
                    <p class="text-xs mt-0.5" :class="failuresAreCapacityOnly ? 'text-amber-600' : 'text-red-500'">
                        <template v-if="failuresAreCapacityOnly">
                            El grupo llegó a su cupo. Selecciónalos y asígnalos a otro grupo, o abre más grupos.
                        </template>
                        <template v-else>{{ topFailureReason }}</template>
                    </p>
                </div>
                <button v-if="failuresAreCapacityOnly" type="button"
                    class="text-xs font-bold px-3 py-1.5 rounded-md bg-amber-100 text-amber-700 hover:bg-amber-200 whitespace-nowrap"
                    @click="selectFailedStudents">Seleccionar los {{ lastFailures.length }}</button>
                <button type="button" class="text-xs font-semibold underline whitespace-nowrap"
                    :class="failuresAreCapacityOnly ? 'text-amber-700 hover:text-amber-900' : 'text-red-600 hover:text-red-800'"
                    @click="showFailureDetail = !showFailureDetail">
                    {{ showFailureDetail ? 'Ocultar detalle' : 'Ver detalle' }}
                </button>
                <button type="button" aria-label="Cerrar" class="text-lg leading-none px-1"
                    :class="failuresAreCapacityOnly ? 'text-amber-400 hover:text-amber-700' : 'text-red-400 hover:text-red-700'"
                    @click="lastFailures = []">×</button>
            </div>
            <div v-show="showFailureDetail" class="px-4 pb-3 space-y-2 max-h-52 overflow-y-auto border-t"
                :class="failuresAreCapacityOnly ? 'border-amber-200 pt-2' : 'border-red-200 pt-2'">
                <div v-for="(grp, gi) in failureGroups" :key="gi"
                    class="rounded-md bg-white/60 border px-3 py-2"
                    :class="failuresAreCapacityOnly ? 'border-amber-100' : 'border-red-100'">
                    <div class="flex items-start gap-2">
                        <span class="inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 text-[11px] font-black rounded-full"
                            :class="failuresAreCapacityOnly ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'">
                            {{ grp.count }}
                        </span>
                        <p class="text-xs font-semibold flex-1" :class="failuresAreCapacityOnly ? 'text-amber-800' : 'text-red-700'">{{ grp.reason }}</p>
                    </div>
                    <p class="text-[11px] mt-1 pl-8 leading-relaxed" :class="failuresAreCapacityOnly ? 'text-amber-600' : 'text-red-600'">
                        {{ failureNames(grp) }}<span v-if="!isFailureExpanded(grp) && grp.count > FAILURE_PREVIEW_COUNT">…</span>
                        <button v-if="grp.count > FAILURE_PREVIEW_COUNT" type="button"
                            class="font-semibold underline ml-1 whitespace-nowrap"
                            :class="failuresAreCapacityOnly ? 'hover:text-amber-900' : 'hover:text-red-800'"
                            @click="toggleFailureGroup(grp.reason)">
                            {{ isFailureExpanded(grp) ? 'ver menos' : `+${grp.count - FAILURE_PREVIEW_COUNT} más` }}
                        </button>
                    </p>
                </div>
            </div>
        </div>

        <!-- Buscador global: filtra pendientes + estudiantes dentro de cada grupo -->
        <div v-if="cohortLoaded" class="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-3">
            <div class="relative flex-1">
                <svg aria-hidden="true" class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                <input
                    v-model="searchTerm"
                    type="search"
                    placeholder="Buscar por número de control o nombre…"
                    class="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-indigo-400"
                />
            </div>
            <button
                type="button"
                class="text-xs font-semibold text-slate-600 hover:text-slate-900 px-2 py-1 rounded"
                @click="expandAllGroups"
            >Expandir todos</button>
            <button
                type="button"
                class="text-xs font-semibold text-slate-600 hover:text-slate-900 px-2 py-1 rounded"
                @click="collapseAllGroups"
            >Colapsar todos</button>
        </div>

        <!-- Déficit de cupo: faltan lugares para los de nuevo ingreso → abrir más grupos -->
        <button
            v-if="hasSeatShortage"
            type="button"
            @click="goToPackage"
            class="w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition group"
        >
            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5 flex-shrink-0 text-red-500">
                <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd" />
            </svg>
            <div class="min-w-0 flex-1">
                <p class="text-sm font-bold">
                    Faltan {{ seatShortage }} lugar{{ seatShortage === 1 ? '' : 'es' }}: se requiere abrir más grupos
                </p>
                <p class="text-xs text-red-600 mt-0.5">
                    Hay {{ unassignedToPlace }} estudiante{{ unassignedToPlace === 1 ? '' : 's' }} de nuevo ingreso sin grupo y solo
                    {{ openSeats }} lugar{{ openSeats === 1 ? '' : 'es' }} disponible{{ openSeats === 1 ? '' : 's' }} en los grupos abiertos.
                    Haz clic para ir a Paquete de materias y aumentar el número de grupos.
                </p>
            </div>
            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5 flex-shrink-0 text-red-400 group-hover:translate-x-0.5 transition-transform">
                <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z" clip-rule="evenodd" />
            </svg>
        </button>

        <!-- Contenido principal cuando hay cohorte cargada -->
        <div v-if="cohortLoaded" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <!-- Estudiantes pendientes -->
            <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div class="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div>
                        <h2 class="text-sm font-black text-slate-600 uppercase tracking-widest">Estudiantes Pendientes</h2>
                        <p class="text-xs text-slate-500 mt-0.5">
                            <span v-if="searchTerm">{{ filteredPending.length }} de {{ students.length }}</span>
                            <span v-else>{{ students.length }} total</span>
                            · {{ selectedIds.length }} seleccionados
                        </p>
                    </div>
                    <label class="inline-flex items-center gap-2 text-xs text-slate-600">
                        <input type="checkbox" v-model="onlyUnassigned" @change="loadCohort" class="rounded border-slate-300" />
                        Solo sin asignar
                    </label>
                </div>
                <div ref="listRef" tabindex="0" role="listbox" aria-label="Estudiantes pendientes"
                    @keydown="onListKeydown"
                    class="max-h-[560px] overflow-y-auto outline-none focus:ring-2 focus:ring-indigo-300 rounded">
                    <div class="overflow-x-auto w-full"><table class="w-full text-sm">
                        <thead class="bg-slate-50 text-slate-500 sticky top-0">
                            <tr>
                                <th scope="col" class="px-3 py-2 text-left w-8">
                                    <input type="checkbox" :checked="allSelected" @change="toggleAllSelection" class="rounded border-slate-300" />
                                </th>
                                <th scope="col" class="px-3 py-2 text-left text-[10px] font-black uppercase tracking-widest">No. CONTROL</th>
                                <th scope="col" class="px-3 py-2 text-left text-[10px] font-black uppercase tracking-widest">NOMBRE</th>
                                <th scope="col" class="px-3 py-2 text-center text-[10px] font-black uppercase tracking-widest">GRUPOS</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(s, i) in filteredPending" :key="s.id"
                                :data-idx="i"
                                role="option"
                                :aria-selected="selectedIds.includes(s.id)"
                                @click="onRowClick(i, s.id)"
                                class="border-t border-slate-100 hover:bg-slate-50/60 cursor-pointer select-none"
                                :class="{
                                    'bg-indigo-50/40': selectedIds.includes(s.id),
                                    'ring-2 ring-inset ring-indigo-400': activeIndex === i,
                                }">
                                <td class="px-3 py-2">
                                    <input type="checkbox" :value="s.id" v-model="selectedIds" @click.stop class="rounded border-slate-300" />
                                </td>
                                <td class="px-3 py-2 font-mono text-xs">{{ s.num_control || '—' }}</td>
                                <td class="px-3 py-2">{{ s.full_name }}</td>
                                <td class="px-3 py-2 text-center">
                                    <span class="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase rounded-full"
                                        :class="s.assigned_groups_count > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'">
                                        {{ s.assigned_groups_count }}
                                    </span>
                                </td>
                            </tr>
                            <tr v-if="!filteredPending.length">
                                <td colspan="4" class="px-3 py-8 text-center text-sm text-slate-400 italic">
                                    <template v-if="searchTerm">Sin coincidencias para "{{ searchTerm }}".</template>
                                    <template v-else>Sin estudiantes pendientes para esta cohorte.</template>
                                </td>
                            </tr>
                        </tbody>
                    </table></div>
                </div>
            </div>

            <!-- Grupos disponibles -->
            <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div class="px-4 py-3 bg-slate-50 border-b border-slate-200">
                    <h2 class="text-sm font-black text-slate-600 uppercase tracking-widest">Grupos de la Cohorte</h2>
                    <p class="text-xs text-slate-500 mt-0.5">Primer semestre · {{ groups.length }} grupos</p>
                </div>

                <!-- Aviso cuando la carga no está finalizada -->
                <div v-if="!loadState.finalized" class="m-3 p-3 rounded-lg border border-amber-200 bg-amber-100 text-sm text-amber-900">
                    <p class="font-semibold">
                        <template v-if="!loadState.exists">No hay carga académica configurada</template>
                        <template v-else>La carga académica aún no está finalizada</template>
                    </p>
                    <p class="text-xs mt-1 text-amber-700">
                        <template v-if="!loadState.exists">
                            Aún no se ha creado una configuración de carga académica para esta combinación de periodo y modalidad.
                        </template>
                        <template v-else>
                            Los horarios deben estar publicados (última fase de carga académica) antes de asignar estudiantes a los grupos.
                        </template>
                    </p>
                </div>

                <div v-else class="max-h-[560px] overflow-y-auto p-3 space-y-3">
                    <!-- Atajo: asignar la selección al grupo recomendado (balanceo de carga) -->
                    <div v-if="suggestedGroup && selectedIds.length"
                        class="flex items-center justify-between gap-3 p-3 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-800">
                        <div class="min-w-0 text-xs">
                            <p class="font-semibold">
                                Sugerencia: asignar a <span class="font-bold">{{ suggestedGroup.name }}</span>
                            </p>
                            <p class="text-indigo-600 mt-0.5">
                                {{ suggestedGroup.available }} lugares libres ·
                                <template v-if="suggestedGroup.available >= selectedIds.length">caben los {{ selectedIds.length }} seleccionados</template>
                                <template v-else>es el grupo con más cupo; caben {{ suggestedGroup.available }} de {{ selectedIds.length }}</template>
                            </p>
                        </div>
                        <button
                            type="button"
                            :disabled="assigning === suggestedGroup.id"
                            class="flex-shrink-0 px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                            @click="assignSelection(suggestedGroup)"
                        >
                            {{ assigning === suggestedGroup.id ? 'Asignando...' : 'Asignar aquí' }}
                        </button>
                    </div>

                    <div v-for="g in groups" :key="g.id"
                        class="border rounded-xl p-3 hover:shadow-sm transition"
                        :class="[
                            g.is_full ? 'opacity-60' : '',
                            isSuggested(g) ? 'border-indigo-400 ring-2 ring-indigo-100 bg-indigo-50/30' : 'border-slate-200',
                        ]"
                    >
                        <div class="flex items-center justify-between gap-2">
                            <div class="min-w-0">
                                <div class="flex items-center gap-2 flex-wrap">
                                    <h3 class="font-bold text-slate-800 text-base">{{ g.name }}</h3>
                                    <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">T: {{ g.shift }}</span>
                                    <span v-if="isSuggested(g)"
                                        class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-600 text-white inline-flex items-center gap-1">
                                        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3">
                                            <path fill-rule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z" clip-rule="evenodd" />
                                        </svg>
                                        Recomendado
                                    </span>
                                </div>
                                <p class="text-[11px] text-slate-500 mt-0.5">
                                    {{ g.subjects.length }} materias
                                </p>
                            </div>
                            <div class="text-right flex-shrink-0">
                                <div class="text-sm font-bold" :class="occColor(g)">
                                    {{ g.occupancy }} / {{ g.capacity }}
                                </div>
                                <p class="text-[10px] text-slate-400">{{ g.available }} disponibles</p>
                            </div>
                        </div>
                        <!-- barra de progreso -->
                        <div class="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div class="h-full transition-all"
                                :class="barColor(g)"
                                :style="{ width: percent(g) + '%' }"></div>
                        </div>

                        <div class="mt-3 flex items-center justify-between gap-2 flex-wrap">
                            <button
                                type="button"
                                :aria-expanded="expandedGroupIds.has(g.id)"
                                class="text-[11px] font-semibold text-slate-500 hover:text-slate-800 inline-flex items-center gap-1"
                                @click="toggleGroupDetails(g.id)"
                            >
                                <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                                    class="w-3.5 h-3.5 transition-transform"
                                    :class="{ 'rotate-180': expandedGroupIds.has(g.id) }">
                                    <path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
                                </svg>
                                {{ expandedGroupIds.has(g.id) ? 'Ocultar estudiantes' : 'Ver estudiantes asignados' }}
                            </button>
                            <div class="flex items-center gap-2">
                                <button aria-label="Inscribir a TODOS los alumnos del grupo a las materias del semestre"
                                    type="button"
                                    class="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                                    title="Inscribir a TODOS los alumnos del grupo a las materias del semestre"
                                    @click="openEnrollModal(g.id)"
                                >
                                    Inscribir a materias
                                </button>
                                <button
                                    :disabled="!selectedIds.length || g.is_full || assigning === g.id"
                                    class="px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                                    @click="assignSelection(g)"
                                >
                                    {{ assigning === g.id ? 'Asignando...' : `Asignar ${selectedIds.length || 0} aquí` }}
                                </button>
                            </div>
                        </div>

                        <!-- Lista expandible de estudiantes en este grupo -->
                        <div v-if="expandedGroupIds.has(g.id)" class="mt-3 pt-3 border-t border-slate-100">
                            <div v-if="loadingStudentsOfGroup && !groupStudents[g.id]" class="text-xs text-slate-400 italic py-2">Cargando...</div>
                            <div v-else-if="!groupStudents[g.id]?.length" class="text-xs text-slate-400 italic py-2">
                                Aún no hay estudiantes asignados a este grupo.
                            </div>
                            <div v-else-if="!filteredGroupStudents(g.id).length" class="text-xs text-slate-400 italic py-2">
                                Sin coincidencias para "{{ searchTerm }}" en este grupo.
                            </div>
                            <ul v-else class="space-y-1">
                                <li
                                    v-for="s in filteredGroupStudents(g.id)"
                                    :key="s.id"
                                    class="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50"
                                >
                                    <div class="min-w-0 flex-1">
                                        <div class="flex items-center gap-2">
                                            <span class="text-xs font-mono text-slate-400">{{ s.num_control || '—' }}</span>
                                            <span class="text-sm text-slate-700 truncate">{{ s.full_name }}</span>
                                        </div>
                                        <span
                                            class="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded mt-0.5 inline-block"
                                            :class="s.source === 'INSCRIPCION' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-700'"
                                        >{{ s.source }}</span>
                                    </div>
                                    <button aria-label="Quitar estudiante del grupo"
                                        :disabled="removingStudentId === s.id"
                                        class="p-1 rounded-md text-red-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 transition"
                                        title="Quitar estudiante del grupo"
                                        @click="removeFromGroup(g, s)"
                                    >
                                        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                                            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                                        </svg>
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div v-if="!groups.length" class="text-center text-sm text-slate-400 italic py-8">
                        No hay grupos creados para esta cohorte.
                    </div>
                </div>
            </div>
        </div>

        <EnrollToCoursesModal
            v-model="enrollModalOpen"
            :group-id="enrollModalGroupId"
            @enrolled="onEnrolled"
        />
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConfirm } from '@/app/composables/useConfirm'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import EnrollToCoursesModal from '@/modules/school-services/components/EnrollToCoursesModal.vue'

interface Student {
    id: number
    num_control: string | null
    full_name: string
    email: string | null
    assigned_groups_count: number
}

interface CohortGroup {
    id: number
    name: string
    capacity: number
    occupancy: number
    available: number
    shift: string
    is_full: boolean
    subjects: { id: number, name: string, short_name: string | null }[]
}

const periods = ref<any[]>([])
const studyPlans = ref<any[]>([])
const modalities = ref<any[]>([])

const route = useRoute()
const router = useRouter()

const filters = reactive({
    collegeAcademicPeriodId: null as number | null,
    studyPlanId:             null as number | null,
    modalityId:              null as number | null,
    semester:                1,
})

const onlyUnassigned = ref(true)
const students = ref<Student[]>([])
const groups = ref<CohortGroup[]>([])
const selectedIds = ref<number[]>([])
const cohortLoaded = ref(false)
const loading = ref(false)
const assigning = ref<number | null>(null)
const banner = reactive({ ok: false, message: '' })
const lastFailures = ref<Array<{ id: number; name: string; reason: string }>>([])

/* ── Fallidos agrupados por motivo ──────────────────────────────────────
 * Cuando se excede mucho el cupo, decenas de estudiantes fallan con el MISMO
 * motivo. En vez de volcar una línea por estudiante (bloque rojo gigante) se
 * agrupan por motivo: un contador + nombres en vista previa, expandibles. */
type FailureGroup = { reason: string; names: string[]; count: number }
const FAILURE_PREVIEW_COUNT = 6
const expandedFailureReasons = ref<string[]>([])
const showFailureDetail = ref(false)          // detalle colapsado por defecto
const lastAssigned = ref(0)                    // cuántos SÍ se asignaron
const lastGroupName = ref('')

/* ¿Todos los fallos son por cupo (grupo lleno)? Entonces es sobrecupo
 * esperado → tono ámbar/informativo, no error rojo. */
const failuresAreCapacityOnly = computed(() =>
    lastFailures.value.length > 0
    && lastFailures.value.every(f => /lleno|capacidad|cupo/i.test(f.reason)),
)
const topFailureReason = computed(() => failureGroups.value[0]?.reason ?? '')

const failureGroups = computed<FailureGroup[]>(() => {
    const map = new Map<string, string[]>()
    for (const f of lastFailures.value) {
        const arr = map.get(f.reason) ?? []
        arr.push(f.name)
        map.set(f.reason, arr)
    }
    return Array.from(map, ([reason, names]) => ({ reason, names, count: names.length }))
        .sort((a, b) => b.count - a.count)
})

function isFailureExpanded(grp: FailureGroup): boolean {
    return expandedFailureReasons.value.includes(grp.reason)
}
function failureNames(grp: FailureGroup): string {
    const shown = isFailureExpanded(grp) ? grp.names : grp.names.slice(0, FAILURE_PREVIEW_COUNT)
    return shown.join(', ')
}
function toggleFailureGroup(reason: string) {
    const i = expandedFailureReasons.value.indexOf(reason)
    if (i >= 0) expandedFailureReasons.value.splice(i, 1)
    else expandedFailureReasons.value.push(reason)
}
/* Reselecciona en la lista de pendientes a los que no cupieron, para
 * reasignarlos a otro grupo sin buscarlos a mano. */
function selectFailedStudents() {
    const pendingIds = new Set(students.value.map(s => s.id))
    const ids = lastFailures.value.map(f => f.id).filter(id => pendingIds.has(id))
    selectedIds.value = ids
    searchTerm.value = ''
    if (ids.length) {
        banner.ok = true
        banner.message = `${ids.length} estudiante(s) seleccionados. Elige otro grupo para asignarlos.`
    }
}

const expandedGroupIds = ref<Set<number>>(new Set())
const groupStudents = reactive<Record<number, Array<{ id: number, num_control: string | null, full_name: string, source: string }>>>({})
const loadingStudentsOfGroup = ref(false)
const removingStudentId = ref<number | null>(null)
const searchTerm = ref('')

// Modal "Inscribir a materias del semestre"
const enrollModalOpen    = ref(false)
const enrollModalGroupId = ref<number | null>(null)

function openEnrollModal(groupId: number): void {
    enrollModalGroupId.value = groupId
    enrollModalOpen.value    = true
}

function onEnrolled(_result: { groupId: number; enrolledCount: number; studentsCount: number; subjectsCount: number }): void {
    // Recargar cohorte para refrescar el occupancy de cada grupo y el ocupado de las materias.
    loadCohort()
}

const loadState = reactive({ exists: false, finalized: false })

const canLoad = computed(() =>
    !!filters.collegeAcademicPeriodId && !!filters.studyPlanId && !!filters.modalityId
)

function matchesSearch(s: { num_control: string | null, full_name: string }): boolean {
    const q = searchTerm.value.trim().toLowerCase()
    if (!q) return true
    return (s.num_control ?? '').toLowerCase().includes(q)
        || (s.full_name  ?? '').toLowerCase().includes(q)
}

const filteredPending = computed(() => students.value.filter(matchesSearch))

const allSelected = computed(() =>
    filteredPending.value.length > 0
    && filteredPending.value.every(s => selectedIds.value.includes(s.id))
)

/* ── Déficit de cupo: ¿caben todos los de nuevo ingreso en los grupos abiertos? ──
 * Lugares libres totales = suma del cupo disponible de cada grupo abierto.
 * Estudiantes por ubicar = pendientes que aún NO tienen grupo (ignora los ya
 * asignados cuando "Solo sin asignar" está apagado). Si faltan lugares, se avisa
 * que hay que abrir más grupos y se ofrece ir a Paquete de materias. */
const openSeats = computed(() =>
    groups.value.reduce((sum, g) => sum + Math.max(0, g.available ?? 0), 0)
)
const unassignedToPlace = computed(() =>
    students.value.filter(s => !s.assigned_groups_count).length
)
const seatShortage = computed(() =>
    Math.max(0, unassignedToPlace.value - openSeats.value)
)
const hasSeatShortage = computed(() =>
    cohortLoaded.value && unassignedToPlace.value > 0 && seatShortage.value > 0
)

/** Va a "Paquete de materias" con el mismo contexto (periodo/plan/campus/modalidad)
 *  para abrir más grupos. El paquete lee estos filtros del query string. */
function goToPackage(): void {
    const m: any = modalities.value.find((x: any) => x.id === filters.modalityId)
    const campusId = m?.campus?.id ?? m?.campus_id ?? null
    const mtypeId  = m?.modalityType?.id ?? m?.modality_type_id ?? null
    router.push({
        name: 'sca.subject-package',
        query: {
            ...(filters.collegeAcademicPeriodId ? { period: filters.collegeAcademicPeriodId } : {}),
            ...(filters.studyPlanId ? { plan: filters.studyPlanId } : {}),
            ...(campusId ? { campus: campusId } : {}),
            ...(mtypeId ? { mtype: mtypeId } : {}),
        },
    })
}

/* ── Navegación por teclado de la tabla de pendientes ──────────────
 * La lista es un listbox: ↑/↓ mueven la fila ACTIVA (foco), Enter/Espacio
 * (de)seleccionan la fila activa, y un clic en la fila también la selecciona. */
const listRef = ref<HTMLElement | null>(null)
const activeIndex = ref(-1)

// Si la lista cambia (búsqueda/recarga), mantener el índice activo en rango.
watch(() => filteredPending.value.length, (len) => {
    if (len === 0) activeIndex.value = -1
    else if (activeIndex.value > len - 1) activeIndex.value = len - 1
})

function toggleOne(id: number) {
    const i = selectedIds.value.indexOf(id)
    if (i === -1) selectedIds.value = [...selectedIds.value, id]
    else selectedIds.value = selectedIds.value.filter(x => x !== id)
}

function onRowClick(i: number, id: number) {
    activeIndex.value = i
    toggleOne(id)
}

function scrollActiveIntoView() {
    const el = listRef.value?.querySelector(`[data-idx="${activeIndex.value}"]`) as HTMLElement | null
    el?.scrollIntoView({ block: 'nearest' })
}

function onListKeydown(e: KeyboardEvent) {
    const len = filteredPending.value.length
    if (!len) return
    switch (e.key) {
        case 'ArrowDown':
            e.preventDefault()
            activeIndex.value = activeIndex.value < 0 ? 0 : Math.min(activeIndex.value + 1, len - 1)
            scrollActiveIntoView()
            break
        case 'ArrowUp':
            e.preventDefault()
            activeIndex.value = activeIndex.value < 0 ? 0 : Math.max(activeIndex.value - 1, 0)
            scrollActiveIntoView()
            break
        case 'Home':
            e.preventDefault(); activeIndex.value = 0; scrollActiveIntoView(); break
        case 'End':
            e.preventDefault(); activeIndex.value = len - 1; scrollActiveIntoView(); break
        case 'Enter':
        case ' ':
        case 'Spacebar':
            e.preventDefault()
            if (activeIndex.value >= 0) {
                const s = filteredPending.value[activeIndex.value]
                if (s) toggleOne(s.id)
            }
            break
    }
}

/**
 * Grupo recomendado para la selección actual: balanceo de carga.
 * Entre los grupos no llenos, prioriza los que pueden alojar a TODA la
 * selección; de ésos, el menos ocupado (más cupo libre) para mantener los
 * grupos parejos. Si ninguno cabe completo, sugiere el de mayor cupo libre.
 * El desempate por `id` mantiene la sugerencia estable entre recargas.
 */
const suggestedGroup = computed<CohortGroup | null>(() => {
    const n = selectedIds.value.length
    if (!n) return null
    const open = groups.value.filter(g => !g.is_full && g.available > 0)
    if (!open.length) return null
    const fits = open.filter(g => g.available >= n)
    const pool = fits.length ? fits : open
    return [...pool].sort((a, b) => b.available - a.available || a.id - b.id)[0] ?? null
})

function isSuggested(g: CohortGroup): boolean {
    return suggestedGroup.value?.id === g.id
}

onMounted(async () => {
    const [pRes, spRes, mRes] = await Promise.all([
        api.get(API.SCHOOL_SERVICES_API.collegeAcademicPeriods.list, { params: { per_page: 100 } }).catch(() => ({ data: { items: [] } })),
        api.get(API.SUPERADMIN_API.studyPlans.list, { params: { per_page: 200 } }).catch(() => ({ data: { items: [] } })),
        api.get(API.SCHOOL_SERVICES_API.modalities.list, { params: { per_page: 100 } }).catch(() => ({ data: { items: [] } })),
    ])

    // Excluir periodos archivados, planes inactivos y modalidades/campus sin status.
    const rawPeriods    = pRes.data.items ?? pRes.data.data ?? []
    const rawStudyPlans = spRes.data.items ?? spRes.data.data ?? []
    const rawModalities = mRes.data.items ?? mRes.data.data ?? []

    periods.value    = rawPeriods.filter((p: any) => p.status !== 'archived')
    studyPlans.value = rawStudyPlans.filter((sp: any) => (sp.isActive ?? sp.is_active) !== false)
    modalities.value = rawModalities.filter((m: any) => !!m.status && !!m.campus?.status)

    // Preselección al venir desde "Inscribir → Asignar a grupos": mapea el
    // academic_period_id del cohorte al periodo del plantel.
    const qPeriod = Number(route.query.academic_period_id)
    if (qPeriod) {
        const match = periods.value.find((p: any) =>
            (p.academicPeriod?.id ?? p.academic_period?.id ?? p.academic_period_id) === qPeriod)
        if (match) filters.collegeAcademicPeriodId = match.id
    }
})

async function loadCohort() {
    if (!canLoad.value) return
    loading.value = true
    banner.message = ''
    try {
        const period = periods.value.find(p => p.id === filters.collegeAcademicPeriodId)
        const entryPeriodId = period?.academicPeriod?.id || period?.academic_period?.id || period?.academic_period_id
        if (!entryPeriodId) throw new Error('No se pudo resolver el periodo académico base.')

        const [pending, cohort] = await Promise.all([
            api.get(API.SCHOOL_SERVICES_API.studentGroups.pendingStudents, {
                params: {
                    entry_period_id:  entryPeriodId,
                    study_plan_id:    filters.studyPlanId,
                    modality_id:      filters.modalityId,
                    only_unassigned:  onlyUnassigned.value ? 1 : 0,
                },
            }),
            api.get(API.SCHOOL_SERVICES_API.studentGroups.cohortGroups, {
                params: {
                    college_academic_period_id: filters.collegeAcademicPeriodId,
                    study_plan_id:              filters.studyPlanId,
                    modality_id:                filters.modalityId,
                    semester:                   filters.semester,
                },
            }),
        ])

        students.value = pending.data.items ?? []
        groups.value   = cohort.data.items ?? []
        loadState.exists    = !!cohort.data.load_exists
        loadState.finalized = !!cohort.data.load_finalized
        selectedIds.value = []
        cohortLoaded.value = true
    } catch (e: any) {
        banner.ok = false
        banner.message = e.response?.data?.message || e.message || 'No se pudo cargar la cohorte.'
        cohortLoaded.value = false
    } finally {
        loading.value = false
    }
}

function toggleAllSelection() {
    // Selecciona/deselecciona sólo los visibles (filteredPending), no los ocultos por búsqueda.
    const visibleIds = filteredPending.value.map(s => s.id)
    if (allSelected.value) {
        selectedIds.value = selectedIds.value.filter(id => !visibleIds.includes(id))
    } else {
        const set = new Set(selectedIds.value)
        visibleIds.forEach(id => set.add(id))
        selectedIds.value = [...set]
    }
}

async function assignSelection(g: CohortGroup) {
    if (!selectedIds.value.length) return

    const count = selectedIds.value.length
    const ok = await useConfirm().confirm({
        title: 'Asignar a grupo',
        message: `¿Asignar ${count} estudiante(s) al grupo ${g.name}?`,
        confirmText: 'Asignar',
    })
    if (!ok) return

    assigning.value = g.id
    banner.message = ''
    lastFailures.value = []
    expandedFailureReasons.value = []
    showFailureDetail.value = false
    // Lookup id→nombre ANTES de recargar el cohorte (para nombrar los fallidos).
    const nameById = new Map(students.value.map(s => [s.id, s.full_name]))

    try {
        const { data } = await api.post(API.SCHOOL_SERVICES_API.studentGroups.bulkAssign, {
            student_ids: selectedIds.value,
            group_id:    g.id,
            source:      'INSCRIPCION',
        })
        // El banner celebra lo que SÍ se asignó; el sobrecupo (grupo lleno) no es
        // un error rojo sino un resultado esperado y se muestra aparte, en tono
        // ámbar y colapsado, con la acción de seguir en otro grupo.
        lastAssigned.value  = data.assigned ?? 0
        lastGroupName.value = g.name
        banner.ok = (data.assigned ?? 0) > 0
        banner.message = data.assigned > 0
            ? `${data.assigned} estudiante(s) asignado(s) al grupo ${g.name}.`
            : `No se asignó ningún estudiante al grupo ${g.name}.`
        lastFailures.value = (data.failed_items ?? []).map((f: any) => ({
            id:     f.student_id,
            name:   nameById.get(f.student_id) ?? `Estudiante #${f.student_id}`,
            reason: f.reason ?? 'No se pudo asignar.',
        }))
        await loadCohort()
    } catch (e: any) {
        banner.ok = false
        banner.message = e.response?.data?.message || 'No se pudo asignar.'
    } finally {
        assigning.value = null
    }
}

async function toggleGroupDetails(groupId: number) {
    const next = new Set(expandedGroupIds.value)
    if (next.has(groupId)) {
        next.delete(groupId)
        expandedGroupIds.value = next
        return
    }
    next.add(groupId)
    expandedGroupIds.value = next
    if (!groupStudents[groupId]) await loadStudentsOfGroup(groupId)
}

async function expandAllGroups() {
    const ids = groups.value.map(g => g.id)
    expandedGroupIds.value = new Set(ids)
    const toLoad = ids.filter(id => !groupStudents[id])
    await Promise.all(toLoad.map(id => loadStudentsOfGroup(id)))
}

function collapseAllGroups() {
    expandedGroupIds.value = new Set()
}

function filteredGroupStudents(groupId: number) {
    return (groupStudents[groupId] ?? []).filter(matchesSearch)
}

async function loadStudentsOfGroup(groupId: number) {
    loadingStudentsOfGroup.value = true
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.studentGroups.studentsInGroup(groupId))
        groupStudents[groupId] = data.items ?? []
    } catch {
        groupStudents[groupId] = []
    } finally {
        loadingStudentsOfGroup.value = false
    }
}

async function removeFromGroup(g: CohortGroup, s: { id: number, full_name: string }) {
    if (!await useConfirm().confirm({ title: 'Quitar del grupo', message: `¿Quitar a "${s.full_name}" del grupo ${g.name}?`, variant: 'danger', confirmText: 'Quitar' })) return
    removingStudentId.value = s.id
    banner.message = ''
    try {
        await api.delete(API.SCHOOL_SERVICES_API.studentGroups.remove, {
            data: { student_id: s.id, group_id: g.id },
        })
        banner.ok = true
        banner.message = `"${s.full_name}" fue removido del grupo ${g.name}.`
        await Promise.all([loadStudentsOfGroup(g.id), loadCohort()])
    } catch (e: any) {
        banner.ok = false
        banner.message = e.response?.data?.message || 'No se pudo quitar al estudiante.'
    } finally {
        removingStudentId.value = null
    }
}

function percent(g: CohortGroup): number {
    if (!g.capacity) return 0
    return Math.min(100, Math.round((g.occupancy / g.capacity) * 100))
}

function occColor(g: CohortGroup): string {
    const p = percent(g)
    if (g.is_full) return 'text-red-600'
    if (p >= 85)   return 'text-amber-600'
    return 'text-emerald-600'
}

function barColor(g: CohortGroup): string {
    const p = percent(g)
    if (g.is_full) return 'bg-red-500'
    if (p >= 85)   return 'bg-amber-500'
    return 'bg-emerald-500'
}
</script>
