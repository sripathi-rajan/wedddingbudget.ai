import HeroSection from "@/components/HeroSection";

export default function Home() {
  return (
    <main className="font-[family-name:var(--font-geist-sans)]">
      <HeroSection />
      {/* Some extra content to test scrolling down past the 150vh hero section */}
      <section className="h-screen bg-dark-800 flex items-center justify-center border-t border-champagne/10">
        <h2 className="text-3xl font-serif text-ivory/80 italic">Discover The Excellence</h2>
      </section>
      <section className="h-screen bg-dark-900 flex items-center justify-center border-t border-champagne/10">
        <h2 className="text-3xl font-serif text-ivory/80 italic">Curated Memories</h2>
      </section>
    </main>
  );
}
