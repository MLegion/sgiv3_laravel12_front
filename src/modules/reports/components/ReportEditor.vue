<template>
    <div class="report-editor flex flex-col border rounded-xl overflow-hidden bg-slate-100 select-none" style="min-height:680px">

        <!-- ══ RIBBON ══════════════════════════════════════════════════ -->
        <!-- Barra de metadatos -->
        <div class="flex items-center gap-1.5 px-2 py-1 bg-white border-b border-slate-200 min-h-[32px] sticky top-0 z-20">
            <button type="button" @click="openMetaModal"
                title="Opciones del documento"
                class="p-1 rounded hover:bg-slate-100 text-slate-500 text-lg leading-none font-bold select-none flex-shrink-0">
                &#8942;
            </button>
            <span v-if="!editingName"
                class="text-sm font-medium text-slate-700 cursor-pointer hover:text-blue-600 select-none truncate"
                @click="startEditName">
                {{ localMeta.name || 'Reporte sin título' }}
            </span>
            <input v-else ref="nameInput" v-model="localMeta.name" type="text"
                class="flex-1 text-sm font-medium px-1 border-b border-blue-400 outline-none bg-transparent text-slate-800"
                @blur="saveName"
                @keydown.enter.prevent="saveName"
                @keydown.escape.prevent="cancelEditName" />
        </div>

        <div class="ribbon bg-white border-b shadow-sm z-10 sticky top-[32px]">

            <!-- Tabs -->
            <div class="flex gap-0 border-b border-slate-200 px-2 pt-1">
                <button v-for="tab in tabs" :key="tab.id" type="button"
                    class="px-4 py-1.5 text-xs font-medium rounded-t-md border border-transparent transition"
                    :class="activeTab === tab.id
                        ? 'bg-white border-slate-200 border-b-white text-blue-700 -mb-px z-10'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'"
                    @click="activeTab = tab.id">
                    {{ tab.label }}
                </button>
            </div>

            <!-- ── Tab: INICIO ── -->
            <div v-show="activeTab === 'inicio'" class="flex items-stretch gap-0 px-2 py-1.5 min-h-[64px]">

                <!-- Fuente -->
                <RibbonGroup label="Fuente">
                    <div class="flex flex-col gap-1">
                        <select :value="currentFontFamily" @change="applyFontFamily"
                            class="text-xs border rounded px-1.5 py-0.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 w-36 h-6">
                            <option v-for="f in FONT_FAMILIES" :key="f.value" :value="f.value">{{ f.label }}</option>
                        </select>
                        <div class="flex items-center gap-1">
                            <button type="button" title="Aumentar tamaño"
                                class="flex items-baseline gap-0 px-1 py-0.5 rounded hover:bg-slate-100 text-slate-600 leading-none"
                                @click="changeFontSize(1)">
                                <span class="font-bold text-base">A</span><span class="text-[9px]">↑</span>
                            </button>
                            <select :value="currentFontSize" @change="e => applyFontSize(+(e.target as HTMLSelectElement).value)"
                                class="text-xs border rounded px-1 py-0.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 w-14 h-6 text-center">
                                <option v-for="s in FONT_SIZES" :key="s" :value="s">{{ s }}</option>
                            </select>
                            <button type="button" title="Reducir tamaño"
                                class="flex items-baseline gap-0 px-1 py-0.5 rounded hover:bg-slate-100 text-slate-600 leading-none"
                                @click="changeFontSize(-1)">
                                <span class="font-bold text-xs">A</span><span class="text-[9px]">↓</span>
                            </button>
                        </div>
                    </div>
                </RibbonGroup>

                <!-- Texto -->
                <RibbonGroup label="Texto">
                    <TBtn title="Negrita (Ctrl+B)"   :active="ae?.isActive('bold')"      @click="ae?.chain().focus().toggleBold().run()"><strong class="text-sm leading-none">B</strong></TBtn>
                    <TBtn title="Cursiva (Ctrl+I)"   :active="ae?.isActive('italic')"    @click="ae?.chain().focus().toggleItalic().run()"><em class="text-sm leading-none">I</em></TBtn>
                    <TBtn title="Subrayado (Ctrl+U)" :active="ae?.isActive('underline')" @click="ae?.chain().focus().toggleUnderline().run()"><span class="text-sm leading-none underline">U</span></TBtn>
                    <TBtn title="Tachado"            :active="ae?.isActive('strike')"    @click="ae?.chain().focus().toggleStrike().run()"><span class="text-sm leading-none line-through">S</span></TBtn>
                </RibbonGroup>

                <!-- Color -->
                <RibbonGroup label="Color">
                    <!-- Color de texto -->
                    <div class="flex flex-col items-center gap-0.5">
                        <label class="relative cursor-pointer flex flex-col items-center" title="Color de texto">
                            <span class="text-sm font-bold leading-none px-0.5 select-none"
                                  :style="{ borderBottom: `3px solid ${currentTextColor}` }">A</span>
                            <input type="color" :value="currentTextColor"
                                class="absolute opacity-0 w-full h-full cursor-pointer top-0 left-0"
                                @input="applyTextColor" />
                        </label>
                        <span class="text-[8px] text-slate-400 leading-none">Texto</span>
                        <button type="button" title="Quitar color de texto"
                            class="text-[8px] text-slate-300 hover:text-red-400 leading-none transition"
                            @click="ae?.chain().focus().unsetColor().run()">✕</button>
                    </div>
                    <!-- Color de fondo del texto -->
                    <div class="flex flex-col items-center gap-0.5 ml-1">
                        <label class="relative cursor-pointer flex flex-col items-center" title="Color de fondo del texto">
                            <span class="text-sm font-bold leading-none px-0.5 select-none"
                                  :style="{ backgroundColor: currentBgColor, borderBottom: `3px solid ${currentBgColor}` }">A</span>
                            <input type="color" :value="currentBgColor"
                                class="absolute opacity-0 w-full h-full cursor-pointer top-0 left-0"
                                @input="applyBgColor" />
                        </label>
                        <span class="text-[8px] text-slate-400 leading-none">Fondo</span>
                        <button type="button" title="Quitar color de fondo"
                            class="text-[8px] text-slate-300 hover:text-red-400 leading-none transition"
                            @click="ae?.chain().focus().unsetBackgroundColor().run()">✕</button>
                    </div>
                </RibbonGroup>

                <RibbonGroup label="Estilo">
                    <select class="text-xs border rounded px-1.5 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 h-7"
                        :value="activeHeading" @change="applyHeading($event)">
                        <option value="0">Párrafo</option>
                        <option value="1">Título 1</option>
                        <option value="2">Título 2</option>
                        <option value="3">Título 3</option>
                        <option value="4">Título 4</option>
                    </select>
                </RibbonGroup>

                <RibbonGroup label="Alineación">
                    <TBtn title="Izquierda"   :active="ae?.isActive({textAlign:'left'})"    @click="ae?.chain().focus().setTextAlign('left').run()">
                        <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h10.5M3.75 17.25h16.5"/></svg>
                    </TBtn>
                    <TBtn title="Centro"      :active="ae?.isActive({textAlign:'center'})"  @click="ae?.chain().focus().setTextAlign('center').run()">
                        <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M6.75 12h10.5M3.75 17.25h16.5"/></svg>
                    </TBtn>
                    <TBtn title="Derecha"     :active="ae?.isActive({textAlign:'right'})"   @click="ae?.chain().focus().setTextAlign('right').run()">
                        <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M9.75 12h10.5M3.75 17.25h16.5"/></svg>
                    </TBtn>
                    <TBtn title="Justificado" :active="ae?.isActive({textAlign:'justify'})" @click="ae?.chain().focus().setTextAlign('justify').run()">
                        <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"/></svg>
                    </TBtn>
                </RibbonGroup>

                <RibbonGroup label="Listas">
                    <TBtn title="Viñetas"  :active="ae?.isActive('bulletList')"  @click="ae?.chain().focus().toggleBulletList().run()">
                        <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75h12M8.25 12h12M8.25 17.25h12M3.75 6.75h.008v.008H3.75V6.75zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0zm-.375 5.25h.008v.008H3.75V12zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0zm-.375 5.25h.008v.008H3.75v-.008zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0z"/></svg>
                    </TBtn>
                    <TBtn title="Numerada" :active="ae?.isActive('orderedList')" @click="ae?.chain().focus().toggleOrderedList().run()">
                        <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 7.5V6H2.25M3.75 12H2.25l.75-.75.75.75M2.25 17.25h1.5v.75h-.75v.75H4.5v-3H2.25v.75h1.5v.75H2.25z"/></svg>
                    </TBtn>
                </RibbonGroup>

                <RibbonGroup label="Edición">
                    <TBtn title="Deshacer (Ctrl+Z)" :disabled="!ae?.can().undo()" @click="ae?.chain().focus().undo().run()">
                        <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3"/></svg>
                    </TBtn>
                    <TBtn title="Rehacer (Ctrl+Y)"  :disabled="!ae?.can().redo()" @click="ae?.chain().focus().redo().run()">
                        <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m15 15 6-6m0 0-6-6m6 6H9a6 6 0 0 0 0 12h3"/></svg>
                    </TBtn>
                </RibbonGroup>
            </div>

            <!-- ── Tab: INSERTAR ── -->
            <div v-show="activeTab === 'insertar'" class="flex items-stretch gap-0 px-2 py-1.5 min-h-[64px]">

                <RibbonGroup label="Tabla">
                    <TBtn title="Insertar tabla 3×3" @click="insertTable">
                        <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0 1 12 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 1.5v-1.5m0 0c0-.621.504-1.125 1.125-1.125m0 0h7.5"/></svg>
                    </TBtn>
                    <div class="flex flex-col gap-0.5 ml-1">
                        <div class="flex gap-0.5">
                            <TBtn title="+ Columna" :disabled="!ae?.isActive('table')" @click="ae?.chain().focus().addColumnAfter().run()"><span class="text-xs font-mono">+C</span></TBtn>
                            <TBtn title="+ Fila"    :disabled="!ae?.isActive('table')" @click="ae?.chain().focus().addRowAfter().run()"><span class="text-xs font-mono">+F</span></TBtn>
                        </div>
                        <div class="flex gap-0.5">
                            <TBtn title="- Columna" :disabled="!ae?.isActive('table')" @click="ae?.chain().focus().deleteColumn().run()"><span class="text-xs font-mono text-red-500">-C</span></TBtn>
                            <TBtn title="- Fila"    :disabled="!ae?.isActive('table')" @click="ae?.chain().focus().deleteRow().run()"><span class="text-xs font-mono text-red-500">-F</span></TBtn>
                        </div>
                    </div>
                    <TBtn title="Eliminar tabla" :disabled="!ae?.isActive('table')" @click="ae?.chain().focus().deleteTable().run()">
                        <span class="text-xs font-mono text-red-500">✕ Tab</span>
                    </TBtn>
                </RibbonGroup>

                <RibbonGroup label="Página">
                    <div class="flex flex-col items-center gap-1">
                        <TBtn
                            :title="inBody ? 'Salto de página' : 'Solo disponible en el cuerpo del documento'"
                            :disabled="!inBody"
                            @click="doInsertPageBreak">
                            <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 5.25l-7.5 7.5-7.5-7.5m15 6l-7.5 7.5-7.5-7.5"/></svg>
                        </TBtn>
                        <span class="text-[9px] text-slate-400">Salto</span>
                    </div>
                </RibbonGroup>

                <RibbonGroup label="Imagen">
                    <div class="flex flex-col gap-1">
                        <TBtn title="Insertar imagen desde archivo" @click="triggerImageUpload">
                            <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"/>
                            </svg>
                        </TBtn>
                        <button type="button" title="Insertar imagen desde URL"
                            class="text-[10px] text-slate-500 hover:text-blue-600 underline leading-none whitespace-nowrap"
                            @click="insertImageUrl">
                            Desde URL
                        </button>
                    </div>
                </RibbonGroup>

            </div>

            <!-- ── Tab: OBJETOS DE ACCESO A DATOS ── -->
            <div v-show="activeTab === 'objetos-dao'" class="flex items-stretch gap-0 px-2 py-1.5 min-h-[64px]">

                <!-- Sección 1: Selector del DAO vinculado -->
                <div class="flex flex-col ribbon-group" style="min-width:160px; max-width:180px">
                    <div class="flex items-center flex-1 px-2">
                        <select v-model="selectedDaoIdx"
                            class="text-xs border rounded px-1.5 py-0.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 w-full h-6">
                            <option :value="-1" disabled>— seleccionar —</option>
                            <option v-for="(item, idx) in localDaos" :key="idx" :value="idx">
                                {{ daoOptionLabel(item) }}
                            </option>
                        </select>
                    </div>
                    <div class="text-center text-[9px] text-slate-400 border-t border-slate-100 pt-0.5 mt-0.5 px-2 uppercase tracking-wide">
                        DAO activo
                    </div>
                </div>

                <!-- Sección 2: Campos del DAO seleccionado (70-80%) -->
                <div class="flex flex-col ribbon-group flex-1">
                    <div class="flex items-center flex-1 px-3">
                        <template v-if="selectedDaoIdx >= 0 && localDaos[selectedDaoIdx]">
                            <div class="grid grid-cols-2 gap-x-4 gap-y-1 w-full">
                                <div class="flex items-center gap-1.5">
                                    <span class="text-[10px] text-slate-400 w-16 text-right shrink-0">Objeto</span>
                                    <select :value="localDaos[selectedDaoIdx].dao_id"
                                        class="flex-1 text-xs border rounded px-1.5 py-0.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 h-6"
                                        @change="localDaos[selectedDaoIdx].dao_id = +($event.target as HTMLSelectElement).value || null; emitDaos()">
                                        <option :value="null" disabled>— DAO —</option>
                                        <option v-for="d in (availableDaos ?? [])" :key="d.id" :value="d.id">{{ d.name }}</option>
                                    </select>
                                </div>
                                <div class="flex items-center gap-1.5">
                                    <span class="text-[10px] text-slate-400 w-16 text-right shrink-0">Variable</span>
                                    <input v-model="localDaos[selectedDaoIdx].var_name" type="text" placeholder="var_name"
                                        class="flex-1 text-xs font-mono border rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-400 h-6"
                                        @change="emitDaos" />
                                </div>
                            </div>
                        </template>
                        <p v-else class="text-[11px] text-slate-400 italic">
                            {{ localDaos.length ? 'Selecciona un DAO del panel izquierdo.' : 'Sin DAOs vinculados. Usa "Manejar" para agregar.' }}
                        </p>
                    </div>
                    <div class="text-center text-[9px] text-slate-400 border-t border-slate-100 pt-0.5 mt-0.5 px-2 uppercase tracking-wide">
                        Campos
                    </div>
                </div>

                <!-- Sección 3: Acción de gestión -->
                <div class="flex flex-col ribbon-group">
                    <div class="flex items-center justify-center flex-1 px-2">
                        <button type="button" @click="manageDaosOpen = true"
                            class="flex flex-col items-center gap-1 px-3 py-1 rounded hover:bg-slate-100 text-slate-600 transition">
                            <svg class="w-7 h-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.3" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                            </svg>
                            <span class="text-[9px] text-center leading-tight whitespace-nowrap">Manejar objetos de<br>acceso a datos</span>
                        </button>
                    </div>
                    <div class="text-center text-[9px] text-slate-400 border-t border-slate-100 pt-0.5 mt-0.5 px-2 uppercase tracking-wide">
                        Gestión
                    </div>
                </div>

            </div>

            <!-- ── Tab: DIRECTIVAS ── -->
            <div v-show="activeTab === 'dao'" class="flex items-stretch gap-0 px-2 py-1.5 min-h-[64px]">

                <RibbonGroup label="Iteración">
                    <div class="flex flex-col gap-1">
                        <button type="button"
                            :disabled="!inBody"
                            :title="inBody ? 'Inserta un bloque @foreach … @endforeach' : 'Solo disponible en el cuerpo'"
                            :class="['px-2 py-1 text-xs rounded font-mono border text-left whitespace-nowrap transition',
                                     inBody ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                                            : 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed']"
                            @click="insertDirective('foreach')">
                            @foreach
                        </button>
                        <button type="button"
                            :disabled="!inBody"
                            :title="inBody ? 'Cierra un bloque @foreach' : 'Solo disponible en el cuerpo'"
                            :class="['px-2 py-1 text-xs rounded font-mono border text-left whitespace-nowrap transition',
                                     inBody ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                                            : 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed']"
                            @click="insertDirective('endforeach')">
                            @endforeach
                        </button>
                    </div>
                </RibbonGroup>

                <RibbonGroup label="Condicional">
                    <div class="flex flex-col gap-1">
                        <button type="button"
                            :disabled="!inBody"
                            :title="inBody ? 'Inserta un bloque @if … @endif' : 'Solo disponible en el cuerpo'"
                            :class="['px-2 py-1 text-xs rounded font-mono border text-left whitespace-nowrap transition',
                                     inBody ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                            : 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed']"
                            @click="insertDirective('if')">
                            @if / @else
                        </button>
                        <button type="button"
                            :disabled="!inBody"
                            :title="inBody ? 'Agrega una rama @elseif' : 'Solo disponible en el cuerpo'"
                            :class="['px-2 py-1 text-xs rounded font-mono border text-left whitespace-nowrap transition',
                                     inBody ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                            : 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed']"
                            @click="insertDirective('elseif')">
                            @elseif
                        </button>
                    </div>
                </RibbonGroup>

                <RibbonGroup label="Interpolación">
                    <div class="flex flex-col gap-1">
                        <button type="button"
                            class="px-2 py-1 text-xs rounded font-mono bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 text-left whitespace-nowrap"
                            title="Inserta una expresión {{ variable }} — disponible en todas las zonas"
                            @click="insertDirective('interp')">
                            {{ interpLabel }}
                        </button>
                    </div>
                </RibbonGroup>

            </div>

            <!-- ── Tab: IMAGEN (visible solo cuando hay imagen seleccionada) ── -->
            <div v-show="activeTab === 'imagen'" class="flex items-stretch gap-0 px-2 py-1.5 min-h-[64px]">

                <RibbonGroup label="Tamaño">
                    <div class="flex flex-col gap-1">
                        <div class="flex items-center gap-1">
                            <span class="text-[10px] text-slate-400 w-10 text-right">Ancho</span>
                            <input type="number" min="10" max="2000"
                                :value="imageAttrs.width && imageAttrs.width !== 'auto' ? parseInt(imageAttrs.width) : ''"
                                placeholder="auto"
                                class="w-16 text-xs px-1 py-0.5 border rounded text-center focus:outline-none focus:ring-1 focus:ring-blue-400"
                                @change="e => setImageAttr('width', (e.target as HTMLInputElement).value ? (e.target as HTMLInputElement).value + 'px' : 'auto')" />
                            <span class="text-[10px] text-slate-400">px</span>
                        </div>
                        <div class="flex gap-1">
                            <button v-for="pct in ['25%','50%','75%','100%']" :key="pct" type="button"
                                :class="['text-[10px] px-1.5 py-0.5 rounded border transition',
                                    imageAttrs.width === pct
                                        ? 'bg-blue-100 border-blue-300 text-blue-700'
                                        : 'border-slate-200 text-slate-500 hover:bg-slate-50']"
                                @click="setImageAttr('width', pct)">
                                {{ pct }}
                            </button>
                        </div>
                    </div>
                </RibbonGroup>

                <RibbonGroup label="Alineación">
                    <div class="flex gap-1">
                        <!-- Izquierda -->
                        <TBtn title="Alinear a la izquierda"
                            :active="!imageAttrs.align || imageAttrs.align === 'left'"
                            @click="setImageAttr('align', 'left')">
                            <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h10.5M3.75 17.25h16.5"/></svg>
                        </TBtn>
                        <!-- Centro -->
                        <TBtn title="Centrar"
                            :active="imageAttrs.align === 'center'"
                            @click="setImageAttr('align', 'center')">
                            <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M6.75 12h10.5M3.75 17.25h16.5"/></svg>
                        </TBtn>
                        <!-- Derecha -->
                        <TBtn title="Alinear a la derecha"
                            :active="imageAttrs.align === 'right'"
                            @click="setImageAttr('align', 'right')">
                            <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M9.75 12h10.5M3.75 17.25h16.5"/></svg>
                        </TBtn>
                    </div>
                </RibbonGroup>

                <RibbonGroup label="Texto alternativo">
                    <input type="text" placeholder="Descripción de la imagen"
                        :value="imageAttrs.alt ?? ''"
                        class="text-xs border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400 w-40"
                        @change="e => setImageAttr('alt', (e.target as HTMLInputElement).value)" />
                </RibbonGroup>

                <RibbonGroup label="Eliminar">
                    <TBtn title="Eliminar imagen" @click="ae?.chain().focus().deleteSelection().run()">
                        <svg class="w-5 h-5 text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/></svg>
                    </TBtn>
                </RibbonGroup>

            </div>

            <!-- ── Tab: DISEÑO ── -->
            <div v-show="activeTab === 'diseno'" class="flex items-stretch gap-0 px-2 py-1.5 min-h-[64px]">

                <RibbonGroup label="Tamaño">
                    <div class="flex flex-col gap-1">
                        <select v-model="cfg.size" class="text-xs border rounded px-1.5 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400">
                            <option value="A4">A4 (210×297)</option>
                            <option value="Letter">Carta (216×279)</option>
                            <option value="Legal">Oficio (216×356)</option>
                        </select>
                        <div class="flex gap-2">
                            <label class="flex items-center gap-1 text-xs cursor-pointer">
                                <input type="radio" v-model="cfg.orientation" value="portrait"  class="accent-blue-600" /> Vertical
                            </label>
                            <label class="flex items-center gap-1 text-xs cursor-pointer">
                                <input type="radio" v-model="cfg.orientation" value="landscape" class="accent-blue-600" /> Horizontal
                            </label>
                        </div>
                    </div>
                </RibbonGroup>

                <RibbonGroup label="Márgenes (mm)">
                    <div class="grid grid-cols-2 gap-x-2 gap-y-1">
                        <div v-for="[key, lbl] in marginFields" :key="key" class="flex items-center gap-1">
                            <span class="text-[10px] text-slate-400 w-8 text-right">{{ lbl }}</span>
                            <input type="number" v-model.number="(cfg.margins as any)[key]" min="0" max="80"
                                class="w-12 text-xs px-1 py-0.5 border rounded text-center focus:outline-none focus:ring-1 focus:ring-blue-400" />
                        </div>
                    </div>
                </RibbonGroup>

                <RibbonGroup label="Encabezado / Pie (mm)">
                    <div class="flex flex-col gap-1">
                        <div class="flex items-center gap-2">
                            <span class="text-[10px] text-slate-400 w-20">Alto encabezado</span>
                            <input type="number" v-model.number="cfg.headerHeight" min="5" max="80"
                                class="w-14 text-xs px-1 py-0.5 border rounded text-center focus:outline-none focus:ring-1 focus:ring-blue-400" />
                            <span class="text-[10px] text-slate-400">mm</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="text-[10px] text-slate-400 w-20">Alto pie pág.</span>
                            <input type="number" v-model.number="cfg.footerHeight" min="5" max="80"
                                class="w-14 text-xs px-1 py-0.5 border rounded text-center focus:outline-none focus:ring-1 focus:ring-blue-400" />
                            <span class="text-[10px] text-slate-400">mm</span>
                        </div>
                    </div>
                </RibbonGroup>

                <RibbonGroup label="Fondo de página">
                    <div class="flex flex-col items-center gap-1">
                        <input type="color" v-model="cfg.background"
                            class="w-10 h-8 rounded border cursor-pointer p-0.5 bg-white" />
                        <button type="button"
                            class="text-[10px] text-slate-400 hover:text-slate-600 underline leading-none"
                            title="Restablecer fondo blanco predeterminado"
                            @click="cfg.background = '#ffffff'">
                            Predeterminado
                        </button>
                    </div>
                </RibbonGroup>
            </div>
        </div>
        <!-- ══ FIN RIBBON ═══════════════════════════════════════════════ -->

        <!-- Input oculto para subir imágenes -->
        <input ref="imageFileInput" type="file" accept="image/*" class="hidden" @change="onImageFileSelected" />

        <!-- ── Canvas ──────────────────────────────────────────────────── -->
        <div class="flex-1 overflow-auto bg-slate-300 p-6 select-text">

            <!-- Páginas: una por cada segmento del cuerpo -->
            <template v-for="(pageEditor, pageIdx) in bodyEditors" :key="pageIdx">

                <!-- Separador entre páginas -->
                <div v-if="pageIdx > 0" class="flex items-center justify-center my-2 ml-6">
                    <div :style="{ width: pageWidthPx + 'px' }" class="flex items-center gap-3">
                        <div class="flex-1 h-px bg-slate-500 opacity-40"></div>
                        <button type="button"
                            class="text-[11px] text-slate-500 hover:text-red-600 bg-slate-200 hover:bg-red-50 border border-slate-300 hover:border-red-300 rounded px-2.5 py-0.5 transition"
                            @click="deletePageBreakBefore(pageIdx)">
                            × Eliminar salto de página
                        </button>
                        <div class="flex-1 h-px bg-slate-500 opacity-40"></div>
                    </div>
                </div>

                <!-- Regla horizontal (solo página activa) -->
                <div v-if="pageIdx === activePageIdx" class="flex ml-6 mb-0.5">
                    <svg :width="pageWidthPx" height="22" class="ruler-svg block">
                        <rect x="0" y="0" :width="cfg.margins.left * MM_PX" height="22" fill="#cbd5e1"/>
                        <rect :x="(pageWidthMM - cfg.margins.right) * MM_PX" y="0" :width="cfg.margins.right * MM_PX" height="22" fill="#cbd5e1"/>
                        <g v-for="t in hTicks" :key="t.x">
                            <line :x1="t.x" :y1="22 - t.h" :x2="t.x" y2="22" stroke="#64748b" stroke-width="0.8"/>
                            <text v-if="t.label" :x="t.x + 2" y="11" font-size="7" fill="#475569">{{ t.label }}</text>
                        </g>
                        <rect x="0" y="0" :width="pageWidthPx" height="22" fill="none" stroke="#94a3b8" stroke-width="1"/>
                    </svg>
                </div>

                <div class="flex">
                    <!-- Regla vertical (solo página activa) -->
                    <svg v-if="pageIdx === activePageIdx" width="24" :height="pageHeightPx" class="ruler-svg block flex-shrink-0">
                        <rect x="0" y="0" width="24" :height="pageHeightPx" fill="#e2e8f0"/>
                        <rect x="0" y="0" width="24" :height="cfg.margins.top * MM_PX" fill="#cbd5e1"/>
                        <rect x="0" :y="cfg.margins.top * MM_PX" width="24" :height="cfg.headerHeight * MM_PX" fill="#dbeafe"/>
                        <rect x="0" :y="(pageHeightMM - cfg.margins.bottom) * MM_PX" width="24" :height="cfg.margins.bottom * MM_PX" fill="#cbd5e1"/>
                        <rect x="0" :y="(pageHeightMM - cfg.margins.bottom - cfg.footerHeight) * MM_PX" width="24" :height="cfg.footerHeight * MM_PX" fill="#dbeafe"/>
                        <g v-for="t in vTicks" :key="t.y">
                            <line x1="24" :y1="t.y" :x2="24 - t.h" :y2="t.y" stroke="#64748b" stroke-width="0.8"/>
                            <text v-if="t.label" :x="12" :y="t.y - 2" font-size="7" fill="#475569" text-anchor="middle">{{ t.label }}</text>
                        </g>
                        <rect x="0" y="0" width="24" :height="pageHeightPx" fill="none" stroke="#94a3b8" stroke-width="1"/>
                    </svg>
                    <div v-else style="width:24px; flex-shrink:0"></div>

                    <!-- Hoja de papel -->
                    <div class="shadow-xl relative flex-shrink-0" :style="pageStyle">

                        <!-- ENCABEZADO — igual en todas las páginas; el editor se monta donde hay foco -->
                        <div class="relative cursor-text overflow-hidden transition-opacity duration-200"
                             :class="(headerActive && activeHeaderPageIdx === pageIdx) ? 'opacity-100' : 'opacity-35 hover:opacity-60'"
                             :style="{
                                 paddingTop:    mm(cfg.margins.top),
                                 paddingLeft:   mm(cfg.margins.left),
                                 paddingRight:  mm(cfg.margins.right),
                                 paddingBottom: '4px',
                                 height:        mm(cfg.margins.top + cfg.headerHeight),
                                 borderBottom:  (headerActive && activeHeaderPageIdx === pageIdx)
                                     ? '1.5px dashed #60a5fa' : '1px solid #d1d5db',
                             }"
                             @click="activateHeaderOnPage(pageIdx)">
                            <span v-if="headerActive && activeHeaderPageIdx === pageIdx" class="zone-label">ENCABEZADO</span>
                            <EditorContent v-if="pageIdx === activeHeaderPageIdx"
                                :editor="headerEditor" class="report-zone h-full" />
                            <div v-else class="h-full" v-html="headerHtml" />
                        </div>

                        <!-- CUERPO de esta página -->
                        <div :style="{
                                 paddingLeft:   mm(cfg.margins.left),
                                 paddingRight:  mm(cfg.margins.right),
                                 paddingTop:    '8px',
                                 paddingBottom: '8px',
                             }"
                             @mousedown="activateBodyEditor(pageIdx)">
                            <EditorContent :editor="pageEditor" class="report-zone"
                                :style="{ minHeight: singlePageContentPx + 'px' }" />
                        </div>

                        <!-- PIE DE PÁGINA — igual en todas las páginas; el editor se monta donde hay foco -->
                        <div class="relative cursor-text overflow-hidden transition-opacity duration-200"
                             :class="(footerActive && activeFooterPageIdx === pageIdx) ? 'opacity-100' : 'opacity-35 hover:opacity-60'"
                             :style="{
                                 paddingBottom: mm(cfg.margins.bottom),
                                 paddingLeft:   mm(cfg.margins.left),
                                 paddingRight:  mm(cfg.margins.right),
                                 paddingTop:    '4px',
                                 height:        mm(cfg.margins.bottom + cfg.footerHeight),
                                 borderTop:     (footerActive && activeFooterPageIdx === pageIdx)
                                     ? '1.5px dashed #60a5fa' : '1px solid #d1d5db',
                             }"
                             @click="activateFooterOnPage(pageIdx)">
                            <span v-if="footerActive && activeFooterPageIdx === pageIdx" class="zone-label zone-label--footer">PIE DE PÁGINA</span>
                            <EditorContent v-if="pageIdx === activeFooterPageIdx"
                                :editor="footerEditor" class="report-zone h-full" />
                            <div v-else class="h-full" v-html="footerHtml" />
                        </div>
                    </div>
                </div>

            </template>
        </div>
    <!-- Modal: Manejar Objetos de Acceso a Datos -->
    <Teleport to="body">
        <div v-if="manageDaosOpen" class="fixed inset-0 z-[9999] flex items-start justify-center pt-20 px-4">
            <div class="absolute inset-0 bg-black/30" @click="manageDaosOpen = false"></div>
            <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-[560px] p-6 space-y-4 z-10">
                <div class="flex items-center gap-3">
                    <svg class="w-5 h-5 text-slate-500 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                    </svg>
                    <h3 class="text-sm font-semibold text-slate-700 uppercase tracking-wide">Objetos de Acceso a Datos del Reporte</h3>
                </div>

                <p class="text-xs text-slate-400">
                    Vincula DAOs al reporte y asígnales un nombre de variable para usarlos en las directivas.
                    Ejemplo: <code class="bg-slate-100 px-1 rounded">@foreach(mi_variable as item)</code>
                </p>

                <!-- Lista de DAOs vinculados -->
                <div class="space-y-2">
                    <div v-if="localDaos.length === 0" class="text-sm text-slate-400 italic text-center py-4 border border-dashed border-slate-200 rounded-lg">
                        Sin DAOs vinculados
                    </div>

                    <div v-for="(item, idx) in localDaos" :key="idx"
                        class="flex items-center gap-2 p-3 rounded-lg border border-slate-200 bg-slate-50">
                        <div class="flex-1 grid grid-cols-2 gap-2">
                            <div class="space-y-0.5">
                                <label class="text-[10px] font-semibold text-slate-500 uppercase">Objeto de datos</label>
                                <select :value="item.dao_id"
                                    class="w-full px-2 py-1.5 text-xs rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    @change="item.dao_id = +($event.target as HTMLSelectElement).value || null; emitDaos()">
                                    <option :value="null" disabled>— seleccionar DAO —</option>
                                    <option v-for="d in (availableDaos ?? [])" :key="d.id" :value="d.id">{{ d.name }}</option>
                                </select>
                            </div>
                            <div class="space-y-0.5">
                                <label class="text-[10px] font-semibold text-slate-500 uppercase">Nombre de variable</label>
                                <input v-model="item.var_name" type="text" placeholder="ej: facturas, alumnos"
                                    class="w-full px-2 py-1.5 text-xs font-mono rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    @change="emitDaos" />
                            </div>
                        </div>
                        <button type="button" class="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                            title="Quitar DAO" @click="removeDao(idx)">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>

                <button type="button"
                    class="w-full py-2 text-xs border border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-blue-400 hover:text-blue-600 transition"
                    @click="addDao">
                    + AGREGAR DAO
                </button>

                <div class="flex justify-end pt-1">
                    <button type="button"
                        class="px-5 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold"
                        @click="manageDaosOpen = false">
                        Listo
                    </button>
                </div>
            </div>
        </div>
    </Teleport>

    <!-- Modal de metadatos -->
    <Teleport to="body">
        <div v-if="metaModalOpen" class="fixed inset-0 z-[9999] flex items-start justify-center pt-24 px-4">
            <div class="absolute inset-0 bg-black/30" @click="metaModalOpen = false"></div>
            <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-[480px] p-6 space-y-4 z-10">
                <h3 class="text-sm font-semibold text-slate-700 uppercase tracking-wide">Opciones del documento</h3>

                <!-- Clave -->
                <div class="space-y-1">
                    <label class="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Clave del documento</label>
                    <input type="text" :value="metaDraft.code"
                        placeholder="CODIGO_DOCUMENTO"
                        maxlength="60"
                        class="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        @input="metaDraft.code = sanitizeCode(($event.target as HTMLInputElement).value)" />
                    <p class="text-[10px] text-slate-400">Solo mayúsculas, números, guión (-) y guión bajo (_). Sin espacios.</p>
                </div>

                <!-- Nombre -->
                <div class="space-y-1">
                    <label class="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Nombre</label>
                    <input type="text" v-model="metaDraft.name"
                        class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>

                <!-- Descripción -->
                <div class="space-y-1">
                    <label class="block text-xs font-semibold text-slate-600 uppercase tracking-wide">Descripción</label>
                    <textarea v-model="metaDraft.description" rows="3"
                        class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none" />
                </div>

                <!-- Es plantilla -->
                <div class="flex items-center justify-between py-1">
                    <span class="text-sm text-slate-700">¿Es una plantilla?</span>
                    <button type="button"
                        :class="['relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                                 metaDraft.isTemplate ? 'bg-blue-600' : 'bg-slate-300']"
                        @click="metaDraft.isTemplate = !metaDraft.isTemplate">
                        <span :class="['inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow',
                                       metaDraft.isTemplate ? 'translate-x-6' : 'translate-x-1']" />
                    </button>
                </div>

                <!-- Acciones -->
                <div class="flex justify-end gap-2 pt-2">
                    <button type="button"
                        class="px-4 py-2 text-sm rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50"
                        @click="metaModalOpen = false">
                        Cancelar
                    </button>
                    <button type="button"
                        class="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold"
                        @click="saveMetaModal">
                        Guardar
                    </button>
                </div>
            </div>
        </div>
    </Teleport>

    </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, watch, reactive, ref, nextTick, shallowRef, defineComponent, h } from 'vue'
import { useEditor, EditorContent, Editor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { TextAlign } from '@tiptap/extension-text-align'
import { TextStyle, FontSize, FontFamily, BackgroundColor } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { Underline } from '@tiptap/extension-underline'
import { PageBreak } from '@/modules/reports/services/pageBreakExtension'
import { ReportImage, type ImageAttrs } from '@/modules/reports/services/imageExtension'
import { type ReportStructure, type PageConfig, PAGE_SIZES, parseStructure } from '@/modules/reports/types/report.type'
import type { DataAccessObject } from '@/modules/reports/types/dao.type'

// ─── Sub-components ───────────────────────────────────────────────────
const Sep = defineComponent({ setup: () => () => h('div', { class: 'w-px h-5 bg-slate-200 mx-1 self-stretch' }) })

const TBtn = defineComponent({
    props: { title: String, active: Boolean, disabled: Boolean },
    emits: ['click'],
    setup(props, { slots, emit }) {
        return () => h('button', {
            type: 'button', title: props.title, disabled: props.disabled,
            class: ['p-1.5 rounded leading-none transition flex items-center justify-center min-w-[28px] min-h-[28px]',
                props.active   ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-100 text-slate-600',
                props.disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'],
            onClick: () => !props.disabled && emit('click'),
        }, slots.default?.())
    },
})

const RibbonGroup = defineComponent({
    props: { label: String },
    setup(props, { slots }) {
        return () => h('div', {
            class: 'flex flex-col ribbon-group',
        }, [
            h('div', { class: 'flex items-center gap-1 flex-1 px-2' }, slots.default?.()),
            h('div', {
                class: 'text-center text-[9px] text-slate-400 border-t border-slate-100 pt-0.5 mt-0.5 px-2 uppercase tracking-wide',
            }, props.label),
        ])
    },
})

// ─── Tabs ─────────────────────────────────────────────────────────────
// (tabs y activeTab se declaran más abajo, después de que 'ae' esté disponible)
const activeTab = ref('inicio')

// ─── Props / Emits ────────────────────────────────────────────────────
interface ReportMeta {
    name:        string
    code:        string
    description: string | null
    isTemplate:  boolean
}

type LinkedDao = { dao_id: number | null; var_name: string }

const props = defineProps<{
    modelValue:    string
    reportMeta?:   ReportMeta
    daos?:         LinkedDao[]
    availableDaos?: DataAccessObject[]
}>()
const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void
    (e: 'update:reportMeta', value: ReportMeta): void
    (e: 'update:daos',       value: LinkedDao[]): void
}>()

// ─── Metadatos del documento ───────────────────────────────────────────
const localMeta = reactive<ReportMeta>({
    name:        props.reportMeta?.name        ?? '',
    code:        props.reportMeta?.code        ?? '',
    description: props.reportMeta?.description ?? null,
    isTemplate:  props.reportMeta?.isTemplate  ?? false,
})
watch(() => props.reportMeta, m => {
    if (!m) return
    localMeta.name        = m.name
    localMeta.code        = m.code
    localMeta.description = m.description
    localMeta.isTemplate  = m.isTemplate
})

const metaModalOpen = ref(false)
const editingName   = ref(false)
const nameInput     = ref<HTMLInputElement | null>(null)
const metaDraft     = reactive({ name: '', code: '', description: '', isTemplate: false })

function sanitizeCode(val: string): string {
    return val.toUpperCase().replace(/[^A-Z0-9\-_]/g, '')
}
function startEditName() {
    editingName.value = true
    nextTick(() => nameInput.value?.focus())
}
function saveName() {
    if (!editingName.value) return
    editingName.value = false
    emit('update:reportMeta', { ...localMeta })
}
function cancelEditName() {
    localMeta.name    = props.reportMeta?.name ?? ''
    editingName.value = false
}
function openMetaModal() {
    Object.assign(metaDraft, {
        name:        localMeta.name,
        code:        localMeta.code,
        description: localMeta.description ?? '',
        isTemplate:  localMeta.isTemplate,
    })
    metaModalOpen.value = true
}
function saveMetaModal() {
    localMeta.name        = metaDraft.name
    localMeta.code        = metaDraft.code
    localMeta.description = metaDraft.description || null
    localMeta.isTemplate  = metaDraft.isTemplate
    emit('update:reportMeta', { ...localMeta })
    metaModalOpen.value   = false
}

// ─── Objetos de Acceso a Datos (DAOs vinculados) ──────────────────────
const localDaos      = ref<LinkedDao[]>((props.daos ?? []).map(d => ({ ...d })))
const selectedDaoIdx = ref<number>(props.daos?.length ? 0 : -1)
const manageDaosOpen = ref(false)

watch(() => props.daos, ds => {
    if (!ds) return
    localDaos.value = ds.map(d => ({ ...d }))
    if (selectedDaoIdx.value >= localDaos.value.length) {
        selectedDaoIdx.value = localDaos.value.length - 1
    }
})

function daoOptionLabel(item: LinkedDao): string {
    const name = (props.availableDaos ?? []).find(d => d.id === item.dao_id)?.name
    return item.var_name
        ? `${item.var_name}${name ? ` · ${name}` : ''}`
        : name ?? '(sin configurar)'
}

function addDao() {
    localDaos.value = [...localDaos.value, { dao_id: null, var_name: '' }]
    selectedDaoIdx.value = localDaos.value.length - 1
}
function removeDao(idx: number) {
    const arr = [...localDaos.value]
    arr.splice(idx, 1)
    localDaos.value = arr
    if (selectedDaoIdx.value >= arr.length) selectedDaoIdx.value = arr.length - 1
    emit('update:daos', localDaos.value)
}
function emitDaos() { emit('update:daos', localDaos.value.map(d => ({ ...d }))) }

const interpLabel  = '{{ }}'
const headerActive = ref(false)
const footerActive = ref(false)

const marginFields: [string, string][] = [
    ['top', 'Superior'], ['bottom', 'Inferior'], ['left', 'Izquierdo'], ['right', 'Derecho'],
]

// ─── Config de página ─────────────────────────────────────────────────
const structure = parseStructure(props.modelValue)
const cfg = reactive<PageConfig>({
    size:          structure.pageConfig.size,
    orientation:   structure.pageConfig.orientation,
    margins:       { ...structure.pageConfig.margins },
    background:    structure.pageConfig.background    ?? '#ffffff',
    headerHeight:  structure.pageConfig.headerHeight  ?? 15,
    footerHeight:  structure.pageConfig.footerHeight  ?? 15,
})

// ─── Dimensiones visuales ─────────────────────────────────────────────
const MM_PX = 2.8

const pageWidthMM  = computed(() => { const s = PAGE_SIZES[cfg.size]; return cfg.orientation === 'portrait' ? s.width  : s.height })
const pageHeightMM = computed(() => { const s = PAGE_SIZES[cfg.size]; return cfg.orientation === 'portrait' ? s.height : s.width  })
const pageWidthPx  = computed(() => pageWidthMM.value  * MM_PX)
const pageHeightPx = computed(() => pageHeightMM.value * MM_PX)

const pageStyle = computed(() => ({
    width:      `${pageWidthPx.value}px`,
    minHeight:  `${pageHeightPx.value}px`,
    background: cfg.background,
}))

/** Altura del área de contenido de UNA sola página */
const singlePageContentPx = computed(() =>
    Math.max(80, pageHeightPx.value
        - (cfg.margins.top    + cfg.headerHeight) * MM_PX
        - (cfg.margins.bottom + cfg.footerHeight) * MM_PX
        - 16   // paddingTop(8) + paddingBottom(8) del div cuerpo
    )
)

function mm(val: number) { return `${val * MM_PX}px` }

// ─── Reglas ───────────────────────────────────────────────────────────
function buildTicks(totalMM: number, axis: 'h' | 'v') {
    const ticks: Array<{ x?: number; y?: number; h: number; label: string | null }> = []
    for (let m = 0; m <= totalMM; m++) {
        const pos    = m * MM_PX
        const isCm   = m % 10 === 0
        const isHalf = m % 5  === 0
        const tickH  = isCm ? 13 : isHalf ? 8 : 4
        const label  = isCm && m > 0 ? String(m / 10) : null
        if (axis === 'h') ticks.push({ x: pos, h: tickH, label })
        else              ticks.push({ y: pos, h: tickH, label })
    }
    return ticks
}

const hTicks = computed(() => buildTicks(pageWidthMM.value,  'h'))
const vTicks = computed(() => buildTicks(pageHeightMM.value, 'v'))

// ─── Estado del editor activo ─────────────────────────────────────────
const activeEditorKey = ref<'header' | 'body' | 'footer'>('body')

/** true solo cuando el foco está en el cuerpo del documento */
const inBody = computed(() => activeEditorKey.value === 'body')

/** En qué página está montado el editor del encabezado / pie */
const activeHeaderPageIdx = ref(0)
const activeFooterPageIdx = ref(0)

/** Índice de la página que muestra las reglas */
const activePageIdx = computed(() => {
    if (activeEditorKey.value === 'header') return activeHeaderPageIdx.value
    if (activeEditorKey.value === 'footer') return activeFooterPageIdx.value
    return activeBodyIdx.value
})

/**
 * Activa una zona y desactiva las demás — igual que Word.
 */
function activateZone(zone: 'header' | 'body' | 'footer') {
    activeEditorKey.value = zone
    headerActive.value    = zone === 'header'
    footerActive.value    = zone === 'footer'
}

// ─── Extensiones ──────────────────────────────────────────────────────
function makeExtensions() {
    return [
        StarterKit, Underline,
        TextStyle, Color, BackgroundColor, FontSize, FontFamily,
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
        Table.configure({ resizable: true }),
        TableRow, TableHeader, TableCell,
        PageBreak, ReportImage,
    ]
}

// ─── Multi-page body editors ──────────────────────────────────────────
const bodyEditors   = shallowRef<Editor[]>([])
const activeBodyIdx = ref(0)
const headerHtml    = ref('')
const footerHtml    = ref('')

type DocJSON = { type: string; content?: any[] }

/** Divide un TipTapDoc en segmentos separados por nodos pageBreak */
function splitAtPageBreaks(doc: DocJSON): DocJSON[] {
    const segments: DocJSON[] = []
    let current: any[] = []
    for (const node of doc.content ?? []) {
        if (node.type === 'pageBreak') {
            segments.push({ type: 'doc', content: current })
            current = []
        } else {
            current.push(node)
        }
    }
    segments.push({ type: 'doc', content: current })
    return segments
}

/** Fusiona los segmentos de vuelta a un solo doc con pageBreak entre ellos */
function mergeSegments(editors: Editor[]): DocJSON {
    const content: any[] = []
    editors.forEach((ed, i) => {
        const json = ed.getJSON()
        if (i > 0) content.push({ type: 'pageBreak' })
        content.push(...(json.content ?? []))
    })
    return { type: 'doc', content }
}

/** Crea un editor TipTap para un segmento de cuerpo */
function createBodyEditor(content: DocJSON): Editor {
    const ed = new Editor({
        extensions: makeExtensions(),
        content: (content.content?.length ?? 0) > 0
            ? content
            : { type: 'doc', content: [{ type: 'paragraph' }] },
        onFocus() {
            const i = bodyEditors.value.indexOf(ed)
            if (i >= 0) activeBodyIdx.value = i
            activateZone('body')
        },
        onUpdate:          emitUpdate,
        onSelectionUpdate: () => { selectionTick.value++ },
    })
    return ed
}

/** Inicializa (o reinicializa) todos los editores del cuerpo desde un doc */
function initBodyEditors(body: DocJSON) {
    bodyEditors.value.forEach(ed => ed.destroy())
    const segments = splitAtPageBreaks(body)
    bodyEditors.value = segments.map(seg => createBodyEditor(seg))
}

/** Activa el editor de cuerpo en la página dada */
function activateBodyEditor(idx: number) {
    activeBodyIdx.value = idx
    activateZone('body')
}

/** Mueve el editor del encabezado a la página dada y lo activa */
function activateHeaderOnPage(pageIdx: number) {
    activeHeaderPageIdx.value = pageIdx
    activateZone('header')
    nextTick(() => headerEditor.value?.commands.focus())
}

/** Mueve el editor del pie a la página dada y lo activa */
function activateFooterOnPage(pageIdx: number) {
    activeFooterPageIdx.value = pageIdx
    activateZone('footer')
    nextTick(() => footerEditor.value?.commands.focus())
}

/**
 * Inserta un salto de página: parte el editor activo en el cursor
 * y crea una nueva página (editor) con el contenido posterior.
 */
function doInsertPageBreak() {
    const idx    = activeBodyIdx.value
    const editor = bodyEditors.value[idx]
    if (!editor) return

    const { from } = editor.state.selection
    const doc       = editor.state.doc
    const beforeDoc = doc.cut(0, from).toJSON()
    const afterDoc  = doc.cut(from, doc.content.size).toJSON()

    editor.commands.setContent(beforeDoc, false)
    const newEd = createBodyEditor(afterDoc as DocJSON)
    const arr   = [...bodyEditors.value]
    arr.splice(idx + 1, 0, newEd)
    bodyEditors.value = arr
    emitUpdate()
    nextTick(() => newEd.commands.focus('start'))
}

/**
 * Elimina el salto entre la página `idx-1` y la página `idx`,
 * fusionando ambos contenidos en la página anterior.
 */
function deletePageBreakBefore(idx: number) {
    if (idx <= 0 || idx >= bodyEditors.value.length) return
    const prevEd   = bodyEditors.value[idx - 1]
    const curEd    = bodyEditors.value[idx]
    const prevJSON = prevEd.getJSON()
    const curJSON  = curEd.getJSON()
    const merged   = { type: 'doc', content: [...(prevJSON.content ?? []), ...(curJSON.content ?? [])] }
    prevEd.commands.setContent(merged, false)
    curEd.destroy()
    const arr = [...bodyEditors.value]
    arr.splice(idx, 1)
    bodyEditors.value = arr
    if (activeBodyIdx.value >= arr.length) activeBodyIdx.value = arr.length - 1
    emitUpdate()
}

// ─── Editor activo (header / algún cuerpo / footer) ───────────────────
const ae = computed<Editor | undefined>(() => {
    if (activeEditorKey.value === 'header') return headerEditor.value ?? undefined
    if (activeEditorKey.value === 'footer') return footerEditor.value ?? undefined
    return bodyEditors.value[activeBodyIdx.value]
})

// ─── Tabs con imagen dinámica (declarado aquí para que ae ya exista) ──
/** Tick que sube en cada cambio de selección para que isActive() sea reactivo */
const selectionTick = ref(0)

const isImageActive = computed(() => {
    selectionTick.value
    return ae.value?.isActive('image') ?? false
})

const tabs = computed(() => {
    const base = [
        { id: 'inicio',      label: 'Inicio'                   },
        { id: 'insertar',    label: 'Insertar'                  },
        { id: 'diseno',      label: 'Diseño'                    },
        { id: 'objetos-dao', label: 'Objetos de Acceso a Datos' },
        { id: 'dao',         label: 'Directivas'                },
    ]
    if (isImageActive.value) base.push({ id: 'imagen', label: '🖼 Imagen' })
    return base
})

watch(isImageActive, (active) => {
    if (active) activeTab.value = 'imagen'
    else if (activeTab.value === 'imagen') activeTab.value = 'inicio'
})

// ─── Emit ─────────────────────────────────────────────────────────────
function emitUpdate() {
    const next: ReportStructure = {
        version:    2,
        pageConfig: {
            size: cfg.size, orientation: cfg.orientation,
            margins: { ...cfg.margins }, background: cfg.background,
            headerHeight: cfg.headerHeight, footerHeight: cfg.footerHeight,
        },
        header: headerEditor.value?.getJSON() as any ?? { type: 'doc', content: [] },
        body:   mergeSegments(bodyEditors.value) as any,
        footer: footerEditor.value?.getJSON() as any ?? { type: 'doc', content: [] },
    }
    headerHtml.value = headerEditor.value?.getHTML() ?? ''
    footerHtml.value = footerEditor.value?.getHTML() ?? ''
    emit('update:modelValue', JSON.stringify(next))
}

// ─── Editores header y footer ─────────────────────────────────────────
const headerEditor = useEditor({
    extensions: makeExtensions(), content: structure.header,
    onFocus()           { activateZone('header') },
    onBlur()            { setTimeout(() => { if (activeEditorKey.value !== 'header') headerActive.value = false }, 150) },
    onUpdate:           emitUpdate,
    onSelectionUpdate:  () => { selectionTick.value++ },
})
const footerEditor = useEditor({
    extensions: makeExtensions(), content: structure.footer,
    onFocus()           { activateZone('footer') },
    onBlur()            { setTimeout(() => { if (activeEditorKey.value !== 'footer') footerActive.value = false }, 150) },
    onUpdate:           emitUpdate,
    onSelectionUpdate:  () => { selectionTick.value++ },
})

// Inicializar editores del cuerpo desde la estructura cargada
initBodyEditors(structure.body)

watch(cfg, emitUpdate, { deep: true })

watch(() => props.modelValue, (val) => {
    const s = parseStructure(val)
    const curHF  = JSON.stringify({ h: headerEditor.value?.getJSON(), f: footerEditor.value?.getJSON() })
    const incHF  = JSON.stringify({ h: s.header, f: s.footer })
    const curBody = JSON.stringify(mergeSegments(bodyEditors.value))
    const incBody = JSON.stringify(s.body)
    if (curHF !== incHF) {
        headerEditor.value?.commands.setContent(s.header, false)
        footerEditor.value?.commands.setContent(s.footer, false)
    }
    if (curBody !== incBody) {
        initBodyEditors(s.body)
    }
    Object.assign(cfg, {
        size: s.pageConfig.size, orientation: s.pageConfig.orientation,
        background: s.pageConfig.background ?? '#ffffff',
        headerHeight: s.pageConfig.headerHeight ?? 15,
        footerHeight: s.pageConfig.footerHeight ?? 15,
    })
    Object.assign(cfg.margins, s.pageConfig.margins)
})

onBeforeUnmount(() => {
    headerEditor.value?.destroy()
    bodyEditors.value.forEach(ed => ed.destroy())
    footerEditor.value?.destroy()
})

// ─── Toolbar helpers ──────────────────────────────────────────────────
const activeHeading = computed(() => {
    for (let i = 1; i <= 4; i++) if (ae.value?.isActive('heading', { level: i })) return String(i)
    return '0'
})
function applyHeading(e: Event) {
    const level = parseInt((e.target as HTMLSelectElement).value)
    if (level === 0) ae.value?.chain().focus().setParagraph().run()
    else ae.value?.chain().focus().toggleHeading({ level: level as 1|2|3|4 }).run()
}
function insertTable() {
    ae.value?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
}
// ─── Fuente / Color ───────────────────────────────────────────────────
const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72]
const FONT_FAMILIES = [
    { value: '',                         label: 'Predeterminada'  },
    { value: 'Arial, sans-serif',        label: 'Arial'           },
    { value: 'Times New Roman, serif',   label: 'Times New Roman' },
    { value: 'Courier New, monospace',   label: 'Courier New'     },
    { value: 'Georgia, serif',           label: 'Georgia'         },
    { value: 'Verdana, sans-serif',      label: 'Verdana'         },
    { value: 'Trebuchet MS, sans-serif', label: 'Trebuchet MS'    },
]

function getTextStyle(): Record<string, any> {
    return (ae.value?.getAttributes('textStyle') as any) ?? {}
}
const currentFontSize   = computed(() => { const s = getTextStyle().fontSize   as string | undefined; return s ? parseInt(s) : 11 })
const currentFontFamily = computed(() => (getTextStyle().fontFamily  as string) || '')
const currentTextColor  = computed(() => (getTextStyle().color       as string) || '#000000')
const currentBgColor    = computed(() => (getTextStyle().backgroundColor as string) || '#ffff00')

function applyFontSize(size: number) {
    ae.value?.chain().focus().setFontSize(`${size}px`).run()
}
function changeFontSize(delta: number) {
    const cur = currentFontSize.value
    const idx = FONT_SIZES.indexOf(cur)
    const next = idx >= 0
        ? FONT_SIZES[Math.max(0, Math.min(FONT_SIZES.length - 1, idx + delta))]
        : Math.max(6, cur + delta * 2)
    applyFontSize(next)
}
function applyFontFamily(e: Event) {
    const val = (e.target as HTMLSelectElement).value
    if (!val) ae.value?.chain().focus().unsetFontFamily().run()
    else      ae.value?.chain().focus().setFontFamily(val).run()
}
function applyTextColor(e: Event) {
    ae.value?.chain().focus().setColor((e.target as HTMLInputElement).value).run()
}
function applyBgColor(e: Event) {
    ae.value?.chain().focus().setBackgroundColor((e.target as HTMLInputElement).value).run()
}

// ─── Imagen ───────────────────────────────────────────────────────────
const imageFileInput = ref<HTMLInputElement | null>(null)

const imageAttrs = computed((): Partial<ImageAttrs> => {
    selectionTick.value
    return (ae.value?.getAttributes('image') ?? {}) as Partial<ImageAttrs>
})

function triggerImageUpload() {
    imageFileInput.value?.click()
}
function onImageFileSelected(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
        ae.value?.chain().focus().setImage({ src: reader.result as string, alt: file.name }).run()
    }
    reader.readAsDataURL(file)
    ;(e.target as HTMLInputElement).value = ''
}
function insertImageUrl() {
    const url = window.prompt('URL de la imagen:')
    if (url?.trim()) ae.value?.chain().focus().setImage({ src: url.trim() }).run()
}
function setImageAttr(attr: keyof ImageAttrs, value: string) {
    ae.value?.chain().focus().updateImage({ [attr]: value }).run()
}

function insertDirective(type: 'foreach' | 'endforeach' | 'if' | 'elseif' | 'interp') {
    if (!ae.value) return
    const c = ae.value.chain().focus()
    const p = (text: string) => ({ type: 'paragraph', content: [{ type: 'text', text }] })
    if (type === 'foreach') {
        c.insertContent(p('@foreach(variable as item)'))
         .insertContent(p('{{ item.campo }}'))
         .insertContent(p('@endforeach')).run()
    } else if (type === 'endforeach') {
        c.insertContent(p('@endforeach')).run()
    } else if (type === 'if') {
        c.insertContent(p("@if(condicion)"))
         .insertContent(p('Contenido si verdadero'))
         .insertContent(p('@else'))
         .insertContent(p('Contenido alternativo'))
         .insertContent(p('@endif')).run()
    } else if (type === 'elseif') {
        c.insertContent(p('@elseif(condicion)')).run()
    } else {
        c.insertContent('{{ variable.campo }}').run()
    }
}
</script>

<style>
/* ── Ribbon ── */
.ribbon { font-size: 12px; }
.ribbon-group {
    border-right: 1px solid #e2e8f0;
    min-width: 60px;
    padding-bottom: 2px;
}
.ribbon-group:last-child { border-right: none; }

/* ── Regla ── */
.ruler-svg { display: block; background: #e2e8f0; }

/* ── Zonas header/footer ── */
.zone-label {
    position: absolute; top: 2px; left: 6px;
    font-size: 9px; color: #60a5fa; font-weight: 500; text-transform: uppercase;
    pointer-events: none; user-select: none; letter-spacing: 0.06em; z-index: 3;
}
.zone-label--footer { top: auto; bottom: 2px; }

/* ── Editors ── */
.report-zone .ProseMirror { outline: none; }
.report-zone .ProseMirror span[style] { display: inline; }

/* Listas — Tailwind preflight las resetea, hay que redefinirlas */
.report-zone .ProseMirror ul { list-style-type: disc;     padding-left: 1.4rem; margin: 0.2rem 0; }
.report-zone .ProseMirror ol { list-style-type: decimal;  padding-left: 1.4rem; margin: 0.2rem 0; }
.report-zone .ProseMirror li { margin: 0.1rem 0; }
.report-zone .ProseMirror li > p { margin: 0; }

.report-zone .ProseMirror table { border-collapse: collapse; width: 100%; margin: 0.3rem 0; }
.report-zone .ProseMirror th,
.report-zone .ProseMirror td  { border: 1px solid #e2e8f0; padding: 4px 7px; min-width: 50px; vertical-align: top; position: relative; }
.report-zone .ProseMirror th  { background: #f8fafc; font-weight: 600; }
.report-zone .ProseMirror .selectedCell:after {
    background: rgba(59,130,246,.1); content:''; inset:0; pointer-events:none; position:absolute; z-index:2;
}
.report-zone .ProseMirror p { margin: 0.15rem 0; }

/* ── Imagen ── */
.report-zone .ProseMirror img.report-image {
    max-width: 100%;
    height: auto;
    cursor: default;
}
.report-zone .ProseMirror img.report-image.ProseMirror-selectednode {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
}
/* Limpiar floats después de imágenes flotantes */
.report-zone .ProseMirror > *:has(+ img[style*="float"]) + *,
.report-zone .ProseMirror > *:after { clear: both; }
</style>
