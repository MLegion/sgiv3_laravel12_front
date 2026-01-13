<template>
    <div class="h-screen flex flex-col">

        <!-- Top Navbar -->
        <AppNavbar />

        <!-- Body -->
        <div class="flex flex-1 overflow-hidden">

            <!-- Sidebar -->
            <AppSidebar />
            <!-- Main content -->
            <main class="flex-1 overflow-auto bg-gray-50 p-6">
                <div class="px-6">
                    <Breadcrumbs />
                </div>
                <router-view />
            </main>

        </div>
    </div>
</template>

<script setup lang="ts">
import AppNavbar from '@/app/components/AppNavbar.vue'
import AppSidebar from '@/app/components/AppSidebar.vue'
import Breadcrumbs from '@/app/components/Breadcrumbs.vue'
</script>
