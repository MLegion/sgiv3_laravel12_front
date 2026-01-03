<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-400 via-purple-400 to-blue-500 px-4">
    <div class="relative w-full max-w-md bg-white/90 backdrop-blur rounded-2xl shadow-xl p-8">

      <!-- Avatar -->
      <div class="absolute -top-14 left-1/2 -translate-x-1/2">
        <div class="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg ring-4 ring-white">
          <UserIcon class="w-12 h-12 text-white" />
        </div>
      </div>

      <form class="mt-16 space-y-5" @submit.prevent="submit">

        <!-- College -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            College
          </label>
          <select
              class="w-full h-12 rounded-lg border border-gray-300 bg-white px-4 text-gray-700
                   focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Selecciona un college</option>
            <option value="1">College 1</option>
            <option value="2">College 2</option>
          </select>
        </div>

        <!-- Usuario -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Usuario
          </label>

          <div class="relative">
            <span class="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <UserIcon class="w-5 h-5 text-gray-400" />
            </span>

            <input
                type="text"
                placeholder="Usuario"
                class="w-full h-12 rounded-lg border border-gray-300 bg-white
                     pl-12 pr-4 text-gray-700
                     focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <!-- Contraseña -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Contraseña
          </label>

          <div class="relative">
            <span class="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <LockClosedIcon class="w-5 h-5 text-gray-400" />
            </span>

            <input
                type="password"
                placeholder="Contraseña"
                class="w-full h-12 rounded-lg border border-gray-300 bg-white
                     pl-12 pr-4 text-gray-700
                     focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <!-- Opciones -->
        <div class="flex items-center justify-between text-sm">
          <label class="flex items-center gap-2 text-gray-600">
            <input type="checkbox" class="rounded border-gray-300" />
            Recordarme
          </label>

          <a href="#" class="text-indigo-600 hover:underline">
            ¿Olvidaste tu contraseña?
          </a>
        </div>

        <!-- Botón -->
        <button
            type="submit"
            class="w-full h-12 rounded-lg bg-indigo-600 text-white font-semibold
                 hover:bg-indigo-700 transition shadow-md"
        >
          LOGIN
        </button>

      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { UserIcon, LockClosedIcon } from '@heroicons/vue/24/outline'

function submit() {
  // login logic
}
</script>
