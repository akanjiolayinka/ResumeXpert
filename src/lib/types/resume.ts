import type { Database } from "@/lib/database.types";

type DbResume = Database["public"]["Tables"]["resumes"]["Row"];

// Wrapper around the generated row type that adds parse_failed (introduced
// by migration 0002 in Fi2). Once src/lib/database.types.ts is regenerated
// from the live schema, parse_failed will appear on the generated Row and
// this wrapper becomes redundant — it can collapse to a re-export.
export type Resume = DbResume & {
  parse_failed: boolean;
};
