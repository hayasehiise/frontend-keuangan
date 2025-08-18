<script lang="ts" setup>
import type { TableColumn } from "@nuxt/ui";
definePageMeta({
  middleware: ["auth"],
});

type User = {
  id: string;
  name: string;
  username: string;
  role: string;
  createdAt: string;
};
type UserResponse = {
  data: User[];
  total: number;
  page: number;
  limit: number;
  totalPage: number;
};

const params = ref({
  page: 1,
  limit: 10,
  search: "",
});
const query = computed(() => ({
  page: params.value.page,
  limit: params.value.limit,
  ...(params.value.search ? { search: params.value.search } : {}),
}));
const { data: response, pending } = await useApiFetch<UserResponse>("/user", {
  method: "GET",
  query,
});

const user = computed<User[]>(() => response.value?.data || []);
const total = computed(() => response.value?.total ?? 0);
const column: TableColumn<User>[] = [
  {
    accessorKey: "id",
    header: "#",
    cell: ({ row }) =>
      (params.value.page - 1) * params.value.limit + row.index + 1,
  },
  {
    accessorKey: "name",
    header: "Nama User",
  },
  {
    accessorKey: "username",
    header: "Username",
  },
  {
    accessorKey: "role",
    header: "Role User",
  },
  {
    accessorKey: "createdAt",
    header: "Dibuat Tanggal",
    cell: ({ row }) => {
      const date = new Date(row.original.createdAt);
      return new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
    },
  },
];
</script>

<template>
  <UContainer>
    <h1 class="text-2xl font-bold mb-4">User List</h1>
    <UInput v-model="params.search" placeholder="Cari user" class="w-64" />
    <!-- Table User -->
    <UTable :data="user" :columns="column" :loading="pending" class="flex-1" />
    <div class="flex justify-end mt-4">
      <UPagination
        v-model:page="params.page"
        :total="total"
        :items-per-page="params.limit"
        show-edges
      />
    </div>
  </UContainer>
</template>

<style lang="css" scoped></style>
