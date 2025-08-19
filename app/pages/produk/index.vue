<script lang="ts" setup>
import type { TableColumn, FormSubmitEvent } from "@nuxt/ui";
import { z } from "zod";

definePageMeta({
  middleware: ["auth"],
});

// Auth store untuk mengecek role user
const authStore = useAuthStore();

// Type untuk data Produk
type Product = {
  id: string;
  nama: string;
  harga: number;
  stock: number;
  status: string;
  tokoId: string;
  createdAt: string;
  toko: {
    nama: string;
  };
};

type ProductResponse = {
  data: Product[];
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

// Fetch data produk dengan pagination dan search
const {
  data: response,
  pending,
  refresh: _productRefresh,
} = await useApiFetch<ProductResponse>("/produk", {
  method: "GET",
  query,
});

// Computed produk, total, dan kolom untuk table
const products = computed<Product[]>(() => response.value?.data || []);
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
const columns: TableColumn<Product>[] = [
  {
    accessorKey: "id",
    header: "#",
    cell: ({ row }) =>
      (params.value.page - 1) * params.value.limit + row.index + 1,
  },
  {
    accessorKey: "nama",
    header: "Nama Produk",
  },
  {
    accessorKey: "harga",
    header: "Harga",
    cell: ({ row }) => formatCurrency(row.original.harga),
  },
  {
    accessorKey: "stock",
    header: "Stok",
    cell: ({ row }) => `${row.original.stock} pcs`,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      return h(
        "span",
        {
          class:
            status === "TERSEDIA"
              ? "px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium"
              : "px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium",
        },
        status
      );
    },
  },
  {
    accessorKey: "toko",
    header: "Toko",
    cell: ({ row }) => row.original.toko.nama,
  },
  {
    accessorKey: "createdAt",
    header: "Dibuat Tanggal",
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
];

// Modal State dan Form State
const addProductModal = ref(false);
const isSubmitting = ref(false);

// Form reference untuk validasi
const formRef = ref();

// Import toast composable
const toast = useToast();

// Schema validasi untuk form produk
const schema = z.object({
  nama: z.string().min(1, "Nama produk tidak boleh kosong"),
  harga: z.number().min(1, "Harga harus lebih dari 0"),
  stock: z.number().min(0, "Stok tidak boleh negatif"),
});

type Schema = z.output<typeof schema>;

// Reactive state untuk form
const formState = reactive<Schema>({
  nama: "",
  harga: 0,
  stock: 0,
});

// Computed untuk mengecek apakah user bisa menambah produk (hanya OWNER dan KASIR)
const canAddProduct = computed(() => {
  const userRole = authStore.data?.role;
  return userRole === "OWNER" || userRole === "KASIR";
});

// Form Submit Handler
async function onSubmit(event: FormSubmitEvent<Schema>) {
  event.preventDefault();
  isSubmitting.value = true;

  try {
    await schema.parseAsync(formState);

    // Submit ke API
    await useApiFetchInput("/produk", {
      method: "POST",
      body: formState,
    });

    toast.add({
      title: "Produk berhasil ditambahkan",
      color: "success",
    });

    addProductModal.value = false;

    // Reset form state
    Object.assign(formState, {
      nama: "",
      harga: 0,
      stock: 0,
    });

    await _productRefresh(); // Refresh product list after adding new product
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.issues.forEach((err) =>
        toast.add({
          title: err.message,
          color: "error",
        })
      );
    } else {
      toast.add({
        title: "Terjadi kesalahan saat menambahkan produk",
        color: "error",
      });
    }
  } finally {
    isSubmitting.value = false;
  }
}

// Function untuk submit form dari footer modal
async function submitForm() {
  if (formRef.value) {
    await formRef.value.submit();
  }
}

// Function untuk membuka modal
function openAddProductModal() {
  addProductModal.value = true;
}

// Function untuk menutup modal dan reset form
function closeAddProductModal() {
  addProductModal.value = false;
  Object.assign(formState, {
    nama: "",
    harga: 0,
    stock: 0,
  });
}
</script>

<template>
  <UContainer>
    <h1 class="text-2xl font-bold mb-4">Daftar Produk</h1>

    <!-- Search Input dan Button Tambah Produk -->
    <div class="flex flex-row gap-4 mb-6">
      <UInput
        v-model="params.search"
        placeholder="Cari produk..."
        class="w-64"
        icon="i-lucide-search"
      />
      <UButton
        v-if="canAddProduct"
        icon="i-lucide-circle-plus"
        label="Tambah Produk"
        color="primary"
        @click="openAddProductModal"
      />

      <!-- Modal Add Product -->
      <UModal
        v-model:open="addProductModal"
        :ui="{ footer: 'justify-end', body: 'p-6' }"
      >
        <template #header>
          <h2 class="text-lg font-semibold">Tambah Produk Baru</h2>
        </template>
        <template #body>
          <UForm
            ref="formRef"
            :schema="schema"
            :state="formState"
            class="space-y-4"
            @submit="onSubmit"
          >
            <UFormField label="Nama Produk" name="nama" required>
              <UInput
                v-model="formState.nama"
                placeholder="Masukan nama produk"
                class="w-full"
                :disabled="isSubmitting"
              />
            </UFormField>
            <UFormField label="Harga" name="harga" required>
              <UInput
                v-model.number="formState.harga"
                placeholder="Masukan harga produk"
                class="w-full"
                type="number"
                :disabled="isSubmitting"
              />
            </UFormField>
            <UFormField label="Stok" name="stock" required>
              <UInput
                v-model.number="formState.stock"
                placeholder="Masukan jumlah stok"
                class="w-full"
                type="number"
                :disabled="isSubmitting"
              />
            </UFormField>
          </UForm>
        </template>
        <template #footer>
          <UButton
            label="Cancel"
            color="neutral"
            variant="outline"
            :disabled="isSubmitting"
            @click="closeAddProductModal"
          />
          <UButton
            label="Submit"
            color="primary"
            :loading="isSubmitting"
            :disabled="isSubmitting"
            @click="submitForm"
          />
        </template>
      </UModal>
    </div>

    <!-- Table Produk -->
    <UTable
      :data="products"
      :columns="columns"
      :loading="pending"
      class="flex-1"
    />

    <!-- Pagination -->
    <div class="flex justify-between items-center mt-4">
      <div class="text-sm text-gray-500">
        Menampilkan
        {{ products.length > 0 ? (params.page - 1) * params.limit + 1 : 0 }}
        sampai {{ Math.min(params.page * params.limit, total) }} dari
        {{ total }} produk
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
