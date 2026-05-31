import { Activity, Building2, CalendarCheck, MessagesSquare } from "lucide-react";

export default function LeftPanel() {
  return (
    <div className="relative hidden md:flex w-1/2 bg-[linear-gradient(150deg,#1E3A8A_0%,#2563EB_100%)] text-white p-12 flex-col justify-between overflow-hidden">
      {/* Decorative background shapes */}
      <div className="size-72 rounded-full bg-white/10 absolute -right-24 -top-24 pointer-events-none" />
      <div className="size-56 rounded-full bg-white/5 absolute -left-16 bottom-12 pointer-events-none" />
      
      {/* Logo */}
      <div className="relative flex items-center gap-2">
        <div className="size-9 rounded-xl bg-white/15 flex justify-center items-center">
          <Building2 className="size-5 text-white" />
        </div>
        <span className="font-bold text-white text-xl leading-7 tracking-tight">
          Rentora
        </span>
      </div>

      {/* Core pitch */}
      <div className="relative flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <h1 className="font-bold text-white text-4xl leading-tight tracking-tight">
            Simplify Your Rental Experience
          </h1>
          <p className="max-w-md leading-relaxed text-white/80 text-base leading-6">
            Stay on top of real-time maintenance tracking and seamless
            amenity booking — all in one transparent platform built for
            tenants and owners.
          </p>
        </div>

        {/* Feature items */}
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <div className="size-11 rounded-xl bg-white/15 flex justify-center items-center shrink-0">
              <Activity className="size-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-white text-sm leading-5">
                Real-Time Tracking
              </span>
              <span className="text-white/70 text-xs leading-4">
                Monitor maintenance requests as they progress.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="size-11 rounded-xl bg-white/15 flex justify-center items-center shrink-0">
              <CalendarCheck className="size-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-white text-sm leading-5">
                Amenity Booking
              </span>
              <span className="text-white/70 text-xs leading-4">
                Reserve shared spaces without conflicts.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="size-11 rounded-xl bg-white/15 flex justify-center items-center shrink-0">
              <MessagesSquare className="size-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-white text-sm leading-5">
                Transparent Communication
              </span>
              <span className="text-white/70 text-xs leading-4">
                Keep tenants and owners always in sync.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer copyright */}
      <div className="relative text-white/60 text-xs leading-4">
      </div>
    </div>
  );
}
