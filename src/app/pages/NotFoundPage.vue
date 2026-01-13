<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="text-center space-y-4">
      <h1 class="text-6xl font-bold text-indigo-500">404</h1>
      <p class="text-xl">Página no encontrada</p>
      <p class="text-gray-600">
        La ruta que intentas visitar no existe o fue movida.
      </p>

      <router-link
          to="/"
          class="inline-block mt-4 px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
      >
        Volver al inicio
      </router-link>
    </div>
  </div>
</template>
