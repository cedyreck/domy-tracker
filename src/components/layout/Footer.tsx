import { Heart } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="border-t border-border/50 bg-background/80 backdrop-blur-sm mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            Made with <Heart className="h-4 w-4 text-primary fill-primary" /> Lovable
          </span>
          <span className="hidden sm:inline">•</span>
          <span>© {new Date().getFullYear()} Cedyreck</span>
        </div>
      </div>
    </footer>
  );
};
