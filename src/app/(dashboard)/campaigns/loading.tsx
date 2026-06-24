export default function CampaignsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-44 w-full bg-stone-100 rounded-3xl"></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-32 w-full bg-stone-100 rounded-2xl"></div>
        ))}
      </div>
      <div className="h-28 w-full bg-stone-100 rounded-2xl"></div>
      <div className="h-96 w-full bg-stone-100 rounded-2xl"></div>
    </div>
  );
}
