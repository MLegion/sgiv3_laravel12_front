<template>
    <GlobalCatalogPage title="Becas" label="Beca" :endpoints="endpoints" />
</template>
<script setup lang="ts">
import GlobalCatalogPage from './GlobalCatalogPage.vue'
import { API } from '@/shared/api'
const endpoints = API.SUPERADMIN_API.admCatalogs.scholarships
</script>
