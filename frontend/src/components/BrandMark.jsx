export default function BrandMark({ size = 36 }) {
  return (
    <div className="brand-mark">
      <img src="/logo.jpg" alt="Toko Stok" className="brand-mark__logo" style={{ width: size, height: size }} />
      <span className="brand-mark__name">Toko Stok</span>
    </div>
  );
}
