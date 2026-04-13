<template>
    <div class="space-y-4">

        <!-- ═════ Periodo + Lock ═════ -->
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

            <!-- ═════ Instrucciones ═════ -->
            <div class="bg-sky-50 border border-sky-200 rounded-xl px-4 py-3 text-[11px] text-slate-700">
                <strong class="font-black">INSTRUCCIONES:</strong>
                SELECCIONE LOS FILTROS INICIALES (CAMPUS / MODALIDAD / FILTRO / DATO), POSTERIORMENTE SOLO ARRASTRE LA ASIGNATURA A LOS RECUADROS.
                SI ESTA ASIGNATURA NECESITA INFORMACIÓN ESTA SERÁ REQUERIDA.
            </div>

            <!-- ═════ Sección: Filtros ═════ -->
            <section class="bg-white border rounded-xl shadow-sm overflow-hidden">
                <header class="px-4 py-2 bg-slate-50 border-b">
                    <h2 class="text-[11px] font-black text-slate-600 uppercase tracking-widest">Filtros</h2>
                </header>
                <div class="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
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
                        <label class="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">FILTRO</label>
                        <select v-model="filterType" :disabled="!resolvedConfigId" @change="filterValue = null"
                            class="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none uppercase disabled:bg-slate-100 disabled:text-slate-400">
                            <option value="teacher">DOCENTE</option>
                            <option value="group">GRUPO</option>
                            <option value="place">AULA</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">{{ filterType === 'teacher' ? 'DOCENTE' : filterType === 'group' ? 'GRUPO' : 'AULA' }}</label>
                        <select v-model="filterValue" :disabled="!resolvedConfigId"
                            class="w-full border-2 rounded-xl px-4 py-2.5 text-sm font-bold border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none uppercase disabled:bg-slate-100 disabled:text-slate-400">
                            <option :value="null">-- TODOS --</option>
                            <option v-for="opt in filterOptions" :key="opt.id" :value="opt.id">{{ opt.label }}</option>
                        </select>
                    </div>
                </div>
            </section>

            <!-- ═════ Sección: Herramientas (solo cuando hay editor visible) ═════ -->
            <section v-if="resolvedConfigId && !configError" class="bg-white border rounded-xl shadow-sm overflow-hidden">
                <header class="px-4 py-2 bg-slate-50 border-b flex items-center justify-between flex-wrap gap-2">
                    <h2 class="text-[11px] font-black text-slate-600 uppercase tracking-widest">Herramientas</h2>
                    <span v-if="eraserMode" class="text-[10px] font-bold uppercase text-red-600 flex items-center gap-1.5">
                        <span class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                        MODO BORRADOR ACTIVO — PRESIONE ESC O EL BOTÓN PARA SALIR
                    </span>
                </header>
                <div class="p-3 flex items-center gap-2 flex-wrap">
                    <button
                        type="button"
                        class="flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg border-2 transition uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                        :class="eraserMode
                            ? 'border-red-500 bg-red-50 text-red-700 hover:bg-red-100'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-red-400 hover:bg-red-50 hover:text-red-600'"
                        :disabled="!phaseActive || comparisonMode || listMode"
                        :title="!phaseActive ? 'Fase de horarios cerrada' : (eraserMode ? 'Desactivar borrador' : 'Activar borrador')"
                        @click="toggleEraserMode"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 4.5l3 3L9 18H6v-3l10.5-10.5zM12 8l4 4M4 21h16" />
                        </svg>
                        {{ eraserMode ? 'SALIR DEL BORRADOR' : 'BORRADOR' }}
                    </button>

                    <button
                        type="button"
                        class="flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg border-2 transition uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                        :class="comparisonMode
                            ? 'border-violet-500 bg-violet-50 text-violet-700 hover:bg-violet-100'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-violet-400 hover:bg-violet-50 hover:text-violet-600'"
                        :disabled="eraserMode || listMode"
                        :title="comparisonMode ? 'Salir de comparación' : 'Comparar horarios'"
                        @click="toggleComparisonMode"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        {{ comparisonMode ? 'SALIR DE COMPARACIÓN' : 'COMPARAR' }}
                    </button>

                    <!-- Modo lista -->
                    <button
                        type="button"
                        class="flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg border-2 transition uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                        :class="listMode
                            ? 'border-sky-500 bg-sky-50 text-sky-700 hover:bg-sky-100'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-sky-400 hover:bg-sky-50 hover:text-sky-600'"
                        :disabled="eraserMode || comparisonMode"
                        :title="listMode ? 'Volver al grid' : 'Ver horario como lista'"
                        @click="toggleListMode"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                        </svg>
                        {{ listMode ? 'VOLVER AL GRID' : 'MODO LISTA' }}
                    </button>

                    <!-- Seleccionar aula por defecto -->
                    <button
                        type="button"
                        class="flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg border-2 transition uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                        :class="pinnedPlaceId
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-600'"
                        :disabled="!phaseActive || eraserMode || comparisonMode || listMode"
                        :title="pinnedPlaceId ? 'Cambiar o quitar aula fija' : 'Fijar aula por defecto'"
                        @click="openPinnedPlaceModal"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                        </svg>
                        <span class="max-w-[180px] truncate">
                            {{ pinnedPlaceId ? ('AULA: ' + (pinnedPlaceLabel || '')) : 'SELECCIONAR AULA' }}
                        </span>
                        <svg
                            v-if="pinnedPlaceId"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke-width="2.5"
                            stroke="currentColor"
                            class="w-3.5 h-3.5 hover:text-red-600"
                            @click.stop="clearPinnedPlace"
                        >
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <!-- Filtrar fechas visibles (solo para modalidades que usan fechas) -->
                    <button
                        v-if="usesSpecificDates"
                        type="button"
                        class="flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg border-2 transition uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                        :class="hiddenDateKeys.size > 0
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600'"
                        :disabled="eraserMode || comparisonMode || listMode"
                        :title="hiddenDateKeys.size > 0 ? (hiddenDateKeys.size + ' fecha(s) ocultas') : 'Filtrar fechas visibles'"
                        @click="openDateVisibilityModal"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                        </svg>
                        <span>
                            FECHAS
                            <span v-if="hiddenDateKeys.size > 0" class="ml-1 text-[10px]">({{ visibleDatesCount }}/{{ allDatesCount }})</span>
                        </span>
                    </button>
                </div>
            </section>

            <!-- ═════ Alertas ═════ -->
            <div v-if="resolvedConfigId && !phaseActive" class="bg-slate-100 border border-slate-300 rounded-xl p-3 text-center">
                <p class="text-xs text-slate-500 font-semibold uppercase">Fase de horarios no activa — modo solo lectura</p>
            </div>

            <div v-if="configError" class="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                <p class="text-sm text-amber-700 font-semibold uppercase">{{ configError }}</p>
            </div>

            <!-- ═════ Body: panel + grid ═════ -->
            <template v-if="resolvedConfigId && !configError && !comparisonMode && !listMode">
                <div class="flex gap-0">

                    <!-- ── Panel izquierdo (asignaturas) ── -->
                    <div class="w-60 min-w-[240px] flex-shrink-0 border-2 border-slate-800 border-r-0 bg-white overflow-hidden" style="width: 240px;">
                        <div class="px-3 py-3 bg-white border-b-2 border-slate-800 text-center">
                            <h2 class="text-[13px] font-black uppercase text-slate-800 tracking-tight leading-tight">ASIGN. / H.<br />DESC.</h2>
                        </div>

                        <div class="max-h-[calc(100vh-340px)] overflow-y-auto p-2 space-y-2">
                            <div v-if="loadingAssignable" class="flex justify-center py-6">
                                <div class="w-5 h-5 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            </div>

                            <div
                                v-for="a in filteredAssignments"
                                :key="a.id"
                                class="border-2 rounded transition cursor-move select-none overflow-hidden bg-orange-100/60 touch-none"
                                :class="[
                                    a.isComplete ? 'border-green-500 opacity-70' : 'border-slate-400 hover:border-slate-700 hover:shadow',
                                    draggedAssignmentId === a.id ? 'ring-2 ring-blue-400' : '',
                                ]"
                                @pointerdown="onAssignmentPointerDown(a, $event)"
                            >
                                <div class="px-2 py-1.5 bg-orange-200/60 border-b border-slate-300 text-center">
                                    <span class="text-[11px] font-black text-slate-800 uppercase leading-tight block truncate">
                                        {{ a.subject?.shortName || a.subject?.name || '—' }}
                                    </span>
                                </div>
                                <div class="px-2 py-1 text-center">
                                    <p class="text-[10px] text-slate-700 uppercase truncate">{{ a.teacher.name || '—' }}</p>
                                    <div class="flex items-center justify-between mt-1 text-[10px]">
                                        <span class="font-bold text-slate-600">{{ a.group?.name || '' }}</span>
                                        <span class="font-black" :class="a.isComplete ? 'text-green-700' : 'text-orange-700'">
                                            {{ remainingHours(a) }}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div v-if="!loadingAssignable && filteredAssignments.length === 0" class="text-center py-8 text-[10px] text-slate-400 uppercase">
                                Sin asignaciones
                            </div>
                        </div>
                    </div>

                    <!-- ── Grid de horarios (CSS Grid) ── -->
                    <div class="flex-1 border-2 border-slate-800 bg-white overflow-x-auto">
                        <div
                            class="relative grid min-w-max"
                            :style="gridContainerStyle"
                        >
                            <!-- ── Header row (row 1) ── -->
                            <div
                                class="px-3 py-3 text-center border-b-2 border-slate-800 bg-white sticky top-0 left-0 z-40"
                                style="grid-column: 1; grid-row: 1;"
                            >
                                <div class="text-[13px] font-black uppercase text-slate-800 leading-tight">
                                    DÍAS /<br />HORAS
                                </div>
                            </div>
                            <div
                                v-for="(col, colIdx) in columns"
                                :key="'h-' + col.key"
                                class="px-2 py-3 text-[13px] font-black uppercase text-slate-800 text-center border-b-2 border-l-2 border-slate-800 bg-white sticky top-0 z-30"
                                :style="{ gridColumn: String(colIdx + 2), gridRow: '1' }"
                            >
                                {{ col.label }}
                            </div>

                            <!-- ── Filas de slots + receso (row 2 ... N+1) ── -->
                            <template v-for="(row, rowIdx) in hourRows" :key="row.key">
                                <template v-if="row.kind === 'slot'">
                                    <!-- Columna de horas (col 1) — sticky horizontal -->
                                    <div
                                        class="px-2 text-center border-b border-r-2 border-slate-800 bg-white flex items-center justify-center sticky left-0 z-20"
                                        :style="{ height: ROW_HEIGHT + 'px', gridColumn: '1', gridRow: String(rowIdx + 2) }"
                                    >
                                        <div class="text-[11px] font-bold text-slate-600 leading-tight">
                                            <div>{{ row.slot.startLabel }}</div>
                                            <div class="my-0.5">-</div>
                                            <div>{{ row.slot.endLabel }}</div>
                                        </div>
                                    </div>

                                    <!-- Celdas de cada día (targets para drop) -->
                                    <div
                                        v-for="(col, colIdx) in columns"
                                        :key="col.key + '-' + row.slot.key"
                                        class="border-b border-l-2 border-slate-800 hover:bg-blue-50/30 transition"
                                        :class="cellOccupied(col, row.slot) ? 'bg-slate-50/30' : ''"
                                        :style="{ height: ROW_HEIGHT + 'px', gridColumn: String(colIdx + 2), gridRow: String(rowIdx + 2) }"
                                        :data-cell-col="col.key"
                                        :data-cell-slot="row.slot.key"
                                    ></div>
                                </template>

                                <template v-else>
                                    <!-- Columna de horas del receso — sticky horizontal -->
                                    <div
                                        class="px-2 text-center border-b-2 border-t-2 border-r-2 border-amber-700 bg-amber-50 flex items-center justify-center sticky left-0 z-20"
                                        :style="{ height: (ROW_HEIGHT * 0.7) + 'px', gridColumn: '1', gridRow: String(rowIdx + 2) }"
                                    >
                                        <div class="text-[10px] font-black text-amber-800 leading-tight">
                                            <div>{{ row.startLabel }}</div>
                                            <div class="my-0.5">-</div>
                                            <div>{{ row.endLabel }}</div>
                                        </div>
                                    </div>

                                    <!-- Celda del receso que abarca todas las columnas de días -->
                                    <div
                                        class="border-b-2 border-t-2 border-l-2 border-amber-700 bg-amber-50 flex items-center justify-center gap-2 select-none"
                                        :style="{
                                            height: (ROW_HEIGHT * 0.7) + 'px',
                                            gridColumn: '2 / ' + (columns.length + 2),
                                            gridRow: String(rowIdx + 2),
                                        }"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 text-amber-700">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span class="text-[11px] font-black uppercase text-amber-800 tracking-widest">
                                            RECESO · {{ row.durationMinutes }} MIN
                                        </span>
                                    </div>
                                </template>
                            </template>

                            <!-- ── Bloque en modo NORMAL (draggable) ── -->
                            <template v-if="!eraserMode">
                                <div
                                    v-for="block in allBlocks"
                                    :key="'block-' + block.id"
                                    class="border-2 m-1 px-1.5 py-1 overflow-hidden flex flex-col justify-center items-center text-center bg-orange-100 border-orange-400 pointer-events-auto z-10 touch-none"
                                    :class="[
                                        block.teacherAssignment?.teacher?.isVacancy ? 'bg-amber-100 border-amber-500' : '',
                                        phaseActive ? 'cursor-move' : '',
                                        draggedBlockId === block.id ? 'opacity-50 ring-2 ring-blue-400' : '',
                                    ]"
                                    :style="blockGridStyle(block)"
                                    @pointerdown="onBlockPointerDown(block, $event)"
                                >
                                    <div class="text-[11px] font-black uppercase text-slate-800 truncate w-full leading-tight">
                                        {{ block.teacherAssignment?.subject?.shortName || block.teacherAssignment?.subject?.name || '—' }}
                                    </div>
                                    <div class="text-[10px] text-slate-700 truncate w-full mt-0.5">
                                        {{ placeShortLabel(block) }}
                                    </div>
                                    <div class="flex items-center justify-between w-full mt-0.5 px-0.5">
                                        <span class="text-[10px] font-bold text-slate-600 truncate">{{ block.teacherAssignment?.group?.name || '' }}</span>
                                        <button
                                            v-if="phaseActive"
                                            class="text-red-600 hover:text-red-800 ml-1 flex-shrink-0"
                                            title="Eliminar"
                                            @pointerdown.stop
                                            @click.stop="confirmRemoveBlock(block)"
                                        >
                                            <TrashIcon class="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            </template>

                            <!-- ── Bloque en modo BORRADOR (sin drag, solo click targets) ── -->
                            <template v-else>
                                <div
                                    v-for="block in allBlocks"
                                    :key="'era-' + block.id"
                                    class="m-1 overflow-hidden flex flex-col bg-white border-2 border-red-500 pointer-events-auto z-10 shadow-lg"
                                    :style="blockGridStyle(block)"
                                >
                                <!-- Info de la asignatura (NO clickable) -->
                                <div class="bg-slate-800 text-white px-1 py-1 text-center flex-shrink-0">
                                    <div class="text-[10px] font-black uppercase truncate leading-tight">
                                        {{ block.teacherAssignment?.subject?.shortName || block.teacherAssignment?.subject?.name || '—' }}
                                    </div>
                                    <div class="text-[8px] opacity-75 uppercase truncate leading-tight">
                                        {{ block.teacherAssignment?.teacher?.name || '' }}
                                        <span v-if="block.teacherAssignment?.group?.name" class="mx-0.5">·</span>
                                        {{ block.teacherAssignment?.group?.name || '' }}
                                        <span class="mx-0.5">·</span>
                                        {{ placeShortLabel(block) }}
                                    </div>
                                </div>

                                <!-- Botón ELIMINAR TODO -->
                                <button
                                    type="button"
                                    class="px-1 py-0.5 bg-red-600 hover:bg-red-700 text-white text-[9px] font-black uppercase flex-shrink-0 border-b-2 border-red-800"
                                    title="Eliminar bloque completo"
                                    @pointerdown.stop
                                    @click.stop="eraserDeleteAll(block)"
                                >
                                    ✕ ELIMINAR TODO
                                </button>

                                <!-- Sub-slots clickables individualmente -->
                                <div class="flex-1 flex flex-col divide-y divide-red-200 bg-red-50/50 min-h-0">
                                    <button
                                        v-for="(slot, idx) in blockSubSlots(block)"
                                        :key="'ss-' + block.id + '-' + idx"
                                        type="button"
                                        class="flex-1 flex items-center justify-center text-[9px] font-mono font-bold text-red-700 hover:bg-red-500 hover:text-white transition cursor-pointer px-1 min-h-0"
                                        :title="`Eliminar solo ${slot.from} - ${slot.to}`"
                                        @pointerdown.stop
                                        @click.stop="eraserDeleteSlot(block, slot)"
                                    >
                                        {{ slot.from }} - {{ slot.to }}
                                    </button>
                                </div>
                                </div>
                            </template>

                            <!-- ── Preview del drag ── -->
                            <div
                                v-if="dragPreviewGridStyle"
                                class="border-2 border-dashed border-blue-500 bg-blue-100/50 m-1 pointer-events-none z-20"
                                :style="dragPreviewGridStyle"
                            ></div>
                        </div>
                    </div>
                </div>
            </template>

            <!-- ═════ Vista: Modo Lista ═════ -->
            <template v-if="resolvedConfigId && !configError && listMode">
                <div class="bg-white border-2 border-sky-800 rounded-lg overflow-hidden">
                    <div class="px-4 py-2 bg-sky-50 border-b-2 border-sky-800 flex items-center justify-between flex-wrap gap-2">
                        <h2 class="text-[13px] font-black uppercase text-sky-800 tracking-tight">HORARIO COMPLETO ({{ listRows.length }} clases)</h2>
                        <span v-if="filterValue" class="text-[10px] font-bold uppercase text-sky-600">
                            Filtrado por: {{ filterType === 'teacher' ? 'DOCENTE' : filterType === 'group' ? 'GRUPO' : 'AULA' }}
                        </span>
                    </div>

                    <div class="overflow-x-auto max-h-[calc(100vh-380px)]">
                        <table class="w-full text-xs border-collapse">
                            <thead class="sticky top-0 z-10">
                                <tr class="bg-slate-100 border-b-2 border-slate-300">
                                    <th class="px-3 py-2 text-left text-[10px] font-black text-slate-600 uppercase tracking-wider">
                                        {{ usesSpecificDates ? 'Fecha' : 'Día' }}
                                    </th>
                                    <th class="px-3 py-2 text-left text-[10px] font-black text-slate-600 uppercase tracking-wider">Hora</th>
                                    <th class="px-3 py-2 text-left text-[10px] font-black text-slate-600 uppercase tracking-wider">Grupo</th>
                                    <th class="px-3 py-2 text-left text-[10px] font-black text-slate-600 uppercase tracking-wider">Materia</th>
                                    <th class="px-3 py-2 text-left text-[10px] font-black text-slate-600 uppercase tracking-wider">Docente</th>
                                    <th class="px-3 py-2 text-left text-[10px] font-black text-slate-600 uppercase tracking-wider">Aula</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr
                                    v-for="row in listRows"
                                    :key="'lr-' + row.id"
                                    class="border-b border-slate-100 hover:bg-sky-50/40 transition"
                                >
                                    <td class="px-3 py-1.5 font-bold text-slate-700 uppercase whitespace-nowrap">
                                        {{ row.dayLabel }}
                                    </td>
                                    <td class="px-3 py-1.5 font-mono text-slate-700 whitespace-nowrap">
                                        {{ row.startTime }} — {{ row.endTime }}
                                    </td>
                                    <td class="px-3 py-1.5 font-bold text-slate-700">{{ row.group || '—' }}</td>
                                    <td class="px-3 py-1.5 uppercase text-slate-700">
                                        <div class="font-bold">{{ row.subject || '—' }}</div>
                                        <div v-if="row.subjectCode" class="text-[9px] text-slate-400 font-mono">{{ row.subjectCode }}</div>
                                    </td>
                                    <td class="px-3 py-1.5 uppercase text-slate-700">
                                        <div class="flex items-center gap-1">
                                            <span>{{ row.teacher || '—' }}</span>
                                            <span v-if="row.isVacancy" class="text-[8px] font-bold uppercase px-1 rounded bg-amber-100 text-amber-700">VAC</span>
                                        </div>
                                    </td>
                                    <td class="px-3 py-1.5 text-slate-700 uppercase">{{ row.place || '—' }}</td>
                                </tr>
                                <tr v-if="listRows.length === 0">
                                    <td colspan="6" class="px-4 py-12 text-center text-[11px] text-slate-400 uppercase">
                                        Sin bloques asignados
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </template>

            <!-- ═════ Vista: Comparación ═════ -->
            <template v-if="resolvedConfigId && !configError && comparisonMode">
                <div class="flex gap-0">

                    <!-- ── Panel izquierdo: selector de items a comparar ── -->
                    <div class="w-72 flex-shrink-0 border-2 border-violet-800 border-r-0 bg-white overflow-hidden">
                        <div class="px-3 py-3 bg-violet-50 border-b-2 border-violet-800 text-center">
                            <h2 class="text-[13px] font-black uppercase text-violet-800 tracking-tight">COMPARAR</h2>
                        </div>

                        <div class="p-3 space-y-3">
                            <!-- Tipo -->
                            <div>
                                <label class="block text-[10px] font-black text-slate-500 uppercase mb-1.5 tracking-widest">TIPO</label>
                                <div class="flex gap-1">
                                    <button
                                        v-for="t in [{k:'teacher',l:'DOCENTE'},{k:'group',l:'GRUPO'},{k:'place',l:'AULA'}]"
                                        :key="t.k"
                                        type="button"
                                        class="flex-1 px-2 py-1.5 text-[10px] font-bold rounded border-2 transition uppercase"
                                        :class="comparisonType === t.k
                                            ? 'border-violet-500 bg-violet-100 text-violet-700'
                                            : 'border-slate-200 bg-white text-slate-600 hover:border-violet-300'"
                                        @click="setComparisonType(t.k as 'teacher' | 'group' | 'place')"
                                    >
                                        {{ t.l }}
                                    </button>
                                </div>
                            </div>

                            <!-- Buscador -->
                            <div>
                                <input
                                    v-model="comparisonSearch"
                                    type="text"
                                    placeholder="FILTRAR..."
                                    class="w-full border rounded-lg px-2 py-1 text-[10px] uppercase focus:outline-none focus:ring-2 focus:ring-violet-400"
                                />
                            </div>

                            <!-- Lista multi-select -->
                            <div class="max-h-[calc(100vh-420px)] overflow-y-auto border border-slate-200 rounded">
                                <div v-if="comparisonOptions.length === 0" class="p-4 text-center text-[10px] text-slate-400 uppercase">
                                    Sin opciones
                                </div>
                                <label
                                    v-for="opt in comparisonOptions"
                                    :key="opt.id"
                                    class="flex items-center gap-2 px-2 py-1.5 hover:bg-violet-50 cursor-pointer border-b border-slate-100 last:border-b-0"
                                >
                                    <input
                                        type="checkbox"
                                        :checked="comparisonSelectedIds.includes(opt.id)"
                                        :disabled="!comparisonSelectedIds.includes(opt.id) && comparisonSelectedIds.length >= COMPARISON_MAX_ITEMS"
                                        class="w-3.5 h-3.5 rounded border-slate-300 text-violet-600"
                                        @change="toggleComparisonItem(opt.id)"
                                    />
                                    <span
                                        v-if="comparisonSelectedIds.includes(opt.id)"
                                        class="w-3 h-3 rounded-full border border-slate-400 flex-shrink-0"
                                        :style="{ backgroundColor: getComparisonColor(opt.id) }"
                                    ></span>
                                    <span class="text-[11px] font-bold text-slate-700 uppercase truncate flex-1">{{ opt.label }}</span>
                                </label>
                            </div>

                            <p class="text-[9px] text-slate-400 italic">
                                Máximo {{ COMPARISON_MAX_ITEMS }} items. Selecciona al menos 2 para comparar.
                            </p>
                        </div>
                    </div>

                    <!-- ── Grid de comparación ── -->
                    <div class="flex-1 border-2 border-violet-800 bg-white overflow-x-auto">
                        <div class="relative grid min-w-max" :style="gridContainerStyle">
                            <!-- Header row -->
                            <div
                                class="px-3 py-3 text-center border-b-2 border-violet-800 bg-violet-50 sticky top-0 z-30"
                                style="grid-column: 1; grid-row: 1;"
                            >
                                <div class="text-[13px] font-black uppercase text-violet-800 leading-tight">
                                    DÍAS /<br />HORAS
                                </div>
                            </div>
                            <div
                                v-for="(col, colIdx) in columns"
                                :key="'ch-' + col.key"
                                class="px-2 py-3 text-[13px] font-black uppercase text-violet-800 text-center border-b-2 border-l-2 border-violet-800 bg-violet-50 sticky top-0 z-30"
                                :style="{ gridColumn: String(colIdx + 2), gridRow: '1' }"
                            >
                                {{ col.label }}
                            </div>

                            <!-- Slots -->
                            <template v-for="(slot, slotIdx) in hourSlots" :key="'cs-' + slot.key">
                                <div
                                    class="px-2 text-center border-b border-r-2 border-violet-800 bg-white flex items-center justify-center"
                                    :style="{ height: ROW_HEIGHT + 'px', gridColumn: '1', gridRow: String(slotIdx + 2) }"
                                >
                                    <div class="text-[11px] font-bold text-slate-600 leading-tight">
                                        <div>{{ slot.startLabel }}</div>
                                        <div class="my-0.5">-</div>
                                        <div>{{ slot.endLabel }}</div>
                                    </div>
                                </div>
                                <div
                                    v-for="(col, colIdx) in columns"
                                    :key="'cc-' + col.key + '-' + slot.key"
                                    class="border-b border-l-2 border-violet-800"
                                    :style="{ height: ROW_HEIGHT + 'px', gridColumn: String(colIdx + 2), gridRow: String(slotIdx + 2) }"
                                ></div>
                            </template>

                            <!-- Bloques de cada item seleccionado (overlay) -->
                            <div
                                v-for="block in comparisonBlocks"
                                :key="'cb-' + block.id"
                                class="border-2 m-0.5 overflow-hidden flex flex-col justify-center items-center text-center pointer-events-auto z-10"
                                :style="getComparisonBlockStyle(block)"
                                :title="getComparisonBlockTooltip(block)"
                            >
                                <div class="text-[10px] font-black uppercase truncate w-full leading-tight px-1" :style="{ color: getComparisonBlockTextColor(block) }">
                                    {{ block.teacherAssignment?.subject?.shortName || block.teacherAssignment?.subject?.name || '—' }}
                                </div>
                                <div class="text-[9px] truncate w-full leading-tight px-1 opacity-80" :style="{ color: getComparisonBlockTextColor(block) }">
                                    {{ comparisonBlockLabel(block) }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Leyenda -->
                <div v-if="comparisonSelectedIds.length > 0" class="mt-3 p-3 bg-violet-50 border border-violet-200 rounded-lg flex flex-wrap items-center gap-3">
                    <span class="text-[10px] font-black uppercase text-violet-700 tracking-widest">LEYENDA:</span>
                    <div v-for="opt in selectedComparisonItems" :key="'lg-' + opt.id" class="flex items-center gap-1.5">
                        <span class="w-3 h-3 rounded-full border border-slate-400" :style="{ backgroundColor: getComparisonColor(opt.id) }"></span>
                        <span class="text-[11px] font-bold text-slate-700 uppercase">{{ opt.label }}</span>
                    </div>
                </div>
            </template>
        </template>

        <!-- ═════ Ghost element (fixed, sigue al puntero durante drag) ═════ -->
        <Teleport to="body">
            <div
                v-if="ghost.visible"
                class="fixed pointer-events-none z-[9998] border-2 border-blue-500 bg-blue-100/90 rounded px-2 py-1 shadow-lg"
                :style="{
                    left: ghost.x + 'px',
                    top: ghost.y + 'px',
                    width: ghost.width + 'px',
                }"
            >
                <div class="text-[11px] font-black uppercase text-slate-800 truncate">{{ ghost.title }}</div>
                <div class="text-[10px] text-slate-700 truncate">{{ ghost.subtitle }}</div>
            </div>
        </Teleport>

        <!-- ═════ Modal de drop ═════ -->
        <Teleport to="body">
            <div v-if="dropModal.open" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" @click.self="closeDropModal">
                <div class="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
                    <div class="px-5 py-3 bg-orange-50 border-b border-orange-200 flex items-center justify-between">
                        <h3 class="text-sm font-black uppercase text-orange-800">
                            {{ dropModal.mode === 'move' ? 'Mover Horario' : 'Asignar Horario' }}
                        </h3>
                        <button class="text-slate-400 hover:text-slate-600" @click="closeDropModal">
                            <XMarkIcon class="w-5 h-5" />
                        </button>
                    </div>

                    <div class="p-5 space-y-4">
                        <div class="text-xs space-y-1">
                            <p><strong class="text-slate-500 uppercase text-[10px]">Materia:</strong> {{ dropModal.subjectName }}</p>
                            <p>
                                <strong class="text-slate-500 uppercase text-[10px]">Docente:</strong>
                                {{ dropModal.teacherName }}
                                <span v-if="dropModal.isVacancy" class="text-[9px] font-bold px-1 rounded bg-amber-100 text-amber-700">VAC</span>
                            </p>
                            <p><strong class="text-slate-500 uppercase text-[10px]">Grupo:</strong> {{ dropModal.groupName }}</p>
                            <p><strong class="text-slate-500 uppercase text-[10px]">Slot:</strong> {{ dropModal.slotLabel }}</p>
                        </div>

                        <div>
                            <label class="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">
                                AULA
                                <span v-if="dropModal.lockPlace" class="ml-2 text-[9px] font-bold text-blue-600">(FIJADA POR FILTRO)</span>
                                <span v-else-if="pinnedPlaceId && dropModal.placeId === pinnedPlaceId" class="ml-2 text-[9px] font-bold text-emerald-600">(AULA POR DEFECTO)</span>
                                <span v-else-if="dropModal.loadingPlaces" class="ml-2 text-[9px] font-bold text-slate-400">CARGANDO...</span>
                                <span v-else class="ml-2 text-[9px] font-bold text-slate-500">{{ dropModal.availablePlaces.length }} DISPONIBLES</span>
                            </label>
                            <select
                                v-model="dropModal.placeId"
                                :disabled="dropModal.lockPlace || dropModal.loadingPlaces"
                                class="w-full border-2 border-slate-200 rounded-lg px-3 py-2 text-xs focus:border-orange-500 outline-none disabled:bg-slate-100"
                            >
                                <option :value="null">-- SELECCIONA --</option>
                                <option v-for="p in dropModal.availablePlaces" :key="p.id" :value="p.id">
                                    {{ p.name }}{{ p.shortName ? ' (' + p.shortName + ')' : '' }}{{ !p.isValidable ? ' [LIBRE]' : '' }}
                                </option>
                            </select>
                            <p v-if="!dropModal.loadingPlaces && !dropModal.lockPlace && dropModal.availablePlaces.length === 0" class="text-[10px] text-red-600 mt-1 font-bold uppercase">
                                ⚠ NO HAY AULAS DISPONIBLES EN ESE HORARIO
                            </p>
                        </div>

                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">HORA INICIO</label>
                                <select
                                    v-model="dropModal.startTime"
                                    class="w-full border-2 border-slate-200 rounded-lg px-3 py-2 text-xs font-mono focus:border-orange-500 outline-none"
                                    @change="onStartTimeChange"
                                >
                                    <option v-for="opt in startTimeOptions" :key="opt" :value="opt">{{ opt }}</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">HORA TÉRMINO</label>
                                <select
                                    v-model="dropModal.endTime"
                                    class="w-full border-2 border-slate-200 rounded-lg px-3 py-2 text-xs font-mono focus:border-orange-500 outline-none"
                                >
                                    <option v-for="opt in endTimeOptions" :key="opt" :value="opt">{{ opt }}</option>
                                </select>
                            </div>
                        </div>
                        <p class="text-[10px] text-slate-400 italic">
                            Bloques de {{ blockDuration }} min. Puedes seleccionar múltiples bloques consecutivos.
                        </p>

                        <div v-if="dropModal.conflicts.length" class="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p class="text-[10px] font-black text-red-700 uppercase mb-1">⚠ No se puede guardar:</p>
                            <ul class="text-[11px] text-red-700 space-y-0.5">
                                <li v-for="(err, i) in dropModal.conflicts" :key="i">• {{ err }}</li>
                            </ul>
                        </div>
                    </div>

                    <div class="px-5 py-3 bg-slate-50 border-t flex justify-end gap-2">
                        <button class="px-4 py-2 text-xs font-bold rounded-lg border hover:bg-white uppercase" @click="closeDropModal">CANCELAR</button>
                        <button
                            class="px-4 py-2 text-xs font-bold rounded-lg bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50 uppercase"
                            :disabled="!dropModal.placeId || dropModal.saving"
                            @click="saveDrop"
                        >
                            {{ dropModal.saving ? 'GUARDANDO...' : (dropModal.mode === 'move' ? 'MOVER' : 'GUARDAR') }}
                        </button>
                    </div>
                </div>
            </div>
        </Teleport>

        <!-- ═════ Modal de eliminar bloque ═════ -->
        <Teleport to="body">
            <div v-if="deleteModal.open" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" @click.self="closeDeleteModal">
                <div class="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
                    <div class="px-5 py-3 bg-red-50 border-b border-red-200 flex items-center gap-2">
                        <ExclamationTriangleIcon class="w-5 h-5 text-red-600" />
                        <h3 class="text-sm font-black uppercase text-red-700">Eliminar Bloque</h3>
                    </div>

                    <div class="p-5 space-y-3">
                        <div v-if="deleteModal.block" class="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1 text-[11px]">
                            <p>
                                <strong class="text-slate-500 uppercase text-[9px]">Materia:</strong>
                                <span class="font-bold text-slate-700 ml-1">{{ deleteModal.block.teacherAssignment?.subject?.name }}</span>
                            </p>
                            <p>
                                <strong class="text-slate-500 uppercase text-[9px]">Docente:</strong>
                                <span class="text-slate-700 ml-1">{{ deleteModal.block.teacherAssignment?.teacher?.name }}</span>
                                <span v-if="deleteModal.block.teacherAssignment?.teacher?.isVacancy" class="text-[9px] font-bold px-1 ml-1 rounded bg-amber-100 text-amber-700">VAC</span>
                            </p>
                            <p>
                                <strong class="text-slate-500 uppercase text-[9px]">Grupo:</strong>
                                <span class="text-slate-700 ml-1">{{ deleteModal.block.teacherAssignment?.group?.name }}</span>
                            </p>
                            <p>
                                <strong class="text-slate-500 uppercase text-[9px]">Aula:</strong>
                                <span class="text-slate-700 ml-1">{{ deleteModal.block.place?.name }}</span>
                            </p>
                            <p>
                                <strong class="text-slate-500 uppercase text-[9px]">Horario:</strong>
                                <span class="font-mono text-slate-700 ml-1">{{ deleteBlockLabel }}</span>
                            </p>
                        </div>

                        <!-- Slots individuales (solo si es bloque de varios slots) -->
                        <div v-if="isMultiSlotBlock">
                            <div class="flex items-center justify-between mb-2">
                                <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Selecciona los slots a eliminar</p>
                                <div class="flex gap-2 text-[9px] font-bold">
                                    <button class="text-blue-600 hover:underline uppercase" @click="toggleAllDeleteSlots(true)">Todos</button>
                                    <span class="text-slate-300">|</span>
                                    <button class="text-slate-500 hover:underline uppercase" @click="toggleAllDeleteSlots(false)">Ninguno</button>
                                </div>
                            </div>
                            <div class="space-y-1 max-h-40 overflow-y-auto border border-slate-200 rounded p-2">
                                <label
                                    v-for="(s, idx) in deleteModal.slots"
                                    :key="idx"
                                    class="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-50 cursor-pointer"
                                >
                                    <input type="checkbox" v-model="s.selected" class="w-3.5 h-3.5 text-red-600 rounded border-slate-300" />
                                    <span class="text-[11px] font-mono text-slate-700">{{ s.label }}</span>
                                </label>
                            </div>
                            <p v-if="selectedSlotsCount > 0" class="text-[10px] text-red-600 mt-2 font-semibold">
                                {{ selectedSlotsCount }} de {{ deleteModal.slots.length }} slots seleccionados
                            </p>
                        </div>

                        <p v-else class="text-xs text-slate-600">
                            ¿Deseas eliminar este bloque del horario?
                        </p>

                        <p class="text-[10px] text-red-600 font-semibold">Esta acción no se puede deshacer.</p>

                        <div v-if="deleteModal.error" class="p-2 bg-red-50 border border-red-200 rounded-lg">
                            <p class="text-[10px] text-red-700">{{ deleteModal.error }}</p>
                        </div>
                    </div>

                    <div class="px-5 py-3 bg-slate-50 border-t flex flex-wrap justify-end gap-2">
                        <button class="px-4 py-2 text-xs font-bold rounded-lg border hover:bg-white uppercase" :disabled="deleteModal.deleting" @click="closeDeleteModal">
                            CANCELAR
                        </button>

                        <!-- Eliminar solo los slots seleccionados (visible si es multi-slot y hay selección) -->
                        <button
                            v-if="isMultiSlotBlock && selectedSlotsCount > 0 && selectedSlotsCount < deleteModal.slots.length"
                            class="px-4 py-2 text-xs font-bold rounded-lg bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50 uppercase"
                            :disabled="deleteModal.deleting"
                            @click="executeRemoveSelectedSlots"
                        >
                            {{ deleteModal.deleting ? 'ELIMINANDO...' : `ELIMINAR ${selectedSlotsCount} SLOT${selectedSlotsCount > 1 ? 'S' : ''}` }}
                        </button>

                        <!-- Eliminar todo el bloque -->
                        <button
                            class="px-4 py-2 text-xs font-bold rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 uppercase"
                            :disabled="deleteModal.deleting"
                            @click="executeRemoveAll"
                        >
                            {{ deleteModal.deleting ? 'ELIMINANDO...' : (isMultiSlotBlock ? 'ELIMINAR TODO' : 'ELIMINAR') }}
                        </button>
                    </div>
                </div>
            </div>
        </Teleport>

        <!-- ═════ Modal de advertencia del borrador ═════ -->
        <Teleport to="body">
            <div v-if="eraserWarningOpen" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" @click.self="cancelEraserWarning">
                <div class="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
                    <div class="px-5 py-3 bg-red-50 border-b border-red-200 flex items-center gap-2">
                        <ExclamationTriangleIcon class="w-5 h-5 text-red-600" />
                        <h3 class="text-sm font-black uppercase text-red-700">Modo Borrador</h3>
                    </div>

                    <div class="p-5 space-y-3 text-xs text-slate-700">
                        <p class="font-bold uppercase text-red-600">¿CÓMO FUNCIONA ESTE MODO?</p>

                        <ul class="space-y-2 list-none pl-0">
                            <li class="flex gap-2">
                                <span class="text-red-500 font-black flex-shrink-0">▸</span>
                                <span>El cursor cambiará y los bloques del grid se podrán <strong>borrar con un click</strong>.</span>
                            </li>
                            <li class="flex gap-2">
                                <span class="text-red-500 font-black flex-shrink-0">▸</span>
                                <span>Para un bloque simple, click directo elimina el bloque completo.</span>
                            </li>
                            <li class="flex gap-2">
                                <span class="text-red-500 font-black flex-shrink-0">▸</span>
                                <span>Para un <strong>bloque fusionado</strong> (varios slots), se mostrarán sus sub-slots. Puedes hacer click en uno específico para borrar solo ese, o click en el borde/encabezado del bloque para eliminarlo completo.</span>
                            </li>
                            <li class="flex gap-2">
                                <span class="text-red-500 font-black flex-shrink-0">▸</span>
                                <span>Mientras el modo esté activo, <strong>no podrás arrastrar asignaturas ni mover bloques</strong>.</span>
                            </li>
                            <li class="flex gap-2">
                                <span class="text-red-500 font-black flex-shrink-0">▸</span>
                                <span>Presiona <kbd class="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono text-[10px]">ESC</kbd> o el botón de la herramienta para salir.</span>
                            </li>
                        </ul>

                        <label class="flex items-center gap-2 pt-2 border-t cursor-pointer">
                            <input
                                v-model="eraserWarningDontShowAgain"
                                type="checkbox"
                                class="w-3.5 h-3.5 text-red-600 rounded border-slate-300"
                            />
                            <span class="text-[11px] text-slate-600">NO VOLVER A MOSTRAR ESTE MENSAJE</span>
                        </label>
                    </div>

                    <div class="px-5 py-3 bg-slate-50 border-t flex justify-end gap-2">
                        <button class="px-4 py-2 text-xs font-bold rounded-lg border hover:bg-white uppercase" @click="cancelEraserWarning">
                            CANCELAR
                        </button>
                        <button
                            class="px-4 py-2 text-xs font-bold rounded-lg bg-red-600 text-white hover:bg-red-700 uppercase"
                            @click="confirmEraserWarning"
                        >
                            ENTENDIDO, ACTIVAR
                        </button>
                    </div>
                </div>
            </div>
        </Teleport>

        <!-- ═════ Modal seleccionar aula fija ═════ -->
        <Teleport to="body">
            <div v-if="pinnedPlaceModalOpen" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" @click.self="closePinnedPlaceModal">
                <div class="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
                    <div class="px-5 py-3 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between">
                        <h3 class="text-sm font-black uppercase text-emerald-800">Fijar Aula por Defecto</h3>
                        <button class="text-slate-400 hover:text-slate-600" @click="closePinnedPlaceModal">
                            <XMarkIcon class="w-5 h-5" />
                        </button>
                    </div>

                    <div class="p-5 space-y-3">
                        <p class="text-[11px] text-slate-600">
                            Elige un aula para que se use automáticamente al crear o mover bloques. Si el aula no está disponible en ese horario, podrás seleccionar otra manualmente.
                        </p>

                        <input
                            v-model="pinnedPlaceSearch"
                            type="text"
                            placeholder="BUSCAR AULA..."
                            class="w-full border-2 border-slate-200 rounded-lg px-3 py-2 text-xs uppercase focus:outline-none focus:border-emerald-500"
                        />

                        <div class="max-h-64 overflow-y-auto border border-slate-200 rounded divide-y divide-slate-100">
                            <div v-if="filteredPlacesList.length === 0" class="p-4 text-center text-[10px] text-slate-400 uppercase">
                                Sin aulas encontradas
                            </div>
                            <button
                                v-for="p in filteredPlacesList"
                                :key="'pp-' + p.id"
                                type="button"
                                class="w-full px-3 py-2 text-left hover:bg-emerald-50 transition flex items-center justify-between gap-2"
                                :class="pinnedPlaceId === p.id ? 'bg-emerald-100' : ''"
                                @click="selectPinnedPlace(p)"
                            >
                                <div class="flex-1 min-w-0">
                                    <div class="text-[11px] font-bold text-slate-700 uppercase truncate">{{ p.name }}</div>
                                    <div v-if="p.shortName" class="text-[9px] text-slate-500 font-mono">{{ p.shortName }}</div>
                                </div>
                                <span v-if="!p.isValidable" class="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 flex-shrink-0">LIBRE</span>
                                <span v-if="pinnedPlaceId === p.id" class="text-emerald-600 flex-shrink-0">✓</span>
                            </button>
                        </div>
                    </div>

                    <div class="px-5 py-3 bg-slate-50 border-t flex justify-end gap-2">
                        <button v-if="pinnedPlaceId" class="px-4 py-2 text-xs font-bold rounded-lg border border-red-300 text-red-600 hover:bg-red-50 uppercase" @click="clearPinnedPlaceAndClose">
                            QUITAR AULA FIJA
                        </button>
                        <button class="px-4 py-2 text-xs font-bold rounded-lg border hover:bg-white uppercase" @click="closePinnedPlaceModal">
                            CERRAR
                        </button>
                    </div>
                </div>
            </div>
        </Teleport>

        <!-- ═════ Modal filtrar fechas visibles ═════ -->
        <Teleport to="body">
            <div v-if="dateVisibilityModalOpen" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" @click.self="closeDateVisibilityModal">
                <div class="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
                    <div class="px-5 py-3 bg-indigo-50 border-b border-indigo-200 flex items-center justify-between">
                        <h3 class="text-sm font-black uppercase text-indigo-800">Fechas visibles</h3>
                        <button class="text-slate-400 hover:text-slate-600" @click="closeDateVisibilityModal">
                            <XMarkIcon class="w-5 h-5" />
                        </button>
                    </div>

                    <div class="p-5 space-y-3">
                        <p class="text-[11px] text-slate-600">
                            Selecciona qué fechas se muestran como columnas en el editor. Haz click para ocultar/mostrar. Por defecto todas están visibles.
                        </p>

                        <div class="flex gap-2">
                            <button
                                type="button"
                                class="flex-1 px-3 py-1.5 text-[10px] font-black rounded border-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50 uppercase"
                                @click="enableAllDates"
                            >
                                ✓ HABILITAR TODAS
                            </button>
                            <button
                                type="button"
                                class="flex-1 px-3 py-1.5 text-[10px] font-black rounded border-2 border-red-300 text-red-700 hover:bg-red-50 uppercase"
                                @click="disableAllDates"
                            >
                                ✕ DESHABILITAR TODAS
                            </button>
                        </div>

                        <div class="max-h-72 overflow-y-auto border border-slate-200 rounded divide-y divide-slate-100">
                            <div v-if="allEnabledScheduleDates.length === 0" class="p-4 text-center text-[10px] text-slate-400 uppercase">
                                Sin fechas configuradas
                            </div>
                            <button
                                v-for="d in allEnabledScheduleDates"
                                :key="'dv-' + d.date"
                                type="button"
                                class="w-full px-3 py-2 text-left transition flex items-center justify-between gap-2"
                                :class="hiddenDateKeys.has(d.date)
                                    ? 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                                    : 'bg-white text-slate-700 hover:bg-indigo-50'"
                                @click="toggleDateVisibility(d.date)"
                            >
                                <div class="flex items-center gap-2 flex-1 min-w-0">
                                    <div
                                        class="w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center"
                                        :class="hiddenDateKeys.has(d.date)
                                            ? 'border-slate-300 bg-white'
                                            : 'border-indigo-500 bg-indigo-500'"
                                    >
                                        <svg v-if="!hiddenDateKeys.has(d.date)" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor" class="w-3 h-3 text-white">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                        </svg>
                                    </div>
                                    <span class="text-[11px] font-bold uppercase truncate">{{ formatIsoDate(d.date) }}</span>
                                </div>
                                <span v-if="hiddenDateKeys.has(d.date)" class="text-[9px] font-black uppercase text-red-500 flex-shrink-0">OCULTA</span>
                            </button>
                        </div>

                        <div class="text-[10px] text-slate-500 text-center">
                            {{ visibleDatesCount }} de {{ allDatesCount }} visibles
                        </div>
                    </div>

                    <div class="px-5 py-3 bg-slate-50 border-t flex justify-end">
                        <button class="px-4 py-2 text-xs font-bold rounded-lg border hover:bg-white uppercase" @click="closeDateVisibilityModal">
                            CERRAR
                        </button>
                    </div>
                </div>
            </div>
        </Teleport>

        <!-- ═════ Error banner ═════ -->
        <Transition enter-active-class="transition-opacity" leave-active-class="transition-opacity" enter-from-class="opacity-0" leave-to-class="opacity-0">
            <div v-if="errorMsg" class="fixed top-4 right-4 z-[10000] p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 shadow-lg max-w-sm">
                {{ errorMsg }}
            </div>
        </Transition>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { XMarkIcon, TrashIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import { api } from '@/shared/services/api'
import { API } from '@/shared/api'
import PeriodSelector from '@/app/components/ui/form/PeriodSelector.vue'
import type {
    AcademicSchedule,
    AssignableAssignment,
    SchedulePlace,
} from '@/modules/schedules/types/academicSchedule.type'
import { DAY_LABELS_FULL } from '@/modules/schedules/types/academicSchedule.type'

const STORAGE_KEY = 'schedules_academic_period'

// ═══════════════════════════ STATE ═══════════════════════════
const errorMsg = ref('')

// Periodo
const selectedPeriodId = ref<number | null>(null)
const periodSelectorRef = ref<InstanceType<typeof PeriodSelector> | null>(null)
const periodLocked = ref(false)
const lockedPeriodName = ref('')

// Filtros base
const campuses = ref<any[]>([])
const modalityTypes = ref<any[]>([])
const modalities = ref<any[]>([])
const selectedCampusId = ref<number | null>(null)
const selectedModalityTypeId = ref<number | null>(null)

// Config resuelta
const resolvedModalityId = ref<number | null>(null)
const resolvedConfigId = ref<number | null>(null)
const selectedConfig = ref<any>(null)
const configError = ref<string | null>(null)
const phaseActive = ref(false)

// Datos del editor
const assignableAssignments = ref<AssignableAssignment[]>([])
const schedules = ref<AcademicSchedule[]>([])
const places = ref<SchedulePlace[]>([])
const loadingAssignable = ref(false)
const loadingSchedules = ref(false)

// Filtro vista
const filterType = ref<'teacher' | 'group' | 'place'>('teacher')
const filterValue = ref<number | null>(null)

// ══════════════════════ COMPUTED ═══════════════════════════
const modalityTypeConfig = computed(() => selectedConfig.value?.modality?.modalityType?.config?.config ?? null)

const usesSpecificDates = computed(() => !!modalityTypeConfig.value?.schedule?.uses_specific_dates)

const scheduleWeekDays = computed(() => {
    const weekDays = modalityTypeConfig.value?.schedule?.week_days ?? {}
    const map: Record<string, number> = { monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 7 }
    const result: number[] = []
    for (const key in weekDays) {
        if (weekDays[key] && map[key]) result.push(map[key])
    }
    return result.sort((a, b) => a - b)
})

// Fechas ocultas manualmente por el usuario (via herramienta de filtro de fechas)
const hiddenDateKeys = ref<Set<string>>(new Set())
const dateVisibilityModalOpen = ref(false)

const allEnabledScheduleDates = computed<{ date: string }[]>(() => {
    return (selectedConfig.value?.scheduleDates ?? []).filter((d: any) => d.enabled)
})

const allDatesCount = computed(() => allEnabledScheduleDates.value.length)
const visibleDatesCount = computed(() => allDatesCount.value - hiddenDateKeys.value.size)

function openDateVisibilityModal() {
    if (eraserMode.value || comparisonMode.value || listMode.value) return
    dateVisibilityModalOpen.value = true
}
function closeDateVisibilityModal() { dateVisibilityModalOpen.value = false }

function toggleDateVisibility(date: string) {
    const next = new Set(hiddenDateKeys.value)
    if (next.has(date)) next.delete(date)
    else next.add(date)
    hiddenDateKeys.value = next
}

function enableAllDates() {
    hiddenDateKeys.value = new Set()
}

function disableAllDates() {
    hiddenDateKeys.value = new Set(allEnabledScheduleDates.value.map(d => d.date))
}

const columns = computed(() => {
    if (usesSpecificDates.value) {
        const dates = allEnabledScheduleDates.value.filter((d: any) => !hiddenDateKeys.value.has(d.date))
        return dates.map((d: any) => ({
            key: 'date-' + d.date,
            label: formatIsoDate(d.date),
            dayOfWeek: null as number | null,
            date: d.date as string | null,
        }))
    }
    return scheduleWeekDays.value.map(dow => ({
        key: 'dow-' + dow,
        label: DAY_LABELS_FULL[dow],
        dayOfWeek: dow as number | null,
        date: null as string | null,
    }))
})

const dayStartHour = computed(() => parseTime(modalityTypeConfig.value?.daily_schedule?.start ?? '07:00'))
const dayEndHour = computed(() => parseTime(modalityTypeConfig.value?.daily_schedule?.end ?? '20:00'))
const blockDuration = computed<number>(() => {
    const d = modalityTypeConfig.value?.class_blocks?.duration_minutes
    return typeof d === 'number' && d > 0 ? d : 60
})

interface HourSlot { key: string; startLabel: string; endLabel: string; startMinutes: number; endMinutes: number; durationMinutes: number }

// Info del receso (si está habilitado en la config del modality type)
interface BreakInfo {
    durationMinutes: number
    startMinutes: number
    endMinutes: number
    startLabel: string
    endLabel: string
}

const breakInfo = computed<BreakInfo | null>(() => {
    const cfg = modalityTypeConfig.value?.daily_schedule?.break
    if (!cfg?.enabled) return null
    const duration = Number(cfg.duration_minutes) || 0
    if (duration <= 0) return null

    const dayStart = dayStartHour.value
    const dayEnd = dayEndHour.value
    const totalMin = dayEnd - dayStart
    if (duration >= totalMin) return null

    // Colocamos el receso lo más cercano al centro del día, alineado a bloques
    const section1TargetMin = Math.floor((totalMin - duration) / 2)
    const section1Blocks = Math.floor(section1TargetMin / blockDuration.value)
    const breakStart = dayStart + section1Blocks * blockDuration.value
    const breakEnd = breakStart + duration
    if (breakEnd >= dayEnd) return null

    return {
        durationMinutes: duration,
        startMinutes: breakStart,
        endMinutes: breakEnd,
        startLabel: minutesToLabel(breakStart),
        endLabel: minutesToLabel(breakEnd),
    }
})

// Opciones válidas para los selects de start/end time en el modal
const startTimeOptions = computed<string[]>(() => {
    // Derivamos directamente de los slots visibles (que ya excluyen el receso)
    return hourSlots.value.map(s => s.startLabel)
})

const endTimeOptions = computed<string[]>(() => {
    const list: string[] = []
    const step = blockDuration.value
    const startMinutes = dropModal.startTime ? parseTime(dropModal.startTime) : dayStartHour.value

    // Si el receso está activo y startMinutes cae antes del receso, el endMinutes no puede cruzarlo
    const bInfo = breakInfo.value
    const sectionEnd = bInfo && startMinutes < bInfo.startMinutes
        ? bInfo.startMinutes
        : dayEndHour.value

    for (let m = startMinutes + step; m <= sectionEnd; m += step) {
        list.push(minutesToLabel(m))
    }
    return list
})

function onStartTimeChange() {
    const start = parseTime(dropModal.startTime)
    const end = parseTime(dropModal.endTime)
    const bInfo = breakInfo.value
    const sectionEnd = bInfo && start < bInfo.startMinutes ? bInfo.startMinutes : dayEndHour.value
    // Si el endTime actual queda antes/igual al nuevo startTime o cruza el receso, ajustarlo
    if (end <= start || end > sectionEnd) {
        dropModal.endTime = minutesToLabel(Math.min(start + blockDuration.value, sectionEnd))
    }
}

const hourSlots = computed<HourSlot[]>(() => {
    const slots: HourSlot[] = []
    const startMin = dayStartHour.value
    const endMin = dayEndHour.value
    const step = blockDuration.value
    const bInfo = breakInfo.value

    // Sección 1: dayStart → breakStart (o dayEnd si no hay receso)
    const section1End = bInfo ? bInfo.startMinutes : endMin
    for (let m = startMin; m + step <= section1End; m += step) {
        slots.push({
            key: String(m),
            startLabel: minutesToLabel(m),
            endLabel: minutesToLabel(m + step),
            startMinutes: m,
            endMinutes: m + step,
            durationMinutes: step,
        })
    }

    // Sección 2: breakEnd → dayEnd
    if (bInfo) {
        for (let m = bInfo.endMinutes; m + step <= endMin; m += step) {
            slots.push({
                key: String(m),
                startLabel: minutesToLabel(m),
                endLabel: minutesToLabel(m + step),
                startMinutes: m,
                endMinutes: m + step,
                durationMinutes: step,
            })
        }
    }

    return slots
})

// Filas del grid: intercala el receso entre los slots de enseñanza
type HourRow =
    | { kind: 'slot'; key: string; slot: HourSlot }
    | { kind: 'break'; key: string; startLabel: string; endLabel: string; durationMinutes: number }

const hourRows = computed<HourRow[]>(() => {
    const rows: HourRow[] = []
    const bInfo = breakInfo.value
    for (const slot of hourSlots.value) {
        if (bInfo && slot.startMinutes === bInfo.endMinutes) {
            rows.push({
                kind: 'break',
                key: 'break-' + bInfo.startMinutes,
                startLabel: bInfo.startLabel,
                endLabel: bInfo.endLabel,
                durationMinutes: bInfo.durationMinutes,
            })
        }
        rows.push({ kind: 'slot', key: slot.key, slot })
    }
    return rows
})

// Devuelve el índice (0-based) de un slot dentro de hourRows, o -1 si no existe
function slotRowIndex(startMinutes: number): number {
    return hourRows.value.findIndex(r => r.kind === 'slot' && r.slot.startMinutes === startMinutes)
}

const filteredAssignments = computed(() => {
    if (filterType.value === 'teacher' && filterValue.value) {
        return assignableAssignments.value.filter(a => a.teacher.id === filterValue.value)
    }
    if (filterType.value === 'group' && filterValue.value) {
        return assignableAssignments.value.filter(a => a.group?.id === filterValue.value)
    }
    return assignableAssignments.value.filter(a => !a.isComplete)
})

const filterOptions = computed(() => {
    if (filterType.value === 'teacher') {
        const map = new Map<number, { id: number; label: string }>()
        for (const a of assignableAssignments.value) {
            if (a.teacher.id && !map.has(a.teacher.id)) {
                map.set(a.teacher.id, { id: a.teacher.id, label: a.teacher.name || '—' })
            }
        }
        return [...map.values()].sort((x, y) => x.label.localeCompare(y.label))
    }
    if (filterType.value === 'group') {
        const map = new Map<number, { id: number; label: string }>()
        for (const a of assignableAssignments.value) {
            if (a.group && !map.has(a.group.id)) {
                map.set(a.group.id, { id: a.group.id, label: a.group.name })
            }
        }
        return [...map.values()].sort((x, y) => x.label.localeCompare(y.label))
    }
    return places.value.map(p => ({ id: p.id, label: p.name + (p.shortName ? ' (' + p.shortName + ')' : '') })).sort((x, y) => x.label.localeCompare(y.label))
})

const visibleSchedules = computed(() => {
    if (filterType.value === 'teacher' && filterValue.value) {
        return schedules.value.filter(s => s.teacherAssignment?.teacher?.id === filterValue.value)
    }
    if (filterType.value === 'group' && filterValue.value) {
        return schedules.value.filter(s => s.teacherAssignment?.group?.id === filterValue.value)
    }
    if (filterType.value === 'place' && filterValue.value) {
        return schedules.value.filter(s => s.placeId === filterValue.value)
    }
    return schedules.value
})

// ══════════════════════ UTILITIES ═══════════════════════════
function parseTime(t: string): number {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + m
}

function minutesToLabel(m: number): string {
    const h = Math.floor(m / 60)
    const mm = m % 60
    return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

function remainingHours(a: AssignableAssignment): string {
    // Para modalidades con fechas específicas, mostrar sesiones restantes
    if (a.usesDates && a.remainingSessions !== undefined) {
        return a.remainingSessions + 'S'
    }
    return String(Math.floor(a.remainingMinutes / 60))
}

function placeShortLabel(block: AcademicSchedule): string {
    if (!block.place) return ''
    const label = block.place.shortName || block.place.name
    const m = /(\d+)/.exec(label)
    return m ? `A. ${m[1]}` : label
}

function colMatchesSchedule(col: any, sch: AcademicSchedule): boolean {
    if (col.date) return sch.date === col.date
    return sch.dayOfWeek === col.dayOfWeek && !sch.date
}

function getBlocksStartingAt(col: any, slot: HourSlot) {
    return visibleSchedules.value.filter(s => colMatchesSchedule(col, s) && parseTime(s.startTime) === slot.startMinutes)
}

function cellOccupied(col: any, slot: HourSlot): boolean {
    return visibleSchedules.value.some(s => {
        if (!colMatchesSchedule(col, s)) return false
        const st = parseTime(s.startTime)
        const et = parseTime(s.endTime)
        return slot.startMinutes >= st && slot.startMinutes < et
    })
}

// Constantes de layout de la grilla CSS
const ROW_HEIGHT = 70
const HOUR_COL_WIDTH = 90

// grid-template-columns: columna fija de horas + N columnas iguales para días
const gridContainerStyle = computed(() => ({
    gridTemplateColumns: `${HOUR_COL_WIDTH}px repeat(${columns.value.length}, minmax(140px, 1fr))`,
}))

// El bloque se posiciona con grid-column y grid-row.
// Header = row 1. Primer slot = row 2. Slot N = row (N+1).
function findColIndex(colKey: string): number {
    // +2 porque: col 1 = columna de horas, col 2 = primer día
    return columns.value.findIndex(c => c.key === colKey) + 2
}

function blockGridStyle(block: AcademicSchedule) {
    // Encontrar la columna (día o fecha)
    const colKey = block.date ? 'date-' + block.date : 'dow-' + block.dayOfWeek
    const colIndex = findColIndex(colKey)
    if (colIndex < 2) return { display: 'none' }

    // Encontrar el índice de fila del slot de inicio (en hourRows, no hourSlots)
    const startMin = parseTime(block.startTime)
    const rowIdx = slotRowIndex(startMin)
    if (rowIdx < 0) return { display: 'none' }

    const et = parseTime(block.endTime)
    const rowspan = Math.max(1, Math.ceil((et - startMin) / blockDuration.value))

    // Header es row 1, primer slot es row 2
    const rowStart = rowIdx + 2
    const rowEnd = rowStart + rowspan

    return {
        gridColumn: `${colIndex} / span 1`,
        gridRow: `${rowStart} / ${rowEnd}`,
    }
}

const dragPreviewGridStyle = computed(() => {
    if (!dragPreview.value) return null
    const colIndex = findColIndex(dragPreview.value.colKey)
    if (colIndex < 2) return null

    const slot = hourSlots.value.find(s => s.key === dragPreview.value!.slotKey)
    if (!slot) return null
    const rowIdx = slotRowIndex(slot.startMinutes)
    if (rowIdx < 0) return null

    const rowStart = rowIdx + 2
    const rowEnd = rowStart + dragPreview.value.rowspan

    return {
        gridColumn: `${colIndex} / span 1`,
        gridRow: `${rowStart} / ${rowEnd}`,
    }
})

// Lista plana de todos los bloques visibles (se renderizan como overlay del grid)
const allBlocks = computed(() => visibleSchedules.value)

function showError(msg: string) {
    errorMsg.value = msg
    setTimeout(() => { errorMsg.value = '' }, 4000)
}

// ══════════════════════ PERIODO + LOCK ═══════════════════════════
function savePeriodToStorage() { localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: selectedPeriodId.value, name: lockedPeriodName.value })) }
function clearPeriodStorage() { localStorage.removeItem(STORAGE_KEY) }
function restorePeriodFromStorage() {
    try {
        const r = localStorage.getItem(STORAGE_KEY)
        if (!r) return
        const s = JSON.parse(r)
        if (s?.id) {
            selectedPeriodId.value = s.id
            lockedPeriodName.value = s.name ?? ''
            periodLocked.value = true
        }
    } catch {}
}
function toggleLock() {
    if (!periodLocked.value) {
        if (!selectedPeriodId.value) return
        lockedPeriodName.value = periodSelectorRef.value?.selectedPeriod?.name ?? 'SIN PERIODO'
        periodLocked.value = true
        savePeriodToStorage()
    } else {
        periodLocked.value = false
        clearPeriodStorage()
        resetAll()
    }
}

// ══════════════════════ DATA LOADING ═══════════════════════════
async function fetchCampuses() {
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.campuses.list, { params: { per_page: 100 } })
        campuses.value = (data?.items ?? data?.data ?? data ?? []).map((c: any) => ({ id: c.id, name: c.name ?? c.shortName ?? `#${c.id}` }))
    } catch { campuses.value = [] }
}

async function fetchModalityTypes() {
    try {
        const { data } = await api.get(API.SUPERADMIN_API.modalityTypes.list, { params: { per_page: 100 } })
        modalityTypes.value = (data?.items ?? data?.data ?? data ?? []).map((mt: any) => ({ id: mt.id, name: mt.name ?? `#${mt.id}` }))
    } catch { modalityTypes.value = [] }
}

async function fetchModalities() {
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.modalities.list, { params: { per_page: 200 } })
        modalities.value = data?.items ?? data?.data ?? data ?? []
    } catch { modalities.value = [] }
}

async function fetchPlaces() {
    try {
        const { data } = await api.get(API.SCHOOL_SERVICES_API.places.list, { params: { per_page: 500 } })
        const rows = data?.items ?? data?.data ?? data
        places.value = Array.isArray(rows) ? rows.map((p: any) => ({
            id: p.id, name: p.name, shortName: p.shortName ?? p.short_name ?? null, capacity: p.capacity ?? 0, isValidable: (p.isValidable ?? p.is_validable ?? true) as boolean,
        })) : []
    } catch { places.value = [] }
}

function resolveModality() {
    resolvedModalityId.value = null
    configError.value = null
    resolvedConfigId.value = null
    phaseActive.value = false
    selectedConfig.value = null
    assignableAssignments.value = []
    schedules.value = []
    filterValue.value = null
    if (!selectedCampusId.value || !selectedModalityTypeId.value) return
    const m = modalities.value.find((m: any) =>
        (m.campusId === selectedCampusId.value || m.campus_id === selectedCampusId.value)
        && (m.modalityTypeId === selectedModalityTypeId.value || m.modality_type_id === selectedModalityTypeId.value)
    )
    if (m) {
        resolvedModalityId.value = m.id
        resolveConfig()
    }
}

async function resolveConfig() {
    resolvedConfigId.value = null
    configError.value = null
    phaseActive.value = false
    selectedConfig.value = null
    hiddenDateKeys.value = new Set()
    if (!selectedPeriodId.value || !resolvedModalityId.value) return
    try {
        const { data } = await api.get(API.SCA_API.academicLoadConfigs.list, {
            params: {
                per_page: 1,
                search: { college_academic_period_id: selectedPeriodId.value, modality_id: resolvedModalityId.value },
            },
        })
        const items = data?.items ?? data?.data ?? []
        if (!items.length) {
            configError.value = 'No existe configuración de carga académica para este periodo y modalidad.'
            return
        }
        resolvedConfigId.value = items[0].id
        // Cargar detalle completo (para schedule_dates, modalityType.config, etc.)
        const detail = await api.get(API.SCA_API.academicLoadConfigs.byId(items[0].id))
        selectedConfig.value = detail.data
        phaseActive.value = !!(detail.data?.phaseSchedule ?? detail.data?.phase_schedule)

        // Cargar asignaciones y horarios
        await Promise.all([
            loadAssignments(resolvedConfigId.value),
            loadSchedules(resolvedConfigId.value),
        ])
    } catch {
        configError.value = 'Error al buscar la configuración.'
    }
}

async function loadAssignments(id: number) {
    loadingAssignable.value = true
    try {
        const { data } = await api.get(API.SCHEDULES_API.academic.assignable(id))
        assignableAssignments.value = data ?? []
    } catch {
        showError('No se pudieron cargar las asignaciones.')
        assignableAssignments.value = []
    } finally { loadingAssignable.value = false }
}

async function loadSchedules(id: number) {
    loadingSchedules.value = true
    try {
        const { data } = await api.get(API.SCHEDULES_API.academic.byConfig(id))
        schedules.value = data ?? []
    } catch {
        showError('No se pudieron cargar los horarios.')
        schedules.value = []
    } finally { loadingSchedules.value = false }
}

// ══════════════════════ EVENTS ═══════════════════════════
function resetAll() {
    selectedCampusId.value = null
    selectedModalityTypeId.value = null
    resolvedModalityId.value = null
    resolvedConfigId.value = null
    selectedConfig.value = null
    configError.value = null
    phaseActive.value = false
    assignableAssignments.value = []
    schedules.value = []
    filterType.value = 'teacher'
    filterValue.value = null
    hiddenDateKeys.value = new Set()
}

function onPeriodChange() {
    resolvedConfigId.value = null
    configError.value = null
    selectedConfig.value = null
    if (selectedPeriodId.value && resolvedModalityId.value) resolveConfig()
}

function onCampusOrTypeChange() {
    resolveModality()
}

// ══════════════════════ POINTER DRAG & DROP ═══════════════════════════
const draggedAssignmentId = ref<number | null>(null)
const draggedAssignment = ref<AssignableAssignment | null>(null)
const draggedBlockId = ref<number | null>(null)
const draggedBlock = ref<AcademicSchedule | null>(null)

interface DragPreview { colKey: string; slotKey: string; rowspan: number }
const dragPreview = ref<DragPreview | null>(null)

// Ghost element (sigue al cursor/dedo durante el drag)
interface GhostState {
    visible: boolean
    x: number
    y: number
    width: number
    title: string
    subtitle: string
}
const ghost = reactive<GhostState>({
    visible: false,
    x: 0, y: 0, width: 160,
    title: '', subtitle: '',
})

// Estado interno del gesture
interface PointerDragState {
    pointerId: number
    startX: number
    startY: number
    offsetX: number    // distancia del puntero respecto al origen del ghost
    offsetY: number
    activated: boolean // true cuando pasó el threshold y empezó el drag real
    touchActivationTimer: ReturnType<typeof setTimeout> | null
    pointerType: string
}
let pointerDrag: PointerDragState | null = null

const DRAG_ACTIVATION_DISTANCE_PX = 6  // mouse/pen: empezar drag al mover 6px
const TOUCH_ACTIVATION_MS = 250         // touch: long-press 250ms para iniciar drag

function defaultDurationMinutes(a: AssignableAssignment | null): number {
    const block = blockDuration.value
    if (!a) return block
    return Math.min(block, a.remainingMinutes || block)
}

// ─── Inicio drag: asignación del panel lateral ───
function onAssignmentPointerDown(a: AssignableAssignment, e: PointerEvent) {
    if (a.isComplete || !phaseActive.value) return
    if (eraserMode.value) return  // drag deshabilitado en modo borrador
    if (e.button !== 0 && e.pointerType === 'mouse') return  // solo botón izq

    draggedAssignment.value = a
    draggedAssignmentId.value = a.id
    draggedBlock.value = null
    draggedBlockId.value = null

    ghost.title = a.subject?.shortName || a.subject?.name || '—'
    ghost.subtitle = (a.teacher?.name || '') + (a.group ? ' · ' + a.group.name : '')

    startPointerDrag(e)
}

// ─── Inicio drag: bloque existente del grid ───
function onBlockPointerDown(block: AcademicSchedule, e: PointerEvent) {
    if (!phaseActive.value) return
    if (eraserMode.value) return  // drag deshabilitado en modo borrador
    if (e.button !== 0 && e.pointerType === 'mouse') return

    // Si el click fue sobre un botón interactivo (ej: bote de basura), no iniciar drag
    const target = e.target as HTMLElement
    if (target.closest('button, a, input, select')) return

    draggedBlock.value = block
    draggedBlockId.value = block.id
    draggedAssignment.value = null
    draggedAssignmentId.value = null

    ghost.title = block.teacherAssignment?.subject?.shortName || block.teacherAssignment?.subject?.name || '—'
    ghost.subtitle = (block.teacherAssignment?.teacher?.name || '') + (block.teacherAssignment?.group ? ' · ' + block.teacherAssignment.group.name : '')

    startPointerDrag(e)
}

function startPointerDrag(e: PointerEvent) {
    e.preventDefault()

    const target = e.currentTarget as HTMLElement
    const rect = target.getBoundingClientRect()

    pointerDrag = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
        activated: false,
        touchActivationTimer: null,
        pointerType: e.pointerType,
    }

    ghost.width = Math.min(rect.width, 220)

    // Capturar al elemento para no perder tracking si salimos de él
    try { target.setPointerCapture(e.pointerId) } catch {}

    // Listeners globales
    window.addEventListener('pointermove', onGlobalPointerMove)
    window.addEventListener('pointerup', onGlobalPointerUp)
    window.addEventListener('pointercancel', onGlobalPointerCancel)

    // Touch: esperar long press antes de activar el drag
    if (e.pointerType === 'touch') {
        pointerDrag.touchActivationTimer = setTimeout(() => {
            if (pointerDrag) activatePointerDrag()
        }, TOUCH_ACTIVATION_MS)
    }
}

function activatePointerDrag() {
    if (!pointerDrag) return
    pointerDrag.activated = true
    ghost.visible = true
}

function onGlobalPointerMove(e: PointerEvent) {
    if (!pointerDrag || e.pointerId !== pointerDrag.pointerId) return

    // Para mouse/pen: activar al superar threshold de distancia
    if (!pointerDrag.activated && pointerDrag.pointerType !== 'touch') {
        const dx = e.clientX - pointerDrag.startX
        const dy = e.clientY - pointerDrag.startY
        if (dx * dx + dy * dy < DRAG_ACTIVATION_DISTANCE_PX * DRAG_ACTIVATION_DISTANCE_PX) return
        activatePointerDrag()
    }

    // Para touch: si el usuario se mueve antes del long-press, cancelar (scroll normal)
    if (!pointerDrag.activated && pointerDrag.pointerType === 'touch') {
        const dx = e.clientX - pointerDrag.startX
        const dy = e.clientY - pointerDrag.startY
        if (dx * dx + dy * dy > 100) {
            cleanupPointerDrag()
            return
        }
    }

    if (!pointerDrag.activated) return

    // Actualizar posición del ghost
    ghost.x = e.clientX - pointerDrag.offsetX
    ghost.y = e.clientY - pointerDrag.offsetY

    // Detectar celda bajo el puntero
    const cell = findCellAt(e.clientX, e.clientY)
    if (cell) {
        updateDragPreview(cell.colKey, cell.slotKey)
    } else {
        dragPreview.value = null
    }
}

function findCellAt(x: number, y: number): { colKey: string; slotKey: string } | null {
    // Esconder el ghost temporalmente para que elementFromPoint no lo detecte
    const prevVisible = ghost.visible
    ghost.visible = false
    const el = document.elementFromPoint(x, y) as HTMLElement | null
    ghost.visible = prevVisible

    if (!el) return null
    const cellEl = el.closest<HTMLElement>('[data-cell-col][data-cell-slot]')
    if (!cellEl) return null

    return {
        colKey: cellEl.dataset.cellCol || '',
        slotKey: cellEl.dataset.cellSlot || '',
    }
}

function updateDragPreview(colKey: string, slotKey: string) {
    let rowspan: number
    if (draggedBlock.value) {
        const st = parseTime(draggedBlock.value.startTime)
        const et = parseTime(draggedBlock.value.endTime)
        rowspan = Math.max(1, Math.ceil((et - st) / blockDuration.value))
    } else {
        rowspan = Math.max(1, Math.ceil(defaultDurationMinutes(draggedAssignment.value) / blockDuration.value))
    }
    dragPreview.value = { colKey, slotKey, rowspan }
}

function onGlobalPointerUp(e: PointerEvent) {
    if (!pointerDrag || e.pointerId !== pointerDrag.pointerId) return

    // Si ya se activó, hacer drop
    if (pointerDrag.activated) {
        const cell = findCellAt(e.clientX, e.clientY)
        if (cell) {
            const col = columns.value.find(c => c.key === cell.colKey)
            const slot = hourSlots.value.find(s => s.key === cell.slotKey)
            if (col && slot) {
                if (draggedAssignment.value) {
                    openDropModal(draggedAssignment.value, col, slot)
                } else if (draggedBlock.value) {
                    openMoveModal(draggedBlock.value, col, slot)
                }
            }
        }
    }

    cleanupPointerDrag()
}

function onGlobalPointerCancel(e: PointerEvent) {
    if (!pointerDrag || e.pointerId !== pointerDrag.pointerId) return
    cleanupPointerDrag()
}

function cleanupPointerDrag() {
    if (pointerDrag?.touchActivationTimer) {
        clearTimeout(pointerDrag.touchActivationTimer)
    }
    pointerDrag = null
    window.removeEventListener('pointermove', onGlobalPointerMove)
    window.removeEventListener('pointerup', onGlobalPointerUp)
    window.removeEventListener('pointercancel', onGlobalPointerCancel)

    ghost.visible = false
    draggedAssignmentId.value = null
    draggedAssignment.value = null
    draggedBlockId.value = null
    draggedBlock.value = null
    dragPreview.value = null
}

// ══════════════════════ DROP MODAL ═══════════════════════════
interface DropModalState {
    open: boolean
    mode: 'create' | 'move'
    teacherAssignmentId: number | null
    scheduleId: number | null
    subjectName: string
    teacherName: string
    isVacancy: boolean
    groupName: string
    col: any
    slot: HourSlot | null
    slotLabel: string
    placeId: number | null
    startTime: string
    endTime: string
    availablePlaces: SchedulePlace[]
    loadingPlaces: boolean
    conflicts: string[]
    saving: boolean
    lockPlace: boolean
}

const dropModal = reactive<DropModalState>({
    open: false,
    mode: 'create',
    teacherAssignmentId: null,
    scheduleId: null,
    subjectName: '',
    teacherName: '',
    isVacancy: false,
    groupName: '',
    col: null,
    slot: null,
    slotLabel: '',
    placeId: null,
    startTime: '',
    endTime: '',
    availablePlaces: [],
    loadingPlaces: false,
    conflicts: [],
    saving: false,
    lockPlace: false,
})

let placesCheckTimeout: ReturnType<typeof setTimeout> | null = null

function openDropModal(a: AssignableAssignment, col: any, slot: HourSlot) {
    const duration = defaultDurationMinutes(a)
    const startMin = slot.startMinutes
    const endMin = Math.min(startMin + duration, dayEndHour.value)

    dropModal.open = true
    dropModal.mode = 'create'
    dropModal.teacherAssignmentId = a.id
    dropModal.scheduleId = null
    dropModal.subjectName = a.subject?.name ?? ''
    dropModal.teacherName = a.teacher.name ?? ''
    dropModal.isVacancy = a.teacher.isVacancy
    dropModal.groupName = a.group?.name ?? ''
    dropModal.col = col
    dropModal.slot = slot
    dropModal.slotLabel = slotLabel(col, startMin, endMin)
    dropModal.startTime = minutesToLabel(startMin)
    dropModal.endTime = minutesToLabel(endMin)
    dropModal.conflicts = []
    dropModal.saving = false

    // Prioridad 1: aula fija (herramienta "SELECCIONAR AULA")
    if (pinnedPlaceId.value) {
        const p = places.value.find(x => x.id === pinnedPlaceId.value) ?? null
        dropModal.placeId = p?.id ?? null
        dropModal.availablePlaces = p ? [p] : []
        dropModal.lockPlace = false  // no bloqueamos — si hay conflicto permitimos elegir otra
    }
    // Prioridad 2: filtro de aula activo
    else if (filterType.value === 'place' && filterValue.value) {
        const p = places.value.find(x => x.id === filterValue.value) ?? null
        dropModal.placeId = p?.id ?? null
        dropModal.availablePlaces = p ? [p] : []
        dropModal.lockPlace = true
    } else {
        dropModal.placeId = null
        dropModal.availablePlaces = []
        dropModal.lockPlace = false
    }

    refreshAvailablePlaces()
}

function openMoveModal(block: AcademicSchedule, col: any, slot: HourSlot) {
    const originalStart = parseTime(block.startTime)
    const originalEnd = parseTime(block.endTime)
    const duration = originalEnd - originalStart
    const startMin = slot.startMinutes
    const endMin = Math.min(startMin + duration, dayEndHour.value)

    dropModal.open = true
    dropModal.mode = 'move'
    dropModal.teacherAssignmentId = block.teacherAssignmentId
    dropModal.scheduleId = block.id
    dropModal.subjectName = block.teacherAssignment?.subject?.name ?? ''
    dropModal.teacherName = block.teacherAssignment?.teacher?.name ?? ''
    dropModal.isVacancy = !!block.teacherAssignment?.teacher?.isVacancy
    dropModal.groupName = block.teacherAssignment?.group?.name ?? ''
    dropModal.col = col
    dropModal.slot = slot
    dropModal.slotLabel = slotLabel(col, startMin, endMin)
    dropModal.startTime = minutesToLabel(startMin)
    dropModal.endTime = minutesToLabel(endMin)
    dropModal.conflicts = []
    dropModal.saving = false

    // Prioridad: aula fija > filtro aula > aula original del bloque
    if (pinnedPlaceId.value) {
        dropModal.placeId = pinnedPlaceId.value
        dropModal.lockPlace = false
    } else if (filterType.value === 'place' && filterValue.value != null) {
        dropModal.placeId = filterValue.value
        dropModal.lockPlace = true
    } else {
        dropModal.placeId = block.placeId
        dropModal.lockPlace = false
    }

    refreshAvailablePlaces()
}

function slotLabel(col: any, startMin: number, endMin: number): string {
    const label = col.date ? formatIsoDate(col.date) : DAY_LABELS_FULL[col.dayOfWeek]
    return `${label} · ${minutesToLabel(startMin)} - ${minutesToLabel(endMin)}`
}

function closeDropModal() {
    dropModal.open = false
    dropModal.teacherAssignmentId = null
    dropModal.scheduleId = null
    dropModal.col = null
    dropModal.slot = null
    dropModal.conflicts = []
    dropModal.availablePlaces = []
    dropModal.lockPlace = false
}

async function refreshAvailablePlaces() {
    if (!dropModal.open || dropModal.lockPlace) return
    if (placesCheckTimeout) clearTimeout(placesCheckTimeout)
    placesCheckTimeout = setTimeout(async () => {
        dropModal.loadingPlaces = true
        try {
            const { data } = await api.post(API.SCHEDULES_API.academic.availablePlaces, {
                teacher_assignment_id: dropModal.teacherAssignmentId,
                day_of_week:           dropModal.col.dayOfWeek,
                date:                  dropModal.col.date,
                start_time:            dropModal.startTime,
                end_time:              dropModal.endTime,
                exclude_schedule_id:   dropModal.mode === 'move' ? dropModal.scheduleId : undefined,
            })
            dropModal.availablePlaces = data ?? []

            // Verificar si el aula fija está disponible en este slot
            if (pinnedPlaceId.value && dropModal.placeId === pinnedPlaceId.value) {
                const isAvailable = dropModal.availablePlaces.some(p => p.id === pinnedPlaceId.value)
                if (!isAvailable) {
                    // Aula fija NO disponible: limpiar selección, mostrar aviso
                    dropModal.placeId = null
                    dropModal.conflicts = [
                        `El aula fija "${pinnedPlaceLabel.value}" no está disponible en este horario. Selecciona otra aula manualmente.`,
                    ]
                }
            } else {
                // Si el place preseleccionado ya no está disponible, limpiarlo
                if (dropModal.placeId && !dropModal.availablePlaces.some(p => p.id === dropModal.placeId)) {
                    dropModal.placeId = null
                }
            }
        } catch {
            dropModal.availablePlaces = []
        } finally {
            dropModal.loadingPlaces = false
        }
    }, 200)
}

watch(
    () => [dropModal.startTime, dropModal.endTime],
    () => { if (dropModal.open && !dropModal.lockPlace) refreshAvailablePlaces() }
)

function extractErrorMessage(e: any): string {
    const data = e?.response?.data
    if (data?.message) return data.message
    if (data?.errors && typeof data.errors === 'object') {
        const msgs = Object.values(data.errors).flat()
        if (msgs.length) return msgs.join(' | ')
    }
    return 'Error al guardar el horario.'
}

async function saveDrop() {
    if (!dropModal.col || !dropModal.placeId) return
    dropModal.saving = true
    dropModal.conflicts = []
    try {
        const payload = {
            teacher_assignment_id: dropModal.teacherAssignmentId,
            place_id:              dropModal.placeId,
            day_of_week:           dropModal.col.dayOfWeek,
            date:                  dropModal.col.date,
            start_time:            dropModal.startTime,
            end_time:              dropModal.endTime,
        }

        if (dropModal.mode === 'move' && dropModal.scheduleId) {
            await api.put(API.SCHEDULES_API.academic.update(dropModal.scheduleId), payload)
        } else {
            await api.post(API.SCHEDULES_API.academic.create, payload)
        }

        closeDropModal()
        if (resolvedConfigId.value) {
            await Promise.all([loadSchedules(resolvedConfigId.value), loadAssignments(resolvedConfigId.value)])
        }
    } catch (e: any) {
        dropModal.conflicts = [extractErrorMessage(e)]
    } finally {
        dropModal.saving = false
    }
}

// ══════════════════════ DELETE MODAL ═══════════════════════════
interface DeleteSlotOption {
    from: string
    to: string
    label: string
    selected: boolean
}

const deleteModal = reactive({
    open: false,
    block: null as AcademicSchedule | null,
    slots: [] as DeleteSlotOption[],
    deleting: false,
    error: '',
})

const deleteBlockLabel = computed(() => {
    const b = deleteModal.block
    if (!b) return ''
    const slot = `${b.startTime} - ${b.endTime}`
    if (b.date) return `${formatIsoDate(b.date)} · ${slot}`
    if (b.dayOfWeek !== null) return `${DAY_LABELS_FULL[b.dayOfWeek] ?? ''} · ${slot}`
    return slot
})

// ══════════════════════ ERASER TOOL ═══════════════════════════
const ERASER_WARNING_KEY = 'schedules_eraser_warning_dismissed'

const eraserMode = ref(false)
const eraserWarningOpen = ref(false)
const eraserWarningDontShowAgain = ref(false)
const hoveredBlockId = ref<number | null>(null)

function toggleEraserMode() {
    if (eraserMode.value) {
        // Desactivar
        eraserMode.value = false
        hoveredBlockId.value = null
        return
    }

    // Activar: verificar si el warning está dismissed
    const dismissed = localStorage.getItem(ERASER_WARNING_KEY) === 'true'
    if (dismissed) {
        eraserMode.value = true
    } else {
        eraserWarningOpen.value = true
        eraserWarningDontShowAgain.value = false
    }
}

function confirmEraserWarning() {
    if (eraserWarningDontShowAgain.value) {
        localStorage.setItem(ERASER_WARNING_KEY, 'true')
    }
    eraserWarningOpen.value = false
    eraserMode.value = true
}

function cancelEraserWarning() {
    eraserWarningOpen.value = false
    eraserWarningDontShowAgain.value = false
}

// ESC para salir del modo borrador
function onKeydownGlobal(e: KeyboardEvent) {
    if (e.key === 'Escape' && eraserMode.value) {
        eraserMode.value = false
        hoveredBlockId.value = null
    }
}

// Computar sub-slots de un bloque según blockDuration
interface SubSlot { from: string; to: string }
function blockSubSlots(block: AcademicSchedule): SubSlot[] {
    const start = parseTime(block.startTime)
    const end = parseTime(block.endTime)
    const step = blockDuration.value
    const slots: SubSlot[] = []
    for (let m = start; m + step <= end; m += step) {
        slots.push({ from: minutesToLabel(m), to: minutesToLabel(m + step) })
    }
    // Caso edge: duración no múltiplo exacto → un solo sub-slot que cubre todo el bloque
    if (slots.length === 0) {
        slots.push({ from: block.startTime, to: block.endTime })
    }
    return slots
}

// ══════════════════════ PINNED PLACE TOOL ═══════════════════════════
const pinnedPlaceId = ref<number | null>(null)
const pinnedPlaceLabel = ref<string | null>(null)
const pinnedPlaceModalOpen = ref(false)
const pinnedPlaceSearch = ref('')

const filteredPlacesList = computed(() => {
    const q = pinnedPlaceSearch.value.toLowerCase().trim()
    if (!q) return places.value
    return places.value.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.shortName ?? '').toLowerCase().includes(q)
    )
})

function openPinnedPlaceModal() {
    if (!phaseActive.value) return
    pinnedPlaceModalOpen.value = true
    pinnedPlaceSearch.value = ''
}

function closePinnedPlaceModal() {
    pinnedPlaceModalOpen.value = false
}

function selectPinnedPlace(p: SchedulePlace) {
    pinnedPlaceId.value = p.id
    pinnedPlaceLabel.value = p.shortName || p.name
    pinnedPlaceModalOpen.value = false
}

function clearPinnedPlace() {
    pinnedPlaceId.value = null
    pinnedPlaceLabel.value = null
}

function clearPinnedPlaceAndClose() {
    clearPinnedPlace()
    pinnedPlaceModalOpen.value = false
}

// ══════════════════════ COMPARISON TOOL ═══════════════════════════
const COMPARISON_MAX_ITEMS = 6
const COMPARISON_COLORS = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#06b6d4', // cyan
]

const comparisonMode = ref(false)
const comparisonType = ref<'teacher' | 'group' | 'place'>('teacher')
const comparisonSelectedIds = ref<number[]>([])
const comparisonSearch = ref('')

function toggleComparisonMode() {
    if (eraserMode.value) return
    comparisonMode.value = !comparisonMode.value
    if (!comparisonMode.value) {
        comparisonSelectedIds.value = []
        comparisonSearch.value = ''
    }
}

function setComparisonType(t: 'teacher' | 'group' | 'place') {
    comparisonType.value = t
    comparisonSelectedIds.value = []
    comparisonSearch.value = ''
}

function toggleComparisonItem(id: number) {
    const idx = comparisonSelectedIds.value.indexOf(id)
    if (idx >= 0) {
        comparisonSelectedIds.value.splice(idx, 1)
    } else if (comparisonSelectedIds.value.length < COMPARISON_MAX_ITEMS) {
        comparisonSelectedIds.value.push(id)
    }
}

function getComparisonColor(id: number): string {
    const idx = comparisonSelectedIds.value.indexOf(id)
    if (idx < 0) return '#94a3b8'
    return COMPARISON_COLORS[idx % COMPARISON_COLORS.length]
}

// Opciones disponibles según tipo
const comparisonOptions = computed<{ id: number; label: string }[]>(() => {
    const q = comparisonSearch.value.toLowerCase().trim()
    let list: { id: number; label: string }[] = []

    if (comparisonType.value === 'teacher') {
        const map = new Map<number, { id: number; label: string }>()
        for (const a of assignableAssignments.value) {
            if (a.teacher.id && !map.has(a.teacher.id)) {
                map.set(a.teacher.id, { id: a.teacher.id, label: a.teacher.name || '—' })
            }
        }
        list = [...map.values()]
    } else if (comparisonType.value === 'group') {
        const map = new Map<number, { id: number; label: string }>()
        for (const a of assignableAssignments.value) {
            if (a.group && !map.has(a.group.id)) {
                map.set(a.group.id, { id: a.group.id, label: a.group.name })
            }
        }
        list = [...map.values()]
    } else {
        list = places.value.map(p => ({ id: p.id, label: p.name + (p.shortName ? ' (' + p.shortName + ')' : '') }))
    }

    list.sort((x, y) => x.label.localeCompare(y.label))
    if (q) list = list.filter(o => o.label.toLowerCase().includes(q))
    return list
})

const selectedComparisonItems = computed(() => {
    const allOpts = (() => {
        if (comparisonType.value === 'teacher') {
            const map = new Map<number, { id: number; label: string }>()
            for (const a of assignableAssignments.value) {
                if (a.teacher.id && !map.has(a.teacher.id)) {
                    map.set(a.teacher.id, { id: a.teacher.id, label: a.teacher.name || '—' })
                }
            }
            return [...map.values()]
        }
        if (comparisonType.value === 'group') {
            const map = new Map<number, { id: number; label: string }>()
            for (const a of assignableAssignments.value) {
                if (a.group && !map.has(a.group.id)) {
                    map.set(a.group.id, { id: a.group.id, label: a.group.name })
                }
            }
            return [...map.values()]
        }
        return places.value.map(p => ({ id: p.id, label: p.name + (p.shortName ? ' (' + p.shortName + ')' : '') }))
    })()
    return comparisonSelectedIds.value
        .map(id => allOpts.find(o => o.id === id))
        .filter((o): o is { id: number; label: string } => !!o)
})

// Bloques que aparecen en la vista de comparación (filtrados por los seleccionados)
const comparisonBlocks = computed<AcademicSchedule[]>(() => {
    if (comparisonSelectedIds.value.length === 0) return []

    return schedules.value.filter(s => {
        if (comparisonType.value === 'teacher') {
            const tid = s.teacherAssignment?.teacher?.id
            return tid !== null && tid !== undefined && comparisonSelectedIds.value.includes(tid)
        }
        if (comparisonType.value === 'group') {
            const gid = s.teacherAssignment?.group?.id
            return gid !== undefined && comparisonSelectedIds.value.includes(gid)
        }
        // place
        return comparisonSelectedIds.value.includes(s.placeId)
    })
})

function getComparisonItemIdForBlock(block: AcademicSchedule): number | null {
    if (comparisonType.value === 'teacher') return block.teacherAssignment?.teacher?.id ?? null
    if (comparisonType.value === 'group') return block.teacherAssignment?.group?.id ?? null
    return block.placeId
}

function hexToRgba(hex: string, alpha: number): string {
    const h = hex.replace('#', '')
    const r = parseInt(h.substring(0, 2), 16)
    const g = parseInt(h.substring(2, 4), 16)
    const b = parseInt(h.substring(4, 6), 16)
    return `rgba(${r},${g},${b},${alpha})`
}

function getComparisonBlockStyle(block: AcademicSchedule) {
    const base = blockGridStyle(block) as Record<string, string>
    const itemId = getComparisonItemIdForBlock(block)
    const color = itemId !== null ? getComparisonColor(itemId) : '#94a3b8'
    return {
        ...base,
        backgroundColor: hexToRgba(color, 0.25),
        borderColor: color,
    }
}

function getComparisonBlockTextColor(_block: AcademicSchedule): string {
    return '#1e293b'
}

function comparisonBlockLabel(block: AcademicSchedule): string {
    // Muestra los otros "ejes" del bloque (si comparas por docente, muestra grupo+aula)
    const parts: string[] = []
    if (comparisonType.value !== 'group' && block.teacherAssignment?.group?.name) {
        parts.push(block.teacherAssignment.group.name)
    }
    if (comparisonType.value !== 'place' && block.place?.shortName) {
        parts.push(block.place.shortName || '')
    }
    if (comparisonType.value !== 'teacher' && block.teacherAssignment?.teacher?.name) {
        parts.push(block.teacherAssignment.teacher.name)
    }
    return parts.filter(Boolean).join(' · ')
}

function getComparisonBlockTooltip(block: AcademicSchedule): string {
    const subject = block.teacherAssignment?.subject?.name ?? ''
    const teacher = block.teacherAssignment?.teacher?.name ?? ''
    const group = block.teacherAssignment?.group?.name ?? ''
    const place = block.place?.name ?? ''
    return `${subject}\n${teacher}\n${group} · ${place}\n${block.startTime} - ${block.endTime}`
}

// ══════════════════════ LIST MODE TOOL ═══════════════════════════
const listMode = ref(false)

function toggleListMode() {
    if (eraserMode.value || comparisonMode.value) return
    listMode.value = !listMode.value
}

interface ListRow {
    id: number
    dayKey: string
    dayLabel: string
    dayOrder: number
    startTime: string
    endTime: string
    startMinutes: number
    group: string
    subject: string
    subjectCode: string
    teacher: string
    isVacancy: boolean
    place: string
}

// Formatea una fecha ISO "YYYY-MM-DD" a "SÁB 18 ABR 2026"
function formatIsoDate(iso: string): string {
    const [y, m, d] = iso.split('-').map(Number)
    if (!y || !m || !d) return iso
    const date = new Date(y, m - 1, d)
    const dowIndex = date.getDay() === 0 ? 7 : date.getDay()
    const dowLabel = ({ 1: 'LUN', 2: 'MAR', 3: 'MIÉ', 4: 'JUE', 5: 'VIE', 6: 'SÁB', 7: 'DOM' } as Record<number, string>)[dowIndex] ?? ''
    const monthLabel = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'][m - 1] ?? ''
    return `${dowLabel} ${String(d).padStart(2, '0')} ${monthLabel} ${y}`
}

const listRows = computed<ListRow[]>(() => {
    return visibleSchedules.value.map(s => {
        const dayKey = s.date
            ? s.date
            : (s.dayOfWeek !== null ? (DAY_LABELS_FULL[s.dayOfWeek] ?? '—') : '—')
        const dayLabel = s.date
            ? formatIsoDate(s.date)
            : (s.dayOfWeek !== null ? (DAY_LABELS_FULL[s.dayOfWeek] ?? '—') : '—')
        const dayOrder = s.date ? new Date(s.date).getTime() : (s.dayOfWeek ?? 99)
        return {
            id: s.id,
            dayKey,
            dayLabel,
            dayOrder,
            startTime: s.startTime,
            endTime: s.endTime,
            startMinutes: parseTime(s.startTime),
            group: s.teacherAssignment?.group?.name ?? '',
            subject: s.teacherAssignment?.subject?.name ?? '',
            subjectCode: s.teacherAssignment?.subject?.officialCode ?? '',
            teacher: s.teacherAssignment?.teacher?.name ?? '',
            isVacancy: s.teacherAssignment?.teacher?.isVacancy ?? false,
            place: s.place?.name ?? '',
        }
    }).sort((a, b) => {
        if (a.dayOrder !== b.dayOrder) return a.dayOrder - b.dayOrder
        return a.startMinutes - b.startMinutes
    })
})

async function eraserDeleteAll(block: AcademicSchedule) {
    try {
        await api.delete(API.SCHEDULES_API.academic.delete(block.id))
        if (resolvedConfigId.value) {
            await Promise.all([loadSchedules(resolvedConfigId.value), loadAssignments(resolvedConfigId.value)])
        }
    } catch (e: any) {
        showError(extractErrorMessage(e))
    }
}

async function eraserDeleteSlot(block: AcademicSchedule, slot: SubSlot) {
    try {
        await api.post(API.SCHEDULES_API.academic.removeSlots(block.id), {
            slots: [{ from: slot.from, to: slot.to }],
        })
        if (resolvedConfigId.value) {
            await Promise.all([loadSchedules(resolvedConfigId.value), loadAssignments(resolvedConfigId.value)])
        }
    } catch (e: any) {
        showError(extractErrorMessage(e))
    }
}

const selectedSlotsCount = computed(() => deleteModal.slots.filter(s => s.selected).length)
const isMultiSlotBlock = computed(() => deleteModal.slots.length > 1)

function confirmRemoveBlock(block: AcademicSchedule) {
    if (!phaseActive.value) return

    // Computar sub-slots del bloque en base a blockDuration
    const start = parseTime(block.startTime)
    const end = parseTime(block.endTime)
    const step = blockDuration.value
    const slots: DeleteSlotOption[] = []
    for (let m = start; m + step <= end; m += step) {
        const from = minutesToLabel(m)
        const to = minutesToLabel(m + step)
        slots.push({ from, to, label: `${from} - ${to}`, selected: false })
    }
    // Caso edge: duración no múltiplo exacto
    if (slots.length === 0) {
        slots.push({
            from: block.startTime,
            to: block.endTime,
            label: `${block.startTime} - ${block.endTime}`,
            selected: true,
        })
    }

    deleteModal.open = true
    deleteModal.block = block
    deleteModal.slots = slots
    deleteModal.deleting = false
    deleteModal.error = ''
}

function closeDeleteModal() {
    deleteModal.open = false
    deleteModal.block = null
    deleteModal.slots = []
    deleteModal.error = ''
}

function toggleAllDeleteSlots(value: boolean) {
    deleteModal.slots.forEach(s => { s.selected = value })
}

async function executeRemoveAll() {
    if (!deleteModal.block) return
    deleteModal.deleting = true
    deleteModal.error = ''
    try {
        await api.delete(API.SCHEDULES_API.academic.delete(deleteModal.block.id))
        closeDeleteModal()
        if (resolvedConfigId.value) {
            await Promise.all([loadSchedules(resolvedConfigId.value), loadAssignments(resolvedConfigId.value)])
        }
    } catch (e: any) {
        deleteModal.error = extractErrorMessage(e)
    } finally {
        deleteModal.deleting = false
    }
}

async function executeRemoveSelectedSlots() {
    if (!deleteModal.block) return
    const selected = deleteModal.slots.filter(s => s.selected)
    if (selected.length === 0) return

    deleteModal.deleting = true
    deleteModal.error = ''
    try {
        await api.post(API.SCHEDULES_API.academic.removeSlots(deleteModal.block.id), {
            slots: selected.map(s => ({ from: s.from, to: s.to })),
        })
        closeDeleteModal()
        if (resolvedConfigId.value) {
            await Promise.all([loadSchedules(resolvedConfigId.value), loadAssignments(resolvedConfigId.value)])
        }
    } catch (e: any) {
        deleteModal.error = extractErrorMessage(e)
    } finally {
        deleteModal.deleting = false
    }
}

onMounted(() => {
    restorePeriodFromStorage()
    fetchCampuses()
    fetchModalityTypes()
    fetchModalities()
    fetchPlaces()
    window.addEventListener('keydown', onKeydownGlobal)
})

onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKeydownGlobal)
})
</script>
