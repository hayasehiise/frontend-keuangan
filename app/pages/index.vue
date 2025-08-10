<template>
  <div>
    <h1>Dashboard page</h1>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({
  middleware: ["auth"],
});
const toast = useToast();
const userCookie = useCookie("user_data").value;
onMounted(async () => {
  toast.add({
    title: `Selamat Datang ${userCookie.name}`,
    description: "hanya deskripsi",
    color: "success",
  });
});
</script>

<style></style>
