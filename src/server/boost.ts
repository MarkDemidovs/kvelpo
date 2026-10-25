import type Stripe from "stripe";
import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { boostPurchases, projects } from "~/server/db/schema";
import { BOOST_OPTIONS, isBoostDays } from "~/lib/pricing";

const DAY_MS = 24 * 60 * 60 * 1000;

/** True when a project is currently boosted. */
export function isBoosted(boostedUntil: Date | string | null | undefined, now: Date = new Date()): boolean {
  if (!boostedUntil) return false;
  return new Date(boostedUntil).getTime() > now.getTime();
}

export type BoostResult =
  | { applied: true; projectId: number; boostedUntil: Date }
  | { applied: false; reason: "not_boost" | "not_paid" | "already_applied" | "project_missing" };

/**
 * Turns a paid Boost Checkout session into a boost on the project. Safe to call
 * any number of times for the same session (the success redirect and the webhook
 * both do): the unique `stripeSessionId` row makes only the first call count.
 * A project that is already boosted gets the new days added after the current one.
 */
export async function applyBoostFromSession(session: Stripe.Checkout.Session): Promise<BoostResult> {
  if (session.mode !== "payment" || session.metadata?.type !== "boost") {
    return { applied: false, reason: "not_boost" };
  }
  if (session.payment_status !== "paid") {
    return { applied: false, reason: "not_paid" };
  }

  const userId = session.metadata.userId;
  const projectId = Number(session.metadata.projectId);
  if (!userId || !Number.isInteger(projectId)) {
    return { applied: false, reason: "project_missing" };
  }

  // Older sessions carry no length: they were the 7-day Boost.
  const requestedDays = Number(session.metadata.days);
  const days = isBoostDays(requestedDays) ? requestedDays : BOOST_OPTIONS[0].days;

  return db.transaction(async (tx) => {
    const [project] = await tx
      .select({ id: projects.id, clerkUserId: projects.clerkUserId, boostedUntil: projects.boostedUntil })
      .from(projects)
      .where(eq(projects.id, projectId))
      .for("update");

    // The buyer must still own the project they paid to boost.
    if (project?.clerkUserId !== userId) {
      return { applied: false, reason: "project_missing" } as const;
    }

    const now = new Date();
    const base = project.boostedUntil !== null && project.boostedUntil > now ? project.boostedUntil : now;
    const boostedUntil = new Date(base.getTime() + days * DAY_MS);

    const inserted = await tx
      .insert(boostPurchases)
      .values({
        stripeSessionId: session.id,
        projectId,
        clerkUserId: userId,
        amountTotal: session.amount_total,
        currency: session.currency,
        boostedUntil,
      })
      .onConflictDoNothing({ target: boostPurchases.stripeSessionId })
      .returning({ id: boostPurchases.id });

    if (inserted.length === 0) {
      return { applied: false, reason: "already_applied" } as const;
    }

    await tx.update(projects).set({ boostedUntil }).where(eq(projects.id, projectId));
    return { applied: true, projectId, boostedUntil } as const;
  });
}
