<template>
  <UContainer>
    <h1 class="text-2xl font-bold mb-4">Daftar Jenis Pengeluaran</h1>

    <!-- Search Input -->
    <div class="flex flex-row gap-4 mb-6">
      <UInput
        v-model="params.search"
        placeholder="Cari Jenis Pengeluaran"
        class="w-full max-w-xs"
        icon="i-lucide-search"
      />
    </div>
    <!-- Jenis Pengeluaran Table -->
    <UTable
      :data="jenisPengeluaran"
      :columns="columns"
      :loading="pending"
      class="mb-6"
    />
    <!-- Pagination -->
    <div class="flex justify-between items-center">
      <span class="text-sm text-gray-600">
        Menampilkan {{ jenisPengeluaran.length }} dari {{ total }} data
      </span>
      <UPagination
        v-model:page="params.page"
        :total="total"
        :limit="params.limit"
        show-edges
      />
    </div>
  </UContainer>
</template>

<script setup lang="ts">
import { h, resolveComponent } from "vue";
import type { TableColumn } from "@nuxt/ui";
definePageMeta({
  middleware: ["auth"],
  title: "Jenis Pengeluaran Management",
  meta: [
    {
      name: "description",
      content:
        "Halaman untuk mengelola daftar jenis pengeluaran yang tersedia.",
    },
  ],
});

// type definitions for Jenis Pengeluaran
type JenisPengeluaran = {
  id: number;
  name: string;
  createdAt: string;
};

type JenisPengeluaranResponse = {
  data: JenisPengeluaran[];
  total: number;
  page: number;
  limit: number;
  totalPage: number;
};

// Parameter untuk page, limit, dan search
const params = ref({
  page: 1,
  limit: 10,
  search: "",
});

// Query untuk Pagination dan Search
const query = computed(() => ({
  page: params.value.page,
  limit: params.value.limit,
  ...(params.value.search ? { search: params.value.search } : {}),
}));

// fetch Data Jenis Pengeluaran
const {
  data: response,
  pending,
  refresh: _refreshJenisPengeluaran,
} = useApiFetch<JenisPengeluaranResponse>("/jenis-pengeluaran", {
  query,
  method: "GET",
});

// Computed data untuk Jenis Pengeluaran
const jenisPengeluaran = computed<JenisPengeluaran[]>(
  () => response.value?.data || []
);
const total = computed(() => response.value?.total || 0);

// Function untuk format tanggal
const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateString));
};

// Kolom untuk tabel Jenis Pengeluaran
const columns: TableColumn<JenisPengeluaran>[] = [
  {
    accessorKey: "id",
    header: "#",
    cell: ({ row }) =>
      (params.value.page - 1) * params.value.limit + row.index + 1,
  },
  {
    accessorKey: "name",
    header: "Nama Jenis Pengeluaran",
    cell: ({ row }) => row.original.name,
  },
  {
    accessorKey: "createdAt",
    header: "Tanggal Dibuat",
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
  {
    id: "actions",
    header: "Aksi",
    cell: ({ row }) => {
      const item = row.original;
      return h(resolveComponent("UButton"), {
        icon: "i-lucide-trash-2",
        color: "error",
        variant: "solid",
        onClick: () => console.log(item),
      });
    },
  },
];
</script>

<style scoped></style>
