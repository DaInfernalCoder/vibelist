import Image from "next/image";
// import TestimonialsAvatars from "./TestimonialsAvatars";
import config from "@/config";

const Hero = () => {
  return (
    <section className="max-w-7xl mx-auto bg-base-100 flex flex-col lg:flex-row items-center justify-center gap-16 lg:gap-20 px-8 py-8 lg:py-20 overflow-hidden">
      <div className="flex flex-col gap-10 lg:gap-14 items-center justify-center text-center lg:text-left lg:items-start">
        <h1 className="font-extrabold text-4xl lg:text-6xl tracking-tight md:-mb-4">
          Create beautiful waitlists to validate ideas{" "}
          <span className="relative">
            in{" "}
            <span className="text-purple-600 relative">
              minutes
              <svg
                className="absolute -bottom-2 left-0 w-full h-3 text-purple-400"
                viewBox="0 0 100 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2 8c20-4 40-6 60-2s36 8 36 8"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                  className="animate-pulse"
                />
              </svg>
            </span>
          </span>
        </h1>
        <p className="text-lg opacity-80 leading-relaxed">
          The no-code platform to create beautiful waitlists to validate vibe
          coded ideas, without wasting another second. Stop wasting time on
          building ideas that don&apos;t convert.
        </p>
        <a
          href="/dashboard/create"
          className="btn btn-wide text-white border-0"
          style={{ backgroundColor: "#9334E8" }}
        >
          Get Started
        </a>

        {/* <TestimonialsAvatars priority={true} /> */}
      </div>

      {/* Creative Multi-Image Hero Design */}
      <div className="lg:w-full relative overflow-hidden">
        <div className="relative w-full h-[500px] lg:h-[600px]">
          {/* Background Image - Main Screenshot */}
          <div className="absolute inset-0 transform rotate-2 hover:rotate-1 transition-transform duration-500 ease-out">
            <div className="relative w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl shadow-2xl overflow-hidden">
              <Image
                src="/demos/Screenshot May 28 2025.png"
                alt="Main Product Dashboard"
                fill
                className="object-cover"
                priority={true}
              />
            </div>
          </div>

          {/* Floating Card 1 - Interactive Demo */}
          <div className="absolute top-8 left-0 lg:-left-8 w-64 lg:w-80 transform -rotate-6 hover:-rotate-3 transition-all duration-500 ease-out hover:scale-105 z-10">
            <div className="relative bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
              <Image
                src="/demos/Interactive Product Demo Screenshot.png"
                alt="Interactive Product Demo"
                width={320}
                height={200}
                className="w-full h-auto object-cover"
              />
            </div>
          </div>

          {/* Floating Card 2 - Second Screenshot */}
          <div className="absolute bottom-8 right-0 lg:-right-8 w-56 lg:w-72 transform rotate-6 hover:rotate-3 transition-all duration-500 ease-out hover:scale-105 z-10">
            <div className="relative bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
              <Image
                src="/demos/Screenshot May 28 2025 (1).png"
                alt="Product Features"
                width={288}
                height={180}
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/30 to-transparent"></div>
            </div>
          </div>

          {/* Gradient Overlay for Depth */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-base-100/10 pointer-events-none"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
