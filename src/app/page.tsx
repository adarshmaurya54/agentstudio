import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Bot, Code2, MessageSquare, Workflow } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const features = [
  {
    title: "Visual Agent Builder",
    description:
      "Create AI agents with a clean workflow interface instead of writing orchestration code from scratch.",
    icon: Workflow,
  },
  {
    title: "Chat Preview Testing",
    description:
      "Test your agent behavior in a built-in chat interface before publishing anything externally.",
    icon: MessageSquare,
  },
  {
    title: "Publish SDK",
    description:
      "Publish your finished agent and generate an SDK for smooth integration into external apps.",
    icon: Code2,
  },
];

const steps = [
  {
    title: "1. Design workflow with nodes",
    description:
      "Drag and drop nodes to define each step, including AI processing, API calls, and conditions.",
  },
  {
    title: "2. Preview in chat",
    description:
      "Run your agent in the chat preview to validate responses and tune logic before publishing.",
  },
  {
    title: "3. Publish and integrate",
    description:
      "Publish the agent to generate an SDK, then connect it to your external product or service.",
  },
];

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <header className="border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.svg" alt="AgentStudio logo" width={30} height={30} />
            <span className="text-sm font-semibold sm:text-base">AgentStudio</span>
          </Link>
          <Button asChild size="sm">
            <Link href="/dashboard">
              Get Started
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-3xl text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
            <Bot className="size-3.5" />
            AI Agent Builder
          </div>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Build AI agents visually and publish them as SDK-powered integrations
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            AgentStudio helps you design agent workflows with drag-and-drop nodes,
            preview behavior in chat, and publish ready-to-use SDKs for external integration.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/dashboard">
                Start Building
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="#how-it-works">How It Works</Link>
            </Button>
          </div>
        </section>

        <section id="features" className="mt-16">
          <h2 className="text-2xl font-semibold tracking-tight">Features</h2>
          <p className="mt-2 text-muted-foreground">
            Everything you need to build professional AI agent experiences.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="border-border/70 bg-card/80">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <feature.icon className="size-4 text-muted-foreground" />
                    {feature.title}
                  </CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="mt-16">
          <h2 className="text-2xl font-semibold tracking-tight">How It Works</h2>
          <p className="mt-2 text-muted-foreground">
            A simple three-step path from workflow design to SDK integration.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {steps.map((step) => (
              <Card key={step.title} className="border-border/70">
                <CardHeader>
                  <CardTitle className="text-base">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
