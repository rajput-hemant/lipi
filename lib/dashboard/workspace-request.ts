import { cache } from "react";

import { getDocuments } from "@/lib/db/actions/document";
import { getWorkspaceMembershipRole } from "@/lib/db/data/mutation-auth";

// Per-request dedupe for the workspace layout and page, which render together.
// Each request still runs the membership check once; nothing is shared across
// requests, so a removed member is rejected on their next navigation.
export const getRequestMembership = cache(getWorkspaceMembershipRole);
export const getRequestDocuments = cache(getDocuments);
