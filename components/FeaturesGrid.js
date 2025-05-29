/* eslint-disable @next/next/no-img-element */
import React from "react";

const features = [
  {
    title: "Powerful Analytics Dashboard",
    description:
      "Track signups, monitor growth, and analyze referral sources with real-time analytics.",
    styles: "bg-primary text-primary-content",
    demo: (
      <div className="overflow-hidden h-full flex items-stretch">
        <div className="w-full translate-x-6 bg-base-200 rounded-t-box h-full p-4">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-base-content">Analytics</h3>
              <div className="flex items-center gap-2 text-sm text-base-content/60">
                <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span>Live</span>
              </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-base-100 rounded-lg p-3 border">
                <div className="text-2xl font-bold text-primary group-hover:text-3xl transition-all duration-500">
                  1,247
                </div>
                <div className="text-xs text-base-content/60">
                  Total Signups
                </div>
              </div>
              <div className="bg-base-100 rounded-lg p-3 border">
                <div className="text-2xl font-bold text-green-600 group-hover:text-3xl transition-all duration-500">
                  +89
                </div>
                <div className="text-xs text-base-content/60">This Week</div>
              </div>
            </div>

            {/* Chart */}
            <div className="bg-base-100 rounded-lg p-3 border h-20">
              <div className="flex items-end justify-between h-full gap-1">
                {[12, 19, 15, 27, 23, 31, 28].map((height, i) => (
                  <div
                    key={i}
                    className="bg-primary rounded-t transition-all duration-500 group-hover:bg-primary-focus"
                    style={{
                      height: `${height}%`,
                      animationDelay: `${i * 100}ms`,
                    }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Visual Waitlist Editor",
    description:
      "Design beautiful waitlist pages with our intuitive drag-and-drop editor and live preview.",
    styles: "md:col-span-2 bg-base-300 text-base-content",
    demo: (
      <div className="px-6 flex gap-6 overflow-hidden">
        {/* Editor Panel */}
        <div className="w-1/2 space-y-3">
          <div className="bg-base-100 rounded-lg p-4 border">
            <h4 className="font-semibold mb-3 text-sm">Setup</h4>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-base-content/60">
                  Waitlist Name
                </label>
                <div className="bg-base-200 rounded px-2 py-1 text-sm relative overflow-hidden">
                  <div className="group-hover:transform group-hover:-translate-y-full transition-transform duration-500">
                    My Awesome Product
                  </div>
                  <div className="absolute top-1 left-2 transform translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                    Product Launch 2024
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs text-base-content/60">
                  Description
                </label>
                <div className="bg-base-200 rounded px-2 py-1 text-sm h-8 relative overflow-hidden">
                  <div className="absolute top-1 left-2 transform translate-y-full group-hover:translate-y-0 transition-transform duration-700">
                    Get early access to our platform
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-base-100 rounded-lg p-4 border">
            <h4 className="font-semibold mb-3 text-sm">Design</h4>
            <div className="flex gap-2">
              <div className="w-6 h-6 bg-primary rounded border-2 border-primary"></div>
              <div className="w-6 h-6 bg-secondary rounded border-2 border-transparent group-hover:border-secondary transition-colors duration-300"></div>
              <div className="w-6 h-6 bg-accent rounded border-2 border-transparent"></div>
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="w-1/2">
          <div className="bg-base-100 rounded-lg p-4 border h-full">
            <div className="text-center space-y-3">
              <div className="relative h-7 overflow-hidden">
                <h3 className="font-bold text-lg absolute w-full group-hover:transform group-hover:-translate-y-full transition-transform duration-500">
                  My Awesome Product
                </h3>
                <h3 className="font-bold text-lg text-primary absolute w-full transform translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                  Product Launch 2024
                </h3>
              </div>
              <div className="relative h-5 overflow-hidden">
                <p className="text-sm text-base-content/60 absolute w-full transform translate-y-full group-hover:translate-y-0 transition-transform duration-700">
                  Get early access to our platform
                </p>
              </div>
              <div className="space-y-2 pt-2">
                <input
                  className="input input-sm w-full"
                  placeholder="your@email.com"
                  readOnly
                />
                <button className="btn btn-primary btn-sm w-full group-hover:btn-secondary transition-colors duration-500">
                  Join Waitlist
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Beautiful Public Pages",
    description:
      "Your users see stunning, mobile-optimized waitlist pages that convert.",
    styles: "md:col-span-2 bg-accent text-accent-content",
    demo: (
      <div className="flex justify-center items-center h-full overflow-hidden">
        <div className="relative">
          {/* Mobile Frame */}
          <div className="w-64 h-80 bg-gray-800 rounded-3xl p-2 group-hover:scale-105 transition-transform duration-500">
            <div className="w-full h-full bg-white rounded-2xl overflow-hidden relative">
              {/* Status Bar */}
              <div className="h-6 bg-gray-900 flex items-center justify-center">
                <div className="w-16 h-1 bg-gray-600 rounded-full"></div>
              </div>

              {/* Waitlist Content */}
              <div className="p-6 text-center space-y-4">
                <div className="w-12 h-12 bg-primary rounded-full mx-auto flex items-center justify-center">
                  <span className="text-white font-bold">🚀</span>
                </div>

                <div>
                  <h3 className="font-bold text-lg text-gray-900">
                    Product Launch
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Be the first to know when we launch
                  </p>
                </div>

                <div className="space-y-3">
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="your@email.com"
                    readOnly
                  />
                  <button className="w-full bg-primary text-white py-2 rounded-lg text-sm font-medium group-hover:bg-primary-focus transition-colors duration-300">
                    Join Waitlist
                  </button>
                </div>

                {/* Social Proof */}
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                  <div className="flex -space-x-1">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="w-5 h-5 rounded-full bg-gray-300 border border-white"
                      ></div>
                    ))}
                  </div>
                  <span>Join 1,247 others</span>
                </div>
              </div>
            </div>
          </div>

          {/* Success State Overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-1000 delay-500">
            <div className="w-64 h-80 bg-gray-800 rounded-3xl p-2">
              <div className="w-full h-full bg-white rounded-2xl overflow-hidden flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-green-500 rounded-full mx-auto flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">
                      You&apos;re on the list!
                    </h3>
                    <p className="text-sm text-gray-600">
                      We&apos;ll notify you when we launch
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Smart Referral System",
    description:
      "Track referral sources and boost growth with built-in sharing features.",
    styles: "bg-neutral text-neutral-content",
    demo: (
      <div className="text-neutral-content px-6 space-y-4">
        <div className="bg-neutral-content text-neutral rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-sm">Referral Sources</h4>
            <span className="text-xs bg-primary text-primary-content px-2 py-1 rounded">
              Live
            </span>
          </div>

          <div className="space-y-2">
            {[
              { source: "Twitter", count: 89, color: "bg-blue-500" },
              { source: "Direct", count: 156, color: "bg-gray-500" },
              { source: "LinkedIn", count: 43, color: "bg-blue-600" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                <span className="text-sm flex-1">{item.source}</span>
                <span className="text-sm font-medium group-hover:text-primary transition-colors duration-300">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-neutral-content text-neutral rounded-lg p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="text-center space-y-2">
            <p className="text-sm font-medium">Share your waitlist</p>
            <div className="flex gap-2 justify-center">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">T</span>
              </div>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">L</span>
              </div>
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">W</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
];

const FeaturesGrid = () => {
  return (
    <section className="flex justify-center items-center w-full bg-base-100 text-base-content py-20 lg:py-32">
      <div className="flex flex-col max-w-[82rem] gap-16 md:gap-20 px-4">
        <h2 className="max-w-3xl font-black text-4xl md:text-6xl tracking-[-0.01em]">
          Build products that{" "}
          <span className="underline decoration-dashed underline-offset-8 decoration-base-300">
            people actually want
          </span>
        </h2>
        <div className="flex flex-col w-full h-fit gap-4 lg:gap-10 text-text-default max-w-[82rem]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-10">
            {features.map((feature) => (
              <div
                key={feature.title}
                className={`${feature.styles} rounded-3xl flex flex-col gap-6 w-full h-[22rem] lg:h-[25rem] pt-6 overflow-hidden group`}
              >
                <div className="px-6 space-y-2">
                  <h3 className="font-bold text-xl lg:text-3xl tracking-tight">
                    {feature.title}
                  </h3>
                  <p className="opacity-80">{feature.description}</p>
                </div>
                {feature.demo}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesGrid;
