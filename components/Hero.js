import Image from "next/image";
import TestimonialsAvatars from "./TestimonialsAvatars";
import config from "@/config";

const Hero = () => {
  return (
    <section className="max-w-7xl mx-auto bg-base-100 flex flex-col lg:flex-row items-center justify-center gap-16 lg:gap-20 px-8 py-8 lg:py-20">
      <div className="flex flex-col gap-10 lg:gap-14 items-center justify-center text-center lg:text-left lg:items-start">
        {/* <a
          href="https://www.producthunt.com/posts/shipfast-2?utm_source=badge-top-post-badge&utm_medium=badge&utm_souce=badge-shipfast&#0045;2"
          target="_blank"
          className=" -mb-4 md:-mb-6 group"
          title="Product Hunt link"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 122 37"
            className="w-32 md:w-36 fill-base-content/80 group-hover:fill-base-content"
          >
            <path d="M104.953 36.286c-4.22 1.634-5.936.086-5.936-.891 1.495-.126 5.067-.331 5.936.891Zm5.356-1.336a5.486 5.486 0 0 1-7.083-.497c1.44-.4 5.372-.874 7.083.497Zm-7.139-3.176c.16 2.033-1.922 3.176-4.17 3.341.41-2.045 2.509-2.958 4.17-3.341Zm4.032-1.874c.238.869-.089 3.228-3.323 4.164.139-1.593.986-3.667 3.323-4.164Zm6.413 2.365a5.005 5.005 0 0 1-6.385.571c1.296-.668 4.408-1.57 6.385-.571Zm-3.417-4.706c.443.856.537 3.295-2.326 4.763-.166-1.57.465-4.255 2.326-4.763Zm7.083.948a4.389 4.389 0 0 1-2.657 2.217 4.243 4.243 0 0 1-3.39-.44c1.805-1.697 4.685-2.348 6.047-1.777Zm-4.28-4.547c1.2...(line too long; chars omitted)
          </svg>
        </a> */}

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
        <a href="/dashboard/create" className="btn btn-primary btn-wide">
          Create your first waitlist
        </a>

        <TestimonialsAvatars priority={true} />
      </div>

      {/* Creative Multi-Image Hero Design */}
      <div className="lg:w-full relative">
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
          <div className="absolute top-8 -left-4 lg:-left-8 w-64 lg:w-80 transform -rotate-6 hover:-rotate-3 transition-all duration-500 ease-out hover:scale-105 z-10">
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
          <div className="absolute bottom-8 -right-4 lg:-right-8 w-56 lg:w-72 transform rotate-6 hover:rotate-3 transition-all duration-500 ease-out hover:scale-105 z-10">
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

          {/* Decorative Elements */}
          <div className="absolute top-1/4 right-1/4 w-4 h-4 bg-primary rounded-full animate-pulse opacity-60"></div>
          <div className="absolute bottom-1/3 left-1/4 w-3 h-3 bg-secondary rounded-full animate-pulse opacity-40 animation-delay-1000"></div>
          <div className="absolute top-1/2 right-1/3 w-2 h-2 bg-accent rounded-full animate-pulse opacity-50 animation-delay-2000"></div>

          {/* Gradient Overlay for Depth */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-base-100/10 pointer-events-none"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
