import type { ReactNode } from "react";

type MainProps = {
  children: ReactNode;
};

export function Main({ children }: MainProps) {
  return (
    <main id="content" className="min-w-0 flex-1">
      <div className="mx-auto w-full max-w-[1600px] px-6 py-6 max-[767px]:px-4 max-[767px]:py-4 desktop:px-8 desktop:py-8">
        {children}
      </div>
    </main>
  );
}
