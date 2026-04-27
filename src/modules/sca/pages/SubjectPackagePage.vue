<template>
    <div class="space-y-4">
        <!-- Periodo arriba (como SGI v2) -->
        <div class="flex items-center gap-3">
            <!-- Modo edición: select -->
            <PeriodSelector v-if="!periodLocked" ref="periodSelectorRef" v-model="selectedPeriodId" @update:model-value="onPeriodChange" label="" placeholder="SELECCIONE UN PERIODO" class="flex-1" />
            <!-- Modo lectura: div -->
            <div v-else class="flex-1 border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold uppercase bg-slate-50 text-slate-700">
                {{ lockedPeriodName }}
            </div>

            <!-- Botón candado -->
            <button
                class="w-12 h-[46px] border-2 rounded-xl flex items-center justify-center transition"
                :class="periodLocked ? 'border-slate-300 bg-slate-50 text-slate-500 hover:bg-slate-100' : 'border-blue-500 bg-blue-50 text-blue-600 hover:bg-blue-100'"
                :disabled="!selectedPeriodId && !periodLocked"
                @click="toggleLock"
                :title="periodLocked ? 'Desbloquear periodo' : 'Bloquear periodo'"
            >
                <svg v-if="periodLocked" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/></svg>
                <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z"/></svg>
            </button>

            <!-- Etiqueta de estado del periodo -->
            <div v-if="selectedPeriodId"
                class="h-[46px] border-2 rounded-xl px-4 flex items-center text-xs font-black uppercase tracking-wider whitespace-nowrap"
                :class="periodStatusClass">
                {{ currentPeriodStatusLabel }}
            </div>
        </div>

        <!-- Todo lo demás solo visible cuando el periodo está bloqueado -->
        <template v-if="periodLocked">

        <!-- Filtros en cascada -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
                <label class="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">CAMPUS</label>
                <select v-model="selectedCampusId" @change="onCampusOrTypeChange"
                    class="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none uppercase">
                    <option :value="null">-- SELECCIONAR --</option>
                    <option v-for="c in campuses" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
            </div>

            <div>
                <label class="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">TIPO MODALIDAD</label>
                <select v-model="selectedModalityTypeId" @change="onCampusOrTypeChange"
                    class="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none uppercase">
                    <option :value="null">-- SELECCIONAR --</option>
                    <option v-for="mt in modalityTypes" :key="mt.id" :value="mt.id">{{ mt.name }}</option>
                </select>
            </div>

            <div>
                <label class="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">PLAN DE ESTUDIO</label>
                <select v-model="selectedStudyPlanId" @change="onStudyPlanChange"
                    class="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none uppercase"
                    :disabled="!resolvedModalityId">
                    <option :value="null">SELECCIONE UN PLAN DE ESTUDIO</option>
                    <optgroup v-for="(plans, careerName) in studyPlansByCareer" :key="careerName" :label="String(careerName)">
                        <option v-for="sp in plans" :key="sp.id" :value="sp.id">
                            {{ sp.officialCode }}
                        </option>
                    </optgroup>
                </select>
            </div>
        </div>

        <!-- Alerta si no hay config o phase_package no está activa -->
        <div v-if="configError" class="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
            <p class="text-sm text-amber-700 font-semibold uppercase">{{ configError }}</p>
        </div>

        <!-- Modo apertura tardía -->
        <div v-if="resolvedConfigId && unlockedByLateOpening" class="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
            <p class="text-xs text-amber-700 font-semibold uppercase">
                Fase de Paquete cerrada — operando bajo apertura tardía aprobada.
            </p>
        </div>

        <!-- Vista de selección de materias -->
        <template v-if="resolvedConfigId && selectedStudyPlanId && !configError">

            <!-- Toggle entre vista selección y vista paquete -->
            <div v-if="view === 'curriculum'" class="space-y-4">
                <!-- Selectores de especialidad y grupo optativa -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">ESPECIALIDAD (OPCIONAL)</label>
                        <select v-model="selectedSpecialtyId" @change="fetchCurriculumSubjects"
                            class="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none uppercase">
                            <option :value="null">-- NINGUNA --</option>
                            <option v-for="s in specialties" :key="s.id" :value="s.id">{{ s.name }}</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">GRUPO DE OPTATIVAS (OPCIONAL)</label>
                        <select v-model="selectedOptionalGroupId" @change="fetchCurriculumSubjects"
                            class="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none uppercase">
                            <option :value="null">-- NINGUNO --</option>
                            <option v-for="og in optionalGroups" :key="og.id" :value="og.id">{{ og.name }}</option>
                        </select>
                    </div>
                </div>

                <!-- Materias del curriculum -->
                <div class="bg-white border rounded-xl shadow-sm overflow-hidden">
                    <div class="bg-slate-50 border-b px-4 py-3 flex items-center justify-between">
                        <h2 class="text-sm font-bold text-slate-700 uppercase">Materias del Curriculum</h2>
                        <div class="flex items-center gap-3">
                            <span class="text-xs text-slate-400">{{ curriculumSubjects.length }} materias</span>
                            <div class="flex border rounded-lg overflow-hidden">
                                <button @click="displayMode = 'list'"
                                    class="px-2.5 py-1.5 text-[10px] font-bold uppercase transition"
                                    :class="displayMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-slate-400 hover:bg-slate-50'">
                                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
                                </button>
                                <button @click="displayMode = 'grid'"
                                    class="px-2.5 py-1.5 text-[10px] font-bold uppercase transition"
                                    :class="displayMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-slate-400 hover:bg-slate-50'">
                                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"/></svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div v-if="loadingCurriculum" class="flex justify-center py-12">
                        <div class="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>

                    <!-- MODO LISTA -->
                    <div v-else-if="displayMode === 'list'" class="divide-y max-h-[60vh] overflow-y-auto">
                        <template v-for="(subjects, semester) in groupedSubjects" :key="semester">
                            <div class="bg-slate-100 px-4 py-2 text-[10px] font-black text-slate-500 uppercase tracking-wider sticky top-0 z-10">
                                Semestre {{ semester }}
                                <span v-if="subjects.some((s: any) => s.specialtyId)" class="ml-2 text-blue-500">+ Especialidad</span>
                                <span v-if="subjects.some((s: any) => s.optionalGroupId)" class="ml-2 text-purple-500">+ Optativas</span>
                            </div>
                            <div
                                v-for="cs in subjects" :key="cs.subjectId"
                                class="flex items-center gap-3 px-4 py-3 transition cursor-pointer border-l-4"
                                :class="{
                                    'border-l-blue-500 bg-blue-50': selectedSubjectIds.has(cs.subjectId),
                                    'opacity-50 cursor-not-allowed border-l-slate-200': cs.alreadyInPackage,
                                    'border-l-sky-400 bg-sky-50/40': !selectedSubjectIds.has(cs.subjectId) && !cs.alreadyInPackage && cs.specialtyId,
                                    'border-l-purple-400 bg-purple-50/40': !selectedSubjectIds.has(cs.subjectId) && !cs.alreadyInPackage && cs.optionalGroupId,
                                    'border-l-transparent hover:bg-slate-50': !cs.alreadyInPackage && !selectedSubjectIds.has(cs.subjectId) && !cs.specialtyId && !cs.optionalGroupId,
                                }"
                                @click="!cs.alreadyInPackage && toggleSubject(cs)"
                            >
                                <input type="checkbox"
                                    :checked="selectedSubjectIds.has(cs.subjectId) || cs.alreadyInPackage"
                                    :disabled="cs.alreadyInPackage"
                                    class="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    @click.stop
                                    @change="!cs.alreadyInPackage && toggleSubject(cs)"
                                />
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-center gap-2">
                                        <span class="text-sm font-bold text-slate-800 uppercase">{{ cs.subjectName }}</span>
                                        <span v-if="cs.specialtyName" class="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-600 font-bold">{{ cs.specialtyName }}</span>
                                        <span v-if="cs.optionalGroupName" class="text-[9px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-600 font-bold">{{ cs.optionalGroupName }}</span>
                                        <span v-if="cs.alreadyInPackage" class="text-[9px] px-1.5 py-0.5 rounded bg-green-100 text-green-600 font-bold">EN PAQUETE</span>
                                    </div>
                                    <div class="text-[10px] text-slate-400 font-semibold space-x-2">
                                        <span>{{ cs.subjectCode }}</span>
                                        <span>|</span>
                                        <span>{{ cs.credits ?? 0 }} cr</span>
                                        <span>|</span>
                                        <span>HT: {{ cs.ht ?? 0 }}</span>
                                        <span>HP: {{ cs.hp ?? 0 }}</span>
                                        <span>|</span>
                                        <span class="text-orange-500 font-bold">Demanda: {{ cs.demand }} alumnos</span>
                                    </div>
                                </div>
                            </div>
                        </template>

                        <div v-if="curriculumSubjects.length === 0" class="px-4 py-8 text-center text-xs text-slate-400 uppercase font-bold">
                            Sin materias en el curriculum
                        </div>
                    </div>

                    <!-- MODO GRID (estilo StudyPlanEditor) -->
                    <div v-else class="p-6 overflow-x-auto">
                        <div
                            class="grid gap-3 mx-auto"
                            :style="{
                                gridTemplateColumns: `repeat(${maxSemester}, 150px)`,
                                width: 'max-content'
                            }"
                        >
                            <!-- Cabeceras -->
                            <div v-for="s in maxSemester" :key="'gh-'+s"
                                class="text-center font-black text-slate-400 pb-3 border-b-2 border-slate-200 uppercase tracking-tighter text-[11px] flex items-end justify-center h-10">
                                {{ s }}° Semestre
                            </div>

                            <!-- Filas de materias -->
                            <template v-for="row in maxRowsPerSemester" :key="'gr-'+row">
                                <template v-for="col in maxSemester" :key="'gc-'+col+'-'+row">
                                    <div class="w-[150px] h-[160px]">
                                        <div v-if="getGridItem(col, row)"
                                            class="w-full h-full border-2 rounded-xl flex flex-col overflow-hidden transition-all cursor-pointer group"
                                            :class="gridCardClass(getGridItem(col, row))"
                                            @click="!getGridItem(col, row).alreadyInPackage && toggleSubject(getGridItem(col, row))"
                                        >
                                            <!-- Checkbox + badges -->
                                            <div class="flex items-center justify-between px-2 pt-2">
                                                <input type="checkbox"
                                                    :checked="selectedSubjectIds.has(getGridItem(col, row).subjectId) || getGridItem(col, row).alreadyInPackage"
                                                    :disabled="getGridItem(col, row).alreadyInPackage"
                                                    class="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                    @click.stop
                                                    @change="!getGridItem(col, row).alreadyInPackage && toggleSubject(getGridItem(col, row))"
                                                />
                                                <span v-if="getGridItem(col, row).alreadyInPackage" class="text-[7px] px-1 py-0.5 rounded bg-green-100 text-green-600 font-black">PAQUETE</span>
                                                <span v-else-if="getGridItem(col, row).specialtyId" class="text-[7px] px-1 py-0.5 rounded bg-sky-100 text-sky-600 font-black">ESP</span>
                                                <span v-else-if="getGridItem(col, row).optionalGroupId" class="text-[7px] px-1 py-0.5 rounded bg-purple-100 text-purple-600 font-black">OPT</span>
                                            </div>
                                            <!-- Nombre y clave -->
                                            <div class="flex-grow flex flex-col justify-center items-center px-2 text-center">
                                                <h4 class="text-[10px] font-black text-slate-800 leading-tight uppercase tracking-tight mb-1 line-clamp-2">
                                                    {{ getGridItem(col, row).subjectName }}
                                                </h4>
                                                <div class="text-[11px] font-mono text-slate-500">
                                                    {{ getGridItem(col, row).subjectCode }}
                                                </div>
                                            </div>
                                            <!-- Footer técnico -->
                                            <div class="mt-auto border-t border-slate-200">
                                                <div class="grid grid-cols-3 text-center">
                                                    <div class="py-1 border-r border-slate-200">
                                                        <span class="text-[7px] text-slate-400 font-black block">HP</span>
                                                        <span class="text-[10px] font-bold text-slate-700">{{ getGridItem(col, row).hp ?? 0 }}</span>
                                                    </div>
                                                    <div class="py-1 border-r border-slate-200">
                                                        <span class="text-[7px] text-slate-400 font-black block">HT</span>
                                                        <span class="text-[10px] font-bold text-slate-700">{{ getGridItem(col, row).ht ?? 0 }}</span>
                                                    </div>
                                                    <div class="py-1">
                                                        <span class="text-[7px] text-slate-400 font-black block">CR</span>
                                                        <span class="text-[10px] font-bold text-slate-700">{{ getGridItem(col, row).credits ?? 0 }}</span>
                                                    </div>
                                                </div>
                                                <!-- Demanda -->
                                                <div class="text-[8px] text-center py-0.5 bg-slate-50 text-orange-500 font-bold border-t border-slate-200">
                                                    Demanda: {{ getGridItem(col, row).demand }}
                                                </div>
                                            </div>
                                        </div>
                                        <!-- Celda vacía -->
                                        <div v-else class="w-full h-full"></div>
                                    </div>
                                </template>
                            </template>
                        </div>

                        <div v-if="curriculumSubjects.length === 0" class="py-8 text-center text-xs text-slate-400 uppercase font-bold">
                            Sin materias en el curriculum
                        </div>
                    </div>
                </div>

                <!-- Botón agregar al paquete -->
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <button
                            v-if="packageItems.length > 0"
                            class="px-4 py-2.5 text-sm font-bold rounded-xl border-2 border-slate-200 hover:bg-slate-50 uppercase"
                            @click="view = 'package'"
                        >
                            Ver Paquete ({{ packageItems.length }})
                        </button>
                        <button
                            v-if="packageItems.length > 0 && isValidationPhaseActive && canApprove"
                            class="px-4 py-2.5 text-sm font-bold rounded-xl border-2 border-green-200 text-green-700 hover:bg-green-50 uppercase"
                            @click="view = 'validation'"
                        >
                            Validar ({{ approvalStats.pending }}/{{ approvalStats.total }})
                        </button>
                    </div>
                    <button
                        class="px-6 py-2.5 text-sm font-bold rounded-xl uppercase transition disabled:opacity-40"
                        :class="selectedSubjectIds.size > 0 ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-200 text-slate-400'"
                        :disabled="selectedSubjectIds.size === 0 || addingToPackage"
                        @click="addSelectedToPackage"
                    >
                        {{ addingToPackage ? 'Agregando...' : `Agregar al Paquete (${selectedSubjectIds.size})` }}
                    </button>
                </div>
            </div>

            <!-- Vista del paquete -->
            <div v-if="view === 'package'" class="space-y-4">
                <div class="bg-white border rounded-xl shadow-sm overflow-hidden">
                    <div class="bg-slate-50 border-b px-4 py-3 flex items-center justify-between">
                        <h2 class="text-sm font-bold text-slate-700 uppercase">Paquete de Materias</h2>
                        <span class="text-xs text-slate-400">{{ packageItems.length }} materias</span>
                    </div>

                    <!-- Header de tabla (solo lg+) -->
                    <div class="hidden lg:grid grid-cols-[1fr_80px_80px_80px_40px_40px] gap-2 px-4 py-2 bg-slate-100 border-b text-[10px] font-black text-slate-500 uppercase">
                        <span>Materia</span>
                        <span class="text-center">Sem Orig</span>
                        <span class="text-center">Semestre</span>
                        <span class="text-center">Grupos</span>
                        <span></span>
                        <span></span>
                    </div>

                    <div class="divide-y max-h-[60vh] overflow-y-auto">
                        <template v-for="(section, sectionKey) in groupedPackageItems" :key="sectionKey">
                            <!-- Header de sección -->
                            <div class="px-4 py-2 text-[10px] font-black uppercase tracking-wider sticky top-0 z-10"
                                :class="{
                                    'bg-slate-100 text-slate-500': sectionKey === 'common',
                                    'bg-sky-50 text-sky-600 border-l-4 border-sky-400': sectionKey.startsWith('specialty:'),
                                    'bg-purple-50 text-purple-600 border-l-4 border-purple-400': sectionKey.startsWith('optional:'),
                                }">
                                {{ section.label }} ({{ section.items.length }})
                            </div>

                            <div v-for="item in section.items" :key="item.id"
                                 class="px-4 py-3 hover:bg-slate-50 transition"
                                 :class="{ 'bg-amber-50/50': item.isRepeat }">
                                <div class="grid grid-cols-1 lg:grid-cols-[1fr_80px_80px_80px_40px_40px] gap-2 items-center">
                                    <!-- Materia info -->
                                    <div>
                                        <div class="flex items-center gap-2">
                                            <span class="text-sm font-bold text-slate-800 uppercase">{{ item.subject?.name ?? '—' }}</span>
                                            <span v-if="item.isRepeat" class="text-[8px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-600 font-black">REPETIDA</span>
                                        </div>
                                        <div class="text-[10px] text-slate-400 font-semibold space-x-2">
                                            <span>{{ item.subject?.officialCode }}</span>
                                            <span>|</span>
                                            <span class="text-orange-500 font-bold">Demanda: {{ item.demand }}</span>
                                            <span v-if="item.directorApproval" class="text-green-600 font-bold">| VoBo</span>
                                        </div>
                                    </div>
                                    <!-- Semestre original -->
                                    <div class="text-center">
                                        <label class="text-[10px] text-slate-400 lg:hidden font-bold">SEM ORIG</label>
                                        <span class="text-sm text-slate-500">{{ item.curriculum?.period ?? '—' }}</span>
                                    </div>
                                    <!-- Semestre destino -->
                                    <div>
                                        <label class="text-[10px] text-slate-400 lg:hidden font-bold">SEMESTRE</label>
                                        <input type="number" :value="item.targetSemester"
                                            min="1" max="15"
                                            class="w-full border rounded-lg px-2 py-1 text-sm text-center"
                                            @change="updateItem(item.id, { target_semester: Number(($event.target as HTMLInputElement).value), num_groups: item.numGroups })"
                                        />
                                    </div>
                                    <!-- Grupos -->
                                    <div>
                                        <label class="text-[10px] text-slate-400 lg:hidden font-bold">GRUPOS</label>
                                        <input type="number" :value="item.numGroups"
                                            min="1" max="20"
                                            class="w-full border rounded-lg px-2 py-1 text-sm text-center"
                                            @change="updateItem(item.id, { target_semester: item.targetSemester, num_groups: Number(($event.target as HTMLInputElement).value) })"
                                        />
                                    </div>
                                    <!-- Duplicar a otro semestre -->
                                    <div class="flex justify-center">
                                        <button class="text-blue-400 hover:text-blue-600 transition" @click="openDuplicateModal(item)" title="Agregar en otro semestre">
                                            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                                        </button>
                                    </div>
                                    <!-- Quitar -->
                                    <div class="flex justify-center">
                                        <button class="text-red-400 hover:text-red-600 transition" @click="removeFromPackage(item.id)" title="Quitar">
                                            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </template>

                        <div v-if="packageItems.length === 0" class="px-4 py-8 text-center text-xs text-slate-400 uppercase font-bold">
                            El paquete esta vacio. Selecciona materias del curriculum.
                        </div>
                    </div>
                </div>

                <button
                    class="px-4 py-2.5 text-sm font-bold rounded-xl border-2 border-slate-200 hover:bg-slate-50 uppercase"
                    @click="view = 'curriculum'"
                >
                    ← Volver a Seleccionar Materias
                </button>
            </div>

            <!-- Vista de validación -->
            <div v-if="view === 'validation'" class="space-y-4">
                <div class="bg-white border rounded-xl shadow-sm overflow-hidden">
                    <!-- Header con stats y acciones masivas -->
                    <div class="bg-slate-50 border-b px-4 py-3 flex items-center justify-between">
                        <div>
                            <h2 class="text-sm font-bold text-slate-700 uppercase">Validación del Paquete</h2>
                            <div class="flex items-center gap-3 mt-1">
                                <span class="text-[10px] font-bold text-green-600">{{ approvalStats.approved }} aprobadas</span>
                                <span class="text-[10px] font-bold text-amber-600">{{ approvalStats.pending }} pendientes</span>
                                <span class="text-[10px] text-slate-400">{{ approvalStats.total }} total</span>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <button v-if="approvalStats.pending > 0"
                                class="px-3 py-1.5 text-[10px] font-bold rounded-lg bg-green-600 text-white hover:bg-green-700 uppercase"
                                @click="approveAll">
                                Aprobar Todo
                            </button>
                            <button v-if="approvalStats.approved > 0"
                                class="px-3 py-1.5 text-[10px] font-bold rounded-lg border border-red-200 text-red-500 hover:bg-red-50 uppercase"
                                @click="revokeAll">
                                Revocar Todo
                            </button>
                        </div>
                    </div>

                    <!-- Barra de progreso -->
                    <div class="h-1.5 bg-slate-100">
                        <div class="h-full bg-green-500 transition-all duration-500"
                            :style="{ width: approvalStats.total ? (approvalStats.approved / approvalStats.total * 100) + '%' : '0%' }">
                        </div>
                    </div>

                    <!-- Header de tabla -->
                    <div class="hidden lg:grid grid-cols-[1fr_80px_80px_100px_1fr_100px] gap-2 px-4 py-2 bg-slate-100 border-b text-[10px] font-black text-slate-500 uppercase">
                        <span>Materia</span>
                        <span class="text-center">Semestre</span>
                        <span class="text-center">Grupos</span>
                        <span class="text-center">Estado</span>
                        <span>Notas</span>
                        <span class="text-center">Acción</span>
                    </div>

                    <div class="divide-y max-h-[60vh] overflow-y-auto">
                        <template v-for="(section, sectionKey) in groupedPackageItems" :key="'v-'+sectionKey">
                            <!-- Header de sección -->
                            <div class="px-4 py-2 text-[10px] font-black uppercase tracking-wider sticky top-0 z-10"
                                :class="{
                                    'bg-slate-100 text-slate-500': sectionKey === 'common',
                                    'bg-sky-50 text-sky-600 border-l-4 border-sky-400': String(sectionKey).startsWith('specialty:'),
                                    'bg-purple-50 text-purple-600 border-l-4 border-purple-400': String(sectionKey).startsWith('optional:'),
                                }">
                                {{ section.label }}
                            </div>

                            <div v-for="item in section.items" :key="'vi-'+item.id"
                                class="px-4 py-3 transition"
                                :class="item.directorApproval ? 'bg-green-50/50' : 'hover:bg-slate-50'">
                                <div class="grid grid-cols-1 lg:grid-cols-[1fr_80px_80px_100px_1fr_100px] gap-2 items-center">
                                    <!-- Materia -->
                                    <div>
                                        <div class="flex items-center gap-2">
                                            <span class="text-sm font-bold text-slate-800 uppercase">{{ item.subject?.name ?? '—' }}</span>
                                            <span v-if="item.isRepeat" class="text-[8px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-600 font-black">REPETIDA</span>
                                        </div>
                                        <div class="text-[10px] text-slate-400 font-semibold">
                                            {{ item.subject?.officialCode }} | Demanda: {{ item.demand }}
                                        </div>
                                    </div>
                                    <!-- Semestre -->
                                    <div class="text-center text-sm font-bold text-slate-600">{{ item.targetSemester }}</div>
                                    <!-- Grupos -->
                                    <div class="text-center text-sm font-bold text-slate-600">{{ item.numGroups }}</div>
                                    <!-- Estado -->
                                    <div class="flex justify-center">
                                        <span v-if="item.directorApproval"
                                            class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-700">
                                            <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                                            VoBo
                                        </span>
                                        <span v-else
                                            class="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-600">
                                            Pendiente
                                        </span>
                                    </div>
                                    <!-- Notas -->
                                    <div>
                                        <input type="text"
                                            :value="item.directorNotes ?? ''"
                                            placeholder="Notas del director..."
                                            class="w-full border rounded-lg px-2 py-1 text-xs text-slate-600 placeholder:text-slate-300"
                                            @change="approveItem(item.id, item.directorApproval, ($event.target as HTMLInputElement).value)"
                                        />
                                    </div>
                                    <!-- Acción -->
                                    <div class="flex justify-center gap-1">
                                        <button v-if="!item.directorApproval"
                                            class="px-2.5 py-1.5 text-[10px] font-bold rounded-lg bg-green-600 text-white hover:bg-green-700 uppercase disabled:opacity-50"
                                            :disabled="approvingId === item.id"
                                            @click="approveItem(item.id, true, item.directorNotes)">
                                            Aprobar
                                        </button>
                                        <button v-else
                                            class="px-2.5 py-1.5 text-[10px] font-bold rounded-lg border border-red-200 text-red-500 hover:bg-red-50 uppercase disabled:opacity-50"
                                            :disabled="approvingId === item.id"
                                            @click="approveItem(item.id, false, item.directorNotes)">
                                            Revocar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </template>

                        <div v-if="packageItems.length === 0" class="px-4 py-8 text-center text-xs text-slate-400 uppercase font-bold">
                            El paquete esta vacío.
                        </div>
                    </div>
                </div>

                <div class="flex items-center gap-2">
                    <button
                        class="px-4 py-2.5 text-sm font-bold rounded-xl border-2 border-slate-200 hover:bg-slate-50 uppercase"
                        @click="view = 'package'"
                    >
                        ← Volver al Paquete
                    </button>
                    <button
                        class="px-4 py-2.5 text-sm font-bold rounded-xl border-2 border-slate-200 hover:bg-slate-50 uppercase"
                        @click="view = 'curriculum'"
                    >
                        ← Volver a Seleccionar
                    </button>
                </div>
            </div>
        </template>

        <!-- Placeholder -->
        <div v-else-if="!configError" class="bg-white border rounded-xl shadow-sm p-12 text-center">
            <p class="text-sm text-slate-400 uppercase font-bold">
                Completa los filtros para gestionar el paquete de materias
            </p>
        </div>

        </template><!-- fin periodLocked -->

        <!-- Modal duplicar materia a otro semestre -->
        <div v-if="duplicateModal.open" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200">
                <div class="p-5 border-b bg-slate-50">
                    <h3 class="font-black uppercase text-sm tracking-tight text-slate-900">Agregar en otro semestre</h3>
                    <p class="text-[10px] text-slate-500 uppercase font-bold mt-1">{{ duplicateModal.item?.subject?.name }}</p>
                </div>
                <div class="p-6 space-y-4">
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Semestre destino</label>
                        <input type="number" v-model.number="duplicateModal.targetSemester"
                            min="1" max="15"
                            class="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none text-center" />
                    </div>
                    <p v-if="duplicateModal.error" class="text-xs text-red-500 font-semibold">{{ duplicateModal.error }}</p>
                    <div class="flex justify-end gap-2 pt-4 border-t">
                        <button type="button" @click="duplicateModal.open = false" class="px-4 py-2 text-xs font-bold text-slate-500 uppercase">Cancelar</button>
                        <button @click="confirmDuplicate" :disabled="duplicateModal.submitting"
                            class="px-6 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 uppercase disabled:opacity-50">
                            {{ duplicateModal.submitting ? 'Creando...' : 'Confirmar' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import PeriodSelector from '@/app/components/ui/form/PeriodSelector.vue'

/* ── State: Filtros ──────────────────────────────────────────────── */
const selectedPeriodId       = ref<number | null>(null)
const selectedCampusId       = ref<number | null>(null)
const selectedModalityTypeId = ref<number | null>(null)
const selectedStudyPlanId    = ref<number | null>(null)
const selectedSpecialtyId    = ref<number | null>(null)
const selectedOptionalGroupId = ref<number | null>(null)

const allCampuses      = ref<any[]>([])
const allModalityTypes = ref<any[]>([])
const modalities       = ref<any[]>([])
const studyPlans       = ref<any[]>([])
const specialties      = ref<any[]>([])
const optionalGroups   = ref<any[]>([])

interface ScaContext { isAdmin: boolean; careerIds: number[]|null; modalityIds: number[]|null; campusIds: number[]|null; modalityTypeIds: number[]|null }
const ctx = ref<ScaContext | null>(null)

const campuses = computed(() => {
    if (!ctx.value) return allCampuses.value
    if (ctx.value.isAdmin || !ctx.value.campusIds) return allCampuses.value
    return allCampuses.value.filter(c => ctx.value!.campusIds!.includes(c.id))
})

const modalityTypes = computed(() => {
    let types = allModalityTypes.value
    if (ctx.value && !ctx.value.isAdmin && ctx.value.modalityTypeIds) {
        types = types.filter(mt => ctx.value!.modalityTypeIds!.includes(mt.id))
    }
    if (selectedCampusId.value) {
        const typesInCampus = modalities.value
            .filter((m: any) => (m.campusId ?? m.campus_id) === selectedCampusId.value)
            .map((m: any) => m.modalityTypeId ?? m.modality_type_id)
        types = types.filter(mt => typesInCampus.includes(mt.id))
    }
    return types
})

const periodSelectorRef  = ref<InstanceType<typeof PeriodSelector> | null>(null)
const periodLocked       = ref(false)
const lockedPeriodName   = ref('')
const lockedPeriodStatus = ref('')

const STORAGE_KEY = 'sca_period'

function savePeriodToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
        id: selectedPeriodId.value,
        name: lockedPeriodName.value,
        status: lockedPeriodStatus.value,
    }))
}

function clearPeriodStorage() {
    localStorage.removeItem(STORAGE_KEY)
}

function restorePeriodFromStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return
        const saved = JSON.parse(raw)
        if (saved?.id) {
            selectedPeriodId.value = saved.id
            lockedPeriodName.value = saved.name ?? ''
            lockedPeriodStatus.value = saved.status ?? '—'
            periodLocked.value = true
        }
    } catch { /* corrupted data, ignore */ }
}

const resolvedModalityId = ref<number | null>(null)
const resolvedConfigId   = ref<number | null>(null)
const resolvedConfig     = ref<any>(null)
const configError        = ref<string | null>(null)
const unlockedByLateOpening = ref(false)

/* ── State: Curriculum & Package ─────────────────────────────────── */
const view                = ref<'curriculum' | 'package' | 'validation'>('curriculum')
const curriculumSubjects  = ref<any[]>([])
const loadingCurriculum   = ref(false)
const selectedSubjectIds  = ref(new Set<number>())
const addingToPackage     = ref(false)
const packageItems        = ref<any[]>([])
const displayMode         = ref<'list' | 'grid'>('list')
const canApprove          = ref(false)

/* ── Computed ────────────────────────────────────────────────────── */
const currentPeriodStatusLabel = computed(() => {
    if (periodLocked.value) return lockedPeriodStatus.value
    return periodSelectorRef.value?.selectedPeriod?.statusLabel ?? '—'
})

const periodStatusClass = computed(() => {
    const status = currentPeriodStatusLabel.value.toLowerCase()
    if (status.includes('activo'))     return 'border-green-300 bg-green-50 text-green-700'
    if (status.includes('planeaci'))   return 'border-amber-300 bg-amber-50 text-amber-700'
    if (status.includes('planeado'))   return 'border-blue-300 bg-blue-50 text-blue-700'
    if (status.includes('cerrado') || status.includes('finalizado')) return 'border-slate-300 bg-slate-100 text-slate-500'
    return 'border-slate-200 bg-slate-50 text-slate-600'
})

function toggleLock() {
    if (!periodLocked.value) {
        if (!selectedPeriodId.value) return
        const p = periodSelectorRef.value?.selectedPeriod
        lockedPeriodName.value = p?.name ?? 'SIN PERIODO'
        lockedPeriodStatus.value = p?.statusLabel ?? '—'
        periodLocked.value = true
        savePeriodToStorage()
    } else {
        periodLocked.value = false
        clearPeriodStorage()
        // Reset todo al desbloquear
        selectedCampusId.value = null
        selectedModalityTypeId.value = null
        selectedStudyPlanId.value = null
        selectedSpecialtyId.value = null
        selectedOptionalGroupId.value = null
        resolvedModalityId.value = null
        resolvedConfigId.value = null
        resolvedConfig.value = null
        configError.value = null
        curriculumSubjects.value = []
        packageItems.value = []
        studyPlans.value = []
    }
}

const studyPlansByCareer = computed(() => {
    const groups: Record<string, any[]> = {}
    for (const sp of studyPlans.value) {
        const career = sp.careerName ?? sp.name ?? 'SIN CARRERA'
        if (!groups[career]) groups[career] = []
        groups[career].push(sp)
    }
    return groups
})

const groupedSubjects = computed(() => {
    const groups: Record<number, any[]> = {}
    for (const cs of curriculumSubjects.value) {
        const sem = cs.curriculumPeriod ?? 0
        if (!groups[sem]) groups[sem] = []
        groups[sem].push(cs)
    }
    return groups
})

/* ── Package grouping ────────────────────────────────────────────── */
const groupedPackageItems = computed(() => {
    const sections: Record<string, { label: string; items: any[] }> = {}

    for (const item of packageItems.value) {
        const specId = item.curriculum?.specialtyId
        const optId = item.curriculum?.optionalGroupId

        if (specId) {
            const key = `specialty:${specId}`
            if (!sections[key]) {
                sections[key] = {
                    label: `Especialidad: ${item.curriculum?.specialtyName ?? 'Sin nombre'}`,
                    items: [],
                }
            }
            sections[key].items.push(item)
        } else if (optId) {
            const key = `optional:${optId}`
            if (!sections[key]) {
                sections[key] = {
                    label: `Optativas: ${item.curriculum?.optionalGroupName ?? 'Sin nombre'}`,
                    items: [],
                }
            }
            sections[key].items.push(item)
        } else {
            if (!sections['common']) {
                sections['common'] = { label: 'Materias Comunes', items: [] }
            }
            sections['common'].items.push(item)
        }
    }

    // Ordenar: comunes primero, luego especialidades, luego optativas
    const sorted: Record<string, { label: string; items: any[] }> = {}
    if (sections['common']) sorted['common'] = sections['common']
    for (const [k, v] of Object.entries(sections)) {
        if (k.startsWith('specialty:')) sorted[k] = v
    }
    for (const [k, v] of Object.entries(sections)) {
        if (k.startsWith('optional:')) sorted[k] = v
    }
    return sorted
})

/* ── Grid helpers ────────────────────────────────────────────────── */
const maxSemester = computed(() => {
    let max = 0
    for (const cs of curriculumSubjects.value) {
        if ((cs.curriculumPeriod ?? 0) > max) max = cs.curriculumPeriod
    }
    return max || 1
})

const maxRowsPerSemester = computed(() => {
    const counts: Record<number, number> = {}
    for (const cs of curriculumSubjects.value) {
        const sem = cs.curriculumPeriod ?? 0
        counts[sem] = (counts[sem] ?? 0) + 1
    }
    return Math.max(...Object.values(counts), 1)
})

function getGridItem(col: number, row: number) {
    const items = curriculumSubjects.value.filter((cs: any) => (cs.curriculumPeriod ?? 0) === col)
    return items[row - 1] ?? null
}

function gridCardClass(cs: any) {
    if (selectedSubjectIds.value.has(cs.subjectId)) return 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
    if (cs.alreadyInPackage) return 'border-green-300 bg-green-50/50 opacity-60 cursor-not-allowed'
    if (cs.specialtyId) return 'border-sky-300 bg-sky-50/30 hover:border-sky-400'
    if (cs.optionalGroupId) return 'border-purple-300 bg-purple-50/30 hover:border-purple-400'
    return 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-md'
}

/* ── Fetch data ──────────────────────────────────────────────────── */
async function fetchContext() {
    try {
        const { data } = await api.get(API.SCA_API.myContext)
        ctx.value = data
    } catch { ctx.value = { isAdmin: false, careerIds: [], modalityIds: [], campusIds: [], modalityTypeIds: [] } }
}

async function fetchCampuses() {
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.campuses.list, { params: { per_page: 100, status: 1 } })
        allCampuses.value = (data?.items ?? data?.data ?? data ?? []).map((c: any) => ({ id: c.id, name: c.name ?? c.shortName ?? `Campus #${c.id}` }))
    } catch { allCampuses.value = [] }
}

async function fetchModalityTypes() {
    try {
        const { data } = await api.get(API.SUPERADMIN_API.modalityTypes.list, { params: { per_page: 100 } })
        allModalityTypes.value = (data?.items ?? data?.data ?? data ?? []).map((mt: any) => ({ id: mt.id, name: mt.name ?? `Tipo #${mt.id}` }))
    } catch { allModalityTypes.value = [] }
}

async function fetchModalities() {
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.modalities.list, { params: { per_page: 200 } })
        modalities.value = data?.items ?? data?.data ?? data ?? []
    } catch { modalities.value = [] }
}

function resolveModality() {
    resolvedModalityId.value = null
    selectedStudyPlanId.value = null
    studyPlans.value = []
    configError.value = null
    resolvedConfigId.value = null

    if (!selectedCampusId.value || !selectedModalityTypeId.value) return

    const match = modalities.value.find((m: any) =>
        (m.campusId === selectedCampusId.value || m.campus_id === selectedCampusId.value) &&
        (m.modalityTypeId === selectedModalityTypeId.value || m.modality_type_id === selectedModalityTypeId.value)
    )

    if (match) {
        resolvedModalityId.value = match.id
        fetchStudyPlans()
    }
}

async function fetchStudyPlans() {
    if (!resolvedModalityId.value) return
    try {
        // Usar endpoint filtrado por contexto del usuario (CAREER_MANAGER → solo sus carreras)
        const { data } = await api.get(API.SCA_API.subjectPackages.allowedAcademicOffers, {
            params: { modality_id: resolvedModalityId.value }
        })
        const aoItems = Array.isArray(data) ? data : (data?.items ?? data?.data ?? [])

        const plans: any[] = []
        for (const ao of aoItems) {
            const aoStudyPlans = ao.studyPlans ?? ao.study_plans ?? []
            for (const aosp of aoStudyPlans) {
                // Solo study plans activos
                const linkActive = aosp.status === true || aosp.status === 1
                const sp = aosp.studyPlan ?? aosp.study_plan ?? aosp
                const planActive = sp?.is_active !== false && sp?.isActive !== false
                if (!linkActive || !planActive) continue

                const spId = sp.id ?? aosp.studyPlanId ?? aosp.study_plan_id
                if (spId && !plans.find((p: any) => p.id === spId)) {
                    plans.push({
                        id: spId,
                        name: sp.name ?? '',
                        officialCode: sp.officialCode ?? sp.official_code ?? '',
                        careerName: ao.career?.name ?? sp.career?.name ?? null,
                    })
                }
            }
        }
        studyPlans.value = plans
    } catch { studyPlans.value = [] }
}

async function resolveConfig() {
    resolvedConfigId.value = null
    resolvedConfig.value = null
    configError.value = null

    if (!selectedPeriodId.value || !resolvedModalityId.value) return

    try {
        const { data } = await api.get(API.SCA_API.academicLoadConfigs.list, {
            params: {
                per_page: 1,
                search: {
                    college_academic_period_id: selectedPeriodId.value,
                    modality_id: resolvedModalityId.value,
                },
            },
        })
        const items = data?.items ?? data?.data ?? []
        if (items.length === 0) {
            configError.value = 'No existe una configuración de carga académica para este periodo y modalidad.'
            return
        }
        const config = items[0]
        const phasePackageOpen = !!(config.phasePackage ?? config.phase_package)
        if (!phasePackageOpen) {
            // Si la fase está cerrada, el usuario aún puede entrar si tiene
            // una solicitud de apertura tardía APROBADA y ACTIVA para este
            // config. El backend ya valida igual, pero acá levantamos el
            // bloqueo para que la pantalla cargue.
            const hasLateOpening = await hasActiveLateOpeningForConfig(config.id)
            if (!hasLateOpening) {
                configError.value = 'La fase de Paquete de Materias no está habilitada y no cuenta con una apertura tardía aprobada.'
                return
            }
            unlockedByLateOpening.value = true
        } else {
            unlockedByLateOpening.value = false
        }
        resolvedConfigId.value = config.id
        resolvedConfig.value = config
    } catch {
        configError.value = 'Error al buscar la configuración de carga académica.'
    }
}

/**
 * Devuelve true si el usuario actual tiene una solicitud de apertura
 * tardía APROBADA y ACTIVA (no expirada, no completada) para este
 * configId. El endpoint /sca/late-opening filtra por usuario en backend
 * cuando no es admin.
 */
async function hasActiveLateOpeningForConfig(configId: number): Promise<boolean> {
    try {
        const { data } = await api.get(API.SCA_API.lateOpening.list, { params: { status: 'approved' } })
        const rows = Array.isArray(data) ? data : (data?.items ?? data?.data ?? [])
        return rows.some((r: any) =>
            (r.configId ?? r.config_id) === configId
            && r.status === 'approved'
            && (r.isActive ?? r.is_active)
        )
    } catch { return false }
}

async function fetchSpecialties() {
    if (!selectedStudyPlanId.value) { specialties.value = []; return }
    try {
        const { data } = await api.get(API.SUPERADMIN_API.specialties.list, {
            params: { per_page: 100, search: { study_plan_id: selectedStudyPlanId.value } }
        })
        specialties.value = (data?.items ?? data?.data ?? data ?? []).map((s: any) => ({ id: s.id, name: s.name }))
    } catch { specialties.value = [] }
}

async function fetchOptionalGroups() {
    if (!selectedStudyPlanId.value) { optionalGroups.value = []; return }
    try {
        const { data } = await api.get(API.SUPERADMIN_API.optionalGroups.list, {
            params: { per_page: 100, search: { study_plan_id: selectedStudyPlanId.value } }
        })
        optionalGroups.value = (data?.items ?? data?.data ?? data ?? []).map((og: any) => ({ id: og.id, name: og.name }))
    } catch { optionalGroups.value = [] }
}

async function fetchCurriculumSubjects() {
    if (!resolvedConfigId.value || !selectedStudyPlanId.value) return
    loadingCurriculum.value = true
    try {
        const params: Record<string, any> = {}
        if (selectedSpecialtyId.value) params.specialty_id = selectedSpecialtyId.value
        if (selectedOptionalGroupId.value) params.optional_group_id = selectedOptionalGroupId.value

        const { data } = await api.get(
            API.SCA_API.subjectPackages.curriculumSubjects(resolvedConfigId.value, selectedStudyPlanId.value),
            { params }
        )
        curriculumSubjects.value = data ?? []
    } catch { curriculumSubjects.value = [] }
    finally { loadingCurriculum.value = false }
}

async function fetchPackageItems() {
    if (!resolvedConfigId.value || !selectedStudyPlanId.value) return
    try {
        const { data } = await api.get(
            API.SCA_API.subjectPackages.list(resolvedConfigId.value, selectedStudyPlanId.value)
        )
        packageItems.value = data ?? []
    } catch { packageItems.value = [] }
}

/* ── Actions ─────────────────────────────────────────────────────── */
function toggleSubject(cs: any) {
    const newSet = new Set(selectedSubjectIds.value)
    if (newSet.has(cs.subjectId)) {
        newSet.delete(cs.subjectId)
    } else {
        newSet.add(cs.subjectId)
    }
    selectedSubjectIds.value = newSet
}

async function addSelectedToPackage() {
    if (!resolvedConfigId.value || !selectedStudyPlanId.value) return
    addingToPackage.value = true
    try {
        const items = curriculumSubjects.value
            .filter((cs: any) => selectedSubjectIds.value.has(cs.subjectId) && !cs.alreadyInPackage)
            .map((cs: any) => ({
                academic_load_config_id: resolvedConfigId.value,
                study_plan_id: selectedStudyPlanId.value,
                subject_id: cs.subjectId,
                curriculum_id: cs.curriculumId,
                // ?? cae solo en null/undefined; usamos || para tambien
                // capturar 0 (materias sin semestre asignado en el curriculum).
                // El backend exige target_semester >= 1.
                target_semester: cs.curriculumPeriod || 1,
                num_groups: 1,
                is_repeat: false,
                demand: cs.demand ?? 0,
            }))

        if (items.length > 0) {
            await api.post(API.SCA_API.subjectPackages.bulkCreate, { items })
        }

        selectedSubjectIds.value = new Set()
        await Promise.all([fetchCurriculumSubjects(), fetchPackageItems()])
        view.value = 'package'
    } catch (e: any) {
        console.error('Error al agregar:', e?.response?.data?.message ?? e)
    } finally { addingToPackage.value = false }
}

async function updateItem(id: number, payload: { target_semester: number; num_groups: number }) {
    try {
        await api.put(API.SCA_API.subjectPackages.update(id), payload)
        await fetchPackageItems()
    } catch (e: any) {
        console.error('Error al actualizar:', e?.response?.data?.message ?? e)
    }
}

async function removeFromPackage(id: number) {
    try {
        await api.delete(API.SCA_API.subjectPackages.delete(id))
        await Promise.all([fetchCurriculumSubjects(), fetchPackageItems()])
    } catch (e: any) {
        console.error('Error al quitar:', e?.response?.data?.message ?? e)
    }
}

/* ── Validation / Approval ───────────────────────────────────────── */
const isValidationPhaseActive = computed(() => {
    const c = resolvedConfig.value
    return !!(c?.phasePackageValidation ?? c?.phase_package_validation)
})

const approvalStats = computed(() => {
    const total = packageItems.value.length
    const approved = packageItems.value.filter((i: any) => i.directorApproval).length
    const pending = total - approved
    return { total, approved, pending }
})

const approvingId = ref<number | null>(null)

async function approveItem(id: number, approved: boolean, notes?: string) {
    approvingId.value = id
    try {
        await api.patch(API.SCA_API.subjectPackages.approve(id), { approved, notes: notes ?? null })
        await fetchPackageItems()
    } catch (e: any) {
        console.error('Error al aprobar:', e?.response?.data?.message ?? e)
    } finally {
        approvingId.value = null
    }
}

async function approveAll() {
    const pending = packageItems.value.filter((i: any) => !i.directorApproval)
    for (const item of pending) {
        await api.patch(API.SCA_API.subjectPackages.approve(item.id), { approved: true, notes: null })
    }
    await fetchPackageItems()
}

async function revokeAll() {
    const approved = packageItems.value.filter((i: any) => i.directorApproval)
    for (const item of approved) {
        await api.patch(API.SCA_API.subjectPackages.approve(item.id), { approved: false, notes: null })
    }
    await fetchPackageItems()
}

/* ── Duplicate to another semester ────────────────────────────────── */
const duplicateModal = reactive({
    open: false,
    item: null as any,
    targetSemester: 1,
    error: null as string | null,
    submitting: false,
})

function openDuplicateModal(item: any) {
    duplicateModal.item = item
    duplicateModal.targetSemester = (item.targetSemester ?? 1) + 1
    duplicateModal.error = null
    duplicateModal.submitting = false
    duplicateModal.open = true
}

async function confirmDuplicate() {
    if (!duplicateModal.item) return

    // Validar que no sea el mismo semestre que ya tiene
    const existingSemesters = packageItems.value
        .filter((p: any) => p.subjectId === duplicateModal.item.subjectId)
        .map((p: any) => p.targetSemester)

    if (existingSemesters.includes(duplicateModal.targetSemester)) {
        duplicateModal.error = `Esta materia ya existe en el semestre ${duplicateModal.targetSemester}.`
        return
    }

    duplicateModal.error = null
    duplicateModal.submitting = true
    try {
        await api.post(API.SCA_API.subjectPackages.duplicate(duplicateModal.item.id), {
            target_semester: duplicateModal.targetSemester,
        })
        duplicateModal.open = false
        await fetchPackageItems()
    } catch (e: any) {
        duplicateModal.error = e?.response?.data?.message ?? 'Error al duplicar.'
    } finally {
        duplicateModal.submitting = false
    }
}

/* ── Filter events ───────────────────────────────────────────────── */
function onPeriodChange() {
    resolvedConfigId.value = null
    configError.value = null
    packageItems.value = []
    curriculumSubjects.value = []
    if (selectedPeriodId.value && resolvedModalityId.value) {
        resolveConfig()
    }
}

function onCampusOrTypeChange() {
    selectedStudyPlanId.value = null
    selectedSpecialtyId.value = null
    selectedOptionalGroupId.value = null
    curriculumSubjects.value = []
    packageItems.value = []
    resolveModality()
}

async function onStudyPlanChange() {
    selectedSpecialtyId.value = null
    selectedOptionalGroupId.value = null
    curriculumSubjects.value = []
    packageItems.value = []
    selectedSubjectIds.value = new Set()
    view.value = 'curriculum'

    if (!selectedStudyPlanId.value || !resolvedModalityId.value || !selectedPeriodId.value) return

    await resolveConfig()
    if (resolvedConfigId.value) {
        fetchSpecialties()
        fetchOptionalGroups()
        fetchCurriculumSubjects()
        fetchPackageItems()
    }
}

/* ── Init ────────────────────────────────────────────────────────── */
async function checkCanApprove() {
    try {
        const { data } = await api.get(API.SCA_API.subjectPackages.canApprove)
        canApprove.value = data?.canApprove ?? false
    } catch { canApprove.value = false }
}

onMounted(() => {
    fetchContext()
    restorePeriodFromStorage()
    fetchCampuses()
    fetchModalityTypes()
    fetchModalities()
    checkCanApprove()
})
</script>
