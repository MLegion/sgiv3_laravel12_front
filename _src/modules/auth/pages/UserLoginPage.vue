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

                    <!-- College -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Institución
                        </label>
                        <select
                            v-model="collegeId"
                            @change="onCollegeChange"
                            class="w-full h-12 rounded-lg border border-gray-300 px-4"
                        >
                            <option :value="null" disabled>SELECCIONE UNA INSTITUCIÓN</option>

                            <option
                                v-for="college in collegeStore.colleges"
                                :key="college.id"
                                :value="college.id"
                            >
                                {{ college.name }}
                            </option>
                        </select>
                        <span v-if="errors.college" class="text-sm text-red-600">
                          {{ errors.college }}
                        </span>
                    </div>

                    <!-- Usuario -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Usuario
                        </label>
                        <input
                            v-model="email"
                            type="text"
                            placeholder="Usuario"
                            class="form-control"
                        />
                        <span v-if="errors.user" class="text-sm text-red-600">
                          {{ errors.user }}
                        </span>
                    </div>

                    <!-- Contraseña -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Contraseña
                        </label>
                        <input
                            v-model="password"
                            type="password"
                            placeholder="Contraseña"
                            class="form-control"
                        />
                        <span v-if="errors.password" class="text-sm text-red-600">
                          {{ errors.password }}
                        </span>
                    </div>
                    <div
                        v-if="errors.general"
                        class="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3"
                    >
                        {{ errors.general }}
                    </div>
                    <!-- Options -->
                    <div class="flex items-center justify-between text-sm pt-1">
                        <label class="flex items-center gap-2 text-gray-600">
                            <input
                                type="checkbox"
                                v-model="rememberMe"
                            />
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
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/modules/auth/auth.store.ts'
import { useCollegeStore } from '@/modules/auth/college.store'

/* ---------- state ---------- */
const authStore = useAuthStore()
const collegeStore = useCollegeStore()

const collegeId = ref<number | null>(null)
const email = ref('')
const password = ref('')

const rememberMe = ref(false)

const errors = ref<{
    college?: string
    user?: string
    password?: string
    general?: string
}>({})

onMounted(() => {
    collegeStore.hydrate()

    collegeStore.loadColleges()

    if (collegeStore.selectedCollege) {
        collegeId.value = collegeStore.selectedCollege.id
    }
})

function onCollegeChange() {
    const college = collegeStore.colleges.find(
        c => c.id === collegeId.value
    )

    if (college) {
        collegeStore.selectCollege(college)
    }
}

function clearError(field: keyof typeof errors.value) {
    delete errors.value[field]
}

async function submit() {
    errors.value = {}

    if (!collegeStore.selectedCollege) {
        errors.value.college = 'Selecciona una institución'
    }

    if (!email.value) {
        errors.value.user = 'El usuario es obligatorio'
    }

    if (!password.value) {
        errors.value.password = 'La contraseña es obligatoria'
    }

    if (Object.keys(errors.value).length > 0) {
        return
    }

    try {
        await authStore.login({
            email: email.value,
            password: password.value,
            collegeId: collegeStore.selectedCollege!.id,
            rememberMe: rememberMe.value,
        })
    } catch (error) {
        console.log(error)
        errors.value.general = 'Usuario o contraseña incorrectos'
    }
}

const backgroundStyle = {
    backgroundImage: "url('/img/background.png')",
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
