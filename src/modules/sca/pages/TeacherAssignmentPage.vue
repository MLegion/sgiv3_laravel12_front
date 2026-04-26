<template>
    <div class="space-y-4">

        <!-- Periodo -->
        <div class="flex items-center gap-3">
            <PeriodSelector v-if="!periodLocked" ref="periodSelectorRef" v-model="selectedPeriodId" @update:model-value="onPeriodChange" label="" placeholder="SELECCIONE UN PERIODO" class="flex-1" />
            <div v-else class="flex-1 border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold uppercase bg-slate-50 text-slate-700">{{ lockedPeriodName }}</div>
            <button class="w-12 h-[46px] border-2 rounded-xl flex items-center justify-center transition"
                :class="periodLocked ? 'border-slate-300 bg-slate-50 text-slate-500 hover:bg-slate-100' : 'border-blue-500 bg-blue-50 text-blue-600 hover:bg-blue-100'"
                :disabled="!selectedPeriodId && !periodLocked" @click="toggleLock">
                <svg v-if="periodLocked" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/></svg>
                <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z"/></svg>
            </button>
        </div>

        <template v-if="periodLocked">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
                <label class="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">CAMPUS</label>
                <select v-model="selectedCampusId" @change="onCampusOrTypeChange" class="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none uppercase">
                    <option :value="null">-- SELECCIONAR --</option>
                    <option v-for="c in campuses" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
            </div>
            <div>
                <label class="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">TIPO MODALIDAD</label>
                <select v-model="selectedModalityTypeId" @change="onCampusOrTypeChange" class="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none uppercase">
                    <option :value="null">-- SELECCIONAR --</option>
                    <option v-for="mt in modalityTypes" :key="mt.id" :value="mt.id">{{ mt.name }}</option>
                </select>
            </div>
            <div>
                <label class="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">CARRERA</label>
                <select v-model="selectedAcademicOfferId" @change="onCareerChange" class="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none uppercase">
                    <option :value="null">-- SELECCIONAR --</option>
                    <option v-for="ao in academicOffers" :key="ao.id" :value="ao.id">{{ ao.career?.official_code }} {{ ao.career?.name }}</option>
                </select>
            </div>
            <div>
                <label class="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">NIVEL</label>
                <select v-model="selectedSemester" class="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none uppercase">
                    <option :value="null">-- TODOS --</option>
                    <option v-for="s in availableSemesters" :key="s" :value="s">SEMESTRE {{ s }}</option>
                </select>
            </div>
        </div>

        <!-- Alerta fase no activa -->
        <div v-if="resolvedConfigId && !phaseActive" class="bg-slate-100 border border-slate-300 rounded-xl p-3 text-center">
            <p class="text-xs text-slate-500 font-semibold uppercase">Fase de asignación no activa — modo solo lectura</p>
        </div>

        <div v-if="configError" class="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
            <p class="text-sm text-amber-700 font-semibold uppercase">{{ configError }}</p>
        </div>

        <template v-if="resolvedConfigId && !configError && selectedAcademicOfferId">

        <div v-if="loadingPackages && !packageItems.length" class="flex justify-center py-12">
            <div class="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>

        <div v-else class="bg-white border rounded-xl shadow-sm overflow-hidden">
            <div class="bg-slate-50 border-b px-4 py-3 flex items-center justify-between">
                <h2 class="text-sm font-bold text-slate-700 uppercase">Asignaci&oacute;n Docente</h2>
                <span class="text-xs text-slate-400">{{ filteredPackages.length }} materias</span>
            </div>

            <div ref="tableScrollRef" class="max-h-[65vh] overflow-y-auto">
                <table class="w-full text-left">
                    <thead class="sticky top-0 z-10">
                        <tr class="bg-slate-100 border-b text-[10px] font-black text-slate-500 uppercase">
                            <th class="px-3 py-2.5 w-24">Clave</th>
                            <th class="px-3 py-2.5">Materia</th>
                            <th class="px-3 py-2.5 w-20 text-center"># Grupos</th>
                            <th class="px-3 py-2.5 w-10 text-center">Sel.</th>
                            <th class="px-3 py-2.5 w-20 text-center">Turno</th>
                            <th class="px-3 py-2.5 w-32">Grupo</th>
                            <th class="px-3 py-2.5">Docente</th>
                            <th class="px-3 py-2.5 w-20 text-center">Cap.</th>
                            <th v-if="usesSpecificDates" class="px-3 py-2.5 w-20 text-center">Sesiones</th>
                            <th class="px-3 py-2.5 w-10"></th>
                        </tr>
                    </thead>
                    <tbody>
                        <template v-for="pkg in filteredPackages" :key="pkg.id">
                            <tr v-for="(row, rowIdx) in buildRows(pkg)" :key="row.key"
                                class="border-b transition"
                                :class="[
                                    rowIdx === 0 ? 'border-t-2 border-slate-300' : '',
                                    isPackageFull(pkg) ? 'bg-green-50/60' : 'hover:bg-slate-50',
                                ]">

                                <!-- Clave (rowspan) -->
                                <td v-if="rowIdx === 0" :rowspan="buildRows(pkg).length"
                                    class="px-3 py-2 text-xs font-bold text-slate-600 uppercase align-top border-r border-slate-100"
                                    :class="isPackageFull(pkg) ? 'bg-green-50' : ''">
                                    {{ pkg.subjectCode }}
                                </td>
                                <!-- Materia (rowspan) -->
                                <td v-if="rowIdx === 0" :rowspan="buildRows(pkg).length"
                                    class="px-3 py-2 align-top border-r border-slate-100"
                                    :class="isPackageFull(pkg) ? 'bg-green-50' : ''">
                                    <div class="flex items-center gap-1.5">
                                        <span class="text-sm font-bold text-slate-800 uppercase">{{ pkg.subjectName }}</span>
                                        <span v-if="pkg.isRepeat" class="text-[8px] px-1 py-0.5 rounded bg-amber-100 text-amber-600 font-black">REP</span>
                                        <svg v-if="isPackageFull(pkg)" class="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                                    </div>
                                </td>
                                <!-- # Grupos (rowspan) -->
                                <td v-if="rowIdx === 0" :rowspan="buildRows(pkg).length"
                                    class="px-3 py-2 text-center text-sm font-bold align-top border-r border-slate-100"
                                    :class="isPackageFull(pkg) ? 'text-green-600 bg-green-50' : 'text-slate-600'">
                                    {{ pkg.numGroups }}
                                </td>

                                <!-- Checkbox / Icono -->
                                <td class="px-3 py-2 text-center">
                                    <template v-if="phaseActive">
                                        <input type="checkbox" :checked="row.checked"
                                            :disabled="isRowBusy(row.key) || (!row.checked && isPackageFull(pkg))"
                                            class="w-4 h-4 rounded cursor-pointer accent-green-600"
                                            @change="onCheckboxChange(pkg, row)" />
                                    </template>
                                    <template v-else>
                                        <svg v-if="row.saved" class="w-4 h-4 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                                        <span v-else class="text-xs text-slate-300">--</span>
                                    </template>
                                </td>

                                <!-- Turno -->
                                <td class="px-3 py-2 text-center">
                                    <template v-if="phaseActive && row.checked">
                                        <select :value="row.saved ? row.savedShift : row.shift"
                                            :disabled="isRowBusy(row.key)"
                                            @change="onShiftChange(pkg, row, ($event.target as HTMLSelectElement).value)"
                                            class="border rounded px-1 py-0.5 text-xs w-16 text-center disabled:opacity-50">
                                            <option value="">---</option>
                                            <option value="M">M</option>
                                            <option value="V">V</option>
                                            <option value="N">N</option>
                                        </select>
                                    </template>
                                    <span v-else class="text-xs text-slate-500">{{ row.saved ? shiftLabel(row.savedShift) : '---' }}</span>
                                </td>

                                <!-- Grupo -->
                                <td class="px-3 py-2">
                                    <template v-if="phaseActive && row.checked">
                                        <select :value="row.saved ? row.savedGroupName : row.groupName"
                                            :disabled="isRowBusy(row.key)"
                                            @change="onGroupChange(pkg, row, ($event.target as HTMLSelectElement).value)"
                                            class="border rounded px-1 py-0.5 text-xs w-28 disabled:opacity-50">
                                            <option value="">---</option>
                                            <option v-for="gn in generateGroupNames(pkg)" :key="gn" :value="gn"
                                                :disabled="isGroupNameTakenByOther(pkg, gn, row)">
                                                {{ gn }}{{ isGroupNameTakenByOther(pkg, gn, row) ? ' (asignado)' : '' }}
                                            </option>
                                        </select>
                                    </template>
                                    <template v-else>
                                        <span v-if="row.saved" class="px-2 py-0.5 rounded text-[10px] font-bold border inline-block" :style="careerColorStyle">{{ row.savedGroupName }}</span>
                                        <span v-else class="text-xs text-slate-400">---</span>
                                    </template>
                                </td>

                                <!-- Docente -->
                                <td class="px-3 py-2">
                                    <template v-if="row.teacherName">
                                        <div class="flex items-center gap-1.5 flex-wrap">
                                            <span
                                                class="text-xs font-bold uppercase cursor-pointer hover:text-blue-600 hover:underline"
                                                :class="[row.saved ? 'text-slate-800' : 'text-blue-700', isRowBusy(row.key) ? 'opacity-50' : '']"
                                                :title="`Ver carga de ${row.teacherName}`"
                                                @click="openTeacherDrawer(row.teacherId!, row.teacherName!)"
                                            >
                                                {{ row.teacherName }}
                                            </span>
                                            <span v-if="row.isVacancy" class="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">VAC</span>
                                            <!-- Auxiliares chip -->
                                            <button
                                                v-if="row.saved && row.assignmentId"
                                                type="button"
                                                class="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border transition"
                                                :class="rowAdditionalTeachers(pkg, row).length > 0
                                                    ? 'bg-teal-50 border-teal-400 text-teal-700 hover:bg-teal-100'
                                                    : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-50'"
                                                :title="rowAdditionalTeachers(pkg, row).length > 0
                                                    ? 'Ver auxiliares (' + rowAdditionalTeachers(pkg, row).length + ')'
                                                    : 'Agregar docente auxiliar'"
                                                @click="openAuxModal(pkg, row)"
                                            >
                                                + AUX ({{ rowAdditionalTeachers(pkg, row).length }})
                                            </button>
                                        </div>
                                        <!-- Lista compacta de auxiliares bajo el titular -->
                                        <div v-if="row.saved && rowAdditionalTeachers(pkg, row).length > 0" class="mt-0.5 flex flex-wrap gap-1">
                                            <span
                                                v-for="at in rowAdditionalTeachers(pkg, row)"
                                                :key="'at-' + row.assignmentId + '-' + at.teacherId"
                                                class="text-[9px] uppercase font-semibold px-1 rounded bg-teal-50 text-teal-800 border border-teal-200"
                                                :title="at.role === 'auxiliary' ? 'Auxiliar' : 'Soporte'"
                                            >
                                                {{ at.teacherName }}
                                                <span class="opacity-60">· {{ at.role === 'auxiliary' ? 'AUX' : 'SOP' }}</span>
                                            </span>
                                        </div>
                                    </template>
                                    <span v-else class="text-xs text-slate-400">VACIO</span>
                                </td>

                                <!-- Capacidad -->
                                <td class="px-3 py-2 text-center">
                                    <template v-if="phaseActive && row.saved">
                                        <input type="number" :value="row.savedCapacity" min="1" max="999"
                                            :disabled="isRowBusy(row.key)"
                                            class="border rounded px-1 py-0.5 text-xs w-16 text-center disabled:opacity-50"
                                            @change="onCapacityChange(row, Number(($event.target as HTMLInputElement).value))" />
                                    </template>
                                    <template v-else-if="phaseActive && row.checked && !row.saved">
                                        <input type="number" v-model.number="row.capacity" min="1" max="999"
                                            :disabled="isRowBusy(row.key)"
                                            class="border rounded px-1 py-0.5 text-xs w-16 text-center disabled:opacity-50" />
                                    </template>
                                    <span v-else-if="row.saved" class="text-xs text-slate-600">{{ row.savedCapacity }}</span>
                                    <span v-else class="text-xs text-slate-300">---</span>
                                </td>

                                <!-- Sesiones (solo para modalidades que trabajan con fechas) -->
                                <td v-if="usesSpecificDates" class="px-3 py-2 text-center">
                                    <template v-if="phaseActive && row.saved">
                                        <input type="number" :value="row.savedSessionsCount ?? ''" min="1" max="999"
                                            :disabled="isRowBusy(row.key)"
                                            class="border rounded px-1 py-0.5 text-xs w-16 text-center disabled:opacity-50"
                                            @change="onSessionsCountChange(row, Number(($event.target as HTMLInputElement).value))" />
                                    </template>
                                    <template v-else-if="phaseActive && row.checked && !row.saved">
                                        <input type="number" v-model.number="row.sessionsCount" min="1" max="999"
                                            :disabled="isRowBusy(row.key)"
                                            class="border rounded px-1 py-0.5 text-xs w-16 text-center disabled:opacity-50"
                                            @input="syncSessionsCountToState(row)" />
                                    </template>
                                    <span v-else-if="row.saved && row.savedSessionsCount !== null" class="text-xs text-slate-600">{{ row.savedSessionsCount }}</span>
                                    <span v-else class="text-xs text-slate-300">---</span>
                                </td>

                                <!-- Estado / Botón ... -->
                                <td class="px-3 py-2 text-center">
                                    <!-- Guardando: disco parpadeante -->
                                    <template v-if="savingKeys.has(row.key)">
                                        <svg class="w-4 h-4 text-blue-500 mx-auto animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
                                    </template>
                                    <!-- Guardado OK: palomita verde -->
                                    <template v-else-if="savedKeys.has(row.key)">
                                        <svg class="w-4 h-4 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                                    </template>
                                    <!-- Botón ... para fila VACIO -->
                                    <template v-else-if="phaseActive && row.type === 'empty'">
                                        <button :disabled="!row.checked" @click="openSearchModal(pkg, row)"
                                            class="px-2 py-0.5 text-[9px] font-bold rounded bg-slate-200 text-slate-600 hover:bg-slate-300 disabled:opacity-30 uppercase">...</button>
                                    </template>
                                </td>
                            </tr>
                        </template>
                        <tr v-if="filteredPackages.length === 0">
                            <td :colspan="usesSpecificDates ? 10 : 9" class="px-4 py-8 text-center text-xs text-slate-400 uppercase font-bold">No hay materias aprobadas para este nivel.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Modal buscar docente -->
        <div v-if="searchModal.open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="searchModal.open = false">
            <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[70vh] flex flex-col">
                <h3 class="text-sm font-bold text-slate-700 uppercase">Buscar Docente</h3>
                <p class="text-[10px] text-slate-500">
                    Materia: <b class="text-slate-700">{{ searchModal.subjectName }}</b>
                    <span v-if="searchModal.maxGroups" class="ml-2 text-slate-400">({{ searchModal.maxGroups }} grupo{{ searchModal.maxGroups > 1 ? 's' : '' }})</span>
                </p>

                <!-- Docentes que ya solicitaron -->
                <div v-if="searchModal.requestingTeachers.length" class="space-y-1">
                    <h4 class="text-[10px] font-black text-blue-600 uppercase">Ya solicitaron</h4>
                    <div v-for="t in searchModal.requestingTeachers" :key="t.teacherId"
                        class="flex items-center justify-between rounded-lg px-3 py-2 border"
                        :class="t.atMax ? 'bg-slate-100 border-slate-200 opacity-50' : 'bg-blue-50 border-blue-200 cursor-pointer hover:bg-blue-100'"
                        @click="!t.atMax && selectTeacher(t)">
                        <div class="flex items-center gap-2">
                            <span class="text-xs font-bold uppercase" :class="t.atMax ? 'text-slate-400' : 'text-blue-800'">{{ t.teacherName }}</span>
                            <span v-if="t.isVacancy" class="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">VACANTE</span>
                            <span class="text-[10px]" :class="t.atMax ? 'text-slate-400' : 'text-blue-500'">{{ t.requestedGroups }}/{{ searchModal.maxGroups }} grupos</span>
                        </div>
                        <span v-if="t.atMax" class="text-[9px] font-bold text-slate-400 uppercase">MAX</span>
                        <svg v-else class="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                    </div>
                </div>

                <!-- Otros docentes -->
                <h4 class="text-[10px] font-black text-slate-500 uppercase">Otros docentes</h4>
                <div class="relative">
                    <input type="text" v-model="searchModal.query" placeholder="Buscar por nombre..."
                        class="w-full border-2 rounded-lg pl-8 pr-3 py-2 text-xs focus:border-blue-500 outline-none" />
                    <svg class="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                </div>
                <div class="flex-1 overflow-y-auto space-y-1">
                    <div v-if="searchModal.loading" class="flex justify-center py-6">
                        <div class="w-5 h-5 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <template v-else>
                        <div v-for="t in filteredSearchResults" :key="t.teacherId"
                            class="flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer transition border"
                            :class="t.isVacancy ? 'bg-amber-50 border-amber-200 hover:bg-amber-100' : 'bg-slate-50 border-slate-200 hover:bg-blue-50 hover:border-blue-300'"
                            @click="selectTeacher(t)">
                            <div class="flex items-center gap-2">
                                <span class="text-xs font-bold uppercase" :class="t.isVacancy ? 'text-amber-800' : 'text-slate-700'">{{ t.teacherName }}</span>
                                <span v-if="t.isVacancy" class="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-200 text-amber-800">VACANTE</span>
                            </div>
                            <svg class="w-4 h-4" :class="t.isVacancy ? 'text-amber-600' : 'text-blue-500'" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                        </div>
                        <div v-if="filteredSearchResults.length === 0" class="text-center py-4 text-[10px] text-slate-400 uppercase">
                            {{ searchModal.query ? 'Sin resultados' : 'No hay m\u00e1s docentes disponibles' }}
                        </div>
                    </template>
                </div>
                <div class="flex justify-end pt-2 border-t">
                    <button @click="searchModal.open = false" class="px-4 py-2 text-xs font-bold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 uppercase">Cancelar</button>
                </div>
            </div>
        </div>

        <!-- Modal de docentes auxiliares / soporte -->
        <div v-if="auxModal.open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="closeAuxModal">
            <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-5 space-y-3 max-h-[75vh] flex flex-col">
                <div class="flex items-start justify-between">
                    <div>
                        <h3 class="text-sm font-bold text-slate-700 uppercase">Docentes auxiliares</h3>
                        <p class="text-[10px] text-slate-500 mt-0.5">
                            Titular: <b class="text-slate-700">{{ auxModal.mainTeacherName }}</b>
                            <span class="block">{{ auxModal.subjectName }} · {{ auxModal.groupName }}</span>
                        </p>
                    </div>
                    <button @click="closeAuxModal" class="text-slate-400 hover:text-slate-700">
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                </div>

                <!-- Lista actual -->
                <div class="space-y-1">
                    <h4 class="text-[10px] font-black text-teal-700 uppercase">Auxiliares actuales</h4>
                    <div v-if="auxModal.current.length === 0" class="text-[10px] text-slate-400 italic px-2 py-1">
                        Sin auxiliares asignados
                    </div>
                    <div
                        v-for="(at, idx) in auxModal.current"
                        :key="'am-' + at.teacherId"
                        class="flex items-center justify-between rounded-lg px-3 py-2 border bg-teal-50 border-teal-200"
                    >
                        <div class="flex items-center gap-2 flex-wrap">
                            <span class="text-xs font-bold uppercase text-teal-800">{{ at.teacherName }}</span>
                            <select
                                v-model="at.role"
                                class="text-[10px] font-bold uppercase border border-teal-300 rounded px-1 py-0.5 bg-white"
                            >
                                <option value="auxiliary">AUXILIAR</option>
                                <option value="support">SOPORTE</option>
                            </select>
                        </div>
                        <button
                            type="button"
                            class="text-red-500 hover:text-red-700"
                            title="Quitar"
                            @click="auxModal.current.splice(idx, 1)"
                        >
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                    </div>
                </div>

                <!-- Agregar -->
                <div class="space-y-2 pt-2 border-t">
                    <h4 class="text-[10px] font-black text-slate-500 uppercase">Agregar docente</h4>
                    <div class="relative">
                        <input
                            type="text"
                            v-model="auxModal.query"
                            placeholder="Buscar por nombre..."
                            class="w-full border-2 rounded-lg pl-8 pr-3 py-2 text-xs focus:border-teal-500 outline-none"
                        />
                        <svg class="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                    </div>
                    <div class="flex-1 overflow-y-auto space-y-1 max-h-40">
                        <div v-if="auxModal.loading" class="flex justify-center py-4">
                            <div class="w-5 h-5 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <template v-else>
                            <div v-for="t in filteredAuxResults" :key="'ao-' + t.teacherId"
                                class="flex items-center justify-between rounded px-2 py-1 cursor-pointer hover:bg-teal-50 border border-transparent hover:border-teal-200"
                                @click="addAuxTeacher(t)"
                            >
                                <div class="flex items-center gap-2">
                                    <span class="text-xs font-bold uppercase text-slate-700">{{ t.teacherName }}</span>
                                    <span v-if="t.isVacancy" class="text-[9px] font-bold uppercase px-1 rounded bg-amber-100 text-amber-700">VAC</span>
                                </div>
                                <svg class="w-4 h-4 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                            </div>
                            <div v-if="filteredAuxResults.length === 0" class="text-[10px] text-slate-400 italic text-center py-2 uppercase">
                                {{ auxModal.query ? 'Sin resultados' : 'No hay docentes disponibles' }}
                            </div>
                        </template>
                    </div>
                </div>

                <div class="flex justify-end gap-2 pt-2 border-t">
                    <button @click="closeAuxModal" :disabled="auxModal.saving" class="px-4 py-2 text-xs font-bold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 uppercase disabled:opacity-50">
                        Cancelar
                    </button>
                    <button @click="saveAuxModal" :disabled="auxModal.saving" class="px-4 py-2 text-xs font-bold rounded-lg bg-teal-600 text-white hover:bg-teal-700 uppercase disabled:opacity-50">
                        {{ auxModal.saving ? 'Guardando...' : 'Guardar' }}
                    </button>
                </div>
            </div>
        </div>

        </template>
        </template>

        <!-- Toast notificación -->
        <Transition name="toast">
            <div v-if="toast.show" class="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-xs font-bold uppercase flex items-center gap-2"
                :class="toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'">
                <svg v-if="toast.type === 'success'" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
                {{ toast.message }}
            </div>
        </Transition>

        <!-- Drawer: carga del docente -->
        <teleport to="body">
            <div v-if="teacherDrawer.open" class="fixed inset-0 z-[60]">
                <div class="absolute inset-0 bg-black/40" @click="closeTeacherDrawer"></div>
                <aside class="absolute right-0 top-0 h-full w-full max-w-5xl bg-white shadow-2xl overflow-hidden flex flex-col">
                    <div class="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-4 border-b">
                        <div>
                            <h3 class="text-lg font-semibold text-slate-800 uppercase">
                                {{ teacherDrawer.teacherName }}
                            </h3>
                            <p class="text-[11px] text-slate-500 mt-0.5">
                                Carga total del docente en el periodo seleccionado (todas las carreras y modalidades)
                            </p>
                        </div>
                        <button
                            type="button"
                            class="text-gray-400 hover:text-gray-700"
                            @click="closeTeacherDrawer"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>

                    <div v-if="teacherDrawer.error" class="mx-6 mt-4 text-xs px-4 py-3 rounded-lg bg-red-50 text-red-700 border border-red-100">
                        {{ teacherDrawer.error }}
                    </div>

                    <div v-if="teacherDrawer.loading" class="flex-1 flex items-center justify-center text-sm text-slate-400">
                        <div class="flex items-center gap-2">
                            <span class="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
                            Cargando carga del docente…
                        </div>
                    </div>

                    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-4 p-6 overflow-y-auto flex-1">
                        <!-- SOLICITADAS -->
                        <section class="bg-white border rounded-xl overflow-hidden">
                            <div class="px-4 py-3 bg-blue-50 border-b flex items-center justify-between">
                                <h4 class="text-sm font-black uppercase tracking-wider text-blue-800">Materias solicitadas</h4>
                                <span class="text-[10px] text-blue-600">{{ drawerRequested.length }}</span>
                            </div>
                            <div class="overflow-x-auto">
                                <table v-if="drawerRequested.length" class="w-full text-xs">
                                    <thead class="bg-slate-50 text-slate-500 uppercase text-[10px]">
                                        <tr>
                                            <th class="px-3 py-2 text-left">Materia</th>
                                            <th class="px-3 py-2 text-left">Clave</th>
                                            <th class="px-3 py-2 text-left">Carrera</th>
                                            <th class="px-3 py-2 text-left">Modalidad</th>
                                            <th class="px-3 py-2 text-center">Sem.</th>
                                            <th class="px-3 py-2 text-center"># Grupos</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-slate-100">
                                        <tr v-for="(r, i) in drawerRequested" :key="'req-'+i">
                                            <td class="px-3 py-2 font-medium text-slate-700">{{ r.subjectName }}</td>
                                            <td class="px-3 py-2 font-mono text-slate-500">{{ r.subjectCode }}</td>
                                            <td class="px-3 py-2 text-slate-500">{{ r.careerName }}</td>
                                            <td class="px-3 py-2 text-[10px] text-slate-500">{{ r.modalityType || '—' }}</td>
                                            <td class="px-3 py-2 text-center">{{ r.semester }}</td>
                                            <td class="px-3 py-2 text-center font-bold text-blue-700">{{ r.numGroups }}</td>
                                        </tr>
                                    </tbody>
                                </table>
                                <p v-else class="p-6 text-center text-xs text-slate-400 italic">
                                    No tiene solicitudes en este periodo.
                                </p>
                            </div>
                        </section>

                        <!-- ASIGNADAS -->
                        <section class="bg-white border rounded-xl overflow-hidden">
                            <div class="px-4 py-3 bg-green-50 border-b flex items-center justify-between">
                                <h4 class="text-sm font-black uppercase tracking-wider text-green-800">Materias asignadas</h4>
                                <span class="text-[10px] text-green-700">
                                    {{ drawerAssigned.length }} ·
                                    {{ drawerTotalHours }} hrs totales
                                </span>
                            </div>
                            <div class="overflow-x-auto">
                                <table v-if="drawerAssigned.length" class="w-full text-xs">
                                    <thead class="bg-slate-50 text-slate-500 uppercase text-[10px]">
                                        <tr>
                                            <th class="px-3 py-2 text-left">Materia</th>
                                            <th class="px-3 py-2 text-left">Clave</th>
                                            <th class="px-3 py-2 text-left">Carrera</th>
                                            <th class="px-3 py-2 text-left">Modalidad</th>
                                            <th class="px-3 py-2 text-center">Grupo</th>
                                            <th class="px-3 py-2 text-center">HT</th>
                                            <th class="px-3 py-2 text-center">HP</th>
                                            <th class="px-3 py-2 text-center">Créd.</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-slate-100">
                                        <tr v-for="(a, i) in drawerAssigned" :key="'asg-'+i">
                                            <td class="px-3 py-2 font-medium text-slate-700">{{ a.subjectName }}</td>
                                            <td class="px-3 py-2 font-mono text-slate-500">{{ a.subjectCode }}</td>
                                            <td class="px-3 py-2 text-slate-500">{{ a.careerName }}</td>
                                            <td class="px-3 py-2 text-[10px] text-slate-500">{{ a.modalityType || '—' }}</td>
                                            <td class="px-3 py-2 text-center font-bold text-slate-700">{{ a.groupName || '---' }}</td>
                                            <td class="px-3 py-2 text-center">{{ a.ht ?? 0 }}</td>
                                            <td class="px-3 py-2 text-center">{{ a.hp ?? 0 }}</td>
                                            <td class="px-3 py-2 text-center">{{ a.credits ?? 0 }}</td>
                                        </tr>
                                    </tbody>
                                    <tfoot class="bg-slate-50 border-t">
                                        <tr>
                                            <td colspan="5" class="px-3 py-2 text-right text-[10px] font-black uppercase text-slate-500">
                                                Total horas asignadas
                                            </td>
                                            <td class="px-3 py-2 text-center font-black text-green-700" colspan="3">
                                                {{ drawerTotalHours }} hrs
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                                <p v-else class="p-6 text-center text-xs text-slate-400 italic">
                                    No tiene asignaciones guardadas en este periodo.
                                </p>
                            </div>
                        </section>
                    </div>
                </aside>
            </div>
        </teleport>
    </div>
</template>

<style scoped>
.toast-enter-active { transition: all 0.3s ease-out; }
.toast-leave-active { transition: all 0.3s ease-in; }
.toast-enter-from { opacity: 0; transform: translateY(20px); }
.toast-leave-to { opacity: 0; transform: translateY(20px); }
</style>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, nextTick } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import PeriodSelector from '@/app/components/ui/form/PeriodSelector.vue'

/* ── Filtros ─────────────────────────────────────────────────────── */
const selectedPeriodId = ref<number | null>(null)
const selectedCampusId = ref<number | null>(null)
const selectedModalityTypeId = ref<number | null>(null)
const selectedAcademicOfferId = ref<number | null>(null)
const selectedSemester = ref<number | null>(null)
// Contexto del usuario para scopear campus/modalityType/modality según rol.
// CAREER_MANAGER recibe sólo campusIds/modalityTypeIds derivados de sus
// (career, modality) tuplas. Admin (isAdmin=true) ve todo.
type ScaContext = {
    isAdmin: boolean
    careerIds: number[] | null
    modalityIds: number[] | null
    campusIds: number[] | null
    modalityTypeIds: number[] | null
}
const ctx = ref<ScaContext | null>(null)
const campuses = ref<any[]>([])
const modalityTypes = ref<any[]>([])
const modalities = ref<any[]>([])
const academicOffers = ref<any[]>([])
const periodSelectorRef = ref<InstanceType<typeof PeriodSelector> | null>(null)
const periodLocked = ref(false)
const lockedPeriodName = ref('')
const resolvedModalityId = ref<number | null>(null)
const resolvedConfigId = ref<number | null>(null)
const configError = ref<string | null>(null)
const phaseActive = ref(false)
const STORAGE_KEY = 'sca_period'

/* ── Datos ───────────────────────────────────────────────────────── */
const packageItems = ref<any[]>([])
const loadingPackages = ref(false)
const careerColor = ref<string | null>(null)
const careerSetting = ref<any>(null)
const selectedCareer = ref<any>(null)
const tableScrollRef = ref<HTMLElement | null>(null)

/* ── Estado filas editables ──────────────────────────────────────── */
const rowState = ref(new Map<string, { checked: boolean; shift: string; groupName: string; capacity: number; sessionsCount: number | null }>())
const savingKeys = ref(new Set<string>())
const savedKeys = ref(new Set<string>())

/* ── Drawer: carga del docente ──────────────────────────────────── */
interface DrawerRequestedRow { subjectName: string; subjectCode: string; careerName: string; modalityType?: string | null; semester: number; numGroups: number }
interface DrawerAssignedRow  { subjectName: string; subjectCode: string; careerName: string; modalityType?: string | null; groupName: string | null; ht: number; hp: number; credits: number }

const teacherDrawer = reactive({ open: false, teacherId: null as number | null, teacherName: '', loading: false, error: '' })
const drawerRequested  = ref<DrawerRequestedRow[]>([])
const drawerAssigned   = ref<DrawerAssignedRow[]>([])
const drawerTotalHours = ref(0)

async function openTeacherDrawer(teacherId: number, teacherName: string) {
    teacherDrawer.teacherId = teacherId
    teacherDrawer.teacherName = teacherName
    teacherDrawer.open = true
    teacherDrawer.error = ''
    drawerRequested.value = []
    drawerAssigned.value  = []
    drawerTotalHours.value = 0

    if (!selectedPeriodId.value) {
        teacherDrawer.error = 'Selecciona un periodo académico primero.'
        return
    }

    teacherDrawer.loading = true
    try {
        const { data } = await api.get(API.SCA_API.teachers.workload(teacherId), {
            params: { college_academic_period_id: selectedPeriodId.value },
        })
        drawerRequested.value = data?.requested ?? []
        drawerAssigned.value  = data?.assigned ?? []
        drawerTotalHours.value = Number(data?.totalAssignedHours ?? 0)
    } catch (e: any) {
        teacherDrawer.error = e?.response?.data?.message ?? 'Error al cargar la carga del docente.'
    } finally {
        teacherDrawer.loading = false
    }
}

function closeTeacherDrawer() {
    teacherDrawer.open = false
    teacherDrawer.teacherId = null
    teacherDrawer.teacherName = ''
    teacherDrawer.error = ''
    drawerRequested.value = []
    drawerAssigned.value  = []
    drawerTotalHours.value = 0
}

/* ── Toast ───────────────────────────────────────────────────────── */
const toast = reactive({ show: false, message: '', type: 'success' as 'success' | 'error' })
let toastTimer: ReturnType<typeof setTimeout> | null = null

function showToast(message: string, type: 'success' | 'error' = 'success') {
    if (toastTimer) clearTimeout(toastTimer)
    toast.message = message
    toast.type = type
    toast.show = true
    toastTimer = setTimeout(() => { toast.show = false }, 3000)
}

function isRowBusy(key: string): boolean {
    return savingKeys.value.has(key) || savedKeys.value.has(key)
}

async function withRowSaving(key: string, fn: () => Promise<void>, successMsg: string) {
    savingKeys.value.add(key)
    try {
        await fn()
        savingKeys.value.delete(key)
        savedKeys.value.add(key)
        showToast(successMsg)
        setTimeout(() => { savedKeys.value.delete(key) }, 2000)
    } catch (e: any) {
        savingKeys.value.delete(key)
        const msg = e?.response?.data?.message ?? 'Error al guardar'
        showToast(msg, 'error')
        throw e
    }
}

interface RowData {
    type: 'request' | 'direct' | 'empty'
    teacherId: number | null
    teacherName: string | null
    isVacancy: boolean
    requestId: number | null
    saved: boolean
    savedShift: string
    savedGroupName: string
    savedCapacity: number
    savedSessionsCount: number | null
    assignmentId: number | null
    checked: boolean
    shift: string
    groupName: string
    capacity: number
    sessionsCount: number | null
    key: string
}

function buildRows(pkg: any): RowData[] {
    const requests = pkg.requests ?? []
    const assignments = pkg.assignments ?? []
    const rows: RowData[] = []
    let idx = 0
    // Default de sesiones = ht + hp del subject (cuando modalidad usa fechas)
    const defaultSessions = ((Number(pkg.ht) || 0) + (Number(pkg.hp) || 0)) || null

    for (const req of requests) {
        const teacherAssigns = assignments.filter((a: any) => a.teacherId === req.teacherId)
        for (let i = 0; i < req.numGroups; i++) {
            const a = teacherAssigns[i] ?? null
            const key = `${pkg.id}-${idx}`
            const st = rowState.value.get(key)
            rows.push({
                type: 'request', teacherId: req.teacherId, teacherName: req.teacherName, isVacancy: !!req.isVacancy, requestId: req.id,
                saved: !!a, savedShift: a?.groupShift ?? '', savedGroupName: a?.groupName ?? '', savedCapacity: a?.capacity ?? 40,
                savedSessionsCount: a?.sessionsCount ?? null,
                assignmentId: a?.id ?? null,
                checked: !!a || (st?.checked ?? false), shift: st?.shift ?? '', groupName: st?.groupName ?? '', capacity: st?.capacity ?? 40,
                sessionsCount: st?.sessionsCount ?? defaultSessions,
                key,
            })
            idx++
        }
    }

    const reqTeacherIds = requests.map((r: any) => r.teacherId)
    for (const a of assignments.filter((a: any) => !reqTeacherIds.includes(a.teacherId))) {
        const key = `${pkg.id}-${idx}`
        rows.push({
            type: 'direct', teacherId: a.teacherId, teacherName: a.teacherName, isVacancy: !!a.isVacancy, requestId: null,
            saved: true, savedShift: a.groupShift ?? '', savedGroupName: a.groupName ?? '', savedCapacity: a.capacity ?? 40,
            savedSessionsCount: a.sessionsCount ?? null,
            assignmentId: a.id,
            checked: true, shift: '', groupName: '', capacity: 40, sessionsCount: null, key,
        })
        idx++
    }

    // Fila VACIO solo si fase activa
    if (phaseActive.value) {
        const emptyKey = `${pkg.id}-empty`
        const emptyState = rowState.value.get(emptyKey)
        rows.push({
            type: 'empty', teacherId: null, teacherName: null, isVacancy: false, requestId: null,
            saved: false, savedShift: '', savedGroupName: '', savedCapacity: 40, savedSessionsCount: null, assignmentId: null,
            checked: emptyState?.checked ?? false, shift: emptyState?.shift ?? '', groupName: emptyState?.groupName ?? '', capacity: emptyState?.capacity ?? 40,
            sessionsCount: emptyState?.sessionsCount ?? defaultSessions,
            key: emptyKey,
        })
    }

    return rows
}

function assignedCount(pkg: any): number { return (pkg.assignments ?? []).length }
function isPackageFull(pkg: any): boolean { return assignedCount(pkg) >= pkg.numGroups }
function shiftLabel(s: string): string { return s === 'M' || s === 'V' || s === 'N' ? s : '---' }

/* ── Grupo names ─────────────────────────────────────────────────── */
function generateGroupNames(pkg: any): string[] {
    const format = careerSetting.value?.groupFormat || '[D,numberPeriod][CC,officialCode,0]-[L,sec]'
    const careerId = selectedCareer.value?.id ?? 0
    const code = selectedCareer.value?.official_code ?? ''
    const semester = pkg.targetSemester ?? 1
    const count = Math.max(pkg.numGroups, 10)
    const names: string[] = []
    for (let i = 0; i < count; i++) {
        const letter = String.fromCharCode(65 + i)
        let name = format
        name = name.replace(/\[D,numberPeriod\]/gi, String(semester))
        name = name.replace(/\[DD,numberPeriod\]/gi, String(semester).padStart(2, '0'))
        name = name.replace(/\[D,carreraId\]/gi, String(careerId))
        name = name.replace(/\[DD,carreraId\]/gi, String(careerId).padStart(2, '0'))
        name = name.replace(/\[DDD,carreraId\]/gi, String(careerId).padStart(3, '0'))
        name = name.replace(/\[C,officialCode\]/gi, code)
        name = name.replace(/\[(C{2,}),officialCode(?:,(.))?]/gi, (_m: string, cs: string, pad: string) => {
            return (code || '').substring(0, cs.length).padStart(cs.length, pad || '0')
        })
        name = name.replace(/\[L,sec\]/gi, letter)
        names.push(name)
    }

    // Incluir también los nombres que ya están guardados en asignaciones del
    // paquete, así el <select> puede mostrar valores legados o provenientes
    // de un formato distinto al default actual (p.ej. datos migrados de v2).
    const savedNames: string[] = (pkg.assignments ?? [])
        .map((a: any) => a.groupName)
        .filter((n: any): n is string => typeof n === 'string' && n.length > 0)

    return Array.from(new Set([...names, ...savedNames]))
}

function isGroupNameTakenByOther(pkg: any, groupName: string, currentRow: RowData): boolean {
    if (currentRow.saved && currentRow.savedGroupName === groupName) return false
    return (pkg.assignments ?? []).some((a: any) => a.groupName === groupName && a.id !== currentRow.assignmentId)
}

/* ── Checkbox ────────────────────────────────────────────────────── */
function onCheckboxChange(pkg: any, row: RowData) {
    if (row.saved) {
        removeAssignment(row.assignmentId!)
        return
    }
    const newChecked = !row.checked
    const defaultSessions = ((Number(pkg.ht) || 0) + (Number(pkg.hp) || 0)) || null
    rowState.value.set(row.key, { checked: newChecked, shift: '', groupName: '', capacity: 40, sessionsCount: defaultSessions })
    packageItems.value = [...packageItems.value]
}

/* ── Cambios inline en filas asignadas (edición) ─────────────────── */
async function onShiftChange(pkg: any, row: RowData, newShift: string) {
    if (row.saved && row.assignmentId) {
        await withRowSaving(row.key, async () => {
            await api.put(API.SCA_API.teacherAssignments.update(row.assignmentId!), {
                shift: newShift,
                group_name: row.savedGroupName,
            })
            await fetchPackages(true)
        }, 'Turno actualizado')
        return
    }
    const st = rowState.value.get(row.key)
    if (st) { st.shift = newShift; row.shift = newShift }
    tryAutoSave(pkg, row)
}

async function onGroupChange(pkg: any, row: RowData, newGroup: string) {
    if (row.saved && row.assignmentId) {
        await withRowSaving(row.key, async () => {
            await api.put(API.SCA_API.teacherAssignments.update(row.assignmentId!), {
                group_name: newGroup,
                shift: row.savedShift,
            })
            await fetchPackages(true)
        }, 'Grupo actualizado')
        return
    }
    const st = rowState.value.get(row.key)
    if (st) { st.groupName = newGroup; row.groupName = newGroup }
    tryAutoSave(pkg, row)
}

async function onCapacityChange(row: RowData, newCapacity: number) {
    if (!row.saved || !row.assignmentId) return
    await withRowSaving(row.key, async () => {
        await api.put(API.SCA_API.teacherAssignments.update(row.assignmentId!), { capacity: newCapacity })
        await fetchPackages(true)
    }, 'Capacidad actualizada')
}

async function onSessionsCountChange(row: RowData, newSessions: number) {
    if (!row.saved || !row.assignmentId) return
    await withRowSaving(row.key, async () => {
        await api.put(API.SCA_API.teacherAssignments.update(row.assignmentId!), { sessions_count: newSessions })
        await fetchPackages(true)
    }, 'Sesiones actualizadas')
}

function syncSessionsCountToState(row: RowData) {
    const st = rowState.value.get(row.key)
    if (st) st.sessionsCount = row.sessionsCount
}

async function tryAutoSave(pkg: any, row: RowData) {
    const st = rowState.value.get(row.key)
    if (!st || !row.shift || !row.groupName || !row.teacherId) return

    await withRowSaving(row.key, async () => {
        const payload: any = {
            subject_package_id: pkg.id, teacher_id: row.teacherId,
            group_name: row.groupName, shift: row.shift,
            teacher_subject_request_id: row.requestId, capacity: row.capacity,
        }
        if (usesSpecificDates.value && row.sessionsCount) {
            payload.sessions_count = row.sessionsCount
        }
        await api.post(API.SCA_API.teacherAssignments.create, payload)
        rowState.value.delete(row.key)
        await fetchPackages(true)
    }, 'Docente asignado')
}

async function removeAssignment(id: number) {
    const key = `remove-${id}`
    await withRowSaving(key, async () => {
        await api.delete(API.SCA_API.teacherAssignments.delete(id))
        await fetchPackages(true)
    }, 'Asignación eliminada')
}

/* ── Modal ───────────────────────────────────────────────────────── */
const searchModal = reactive({
    open: false, pkg: null as any, rowKey: '', subjectName: '', query: '',
    maxGroups: 0, requestingTeachers: [] as any[], otherTeachers: [] as any[], loading: false,
})

const filteredSearchResults = computed(() => {
    if (!searchModal.query) return searchModal.otherTeachers
    const q = searchModal.query.toLowerCase()
    return searchModal.otherTeachers.filter((t: any) => (t.teacherName ?? '').toLowerCase().includes(q))
})

async function openSearchModal(pkg: any, row: RowData) {
    if (!row.checked) return
    searchModal.pkg = pkg; searchModal.rowKey = row.key; searchModal.subjectName = pkg.subjectName
    searchModal.query = ''; searchModal.maxGroups = pkg.numGroups
    searchModal.requestingTeachers = []; searchModal.otherTeachers = []
    searchModal.loading = true; searchModal.open = true
    try {
        const { data } = await api.get(API.SCA_API.teacherAssignments.availableTeachers(pkg.id))
        searchModal.maxGroups = data?.maxGroups ?? pkg.numGroups
        searchModal.requestingTeachers = data?.requesting ?? []
        searchModal.otherTeachers = data?.others ?? []
    } catch { searchModal.requestingTeachers = []; searchModal.otherTeachers = [] }
    finally { searchModal.loading = false }
}

async function selectTeacher(teacher: any) {
    if (!searchModal.pkg) return
    try {
        await api.post(API.SCA_API.teacherAssignments.addRequest, {
            subject_package_id: searchModal.pkg.id, teacher_id: teacher.teacherId,
        })
        searchModal.open = false
        rowState.value.delete(searchModal.rowKey)
        await fetchPackages(true)
    } catch (e: any) { alert(e?.response?.data?.message ?? 'Error al agregar solicitud') }
}

/* ── Modal Auxiliares (docente auxiliar / soporte) ──────────────── */
interface AuxEntry { teacherId: number; teacherName: string; role: 'auxiliary' | 'support'; isVacancy?: boolean; notes?: string | null }
const auxModal = reactive({
    open: false,
    assignmentId: null as number | null,
    pkgId: null as number | null,
    mainTeacherId: null as number | null,
    mainTeacherName: '',
    subjectName: '',
    groupName: '',
    current: [] as AuxEntry[],
    query: '',
    candidates: [] as AuxEntry[],
    loading: false,
    saving: false,
})

const filteredAuxResults = computed(() => {
    const q = auxModal.query.toLowerCase().trim()
    const takenIds = new Set<number>([...auxModal.current.map(a => a.teacherId), auxModal.mainTeacherId ?? 0])
    return auxModal.candidates.filter((t: any) => {
        if (takenIds.has(t.teacherId)) return false
        if (!q) return true
        return (t.teacherName ?? '').toLowerCase().includes(q)
    })
})

function rowAdditionalTeachers(pkg: any, row: RowData): AuxEntry[] {
    if (!row.saved || !row.assignmentId) return []
    const assign = (pkg.assignments ?? []).find((a: any) => a.id === row.assignmentId)
    return assign?.additionalTeachers ?? []
}

async function openAuxModal(pkg: any, row: RowData) {
    if (!row.saved || !row.assignmentId || !row.teacherId) return
    auxModal.assignmentId = row.assignmentId
    auxModal.pkgId = pkg.id
    auxModal.mainTeacherId = row.teacherId
    auxModal.mainTeacherName = row.teacherName ?? ''
    auxModal.subjectName = pkg.subjectName ?? ''
    auxModal.groupName = row.savedGroupName ?? ''
    auxModal.current = rowAdditionalTeachers(pkg, row).map(at => ({ ...at }))
    auxModal.query = ''
    auxModal.candidates = []
    auxModal.loading = true
    auxModal.open = true
    try {
        const { data } = await api.get(API.SCA_API.teacherAssignments.availableTeachers(pkg.id))
        // El endpoint devuelve { requesting, others }; para auxiliares permitimos cualquier docente
        const all = [...(data?.requesting ?? []), ...(data?.others ?? [])]
        // Deduplicar por teacherId
        const seen = new Set<number>()
        auxModal.candidates = all.filter((t: any) => {
            if (seen.has(t.teacherId)) return false
            seen.add(t.teacherId)
            return true
        })
    } catch {
        auxModal.candidates = []
    } finally {
        auxModal.loading = false
    }
}

function closeAuxModal() {
    auxModal.open = false
    auxModal.assignmentId = null
    auxModal.current = []
    auxModal.candidates = []
}

function addAuxTeacher(t: any) {
    auxModal.current.push({
        teacherId: t.teacherId,
        teacherName: t.teacherName,
        role: 'auxiliary',
        isVacancy: !!t.isVacancy,
        notes: null,
    })
    auxModal.query = ''
}

async function saveAuxModal() {
    if (!auxModal.assignmentId) return
    auxModal.saving = true
    try {
        await api.put(API.SCA_API.teacherAssignments.update(auxModal.assignmentId), {
            additional_teachers: auxModal.current.map(at => ({
                teacher_id: at.teacherId,
                role: at.role,
                notes: at.notes ?? null,
            })),
        })
        auxModal.open = false
        await fetchPackages(true)
        showToast('Auxiliares actualizados')
    } catch (e: any) {
        showToast(e?.response?.data?.message ?? 'Error al guardar auxiliares', 'error')
    } finally {
        auxModal.saving = false
    }
}

/* ── Computed ────────────────────────────────────────────────────── */
const availableSemesters = computed(() => {
    const s = new Set<number>()
    for (const p of packageItems.value) s.add(p.targetSemester)
    return Array.from(s).sort((a, b) => a - b)
})
const filteredPackages = computed(() => {
    if (!selectedSemester.value) return packageItems.value
    return packageItems.value.filter((p: any) => p.targetSemester === selectedSemester.value)
})
const careerColorStyle = computed(() => {
    const c = careerColor.value
    if (!c) return { borderColor: '#94a3b8', backgroundColor: '#f1f5f9', color: '#1e293b' }
    return { borderColor: c, backgroundColor: c + '20', color: '#1e293b' }
})

/* ── Period ───────────────────────────────────────────────────────── */
function savePeriodToStorage() { localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: selectedPeriodId.value, name: lockedPeriodName.value })) }
function clearPeriodStorage() { localStorage.removeItem(STORAGE_KEY) }
function restorePeriodFromStorage() { try { const r = localStorage.getItem(STORAGE_KEY); if (!r) return; const s = JSON.parse(r); if (s?.id) { selectedPeriodId.value = s.id; lockedPeriodName.value = s.name ?? ''; periodLocked.value = true } } catch {} }
function toggleLock() {
    if (!periodLocked.value) { if (!selectedPeriodId.value) return; lockedPeriodName.value = periodSelectorRef.value?.selectedPeriod?.name ?? 'SIN PERIODO'; periodLocked.value = true; savePeriodToStorage() }
    else { periodLocked.value = false; clearPeriodStorage(); resetAll() }
}

/* ── Fetch ───────────────────────────────────────────────────────── */
async function fetchContext() {
    try {
        const { data } = await api.get(API.SCA_API.myContext)
        ctx.value = data
    } catch {
        ctx.value = { isAdmin: false, careerIds: [], modalityIds: [], campusIds: [], modalityTypeIds: [] }
    }
}
async function fetchCampuses() {
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.campuses.list, { params: { per_page: 100, status: 1 } })
        let list = (data?.items ?? data?.data ?? data ?? []).map((c: any) => ({ id: c.id, name: c.name ?? c.shortName ?? `#${c.id}` }))
        if (ctx.value && !ctx.value.isAdmin && ctx.value.campusIds) {
            list = list.filter((c: any) => ctx.value!.campusIds!.includes(c.id))
        }
        campuses.value = list
    } catch { campuses.value = [] }
}
async function fetchModalityTypes() {
    try {
        const { data } = await api.get(API.SUPERADMIN_API.modalityTypes.list, { params: { per_page: 100 } })
        let list = (data?.items ?? data?.data ?? data ?? []).map((mt: any) => ({ id: mt.id, name: mt.name ?? `#${mt.id}`, config: mt.config ?? null }))
        if (ctx.value && !ctx.value.isAdmin && ctx.value.modalityTypeIds) {
            list = list.filter((mt: any) => ctx.value!.modalityTypeIds!.includes(mt.id))
        }
        modalityTypes.value = list
    } catch { modalityTypes.value = [] }
}

const usesSpecificDates = computed(() => {
    const mt = modalityTypes.value.find(x => x.id === selectedModalityTypeId.value)
    return !!mt?.config?.schedule?.uses_specific_dates
})
async function fetchModalities() {
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.modalities.list, { params: { per_page: 200 } })
        let list = data?.items ?? data?.data ?? data ?? []
        if (ctx.value && !ctx.value.isAdmin && ctx.value.modalityIds) {
            list = list.filter((m: any) => ctx.value!.modalityIds!.includes(m.id))
        }
        modalities.value = list
    } catch { modalities.value = [] }
}
async function fetchAcademicOffers() {
    if (!resolvedModalityId.value) { academicOffers.value = []; return }
    try { const { data } = await api.get(API.SCA_API.teacherAssignments.allowedAcademicOffers, { params: { modality_id: resolvedModalityId.value } }); academicOffers.value = data ?? [] } catch { academicOffers.value = [] }
}
function resolveModality() {
    resolvedModalityId.value = null; configError.value = null; resolvedConfigId.value = null; phaseActive.value = false
    academicOffers.value = []; packageItems.value = []; selectedAcademicOfferId.value = null; selectedSemester.value = null
    if (!selectedCampusId.value || !selectedModalityTypeId.value) return
    const m = modalities.value.find((m: any) => (m.campusId === selectedCampusId.value || m.campus_id === selectedCampusId.value) && (m.modalityTypeId === selectedModalityTypeId.value || m.modality_type_id === selectedModalityTypeId.value))
    if (m) { resolvedModalityId.value = m.id; resolveConfig(); fetchAcademicOffers() }
}
async function resolveConfig() {
    resolvedConfigId.value = null; configError.value = null; phaseActive.value = false
    if (!selectedPeriodId.value || !resolvedModalityId.value) return
    try {
        const { data } = await api.get(API.SCA_API.academicLoadConfigs.list, { params: { per_page: 1, search: { college_academic_period_id: selectedPeriodId.value, modality_id: resolvedModalityId.value } } })
        const items = data?.items ?? data?.data ?? []
        if (!items.length) { configError.value = 'No existe configuraci\u00f3n de carga acad\u00e9mica para este periodo y modalidad.'; return }
        resolvedConfigId.value = items[0].id
        phaseActive.value = !!(items[0].phaseAssignment ?? items[0].phase_assignment)
    } catch { configError.value = 'Error al buscar la configuraci\u00f3n.' }
}
async function fetchPackages(preserveScroll = false) {
    if (!resolvedConfigId.value || !selectedAcademicOfferId.value) return
    const ao = academicOffers.value.find((a: any) => a.id === selectedAcademicOfferId.value)
    const sp = ao?.studyPlans ?? ao?.study_plans ?? []
    if (!sp.length) { packageItems.value = []; return }
    const ids = sp.filter((s: any) => { const la = s.status === true || s.status === 1; const p = s.studyPlan ?? s.study_plan ?? s; return la && p?.is_active !== false && p?.isActive !== false }).map((s: any) => { const p = s.studyPlan ?? s.study_plan ?? s; return p?.id ?? s.study_plan_id ?? s.id }).filter(Boolean) as number[]
    if (!ids.length) { packageItems.value = []; return }

    const isReload = packageItems.value.length > 0
    if (!isReload) { loadingPackages.value = true; rowState.value.clear() }

    const scrollTop = preserveScroll && tableScrollRef.value ? tableScrollRef.value.scrollTop : 0

    try {
        const r = await Promise.all(ids.map((id: number) => api.get(API.SCA_API.teacherAssignments.packages(resolvedConfigId.value!, id)).then(r => r.data ?? []).catch(() => [])))
        packageItems.value = r.flat()

        if (preserveScroll && tableScrollRef.value) {
            nextTick(() => { if (tableScrollRef.value) tableScrollRef.value.scrollTop = scrollTop })
        }
    } catch { packageItems.value = [] }
    finally { loadingPackages.value = false }
}
async function fetchCareerSetting() {
    const ao = academicOffers.value.find((a: any) => a.id === selectedAcademicOfferId.value)
    if (!ao?.career?.id) { careerColor.value = null; careerSetting.value = null; selectedCareer.value = null; return }
    selectedCareer.value = { id: ao.career.id, official_code: ao.career.official_code ?? ao.career.officialCode ?? '' }
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.collegeCareerSettings.byCareer(ao.career.id))
        careerSetting.value = data; careerColor.value = data?.careerColor ?? null
    } catch { careerSetting.value = null; careerColor.value = null }
}

/* ── Events ──────────────────────────────────────────────────────── */
function resetAll() { selectedCampusId.value = null; selectedModalityTypeId.value = null; selectedAcademicOfferId.value = null; selectedSemester.value = null; resolvedModalityId.value = null; resolvedConfigId.value = null; configError.value = null; phaseActive.value = false; packageItems.value = []; academicOffers.value = []; careerColor.value = null; careerSetting.value = null; selectedCareer.value = null; rowState.value.clear() }
function onPeriodChange() { resolvedConfigId.value = null; configError.value = null; packageItems.value = []; if (selectedPeriodId.value && resolvedModalityId.value) resolveConfig() }
function onCampusOrTypeChange() { packageItems.value = []; selectedAcademicOfferId.value = null; selectedSemester.value = null; resolveModality() }
function onCareerChange() { packageItems.value = []; selectedSemester.value = null; if (selectedAcademicOfferId.value) { fetchPackages(); fetchCareerSetting() } }

onMounted(async () => {
    // Cargar context primero — los fetch de campus/modality/modalityType lo
    // usan para filtrar según el rol del usuario. Sin esto el CAREER_MANAGER
    // ve catálogos completos del college en vez de sólo sus tuplas.
    await fetchContext()
    restorePeriodFromStorage()
    await Promise.all([fetchCampuses(), fetchModalityTypes(), fetchModalities()])
})
</script>
