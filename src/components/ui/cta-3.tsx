import { ArrowRightIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CallToAction() {
  return (
    <section className="relative overflow-hidden py-32">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px]" />
      <div className="absolute top-1/4 right-1/4 w-2 h-2 rounded-full bg-primary/40 animate-pulse" />
      <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 rounded-full bg-accent/40 animate-pulse delay-700" />
      <div className="absolute top-1/3 left-1/4 w-1 h-1 rounded-full bg-primary/30 animate-pulse delay-1000" />

      {/* Decorative plus icons */}
      <PlusIcon className="absolute top-12 left-[15%] text-muted-foreground/20 w-5 h-5" />
      <PlusIcon className="absolute bottom-16 right-[20%] text-muted-foreground/20 w-4 h-4" />

      {/* Grid lines */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(hsl(var(--muted-foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--muted-foreground)) 1px, transparent 1px)`,
        backgroundSize: '80px 80px'
      }} />

      <div className="relative z-10 container mx-auto px-6 text-center">
        <div className="max-w-2xl mx-auto space-y-8">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground leading-tight">
            Let your plans shape the future.
          </h2>

          <p className="text-lg text-muted-foreground max-w-lg mx-auto">
            Start your free trial today. No credit card required.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
          <Button variant="outline" size="lg" className="rounded-full border-border text-foreground hover:bg-secondary">
            Contact Sales
          </Button>
          <Button size="lg" className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
            Get Started <ArrowRightIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
