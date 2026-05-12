
type Props = {
  selectedCategory: string;
  setSelectedCategory: (v: string) => void;
  selectedSize: string;
  setSelectedSize: (v: string) => void;
  selectedColor: string;
  setSelectedColor: (v: string) => void;
  priceRange: [number, number];
  setPriceRange: (v: [number, number]) => void;
  allSizes: string[];
  allColors: string[];
};

export default function FilterContent({
  selectedCategory,
  setSelectedCategory,
  selectedSize,
  setSelectedSize,
  selectedColor,
  setSelectedColor,
  priceRange,
  setPriceRange,
  allSizes,
  allColors,
}: Props) {
  return (
    <div className="space-y-8 text-sm uppercase tracking-wider">

      {/* CATEGORY */}
      <div>
        <p className="mb-3 text-xs text-brand-grey-500">Category</p>
        <div className="flex flex-col gap-2">
          {["all", "men", "women", "accessories", "others"].map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`text-left transition ${
                selectedCategory === c
                  ? "text-black font-medium"
                  : "text-brand-grey-500 hover:text-black"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* SIZE - Only show for clothing categories */}
      {(selectedCategory === "all" || selectedCategory === "men" || selectedCategory === "women") && (
        <div>
          <p className="mb-3 text-xs text-brand-grey-500">Size</p>
          <div className="flex flex-wrap gap-2">
            {allSizes.map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSize(s)}
                className={`rounded-full border px-3 py-1 ${
                  selectedSize === s
                    ? "bg-black text-white"
                    : "border-brand-grey-300"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* COLOR */}
      <div>
        <p className="mb-3 text-xs text-brand-grey-500">Color</p>
        <div className="flex flex-wrap gap-2">
          {allColors.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedColor(c)}
              className={`rounded-full border px-3 py-1 ${
                selectedColor === c
                  ? "bg-black text-white"
                  : "border-brand-grey-300"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* PRICE */}
      <div>
        <p className="mb-3 text-xs text-brand-grey-500">Price</p>
        <input
          type="range"
          min="0"
          max="2000"
          value={priceRange[1]}
          onChange={(e) => setPriceRange([0, Number(e.target.value)])}
          className="w-full"
        />
        <p className="mt-2 text-xs text-brand-grey-600">
          Up to ₹{priceRange[1]}
        </p>
      </div>
      <button
  onClick={() => {
    setSelectedCategory("all");
    setSelectedSize("all");
    setSelectedColor("all");
    setPriceRange([0, 2000]);
  }}
  className="mb-6 w-full rounded-full border border-brand-grey-300 px-4 py-2 text-xs uppercase tracking-wider hover:bg-black hover:text-white transition"
>
  Clear Filters
</button>
    </div>
  );
}