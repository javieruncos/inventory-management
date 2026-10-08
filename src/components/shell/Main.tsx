import type { ReactNode } from "react";

type MainProps = {
  children: ReactNode;
};

export function Main({ children }: MainProps) {
  return (
    <main id="content" className="min-w-0 flex-1">
      <div className="mx-auto w-full max-w-[1600px] px-4 py-4 md:px-6 md:py-6 desktop:px-8 desktop:py-8">
        {children}
      </div>
    </main>
  );
}
