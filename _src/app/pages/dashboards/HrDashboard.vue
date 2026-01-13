<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-semibold text-slate-800">
        Panel de Recursos Humanos
      </h1>
      <p class="text-slate-500">
        Gestión administrativa · SGI v3
      </p>
    </div>

    <!-- Métricas rápidas -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="bg-white rounded-xl shadow p-5">
        <h3 class="text-sm text-slate-500">Empleados activos</h3>
        <p class="mt-2 text-2xl font-semibold text-slate-800">
          0
        </p>
      </div>

      <div class="bg-white rounded-xl shadow p-5">
        <h3 class="text-sm text-slate-500">Áreas de trabajo</h3>
        <p class="mt-2 text-2xl font-semibold text-slate-800">
          0
        </p>
      </div>

      <div class="bg-white rounded-xl shadow p-5">
        <h3 class="text-sm text-slate-500">Puestos registrados</h3>
        <p class="mt-2 text-2xl font-semibold text-slate-800">
          0
        </p>
      </div>

      <div class="bg-white rounded-xl shadow p-5">
        <h3 class="text-sm text-slate-500">Contrataciones pendientes</h3>
        <p class="mt-2 text-2xl font-semibold text-slate-800">
          0
        </p>
      </div>
    </div>

    <!-- Secciones -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white rounded-xl shadow p-6">
        <h2 class="text-lg font-medium text-slate-700">
          Actividad reciente
        </h2>
        <p class="mt-2 text-sm text-slate-500">
          Aquí se mostrará la actividad reciente del personal.
        </p>
      </div>

      <div class="bg-white rounded-xl shadow p-6">
        <h2 class="text-lg font-medium text-slate-700">
          Accesos rápidos
        </h2>
        <ul class="mt-3 space-y-2 text-sm text-indigo-600">
          <li class="cursor-pointer hover:underline">
            Registrar empleado
          </li>
          <li class="cursor-pointer hover:underline">
            Asignar puesto
          </li>
          <li class="cursor-pointer hover:underline">
            Consultar expediente
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Dashboard de RH
// En producción los valores se hidratarán desde backend
</script>
