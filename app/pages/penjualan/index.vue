<script lang="ts" setup>
import type { TableColumn } from "@nuxt/ui";

useHead({
  title: "Penjualan Management",
  meta: [
    {
      name: "description",
      content: "Halaman untuk mengelola daftar penjualan yang tersedia.",
    },
  ],
});

definePageMeta({
  middleware: ["auth"],
});

// Type untuk data Penjualan
type Penjualan = {
  id: string;
  produkId: string;
  date: string;
  quantity: number;
  diskon: number;
  harga: number;
  total: number;
  createdBy: string;
  createdAt: string;
  user: {
    name: string;
    role: string;
  };
  produk: {
    nama: string;
    harga: number;
    stock: number;
    status: string;
  };
};

type PenjualanResponse = {
  data: Penjualan[];
  total: number;
  page: number;
  limit: number;
  totalPage: number;
};

// Parameter untuk pagination dan search
const params = ref({
  page: 1,
  limit: 10,
  search: "",
});

// Query untuk pagination dan search
const query = computed(() => ({
  page: params.value.page,
  limit: params.value.limit,
  ...(params.value.search ? { search: params.value.search } : {}),
}));

// Fetch data penjualan dengan pagination dan search
const {
  data: response,
  pending,
  refresh: _penjualanRefresh,
} = await useApiFetch<PenjualanResponse>("/penjualan", {
  method: "GET",
  query,
});

// Computed penjualan, total, dan kolom untuk table
const penjualans = computed<Penjualan[]>(() => response.value?.data || []);
const total = computed(() => response.value?.total ?? 0);

// Fungsi untuk format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

// Fungsi untuk format tanggal
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

// Kolom untuk table
const columns: TableColumn<Penjualan>[] = [
  {
    accessorKey: "id",
    header: "#",
    cell: ({ row }) =>
      (params.value.page - 1) * params.value.limit + row.index + 1,
  },
  {
    accessorKey: "produk",
    header: "Produk",
    cell: ({ row }) => row.original.produk.nama,
  },
  {
    accessorKey: "quantity",
    header: "Jumlah",
    cell: ({ row }) => `${row.original.quantity} pcs`,
  },
  {
    accessorKey: "harga",
    header: "Harga Satuan",
    cell: ({ row }) => formatCurrency(row.original.harga),
  },
  {
    accessorKey: "diskon",
    header: "Diskon",
    cell: ({ row }) => `${row.original.diskon}%`,
  },
  {
    accessorKey: "total",
    header: "Total",
    cell: ({ row }) => formatCurrency(row.original.total),
  },
  {
    accessorKey: "user",
    header: "Kasir",
    cell: ({ row }) => row.original.user.name,
  },
  {
    accessorKey: "date",
    header: "Tanggal Penjualan",
    cell: ({ row }) => formatDate(row.original.date),
  },
  {
    accessorKey: "createdAt",
    header: "Dibuat Tanggal",
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
];
</script>

<template>
  <UContainer>
    <h1 class="text-2xl font-bold mb-4">Daftar Penjualan</h1>

    <!-- Search Input -->
    <div class="flex flex-row gap-4 mb-6">
      <UInput
        v-model="params.search"
        placeholder="Cari penjualan..."
        class="w-64"
        icon="i-lucide-search"
      />
    </div>

    <!-- Table Penjualan -->
    <UTable
      :data="penjualans"
      :columns="columns"
      :loading="pending"
      class="flex-1"
    />

    <!-- Pagination -->
    <div class="flex justify-between items-center mt-4">
      <div class="text-sm text-gray-500">
        Menampilkan
        {{ penjualans.length > 0 ? (params.page - 1) * params.limit + 1 : 0 }}
        sampai {{ Math.min(params.page * params.limit, total) }} dari
        {{ total }} penjualan
      </div>
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
