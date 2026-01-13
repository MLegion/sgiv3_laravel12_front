<template>
    <div
        class="min-h-screen flex items-center justify-center bg-cover bg-center"
        :style="backgroundStyle"
    >
        <div class="w-full max-w-4xl bg-white rounded-xl shadow-xl p-10">

            <!-- HEADER -->
            <div class="flex items-center justify-between mb-8">
                <img
                    src="/img/TecNM.png"
                    alt="TecNM"
                    class="h-20 object-contain"
                />

                <h1 class="text-center text-lg md:text-xl font-semibold text-blue-700 leading-snug">
                    INSTITUTO TECNOLÓGICO<br />
                    SUPERIOR DE TIERRA BLANCA
                </h1>

                <img
                    src="/img/ITSTB.jpg"
                    alt="ITSTB"
                    class="h-20 object-contain"
                />
            </div>

            <!-- BODY -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">

                <!-- Avatar -->
                <div class="flex justify-center">
                    <img
                        src="/img/anonimus.jpg"
                        alt="Usuario"
                        class="w-56 h-56 object-cover rounded-md border shadow-sm"
                    />
                </div>

                <!-- FORM -->
                <form class="space-y-5" @submit.prevent="submit">

                    <!-- Usuario -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Usuario
                        </label>
                        <input
                            type="text"
                            placeholder="Usuario"
                            class="form-control"
                        />
                    </div>

                    <!-- Contraseña -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Contraseña
                        </label>
                        <input
                            type="password"
                            placeholder="Contraseña"
                            class="form-control"
                        />
                    </div>

                    <!-- Options -->
                    <div class="flex items-center justify-between text-sm pt-1">
                        <label class="flex items-center gap-2 text-gray-600">
                            <input type="checkbox" />
                            Recordarme
                        </label>

                        <a href="#" class="text-blue-600 hover:underline">
                            Recuperar contraseña
                        </a>
                    </div>

                    <!-- Button -->
                    <button
                        type="submit"
                        class="w-full mt-4 h-12 bg-indigo-600 hover:bg-indigo-700
                   text-white font-semibold rounded-lg transition shadow-md"
                    >
                        INGRESAR
                    </button>

                </form>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const backgroundStyle = {
    backgroundImage: "url('/img/background.png')",
}

function submit() {
    // login logic
}
</script>

<style scoped>
.form-control {
    width: 100%;
    height: 46px;
    border-radius: 6px;
    border: 1px solid #cbd5e1;
    padding: 0 12px;
    outline: none;
    font-size: 14px;
}

.form-control:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 1px #6366f1;
}
</style>
