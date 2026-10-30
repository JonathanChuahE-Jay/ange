"use client";

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton rounded-xl ${className}`} aria-hidden />;
}

export function SkeletonSection() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-14">
      <Skeleton className="h-9 w-56" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    </div>
  );
}
