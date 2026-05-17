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
import Navbar from "@/components/Navbar";

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
    title: "Design workflow with nodes",
    description:
      "Drag and drop nodes to define each step, including AI processing, API calls, and conditions.",
  },
  {
    title: "Preview in chat",
    description:
      "Run your agent in the chat preview to validate responses and tune logic before publishing.",
  },
  {
    title: "Publish and integrate",
    description:
      "Publish the agent to generate an SDK, then connect it to your external product or service.",
  },
];

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-no-repeat md:bg-cover bg-contain text-foreground overflow-x-hidden bg-gradient-to-br from-transparent via-[#8b5cf6]/5 to-transparent dark:from-transparent dark:via-[#8b5cf6]/10 dark:to-transparent">
      <div className="absolute top-0 inset-0 bg-[url('/blur-bg.png')] dark:bg-[url('/blur-bg.jpg')] bg-[center] bg-no-repeat bg-cover pointer-events-none"></div>
      <header className="py-10 relative z-10">
        <Navbar />
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8 relative  z-5">
        <section className="mx-auto max-w-3xl text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-[#8b5cf6]/30 bg-[#8b5cf6]/10 px-3 py-1 text-xs text-[#6d28d9] dark:text-[#d8b4fe]">
            <Bot className="size-3.5 text-[#8b5cf6] dark:text-[#b393fe]" />
            AI Agent Builder
          </div>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Empower Your <span className="text-[#8b5cf6]">Ideas with</span> Intelligent Agents. No Code, Just Pure AI.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
            AgentStudio helps you design agent workflows with drag-and-drop nodes,
            preview behavior in chat, and publish ready-to-use SDKs for external integration.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="bg-[#8b5cf6] rounded-full text-white hover:bg-[#7c3aed]">
              <Link href="/dashboard">
                Start Building
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-[#8b5cf6]/30 rounded-full text-[#6d28d9] dark:text-[#d8b4fe] hover:bg-[#8b5cf6]/10 hover:text-[#6d28d9]"
            >
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
              <Card key={feature.title} className="rounded-3xl ring-[0.5px] ring-[#8b5cf6]/10 border-none">
                <CardHeader className="">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <feature.icon className="size-4 text-[#8b5cf6]" />
                    {feature.title}
                  </CardTitle>
                  <CardDescription className="border-none">{feature.description}</CardDescription>
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
            {steps.map((step, index) => (
              <Card key={step.title} className="rounded-3xl ring-[0.5px] ring-[#8b5cf6]/10 border-none">
                <CardHeader>
                  <CardTitle className="text-base"><span className="text-[#8b5cf6] inline-block me-3">{index + 1}.</span> {step.title}</CardTitle>
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
