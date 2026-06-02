"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { fadeUp, stagger } from "@/lib/motion";
import { looptiltApi } from "@/lib/looptilt-api";
import type { NewsletterSummary } from "@/lib/types/looptilt";

export default function NewslettersPage() {
  const [newsletters, setNewsletters] = useState<NewsletterSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const load = () => {
    setLoading(true);
    looptiltApi
      .listNewsletters()
      .then(setNewsletters)
      .catch(() => undefined)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setError(null);
    try {
      await looptiltApi.createNewsletter({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      setName("");
      setDescription("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create newsletter");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Newsletters</h1>
        <p className="mt-1.5 text-muted-foreground">
          Each workspace holds an archive, fingerprint, segments, blocks, and sends.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>New newsletter</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              {error && (
                <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="The Growth Brief" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this newsletter about?"
                />
              </div>
              <Button type="submit" className="w-full" disabled={creating || !name.trim()}>
                {creating ? "Creating..." : "Create workspace"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : newsletters.length === 0 ? (
            <EmptyState title="No newsletters yet" description="Create one to start building your fingerprint." />
          ) : (
            <motion.div
              variants={stagger(0.05)}
              initial="hidden"
              animate="visible"
              className="grid gap-4 sm:grid-cols-2"
            >
              {newsletters.map((n) => (
                <motion.div key={n.id} variants={fadeUp} whileHover={{ y: -2 }}>
                  <Link href={`/dashboard/newsletters/${n.id}`}>
                    <Card className="h-full p-5 transition-colors hover:border-foreground/30">
                      <p className="font-medium">{n.name}</p>
                      {n.description && (
                        <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{n.description}</p>
                      )}
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Badge variant="outline">{n._count.archive} issues</Badge>
                        <Badge variant={n.fingerprint?.status === "READY" ? "success" : "outline"}>
                          {(n.fingerprint?.status ?? "pending").toLowerCase()}
                        </Badge>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
