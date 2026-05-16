"use client";

import { useMemo, useState, useEffect, type FormEvent, type ChangeEvent } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, writeBatch, getDocs, serverTimestamp } from "firebase/firestore";
import { useProducts } from "@/context/ProductContext";
import { useAuth } from "@/context/AuthContext";
import AnimatedSection from "@/components/AnimatedSection";
import Button from "@/components/Button";
import { Product, Order, UserProfile } from "@/types";
import { db, storage } from "@/firebase/client";

const blankForm: Product = {
  id: "",
  name: "",
  price: 0,
  category: "men",
  colors: [],
  sizes: [],
  images: [],
  imagesByColor: {},
  description: "",
};

function normalizeList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function generateProductId(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function AdminPage() {
  const { user, userProfile, loading } = useAuth();
  const { products, categories, addProduct, updateProduct, removeProduct, loading: productsLoading } = useProducts();

  // Pagination states for each list
  const [productPage, setProductPage] = useState(1);
  const [recentOrderPage, setRecentOrderPage] = useState(1);
  const [allOrderPage, setAllOrderPage] = useState(1);
  const [currentUserPage, setCurrentUserPage] = useState(1);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [adminMessage, setAdminMessage] = useState<string>("");
  const [userSearchTerm, setUserSearchTerm] = useState<string>("");
  const [productSearchTerm, setProductSearchTerm] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userDetailsOpen, setUserDetailsOpen] = useState<boolean>(false);

  // Move useMemo before any conditional returns to comply with Rules of Hooks
  const selectedProduct = useMemo(
    () => products.find((product) => product.id === editingId) ?? null,
    [editingId, products]
  );

  useEffect(() => {
    if (!db) return;

    const ordersQuery = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const ordersUnsub = onSnapshot(ordersQuery, (snapshot) => {
      const orderData: Order[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt || new Date(),
        } as Order;
      });
      setOrders(orderData);
      setOrdersLoading(false);
    });

    const usersQuery = query(collection(db, "users"), orderBy("fullName", "asc"));
    const usersUnsub = onSnapshot(usersQuery, (snapshot) => {
      const usersData: UserProfile[] = snapshot.docs.map((docSnap) => ({
        uid: docSnap.id,
        ...docSnap.data(),
      } as UserProfile));
      setUsers(usersData);
      setUsersLoading(false);
    });

    return () => {
      ordersUnsub();
      usersUnsub();
    };
  }, []);

  const usersById = useMemo(
    () => Object.fromEntries(users.map((user) => [user.uid, user])),
    [users]
  );

  const orderCountsByUser = useMemo(
    () =>
      orders.reduce((acc, order) => {
        acc[order.userId] = (acc[order.userId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    [orders]
  );

  // Filter users by search
  const filteredUsers = useMemo(() => {
    return users.filter(user =>
      user.fullName?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      user.phone?.includes(userSearchTerm) ||
      user.uid.toLowerCase().includes(userSearchTerm.toLowerCase())
    );
  }, [users, userSearchTerm]);

  // Filter products by search
  const filteredProducts = useMemo(() => {
    return products.filter(product =>
      product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
      product.id.toLowerCase().includes(productSearchTerm.toLowerCase())
    );
  }, [products, productSearchTerm]);

  // Recent orders (last 24 hours)
  const recentOrders = useMemo(() => {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return orders.filter(order => {
      const orderDate = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt);
      return orderDate > twentyFourHoursAgo;
    });
  }, [orders]);

  // ---------------- PAGINATION COMPUTATIONS (5 items per page) ----------------

  const ITEMS_PER_PAGE = 5;

  // Products
  const totalProductPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const start = (productPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, productPage]);

  // Recent orders
  const totalRecentOrderPages = Math.ceil(recentOrders.length / ITEMS_PER_PAGE);
  const paginatedRecentOrders = useMemo(() => {
    const start = (recentOrderPage - 1) * ITEMS_PER_PAGE;
    return recentOrders.slice(start, start + ITEMS_PER_PAGE);
  }, [recentOrders, recentOrderPage]);

  // All orders
  const totalAllOrderPages = Math.ceil(orders.length / ITEMS_PER_PAGE);
  const paginatedAllOrders = useMemo(() => {
    const start = (allOrderPage - 1) * ITEMS_PER_PAGE;
    return orders.slice(start, start + ITEMS_PER_PAGE);
  }, [orders, allOrderPage]);

  // Users (change from 10 to 5 per page)
  const totalUserPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = useMemo(() => {
    const start = (currentUserPage - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredUsers, currentUserPage]);

  // ---------------------------------------------------------------------------

  type AdminFormState = Product & {
    colorsInput: string;
    sizesInput: string;
    imagesInput: string;
    imagesByColorInput: Record<string, string>;
  };

  const [formState, setFormState] = useState<AdminFormState>({
    ...blankForm,
    colorsInput: "",
    sizesInput: "",
    imagesInput: "",
    imagesByColorInput: {},
  });

  const isEditing = Boolean(editingId);

  if (loading || productsLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-base text-brand-500">Loading admin tools…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h1 className="mb-4 text-3xl font-light uppercase tracking-[0.3em] text-brand-900">Admin</h1>
        <p className="text-brand-500">Please sign in with an admin account to manage products.</p>
        <div className="mt-8 flex justify-center gap-4">
          <Button href="/login">Sign In</Button>
          <Button href="/login" variant="secondary">Create Account</Button>
        </div>
      </div>
    );
  }

  if (userProfile?.role !== "admin") {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h1 className="mb-4 text-3xl font-light uppercase tracking-[0.3em] text-brand-900">Access Denied</h1>
        <p className="text-brand-500">Your account does not have admin permissions.</p>
        <p className="mt-4 text-sm text-brand-500">Ask a site administrator to assign your user role in Firebase.</p>
      </div>
    );
  }

  const resetForm = () => {
    setFormState({
      ...blankForm,
      colorsInput: "",
      sizesInput: "",
      imagesInput: "",
      imagesByColorInput: {},
    });
    setEditingId(null);
    setMessage("");
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setFormState({
      ...product,
      colorsInput: product.colors.join(", "),
      sizesInput: product.sizes.join(", "),
      imagesInput: product.images.join(", "),
      imagesByColorInput: Object.fromEntries(
        Object.entries(product.imagesByColor || {}).map(([color, urls]) => [
          color,
          urls.join(", "),
        ])
      ),
    });
    setMessage("");
  };

  const handleDelete = (productId: string) => {
    if (window.confirm("Remove this product from the catalog?")) {
      removeProduct(productId);
      if (editingId === productId) {
        resetForm();
      }
      setMessage("Product removed successfully.");
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: Order["status"]) => {
    if (!db) {
      setAdminMessage("Firebase not initialized.");
      return;
    }

    try {
      setAdminMessage("");
      const firestore = db;
      const orderRef = doc(firestore, "orders", orderId);
      const payload: any = { status };
      if (status === "delivered") {
        payload.deliveredAt = serverTimestamp();
      }
      await updateDoc(orderRef, payload);
      setAdminMessage("Order status updated.");
    } catch (error) {
      console.error(error);
      setAdminMessage("Unable to update order status.");
    }
  };

  const handleUpdateReturnStatus = async (orderId: string, returnStatus: Order["returnStatus"]) => {
    if (!db) {
      setAdminMessage("Firebase not initialized.");
      return;
    }

    try {
      setAdminMessage("");
      const firestore = db;
      const orderRef = doc(firestore, "orders", orderId);
      await updateDoc(orderRef, { returnStatus });
      setAdminMessage("Return status updated.");
    } catch (error) {
      console.error(error);
      setAdminMessage("Unable to update return status.");
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm("Delete this order permanently?")) return;
    if (!db) {
      setAdminMessage("Firebase not initialized.");
      return;
    }

    try {
      setAdminMessage("");
      const firestore = db;
      await deleteDoc(doc(firestore, "orders", orderId));
      setAdminMessage("Order deleted successfully.");
    } catch (error) {
      console.error(error);
      setAdminMessage("Unable to delete order.");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Delete this user and all their orders?")) return;
    if (!db) {
      setAdminMessage("Firebase not initialized.");
      return;
    }

    try {
      setAdminMessage("");
      const firestore = db;
      const userRef = doc(firestore, "users", userId);
      const userOrdersQuery = query(collection(firestore, "orders"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(userOrdersQuery);
      const batch = writeBatch(firestore);
      querySnapshot.docs
        .filter((docSnap) => docSnap.data().userId === userId)
        .forEach((docSnap) => batch.delete(doc(firestore, "orders", docSnap.id)));
      batch.delete(userRef);
      await batch.commit();
      setAdminMessage("User and related orders deleted.");
    } catch (error) {
      console.error(error);
      setAdminMessage("Unable to delete user.");
    }
  };

  const handleUpdateUserRole = async (userId: string, role: UserProfile["role"]) => {
    if (!db) {
      setAdminMessage("Firebase not initialized.");
      return;
    }

    try {
      setAdminMessage("");
      const firestore = db;
      const userRef = doc(firestore, "users", userId);
      await updateDoc(userRef, { role });
      setAdminMessage("User role updated.");
    } catch (error) {
      console.error(error);
      setAdminMessage("Unable to update user role.");
    }
  };

  const handleUpdateUserDetails = async (userId: string, updates: Partial<UserProfile>) => {
    if (!db) {
      setAdminMessage("Firebase not initialized.");
      return;
    }

    try {
      setAdminMessage("");
      const firestore = db;
      const userRef = doc(firestore, "users", userId);
      await updateDoc(userRef, updates);
      setAdminMessage("User details updated.");
      setSelectedUser(prev => prev ? { ...prev, ...updates } : null);
    } catch (error) {
      console.error(error);
      setAdminMessage("Unable to update user details.");
    }
  };

  const handleImagesChange = (color: string, value: string) => {
    setFormState((prev) => ({
      ...prev,
      imagesByColorInput: {
        ...prev.imagesByColorInput,
        [color]: value,
      },
      imagesByColor: {
        ...prev.imagesByColor,
        [color]: normalizeList(value),
      },
    }));
  };

  const handleColorInputChange = (value: string) => {
    const colors = normalizeList(value);
    setFormState((prev) => {
      const imagesByColor = { ...(prev.imagesByColor ?? {}) };

      Object.keys(imagesByColor).forEach((color) => {
        if (!colors.includes(color)) {
          delete imagesByColor[color];
        }
      });

      colors.forEach((color) => {
        if (!imagesByColor[color]) {
          imagesByColor[color] = prev.imagesByColor?.[color] ?? [];
        }
      });

      return { ...prev, colors, imagesByColor };
    });
  };

  const handleUpload = async (color: string | null, event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;

    const productId = formState.id.trim() || generateProductId(formState.name);
    if (!productId) {
      setMessage("Enter a product name or product ID before uploading images.");
      return;
    }

    const uploadStorage = storage;
    if (!uploadStorage) {
      setMessage("Firebase Storage is not initialized.");
      return;
    }

    setMessage("");

    try {
      const uploadedUrls = await Promise.all(
        Array.from(files).map(async (file) => {
          const path = `products/${productId}/${color ?? "general"}/${Date.now()}-${encodeURIComponent(file.name)}`;
          const storageRef = ref(uploadStorage, path);
          const snapshot = await uploadBytes(storageRef, file);
          return await getDownloadURL(snapshot.ref);
        })
      );

      setFormState((prev) => {
        if (color) {
          return {
            ...prev,
            imagesByColor: {
              ...prev.imagesByColor,
              [color]: [...(prev.imagesByColor?.[color] ?? []), ...uploadedUrls],
            },
          };
        }

        return {
          ...prev,
          images: [...prev.images, ...uploadedUrls],
        };
      });

      setMessage(`Uploaded ${uploadedUrls.length} file(s) successfully.`);
    } catch (error) {
      console.error(error);
      setMessage("Upload failed. Verify your Firebase Storage rules and network connection.");
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const productId = formState.id.trim() || generateProductId(formState.name);
    const product: Product = {
      ...formState,
      id: productId,
      colors: normalizeList(formState.colors.join(",")),
      sizes: normalizeList(formState.sizes.join(",")),
      images: normalizeList(formState.images.join(",")),
      imagesByColor: Object.fromEntries(
        normalizeList(formState.colors.join(",")).map((color) => [
          color,
          normalizeList((formState.imagesByColor?.[color] ?? []).join(",")),
        ])
      ) as Record<string, string[]>,
    };

    const allImageUrls = [
      ...product.images,
      ...Object.values(product.imagesByColor ?? {}).flat(),
    ];

    if (!product.name || !product.description || product.price <= 0 || allImageUrls.length < 2) {
      setMessage("Please provide a name, price, description, and at least two images in total.");
      return;
    }

    if (product.colors.length > 0) {
      const missingColors = product.colors.filter((color) => !product.imagesByColor?.[color]?.length);
      if (missingColors.length > 0) {
        setMessage(`Please add one or more images for each color variant: ${missingColors.join(", ")}`);
        return;
      }
    }

    if (isEditing) {
      await updateProduct(product);
      setMessage("Product updated successfully.");
    } else {
      if (products.some((item) => item.id === product.id)) {
        setMessage("A product with this ID already exists. Change the ID or product name.");
        return;
      }
      await addProduct(product);
      setMessage("Product added successfully.");
    }

    resetForm();
  };

  // --- Reusable Pagination Controls Component ---
  function PaginationControls({ currentPage, totalPages, onPageChange, label }: { currentPage: number; totalPages: number; onPageChange: (page: number) => void; label: string }) {
    if (totalPages <= 1) return null;
    return (
      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="rounded-2xl border border-brand-grey-200 bg-white px-4 py-2 text-sm text-brand-700 hover:bg-brand-grey-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <span className="text-sm text-brand-500">
          {label} Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="rounded-2xl border border-brand-grey-200 bg-white px-4 py-2 text-sm text-brand-700 hover:bg-brand-grey-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <AnimatedSection>
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-light uppercase tracking-[0.3em] text-brand-900">Admin Panel</h1>
            <p className="mt-2 text-sm text-brand-500">
              Manage products and Firebase image paths for the store catalog.
            </p>
          </div>
          <div className="rounded-2xl bg-brand-grey-100 px-5 py-4 text-sm text-brand-600">
            Product changes are saved directly to Firebase Firestore.
          </div>
        </div>
      </AnimatedSection>

      <section className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div className="overflow-hidden rounded-3xl border border-brand-grey-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Products</h2>
              <p className="text-sm text-brand-500">{filteredProducts.length} items</p>
            </div>

            <div className="mb-4">
              <input
                type="text"
                placeholder="Search products by name, category, or ID..."
                value={productSearchTerm}
                onChange={(e) => setProductSearchTerm(e.target.value)}
                className="w-full rounded-2xl border border-brand-grey-200 bg-brand-grey-50 px-4 py-3 text-sm text-brand-900 outline-none focus:border-brand-900"
              />
            </div>

            <div className="space-y-4">
              {paginatedProducts.map((product) => (
                <div key={product.id} className="grid gap-3 rounded-3xl border border-brand-grey-100 bg-brand-grey-50 p-4 md:grid-cols-[1fr_auto] md:items-center">
                  <div>
                    <p className="font-semibold uppercase tracking-widest text-brand-700">{product.name}</p>
                    <p className="text-sm text-brand-500">ID: {product.id}</p>
                    <p className="text-sm text-brand-500">Category: {product.category}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" onClick={() => handleEdit(product)} className="border border-brand-900 bg-black text-brand-900 hover:bg-brand-900 hover:text-white">
                      Edit
                    </Button>
                    <Button type="button" onClick={() => handleDelete(product.id)} className="border border-transparent bg-brand-red-600 text-white hover:bg-brand-red-700">
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <PaginationControls currentPage={productPage} totalPages={totalProductPages} onPageChange={setProductPage} label="Products" />
          </div>

          <div className="rounded-3xl border border-brand-grey-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">{isEditing ? "Edit product" : "Add new product"}</h2>
              {isEditing && (
                <button onClick={resetForm} className="text-sm uppercase tracking-widest text-brand-500 hover:text-brand-900">
                  Cancel
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* ... all existing form fields unchanged ... */}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm text-brand-700">
                  Product ID
                  <input
                    value={formState.id}
                    onChange={(event) => setFormState((prev) => ({ ...prev, id: event.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-brand-grey-200 bg-brand-grey-50 px-4 py-3 text-sm text-brand-900 outline-none focus:border-brand-900"
                    placeholder="os-10"
                  />
                </label>
                <label className="block text-sm text-brand-700">
                  Name
                  <input
                    value={formState.name}
                    onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-brand-grey-200 bg-brand-grey-50 px-4 py-3 text-sm text-brand-900 outline-none focus:border-brand-900"
                    placeholder="Classic Crew Tee"
                  />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm text-brand-700">
                  Price
                  <input
                    type="number"
                    value={formState.price}
                    min={0}
                    onChange={(event) => setFormState((prev) => ({ ...prev, price: Number(event.target.value) }))}
                    className="mt-2 w-full rounded-2xl border border-brand-grey-200 bg-brand-grey-50 px-4 py-3 text-sm text-brand-900 outline-none focus:border-brand-900"
                    placeholder="79"
                  />
                </label>
                <label className="block text-sm text-brand-700">
                  Category
                  <select
                    value={formState.category}
                    onChange={(event) => {
                      const newCategory = event.target.value as Product["category"];
                      setFormState((prev) => ({
                        ...prev,
                        category: newCategory,
                        sizes: (newCategory === "accessories" || newCategory === "others") ? ["Free Size"] : prev.sizes,
                        sizesInput: (newCategory === "accessories" || newCategory === "others") ? "Free Size" : prev.sizesInput,
                      }));
                    }}
                    className="mt-2 w-full rounded-2xl border border-brand-grey-200 bg-brand-grey-50 px-4 py-3 text-sm text-brand-900 outline-none focus:border-brand-900"
                  >
                    {categories.map((category) => (
                      <option key={category.slug} value={category.slug}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="block text-sm text-brand-700">
                Colors (comma separated)
                <input
                  value={formState.colorsInput || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      handleColorInputChange(value);

                      setFormState((prev) => ({
                        ...prev,
                        colorsInput: value,
                      }));
                    }}
                  className="mt-2 w-full rounded-2xl border border-brand-grey-200 bg-brand-grey-50 px-4 py-3 text-sm text-brand-900 outline-none focus:border-brand-900"
                  placeholder={
                    formState.category === "accessories" || formState.category === "others"
                      ? "Black, White, Silver, Gold"
                      : "Black, White, Grey, Beige"
                  }
                />
              </label>
              <label className="block text-sm text-brand-700">
                Sizes (comma separated)
                <input
                  value={formState.category === "accessories" || formState.category === "others" ? "Free Size" : (formState.sizesInput || "")}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      sizesInput: e.target.value,
                      sizes: normalizeList(e.target.value),
                    }))
                  }
                  disabled={formState.category === "accessories" || formState.category === "others"}
                  className={`mt-2 w-full rounded-2xl border border-brand-grey-200 px-4 py-3 text-sm text-brand-900 outline-none focus:border-brand-900 ${
                    formState.category === "accessories" || formState.category === "others"
                      ? "bg-brand-grey-100 cursor-not-allowed"
                      : "bg-brand-grey-50"
                  }`}
                  placeholder={formState.category === "accessories" || formState.category === "others" ? "Free Size" : "S, M, L, XL"}
                />
              </label>
              <fieldset className="rounded-3xl border border-brand-grey-200 bg-brand-grey-50 p-4">
                <legend className="text-sm font-semibold uppercase tracking-widest text-brand-700">
                  Global images
                </legend>
                <div className="space-y-3 pt-3">
                  <label className="block text-sm text-brand-700">
                    URLs (comma separated)
                    <input
                      value={formState.imagesInput || ""}
                      onChange={(e) =>
                        setFormState((prev) => ({
                          ...prev,
                          imagesInput: e.target.value,
                          images: normalizeList(e.target.value),
                        }))
                      }
                      className="mt-2 w-full rounded-2xl border border-brand-grey-200 bg-white px-4 py-3 text-sm text-brand-900 outline-none focus:border-brand-900"
                      placeholder="/products/os-black-1.jpg, /products/os-black-2.jpg"
                    />
                  </label>
                  <label className="block text-sm text-brand-700">
                    Upload local images to Firebase Storage
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(event) => handleUpload(null, event)}
                      className="mt-2 w-full cursor-pointer rounded-2xl border border-brand-grey-200 bg-white px-4 py-3 text-sm text-brand-900"
                    />
                  </label>
                </div>
              </fieldset>
              {formState.colors.length > 0 && (
                <div className="rounded-3xl border border-brand-grey-200 bg-brand-grey-50 p-4">
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-brand-700">
                    Color variant image URLs
                  </h3>
                  <p className="mb-4 text-sm text-brand-500">
                    Upload or paste URLs for each color variant. Each variant can have multiple images.
                  </p>
                  <div className="space-y-4">
                    {formState.colors.map((color) => (
                      <div
                        key={color}
                        className="space-y-3 rounded-2xl border border-brand-grey-100 bg-white p-4"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium uppercase tracking-widest text-brand-700">
                            {color}
                          </p>
                          <label className="cursor-pointer rounded-xl border border-brand-grey-200 px-3 py-1 text-sm hover:bg-brand-grey-100">
                            Upload
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={(e) => handleUpload(color, e)}
                              className="hidden"
                            />
                          </label>
                        </div>
                        <div>
                          <label className="block text-xs text-brand-600 mb-1">
                            Paste image URLs
                          </label>
                          <textarea
                            className="w-full min-h-[90px] rounded-lg border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                            placeholder="Enter image URLs (comma or new line separated)"
                            value={formState.imagesByColorInput?.[color] || ""}
                            onChange={(e) =>
                              handleImagesChange(color, e.target.value)
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <label className="block text-sm text-brand-700">
                Description
                <textarea
                  value={formState.description}
                  onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
                  className="mt-2 h-28 w-full rounded-3xl border border-brand-grey-200 bg-brand-grey-50 px-4 py-3 text-sm text-brand-900 outline-none focus:border-brand-900"
                  placeholder="A short description of the product."
                />
              </label>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button type="submit" className="w-full sm:w-auto">
                  {isEditing ? "Save changes" : "Add product"}
                </Button>
                <p className="text-sm text-brand-500">Upload at least two images total and color-specific images for each variant.</p>
              </div>
              {message && <p className="text-sm text-brand-700">{message}</p>}
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-brand-grey-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">Preview</h2>
            {selectedProduct ? (
              <div className="space-y-4 rounded-3xl border border-brand-grey-100 bg-brand-grey-50 p-4">
                <p className="text-sm uppercase tracking-widest text-brand-500">Editing:</p>
                <p className="text-lg font-semibold">{selectedProduct.name}</p>
                <p className="text-sm text-brand-500">{selectedProduct.description}</p>
                <div className="space-y-3">
                  {selectedProduct.imagesByColor
                    ? Object.entries(selectedProduct.imagesByColor).map(([key, urls]) => (
                        <div key={key}>
                          <p className="text-sm font-medium text-brand-700">{key}</p>
                          {urls.map((image, index) => (
                            <p key={`${key}-${index}`} className="text-sm text-brand-500">
                              {image}
                            </p>
                          ))}
                        </div>
                      ))
                    : selectedProduct.images.map((image, index) => (
                        <p key={index} className="text-sm text-brand-500">
                          {image}
                        </p>
                      ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-brand-500">Select a product to preview it here.</p>
            )}
          </div>
          <div className="rounded-3xl border border-brand-grey-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">How it works</h2>
            <ul className="space-y-3 text-sm text-brand-500">
              <li>• Add or edit product details and save them directly to Firebase Firestore.</li>
              <li>• Use comma-separated values for global images, sizes, and colors.</li>
              <li>• Upload local files to Firebase Storage and keep the resulting URLs in your product data.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mt-12 space-y-6">
        <AnimatedSection>
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-light uppercase tracking-[0.3em] text-brand-900">Order & User Dashboard</h2>
              <p className="mt-2 text-sm text-brand-500">
                Review all customer orders, update order status, manage returns, and handle user data.
              </p>
            </div>
            <div className="rounded-2xl bg-brand-grey-100 px-5 py-4 text-sm text-brand-600">
              Orders and users are updated directly in Firestore.
            </div>
          </div>
        </AnimatedSection>

        <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
          {/* Recent Orders */}
          <div className="rounded-3xl border border-brand-grey-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold">Recent Orders (Last 24 Hours)</h3>
              <p className="text-sm text-brand-500">{recentOrders.length} orders</p>
            </div>

            {recentOrders.length === 0 ? (
              <p className="text-sm text-brand-500">No orders in the last 24 hours.</p>
            ) : (
              <>
                <div className="space-y-4">
                  {paginatedRecentOrders.map((order) => {
                    const user = usersById[order.userId];
                    return (
                      <div key={order.id} className="rounded-3xl border border-brand-grey-100 bg-brand-grey-50 p-4">
                        {/* ... order content unchanged ... */}
                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold uppercase tracking-widest text-brand-700">Order #{order.id.slice(-8).toUpperCase()}</p>
                            <p className="text-sm text-brand-500">
                              {user ? user.fullName : "Unknown user"} • {order.phone}
                            </p>
                            <p className="text-sm text-brand-500">
                              {order.createdAt instanceof Date ? order.createdAt.toLocaleString() : new Date(order.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="space-y-2 text-right">
                            <p className="text-sm text-brand-700">₹{order.total.toFixed(2)}</p>
                            <p className="text-xs text-brand-500">{order.items.length} item{order.items.length !== 1 ? "s" : ""}</p>
                          </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <label className="block text-sm text-brand-700">
                            Order status
                            <select
                              value={order.status}
                              onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as Order["status"])}
                              className="mt-2 w-full rounded-2xl border border-brand-grey-200 bg-white px-4 py-3 text-sm text-brand-900 outline-none focus:border-brand-900"
                            >
                              <option value="pending">Pending</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </label>
                          <label className="block text-sm text-brand-700">
                            Return status
                            <select
                              value={order.returnStatus ?? "none"}
                              onChange={(e) => handleUpdateReturnStatus(order.id, e.target.value as Order["returnStatus"])}
                              className="mt-2 w-full rounded-2xl border border-brand-grey-200 bg-white px-4 py-3 text-sm text-brand-900 outline-none focus:border-brand-900"
                            >
                              <option value="none">None</option>
                              <option value="requested">Requested</option>
                              <option value="approved">Approved</option>
                              <option value="rejected">Rejected</option>
                              <option value="returned">Returned</option>
                            </select>
                          </label>
                        </div>
                        {order.returnReason && (
                          <div className="mt-4 rounded-2xl bg-brand-grey-100 p-3 text-sm text-brand-600">
                            <p className="font-medium">Return reason</p>
                            <p>{order.returnReason}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <PaginationControls currentPage={recentOrderPage} totalPages={totalRecentOrderPages} onPageChange={setRecentOrderPage} label="Recent Orders" />
              </>
            )}
          </div>

          {/* All Orders */}
          <div className="rounded-3xl border border-brand-grey-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold">All Orders</h3>
              <p className="text-sm text-brand-500">{ordersLoading ? "Loading..." : `${orders.length} orders`}</p>
            </div>

            {adminMessage && (
              <div className="mb-4 rounded-2xl bg-brand-beige p-3 text-sm text-brand-700">
                {adminMessage}
              </div>
            )}

            {ordersLoading ? (
              <p className="text-sm text-brand-500">Loading orders…</p>
            ) : orders.length === 0 ? (
              <p className="text-sm text-brand-500">No orders available.</p>
            ) : (
              <>
                <div className="space-y-4">
                  {paginatedAllOrders.map((order) => {
                    const user = usersById[order.userId];
                    return (
                      <div key={order.id} className="rounded-3xl border border-brand-grey-100 bg-brand-grey-50 p-4">
                        {/* ... order content unchanged ... */}
                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold uppercase tracking-widest text-brand-700">Order #{order.id.slice(-8).toUpperCase()}</p>
                            <p className="text-sm text-brand-500">
                              {user ? user.fullName : "Unknown user"} • {order.phone}
                            </p>
                            <p className="text-sm text-brand-500">
                              {order.createdAt instanceof Date ? order.createdAt.toLocaleDateString() : new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="space-y-2 text-right">
                            <p className="text-sm text-brand-700">₹{order.total.toFixed(2)}</p>
                            <p className="text-xs text-brand-500">{order.items.length} item{order.items.length !== 1 ? "s" : ""}</p>
                          </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <label className="block text-sm text-brand-700">
                            Order status
                            <select
                              value={order.status}
                              onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as Order["status"])}
                              className="mt-2 w-full rounded-2xl border border-brand-grey-200 bg-white px-4 py-3 text-sm text-brand-900 outline-none focus:border-brand-900"
                            >
                              <option value="pending">Pending</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </label>
                          <label className="block text-sm text-brand-700">
                            Return status
                            <select
                              value={order.returnStatus ?? "none"}
                              onChange={(e) => handleUpdateReturnStatus(order.id, e.target.value as Order["returnStatus"])}
                              className="mt-2 w-full rounded-2xl border border-brand-grey-200 bg-white px-4 py-3 text-sm text-brand-900 outline-none focus:border-brand-900"
                            >
                              <option value="none">None</option>
                              <option value="requested">Requested</option>
                              <option value="approved">Approved</option>
                              <option value="rejected">Rejected</option>
                              <option value="returned">Returned</option>
                            </select>
                          </label>
                        </div>
                        {order.returnReason && (
                          <div className="mt-4 rounded-2xl bg-brand-grey-100 p-3 text-sm text-brand-600">
                            <p className="font-medium">Return reason</p>
                            <p>{order.returnReason}</p>
                          </div>
                        )}
                        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-between">
                          <Button
                            type="button"
                            onClick={() => handleDeleteOrder(order.id)}
                            className="w-full border border-transparent bg-brand-red-600 text-white hover:bg-brand-red-700 sm:w-auto"
                          >
                            Delete order
                          </Button>
                          <div className="rounded-3xl bg-white border border-brand-grey-200 p-3 text-sm text-brand-500">
                            User: {user?.fullName ?? "Unknown"} • Role: {user?.role ?? "user"}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <PaginationControls currentPage={allOrderPage} totalPages={totalAllOrderPages} onPageChange={setAllOrderPage} label="All Orders" />
              </>
            )}
          </div>
        </div>

        {/* Users Section (single, paginated with 5 per page) */}
        <div className="rounded-3xl border border-brand-grey-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold">Users</h3>
            <p className="text-sm text-brand-500">{usersLoading ? "Loading..." : `${filteredUsers.length} users`}</p>
          </div>

          <div className="mb-4">
            <input
              type="text"
              placeholder="Search users by name, phone, or UID..."
              value={userSearchTerm}
              onChange={(e) => setUserSearchTerm(e.target.value)}
              className="w-full rounded-2xl border border-brand-grey-200 bg-brand-grey-50 px-4 py-3 text-sm text-brand-900 outline-none focus:border-brand-900"
            />
          </div>

          {usersLoading ? (
            <p className="text-sm text-brand-500">Loading users…</p>
          ) : filteredUsers.length === 0 ? (
            <p className="text-sm text-brand-500">No users found.</p>
          ) : (
            <>
              <div className="space-y-4">
                {paginatedUsers.map((user) => (
                  <div key={user.uid} className="rounded-3xl border border-brand-grey-100 bg-brand-grey-50 p-4 cursor-pointer hover:bg-brand-grey-100 transition-colors" onClick={() => {
                    setSelectedUser(user);
                    setUserDetailsOpen(true);
                  }}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-widest text-brand-700">{user.fullName || "No name"}</p>
                        <p className="text-sm text-brand-500">{user.phone}</p>
                        <p className="text-sm text-brand-500">Orders: {orderCountsByUser[user.uid] || 0}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-brand-500">Role: {user.role ?? "user"}</p>
                        <p className="text-xs text-brand-400">Click to view details</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <PaginationControls currentPage={currentUserPage} totalPages={totalUserPages} onPageChange={setCurrentUserPage} label="Users" />
            </>
          )}
        </div>
      </section>

      {/* User Details Modal unchanged */}
      {userDetailsOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-brand-grey-100 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-semibold">User Details</h3>
              <button
                onClick={() => setUserDetailsOpen(false)}
                className="text-brand-500 hover:text-brand-900"
              >
                ✕
              </button>
            </div>
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm text-brand-700">
                  Full Name
                  <input
                    type="text"
                    value={selectedUser.fullName || ""}
                    onChange={(e) => setSelectedUser(prev => prev ? { ...prev, fullName: e.target.value } : null)}
                    className="mt-2 w-full rounded-2xl border border-brand-grey-200 bg-brand-grey-50 px-4 py-3 text-sm text-brand-900 outline-none focus:border-brand-900"
                  />
                </label>
                <label className="block text-sm text-brand-700">
                  Phone
                  <input
                    type="text"
                    value={selectedUser.phone || ""}
                    onChange={(e) => setSelectedUser(prev => prev ? { ...prev, phone: e.target.value } : null)}
                    className="mt-2 w-full rounded-2xl border border-brand-grey-200 bg-brand-grey-50 px-4 py-3 text-sm text-brand-900 outline-none focus:border-brand-900"
                  />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm text-brand-700">
                  Email
                  <input
                    type="email"
                    value={selectedUser.email || ""}
                    onChange={(e) => setSelectedUser(prev => prev ? { ...prev, email: e.target.value } : null)}
                    className="mt-2 w-full rounded-2xl border border-brand-grey-200 bg-brand-grey-50 px-4 py-3 text-sm text-brand-900 outline-none focus:border-brand-900"
                  />
                </label>
                <label className="block text-sm text-brand-700">
                  Role
                  <select
                    value={selectedUser.role ?? "user"}
                    onChange={(e) => setSelectedUser(prev => prev ? { ...prev, role: e.target.value as UserProfile["role"] } : null)}
                    className="mt-2 w-full rounded-2xl border border-brand-grey-200 bg-white px-4 py-3 text-sm text-brand-900 outline-none focus:border-brand-900"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>
              </div>
              <div className="rounded-3xl border border-brand-grey-100 bg-brand-grey-50 p-4">
                <h4 className="mb-3 font-semibold text-brand-700">User Statistics</h4>
                <div className="grid gap-2 text-sm text-brand-500">
                  <p>UID: {selectedUser.uid}</p>
                  <p>Total Orders: {orderCountsByUser[selectedUser.uid] || 0}</p>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                <Button
                  type="button"
                  onClick={() => handleUpdateUserDetails(selectedUser.uid, {
                    fullName: selectedUser.fullName,
                    phone: selectedUser.phone,
                    email: selectedUser.email,
                    role: selectedUser.role
                  })}
                  className="w-full sm:w-auto"
                >
                  Save Changes
                </Button>
                <Button
                  type="button"
                  onClick={() => handleDeleteUser(selectedUser.uid)}
                  className="w-full border border-transparent bg-brand-red-600 text-white hover:bg-brand-red-700 sm:w-auto"
                >
                  Delete User & Orders
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}