<script lang="ts" setup>
import type { TableColumn } from "@nuxt/ui";

definePageMeta({
  middleware: ["auth"],
  title: "Pengeluaran Management",
  meta: [
    {
      name: "description",
      content: "Halaman untuk mengelola daftar pengeluaran yang tersedia.",
    },
  ],
});

// type definitions for Pengeluaran
type Pengeluaran = {
  id: string;
  jenisPengeluaranId: number;
  date: string;
  nominal: number;
  detailPencatatan: string;
  createdAt: string;
  createdBy: string;
  jenisPengeluaran: {
    name: string;
  };
  user: {
    name: string;
  };
};
type PengeluaranResponse = {
  data: Pengeluaran[];
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

// fetch Data Pengeluaran
const {
  data: response,
  pending,
  refresh: _refreshPengeluaran,
} = useApiFetch<PengeluaranResponse>("/pengeluaran", {
  query,
  method: "GET",
});

// Computed data untuk Pengeluaran
const pengeluaran = computed<Pengeluaran[]>(() => response.value?.data || []);
const total = computed(() => response.value?.total || 0);

// Function untuk format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
  }).format(value);
};

// Function untuk format tanggal
const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateString));
};

// Kolom untuk tabel Pengeluaran
const columns: TableColumn<Pengeluaran>[] = [
  {
    accessorKey: "id",
    header: "#",
    cell: ({ row }) =>
      (params.value.page - 1) * params.value.limit + row.index + 1,
  },
  {
    accessorKey: "jenisPengeluaran.name",
    header: "Jenis Pengeluaran",
    cell: ({ row }) => row.original.jenisPengeluaran.name,
  },
  {
    accessorKey: "date",
    header: "Tanggal",
    cell: ({ row }) => formatDate(row.original.date),
  },
  {
    accessorKey: "nominal",
    header: "Nominal",
    cell: ({ row }) => formatCurrency(row.original.nominal),
  },
  {
    accessorKey: "detailPencatatan",
    header: "Detail Pencatatan",
    cell: ({ row }) =>
      row.original.detailPencatatan === ""
        ? "<Tanpa Catatan>"
        : row.original.detailPencatatan,
  },
  {
    accessorKey: "createdAt",
    header: "Dibuat Pada",
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
  {
    accessorKey: "createdBy.name",
    header: "Dibuat Oleh",
    cell: ({ row }) => row.original.user.name,
  },
  {
    id: "actions",
    header: "Aksi",
    cell: ({ row }) => {
      return h("div", { class: "flex gap-2" }, [
        h(resolveComponent("UButton"), {
          icon: "i-lucide-edit",
          variant: "solid",
          color: "primary",
          size: "sm",
          onClick: () => {
            console.log("Edit Pengeluaran", row.original);
          },
        }),
        h(resolveComponent("UButton"), {
          icon: "i-lucide-trash-2",
          variant: "solid",
          color: "error",
          size: "sm",
          onClick: () => {
            console.log("Hapus Pengeluaran", row.original);
          },
        }),
      ]);
    },
  },
];
</script>

<template>
  <UContainer>
    <h1 class="text-2xl font-bold mb-4">Daftar Pengeluaran</h1>
    <div class="flex flex-row mb-4">
      <UInput
        v-model="params.search"
        placeholder="Cari Pengeluaran..."
        class="mb-4"
        icon="i-lucide-search"
        @input="_refreshPengeluaran"
      />
    </div>

    <!-- Table Pengeluaran -->
    <UTable
      :data="pengeluaran"
      :columns="columns"
      :loading="pending"
      class="flex-1"
    />

    <!-- Pagination -->
    <div class="flex justify-between items-center mt-4">
      <div class="text-sm text-gray-400">
        Menampilkan
        {{ pengeluaran.length > 0 ? (params.page - 1) * params.limit + 1 : 0 }}
        sampai {{ Math.min(params.page * params.limit, total) }} dari
        {{ total }} pengeluaran
      </div>
      <UPagination
        v-model:page="params.page"
        :total="total"
        :items-per-page="params.limit"
        :sibling-count="1"
        show-edges
      />
    </div>
  </UContainer>
</template>

<style lang="css" scoped></style>
