<script lang="ts" setup>
definePageMeta({
  middleware: ["auth"],
});
const { data: response, pending, error } = await useApiFetch("/user");

const user = computed(() => response.value?.data || []);

console.log(user);
</script>

<template>
  <div>
    <p>User index Page</p>
  </div>
</template>

<style lang="css" scoped></style>
