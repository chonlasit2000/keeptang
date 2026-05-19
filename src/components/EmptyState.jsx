export default function EmptyState({ title = 'ยังไม่มีข้อมูล', description = 'เพิ่มรายการแรกเพื่อเริ่มใช้งาน keeptang' }) {
  return (
    <div className="rounded-[1rem] border border-dashed border-[#E8D6C8] bg-white/70 px-5 py-8 text-center">
      <p className="text-base font-bold text-ink">{title}</p>
      <p className="mt-1 text-sm text-muted">{description}</p>
    </div>
  );
}
