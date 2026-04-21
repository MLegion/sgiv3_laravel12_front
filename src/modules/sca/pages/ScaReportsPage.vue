<template>
    <div class="space-y-5">
        <h1 class="text-xl font-semibold text-slate-800 uppercase">Reportes — Carga Académica</h1>

        <!-- Selector de Periodo con candado -->
        <div class="flex items-center gap-3">
            <PeriodSelector v-if="!periodLocked" ref="periodSelectorRef" v-model="selectedPeriodId" @update:model-value="onPeriodChange" label="" placeholder="SELECCIONE UN PERIODO" class="flex-1" />
            <div v-else class="flex-1 border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold uppercase bg-slate-50 text-slate-700">
                {{ lockedPeriodName }}
            </div>
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
        </div>

        <!-- Sin periodo -->
        <div v-if="!periodLocked" class="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl px-6 py-12 text-center">
            <p class="text-sm text-slate-500 font-semibold uppercase">Seleccione un periodo académico y bloquéelo para ver los reportes.</p>
        </div>

        <!-- Tabs -->
        <template v-if="periodLocked">
            <div class="flex border-b-2 border-slate-200 overflow-x-auto">
                <button
                    v-for="tab in tabs"
                    :key="tab.key"
                    class="px-5 py-3 text-sm font-bold uppercase whitespace-nowrap transition border-b-2 -mb-[2px]"
                    :class="activeTab === tab.key
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-400 hover:text-slate-600'"
                    @click="activeTab = tab.key"
                >
                    {{ tab.label }}
                </button>
            </div>

            <!-- ═══ Tab: Proyección Académica ═══ -->
            <div v-show="activeTab === 'proyeccion'" class="space-y-4">
                <!-- Filtros -->
                <div class="bg-white border rounded-xl shadow-sm p-4">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label class="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Campus</label>
                            <select v-model="proy.campusId" @change="onProyCampusChange"
                                class="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold border-slate-200 focus:border-blue-500 outline-none uppercase">
                                <option :value="null">-- SELECCIONAR --</option>
                                <option v-for="c in proyCampuses" :key="c.id" :value="c.id">{{ c.name }}</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Tipo Modalidad</label>
                            <select v-model="proy.modalityTypeId" @change="onProyModalityTypeChange"
                                class="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold border-slate-200 focus:border-blue-500 outline-none uppercase">
                                <option :value="null">-- SELECCIONAR --</option>
                                <option v-for="mt in proyModalityTypes" :key="mt.id" :value="mt.id">{{ mt.name }}</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Carrera</label>
                            <select v-model="proy.careerId" @change="onProyCareerChange"
                                class="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold border-slate-200 focus:border-blue-500 outline-none uppercase">
                                <option :value="null">-- SELECCIONAR --</option>
                                <option value="all">TODAS</option>
                                <option v-for="c in proyCareers" :key="c.id" :value="c.id">{{ c.name }}</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Contenedor inline del reporte -->
                <div v-if="proyPreviewVisible" class="bg-white border rounded-xl shadow-sm overflow-hidden">
                    <div class="bg-indigo-50 border-b px-4 py-3 flex items-center justify-between">
                        <span class="text-sm font-bold text-indigo-800 uppercase">
                            {{ proy.careerId === 'all' ? 'Proyección Académica — Todas las carreras' : 'Proyección Académica — Por Carrera' }}
                        </span>
                        <div class="flex items-center gap-2">
                            <button v-if="proyBlob"
                                class="px-3 py-1.5 text-xs font-bold rounded bg-emerald-600 text-white hover:bg-emerald-700"
                                @click="downloadProyBlob"
                            >⬇ DESCARGAR PDF</button>
                        </div>
                    </div>
                    <div v-if="proyGenerating" class="p-8 text-center">
                        <svg class="animate-spin mx-auto w-6 h-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                        </svg>
                        <p class="mt-2 text-xs text-slate-500">Generando reporte...</p>
                    </div>
                    <div v-if="proyError" class="p-4 text-sm text-red-600 bg-red-50">{{ proyError }}</div>
                    <!-- docx-preview render -->
                    <div ref="proyDocxHost" class="p-4 max-h-[700px] overflow-auto docx-preview-host"></div>
                    <!-- pdf iframe -->
                    <iframe v-if="proyPdfUrl" :src="proyPdfUrl" class="w-full h-[700px] border-0"></iframe>
                </div>
            </div>

            <!-- ═══ Tab: Solicitud de Materia ═══ -->
            <div v-show="activeTab === 'solicitud'" class="space-y-4">
                <!-- Filtros -->
                <div class="bg-white border rounded-xl shadow-sm p-4">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label class="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Campus</label>
                            <select v-model="sol.campusId" @change="onSolCampusChange"
                                class="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold border-slate-200 focus:border-blue-500 outline-none uppercase">
                                <option :value="null">-- SELECCIONAR --</option>
                                <option v-for="c in solCampuses" :key="c.id" :value="c.id">{{ c.name }}</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Tipo Modalidad</label>
                            <select v-model="sol.modalityTypeId" @change="onSolModalityTypeChange"
                                class="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold border-slate-200 focus:border-blue-500 outline-none uppercase">
                                <option :value="null">-- SELECCIONAR --</option>
                                <option v-for="mt in solModalityTypes" :key="mt.id" :value="mt.id">{{ mt.name }}</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Docente</label>
                            <select v-model="sol.teacherId" @change="onSolTeacherChange"
                                class="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold border-slate-200 focus:border-blue-500 outline-none uppercase"
                                :disabled="!solResolvedModalityId">
                                <option :value="null">-- SELECCIONAR --</option>
                                <option v-for="t in solTeachers" :key="t.id" :value="t.id">{{ t.name }}</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Contenedor inline -->
                <div v-if="solPreviewVisible" class="bg-white border rounded-xl shadow-sm overflow-hidden">
                    <div class="bg-indigo-50 border-b px-4 py-3 flex items-center justify-between">
                        <span class="text-sm font-bold text-indigo-800 uppercase">Solicitud de Materias</span>
                        <div class="flex items-center gap-2">
                            <button v-if="solBlob"
                                class="px-3 py-1.5 text-xs font-bold rounded bg-emerald-600 text-white hover:bg-emerald-700"
                                @click="downloadSolBlob"
                            >⬇ DESCARGAR PDF</button>
                        </div>
                    </div>
                    <div v-if="solGenerating" class="p-8 text-center">
                        <svg class="animate-spin mx-auto w-6 h-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                        </svg>
                        <p class="mt-2 text-xs text-slate-500">Generando reporte...</p>
                    </div>
                    <div v-if="solError" class="p-4 text-sm text-red-600 bg-red-50">{{ solError }}</div>
                    <iframe v-if="solPdfUrl" :src="solPdfUrl" class="w-full h-[700px] border-0"></iframe>
                </div>
            </div>

            <!-- ═══ Tab: Carga Académica ═══ -->
            <div v-show="activeTab === 'carga'" class="space-y-4">
                <!-- Filtros -->
                <div class="bg-white border rounded-xl shadow-sm p-4">
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label class="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Campus</label>
                            <select v-model="carga.campusId" @change="onCargaCampusChange"
                                class="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold border-slate-200 focus:border-blue-500 outline-none uppercase">
                                <option :value="null">-- SELECCIONAR --</option>
                                <option v-for="c in cargaCampuses" :key="c.id" :value="c.id">{{ c.name }}</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Tipo Modalidad</label>
                            <select v-model="carga.modalityTypeId" @change="onCargaModalityTypeChange"
                                class="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold border-slate-200 focus:border-blue-500 outline-none uppercase">
                                <option :value="null">-- SELECCIONAR --</option>
                                <option v-for="mt in cargaModalityTypes" :key="mt.id" :value="mt.id">{{ mt.name }}</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Carrera</label>
                            <select v-model="carga.careerId" @change="onCargaCareerChange"
                                class="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold border-slate-200 focus:border-blue-500 outline-none uppercase"
                                :disabled="!cargaResolvedModalityId">
                                <option :value="null">-- SELECCIONAR --</option>
                                <option value="all">TODAS</option>
                                <option v-for="c in cargaCareers" :key="c.id" :value="c.id">{{ c.name }}</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Categoría</label>
                            <select v-model="carga.category" @change="onCargaCategoryChange"
                                class="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold border-slate-200 focus:border-blue-500 outline-none uppercase"
                                :disabled="carga.careerId === null">
                                <option :value="null">-- SELECCIONAR --</option>
                                <option value="docente">POR DOCENTE</option>
                                <option value="grupo">POR GRUPO</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Contenedor inline -->
                <div v-if="cargaPreviewVisible" class="bg-white border rounded-xl shadow-sm overflow-hidden">
                    <div class="bg-indigo-50 border-b px-4 py-3 flex items-center justify-between">
                        <span class="text-sm font-bold text-indigo-800 uppercase">
                            Concentrado de Carga — {{ carga.category === 'docente' ? 'Por Docente' : 'Por Grupo' }}
                        </span>
                        <div class="flex items-center gap-2">
                            <button v-if="cargaBlob"
                                class="px-3 py-1.5 text-xs font-bold rounded bg-emerald-600 text-white hover:bg-emerald-700"
                                @click="downloadCargaBlob"
                            >⬇ DESCARGAR PDF</button>
                        </div>
                    </div>
                    <div v-if="cargaGenerating" class="p-8 text-center">
                        <svg class="animate-spin mx-auto w-6 h-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                        </svg>
                        <p class="mt-2 text-xs text-slate-500">Generando reporte...</p>
                    </div>
                    <div v-if="cargaError" class="p-4 text-sm text-red-600 bg-red-50">{{ cargaError }}</div>
                    <iframe v-if="cargaPdfUrl" :src="cargaPdfUrl" class="w-full h-[700px] border-0"></iframe>
                </div>
            </div>

            <!-- ═══ Tab: Oficio de Asignación ═══ -->
            <div v-show="activeTab === 'oficio'" class="space-y-4">
                <!-- Filtros -->
                <div class="bg-white border rounded-xl shadow-sm p-4">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label class="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Campus</label>
                            <select v-model="oficio.campusId" @change="onOficioCampusChange"
                                class="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold border-slate-200 focus:border-blue-500 outline-none uppercase">
                                <option :value="null">-- SELECCIONAR --</option>
                                <option v-for="c in oficioCampuses" :key="c.id" :value="c.id">{{ c.name }}</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Tipo Modalidad</label>
                            <select v-model="oficio.modalityTypeId" @change="onOficioModalityTypeChange"
                                class="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold border-slate-200 focus:border-blue-500 outline-none uppercase">
                                <option :value="null">-- SELECCIONAR --</option>
                                <option v-for="mt in oficioModalityTypes" :key="mt.id" :value="mt.id">{{ mt.name }}</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Carrera</label>
                            <select v-model="oficio.careerId" @change="onOficioCareerChange"
                                class="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold border-slate-200 focus:border-blue-500 outline-none uppercase"
                                :disabled="!oficioResolvedModalityId">
                                <option :value="null">-- SELECCIONAR --</option>
                                <option v-for="c in oficioCareers" :key="c.id" :value="c.id">{{ c.name }}</option>
                            </select>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div>
                            <label class="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Docente</label>
                            <select v-model="oficio.teacherId" @change="onOficioTeacherChange"
                                class="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold border-slate-200 focus:border-blue-500 outline-none uppercase"
                                :disabled="!oficio.careerId">
                                <option :value="null">-- SELECCIONAR --</option>
                                <option v-for="t in oficioTeachers" :key="t.id" :value="t.id">{{ t.name }}</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Folio</label>
                            <input v-model="oficio.folio" type="text" placeholder="Ej: ITSTB/DA/001/2026"
                                class="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold border-slate-200 focus:border-blue-500 outline-none uppercase"
                                :disabled="!oficio.teacherId" />
                        </div>
                        <div>
                            <label class="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Fecha</label>
                            <input v-model="oficio.fecha" type="date"
                                class="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold border-slate-200 focus:border-blue-500 outline-none"
                                :disabled="!oficio.teacherId" />
                        </div>
                    </div>
                    <!-- Botón generar -->
                    <div class="mt-4 flex justify-end">
                        <button
                            class="px-5 py-2 text-xs font-bold rounded-lg bg-red-600 text-white hover:bg-red-700 uppercase disabled:opacity-40"
                            :disabled="!oficioReady || oficioGenerating"
                            @click="generateOficioInline"
                        >GENERAR OFICIO</button>
                    </div>
                </div>

                <!-- Contenedor inline -->
                <div v-if="oficioPreviewVisible" class="bg-white border rounded-xl shadow-sm overflow-hidden">
                    <div class="bg-indigo-50 border-b px-4 py-3 flex items-center justify-between">
                        <span class="text-sm font-bold text-indigo-800 uppercase">Oficio de Asignación de Carga</span>
                        <div class="flex items-center gap-2">
                            <button v-if="oficioBlob"
                                class="px-3 py-1.5 text-xs font-bold rounded bg-emerald-600 text-white hover:bg-emerald-700"
                                @click="downloadOficioBlob"
                            >⬇ DESCARGAR PDF</button>
                        </div>
                    </div>
                    <div v-if="oficioGenerating" class="p-8 text-center">
                        <svg class="animate-spin mx-auto w-6 h-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                        </svg>
                        <p class="mt-2 text-xs text-slate-500">Generando oficio...</p>
                    </div>
                    <div v-if="oficioError" class="p-4 text-sm text-red-600 bg-red-50">{{ oficioError }}</div>
                    <iframe v-if="oficioPdfUrl" :src="oficioPdfUrl" class="w-full h-[700px] border-0"></iframe>
                </div>
            </div>

            <!-- ═══ Tab: Horario ═══ -->
            <div v-show="activeTab === 'horario'" class="space-y-4">
                <!-- Filtros -->
                <div class="bg-white border rounded-xl shadow-sm p-4">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label class="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Campus</label>
                            <select v-model="hor.campusId" @change="onHorCampusChange"
                                class="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold border-slate-200 focus:border-blue-500 outline-none uppercase">
                                <option :value="null">-- SELECCIONAR --</option>
                                <option v-for="c in horCampuses" :key="c.id" :value="c.id">{{ c.name }}</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Tipo Modalidad</label>
                            <select v-model="hor.modalityTypeId" @change="onHorModalityTypeChange"
                                class="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold border-slate-200 focus:border-blue-500 outline-none uppercase">
                                <option :value="null">-- SELECCIONAR --</option>
                                <option v-for="mt in horModalityTypes" :key="mt.id" :value="mt.id">{{ mt.name }}</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Carrera</label>
                            <select v-model="hor.careerId" @change="onHorCareerChange"
                                class="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold border-slate-200 focus:border-blue-500 outline-none uppercase"
                                :disabled="!horResolvedModalityId">
                                <option :value="null">-- SELECCIONAR --</option>
                                <option v-for="c in horCareers" :key="c.id" :value="c.id">{{ c.name }}</option>
                            </select>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4" v-if="hor.careerId">
                        <div>
                            <label class="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Filtro</label>
                            <select v-model="hor.filterType" @change="onHorFilterTypeChange"
                                class="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold border-slate-200 focus:border-blue-500 outline-none uppercase">
                                <option :value="null">-- SELECCIONAR --</option>
                                <option value="docente">DOCENTE</option>
                                <option value="grupo">GRUPO</option>
                                <option value="aula">AULA</option>
                            </select>
                        </div>
                        <div v-if="hor.filterType">
                            <label class="block text-[10px] font-black text-slate-400 uppercase mb-1.5">
                                {{ hor.filterType === 'docente' ? 'Docente' : hor.filterType === 'grupo' ? 'Grupo' : 'Aula' }}
                            </label>
                            <select v-model="hor.filterValue" @change="onHorFilterValueChange"
                                class="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold border-slate-200 focus:border-blue-500 outline-none uppercase">
                                <option :value="null">-- SELECCIONAR --</option>
                                <option v-for="opt in horFilterOptions" :key="opt.id" :value="opt.id">{{ opt.name }}</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Contenedor inline -->
                <div v-if="horPreviewVisible" class="bg-white border rounded-xl shadow-sm overflow-hidden">
                    <div class="bg-indigo-50 border-b px-4 py-3 flex items-center justify-between">
                        <span class="text-sm font-bold text-indigo-800 uppercase">
                            Horario — {{ hor.filterType === 'docente' ? 'Docente' : hor.filterType === 'grupo' ? 'Grupo' : 'Aula' }}
                        </span>
                        <div class="flex items-center gap-2">
                            <button v-if="horBlob"
                                class="px-3 py-1.5 text-xs font-bold rounded bg-emerald-600 text-white hover:bg-emerald-700"
                                @click="downloadHorBlob"
                            >⬇ DESCARGAR PDF</button>
                        </div>
                    </div>
                    <div v-if="horGenerating" class="p-8 text-center">
                        <svg class="animate-spin mx-auto w-6 h-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                        </svg>
                        <p class="mt-2 text-xs text-slate-500">Generando horario...</p>
                    </div>
                    <div v-if="horError" class="p-4 text-sm text-red-600 bg-red-50">{{ horError }}</div>
                    <iframe v-if="horPdfUrl" :src="horPdfUrl" class="w-full h-[700px] border-0"></iframe>
                </div>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import { renderAsync } from 'docx-preview'
import PeriodSelector from '@/app/components/ui/form/PeriodSelector.vue'
import ReportCard from '@/modules/sca/components/ReportCard.vue'
import { useReportGenerator } from '@/modules/reports/composables/useReportGenerator'

/* ── Contexto del usuario ──────────────────────────────────────────── */
interface ScaContext {
    isAdmin:         boolean
    careerIds:       number[] | null
    modalityIds:     number[] | null
    campusIds:       number[] | null
    modalityTypeIds: number[] | null
}
const ctx = ref<ScaContext | null>(null)

/* ── Datos de referencia ───────────────────────────────────────────── */
const allCampuses      = ref<any[]>([])
const allModalityTypes = ref<any[]>([])
const allModalities    = ref<any[]>([])
const allCareers       = ref<any[]>([])

/* ── Period + Tab ──────────────────────────────────────────────────── */
const selectedPeriodId   = ref<number | null>(null)
const periodSelectorRef  = ref<InstanceType<typeof PeriodSelector> | null>(null)
const periodLocked       = ref(false)
const lockedPeriodName   = ref('')
const activeTab          = ref('proyeccion')

const STORAGE_KEY = 'sca_period'

function savePeriodToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: selectedPeriodId.value, name: lockedPeriodName.value }))
}
function clearPeriodStorage() { localStorage.removeItem(STORAGE_KEY) }

function restorePeriodFromStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return
        const saved = JSON.parse(raw)
        if (saved?.id) {
            selectedPeriodId.value = saved.id
            lockedPeriodName.value = saved.name ?? ''
            periodLocked.value = true
        }
    } catch { /* ignore */ }
}

function toggleLock() {
    if (!periodLocked.value) {
        if (!selectedPeriodId.value) return
        const p = periodSelectorRef.value?.selectedPeriod
        lockedPeriodName.value = p?.name ?? 'SIN PERIODO'
        periodLocked.value = true
        savePeriodToStorage()
    } else {
        periodLocked.value = false
        clearPeriodStorage()
        resetFilters()
    }
}

function onPeriodChange() {
    resetFilters()
}

function resetFilters() {
    proy.campusId = null
    proy.modalityTypeId = null
    proy.careerId = null
    closeProyPreview()
}

const tabs = [
    { key: 'proyeccion', label: 'Proyección Académica' },
    { key: 'solicitud',  label: 'Solicitud de Materia' },
    { key: 'carga',      label: 'Carga Académica' },
    { key: 'oficio',     label: 'Oficio de Asignación' },
    { key: 'horario',    label: 'Horario' },
]

interface ReportDef { code: string; label: string; description: string }

const reportsByTab: Record<string, ReportDef[]> = {
    proyeccion: [
        { code: 'F0003', label: 'Proyección Académica',             description: 'Proyección general de la carga académica del periodo.' },
        { code: 'F0004', label: 'Proyección Académica por Carrera', description: 'Proyección desglosada por carrera.' },
    ],
    solicitud: [
        { code: 'F0009', label: 'Solicitud de Materias', description: 'Reporte de solicitud de materias del docente.' },
    ],
    carga: [
        { code: 'F0005', label: 'Concentrado de Carga — Docente', description: 'Carga académica asignada por docente.' },
        { code: 'F0006', label: 'Concentrado de Carga — Grupo',   description: 'Carga académica asignada por grupo.' },
    ],
    oficio: [
        { code: 'F0007', label: 'Oficio de Asignación de Carga', description: 'Oficio oficial de asignación de carga académica.' },
    ],
    horario: [
        { code: 'F0001', label: 'Horario Escolarizado',              description: 'Horario individual del docente — modalidad escolarizada.' },
        { code: 'F0002', label: 'Horario Semi Escolarizado',         description: 'Horario individual del docente — modalidad semi escolarizada.' },
        { code: 'F0010', label: 'Horario Escolarizado — Grupo',      description: 'Horario por grupo.' },
        { code: 'F0011', label: 'Horario Escolarizado — Aula',       description: 'Horario por aula.' },
        { code: 'F0012', label: 'Horario — Alumno',                  description: 'Horario individual del alumno.' },
    ],
}

const baseParams = computed(() => {
    const p: Record<string, unknown> = {}
    if (selectedPeriodId.value) p.period_id = selectedPeriodId.value
    return p
})

/* ═══════════════════════════ Tab: Proyección ═══════════════════════ */

const proy = reactive({
    campusId:       null as number | null,
    modalityTypeId: null as number | null,
    careerId:       null as string | number | null,   // 'all' | number | null
})

const proyCampuses = computed(() => {
    if (!ctx.value) return []
    if (ctx.value.isAdmin || !ctx.value.campusIds) return allCampuses.value
    return allCampuses.value.filter(c => ctx.value!.campusIds!.includes(c.id))
})

const proyModalityTypes = computed(() => {
    if (!ctx.value) return []
    let types = allModalityTypes.value

    if (!ctx.value.isAdmin && ctx.value.modalityTypeIds) {
        types = types.filter(mt => ctx.value!.modalityTypeIds!.includes(mt.id))
    }
    if (proy.campusId) {
        const typesInCampus = allModalities.value
            .filter((m: any) => (m.campusId ?? m.campus_id) === proy.campusId)
            .map((m: any) => m.modalityTypeId ?? m.modality_type_id)
        types = types.filter(mt => typesInCampus.includes(mt.id))
    }
    return types
})

const resolvedModalityId = computed(() => {
    if (!proy.campusId || !proy.modalityTypeId) return null
    const match = allModalities.value.find((m: any) =>
        (m.campusId ?? m.campus_id) === proy.campusId &&
        (m.modalityTypeId ?? m.modality_type_id) === proy.modalityTypeId
    )
    return match?.id ?? null
})

const proyCareers = computed(() => {
    if (!resolvedModalityId.value) return []
    let careers = allCareers.value.filter((c: any) => c.modalityId === resolvedModalityId.value)
    if (!ctx.value?.isAdmin && ctx.value?.careerIds) {
        careers = careers.filter(c => ctx.value!.careerIds!.includes(c.careerId))
    }
    return careers
})

const proyReady = computed(() => !!(proy.campusId && proy.modalityTypeId && proy.careerId !== null))

function onProyCampusChange() {
    proy.modalityTypeId = null
    proy.careerId = null
    closeProyPreview()
}
function onProyModalityTypeChange() {
    proy.careerId = null
    closeProyPreview()
    if (resolvedModalityId.value) fetchCareersForModality()
}
function onProyCareerChange() {
    closeProyPreview()
    if (proy.careerId !== null) {
        const code = proy.careerId === 'all' ? 'F0003' : 'F0004'
        void generateProyInline(code, 'pdf')
    }
}

/* ── Generación inline ──────────────────────────────────────────── */
const { generate, generatePdf } = useReportGenerator()
const proyGenerating     = ref(false)
const proyPreviewVisible = ref(false)
const proyBlob           = ref<Blob | null>(null)
const proyFormat         = ref<'pdf' | 'docx'>('pdf')
const proyPdfUrl         = ref<string | null>(null)
const proyDocxHost       = ref<HTMLElement | null>(null)
const proyError          = ref<string | null>(null)

async function generateProyInline(code: string, format: 'pdf' | 'docx') {
    proyError.value = null
    proyPreviewVisible.value = true
    proyGenerating.value = true
    proyFormat.value = format

    if (proyPdfUrl.value) { URL.revokeObjectURL(proyPdfUrl.value); proyPdfUrl.value = null }
    if (proyDocxHost.value) proyDocxHost.value.innerHTML = ''

    const params: Record<string, unknown> = {
        period_id:   selectedPeriodId.value,
        modality_id: resolvedModalityId.value,
    }
    if (proy.careerId !== 'all' && proy.careerId !== null) {
        params.career_id = proy.careerId
    }

    try {
        if (format === 'pdf') {
            const { blob } = await generatePdf({ reportCode: code, params })
            proyBlob.value = blob
            proyPdfUrl.value = URL.createObjectURL(blob)
        } else {
            const { blob } = await generate({ reportCode: code, params })
            proyBlob.value = blob
            await nextTick()
            if (proyDocxHost.value) {
                proyDocxHost.value.innerHTML = ''
                await renderAsync(blob, proyDocxHost.value, undefined, {
                    className: 'docx-preview', inWrapper: true, breakPages: true,
                    experimental: true, useBase64URL: true,
                })
            }
        }
    } catch (e: any) {
        proyError.value = e?.message ?? 'Error al generar el reporte.'
    } finally {
        proyGenerating.value = false
    }
}

function downloadProyBlob() {
    if (!proyBlob.value) return
    const ext = proyFormat.value
    const url = URL.createObjectURL(proyBlob.value)
    const a = document.createElement('a')
    a.href = url
    a.download = `proyeccion.${ext}`
    a.click()
    URL.revokeObjectURL(url)
}

function closeProyPreview() {
    proyPreviewVisible.value = false
    proyBlob.value = null
    proyError.value = null
    if (proyPdfUrl.value) { URL.revokeObjectURL(proyPdfUrl.value); proyPdfUrl.value = null }
    if (proyDocxHost.value) proyDocxHost.value.innerHTML = ''
}

/* ═══════════════════════════ Tab: Horario ═════════════════════════ */

const hor = reactive({
    campusId:       null as number | null,
    modalityTypeId: null as number | null,
    careerId:       null as number | null,
    filterType:     null as string | null,   // 'docente' | 'grupo' | 'aula'
    filterValue:    null as number | null,
})

const horCareers       = ref<any[]>([])
const horFilterOptions = ref<any[]>([])
const horConfigId      = ref<number | null>(null)

const horCampuses = computed(() => {
    if (!ctx.value) return []
    if (ctx.value.isAdmin || !ctx.value.campusIds) return allCampuses.value
    return allCampuses.value.filter(c => ctx.value!.campusIds!.includes(c.id))
})

const horModalityTypes = computed(() => {
    if (!ctx.value) return []
    let types = allModalityTypes.value
    if (!ctx.value.isAdmin && ctx.value.modalityTypeIds) {
        types = types.filter(mt => ctx.value!.modalityTypeIds!.includes(mt.id))
    }
    if (hor.campusId) {
        const typesInCampus = allModalities.value
            .filter((m: any) => (m.campusId ?? m.campus_id) === hor.campusId)
            .map((m: any) => m.modalityTypeId ?? m.modality_type_id)
        types = types.filter(mt => typesInCampus.includes(mt.id))
    }
    return types
})

const horResolvedModalityId = computed(() => {
    if (!hor.campusId || !hor.modalityTypeId) return null
    const match = allModalities.value.find((m: any) =>
        (m.campusId ?? m.campus_id) === hor.campusId &&
        (m.modalityTypeId ?? m.modality_type_id) === hor.modalityTypeId
    )
    return match?.id ?? null
})

const horPreviewVisible = ref(false)
const horGenerating     = ref(false)
const horBlob           = ref<Blob | null>(null)
const horPdfUrl         = ref<string | null>(null)
const horError          = ref<string | null>(null)

function onHorCampusChange() {
    hor.modalityTypeId = null
    hor.careerId = null
    hor.filterType = null
    hor.filterValue = null
    horCareers.value = []
    horFilterOptions.value = []
    horConfigId.value = null
    closeHorPreview()
}

function onHorModalityTypeChange() {
    hor.careerId = null
    hor.filterType = null
    hor.filterValue = null
    horCareers.value = []
    horFilterOptions.value = []
    horConfigId.value = null
    closeHorPreview()
    if (horResolvedModalityId.value) {
        fetchHorCareers()
        resolveHorConfig()
    }
}

function onHorCareerChange() {
    hor.filterType = null
    hor.filterValue = null
    horFilterOptions.value = []
    closeHorPreview()
}

function onHorFilterTypeChange() {
    hor.filterValue = null
    horFilterOptions.value = []
    closeHorPreview()
    if (hor.filterType) fetchHorFilterOptions()
}

function onHorFilterValueChange() {
    closeHorPreview()
    if (hor.filterValue !== null) {
        void generateHorInline()
    }
}

async function fetchHorCareers() {
    if (!horResolvedModalityId.value) return
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.academicOffers.list, {
            params: { per_page: 200, search: { modality_id: horResolvedModalityId.value } },
        })
        const offers = data?.items ?? data?.data ?? data ?? []
        const seen = new Set<number>()
        let careers = offers
            .map((o: any) => ({
                id:       o.id,
                careerId: o.careerId ?? o.career_id,
                name:     o.career?.name ?? o.careerName ?? `Carrera #${o.careerId ?? o.career_id}`,
            }))
            .filter((c: any) => { if (seen.has(c.careerId)) return false; seen.add(c.careerId); return true })
        if (!ctx.value?.isAdmin && ctx.value?.careerIds) {
            careers = careers.filter((c: any) => ctx.value!.careerIds!.includes(c.careerId))
        }
        horCareers.value = careers
    } catch { horCareers.value = [] }
}

async function resolveHorConfig() {
    horConfigId.value = null
    if (!selectedPeriodId.value || !horResolvedModalityId.value) return
    try {
        const { data } = await api.get(API.SCA_API.academicLoadConfigs.list, {
            params: { per_page: 1, search: { college_academic_period_id: selectedPeriodId.value, modality_id: horResolvedModalityId.value } },
        })
        const items = data?.items ?? data?.data ?? []
        if (items.length > 0) horConfigId.value = items[0].id
    } catch { /* silent */ }
}

async function fetchHorFilterOptions() {
    horFilterOptions.value = []
    try {
        if (hor.filterType === 'docente') {
            const { data } = await api.get(API.SCA_API.teachers.list, { params: { per_page: 500 } })
            const items = data?.items ?? data?.data ?? data ?? []
            horFilterOptions.value = items.map((t: any) => ({
                id:   t.id,
                name: t.employeeName ?? t.employee_name ?? t.name ?? `Docente #${t.id}`,
            }))
        } else if (hor.filterType === 'grupo' && horConfigId.value) {
            const { data } = await api.get(API.SCA_API.groups.list(horConfigId.value))
            const items = Array.isArray(data) ? data : (data?.items ?? data?.data ?? [])
            horFilterOptions.value = items.map((g: any) => ({
                id:   g.id,
                name: g.name ?? g.groupName ?? `Grupo #${g.id}`,
            }))
        } else if (hor.filterType === 'aula') {
            const { data } = await api.get(API.SCHOOL_SERVICES_API.places.list, { params: { per_page: 200 } })
            const items = data?.items ?? data?.data ?? data ?? []
            horFilterOptions.value = items.map((p: any) => ({
                id:   p.id,
                name: p.name ?? p.shortName ?? `Aula #${p.id}`,
            }))
        }
    } catch { horFilterOptions.value = [] }
}

function isSemiEscolarizado(): boolean {
    if (!hor.modalityTypeId) return false
    const mt = allModalityTypes.value.find((t: any) => t.id === hor.modalityTypeId)
    return mt ? (mt.name ?? '').toLowerCase().includes('semi') : false
}

function horReportCode(): string {
    if (hor.filterType === 'docente') return isSemiEscolarizado() ? 'F0002' : 'F0001'
    if (hor.filterType === 'grupo')   return 'F0010'
    if (hor.filterType === 'aula')    return 'F0011'
    return 'F0001'
}

function horParamKey(): string {
    switch (hor.filterType) {
        case 'docente': return 'teacher_id'
        case 'grupo':   return 'group_id'
        case 'aula':    return 'place_id'
        default:        return 'teacher_id'
    }
}

async function generateHorInline() {
    horError.value = null
    horPreviewVisible.value = true
    horGenerating.value = true
    if (horPdfUrl.value) { URL.revokeObjectURL(horPdfUrl.value); horPdfUrl.value = null }

    const params: Record<string, unknown> = {
        period_id:   selectedPeriodId.value,
        modality_id: horResolvedModalityId.value,
        career_id:   hor.careerId,
        [horParamKey()]: hor.filterValue,
    }

    try {
        const { blob } = await generatePdf({ reportCode: horReportCode(), params })
        horBlob.value = blob
        horPdfUrl.value = URL.createObjectURL(blob)
    } catch (e: any) {
        horError.value = e?.message ?? 'Error al generar el horario.'
    } finally {
        horGenerating.value = false
    }
}

function downloadHorBlob() {
    if (!horBlob.value) return
    const url = URL.createObjectURL(horBlob.value)
    const a = document.createElement('a')
    a.href = url
    a.download = `horario_${hor.filterType}.pdf`
    a.click()
    URL.revokeObjectURL(url)
}

function closeHorPreview() {
    horPreviewVisible.value = false
    horBlob.value = null
    horError.value = null
    if (horPdfUrl.value) { URL.revokeObjectURL(horPdfUrl.value); horPdfUrl.value = null }
}

/* ═══════════════════════════ Tab: Carga Académica ═════════════════ */

const carga = reactive({
    campusId:       null as number | null,
    modalityTypeId: null as number | null,
    careerId:       null as string | number | null,
    category:       null as string | null,   // 'docente' | 'grupo'
})

const cargaCareers = ref<any[]>([])

const cargaCampuses = computed(() => {
    if (!ctx.value) return []
    if (ctx.value.isAdmin || !ctx.value.campusIds) return allCampuses.value
    return allCampuses.value.filter(c => ctx.value!.campusIds!.includes(c.id))
})

const cargaModalityTypes = computed(() => {
    if (!ctx.value) return []
    let types = allModalityTypes.value
    if (!ctx.value.isAdmin && ctx.value.modalityTypeIds) {
        types = types.filter(mt => ctx.value!.modalityTypeIds!.includes(mt.id))
    }
    if (carga.campusId) {
        const typesInCampus = allModalities.value
            .filter((m: any) => (m.campusId ?? m.campus_id) === carga.campusId)
            .map((m: any) => m.modalityTypeId ?? m.modality_type_id)
        types = types.filter(mt => typesInCampus.includes(mt.id))
    }
    return types
})

const cargaResolvedModalityId = computed(() => {
    if (!carga.campusId || !carga.modalityTypeId) return null
    const match = allModalities.value.find((m: any) =>
        (m.campusId ?? m.campus_id) === carga.campusId &&
        (m.modalityTypeId ?? m.modality_type_id) === carga.modalityTypeId
    )
    return match?.id ?? null
})

const cargaPreviewVisible = ref(false)
const cargaGenerating     = ref(false)
const cargaBlob           = ref<Blob | null>(null)
const cargaPdfUrl         = ref<string | null>(null)
const cargaError          = ref<string | null>(null)

function onCargaCampusChange() {
    carga.modalityTypeId = null
    carga.careerId = null
    carga.category = null
    cargaCareers.value = []
    closeCargaPreview()
}

function onCargaModalityTypeChange() {
    carga.careerId = null
    carga.category = null
    cargaCareers.value = []
    closeCargaPreview()
    if (cargaResolvedModalityId.value) fetchCargaCareers()
}

function onCargaCareerChange() {
    carga.category = null
    closeCargaPreview()
}

function onCargaCategoryChange() {
    closeCargaPreview()
    if (carga.category && carga.careerId !== null) {
        const code = carga.category === 'docente' ? 'F0005' : 'F0006'
        void generateCargaInline(code)
    }
}

async function fetchCargaCareers() {
    if (!cargaResolvedModalityId.value) return
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.academicOffers.list, {
            params: { per_page: 200, search: { modality_id: cargaResolvedModalityId.value } },
        })
        const offers = data?.items ?? data?.data ?? data ?? []
        const seen = new Set<number>()
        let careers = offers
            .map((o: any) => ({
                id:         o.id,
                careerId:   o.careerId ?? o.career_id,
                name:       o.career?.name ?? o.careerName ?? `Carrera #${o.careerId ?? o.career_id}`,
                modalityId: o.modalityId ?? o.modality_id,
            }))
            .filter((c: any) => { if (seen.has(c.careerId)) return false; seen.add(c.careerId); return true })
        if (!ctx.value?.isAdmin && ctx.value?.careerIds) {
            careers = careers.filter((c: any) => ctx.value!.careerIds!.includes(c.careerId))
        }
        cargaCareers.value = careers
    } catch { cargaCareers.value = [] }
}

async function generateCargaInline(code: string) {
    cargaError.value = null
    cargaPreviewVisible.value = true
    cargaGenerating.value = true
    if (cargaPdfUrl.value) { URL.revokeObjectURL(cargaPdfUrl.value); cargaPdfUrl.value = null }

    const params: Record<string, unknown> = {
        period_id:   selectedPeriodId.value,
        modality_id: cargaResolvedModalityId.value,
    }
    if (carga.careerId !== 'all' && carga.careerId !== null) {
        params.career_id = carga.careerId
    }

    try {
        const { blob } = await generatePdf({ reportCode: code, params })
        cargaBlob.value = blob
        cargaPdfUrl.value = URL.createObjectURL(blob)
    } catch (e: any) {
        cargaError.value = e?.message ?? 'Error al generar el reporte.'
    } finally {
        cargaGenerating.value = false
    }
}

function downloadCargaBlob() {
    if (!cargaBlob.value) return
    const url = URL.createObjectURL(cargaBlob.value)
    const a = document.createElement('a')
    a.href = url
    a.download = `carga_academica_${carga.category}.pdf`
    a.click()
    URL.revokeObjectURL(url)
}

function closeCargaPreview() {
    cargaPreviewVisible.value = false
    cargaBlob.value = null
    cargaError.value = null
    if (cargaPdfUrl.value) { URL.revokeObjectURL(cargaPdfUrl.value); cargaPdfUrl.value = null }
}

/* ═══════════════════════════ Tab: Oficio de Asignación ════════════ */

const oficio = reactive({
    campusId:       null as number | null,
    modalityTypeId: null as number | null,
    careerId:       null as number | null,
    teacherId:      null as number | null,
    folio:          '',
    fecha:          new Date().toISOString().slice(0, 10),
})

const oficioCareers  = ref<any[]>([])
const oficioTeachers = ref<any[]>([])

const oficioCampuses = computed(() => {
    if (!ctx.value) return []
    if (ctx.value.isAdmin || !ctx.value.campusIds) return allCampuses.value
    return allCampuses.value.filter(c => ctx.value!.campusIds!.includes(c.id))
})

const oficioModalityTypes = computed(() => {
    if (!ctx.value) return []
    let types = allModalityTypes.value
    if (!ctx.value.isAdmin && ctx.value.modalityTypeIds) {
        types = types.filter(mt => ctx.value!.modalityTypeIds!.includes(mt.id))
    }
    if (oficio.campusId) {
        const typesInCampus = allModalities.value
            .filter((m: any) => (m.campusId ?? m.campus_id) === oficio.campusId)
            .map((m: any) => m.modalityTypeId ?? m.modality_type_id)
        types = types.filter(mt => typesInCampus.includes(mt.id))
    }
    return types
})

const oficioResolvedModalityId = computed(() => {
    if (!oficio.campusId || !oficio.modalityTypeId) return null
    const match = allModalities.value.find((m: any) =>
        (m.campusId ?? m.campus_id) === oficio.campusId &&
        (m.modalityTypeId ?? m.modality_type_id) === oficio.modalityTypeId
    )
    return match?.id ?? null
})

const oficioReady = computed(() =>
    !!(oficio.teacherId && oficio.folio.trim() && oficio.fecha)
)

const oficioPreviewVisible = ref(false)
const oficioGenerating     = ref(false)
const oficioBlob           = ref<Blob | null>(null)
const oficioPdfUrl         = ref<string | null>(null)
const oficioError          = ref<string | null>(null)

function onOficioCampusChange() {
    oficio.modalityTypeId = null
    oficio.careerId = null
    oficio.teacherId = null
    oficioCareers.value = []
    oficioTeachers.value = []
    closeOficioPreview()
}

function onOficioModalityTypeChange() {
    oficio.careerId = null
    oficio.teacherId = null
    oficioCareers.value = []
    oficioTeachers.value = []
    closeOficioPreview()
    if (oficioResolvedModalityId.value) fetchOficioCareers()
}

function onOficioCareerChange() {
    oficio.teacherId = null
    oficioTeachers.value = []
    closeOficioPreview()
    if (oficio.careerId) fetchOficioTeachers()
}

function onOficioTeacherChange() {
    closeOficioPreview()
}

async function fetchOficioCareers() {
    if (!oficioResolvedModalityId.value) return
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.academicOffers.list, {
            params: { per_page: 200, search: { modality_id: oficioResolvedModalityId.value } },
        })
        const offers = data?.items ?? data?.data ?? data ?? []
        const seen = new Set<number>()
        let careers = offers
            .map((o: any) => ({
                id:       o.id,
                careerId: o.careerId ?? o.career_id,
                name:     o.career?.name ?? o.careerName ?? `Carrera #${o.careerId ?? o.career_id}`,
            }))
            .filter((c: any) => { if (seen.has(c.careerId)) return false; seen.add(c.careerId); return true })
        if (!ctx.value?.isAdmin && ctx.value?.careerIds) {
            careers = careers.filter((c: any) => ctx.value!.careerIds!.includes(c.careerId))
        }
        oficioCareers.value = careers
    } catch { oficioCareers.value = [] }
}

async function fetchOficioTeachers() {
    try {
        const { data } = await api.get(API.SCA_API.teachers.list, { params: { per_page: 500 } })
        const items = data?.items ?? data?.data ?? data ?? []
        oficioTeachers.value = items.map((t: any) => ({
            id:   t.id,
            name: t.employeeName ?? t.employee_name ?? t.name ?? `Docente #${t.id}`,
        }))
    } catch { oficioTeachers.value = [] }
}

async function generateOficioInline() {
    oficioError.value = null
    oficioPreviewVisible.value = true
    oficioGenerating.value = true
    if (oficioPdfUrl.value) { URL.revokeObjectURL(oficioPdfUrl.value); oficioPdfUrl.value = null }

    try {
        const { blob } = await generatePdf({
            reportCode: 'F0007',
            params: {
                period_id:   selectedPeriodId.value,
                modality_id: oficioResolvedModalityId.value,
                career_id:   oficio.careerId,
                teacher_id:  oficio.teacherId,
                folio:       oficio.folio.trim(),
                fecha:       oficio.fecha,
            },
        })
        oficioBlob.value = blob
        oficioPdfUrl.value = URL.createObjectURL(blob)
    } catch (e: any) {
        oficioError.value = e?.message ?? 'Error al generar el oficio.'
    } finally {
        oficioGenerating.value = false
    }
}

function downloadOficioBlob() {
    if (!oficioBlob.value) return
    const url = URL.createObjectURL(oficioBlob.value)
    const a = document.createElement('a')
    a.href = url
    a.download = `oficio_asignacion_${oficio.folio.trim() || 'sin_folio'}.pdf`
    a.click()
    URL.revokeObjectURL(url)
}

function closeOficioPreview() {
    oficioPreviewVisible.value = false
    oficioBlob.value = null
    oficioError.value = null
    if (oficioPdfUrl.value) { URL.revokeObjectURL(oficioPdfUrl.value); oficioPdfUrl.value = null }
}

/* ═══════════════════════════ Tab: Solicitud ═══════════════════════ */

const sol = reactive({
    campusId:       null as number | null,
    modalityTypeId: null as number | null,
    teacherId:      null as number | null,
})

const solTeachers = ref<any[]>([])

const solCampuses = computed(() => {
    if (!ctx.value) return []
    if (ctx.value.isAdmin || !ctx.value.campusIds) return allCampuses.value
    return allCampuses.value.filter(c => ctx.value!.campusIds!.includes(c.id))
})

const solModalityTypes = computed(() => {
    if (!ctx.value) return []
    let types = allModalityTypes.value
    if (!ctx.value.isAdmin && ctx.value.modalityTypeIds) {
        types = types.filter(mt => ctx.value!.modalityTypeIds!.includes(mt.id))
    }
    if (sol.campusId) {
        const typesInCampus = allModalities.value
            .filter((m: any) => (m.campusId ?? m.campus_id) === sol.campusId)
            .map((m: any) => m.modalityTypeId ?? m.modality_type_id)
        types = types.filter(mt => typesInCampus.includes(mt.id))
    }
    return types
})

const solResolvedModalityId = computed(() => {
    if (!sol.campusId || !sol.modalityTypeId) return null
    const match = allModalities.value.find((m: any) =>
        (m.campusId ?? m.campus_id) === sol.campusId &&
        (m.modalityTypeId ?? m.modality_type_id) === sol.modalityTypeId
    )
    return match?.id ?? null
})

const solPreviewVisible = ref(false)
const solGenerating     = ref(false)
const solBlob           = ref<Blob | null>(null)
const solPdfUrl         = ref<string | null>(null)
const solError          = ref<string | null>(null)

function onSolCampusChange() {
    sol.modalityTypeId = null
    sol.teacherId = null
    solTeachers.value = []
    closeSolPreview()
}

function onSolModalityTypeChange() {
    sol.teacherId = null
    solTeachers.value = []
    closeSolPreview()
    if (solResolvedModalityId.value) fetchSolTeachers()
}

function onSolTeacherChange() {
    closeSolPreview()
    if (sol.teacherId) {
        void generateSolInline()
    }
}

async function fetchSolTeachers() {
    if (!solResolvedModalityId.value) return
    try {
        const { data } = await api.get(API.SCA_API.teachers.list, { params: { per_page: 500 } })
        const items = data?.items ?? data?.data ?? data ?? []
        solTeachers.value = items.map((t: any) => ({
            id:   t.id,
            name: t.employeeName ?? t.employee_name ?? t.name ?? `Docente #${t.id}`,
        }))
    } catch { solTeachers.value = [] }
}

async function generateSolInline() {
    solError.value = null
    solPreviewVisible.value = true
    solGenerating.value = true
    if (solPdfUrl.value) { URL.revokeObjectURL(solPdfUrl.value); solPdfUrl.value = null }

    try {
        const { blob } = await generatePdf({
            reportCode: 'F0009',
            params: {
                period_id:   selectedPeriodId.value,
                modality_id: solResolvedModalityId.value,
                teacher_id:  sol.teacherId,
            },
        })
        solBlob.value = blob
        solPdfUrl.value = URL.createObjectURL(blob)
    } catch (e: any) {
        solError.value = e?.message ?? 'Error al generar el reporte.'
    } finally {
        solGenerating.value = false
    }
}

function downloadSolBlob() {
    if (!solBlob.value) return
    const url = URL.createObjectURL(solBlob.value)
    const a = document.createElement('a')
    a.href = url
    a.download = 'solicitud_materias.pdf'
    a.click()
    URL.revokeObjectURL(url)
}

function closeSolPreview() {
    solPreviewVisible.value = false
    solBlob.value = null
    solError.value = null
    if (solPdfUrl.value) { URL.revokeObjectURL(solPdfUrl.value); solPdfUrl.value = null }
}

/* ═══════════════════════════ Fetch de datos ═══════════════════════ */

async function fetchContext() {
    try {
        const { data } = await api.get(API.SCA_API.myContext)
        ctx.value = data
    } catch { ctx.value = { isAdmin: false, careerIds: [], modalityIds: [], campusIds: [], modalityTypeIds: [] } }
}

async function fetchCampuses() {
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.campuses.list, { params: { per_page: 100, status: 1 } })
        allCampuses.value = (data?.items ?? data?.data ?? data ?? []).map((c: any) => ({ id: c.id, name: c.name ?? c.shortName }))
    } catch { allCampuses.value = [] }
}

async function fetchModalityTypes() {
    try {
        const { data } = await api.get(API.SUPERADMIN_API.modalityTypes.list, { params: { per_page: 100 } })
        allModalityTypes.value = (data?.items ?? data?.data ?? data ?? []).map((mt: any) => ({ id: mt.id, name: mt.name }))
    } catch { allModalityTypes.value = [] }
}

async function fetchModalities() {
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.modalities.list, { params: { per_page: 200 } })
        allModalities.value = data?.items ?? data?.data ?? data ?? []
    } catch { allModalities.value = [] }
}

async function fetchCareersForModality() {
    if (!resolvedModalityId.value) { allCareers.value = []; return }
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.academicOffers.list, {
            params: { per_page: 200, search: { modality_id: resolvedModalityId.value } },
        })
        const offers = data?.items ?? data?.data ?? data ?? []
        const seen = new Set<number>()
        allCareers.value = offers
            .map((o: any) => ({
                id:         o.id,
                careerId:   o.careerId ?? o.career_id,
                name:       o.career?.name ?? o.careerName ?? `Carrera #${o.careerId ?? o.career_id}`,
                modalityId: o.modalityId ?? o.modality_id,
            }))
            .filter((c: any) => { if (seen.has(c.careerId)) return false; seen.add(c.careerId); return true })
    } catch { allCareers.value = [] }
}

onMounted(() => {
    fetchContext()
    restorePeriodFromStorage()
    fetchCampuses()
    fetchModalityTypes()
    fetchModalities()
})

onBeforeUnmount(() => {
    if (proyPdfUrl.value) URL.revokeObjectURL(proyPdfUrl.value)
})
</script>

<style>
.docx-preview-host .docx-wrapper { background: transparent; }
.docx-preview-host .docx {
    margin: 0 auto 16px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    background: white;
}
</style>
