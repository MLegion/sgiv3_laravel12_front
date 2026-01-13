<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-900 text-white">
    <div class="text-center space-y-4">
      <h1 class="text-6xl font-bold text-red-500">500</h1>
      <p class="text-xl">Error interno del sistema</p>

      <p class="text-slate-400">
        Ocurrió un error inesperado.<br />
        Si el problema persiste, contacte al administrador.
      </p>

      <router-link
          to="/"
          class="inline-block mt-4 px-6 py-2 bg-indigo-600 rounded hover:bg-indigo-700"
      >
        Intentar nuevamente
      </router-link>
    </div>
  </div>
</template>
