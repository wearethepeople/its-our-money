import type { WithClassName } from "@/types/ui";
import { cn } from "@/utils/misc";

export function TypographyH1({
  children,
  className,
}: WithClassName<{ children: React.ReactNode }>) {
  return (
    <h1
      className={cn("scroll-m-20 text-4xl font-extrabold tracking-tight text-balance", className)}
    >
      {children}
    </h1>
  );
}

export function TypographyH2({
  children,
  className,
}: WithClassName<{ children: React.ReactNode }>) {
  return (
    <h2
      className={cn("scroll-m-20 pb-2 text-3xl font-semibold tracking-tight first:mt-0", className)}
    >
      {children}
    </h2>
  );
}

export function TypographyH3({
  children,
  className,
}: WithClassName<{ children: React.ReactNode }>) {
  return (
    <h3 className={cn("scroll-m-20 text-2xl font-semibold tracking-tight", className)}>
      {children}
    </h3>
  );
}

export function TypographyH4({
  children,
  className,
}: WithClassName<{ children: React.ReactNode }>) {
  return (
    <h4 className={cn("scroll-m-20 text-xl font-semibold tracking-tight", className)}>
      {children}
    </h4>
  );
}

export function TypographyLead({
  children,
  className,
}: WithClassName<{ children: React.ReactNode }>) {
  return <p className={cn("text-xl text-muted-foreground", className)}>{children}</p>;
}

export function TypographyP({ children, className }: WithClassName<{ children: React.ReactNode }>) {
  return <p className={cn("leading-5 not-first:mt-6", className)}>{children}</p>;
}

export function TypographyBlockquote({
  children,
  className,
}: WithClassName<{ children: React.ReactNode }>) {
  return (
    <blockquote className={cn("mt-6 border-l-2 pl-6 italic", className)}>{children}</blockquote>
  );
}
