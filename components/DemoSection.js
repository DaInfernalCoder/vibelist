const DemoSection = () => {
  return (
    <section className="bg-base-100" id="demo">
      <div className="max-w-7xl mx-auto px-8 py-16 lg:py-24">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="font-extrabold text-3xl lg:text-5xl tracking-tight mb-6">
            See It In Action
          </h2>
          <p className="text-lg opacity-80 leading-relaxed max-w-3xl mx-auto">
            No BS, we&apos;re going to show you how easy this is to use. From
            setup to validating your product in just a few clicks. <br /> <br />{" "}
            Just keep clicking the forward arrow to get a live demo
          </p>
        </div>

        {/* Demo Container */}
        <div className="relative max-w-5xl mx-auto">
          {/* Decorative background elements */}
          <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 rounded-3xl blur-xl opacity-30"></div>

          {/* Main demo container */}
          <div
            style={{
              position: "relative",
              boxSizing: "content-box",
              maxHeight: "80vh",
              width: "100%",
              aspectRatio: "1.6723549488054608",
              padding: "40px 0 40px 0",
            }}
          >
            <iframe
              src="https://app.supademo.com/embed/cmb845e2a5jitppkp6kzlet8h?embed_v=2"
              loading="lazy"
              title="Supademo Demo"
              allow="clipboard-write"
              frameBorder="0"
              webkitallowfullscreen="true"
              mozallowfullscreen="true"
              allowFullScreen
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
              }}
            ></iframe>
          </div>

          {/* Bottom accent */}
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-primary via-secondary to-accent rounded-full opacity-60"></div>
        </div>
      </div>
    </section>
  );
};

export default DemoSection;
