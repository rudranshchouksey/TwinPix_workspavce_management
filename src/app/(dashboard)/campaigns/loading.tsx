export default function CampaignsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-stone-100 rounded-md"></div>
        <div className="h-10 w-32 bg-stone-100 rounded-md"></div>
      </div>
      <div className="h-12 w-full bg-stone-100 rounded-lg"></div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 w-full bg-stone-100 rounded-xl"></div>
        ))}
      </div>
      <div className="h-96 w-full bg-stone-100 rounded-2xl"></div>
    </div>
  );
}
