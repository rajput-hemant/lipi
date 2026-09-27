CREATE UNIQUE INDEX "lipi_workspace_invites_workspace_id_email_unique" ON "lipi_workspace_invites" USING btree ("workspace_id","email");
