interface ProofItem {
  value: string;
  label: string;
  detail: string;
}

export default function ProofStrip({ items }: { items: ProofItem[] }) {
  return (
    <section className="proof-strip" aria-label="검증된 구축 근거">
      <p className="product-kicker">VERIFIED BUILD EVIDENCE</p>
      <div className="proof-grid">
        {items.map((item) => (
          <article key={item.label}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
            <small>{item.detail}</small>
          </article>
        ))}
      </div>
    </section>
  );
}
