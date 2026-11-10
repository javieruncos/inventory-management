"use client";

import { useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { buildLoginPath } from "@/lib/auth/redirect";
import { useMe } from "@/lib/queries";
import { promptLogin, type PromptLoginOptions } from "@/lib/sweetAlert";

export type ActionGuardOptions = PromptLoginOptions & {
  nextPath?: string;
};

type ActionGuard = <T>(
  action: () => T | Promise<T>,
  options?: ActionGuardOptions,
) => Promise<T | undefined>;

export function useActionGuard(): {
  isVisitor: boolean;
  guard: ActionGuard;
} {
  const router = useRouter();
  const pathname = usePathname();
  const { data: user } = useMe();
  const isVisitor = user === null;

  const guard: ActionGuard = useCallback(
    async <T,>(
      action: () => T | Promise<T>,
      options?: ActionGuardOptions,
    ): Promise<T | undefined> => {
      if (user) {
        return action();
      }

      if (!isVisitor) {
        return undefined;
      }

      const { nextPath, ...promptOptions } = options ?? {};
      const confirmed = await promptLogin(promptOptions);

      if (confirmed) {
        router.push(buildLoginPath(nextPath ?? pathname));
      }

      return undefined;
    },
    [isVisitor, pathname, router, user],
  );

  return { isVisitor, guard };
}
