import Image from "next/image";
import config from "@/config";

const CTA = () => {
  return (
    <section className="relative hero overflow-hidden min-h-screen">
      <Image
        src="/White Cat on MacBook Pro.jpg"
        alt="White cat on MacBook Pro"
        className="object-cover w-full"
        fill
      />
      <div className="relative hero-overlay bg-neutral bg-opacity-70"></div>
      <div className="relative hero-content text-center text-neutral-content p-8">
        <div className="flex flex-col items-center max-w-xl p-8 md:p-0">
          <h2 className="font-bold text-3xl md:text-5xl tracking-tight mb-8 md:mb-12">
            Boost your app, launch, earn
          </h2>
          <p className="text-lg opacity-80 mb-12 md:mb-16">
            Don&apos;t waste time building a product that no one wants. Create a
            waitlist in minutes and validate your idea in minutes. <br /> <br />
            Or you&apos;ll make kitty sad.
          </p>

          <a
            href="/dashboard/create"
            className="btn btn-wide text-white border-0"
            style={{ backgroundColor: "#9334E8" }}
            target="_blank"
          >
            Get Started
          </a>
        </div>
      </div>
    </section>
  );
};

export default CTA;
