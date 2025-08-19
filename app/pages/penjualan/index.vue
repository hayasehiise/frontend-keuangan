<script lang="ts" setup>
import type { TableColumn, FormSubmitEvent } from "@nuxt/ui";
import { z } from "zod";

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

// Auth store untuk mengecek role user
const authStore = useAuthStore();

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

// Type untuk data Produk
type Product = {
  id: string;
  nama: string;
  harga: number;
  stock: number;
  status: string;
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

// Fetch data produk untuk select option
const { data: productsResponse } = await useApiFetch<{ data: Product[] }>(
  "/produk/list",
  {
    method: "GET",
  }
);

// Computed untuk data produk
const products = computed(() => productsResponse.value?.data || []);

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

// Modal State dan Form State
const addPenjualanModal = ref(false);
const isSubmitting = ref(false);

// Form reference untuk validasi
const formRef = ref();

// Selected produk untuk form
const selectedProduct = ref<Product | null>(null);

// Import toast composable
const toast = useToast();

// Schema validasi untuk form penjualan
const schema = z.object({
  produkId: z.string().min(1, "Produk harus dipilih"),
  date: z.string().min(1, "Tanggal penjualan harus diisi"),
  quantity: z.number().min(1, "Jumlah harus lebih dari 0"),
  diskon: z
    .number()
    .min(0, "Diskon tidak boleh negatif")
    .max(100, "Diskon maksimal 100%"),
});

type Schema = z.output<typeof schema>;

// Reactive state untuk form
const formState = reactive<Schema>({
  produkId: "",
  date: new Date().toISOString().slice(0, 16), // Format untuk datetime-local input
  quantity: 1,
  diskon: 0,
});

// Computed untuk options dropdown produk
const productOptions = computed(() => {
  if (!products.value || !Array.isArray(products.value)) {
    return [];
  }
  return products.value.map((product) => ({
    label: `${product.nama} - ${formatCurrency(product.harga)} (Stok: ${
      product.stock
    })`,
    value: product.id,
  }));
});

// Computed untuk harga produk yang dipilih
const selectedProductPrice = computed(() => {
  if (!formState.produkId || !products.value) {
    return 0;
  }
  const product = products.value.find((p) => p.id === formState.produkId);
  return product?.harga || 0;
});

// Computed untuk total otomatis
const calculatedTotal = computed(() => {
  const harga = selectedProductPrice.value;
  const quantity = formState.quantity || 0;
  const diskon = formState.diskon || 0;
  const total = harga * quantity;
  const diskonAmount = (total * diskon) / 100;
  return total - diskonAmount;
});

// Computed untuk mengecek apakah user bisa menambah penjualan (hanya OWNER dan KASIR)
const canAddPenjualan = computed(() => {
  const userRole = authStore.data?.role;
  return userRole === "OWNER" || userRole === "KASIR";
});

// Watcher untuk update selected product saat produkId berubah
watch(
  () => formState.produkId,
  (newProdukId) => {
    if (newProdukId && products.value) {
      const product = products.value.find((p) => p.id === newProdukId);
      selectedProduct.value = product || null;
    } else {
      selectedProduct.value = null;
    }
  }
);

// Form Submit Handler
async function onSubmit(event: FormSubmitEvent<Schema>) {
  event.preventDefault();
  isSubmitting.value = true;

  try {
    await schema.parseAsync(formState);

    // Konversi format tanggal untuk API
    const submitData = {
      ...formState,
      date: new Date(formState.date).toISOString(),
    };

    // Submit ke API
    await useApiFetchInput("/penjualan", {
      method: "POST",
      body: submitData,
    });

    toast.add({
      title: "Penjualan berhasil ditambahkan",
      color: "success",
    });

    addPenjualanModal.value = false;

    // Reset form state
    Object.assign(formState, {
      produkId: "",
      date: new Date().toISOString(),
      quantity: 1,
      diskon: 0,
    });

    selectedProduct.value = null;

    await _penjualanRefresh(); // Refresh penjualan list after adding new penjualan
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
        title: "Terjadi kesalahan saat menambahkan penjualan",
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
function openAddPenjualanModal() {
  addPenjualanModal.value = true;
}

// Function untuk menutup modal dan reset form
function closeAddPenjualanModal() {
  addPenjualanModal.value = false;
  Object.assign(formState, {
    produkId: "",
    date: new Date().toISOString().slice(0, 16), // Format untuk datetime-local input
    quantity: 1,
    diskon: 0,
  });
  selectedProduct.value = null;
}
</script>

<template>
  <UContainer>
    <h1 class="text-2xl font-bold mb-4">Daftar Penjualan</h1>

    <!-- Search Input dan Button Tambah Penjualan -->
    <div class="flex flex-row gap-4 mb-6">
      <UInput
        v-model="params.search"
        placeholder="Cari penjualan..."
        class="w-64"
        icon="i-lucide-search"
      />
      <UButton
        v-if="canAddPenjualan"
        icon="i-lucide-circle-plus"
        label="Tambah Penjualan"
        color="primary"
        @click="openAddPenjualanModal"
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

    <!-- Modal Add Penjualan -->
    <UModal
      v-model:open="addPenjualanModal"
      :ui="{ footer: 'justify-end', body: 'p-6' }"
    >
      <template #header>
        <h2 class="text-lg font-semibold">Tambah Penjualan Baru</h2>
      </template>
      <template #body>
        <UForm
          ref="formRef"
          :schema="schema"
          :state="formState"
          class="space-y-4"
          @submit="onSubmit"
        >
          <UFormField label="Produk" name="produkId" required>
            <USelect
              v-model="formState.produkId"
              :items="productOptions"
              placeholder="Pilih produk"
              class="w-full"
              :disabled="isSubmitting"
            />
          </UFormField>
          <UFormField label="Tanggal Penjualan" name="date" required>
            <UInput
              v-model="formState.date"
              type="datetime-local"
              class="w-full"
              :disabled="isSubmitting"
            />
          </UFormField>
          <UFormField label="Jumlah" name="quantity" required>
            <UInput
              v-model.number="formState.quantity"
              type="number"
              placeholder="Masukan jumlah"
              class="w-full"
              :disabled="isSubmitting"
              min="1"
            />
          </UFormField>
          <UFormField label="Diskon (%)" name="diskon" required>
            <UInput
              v-model.number="formState.diskon"
              type="number"
              placeholder="Masukan diskon (0-100)"
              class="w-full"
              :disabled="isSubmitting"
              min="0"
              max="100"
            />
          </UFormField>
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-gray-50 p-3 rounded-lg">
              <p class="text-sm text-gray-600">Harga Satuan</p>
              <p class="font-semibold">
                {{ formatCurrency(selectedProductPrice) }}
              </p>
            </div>
            <div class="bg-gray-50 p-3 rounded-lg">
              <p class="text-sm text-gray-600">Total</p>
              <p class="font-semibold">{{ formatCurrency(calculatedTotal) }}</p>
            </div>
          </div>
        </UForm>
      </template>
      <template #footer>
        <UButton
          label="Cancel"
          color="neutral"
          variant="outline"
          :disabled="isSubmitting"
          @click="closeAddPenjualanModal"
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
  </UContainer>
</template>

<style lang="css" scoped></style>
